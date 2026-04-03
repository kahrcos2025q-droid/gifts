from datetime import datetime, timezone, timedelta

# Data e hora atual em UTC
agora_utc = datetime.utcnow().replace(tzinfo=timezone.utc)
print("🕒 Agora (UTC):", agora_utc)

# Data e hora atual em horário de Brasília (UTC-3)
fuso_brasilia = timezone(timedelta(hours=-3))
agora_brasilia = agora_utc.astimezone(fuso_brasilia)
print("🕒 Agora (Brasília):", agora_brasilia)