# Generate Cryptographic Material for MedInsight Fabric Network
# Windows PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Generating Crypto Material" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set paths
$FABRIC_NETWORK_DIR = $PSScriptRoot | Split-Path -Parent
$BIN_DIR = Join-Path $FABRIC_NETWORK_DIR "bin"
$CRYPTOGEN = Join-Path $BIN_DIR "cryptogen.exe"

# Check if cryptogen exists
if (-not (Test-Path $CRYPTOGEN)) {
    Write-Host "Error: cryptogen not found at $CRYPTOGEN" -ForegroundColor Red
    Write-Host "Please run install-fabric-binaries.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Remove existing crypto material
$CRYPTO_DIR = Join-Path $FABRIC_NETWORK_DIR "crypto-config"
if (Test-Path $CRYPTO_DIR) {
    Write-Host "Removing existing crypto-config directory..." -ForegroundColor Yellow
    Remove-Item -Path $CRYPTO_DIR -Recurse -Force
}

# Generate crypto material
Write-Host "Generating crypto material using cryptogen..." -ForegroundColor Yellow
Set-Location $FABRIC_NETWORK_DIR

& $CRYPTOGEN generate --config=".\crypto-config.yaml"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to generate crypto material" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Crypto Material Generated Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Patch config.yaml for Docker (Linux) compatibility - replace backslashes with forward slashes
Write-Host "Patching config.yaml files for Linux compatibility..." -ForegroundColor Yellow
Get-ChildItem -Path $CRYPTO_DIR -Filter "config.yaml" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace 'cacerts\\', 'cacerts/' | Set-Content $_.FullName
}
Write-Host "Patching complete." -ForegroundColor Green
Write-Host ""

# List generated organizations
Write-Host "Generated Organizations:" -ForegroundColor Yellow
Get-ChildItem -Path (Join-Path $CRYPTO_DIR "peerOrganizations") -Directory | ForEach-Object {
    Write-Host "  [OK] $($_.Name)" -ForegroundColor Green
}
Get-ChildItem -Path (Join-Path $CRYPTO_DIR "ordererOrganizations") -Directory | ForEach-Object {
    Write-Host "  * $($_.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
