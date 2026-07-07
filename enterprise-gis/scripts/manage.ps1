param(
  [Parameter(Mandatory = $true)][ValidateSet('start','stop','status','logs','validate','backup','restore','sql','import')][string]$Action,
  [string]$Target,
  [string]$Sql
)

$ErrorActionPreference = 'Stop'
$Stack = Split-Path -Parent $PSScriptRoot
$Compose = Join-Path $Stack 'docker-compose.yml'
$EnvFile = Join-Path $Stack '.env'
if (-not (Test-Path $EnvFile)) { throw "Create $EnvFile from .env.example before operating the stack." }
Get-Content $EnvFile | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  Set-Item -Path "Env:$name" -Value $value
}

switch ($Action) {
  'start' { docker compose --env-file $EnvFile -f $Compose up -d --build }
  'stop' { docker compose --env-file $EnvFile -f $Compose down }
  'status' { docker compose --env-file $EnvFile -f $Compose ps }
  'logs' { docker compose --env-file $EnvFile -f $Compose logs --tail 200 $Target }
  'validate' { docker compose --env-file $EnvFile -f $Compose config --quiet; docker compose --env-file $EnvFile -f $Compose exec postgis psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB -c "SELECT postgis_full_version();" }
  'backup' { & (Join-Path $PSScriptRoot 'backup.ps1') }
  'restore' { & (Join-Path $PSScriptRoot 'restore.ps1') -BackupFile $Target }
  'sql' { docker compose --env-file $EnvFile -f $Compose exec postgis psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB -c $Sql }
  'import' { docker compose --env-file $EnvFile -f $Compose exec catalog-api node import.mjs }
}
