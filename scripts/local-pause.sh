#!/bin/bash
set -e

CONTAINER_NAME="digishop-cluster-control-plane"

echo "⏸ Pausing local Kubernetes cluster (Docker container)..."

if docker ps --filter name=$CONTAINER_NAME --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
  docker stop $CONTAINER_NAME
  echo "✅ Cluster paused (Docker container stopped)."
else
  echo "⚠️ Cluster container '$CONTAINER_NAME' is not running."
fi
