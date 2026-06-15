param([Parameter(Mandatory = $true)][string]$BackupFile)
$ErrorActionPreference = 'Stop'
$Resolved = Resolve-Path $BackupFile
$Stack = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Stack '.env'
Get-Content $EnvFile | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object { $name, $value = $_ -split '=', 2; Set-Item -Path "Env:$name" -Value $value }
Get-Content -LiteralPath $Resolved -AsByteStream | docker compose --env-file $EnvFile -f (Join-Path $Stack 'docker-compose.yml') exec -T postgis pg_restore --clean --if-exists -U $env:POSTGRES_USER -d $env:POSTGRES_DB
