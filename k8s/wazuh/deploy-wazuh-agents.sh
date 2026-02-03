#!/bin/bash
# Wazuh Agents Deployment Script for MedInsight Kubernetes Cluster
# This script deploys Wazuh agents to monitor microservices

set -e

echo "========================================="
echo "  Wazuh Agents Deployment for MedInsight"
echo "========================================="
echo ""

# Configuration
NAMESPACE="medinsight"
WAZUH_MANAGER_IP="52.205.61.44"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if namespace exists
echo -e "${YELLOW}Checking if namespace '$NAMESPACE' exists...${NC}"
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${RED}Error: Namespace '$NAMESPACE' does not exist${NC}"
    echo "Please create it first: kubectl create namespace $NAMESPACE"
    exit 1
fi
echo -e "${GREEN}✓ Namespace found${NC}"

# Deploy ConfigMap
echo ""
echo -e "${YELLOW}Deploying Wazuh Agent ConfigMap...${NC}"
kubectl apply -f wazuh-agent-configmap.yml -n $NAMESPACE
echo -e "${GREEN}✓ ConfigMap deployed${NC}"

# Deploy DaemonSet
echo ""
echo -e "${YELLOW}Deploying Wazuh Agent DaemonSet...${NC}"
kubectl apply -f wazuh-agent-daemonset.yml -n $NAMESPACE
echo -e "${GREEN}✓ DaemonSet deployed${NC}"

# Wait for agents to start
echo ""
echo -e "${YELLOW}Waiting for Wazuh agents to start (30 seconds)...${NC}"
sleep 30

# Check agent status
echo ""
echo -e "${YELLOW}Checking Wazuh agent pods status...${NC}"
kubectl get pods -n $NAMESPACE -l app=wazuh-agent

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}Deployment completed!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Verify agents are connected to Wazuh Manager:"
echo "   docker exec single-node-wazuh.manager-1 /var/ossec/bin/agent_control -l"
echo ""
echo "2. Check agent logs:"
echo "   kubectl logs -n $NAMESPACE -l app=wazuh-agent --tail=50"
echo ""
echo "3. Access Wazuh Dashboard:"
echo "   https://$WAZUH_MANAGER_IP"
echo ""
echo "4. To apply custom rules, copy custom-rules.xml to Wazuh Manager:"
echo "   docker cp custom-rules.xml single-node-wazuh.manager-1:/var/ossec/etc/rules/local_rules.xml"
echo "   docker exec single-node-wazuh.manager-1 /var/ossec/bin/wazuh-control restart"
echo ""
