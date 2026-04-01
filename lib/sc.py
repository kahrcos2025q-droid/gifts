import json
from datetime import datetime, timedelta

ARQUIVO_JSON = "items-data.json"  # nome do seu arquivo

# Data de referência = ontem
agora = datetime.now() - timedelta(days=1)

# Carrega o JSON
with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
    itens = json.load(f)

alterados = 0
pendentes = []

for item in itens:
    data_str = item.get("data_lancamento")

    if not data_str:
        continue

    # Converte string para datetime
    data_lancamento = datetime.strptime(data_str, "%d/%m/%Y %H:%M:%S")

    # Se já passou da data (considerando ontem) e ainda está como nao_lancado
    if data_lancamento <= agora and item.get("nao_lancado") is True:
        item["nao_lancado"] = False
        alterados += 1

    # Se AINDA não foi lançado
    if item.get("nao_lancado") is True:
        dias_faltando = (data_lancamento - agora).days

        pendentes.append({
            "nome": item.get("nome", "SEM NOME"),
            "data_lancamento": data_str,
            "dias_faltando": dias_faltando
        })

# Salva o JSON atualizado
with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
    json.dump(itens, f, ensure_ascii=False, indent=2)

# ===== RELATÓRIO =====
print("===================================")
print(f"✅ Itens liberados agora: {alterados}")
print(f"⏳ Itens AINDA não lançados: {len(pendentes)}")
print("===================================")

if pendentes:
    print("📦 LISTA DE ITENS PENDENTES:\n")
    for p in pendentes:
        print(f"- {p['nome']}")
        print(f"  📅 Data lançamento: {p['data_lancamento']}")
        print(f"  ⏰ Faltam: {p['dias_faltando']} dias")
        print("-----------------------------------")
else:
    print("🎉 Nenhum item pendente! Tudo já foi lançado.")
