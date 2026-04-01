import json
import shutil

arquivo = "items-data.json"
backup = "backup_seu_arquivo.json"

# Cria backup
shutil.copy(arquivo, backup)

# Lê o JSON
with open(arquivo, "r", encoding="utf-8") as f:
    data = json.load(f)

# Filtra
filtrado = [item for item in data if item.get("categoria") != "Pacotes"]

# Salva
with open(arquivo, "w", encoding="utf-8") as f:
    json.dump(filtrado, f, ensure_ascii=False, indent=4)

print("Itens removidos e backup criado!")