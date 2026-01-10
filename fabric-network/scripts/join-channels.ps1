# Script pour créer et joindre les channels avec PatientOrg
# Windows PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating and Joining Channels" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Attendre que les conteneurs soient prêts
Write-Host "Waiting for containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Créer les channels
Write-Host ""
Write-Host "Step 1: Creating Channels..." -ForegroundColor Yellow

Write-Host "- Creating consentchannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/consentchannel.tx --outputBlock ./channel-artifacts/consentchannel.block

Write-Host "- Creating recordschannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/recordschannel.tx --outputBlock ./channel-artifacts/recordschannel.block

Write-Host "- Creating prescriptionschannel..." -ForegroundColor Gray
docker exec cli peer channel create -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/prescriptionschannel.tx --outputBlock ./channel-artifacts/prescriptionschannel.block

# Joindre les peers aux channels
Write-Host ""
Write-Host "Step 2: Joining Peers to Channels..." -ForegroundColor Yellow

# DoctorOrg
Write-Host "- Joining DoctorOrg..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# PharmacyOrg
Write-Host "- Joining PharmacyOrg..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# LabOrg
Write-Host "- Joining LabOrg..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# PatientOrg
Write-Host "- Joining PatientOrg..." -ForegroundColor Green
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/consentchannel.block
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/recordschannel.block
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel join -b ./channel-artifacts/prescriptionschannel.block

# Mettre à jour les anchor peers
Write-Host ""
Write-Host "Step 3: Updating Anchor Peers..." -ForegroundColor Yellow

Write-Host "- Updating anchor peers for consentchannel..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/DoctorOrgMSPanchors_consent.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/PharmacyOrgMSPanchors_consent.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/LabOrgMSPanchors_consent.tx
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c consentchannel -f ./channel-artifacts/PatientOrgMSPanchors_consent.tx

Write-Host "- Updating anchor peers for recordschannel..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/DoctorOrgMSPanchors_records.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_records.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/LabOrgMSPanchors_records.tx
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c recordschannel -f ./channel-artifacts/PatientOrgMSPanchors_records.tx

Write-Host "- Updating anchor peers for prescriptionschannel..." -ForegroundColor Gray
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/DoctorOrgMSPanchors_prescriptions.tx
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/PharmacyOrgMSPanchors_prescriptions.tx
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/LabOrgMSPanchors_prescriptions.tx
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel update -o orderer.medinsight.com:7050 -c prescriptionschannel -f ./channel-artifacts/PatientOrgMSPanchors_prescriptions.tx

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Channels Created and Joined Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les channels
Write-Host "Verifying channels for each organization:" -ForegroundColor Yellow
Write-Host ""

Write-Host "DoctorOrg channels:" -ForegroundColor Cyan
docker exec -e CORE_PEER_LOCALMSPID=DoctorOrgMSP -e CORE_PEER_ADDRESS=peer0.doctor.medinsight.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/doctor.medinsight.com/users/Admin@doctor.medinsight.com/msp cli peer channel list

Write-Host ""
Write-Host "PharmacyOrg channels:" -ForegroundColor Cyan
docker exec -e CORE_PEER_LOCALMSPID=PharmacyOrgMSP -e CORE_PEER_ADDRESS=peer0.pharmacy.medinsight.com:9051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacy.medinsight.com/users/Admin@pharmacy.medinsight.com/msp cli peer channel list

Write-Host ""
Write-Host "LabOrg channels:" -ForegroundColor Cyan
docker exec -e CORE_PEER_LOCALMSPID=LabOrgMSP -e CORE_PEER_ADDRESS=peer0.lab.medinsight.com:11051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.medinsight.com/users/Admin@lab.medinsight.com/msp cli peer channel list

Write-Host ""
Write-Host "PatientOrg channels:" -ForegroundColor Green
docker exec -e CORE_PEER_LOCALMSPID=PatientOrgMSP -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:13051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp cli peer channel list

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
