#!/bin/bash
set -e

CONTAINER_NAME="digishop-cluster-control-plane"

echo "▶ Resuming local Kubernetes cluster (Docker container)..."

if docker ps -a --filter name=$CONTAINER_NAME --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
  docker start $CONTAINER_NAME
  echo "✅ Cluster resumed (Docker container started)."
  echo "⏳ Waiting a few seconds for Kubernetes services to come back online..."
  sleep 5
  kubectl get nodes
else
  echo "⚠️ Cluster container '$CONTAINER_NAME' does not exist. Use ./scripts/local-deploy.sh to create it."
fi
