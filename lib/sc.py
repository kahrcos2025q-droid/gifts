import json
from datetime import datetime

ARQUIVO_JSON = "crowns-data.json"  # nome do seu arquivo

# Data atual
agora = datetime.now()

# Carrega o JSON
with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
    itens = json.load(f)

alterados = 0

for item in itens:
    data_str = item.get("data_lancamento")

    if not data_str:
        continue

    # Converte "16/03/2026 21:00:00" para datetime
    data_lancamento = datetime.strptime(data_str, "%d/%m/%Y %H:%M:%S")

    # Se já passou da data e ainda está como nao_lancado = true
    if data_lancamento <= agora and item.get("nao_lancado") is True:
        item["nao_lancado"] = False
        alterados += 1

# Salva o JSON atualizado
with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
    json.dump(itens, f, ensure_ascii=False, indent=2)

print(f"✅ Script finalizado! Itens atualizados: {alterados}")
