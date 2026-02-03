#!/bin/bash
set -e

echo "=== Triggering builds on all peers ==="

for p in peer0.doctor.medinsight.com:7051 peer0.pharmacy.medinsight.com:9051 peer0.patient.medinsight.com:13051; do
    echo "Querying $p..."
    CORE_PEER_ADDRESS=$p peer chaincode query -C recordschannel -n medical-records -c '{"Args":["GetAllRecords"]}' || echo "Build still in progress for $p"
done

PEER_OPTS="--peerAddresses peer0.doctor.medinsight.com:7051 --peerAddresses peer0.pharmacy.medinsight.com:9051 --peerAddresses peer0.patient.medinsight.com:13051"

echo ""
echo "=== Attempting multi-peer invoke (TEST-002) ==="
peer chaincode invoke -o orderer.medinsight.com:7050 -C recordschannel -n medical-records $PEER_OPTS -c '{"Args":["CreateRecord","TEST-002","P-001","D-001","Grip","Repos","[]","Normal","Test multisign"]}' --waitForEvent

echo ""
echo "=== Final Ledger State ==="
peer chaincode query -C recordschannel -n medical-records -c '{"Args":["GetAllRecords"]}'
