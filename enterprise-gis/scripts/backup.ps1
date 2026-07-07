$ErrorActionPreference = 'Stop'
$Stack = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Stack '.env'
Get-Content $EnvFile | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object { $name, $value = $_ -split '=', 2; Set-Item -Path "Env:$name" -Value $value }
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupDir = Join-Path $Stack 'backups'
New-Item -ItemType Directory -Force $BackupDir | Out-Null
docker compose --env-file $EnvFile -f (Join-Path $Stack 'docker-compose.yml') exec -T postgis pg_dump -Fc -U $env:POSTGRES_USER -d $env:POSTGRES_DB > (Join-Path $BackupDir "uganda-gis-$Stamp.dump")
Get-ChildItem $BackupDir -Filter '*.dump' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force
