# Convert Fabric CA Client Wallets to Java SDK Format
# This script reads MSP certificates and keys and creates .id files for Java SDK

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Converting Wallets to Java SDK Format" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$FABRIC_NETWORK_DIR = $PSScriptRoot | Split-Path -Parent
$WALLETS_DIR = Join-Path $FABRIC_NETWORK_DIR "wallets"

function Convert-WalletIdentity {
    param (
        [string]$OrgName,
        [string]$UserName,
        [string]$MspId
    )
    
    Write-Host "Processing $OrgName/$UserName..." -ForegroundColor Yellow
    
    $userDir = Join-Path $WALLETS_DIR "$OrgName\$UserName"
    $mspDir = Join-Path $userDir "msp"
    
    if (-not (Test-Path $mspDir)) {
        Write-Host "  [SKIP] MSP directory not found: $mspDir" -ForegroundColor Red
        return
    }
    
    # Read certificate
    $certPath = Join-Path $mspDir "signcerts\cert.pem"
    if (-not (Test-Path $certPath)) {
        Write-Host "  [ERROR] Certificate not found: $certPath" -ForegroundColor Red
        return
    }
    $certificate = Get-Content $certPath -Raw
    
    # Read private key
    $keyPath = Join-Path $mspDir "keystore\priv_sk"
    if (-not (Test-Path $keyPath)) {
        Write-Host "  [ERROR] Private key not found: $keyPath" -ForegroundColor Red
        return
    }
    $privateKey = Get-Content $keyPath -Raw
    
    # Create identity JSON
    $identity = @{
        credentials = @{
            certificate = $certificate.Trim()
            privateKey  = $privateKey.Trim()
        }
        mspId       = $MspId
        type        = "X.509"
        version     = 1
    }
    
    # Write to .id file
    $idFilePath = Join-Path $userDir "$UserName.id"
    $identity | ConvertTo-Json -Depth 10 | Set-Content $idFilePath -Encoding UTF8
    
    Write-Host "  [OK] Created $idFilePath" -ForegroundColor Green
}

# Convert all identities
Convert-WalletIdentity "doctor" "dossierAppUser" "DoctorOrgMSP"
Convert-WalletIdentity "pharmacy" "pharmacyAppUser" "PharmacyOrgMSP"
Convert-WalletIdentity "lab" "labAppUser" "LabOrgMSP"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Wallet Conversion Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
