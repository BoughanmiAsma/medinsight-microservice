# Start MedInsight Hyperledger Fabric Network
# Windows PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MedInsight Hyperledger Fabric Network" -ForegroundColor Cyan
Write-Host "Starting Network Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Change to fabric-network directory
$FABRIC_NETWORK_DIR = $PSScriptRoot | Split-Path -Parent
Set-Location $FABRIC_NETWORK_DIR

# Step 1: Generate Crypto Material
Write-Host ""
Write-Host "Step 1: Generating Cryptographic Material..." -ForegroundColor Yellow
& ".\scripts\generate-crypto.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to generate crypto material" -ForegroundColor Red
    exit 1
}

# Step 2: Generate Genesis Block and Channel Artifacts
Write-Host ""
Write-Host "Step 2: Generating Genesis Block and Channel Artifacts..." -ForegroundColor Yellow
& ".\scripts\generate-genesis.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to generate genesis block and channel artifacts" -ForegroundColor Red
    exit 1
}

# Step 3: Start Docker Containers
Write-Host ""
Write-Host "Step 3: Starting Docker Containers..." -ForegroundColor Yellow
docker-compose -f docker-compose-fabric.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

# Wait for containers to start
Write-Host ""
Write-Host "Waiting for containers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Create Channels
Write-Host ""
Write-Host "Step 4: Creating Channels..." -ForegroundColor Yellow

# Create ConsentChannel
Write-Host "- Creating ConsentChannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/consentchannel.tx --outputBlock ./channel-artifacts/consentchannel.block

# Create RecordsChannel
Write-Host "- Creating RecordsChannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/recordschannel.tx --outputBlock ./channel-artifacts/recordschannel.block

# Create PrescriptionsChannel
Write-Host "- Creating PrescriptionsChannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/prescriptionschannel.tx --outputBlock ./channel-artifacts/prescriptionschannel.block

# Step 5: Join Peers to Channels
Write-Host ""
Write-Host "Step 5: Joining Peers to Channels..." -ForegroundColor Yellow

# Join DoctorOrg peer to all channels
Write-Host "- Joining DoctorOrg peer to channels..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Join PharmacyOrg peer to all channels
Write-Host "- Joining PharmacyOrg peer to channels..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Join LabOrg peer to all channels
Write-Host "- Joining LabOrg peer to channels..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Step 6: Update Anchor Peers
Write-Host ""
Write-Host "Step 6: Updating Anchor Peers..." -ForegroundColor Yellow

# Update anchor peers for ConsentChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/DoctorOrgMSPanchors_consent.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/PharmacyOrgMSPanchors_consent.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/LabOrgMSPanchors_consent.tx

# Update anchor peers for RecordsChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/DoctorOrgMSPanchors_records.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_records.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/LabOrgMSPanchors_records.tx

# Update anchor peers for PrescriptionsChannel
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/DoctorOrgMSPanchors_prescriptions.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_prescriptions.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/LabOrgMSPanchors_prescriptions.tx

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Network Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Network Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Package and install chaincode" -ForegroundColor Gray
Write-Host "2. Approve and commit chaincode definitions" -ForegroundColor Gray
Write-Host "3. Initialize chaincode" -ForegroundColor Gray
Write-Host ""
Write-Host "To view logs: docker-compose -f docker-compose-fabric.yml logs -f" -ForegroundColor Cyan
Write-Host "To stop network: docker-compose -f docker-compose-fabric.yml down" -ForegroundColor Cyan
Write-Host ""
