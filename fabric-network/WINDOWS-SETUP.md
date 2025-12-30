# MedInsight Fabric Network - Windows Setup Guide

## Prerequisites Installation ✅

### 1. Docker Desktop
- **Status**: ✅ Installed
- **Version**: Docker 28.0.4
- **Docker Compose**: v2.34.0-desktop.1

### 2. Hyperledger Fabric Binaries
- **Status**: ✅ Installed
- **Version**: v2.5.0
- **Location**: `fabric-network\bin\`
- **Binaries**:
  - ✅ peer.exe
  - ✅ orderer.exe
  - ✅ cryptogen.exe
  - ✅ configtxgen.exe
  - ✅ configtxlator.exe
  - ✅ discover.exe
  - ✅ ledgerutil.exe
  - ✅ osnadmin.exe

## Windows PowerShell Scripts

All bash scripts have been converted to PowerShell for Windows compatibility:

### Installation Script
**File**: `install-fabric-binaries.ps1`
- Downloads Hyperledger Fabric binaries
- Extracts to `bin\` directory
- Verifies installation

### Network Setup Scripts

1. **generate-crypto.ps1**
   - Generates cryptographic material for all organizations
   - Creates MSP folders and certificates

2. **generate-genesis.ps1**
   - Creates genesis block for orderer
   - Generates channel creation transactions
   - Creates anchor peer update transactions

3. **start-network.ps1**
   - Master script to start entire network
   - Runs crypto generation
   - Runs genesis generation
   - Starts Docker containers
   - Creates and joins channels
   - Updates anchor peers

## Quick Start Guide

### Step 1: Generate Crypto Material
```powershell
cd c:\Users\Ameni\Desktop\MedInsight\fabric-network
.\scripts\generate-crypto.ps1
```

### Step 2: Generate Genesis Block
```powershell
.\scripts\generate-genesis.ps1
```

### Step 3: Start Network
```powershell
.\scripts\start-network.ps1
```

Or run all steps at once:
```powershell
.\scripts\start-network.ps1
```

### Step 4: Verify Network
```powershell
# Check running containers
docker ps

# Check channels
docker exec peer0.doctor.medinsight.com peer channel list

# View logs
docker-compose -f docker-compose-fabric.yml logs -f
```

## Troubleshooting

### PowerShell Execution Policy
If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Path Issues
Add binaries to PATH for current session:
```powershell
$env:Path = "c:\Users\Ameni\Desktop\MedInsight\fabric-network\bin;$env:Path"
```

### Docker Issues
Ensure Docker Desktop is running:
```powershell
docker info
```

## Next Steps

1. ✅ Prerequisites installed
2. ⏳ Run network setup scripts
3. ⏳ Deploy chaincodes
4. ⏳ Test chaincode operations
5. ⏳ Integrate with microservices

## Notes

- All scripts are PowerShell (.ps1) versions of the original bash scripts
- Scripts maintain the same functionality as Linux/Mac versions
- Docker commands work identically on Windows
- Chaincode deployment will be done via Docker CLI container
