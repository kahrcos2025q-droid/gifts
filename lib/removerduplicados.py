import json

# Caminho do arquivo
arquivo_entrada = "crowns-data.json"
arquivo_saida = "crowns-data.json"

# Carregar JSON
with open(arquivo_entrada, "r", encoding="utf-8") as f:
    dados = json.load(f)

ids_vistos = set()
itens_unicos = []
duplicados = 0

for item in dados:
    item_id = item.get("id")

    if item_id in ids_vistos:
        duplicados += 1
    else:
        ids_vistos.add(item_id)
        itens_unicos.append(item)

# Salvar novo arquivo sem duplicados
with open(arquivo_saida, "w", encoding="utf-8") as f:
    json.dump(itens_unicos, f, ensure_ascii=False, indent=2)

print(f"Total original: {len(dados)}")
print(f"Total após limpeza: {len(itens_unicos)}")
print(f"Duplicados removidos: {duplicados}")
