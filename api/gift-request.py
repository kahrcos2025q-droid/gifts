import asyncio
import json
import random
import uuid
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Importar logger
from logger import logger
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CONFIGURAÇÕES
# ==========================================
API_URL = "http://127.0.0.1:8000"
AVAKIN_API = "https://api-sni.avkn.co"
LOCAL_API = "http://127.0.0.1:8000"

# Caminhos dos arquivos de dados
BASE_DIR = Path(__file__).parent
DATABASE_FILE = BASE_DIR / "database.json"
ACCOUNTS_FILE = BASE_DIR / "accounts.json"
PROXIES_FILE = BASE_DIR / "proxies.txt"
KEYS_FILE = BASE_DIR / "keys.json"

logger.info("\n" + "="*80)
logger.info("AVAKIN GIFT API - INICIANDO")
logger.info("="*80 + "\n")

# ==========================================
# MODELOS PYDANTIC
# ==========================================
class GiftRequest(BaseModel):
    friend_code: str
    items: List[str]
    key: str  # Adicionado campo de chave

class GiftResponse(BaseModel):
    sucesso: bool
    mensagem: str
    detalhes: dict = {}

class KeyBalanceResponse(BaseModel):
    key: str
    saldo: int
    ativa: bool

# ==========================================
# INICIALIZAR FASTAPI
# ==========================================
app = FastAPI(title="Avakin Gift API", version="2.0.0")

# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

def carregar_database() -> List[dict]:
    """Carrega a lista de itens do database.json"""
    try:
        with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except Exception as e:
        logger.error(f"Erro ao carregar database.json: {e}")
        return []

def carregar_contas() -> List[dict]:
    """Carrega a lista de contas do accounts.json"""
    try:
        with open(ACCOUNTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except Exception as e:
        logger.error(f"Erro ao carregar accounts.json: {e}")
        return []

def salvar_contas(contas: List[dict]) -> None:
    """Salva a lista de contas no accounts.json"""
    try:
        with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(contas, f, indent=4, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erro ao salvar accounts.json: {e}")

def carregar_proxies() -> List[str]:
    """Carrega a lista de proxies do proxies.txt"""
    try:
        with open(PROXIES_FILE, 'r', encoding='utf-8') as f:
            proxies = [line.strip() for line in f if line.strip()]
            return proxies
    except Exception as e:
        logger.error(f"Erro ao carregar proxies.txt: {e}")
        return []

def obter_proxy_aleatorio() -> Optional[str]:
    """Retorna um proxy aleatório da lista"""
    proxies = carregar_proxies()
    return random.choice(proxies) if proxies else None

def buscar_item_por_id(item_id: str) -> Optional[dict]:
    """Busca um item no database.json pelo ID"""
    database = carregar_database()
    for item in database:
        if item["id"] == item_id:
            return item
    return None

def obter_contas_disponiveis() -> List[dict]:
    """
    Retorna todas as contas disponíveis (não bloqueadas) ordenadas por saldo decrescente.
    """
    contas = carregar_contas()
    agora = datetime.now()
    
    contas_disponiveis = []
    for conta in contas:
        if conta.get("bloqueado_ate"):
            bloqueado_ate = datetime.fromisoformat(conta["bloqueado_ate"])
            if agora < bloqueado_ate:
                continue
            else:
                # Desbloquear conta expirada
                conta["bloqueado_ate"] = None
                conta["motivo_bloqueio"] = None
        
        if conta["saldo"] > 0:
            contas_disponiveis.append(conta)
    
    # Ordenar por saldo decrescente (usar as contas com mais saldo primeiro)
    contas_disponiveis.sort(key=lambda c: c["saldo"], reverse=True)
    return contas_disponiveis

def encontrar_conta_para_item(preco_item: int, contas_usadas: List[str] = None) -> Optional[dict]:
    """
    Encontra uma conta com saldo suficiente para um item específico.
    Prioriza contas já utilizadas na sessão para evitar muitos logins.
    """
    contas = obter_contas_disponiveis()
    
    if contas_usadas:
        # Primeiro tenta usar uma conta já logada
        for conta in contas:
            if conta["email"] in contas_usadas and conta["saldo"] >= preco_item:
                return conta
    
    # Se não encontrou conta já usada, busca qualquer uma com saldo suficiente
    for conta in contas:
        if conta["saldo"] >= preco_item:
            return conta
    
    return None

def calcular_saldo_total_disponivel() -> int:
    """Calcula o saldo total de todas as contas disponíveis."""
    contas = obter_contas_disponiveis()
    return sum(conta["saldo"] for conta in contas)

def bloquear_conta(email: str, duracao_horas: int = 24, motivo: str = "GiftResponseError_RateLimitSender") -> None:
    """Bloqueia uma conta por um período especificado"""
    logger.warning(f"Conta bloqueada por {duracao_horas}h: {email}")
    contas = carregar_contas()
    for conta in contas:
        if conta["email"] == email:
            bloqueado_ate = datetime.now() + timedelta(hours=duracao_horas)
            conta["bloqueado_ate"] = bloqueado_ate.isoformat()
            conta["motivo_bloqueio"] = motivo
            break
    salvar_contas(contas)

def atualizar_saldo_conta(email: str, novo_saldo: int) -> None:
    """Atualiza o saldo de uma conta"""
    contas = carregar_contas()
    for conta in contas:
        if conta["email"] == email:
            saldo_anterior = conta["saldo"]
            conta["saldo"] = novo_saldo
            diferenca = novo_saldo - saldo_anterior
            logger.info(f"Saldo atualizado [{email}]: {saldo_anterior} -> {novo_saldo} ({diferenca:+d})")
            break
    salvar_contas(contas)

# ==========================================
# FUNÇÕES DE GERENCIAMENTO DE CHAVES
# ==========================================

def carregar_chaves() -> Dict[str, dict]:
    """Carrega o dicionário de chaves do keys.json"""
    if not KEYS_FILE.exists():
        return {}
    try:
        with open(KEYS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erro ao carregar keys.json: {e}")
        return {}

def salvar_chaves(chaves: Dict[str, dict]) -> None:
    """Salva o dicionário de chaves no keys.json"""
    try:
        with open(KEYS_FILE, 'w', encoding='utf-8') as f:
            json.dump(chaves, f, indent=4, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erro ao salvar keys.json: {e}")

def verificar_chave(key: str) -> Optional[dict]:
    """Verifica se uma chave é válida e retorna seus dados"""
    chaves = carregar_chaves()
    if key in chaves and chaves[key].get("ativa", False):
        return chaves[key]
    return None

def atualizar_saldo_chave(key: str, valor_subtrair: int) -> bool:
    """Subtrai um valor do saldo da chave"""
    chaves = carregar_chaves()
    if key in chaves:
        saldo_atual = chaves[key].get("saldo", 0)
        if saldo_atual >= valor_subtrair:
            chaves[key]["saldo"] = saldo_atual - valor_subtrair
            salvar_chaves(chaves)
            logger.info(f"Saldo da chave {key} atualizado: {saldo_atual} -> {chaves[key]['saldo']} (-{valor_subtrair})")
            return True
    return False

# ==========================================
# FUNÇÃO PRINCIPAL DE ENVIO DE PRESENTES
# ==========================================

def fazer_login(email: str, senha: str, proxy: Optional[str] = None) -> Optional[dict]:
    """Realiza login na API do Avakin."""
    logger.info(f"Login: {email}")
    try:
        uuid_str = str(uuid.uuid4())
        uuid_adv = str(uuid.uuid4())
        
        resp = requests.post(
            f"{LOCAL_API}/start-chat",
            json={"uuid": uuid_str},
            timeout=10
        )
        resp.raise_for_status()
        start_chat_token = resp.json()["x_avkn_start_chat"]
        
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "X-Avkn-ApiVersion": "15",
            "X-Avkn-ClientOS": "GooglePlay",
            "X-Avkn-ClientPlatform": "GooglePlay",
            "X-Avkn-ClientVersion": "2.015.00",
            "X-Avkn-ClientVersionCode": "201500",
            "X-Avkn-AdvertisingID": uuid_adv,
            "X-Avkn-GameSessionID": uuid_str,
            "X-Avkn-VendorID": "d53CaC8BQ-ijeObp2rCh9i",
            "X-Avkn-TZOffset": "-3",
            "X-Avkn-Device": "samsung SM-J500M",
            "User-Agent": "BestHTTP/2 v2.8.5",
            "X-Avkn-Start-Chat": start_chat_token
        }
        
        payload = {
            "type": "email",
            "request": {
                "raw_password": senha,
                "email_address": email
            },
            "consents": {
                "consent.9": True,
                "terms.8": True,
                "age.9": True
            },
            "sys_info": {
                "batteryLevel": 0.01,
                "batteryStatus": "Charging",
                "operatingSystem": "Android OS 9",
                "operatingSystemFamily": "Other",
                "processorType": "ARMv7",
                "processorFrequency": 1209,
                "processorCount": 4,
                "systemMemorySize": 1378,
                "deviceModel": "samsung SM-J500M",
                "supportsAccelerometer": True,
                "supportsGyroscope": False,
                "supportsLocationService": True,
                "supportsVibration": True,
                "supportsAudio": True,
                "deviceType": "Handheld",
                "graphicsMemorySize": 512,
                "graphicsDeviceName": "Adreno (TM) 306",
                "graphicsDeviceVendor": "Qualcomm",
                "graphicsDeviceID": 0,
                "graphicsDeviceVendorID": 0,
                "graphicsDeviceType": "OpenGLES3",
                "graphicsUVStartsAtTop": False,
                "graphicsDeviceVersion": "OpenGL ES 3.0"
            }
        }
        
        proxies_dict = None
        if proxy:
            proxies_dict = {"http": proxy, "https": proxy}
        
        login_resp = requests.post(
            f"{AVAKIN_API}/auth/1/auth/1/login",
            json=payload,
            headers=headers,
            timeout=15,
            proxies=proxies_dict
        )
        login_resp.raise_for_status()
        
        login_json = login_resp.json()
        login_headers = login_resp.headers
        
        user_id = str(login_json["user_id"])
        logger.info(f"Login bem-sucedido!")
        
        return {
            "uuid": uuid_str,
            "uuid_adv": uuid_adv,
            "user_id": user_id,
            "login_token": login_json["login_token"],
            "chat_tag": login_headers.get("X-Avkn-Chat-Tag"),
            "jwt": login_headers.get("X-Avkn-Jwtsession"),
            "session": login_headers.get("X-Avkn-Session"),
            "start_chat_token": start_chat_token
        }
    except Exception as e:
        logger.error(f"Erro ao fazer login: {e}")
        return None

def obter_journey_seg(uuid_str: str, user_id: str) -> Optional[str]:
    """Obtém o token de journey segment"""
    try:
        resp = requests.get(
            f"{LOCAL_API}/journey-seg/{uuid_str}/{user_id}",
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()["x_avkn_journey_seg"]
    except Exception as e:
        logger.error(f"Erro ao obter journey seg: {e}")
        return None

def atualizar_chat_tag(uuid_str: str, chat_tag: str, user_id: str) -> bool:
    """Atualiza o chat tag na API local"""
    try:
        resp = requests.post(
            f"{LOCAL_API}/chat-tag",
            json={
                "uuid": uuid_str,
                "chat_tag": chat_tag,
                "user_id": user_id
            },
            timeout=10
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Erro ao atualizar chat tag: {e}")
        return False

def resolver_friend_code(friend_code: str, session_data: dict, proxy: Optional[str] = None) -> Optional[int]:
    """Resolve um friend code para obter o friend_id"""
    logger.info(f"Resolvendo friend code: {friend_code}")
    try:
        journey_seg = obter_journey_seg(session_data["uuid"], session_data["user_id"])
        
        headers = {
            "X-Avkn-UserID": session_data["user_id"],
            "X-Avkn-ApiVersion": "15",
            "X-Avkn-ClientOS": "GooglePlay",
            "X-Avkn-ClientPlatform": "GooglePlay",
            "X-Avkn-ClientVersion": "2.015.00",
            "X-Avkn-ClientVersionCode": "201500",
            "X-Avkn-AdvertisingID": session_data["uuid_adv"],
            "X-Avkn-GameSessionID": session_data["uuid"],
            "X-Avkn-VendorID": "d53CaC8BQ-ijeObp2rCh9i",
            "X-Avkn-Locale": "pt-PT",
            "X-Avkn-Journey-Seq": journey_seg,
            "X-Avkn-Session": session_data["session"],
            "X-Avkn-JWTSession": session_data["jwt"],
            "User-Agent": "BestHTTP/2 v2.8.5",
            "Content-Type": "application/json; charset=utf-8"
        }
        
        payload = {"friend_code": friend_code}
        
        proxies_dict = None
        if proxy:
            proxies_dict = {"http": proxy, "https": proxy}
        
        resp = requests.post(
            f"{AVAKIN_API}/ext/1/friendcodes/1/resolve",
            headers=headers,
            json=payload,
            timeout=10,
            proxies=proxies_dict
        )
        resp.raise_for_status()
        
        friend_id = int(resp.json()["friend_id"])
        logger.info(f"Friend ID: {friend_id}")
        return friend_id
    except Exception as e:
        logger.error(f"Erro ao resolver friend code: {e}")
        return None

def enviar_presente(item_id: str, friend_id: int, session_data: dict, proxy: Optional[str] = None) -> dict:
    """Envia um presente para um amigo."""
    try:
        journey_seg = obter_journey_seg(session_data["uuid"], session_data["user_id"])
        
        headers = {
            "X-Avkn-UserID": session_data["user_id"],
            "X-Avkn-ApiVersion": "15",
            "X-Avkn-ClientOS": "GooglePlay",
            "X-Avkn-ClientPlatform": "GooglePlay",
            "X-Avkn-ClientVersion": "2.015.00",
            "X-Avkn-ClientVersionCode": "201500",
            "X-Avkn-AdvertisingID": session_data["uuid_adv"],
            "X-Avkn-GameSessionID": session_data["uuid"],
            "X-Avkn-VendorID": "d53CaC8BQ-ijeObp2rCh9i",
            "X-Avkn-Locale": "pt-PT",
            "X-Avkn-Journey-Seq": journey_seg,
            "X-Avkn-Session": session_data["session"],
            "X-Avkn-JWTSession": session_data["jwt"],
            "User-Agent": "BestHTTP/2 v2.8.5",
            "Content-Type": "application/json; charset=utf-8"
        }
        
        payload = {
            "item_id": item_id,
            "friend_id": friend_id,
        }
        
        proxies_dict = None
        if proxy:
            proxies_dict = {"http": proxy, "https": proxy}
        
        resp = requests.post(
            f"{AVAKIN_API}/shop/1/itemshop/1/purchase",
            headers=headers,
            json=payload,
            timeout=10,
            proxies=proxies_dict
        )
        
        status_code = resp.status_code
        headers_resp = resp.headers
        json_resp = resp.json() if resp.text else {}
        
        return {
            "status_code": status_code,
            "headers": dict(headers_resp),
            "json": json_resp,
            "texto": resp.text
        }
    except Exception as e:
        logger.error(f"Erro ao enviar presente: {e}")
        return {
            "status_code": 500,
            "erro": str(e)
        }

# ==========================================
# ENDPOINTS DA API
# ==========================================

@app.get("/api/balance/{key}", response_model=KeyBalanceResponse)
async def consultar_saldo(key: str):
    """Endpoint para consultar o saldo de uma chave."""
    dados_chave = verificar_chave(key)
    if not dados_chave:
        raise HTTPException(status_code=401, detail="Chave invalida ou inativa")
    
    return KeyBalanceResponse(
        key=key,
        saldo=dados_chave["saldo"],
        ativa=dados_chave["ativa"]
    )

@app.post("/api/gift", response_model=GiftResponse)
async def enviar_presentes(request: GiftRequest, background_tasks: BackgroundTasks):
    """
    Endpoint principal para enviar presentes.
    NOVA LOGICA: Usa multiplas contas quando necessario.
    """
    
    logger.info("\n" + "="*80)
    logger.info(f"NOVA REQUISICAO - {len(request.items)} item(ns) para {request.friend_code}")
    logger.info("="*80)
    
    # VERIFICACAO DE CHAVE E SALDO
    dados_chave = verificar_chave(request.key)
    if not dados_chave:
        logger.error(f"Chave invalida ou inativa: {request.key}")
        raise HTTPException(status_code=401, detail="Chave invalida ou inativa")

    # Validar numero de itens
    if len(request.items) > 10:
        logger.error(f"Maximo 10 itens por requisicao")
        raise HTTPException(status_code=400, detail="Maximo 10 itens por requisicao")
    
    if len(request.items) == 0:
        logger.error(f"Minimo 1 item por requisicao")
        raise HTTPException(status_code=400, detail="Minimo 1 item por requisicao")
    
    # Buscar informacoes dos itens
    logger.info(f"Buscando informacoes dos itens...")
    itens_info = []
    preco_total = 0
    
    for item_id in request.items:
        item = buscar_item_por_id(item_id)
        if not item:
            logger.error(f"Item nao encontrado: {item_id}")
            raise HTTPException(status_code=404, detail=f"Item {item_id} nao encontrado")
        itens_info.append(item)
        preco_total += item["preco"]
        logger.info(f"   - {item['nome']} - {item['preco']} coins")
    
    logger.info(f"Preco total: {preco_total} coins\n")
    
    # VERIFICAR SE A CHAVE TEM SALDO SUFICIENTE
    if dados_chave["saldo"] < preco_total:
        logger.error(f"Saldo insuficiente na chave: {dados_chave['saldo']} < {preco_total}")
        raise HTTPException(status_code=402, detail=f"Saldo insuficiente na chave. Saldo atual: {dados_chave['saldo']}")

    # VERIFICAR SE HA SALDO TOTAL SUFICIENTE NAS CONTAS
    saldo_total_contas = calcular_saldo_total_disponivel()
    if saldo_total_contas < preco_total:
        logger.error(f"Saldo insuficiente nas contas: {saldo_total_contas} < {preco_total}")
        return GiftResponse(
            sucesso=False,
            mensagem="Saldo insuficiente nas contas do sistema",
            detalhes={
                "preco_total": preco_total,
                "saldo_disponivel_contas": saldo_total_contas,
                "itens_solicitados": len(request.items)
            }
        )
    
    logger.info(f"Saldo total disponivel nas contas: {saldo_total_contas} coins")
    
    # ==========================================
    # NOVA LOGICA: PROCESSAR ITEM POR ITEM COM MULTIPLAS CONTAS
    # ==========================================
    
    resultados = []
    gasto_real_chave = 0
    contas_utilizadas = {}  # {email: {"session": session_data, "saldo_atual": int, "proxy": str}}
    friend_id = None
    rate_limit_hit = False
    
    for i, item in enumerate(itens_info):
        logger.info(f"\n[{i+1}/{len(itens_info)}] Processando: {item['nome']} ({item['preco']} coins)")
        
        # Verificar se ja atingiu rate limit
        if rate_limit_hit:
            resultados.append({
                "item_id": item["id"],
                "item_nome": item["nome"],
                "preco": item["preco"],
                "status_code": 429,
                "erro": "rate_limit_previous",
                "sucesso": False,
                "mensagem": "Nao processado devido a rate limit anterior"
            })
            continue
        
        # Encontrar conta com saldo suficiente para este item
        # Prioriza contas ja logadas
        conta_email = None
        
        # Primeiro tenta usar uma conta ja logada com saldo suficiente
        for email, dados in contas_utilizadas.items():
            if dados["saldo_atual"] >= item["preco"]:
                conta_email = email
                logger.info(f"   Reutilizando conta ja logada: {email} (saldo: {dados['saldo_atual']})")
                break
        
        # Se nenhuma conta logada tem saldo, busca uma nova
        if not conta_email:
            emails_usados = list(contas_utilizadas.keys())
            conta = encontrar_conta_para_item(item["preco"], emails_usados)
            
            if not conta:
                logger.error(f"   Nenhuma conta com saldo para este item")
                resultados.append({
                    "item_id": item["id"],
                    "item_nome": item["nome"],
                    "preco": item["preco"],
                    "status_code": 402,
                    "erro": "no_account_balance",
                    "sucesso": False,
                    "mensagem": "Nenhuma conta disponivel com saldo suficiente"
                })
                continue
            
            conta_email = conta["email"]
            logger.info(f"   Nova conta selecionada: {conta_email} (saldo: {conta['saldo']})")
            
            # Fazer login na nova conta
            proxy = obter_proxy_aleatorio()
            session_data = fazer_login(conta["email"], conta["senha"], proxy)
            
            if not session_data:
                logger.error(f"   Falha ao fazer login na conta {conta_email}")
                resultados.append({
                    "item_id": item["id"],
                    "item_nome": item["nome"],
                    "preco": item["preco"],
                    "status_code": 500,
                    "erro": "login_failed",
                    "sucesso": False,
                    "mensagem": "Falha ao fazer login"
                })
                continue
            
            # Atualizar chat tag
            if not atualizar_chat_tag(session_data["uuid"], session_data["chat_tag"], session_data["user_id"]):
                logger.error(f"   Falha ao atualizar chat tag")
                resultados.append({
                    "item_id": item["id"],
                    "item_nome": item["nome"],
                    "preco": item["preco"],
                    "status_code": 500,
                    "erro": "chat_tag_failed",
                    "sucesso": False,
                    "mensagem": "Falha ao atualizar chat tag"
                })
                continue
            
            await asyncio.sleep(2)
            
            # Resolver friend code (apenas uma vez)
            if friend_id is None:
                friend_id = resolver_friend_code(request.friend_code, session_data, proxy)
                if not friend_id:
                    logger.error(f"   Falha ao resolver friend code")
                    return GiftResponse(
                        sucesso=False,
                        mensagem="Falha ao resolver friend code",
                        detalhes={"friend_code": request.friend_code}
                    )
            
            # Armazenar dados da conta
            contas_utilizadas[conta_email] = {
                "session": session_data,
                "saldo_atual": conta["saldo"],
                "proxy": proxy
            }
        
        # Obter dados da conta atual
        dados_conta = contas_utilizadas[conta_email]
        
        # Se ainda nao temos friend_id, resolver agora
        if friend_id is None:
            friend_id = resolver_friend_code(request.friend_code, dados_conta["session"], dados_conta["proxy"])
            if not friend_id:
                logger.error(f"   Falha ao resolver friend code")
                return GiftResponse(
                    sucesso=False,
                    mensagem="Falha ao resolver friend code",
                    detalhes={"friend_code": request.friend_code}
                )
        
        # Delay entre envios
        if i > 0:
            await asyncio.sleep(1)
        
        # Enviar presente
        resposta = enviar_presente(item["id"], friend_id, dados_conta["session"], dados_conta["proxy"])
        status_code = resposta.get("status_code", 500)
        json_resp = resposta.get("json", {})
        erro = json_resp.get("error")
        
        resultado_item = {
            "item_id": item["id"],
            "item_nome": item["nome"],
            "preco": item["preco"],
            "status_code": status_code,
            "erro": erro,
            "sucesso": False,
            "conta_utilizada": conta_email
        }
        
        # Processar resposta
        if status_code == 200:
            logger.info(f"   Enviado com sucesso!")
            novo_saldo = json_resp.get("balance", {}).get("coins", dados_conta["saldo_atual"])
            
            # Calcular gasto real
            gasto_item = dados_conta["saldo_atual"] - novo_saldo
            gasto_real_chave += gasto_item
            
            # Atualizar saldo da conta em memoria e no arquivo
            dados_conta["saldo_atual"] = novo_saldo
            atualizar_saldo_conta(conta_email, novo_saldo)
            
            resultado_item["sucesso"] = True
            resultado_item["novo_saldo_conta"] = novo_saldo
            logger.info(f"   Novo saldo da conta: {novo_saldo} coins")
        
        elif status_code == 409:
            logger.info(f"   Item ja possuido pelo destinatario")
            resultado_item["mensagem"] = "Item ja possuido"
            resultado_item["ignorado"] = True
        
        elif status_code == 403:
            erro_header = resposta.get("headers", {}).get("X-Avkn-Error-Localisation", "")
            
            if "GiftResponseError_RateLimitSender" in str(erro) or "GiftResponseError_RateLimitSender" in erro_header:
                logger.error(f"   Rate limit - conta bloqueada por 24h")
                bloquear_conta(conta_email, 24, "GiftResponseError_RateLimitSender")
                resultado_item["mensagem"] = "Conta bloqueada por rate limit (24h)"
                resultado_item["conta_bloqueada"] = True
                
                # Remover conta da lista de utilizadas
                del contas_utilizadas[conta_email]
                
                # Tentar novamente com outra conta
                logger.info(f"   Tentando com outra conta...")
                outra_conta = encontrar_conta_para_item(item["preco"], list(contas_utilizadas.keys()) + [conta_email])
                
                if outra_conta:
                    # Adicionar item de volta para reprocessar
                    # Na verdade, vamos apenas marcar como erro e continuar
                    resultado_item["mensagem"] = "Rate limit - conta bloqueada"
                    rate_limit_hit = True
                else:
                    rate_limit_hit = True
            
            elif "user has not reached level required" in str(erro):
                logger.info(f"   Nivel insuficiente")
                resultado_item["mensagem"] = "Usuario nao atingiu nivel necessario"
                resultado_item["ignorado"] = True
            
            else:
                logger.error(f"   Erro 403: {erro}")
                resultado_item["mensagem"] = str(erro)
        
        elif status_code == 402:
            logger.error(f"   Saldo insuficiente na conta")
            novo_saldo = json_resp.get("balance", {}).get("coins", 0)
            dados_conta["saldo_atual"] = novo_saldo
            atualizar_saldo_conta(conta_email, novo_saldo)
            resultado_item["mensagem"] = "Saldo insuficiente"
            resultado_item["novo_saldo_conta"] = novo_saldo
            
            # Tentar com outra conta
            logger.info(f"   Tentando com outra conta...")
            # O proximo loop vai tentar encontrar outra conta
        
        elif status_code == 400:
            logger.error(f"   Erro 400: {erro}")
            resultado_item["mensagem"] = f"Erro 400: {erro}"
        
        else:
            logger.error(f"   Erro {status_code}")
            resultado_item["mensagem"] = f"Erro desconhecido: {status_code}"
        
        resultados.append(resultado_item)
    
    # SUBTRAIR SALDO DA CHAVE DO USUARIO
    if gasto_real_chave > 0:
        atualizar_saldo_chave(request.key, gasto_real_chave)
    
    # Contar sucessos
    sucessos = sum(1 for r in resultados if r.get("sucesso"))
    
    # Listar contas utilizadas
    contas_usadas_lista = list(contas_utilizadas.keys())
    
    logger.info("\n" + "="*80)
    logger.info(f"RESUMO: {sucessos}/{len(request.items)} presentes enviados")
    logger.info(f"Contas utilizadas: {len(contas_usadas_lista)}")
    logger.info(f"Gasto total da chave: {gasto_real_chave} coins")
    logger.info("="*80 + "\n")
    
    # Verificar se houve rate limit
    if rate_limit_hit:
        return GiftResponse(
            sucesso=False,
            mensagem=f"{sucessos} de {len(request.items)} presentes enviados com sucesso",
            detalhes={
                "error": "GiftResponseError_RateLimitSender",
                "preco_total": preco_total,
                "sucessos": sucessos,
                "total_itens": len(request.items),
                "resultados": resultados,
                "contas_utilizadas": contas_usadas_lista,
                "saldo_chave_restante": carregar_chaves().get(request.key, {}).get("saldo", 0)
            }
        )
    
    return GiftResponse(
        sucesso=sucessos > 0,
        mensagem=f"{sucessos} de {len(request.items)} presentes enviados com sucesso",
        detalhes={
            "preco_total": preco_total,
            "gasto_real": gasto_real_chave,
            "sucessos": sucessos,
            "total_itens": len(request.items),
            "resultados": resultados,
            "contas_utilizadas": contas_usadas_lista,
            "saldo_chave_restante": carregar_chaves().get(request.key, {}).get("saldo", 0)
        }
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor...\n")
    uvicorn.run(app, host="0.0.0.0", port=5555)
