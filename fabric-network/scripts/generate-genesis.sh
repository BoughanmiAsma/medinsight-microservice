#!/bin/bash
# Generate genesis block and channel configuration transactions

set -e

echo "========================================="
echo "Generating Genesis Block and Channel Artifacts"
echo "========================================="

# Check if configtxgen binary exists
if ! command -v configtxgen &> /dev/null; then
    echo "Error: configtxgen not found. Please install Hyperledger Fabric binaries."
    exit 1
fi

# Create channel-artifacts directory
if [ ! -d "channel-artifacts" ]; then
    mkdir channel-artifacts
fi

# Set the FABRIC_CFG_PATH to current directory
export FABRIC_CFG_PATH=${PWD}

echo ""
echo "Generating Genesis Block..."
configtxgen -profile MedInsightOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

echo ""
echo "Generating Channel Configuration Transactions..."

# Canal Consentement (Consent Channel)
echo "- Generating ConsentChannel transaction..."
configtxgen -profile ConsentChannel -outputCreateChannelTx ./channel-artifacts/consentchannel.tx -channelID consentchannel

# Canal Dossiers (Records Channel)
echo "- Generating RecordsChannel transaction..."
configtxgen -profile RecordsChannel -outputCreateChannelTx ./channel-artifacts/recordschannel.tx -channelID recordschannel

# Canal Ordonnances (Prescriptions Channel)
echo "- Generating PrescriptionsChannel transaction..."
configtxgen -profile PrescriptionsChannel -outputCreateChannelTx ./channel-artifacts/prescriptionschannel.tx -channelID prescriptionschannel

echo ""
echo "Generating Anchor Peer Updates..."

# Anchor peer for DoctorOrg
configtxgen -profile ConsentChannel -outputAnchorPeersUpdate ./channel-artifacts/DoctorOrgMSPanchors_consent.tx -channelID consentchannel -asOrg DoctorOrgMSP
configtxgen -profile RecordsChannel -outputAnchorPeersUpdate ./channel-artifacts/DoctorOrgMSPanchors_records.tx -channelID recordschannel -asOrg DoctorOrgMSP
configtxgen -profile PrescriptionsChannel -outputAnchorPeersUpdate ./channel-artifacts/DoctorOrgMSPanchors_prescriptions.tx -channelID prescriptionschannel -asOrg DoctorOrgMSP

# Anchor peer for PharmacyOrg
configtxgen -profile ConsentChannel -outputAnchorPeersUpdate ./channel-artifacts/PharmacyOrgMSPanchors_consent.tx -channelID consentchannel -asOrg PharmacyOrgMSP
configtxgen -profile RecordsChannel -outputAnchorPeersUpdate ./channel-artifacts/PharmacyOrgMSPanchors_records.tx -channelID recordschannel -asOrg PharmacyOrgMSP
configtxgen -profile PrescriptionsChannel -outputAnchorPeersUpdate ./channel-artifacts/PharmacyOrgMSPanchors_prescriptions.tx -channelID prescriptionschannel -asOrg PharmacyOrgMSP

# Anchor peer for PatientOrg
configtxgen -profile ConsentChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientOrgMSPanchors_consent.tx -channelID consentchannel -asOrg PatientOrgMSP
configtxgen -profile RecordsChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientOrgMSPanchors_records.tx -channelID recordschannel -asOrg PatientOrgMSP
configtxgen -profile PrescriptionsChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientOrgMSPanchors_prescriptions.tx -channelID prescriptionschannel -asOrg PatientOrgMSP

echo ""
echo "========================================="
echo "Genesis Block and Channel Artifacts Generated Successfully!"
echo "========================================="

echo ""
echo "Generated files:"
ls -la channel-artifacts/

echo ""
echo "Done!"
