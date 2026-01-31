# Sistema de Múltiplas Moedas

## Visão Geral

O site agora suporta duas moedas diferentes: **Avacoins** e **Crowns**. Cada moeda tem seu próprio conjunto de itens, chaves de acesso e contas de envio.

## Arquivos por Moeda

### Avacoins (Moeda Original)
- **Itens**: `/lib/items-data.json`
- **Chaves**: Gerenciadas pela API externa em `keys.json`
- **Sessões/Contas**: Gerenciadas pela API externa em `sessions.json`

### Crowns (Nova Moeda)
- **Itens**: `/lib/crowns-data.json`
- **Chaves**: Gerenciadas pela API externa em `keys-crowns.json`
- **Sessões/Contas**: Gerenciadas pela API externa em `sessions-crowns.json`

## Como Funciona

### 1. Detecção Automática de Moeda

Quando um usuário insere uma chave:
- A API detecta automaticamente o tipo de moeda pela chave
- Chaves que começam com "CROWN" são identificadas como Crowns
- Outras chaves são identificadas como Avacoins
- O site automaticamente troca para mostrar os itens corretos

### 2. Separação de Dados

- Cada moeda tem seus próprios itens no catálogo
- Chaves de Avacoins não podem ser usadas para enviar itens de Crowns
- Chaves de Crowns não podem ser usadas para enviar itens de Avacoins
- O carrinho é limpo automaticamente ao trocar de moeda

### 3. Toggle Manual de Moeda

- Usuários podem alternar manualmente entre Avacoins e Crowns
- Localizado abaixo do campo "Código de Amigo" no header
- Ao trocar, o carrinho é esvaziado para evitar mistura de moedas

## Implementação na API Externa (Python)

A API externa deve:

1. **Detectar o tipo de chave** em `/api/balance/[key]`:
```python
def identificar_tipo_chave(key: str) -> str:
    if key.startswith('CROWN'):
        return 'crowns'
    return 'avacoins'
```

2. **Carregar arquivos corretos** baseado no tipo:
```python
if tipo == 'crowns':
    KEYS_FILE = "keys-crowns.json"
    SESSIONS_FILE = "sessions-crowns.json"
    DATABASE_FILE = "crowns.json"
else:
    KEYS_FILE = "keys.json"
    SESSIONS_FILE = "sessions.json"
    DATABASE_FILE = "database.json"
```

3. **Retornar o tipo na resposta** de balance:
```python
return {
    "key": key,
    "saldo": saldo,
    "ativa": ativa,
    "tipo": tipo  # 'avacoins' ou 'crowns'
}
```

4. **Validar correspondência** em `/api/gift`:
```python
# Detectar tipo da chave
tipo_chave = identificar_tipo_chave(key)

# Verificar se os itens pertencem ao mesmo tipo
for item_id in items:
    item = buscar_item(item_id, tipo_chave)
    if not item:
        return erro("Item não encontrado para este tipo de moeda")
```

## Estrutura dos Arquivos JSON

### keys-crowns.json
```json
{
  "CROWN-KEY-001": {
    "saldo": 50000,
    "ativa": true,
    "tipo": "crowns"
  }
}
```

### sessions-crowns.json
```json
{
  "email@exemplo.com": {
    "email": "email@exemplo.com",
    "session": "token_session",
    "jwt": "token_jwt",
    "user_id": "12345",
    "uuid": "uuid-exemplo",
    "uuid_adv": "uuid-adv-exemplo",
    "saldo": 50000,
    "expira_em": "2027-12-31T23:59:59.000Z",
    "bloqueada": false,
    "tipo": "crowns"
  }
}
```

## Fluxo de Uso

1. Usuário insere uma chave
2. API detecta o tipo (avacoins ou crowns)
3. Site carrega os itens correspondentes
4. Usuário adiciona itens ao carrinho
5. API valida que a chave e os itens são do mesmo tipo
6. Presentes são enviados usando contas do tipo correto

## Segurança

- ✅ Chaves de Avacoins não podem enviar itens de Crowns
- ✅ Chaves de Crowns não podem enviar itens de Avacoins
- ✅ Contas de Avacoins não são usadas para itens de Crowns
- ✅ Contas de Crowns não são usadas para itens de Avacoins
- ✅ Validação em múltiplas camadas (frontend e backend)
