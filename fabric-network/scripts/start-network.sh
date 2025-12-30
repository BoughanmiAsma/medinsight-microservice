#!/bin/bash
# Master script to start the Hyperledger Fabric network

set -e

echo "========================================="
echo "MedInsight Hyperledger Fabric Network"
echo "Starting Network Setup"
echo "========================================="

# Change to fabric-network directory
cd "$(dirname "$0")/.."

# Step 1: Generate Crypto Material
echo ""
echo "Step 1: Generating Cryptographic Material..."
./scripts/generate-crypto.sh

# Step 2: Generate Genesis Block and Channel Artifacts
echo ""
echo "Step 2: Generating Genesis Block and Channel Artifacts..."
./scripts/generate-genesis.sh

# Step 3: Start Docker Containers
echo ""
echo "Step 3: Starting Docker Containers..."
docker-compose -f docker-compose-fabric.yml up -d

# Wait for containers to start
echo ""
echo "Waiting for containers to initialize..."
sleep 10

# Step 4: Create Channels
echo ""
echo "Step 4: Creating Channels..."

# Create ConsentChannel
echo "- Creating ConsentChannel..."
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/consentchannel.tx --outputBlock ./channel-artifacts/consentchannel.block

# Create RecordsChannel
echo "- Creating RecordsChannel..."
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/recordschannel.tx --outputBlock ./channel-artifacts/recordschannel.block

# Create PrescriptionsChannel
echo "- Creating PrescriptionsChannel..."
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/prescriptionschannel.tx --outputBlock ./channel-artifacts/prescriptionschannel.block

# Step 5: Join Peers to Channels
echo ""
echo "Step 5: Joining Peers to Channels..."

# Join DoctorOrg peer to all channels
echo "- Joining DoctorOrg peer to channels..."
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Join PharmacyOrg peer to all channels
echo "- Joining PharmacyOrg peer to channels..."
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Join PatientOrg peer to all channels
echo "- Joining PatientOrg peer to channels..."
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Step 6: Update Anchor Peers
echo ""
echo "Step 6: Updating Anchor Peers..."

# Update anchor peers for ConsentChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/DoctorOrgMSPanchors_consent.tx

docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/PharmacyOrgMSPanchors_consent.tx

docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/PatientOrgMSPanchors_consent.tx

# Update anchor peers for RecordsChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/DoctorOrgMSPanchors_records.tx

docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_records.tx

docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PatientOrgMSPanchors_records.tx

# Update anchor peers for PrescriptionsChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/DoctorOrgMSPanchors_prescriptions.tx

docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_prescriptions.tx

docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/PatientOrgMSPanchors_prescriptions.tx

echo ""
echo "========================================="
echo "Network Setup Complete!"
echo "========================================="
echo ""
echo "Network Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Next Steps:"
echo "1. Package and install chaincode"
echo "2. Approve and commit chaincode definitions"
echo "3. Initialize chaincode"
echo ""
echo "To view logs: docker-compose -f docker-compose-fabric.yml logs -f"
echo "To stop network: docker-compose -f docker-compose-fabric.yml down"
echo ""
