#!/bin/bash
# Deploy all chaincodes to the Fabric network

set -e

echo "========================================="
echo "Deploying Chaincodes"
echo "========================================="

# Chaincode version
CC_VERSION="1.0"
CC_SEQUENCE=1

# Function to package chaincode
package_chaincode() {
    local CC_NAME=$1
    local CC_PATH=$2
    
    echo ""
    echo "Packaging ${CC_NAME}..."
    docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path /opt/gopath/src/github.com/chaincode/${CC_PATH} \
        --lang golang \
        --label ${CC_NAME}_${CC_VERSION}
}

# Function to install chaincode on a peer
install_chaincode() {
    local CC_NAME=$1
    local PEER_ADDRESS=$2
    local MSP_ID=$3
    local MSP_PATH=$4
    
    echo "Installing ${CC_NAME} on ${PEER_ADDRESS}..."
    docker exec \
        -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
}

# Function to approve chaincode for an organization
approve_chaincode() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    local PEER_ADDRESS=$3
    local MSP_ID=$4
    local MSP_PATH=$5
    local PACKAGE_ID=$6
    
    echo "Approving ${CC_NAME} for ${MSP_ID} on ${CHANNEL_NAME}..."
    docker exec \
        -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
        cli peer lifecycle chaincode approveformyorg \
        -o orderer.medinsight.com:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CC_SEQUENCE}
}

# Function to commit chaincode
commit_chaincode() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    
    echo "Committing ${CC_NAME} on ${CHANNEL_NAME}..."
    docker exec cli peer lifecycle chaincode commit \
        -o orderer.medinsight.com:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --sequence ${CC_SEQUENCE} \
        --peerAddresses peer0.doctor.medinsight.com:7051 \
        --peerAddresses peer0.pharmacy.medinsight.com:9051 \
        --peerAddresses peer0.patient.medinsight.com:11051
}

# ========== DEPLOY MEDICAL RECORDS CHAINCODE ==========
echo ""
echo "========== Deploying Medical Records Chaincode =========="

# Package
package_chaincode "medical-records" "medical-records"

# Install on all peers
install_chaincode "medical-records" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
install_chaincode "medical-records" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
install_chaincode "medical-records" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp"

# Query installed chaincode to get package ID
echo "Querying installed chaincode..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep medical-records_${CC_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: ${PACKAGE_ID}"

# Approve for all orgs on recordschannel
approve_chaincode "medical-records" "recordschannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "medical-records" "recordschannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "medical-records" "recordschannel" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
commit_chaincode "medical-records" "recordschannel"

# ========== DEPLOY CONSENT CHAINCODE ==========
echo ""
echo "========== Deploying Consent Chaincode =========="

# Package
package_chaincode "consent" "consent"

# Install on all peers
install_chaincode "consent" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
install_chaincode "consent" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
install_chaincode "consent" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp"

# Query installed chaincode to get package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep consent_${CC_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: ${PACKAGE_ID}"

# Approve for all orgs on consentchannel
approve_chaincode "consent" "consentchannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "consent" "consentchannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "consent" "consentchannel" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
commit_chaincode "consent" "consentchannel"

# ========== DEPLOY PRESCRIPTIONS CHAINCODE ==========
echo ""
echo "========== Deploying Prescriptions Chaincode =========="

# Package
package_chaincode "prescriptions" "prescriptions"

# Install on all peers
install_chaincode "prescriptions" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
install_chaincode "prescriptions" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
install_chaincode "prescriptions" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp"

# Query installed chaincode to get package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep prescriptions_${CC_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: ${PACKAGE_ID}"

# Approve for all orgs on prescriptionschannel
approve_chaincode "prescriptions" "prescriptionschannel" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "prescriptions" "prescriptionschannel" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp" "${PACKAGE_ID}"
approve_chaincode "prescriptions" "prescriptionschannel" "peer0.patient.medinsight.com:11051" "PatientOrgMSP" "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp" "${PACKAGE_ID}"

# Commit
commit_chaincode "prescriptions" "prescriptionschannel"

echo ""
echo "========================================="
echo "All Chaincodes Deployed Successfully!"
echo "========================================="
echo ""
echo "Verify deployment:"
echo "docker exec cli peer lifecycle chaincode querycommitted --channelID recordschannel"
echo "docker exec cli peer lifecycle chaincode querycommitted --channelID consentchannel"
echo "docker exec cli peer lifecycle chaincode querycommitted --channelID prescriptionschannel"
echo ""
