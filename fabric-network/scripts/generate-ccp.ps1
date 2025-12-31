# Generate Connect Profiles for MedInsight Network
# Generates: connection-doctor.json, connection-pharmacy.json, connection-patient.json

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Generating Connection Profiles (CCP)"
Write-Host "=========================================" -ForegroundColor Cyan

# Directories
$CRYPTO_CONFIG = ".\crypto-config"
$OUTPUT_DIR = "."

# Function to generate CCP for an Org
function Generate-CCP {
    param (
        [string]$ORG_NAME,      # e.g., doctor
        [string]$ORG_MSP,       # e.g., DoctorOrgMSP
        [string]$P0PORT,        # e.g., 7051 (Peer Port)
        [string]$CAPORT,        # e.g., 7054 (CA Port)
        [string]$PEER_PEM,      # Path to peer TLS cert
        [string]$CA_PEM         # Path to CA cert
    )

    $TEMPLATE = @"
{
    ""name"": ""medinsight-network-${ORG_NAME}"",
    ""version"": ""1.0.0"",
    ""client"": {
        ""organization"": ""${ORG_NAME}""
    },
    ""organizations"": {
        ""${ORG_NAME}"": {
            ""mspid"": ""${ORG_MSP}"",
            ""peers"": [
                ""peer0.${ORG_NAME}.medinsight.com""
            ],
            ""certificateAuthorities"": [
                ""ca.${ORG_NAME}.medinsight.com""
            ]
        }
    },
    ""peers"": {
        ""peer0.${ORG_NAME}.medinsight.com"": {
            ""url"": ""grpcs://localhost:${P0PORT}"",
            ""tlsCACerts"": {
                ""pem"": ""${PEER_PEM}""
            },
            ""grpcOptions"": {
                ""ssl-target-name-override"": ""peer0.${ORG_NAME}.medinsight.com"",
                ""hostnameOverride"": ""peer0.${ORG_NAME}.medinsight.com""
            }
        }
    },
    ""certificateAuthorities"": {
        ""ca.${ORG_NAME}.medinsight.com"": {
            ""url"": ""https://localhost:${CAPORT}"",
            ""caName"": ""ca.${ORG_NAME}.medinsight.com"",
            ""tlsCACerts"": {
                ""pem"": [
                    ""${CA_PEM}""
                ]
            },
            ""httpOptions"": {
                ""verify"": false
            }
        }
    }
}
"@
    
    $OUTPUT_FILE = Join-Path $OUTPUT_DIR "connection-${ORG_NAME}.json"
    $TEMPLATE | Out-File -FilePath $OUTPUT_FILE -Encoding ASCII
    Write-Host "Generated $OUTPUT_FILE" -ForegroundColor Green
}

# Helper to read PEM cleanly (one line for JSON string)
function Read-Pem {
    param ([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Error "Certificate not found: $Path"
        return ""
    }
    # Read file, escape newlines for JSON
    $content = Get-Content $Path -Raw
    return $content -replace "`r`n", "\n" -replace "`n", "\n"
}

# --- DOCTOR ORG ---
$PEER_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\doctor.medinsight.com\tlsca\tlsca.doctor.medinsight.com-cert.pem"
$CA_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\doctor.medinsight.com\ca\ca.doctor.medinsight.com-cert.pem"

Write-Host "Reading Doctor Certificates..."
$PEER_PEM = Read-Pem $PEER_PEM_PATH
$CA_PEM = Read-Pem $CA_PEM_PATH

Generate-CCP "doctor" "DoctorOrgMSP" "7051" "7054" $PEER_PEM $CA_PEM

# --- PHARMACY ORG ---
$PEER_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\pharmacy.medinsight.com\tlsca\tlsca.pharmacy.medinsight.com-cert.pem"
$CA_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\pharmacy.medinsight.com\ca\ca.pharmacy.medinsight.com-cert.pem"

Write-Host "Reading Pharmacy Certificates..."
$PEER_PEM = Read-Pem $PEER_PEM_PATH
$CA_PEM = Read-Pem $CA_PEM_PATH

Generate-CCP "pharmacy" "PharmacyOrgMSP" "9051" "8054" $PEER_PEM $CA_PEM

# --- LAB ORG ---
$PEER_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\lab.medinsight.com\tlsca\tlsca.lab.medinsight.com-cert.pem"
$CA_PEM_PATH = "$CRYPTO_CONFIG\peerOrganizations\lab.medinsight.com\ca\ca.lab.medinsight.com-cert.pem"

Write-Host "Reading Lab Certificates..."
$PEER_PEM = Read-Pem $PEER_PEM_PATH
$CA_PEM = Read-Pem $CA_PEM_PATH

Generate-CCP "lab" "LabOrgMSP" "11051" "9054" $PEER_PEM $CA_PEM

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
