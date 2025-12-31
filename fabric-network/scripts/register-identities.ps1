# Register and Enroll App Users using Fabric CA Client via Docker
# Output: ./wallets/<org>/<user>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Registering App Identities"
Write-Host "=========================================" -ForegroundColor Cyan

# Ensure wallets directory exists
if (-not (Test-Path ".\wallets")) { New-Item -ItemType Directory -Path ".\wallets" | Out-Null }

# Function to process an organization
function Setup-Identity {
    param (
        [string]$ORG_NAME,
        [string]$CA_URL,      # e.g., ca.doctor.medinsight.com:7054
        [string]$ADMIN_USER,
        [string]$ADMIN_PW,
        [string]$APP_USER,
        [string]$APP_PW,
        [string]$MSP_ID
    )

    Write-Host "Processing ${ORG_NAME}..." -ForegroundColor Yellow
    $ORG_DIR = "wallets/${ORG_NAME}"
    
    # Clean previous if exists (optional, but good for fresh start)
    # Remove-Item -Recurse -Force $ORG_DIR -ErrorAction SilentlyContinue 

    # We use a single ephemeral container to do the sequence: Enroll Admin -> Register User -> Enroll User
    # We map the local ./wallets folder to /tmp/wallets inside container
    
    # Command to run inside the container
    # 1. Enroll Admin to get credentials
    # 2. Register new user
    # 3. Enroll new user to generate MSP
    
    $CMD = "
    export FABRIC_CA_CLIENT_HOME=/tmp/wallets/${ORG_NAME}/admin
    mkdir -p /tmp/wallets/${ORG_NAME}/admin
    
    echo '--- Enrolling Admin ---'
    fabric-ca-client enroll -u http://${ADMIN_USER}:${ADMIN_PW}@${CA_URL}
    
    echo '--- Registering User ${APP_USER} ---'
    fabric-ca-client register --id.name ${APP_USER} --id.secret ${APP_PW} --id.type client --url http://${CA_URL}
    
    echo '--- Enrolling User ${APP_USER} ---'
    export FABRIC_CA_CLIENT_HOME=/tmp/wallets/${ORG_NAME}/${APP_USER}
    mkdir -p /tmp/wallets/${ORG_NAME}/${APP_USER}
    fabric-ca-client enroll -u http://${APP_USER}:${APP_PW}@${CA_URL} -M /tmp/wallets/${ORG_NAME}/${APP_USER}/msp
    
    # Organize Key File (Fabric CA generates random key name)
    cd /tmp/wallets/${ORG_NAME}/${APP_USER}/msp/keystore
    mv *_sk priv_sk
    "

    # Convert CMD to single line for Docker
    # Note: We use "medinsight_fabric-net" or just the network name from docker network ls. 
    # Based on compose, it's likely "fabric-network_fabric-net" or similar.
    # Let's assume network is "fabric-network_fabric-net" based on folder name `fabric-network`.
    # Better yet, use the network name defined in compose `fabric-net` -> likely `fabric-network_fabric-net`
    # Remove carriage returns for Linux compatibility
    $CMD = $CMD -replace "`r", ""
    
    # Updated to use the explicit network name found via docker network ls
    docker run --rm --network fabric-net `
        -v ${PWD}/wallets:/tmp/wallets `
        hyperledger/fabric-ca:1.5 `
        /bin/bash -c "${CMD}"
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully created identity for ${APP_USER} in ./wallets/${ORG_NAME}/${APP_USER}" -ForegroundColor Green
    }
    else {
        Write-Error "Failed to setup identity for ${ORG_NAME}"
    }
}

# --- Doctor ---
# CA: ca.doctor.medinsight.com:7054
Setup-Identity "doctor" "ca.doctor.medinsight.com:7054" "admin" "adminpw" "dossierAppUser" "dossierAppPw" "DoctorOrgMSP"

# --- Pharmacy ---
# CA: ca.pharmacy.medinsight.com:8054
Setup-Identity "pharmacy" "ca.pharmacy.medinsight.com:8054" "admin" "adminpw" "pharmacyAppUser" "pharmacyAppPw" "PharmacyOrgMSP"

# --- Lab ---
# CA: ca.lab.medinsight.com:9054
Setup-Identity "lab" "ca.lab.medinsight.com:9054" "admin" "adminpw" "labAppUser" "labAppPw" "LabOrgMSP"

Write-Host "Done!" -ForegroundColor Cyan
