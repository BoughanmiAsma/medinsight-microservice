# Generate Genesis Block and Channel Configuration Transactions
# Windows PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Generating Genesis Block and Channel Artifacts" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set paths
$FABRIC_NETWORK_DIR = $PSScriptRoot | Split-Path -Parent
$BIN_DIR = Join-Path $FABRIC_NETWORK_DIR "bin"
$CONFIGTXGEN = Join-Path $BIN_DIR "configtxgen.exe"

# Check if configtxgen exists
if (-not (Test-Path $CONFIGTXGEN)) {
    Write-Host "Error: configtxgen not found at $CONFIGTXGEN" -ForegroundColor Red
    Write-Host "Please run install-fabric-binaries.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Create channel-artifacts directory
$CHANNEL_ARTIFACTS_DIR = Join-Path $FABRIC_NETWORK_DIR "channel-artifacts"
if (-not (Test-Path $CHANNEL_ARTIFACTS_DIR)) {
    New-Item -ItemType Directory -Path $CHANNEL_ARTIFACTS_DIR | Out-Null
}

# Set the FABRIC_CFG_PATH to current directory
$env:FABRIC_CFG_PATH = $FABRIC_NETWORK_DIR
Set-Location $FABRIC_NETWORK_DIR

Write-Host ""
Write-Host "Generating Genesis Block..." -ForegroundColor Yellow
& $CONFIGTXGEN -profile MedInsightOrdererGenesis -channelID system-channel -outputBlock ".\channel-artifacts\genesis.block"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to generate genesis block" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Generating Channel Configuration Transactions..." -ForegroundColor Yellow

# Canal Consentement (Consent Channel)
Write-Host "- Generating ConsentChannel transaction..." -ForegroundColor Gray
& $CONFIGTXGEN -profile ConsentChannel -outputCreateChannelTx ".\channel-artifacts\consentchannel.tx" -channelID consentchannel

# Canal Dossiers (Records Channel)
Write-Host "- Generating RecordsChannel transaction..." -ForegroundColor Gray
& $CONFIGTXGEN -profile RecordsChannel -outputCreateChannelTx ".\channel-artifacts\recordschannel.tx" -channelID recordschannel

# Canal Ordonnances (Prescriptions Channel)
Write-Host "- Generating PrescriptionsChannel transaction..." -ForegroundColor Gray
& $CONFIGTXGEN -profile PrescriptionsChannel -outputCreateChannelTx ".\channel-artifacts\prescriptionschannel.tx" -channelID prescriptionschannel

Write-Host ""
Write-Host "Generating Anchor Peer Updates..." -ForegroundColor Yellow

# Anchor peer for DoctorOrg
& $CONFIGTXGEN -profile ConsentChannel -outputAnchorPeersUpdate ".\channel-artifacts\DoctorOrgMSPanchors_consent.tx" -channelID consentchannel -asOrg DoctorOrgMSP
& $CONFIGTXGEN -profile RecordsChannel -outputAnchorPeersUpdate ".\channel-artifacts\DoctorOrgMSPanchors_records.tx" -channelID recordschannel -asOrg DoctorOrgMSP
& $CONFIGTXGEN -profile PrescriptionsChannel -outputAnchorPeersUpdate ".\channel-artifacts\DoctorOrgMSPanchors_prescriptions.tx" -channelID prescriptionschannel -asOrg DoctorOrgMSP

# Anchor peer for PharmacyOrg
& $CONFIGTXGEN -profile ConsentChannel -outputAnchorPeersUpdate ".\channel-artifacts\PharmacyOrgMSPanchors_consent.tx" -channelID consentchannel -asOrg PharmacyOrgMSP
& $CONFIGTXGEN -profile RecordsChannel -outputAnchorPeersUpdate ".\channel-artifacts\PharmacyOrgMSPanchors_records.tx" -channelID recordschannel -asOrg PharmacyOrgMSP
& $CONFIGTXGEN -profile PrescriptionsChannel -outputAnchorPeersUpdate ".\channel-artifacts\PharmacyOrgMSPanchors_prescriptions.tx" -channelID prescriptionschannel -asOrg PharmacyOrgMSP

# Anchor peer for LabOrg
& $CONFIGTXGEN -profile ConsentChannel -outputAnchorPeersUpdate ".\channel-artifacts\LabOrgMSPanchors_consent.tx" -channelID consentchannel -asOrg LabOrgMSP
& $CONFIGTXGEN -profile RecordsChannel -outputAnchorPeersUpdate ".\channel-artifacts\LabOrgMSPanchors_records.tx" -channelID recordschannel -asOrg LabOrgMSP
& $CONFIGTXGEN -profile PrescriptionsChannel -outputAnchorPeersUpdate ".\channel-artifacts\LabOrgMSPanchors_prescriptions.tx" -channelID prescriptionschannel -asOrg LabOrgMSP

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Genesis Block and Channel Artifacts Generated Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generated files:" -ForegroundColor Yellow
Get-ChildItem -Path $CHANNEL_ARTIFACTS_DIR | ForEach-Object {
    Write-Host "  [OK] $($_.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

