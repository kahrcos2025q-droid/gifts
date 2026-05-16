import json
from datetime import datetime, timezone, timedelta

ARQUIVO_JSON = "crowns-data.json"  # Nome do seu arquivo JSON

# Hora atual em UTC
agora_utc = datetime.utcnow().replace(tzinfo=timezone.utc)

# Fuso horário de Brasília (UTC-3) para exibição, se quiser
fuso_brasilia = timezone(timedelta(hours=-3))
agora_brasilia = agora_utc.astimezone(fuso_brasilia)

print(f"⏰ Hora atual (UTC): {agora_utc}")
print(f"⏰ Hora atual (Brasília): {agora_brasilia}")

# Carrega o JSON
with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
    itens = json.load(f)

alterados = 0
pendentes = []

for item in itens:
    data_str = item.get("data_lancamento")
    if not data_str:
        continue

    # Converte string para datetime UTC
    data_lancamento_utc = datetime.strptime(data_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc)

    # Se já passou da data e ainda está como nao_lancado, atualiza
    if data_lancamento_utc <= agora_utc and item.get("nao_lancado") is True:
        item["nao_lancado"] = False
        alterados += 1

    # Se ainda não lançado, calcula dias restantes
    if item.get("nao_lancado") is True:
        dias_faltando = (data_lancamento_utc - agora_utc).days
        pendentes.append({
            "nome": item.get("nome", "SEM NOME"),
            "data_lancamento": data_str,
            "dias_faltando": dias_faltando
        })

# Salva o JSON atualizado
with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
    json.dump(itens, f, ensure_ascii=False, indent=2)

# Relatório
print("===================================")
print(f"✅ Itens liberados agora: {alterados}")
print(f"⏳ Itens ainda não lançados: {len(pendentes)}")
print("===================================")

if pendentes:
    print("📦 Lista de itens pendentes:")
    for p in pendentes:
        print(f"- {p['nome']} | Lançamento: {p['data_lancamento']} | Faltam: {p['dias_faltando']} dias")
else:
    print("🎉 Nenhum item pendente! Tudo já foi lançado.")
