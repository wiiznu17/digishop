#!/bin/bash
set -e

CLUSTER_NAME="digishop-cluster"

echo "🧹 Cleaning up local Kubernetes deployment (Kind)..."

if kind get clusters | grep -q "^$CLUSTER_NAME$"; then
  echo "🗑 Deleting Kind cluster: $CLUSTER_NAME..."
  kind delete cluster --name "$CLUSTER_NAME"
  echo "✅ Cluster deleted successfully."
else
  echo "⚠️ Cluster '$CLUSTER_NAME' does not exist."
fi
