import json

ARQUIVO_ENTRADA = "avakin_itens_coins_presenteaveis.json"
ARQUIVO_SAIDA = "itens_sem_pacotes.json"

# Lê o JSON
with open(ARQUIVO_ENTRADA, "r", encoding="utf-8") as f:
    itens = json.load(f)

# Remove todos os itens da categoria "Pacotes"
itens_filtrados = [
    item for item in itens
    if item.get("category") != "Pacotes"
]

# Salva o novo JSON
with open(ARQUIVO_SAIDA, "w", encoding="utf-8") as f:
    json.dump(itens_filtrados, f, ensure_ascii=False, indent=4)

print(f"Total original: {len(itens)}")
print(f"Removidos: {len(itens) - len(itens_filtrados)}")
print(f"Restantes: {len(itens_filtrados)}")
print(f"Arquivo salvo em: {ARQUIVO_SAIDA}")
