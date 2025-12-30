#!/bin/bash
# Generate cryptographic material for all organizations

set -e

echo "========================================="
echo "Generating Crypto Material"
echo "========================================="

# Check if cryptogen binary exists
if ! command -v cryptogen &> /dev/null; then
    echo "Error: cryptogen not found. Please install Hyperledger Fabric binaries."
    echo "You can download them from: https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
    exit 1
fi

# Remove existing crypto material
if [ -d "crypto-config" ]; then
    echo "Removing existing crypto-config directory..."
    rm -rf crypto-config
fi

# Generate crypto material
echo "Generating crypto material using cryptogen..."
cryptogen generate --config=./crypto-config.yaml

echo "========================================="
echo "Crypto Material Generated Successfully!"
echo "========================================="

# List generated organizations
echo ""
echo "Generated Organizations:"
ls -la crypto-config/peerOrganizations/
ls -la crypto-config/ordererOrganizations/

echo ""
echo "Done!"
