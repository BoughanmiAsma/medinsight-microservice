# MedInsight Hyperledger Fabric Network

This directory contains the Hyperledger Fabric blockchain network implementation for securing patient medical records in the MedInsight platform.

## Architecture

The network consists of:

- **3 Organizations**:
  - **DoctorOrg**: Medical practitioners
  - **PharmacyOrg**: Pharmacies
  - **PatientOrg**: Patients

- **3 Channels**:
  - **ConsentChannel**: Manages patient consent for data access
  - **RecordsChannel**: Stores medical records
  - **PrescriptionsChannel**: Manages prescriptions

- **Infrastructure**:
  - 1 Orderer (Solo consensus for development)
  - 3 Certificate Authorities (one per organization)
  - 3 Peer nodes (one per organization)

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Hyperledger Fabric binaries** (cryptogen, configtxgen, peer)
   - Download from: https://hyperledger-fabric.readthedocs.io/en/latest/install.html
   - Or run: `curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5`

3. **Go 1.20+** (for chaincode development)

## Quick Start

### 1. Start the Network

```bash
cd fabric-network
./scripts/start-network.sh
```

This script will:
- Generate cryptographic material
- Create genesis block and channel artifacts
- Start Docker containers
- Create and join all channels
- Update anchor peers

### 2. Deploy Chaincodes

```bash
./scripts/deploy-chaincode.sh
```

This deploys all three chaincodes:
- `medical-records` on RecordsChannel
- `consent` on ConsentChannel
- `prescriptions` on PrescriptionsChannel

### 3. Verify Network Status

```bash
# Check running containers
docker ps

# Check channels on a peer
docker exec peer0.doctor.medinsight.com peer channel list

# Check committed chaincodes
docker exec cli peer lifecycle chaincode querycommitted --channelID recordschannel
docker exec cli peer lifecycle chaincode querycommitted --channelID consentchannel
docker exec cli peer lifecycle chaincode querycommitted --channelID prescriptionschannel
```

## Network Management

### Stop the Network

```bash
docker-compose -f docker-compose-fabric.yml down
```

### Stop and Clean Everything

```bash
docker-compose -f docker-compose-fabric.yml down -v
rm -rf crypto-config channel-artifacts
```

### View Logs

```bash
# All containers
docker-compose -f docker-compose-fabric.yml logs -f

# Specific container
docker logs -f peer0.doctor.medinsight.com
docker logs -f orderer.medinsight.com
```

## Chaincode Details

### Medical Records Chaincode

**Channel**: RecordsChannel

**Functions**:
- `CreateRecord`: Create a new medical record (DoctorOrg only)
- `ReadRecord`: Retrieve a medical record
- `UpdateRecord`: Update an existing record (DoctorOrg only)
- `DeleteRecord`: Delete a record (DoctorOrg or PatientOrg)
- `QueryRecordsByPatient`: Query all records for a patient

### Consent Chaincode

**Channel**: ConsentChannel

**Functions**:
- `GrantConsent`: Patient grants access to doctor/pharmacy (PatientOrg only)
- `RevokeConsent`: Patient revokes access (PatientOrg only)
- `CheckConsent`: Verify if valid consent exists
- `QueryConsentsByPatient`: List all consents for a patient
- `QueryActiveConsentsByPatient`: List active consents for a patient

### Prescriptions Chaincode

**Channel**: PrescriptionsChannel

**Functions**:
- `CreatePrescription`: Doctor creates prescription (DoctorOrg only)
- `ReadPrescription`: Read prescription details
- `DispensePrescription`: Pharmacy marks as dispensed (PharmacyOrg only)
- `QueryPrescriptionsByPatient`: List patient prescriptions
- `QueryPrescriptionsByDoctor`: List prescriptions by doctor
- `QueryActivePrescriptionsByPatient`: List active prescriptions

## Testing Chaincode

### Example: Create a Medical Record

```bash
docker exec cli peer chaincode invoke \
  -o orderer.medinsight.com:7050 \
  -C recordschannel \
  -n medical-records \
  -c '{"function":"CreateRecord","Args":["REC001","PAT001","DOC001","Hypertension","Medication and lifestyle changes","[\"Lisinopril 10mg\"]","BP: 140/90","Patient advised to reduce salt intake"]}'
```

### Example: Query a Medical Record

```bash
docker exec cli peer chaincode query \
  -C recordschannel \
  -n medical-records \
  -c '{"function":"ReadRecord","Args":["REC001"]}'
```

### Example: Grant Consent

```bash
docker exec \
  -e CORE_PEER_LOCALMSPID=PatientOrgMSP \
  -e CORE_PEER_ADDRESS=peer0.patient.medinsight.com:11051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.medinsight.com/users/Admin@patient.medinsight.com/msp \
  cli peer chaincode invoke \
  -o orderer.medinsight.com:7050 \
  -C consentchannel \
  -n consent \
  -c '{"function":"GrantConsent","Args":["CONSENT001","PAT001","DOC001","DoctorOrgMSP","Medical treatment","Full access to medical records","30"]}'
```

## Directory Structure

```
fabric-network/
├── chaincode/
│   ├── consent/
│   │   ├── main.go
│   │   └── go.mod
│   ├── medical-records/
│   │   ├── main.go
│   │   └── go.mod
│   └── prescriptions/
│       ├── main.go
│       └── go.mod
├── scripts/
│   ├── generate-crypto.sh
│   ├── generate-genesis.sh
│   ├── start-network.sh
│   └── deploy-chaincode.sh
├── crypto-config.yaml
├── configtx.yaml
├── docker-compose-fabric.yml
└── README.md
```

## Troubleshooting

### Containers not starting

Check Docker logs:
```bash
docker-compose -f docker-compose-fabric.yml logs
```

### Channel creation fails

Ensure genesis block was generated correctly:
```bash
ls -la channel-artifacts/
```

### Chaincode installation fails

1. Check if Go modules are properly initialized
2. Verify chaincode path in CLI container
3. Check peer logs for errors

## Integration with Microservices

The `dossier-service`, `ordonnance-service`, and `lab-service` microservices will integrate with this Fabric network using the Fabric Gateway SDK. See the implementation plan for details.

## Security Considerations

- **TLS is disabled** in this development setup for simplicity
- **For production**: Enable TLS, use Raft consensus, implement proper identity management
- **Access Control**: Enforced at chaincode level using MSP IDs
- **Data Privacy**: Each channel provides data isolation between organizations

## Next Steps

1. Enable TLS for production
2. Implement Fabric Gateway integration in microservices
3. Set up Hyperledger Explorer for network monitoring
4. Configure backup and disaster recovery
5. Implement chaincode upgrade procedures
