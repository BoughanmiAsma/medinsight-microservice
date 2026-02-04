# Dossier Service Deployment Fix

## Problem Summary
The `dossier-service` was experiencing `CrashLoopBackOff` with 116 restarts over 2+ days due to:
```
Identity not found in wallet: dossierAppUser
```

## Root Cause
The service had Hyperledger Fabric integration code (`FabricConfig.java`) that was trying to initialize Fabric Gateway on startup, but:
1. **Missing Fabric configuration** in `application.properties`
2. **No wallet/identity setup** for the dossier service
3. **No connection profile** (`connection-dossier.json`)
4. **Fabric beans created eagerly** during application startup, causing immediate failure

## Solution Implemented

### 1. Made Fabric Integration Optional ✅
- Added `@ConditionalOnProperty(name = "fabric.enabled", havingValue = "true", matchIfMissing = false)` to `FabricConfig.java`
- Added `@Lazy` annotations to all Fabric beans
- Set `fabric.enabled=false` by default in `application.properties`
- Added logging for better troubleshooting

### 2. Created Fabric Configuration Files ✅
- Created `fabric-network/connection-dossier.json` connection profile
- Added complete Fabric properties to `application.properties`:
  - `fabric.walletPath=/opt/fabric/wallets/dossier`
  - `fabric.connectionProfile=/opt/fabric/connection-dossier.json`
  - `fabric.userName=dossierAppUser`
  - `fabric.channelName=medchannel`
  - `fabric.contractName=medical_records`
  - `fabric.mspId=PatientOrgMSP`

### 3. Benefits of This Approach
- ✅ Service can start **immediately** without Fabric infrastructure
- ✅ Fabric integration can be enabled later via ConfigMap/environment variable
- ✅ Consistent with microservices architecture (gradual enablement)
- ✅ No breaking changes to existing service functionality
- ✅ Easy to debug with added logging

## Next Steps

### Immediate: Deploy the Fix
The changes are ready to be committed and pushed. The CI/CD pipeline will:
1. Build the updated `dossier-service` with the fixes
2. Create new Docker image `boughanmiasma/pds:service-dossier`
3. Deploy to Kubernetes cluster
4. Service should start successfully (PostgreSQL + Keycloak integration intact)

### Future: Enable Fabric (Optional)
When Hyperledger Fabric infrastructure is fully set up:

1. **Create Fabric wallet for dossier service:**
   ```bash
   cd fabric-network/scripts
   # Create identity for dossier user
   ./enroll-user.sh dossierAppUser PatientOrgMSP
   ```

2. **Update Kubernetes deployment to mount Fabric resources:**
   ```yaml
   volumeMounts:
     - name: fabric-connection
       mountPath: /opt/fabric/connection-dossier.json
       subPath: connection-dossier.json
     - name: fabric-wallet
       mountPath: /opt/fabric/wallets/dossier
   volumes:
     - name: fabric-connection
       configMap:
         name: fabric-connection-profile
     - name: fabric-wallet
       secret:
         secretName: dossier-fabric-wallet
   ```

3. **Enable Fabric via environment variable:**
   ```yaml
   env:
     - name: FABRIC_ENABLED
       value: "true"
   ```

## Files Modified
1. `MedInsight-Microservices/dossier-service/src/main/resources/application.properties`
2. `MedInsight-Microservices/dossier-service/src/main/java/com/medinsight/dossier/config/FabricConfig.java`
3. `fabric-network/connection-dossier.json` (created)

## Expected Outcome
After deployment:
- ✅ Dossier service pods should reach `Running` state
- ✅ Health checks (`/actuator/health/liveness` and `/actuator/health/readiness`) should pass
- ✅ Service will be accessible via Kong API Gateway
- ✅ PostgreSQL database connectivity maintained
- ✅ Keycloak OAuth2 authentication working
- ⏸️ Fabric integration disabled (can be enabled later)
