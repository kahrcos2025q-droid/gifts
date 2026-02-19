import json

arquivo1 = "itemsav.json"
arquivo2 = "items-data.json"

# carregar json
with open(arquivo1, "r", encoding="utf-8") as f:
    dados1 = json.load(f)

try:
    with open(arquivo2, "r", encoding="utf-8") as f:
        dados2 = json.load(f)
except FileNotFoundError:
    dados2 = []

# criar índice por ID
index_arquivo2 = {item["id"]: item for item in dados2}

adicionados = 0
substituidos = 0
ignorados = 0

for item in dados1:
    if item.get("subcategoria") == "Ocultos":
        item_id = item["id"]

        if item_id not in index_arquivo2:
            dados2.append(item)
            adicionados += 1

        else:
            if index_arquivo2[item_id].get("subcategoria") != "Ocultos":
                for i, obj in enumerate(dados2):
                    if obj["id"] == item_id:
                        dados2[i] = item
                        substituidos += 1
                        break
            else:
                ignorados += 1

# salvar arquivo atualizado
with open(arquivo2, "w", encoding="utf-8") as f:
    json.dump(dados2, f, ensure_ascii=False, indent=2)

total_modificados = adicionados + substituidos

print("\n===== RESULTADO =====")
print(f"Adicionados: {adicionados}")
print(f"Substituídos: {substituidos}")
print(f"Ignorados (já ocultos): {ignorados}")
print(f"Total modificados: {total_modificados}")
print("=====================")