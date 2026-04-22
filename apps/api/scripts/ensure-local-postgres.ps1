# One-shot local DB bootstrap for Orbiton (Windows / PostgreSQL).
# Requires: PostgreSQL client tools (psql, createdb) — default path matches PostgreSQL 18.
#
# Application role: orbiton_user (password: password). Database name: orbiton.
#
# Usage (PowerShell, from repo root):
#   $env:POSTGRES_SUPERUSER_PASSWORD = '<your-postgres-superuser-password>'
#   npm run db:setup-local --workspace @orbiton/api
#
# Optional:
#   $env:POSTGRES_PGBIN = 'C:\Program Files\PostgreSQL\18\bin'
#   $env:POSTGRES_HOST = '127.0.0.1'
#   $env:POSTGRES_PORT = '5432'

$ErrorActionPreference = "Stop"

$appRole = "orbiton_user"
$appDb = "orbiton"

$pgBin = $env:POSTGRES_PGBIN
if (-not $pgBin) {
  $pgBin = "C:\Program Files\PostgreSQL\18\bin"
}
$psql = Join-Path $pgBin "psql.exe"
$createdb = Join-Path $pgBin "createdb.exe"

if (-not (Test-Path $psql)) {
  Write-Error "psql.exe not found at $psql. Install PostgreSQL client tools or set POSTGRES_PGBIN."
  exit 1
}

$superPw = $env:POSTGRES_SUPERUSER_PASSWORD
if (-not $superPw) {
  Write-Error "Set POSTGRES_SUPERUSER_PASSWORD to the postgres superuser password, then re-run."
  exit 1
}

$hostName = $env:POSTGRES_HOST
if (-not $hostName) { $hostName = "127.0.0.1" }
$port = $env:POSTGRES_PORT
if (-not $port) { $port = "5432" }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$roleSql = Join-Path $repoRoot "infrastructure\db\postgres\000_ensure_orbiton_user_role.sql"
$schemaSql = Join-Path $repoRoot "infrastructure\db\postgres\001_initial_schema.sql"
$ownerSql = Join-Path $repoRoot "infrastructure\db\postgres\002_transfer_public_ddl_to_orbiton_user.sql"

if (-not (Test-Path $roleSql)) { Write-Error "Missing $roleSql"; exit 1 }
if (-not (Test-Path $schemaSql)) { Write-Error "Missing $schemaSql"; exit 1 }
if (-not (Test-Path $ownerSql)) { Write-Error "Missing $ownerSql"; exit 1 }

$env:PGPASSWORD = $superPw

Write-Host "Ensuring role $appRole (password: password)..."
& $psql -h $hostName -p $port -U postgres -d postgres -v ON_ERROR_STOP=1 -f $roleSql

Write-Host "Ensuring database $appDb..."
$dbExists = (& $psql -h $hostName -p $port -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$appDb'").Trim()
if ($dbExists -ne "1") {
  if (-not (Test-Path $createdb)) {
    Write-Error "createdb.exe not found at $createdb"
    exit 1
  }
  & $createdb -h $hostName -p $port -U postgres -O $appRole $appDb
}

Write-Host "Ensuring database owner is $appRole..."
& $psql -h $hostName -p $port -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE $appDb OWNER TO $appRole;"

Write-Host "Applying initial schema as superuser (extensions + DDL)..."
& $psql -h $hostName -p $port -U postgres -d $appDb -v ON_ERROR_STOP=1 -f $schemaSql

Write-Host "Transferring public schema object ownership to $appRole (replaces REASSIGN OWNED for app tables)..."
& $psql -h $hostName -p $port -U postgres -d $appDb -v ON_ERROR_STOP=1 -f $ownerSql

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "Verifying $appRole login..."
$env:PGPASSWORD = "password"
& $psql -h $hostName -p $port -U $appRole -d $appDb -v ON_ERROR_STOP=1 -c "SELECT current_user, current_database();"
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "Seeding default auth users..."
Push-Location (Join-Path $repoRoot "apps\api")
npm run seed:auth
Pop-Location

Write-Host "Done. Use POSTGRES_URL=postgres://${appRole}:password@${hostName}:${port}/$appDb in apps/api/.env"
