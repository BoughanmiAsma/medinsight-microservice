# Deploy all chaincodes to the Fabric network
# PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deploying Chaincodes"
Write-Host "=========================================" -ForegroundColor Cyan

# Chaincode version
$CC_VERSION = "1.0"
$CC_SEQUENCE = 1

# Function to package chaincode
function Package-Chaincode {
    param (
        [string]$CC_NAME,
        [string]$CC_PATH
    )
    
    Write-Host ""
    Write-Host "Packaging ${CC_NAME}..." -ForegroundColor Yellow
    docker exec cli peer lifecycle chaincode package "/opt/gopath/src/github.com/hyperledger/fabric/peer/${CC_NAME}.tar.gz" --path "/opt/gopath/src/github.com/chaincode/${CC_PATH}" --lang golang --label "${CC_NAME}_${CC_VERSION}"
}

# Function to install chaincode on a peer
function Install-Chaincode {
    param (
        [string]$CC_NAME,
        [string]$PEER_ADDRESS,
        [string]$MSP_ID,
        [string]$MSP_PATH
    )
    
    Write-Host "Installing ${CC_NAME} on ${PEER_ADDRESS}..." -ForegroundColor Gray
    docker exec `
        -e CORE_PEER_LOCALMSPID=${MSP_ID} `
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} `
        -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} `
        cli peer lifecycle chaincode install "/opt/gopath/src/github.com/hyperledger/fabric/peer/${CC_NAME}.tar.gz"
}

# Function to approve chaincode for an organization
function Approve-Chaincode {
    param (
        [string]$CC_NAME,
        [string]$CHANNEL_NAME,
        [string]$PEER_ADDRESS,
        [string]$MSP_ID,
        [string]$MSP_PATH,
        [string]$PACKAGE_ID
    )
    
    Write-Host "Approving ${CC_NAME} for ${MSP_ID} on ${CHANNEL_NAME}..." -ForegroundColor Gray
    docker exec `
        -e CORE_PEER_LOCALMSPID=${MSP_ID} `
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} `
        -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} `
        cli peer lifecycle chaincode approveformyorg `
        -o orderer.medinsight.com:7050 `
        --channelID ${CHANNEL_NAME} `
        --name ${CC_NAME} `
        --version ${CC_VERSION} `
        --package-id ${PACKAGE_ID} `
        --sequence ${CC_SEQUENCE}
}

# Function to commit chaincode
function Commit-Chaincode {
    param (
        [string]$CC_NAME,
        [string]$CHANNEL_NAME
    )
    
    Write-Host "Committing ${CC_NAME} on ${CHANNEL_NAME}..." -ForegroundColor Green
    docker exec cli peer lifecycle chaincode commit `
        -o orderer.medinsight.com:7050 `
        --channelID ${CHANNEL_NAME} `
        --name ${CC_NAME} `
        --version ${CC_VERSION} `
        --sequence ${CC_SEQUENCE} `
        --peerAddresses peer0.doctor.medinsight.com:7051 `
        --peerAddresses peer0.pharmacy.medinsight.com:9051 `
        --peerAddresses peer0.lab.medinsight.com:11051
}

# ========== DEPLOY MEDICAL RECORDS CHAINCODE ==========
Write-Host ""
Write-Host "========== Deploying Medical Records Chaincode ==========" -ForegroundColor Cyan

# Package
Package-Chaincode "medical-records" "medical-records"

# Install on all peers
Install-Chaincode "medical-records" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
Install-Chaincode "medical-records" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
Install-Chaincode "medical-records" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp"

# Query installed chaincode to get package ID
Write-Host "Querying installed chaincode..." -ForegroundColor Yellow
$RAW_OUTPUT = docker exec cli peer lifecycle chaincode queryinstalled
$PACKAGE_ID = ""
foreach ($line in $RAW_OUTPUT) {
    if ($line -match "medical-records_${CC_VERSION}") {
        # Extract from format: "Package ID: medical-records_1.0:hash, Label: medical-records_1.0"
        if ($line -match "Package ID:\s*([^,]+)") {
            $PACKAGE_ID = $matches[1].Trim()
            break
        }
    }
}

if (-not $PACKAGE_ID) {
    Write-Error "Failed to get Package ID for medical-records"
    Write-Host "Raw output:" -ForegroundColor Red
    Write-Host $RAW_OUTPUT
    exit 1
}

Write-Host "Package ID: ${PACKAGE_ID}" -ForegroundColor Cyan

# Approve for all orgs on recordschannel
Approve-Chaincode "medical-records" "recordschannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "medical-records" "recordschannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "medical-records" "recordschannel" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
Commit-Chaincode "medical-records" "recordschannel"

# ========== DEPLOY CONSENT CHAINCODE ==========
Write-Host ""
Write-Host "========== Deploying Consent Chaincode ==========" -ForegroundColor Cyan

# Package
Package-Chaincode "consent" "consent"

# Install on all peers
Install-Chaincode "consent" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
Install-Chaincode "consent" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
Install-Chaincode "consent" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp"

# Get Package ID
$RAW_OUTPUT = docker exec cli peer lifecycle chaincode queryinstalled
$PACKAGE_ID = ""
foreach ($line in $RAW_OUTPUT) {
    if ($line -match "consent_${CC_VERSION}") {
        if ($line -match "Package ID:\s*([^,]+)") {
            $PACKAGE_ID = $matches[1].Trim()
            break
        }
    }
}

if (-not $PACKAGE_ID) {
    Write-Error "Failed to get Package ID for consent"
    exit 1
}

Write-Host "Package ID: ${PACKAGE_ID}" -ForegroundColor Cyan

# Approve
Approve-Chaincode "consent" "consentchannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "consent" "consentchannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "consent" "consentchannel" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
Commit-Chaincode "consent" "consentchannel"

# ========== DEPLOY PRESCRIPTIONS CHAINCODE ==========
Write-Host ""
Write-Host "========== Deploying Prescriptions Chaincode ==========" -ForegroundColor Cyan

# Package
Package-Chaincode "prescriptions" "prescriptions"

# Install on all peers
Install-Chaincode "prescriptions" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
Install-Chaincode "prescriptions" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
Install-Chaincode "prescriptions" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp"

# Get Package ID
$RAW_OUTPUT = docker exec cli peer lifecycle chaincode queryinstalled
$PACKAGE_ID = ""
foreach ($line in $RAW_OUTPUT) {
    if ($line -match "prescriptions_${CC_VERSION}") {
        if ($line -match "Package ID:\s*([^,]+)") {
            $PACKAGE_ID = $matches[1].Trim()
            break
        }
    }
}

if (-not $PACKAGE_ID) {
    Write-Error "Failed to get Package ID for prescriptions"
    exit 1
}

Write-Host "Package ID: ${PACKAGE_ID}" -ForegroundColor Cyan

# Approve
Approve-Chaincode "prescriptions" "prescriptionschannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "prescriptions" "prescriptionschannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
Approve-Chaincode "prescriptions" "prescriptionschannel" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
Commit-Chaincode "prescriptions" "prescriptionschannel"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "All Chaincodes Deployed Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
