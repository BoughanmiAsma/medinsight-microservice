# Register Patient Application Identities for PatientOrg
# PowerShell script

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Generating Patient Wallet" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$WALLET_DIR = "c:\Users\amani\Desktop\MedInsight\fabric-network\wallets\patient"

# 1. Créer le dossier local
if (!(Test-Path $WALLET_DIR)) {
    New-Item -ItemType Directory -Force -Path $WALLET_DIR
    Write-Host "Created local wallet directory: $WALLET_DIR" -ForegroundColor Gray
}

# 2. Enroler l'Admin de PatientOrg pour obtenir les certificats de base
Write-Host "Enrolling PatientOrg Admin..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com fabric-ca-client enroll -u http://admin:adminpw@ca.patient.medinsight.com:10054

# 3. Enregistrer l'utilisateur applicatif
Write-Host "Registering patientAppUser..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com fabric-ca-client register --id.name patientAppUser --id.secret patientpw --id.type client --id.affiliation patient -u http://admin:adminpw@ca.patient.medinsight.com:10054

# 4. Enroler l'utilisateur applicatif
Write-Host "Enrolling patientAppUser..." -ForegroundColor Yellow
docker exec ca.patient.medinsight.com fabric-ca-client enroll -u http://patientAppUser:patientpw@ca.patient.medinsight.com:10054 -M /tmp/patientAppUser/msp

# 5. Créer l'arborescence dans le conteneur pour le dossier patientAppUser
docker exec ca.patient.medinsight.com mkdir -p /tmp/patientAppUser/msp/user

# 6. Copier les fichiers vers l'hôte
# On utilise docker cp pour ramener les fichiers du conteneur vers le Windows
Write-Host "Copying certificates to local wallet..." -ForegroundColor Yellow
if (Test-Path "$WALLET_DIR\patientAppUser") { Remove-Item -Recurse -Force "$WALLET_DIR\patientAppUser" }
New-Item -ItemType Directory -Force -Path "$WALLET_DIR\patientAppUser"

docker cp ca.patient.medinsight.com:/tmp/patientAppUser/msp "$WALLET_DIR\patientAppUser\"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Patient Wallet Created Successfully!" -ForegroundColor Green
Write-Host "Location: $WALLET_DIR" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
