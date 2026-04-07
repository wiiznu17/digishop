#!/bin/bash
set -e

# Configuration
CLUSTER_NAME="digishop-cluster"
SERVICES=("authen-service" "customer-service2" "customer2" "merchant" "merchant-service" "merchant-worker" "portal" "portal-service")
REGISTRY="ghcr.io/wiiznu"

echo "🚀 Starting Local Kubernetes Deployment (Kind)"

# 1. Create Kind cluster if not exists
if ! kind get clusters | grep -q "^$CLUSTER_NAME$"; then
  echo "📦 Creating Kind cluster..."
  kind create cluster --name "$CLUSTER_NAME" --config kind-config.yaml
else
  echo "✅ Kind cluster already exists."
fi

# 2. Build and Load Images
for SERVICE in "${SERVICES[@]}"; do
  echo "🛠 Building $SERVICE..."
  docker build -t "$REGISTRY/$SERVICE:latest" -f "apps/$SERVICE/Dockerfile" .
  
  echo "📥 Loading $SERVICE into Kind..."
  kind load docker-image "$REGISTRY/$SERVICE:latest" --name "$CLUSTER_NAME"
done

# 3. Setup Ingress Controller (Nginx)
echo "🌐 Installing Ingress NGINX..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "⏳ Waiting for Ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s

# 4. Apply Kustomize
echo "☸️ Applying Kubernetes manifests (Dev)..."
kubectl apply -k .k8s/overlays/dev

echo "🎉 Deployment complete! Access your app at http://localhost"
