#!/bin/bash
set -e

# Configuration
CC_NAME="medical-records"
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/medical-records"
CC_VERSION="1.1"
CC_SEQUENCE="2"
CHANNEL_NAME="recordschannel"
ORDERER_ADDR="orderer.medinsight.com:7050"

# MSP Paths
DOCTOR_MSP="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp"
PHARMACY_MSP="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp"
LAB_MSP="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp"
PATIENT_MSP="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp"

package_chaincode() {
    echo "Packaging chaincode v$CC_VERSION..."
    peer lifecycle chaincode package ${CC_NAME}_${CC_VERSION}.tar.gz --path ${CC_SRC_PATH} --lang golang --label ${CC_NAME}_${CC_VERSION}
}

install_on_peer() {
    local ORG=$1
    local ADDR=$2
    local MSP_ID=$3
    local MSP_PATH=$4
    
    echo "Installing on $ADDR ($ORG)..."
    CORE_PEER_LOCALMSPID=$MSP_ID \
    CORE_PEER_ADDRESS=$ADDR \
    CORE_PEER_MSPCONFIGPATH=$MSP_PATH \
    peer lifecycle chaincode install ${CC_NAME}_${CC_VERSION}.tar.gz
}

approve_for_org() {
    local ORG=$1
    local ADDR=$2
    local MSP_ID=$3
    local MSP_PATH=$4
    
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r ".installed_chaincodes[] | select(.label==\"${CC_NAME}_${CC_VERSION}\") | .package_id")
    
    echo "Approving for $MSP_ID (Package: $PACKAGE_ID)..."
    CORE_PEER_LOCALMSPID=$MSP_ID \
    CORE_PEER_ADDRESS=$ADDR \
    CORE_PEER_MSPCONFIGPATH=$MSP_PATH \
    peer lifecycle chaincode approveformyorg -o $ORDERER_ADDR --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE
}

# 1. Package
package_chaincode

# 2. Install
# 2. Install (Skipping already installed peers to avoid errors)
echo "Skipping installation for Doctor, Pharmacy, Lab (already installed)"
# install_on_peer "Doctor" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "$DOCTOR_MSP"
# install_on_peer "Pharmacy" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "$PHARMACY_MSP"
# install_on_peer "Lab" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "$LAB_MSP"

install_on_peer "Patient" "peer0.patient.medinsight.com:13051" "PatientOrgMSP" "$PATIENT_MSP"

# 3. Approve
approve_for_org "Doctor" "peer0.doctor.medinsight.com:7051" "DoctorOrgMSP" "$DOCTOR_MSP"
approve_for_org "Pharmacy" "peer0.pharmacy.medinsight.com:9051" "PharmacyOrgMSP" "$PHARMACY_MSP"
approve_for_org "Lab" "peer0.lab.medinsight.com:11051" "LabOrgMSP" "$LAB_MSP"
approve_for_org "Patient" "peer0.patient.medinsight.com:13051" "PatientOrgMSP" "$PATIENT_MSP"

# 4. Commit (including Patient this time)
echo "Committing chaincode definition..."
peer lifecycle chaincode commit -o $ORDERER_ADDR --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --sequence $CC_SEQUENCE \
    --peerAddresses peer0.doctor.medinsight.com:7051 \
    --peerAddresses peer0.pharmacy.medinsight.com:9051 \
    --peerAddresses peer0.patient.medinsight.com:13051

echo "Chaincode updated to v$CC_VERSION successfully!"
