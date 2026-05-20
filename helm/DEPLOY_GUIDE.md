# HappyPath — Guida al Deploy su Google Kubernetes Engine (GKE)

Questa guida copre tutti i passaggi manuali necessari prima e dopo l'utilizzo degli Helm chart presenti in `helm/happypath/`. I task sono ordinati per fase di esecuzione.

---

## Prerequisiti

| Tool | Versione minima | Note |
|---|---|---|
| `gcloud` CLI | >= 460 | `gcloud components update` |
| `kubectl` | >= 1.29 | installato da `gcloud components install kubectl` |
| `helm` | >= 3.14 | https://helm.sh/docs/intro/install/ |
| Docker | >= 24 | per build immagini |

---

## Fase 1 — Preparazione del progetto GCP

### 1.1 Crea o seleziona il progetto

```bash
export PROJECT_ID="happypath-prod"
gcloud projects create $PROJECT_ID --name="HappyPath"
gcloud config set project $PROJECT_ID
```

### 1.2 Abilita le API necessarie

```bash
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  artifactregistry.googleapis.com \
  certificatemanager.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

---

## Fase 2 — Artifact Registry (repository immagini Docker)

### 2.1 Crea il repository

```bash
export REGION="europe-west1"

gcloud artifacts repositories create happypath \
  --repository-format=docker \
  --location=$REGION \
  --description="HappyPath Docker images"
```

### 2.2 Configura Docker per usare Artifact Registry

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 2.3 Build e push delle immagini

```bash
export REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/happypath"
export TAG="1.0.0"

# Backend (Spring Boot)
cd backend
docker build -t ${REPO}/backend:${TAG} .
docker push ${REPO}/backend:${TAG}

# Frontend (React → Nginx)
cd ../frontend
docker build -t ${REPO}/frontend:${TAG} .
docker push ${REPO}/frontend:${TAG}
```

> **Nota sul Dockerfile del frontend:** assicurati che il `Dockerfile` in `frontend/` produca una build Nginx con `VITE_API_BASE_URL` configurabile a runtime via environment variable o via build-arg. Un esempio di multi-stage Dockerfile:
>
> ```dockerfile
> FROM node:20-alpine AS builder
> WORKDIR /app
> COPY . .
> ARG VITE_API_BASE_URL=https://happypath.io/api
> RUN npm ci && npm run build
>
> FROM nginx:alpine
> COPY --from=builder /app/dist /usr/share/nginx/html
> COPY nginx.conf /etc/nginx/conf.d/default.conf
> EXPOSE 80
> ```
>
> File `nginx.conf` minimo per SPA React:
> ```nginx
> server {
>   listen 80;
>   root /usr/share/nginx/html;
>   index index.html;
>   location / {
>     try_files $uri $uri/ /index.html;
>   }
>   location /api/ {
>     proxy_pass http://happypath-backend:8080;
>   }
> }
> ```

---

## Fase 3 — Creazione del cluster GKE

```bash
gcloud container clusters create happypath-cluster \
  --region=$REGION \
  --num-nodes=2 \
  --machine-type=e2-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=6 \
  --workload-pool=${PROJECT_ID}.svc.id.goog \
  --release-channel=regular
```

Ottenere le credenziali kubeconfig:

```bash
gcloud container clusters get-credentials happypath-cluster --region=$REGION
```

Crea il namespace dedicato:

```bash
kubectl create namespace happypath
```

---

## Fase 4 — Cloud SQL (PostgreSQL)

### 4.1 Crea l'istanza

```bash
gcloud sql instances create happypath-pg-prod \
  --database-version=POSTGRES_16 \
  --region=$REGION \
  --tier=db-g1-small \
  --storage-auto-increase \
  --backup-start-time=02:00
```

### 4.2 Crea il database e l'utente

```bash
gcloud sql databases create happypath --instance=happypath-pg-prod

gcloud sql users create happypath_user \
  --instance=happypath-pg-prod \
  --password=SCEGLI_UNA_PASSWORD_SICURA
```

> ⚠️ Salva la password — ti servirà per il Secret Kubernetes nella Fase 7.

### 4.3 Nota sulla connessione

Il backend usa il **Cloud SQL Auth Proxy** come sidecar (già configurato nell'Helm chart). Il proxy si connette tramite IAM — non è necessario aprire porte pubbliche. L'`instanceConnectionName` nel `values.yaml` deve avere il formato:
```
PROJECT_ID:REGION:INSTANCE_NAME
```
Esempio: `happypath-prod:europe-west1:happypath-pg-prod`

---

## Fase 5 — Redis Memorystore (opzionale, consigliato in prod)

```bash
gcloud redis instances create happypath-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --network=default
```

Ottieni l'IP privato:

```bash
gcloud redis instances describe happypath-redis \
  --region=$REGION \
  --format="value(host)"
```

Inserisci l'IP nel `values-prod.yaml` → `redis.externalHost`.

Attiva l'accesso VPC dal cluster GKE alla VPC di Memorystore se usi reti separate.

---

## Fase 6 — IP statico e DNS

### 6.1 Riserva un IP globale

```bash
gcloud compute addresses create happypath-prod-ip --global

# Verifica l'IP assegnato
gcloud compute addresses describe happypath-prod-ip --global
```

### 6.2 Configura il DNS

Nel tuo provider DNS, crea un record **A** che punta il tuo dominio (es. `happypath.io`) all'IP ottenuto sopra. La ManagedCertificate di GKE richiede che la risoluzione DNS sia attiva prima di poter emettere il certificato TLS.

---

## Fase 7 — Service Account e Workload Identity

### 7.1 Crea il Google Service Account (GSA)

```bash
gcloud iam service-accounts create happypath-ksa \
  --display-name="HappyPath Kubernetes SA"
```

### 7.2 Permessi Cloud SQL

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:happypath-ksa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 7.3 Permessi Artifact Registry (per pull immagini)

```bash
gcloud artifacts repositories add-iam-policy-binding happypath \
  --location=$REGION \
  --member="serviceAccount:happypath-ksa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

### 7.4 Lega KSA → GSA (Workload Identity)

```bash
# Dopo aver installato l'Helm chart (crea la KSA):
gcloud iam service-accounts add-iam-policy-binding \
  happypath-ksa@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:${PROJECT_ID}.svc.id.goog[happypath/happypath-sa]"
```

---

## Fase 8 — Secrets Kubernetes

Non committare mai segreti in chiaro. Ci sono due approcci:

### Approccio A — kubectl (rapido per staging)

```bash
kubectl create secret generic happypath-secrets \
  --namespace=happypath \
  --from-literal=DB_USERNAME=happypath_user \
  --from-literal=DB_PASSWORD=LA_TUA_PASSWORD \
  --from-literal=JWT_SECRET=GENERA_256_BIT_RANDOM \
  --from-literal=MINIO_ACCESS_KEY=minioadmin \
  --from-literal=MINIO_SECRET_KEY=minioadmin123 \
  --from-literal=ACTUATOR_USER=actuator \
  --from-literal=ACTUATOR_PASSWORD=SCEGLI_PASSWORD \
  --from-literal=REDIS_PASSWORD=""
```

Generare un JWT secret sicuro:

```bash
openssl rand -base64 32
```

### Approccio B — Google Secret Manager + External Secrets Operator (raccomandato in prod)

1. Installa External Secrets Operator:
   ```bash
   helm repo add external-secrets https://charts.external-secrets.io
   helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
   ```

2. Crea i secret in Google Secret Manager:
   ```bash
   echo -n "happypath_user" | gcloud secrets create happypath-db-username --data-file=-
   echo -n "LA_PASSWORD"    | gcloud secrets create happypath-db-password --data-file=-
   echo -n "$(openssl rand -base64 32)" | gcloud secrets create happypath-jwt-secret --data-file=-
   # ... ripeti per tutti i secret
   ```

3. Crea un `SecretStore` e un `ExternalSecret` che sincronizzano GSM → Kubernetes Secret. Esempio:
   ```yaml
   # external-secret.yaml
   apiVersion: external-secrets.io/v1beta1
   kind: ExternalSecret
   metadata:
     name: happypath-secrets
     namespace: happypath
   spec:
     refreshInterval: 1h
     secretStoreRef:
       name: gcp-secret-store
       kind: SecretStore
     target:
       name: happypath-secrets
     data:
       - secretKey: DB_USERNAME
         remoteRef:
           key: happypath-db-username
       - secretKey: DB_PASSWORD
         remoteRef:
           key: happypath-db-password
       - secretKey: JWT_SECRET
         remoteRef:
           key: happypath-jwt-secret
       # ... tutti gli altri
   ```

---

## Fase 9 — Deploy con Helm

### 9.1 Prima installazione

```bash
helm upgrade --install happypath ./helm/happypath \
  --namespace happypath \
  --values helm/happypath/values.yaml \
  --values helm/happypath/values-prod.yaml \
  --set backend.image.repository="${REGION}-docker.pkg.dev/${PROJECT_ID}/happypath/backend" \
  --set frontend.image.repository="${REGION}-docker.pkg.dev/${PROJECT_ID}/happypath/frontend" \
  --wait --timeout=10m
```

### 9.2 Verifica il deploy

```bash
kubectl get pods -n happypath
kubectl get ingress -n happypath
kubectl get managedcertificate -n happypath
```

### 9.3 Aggiornamenti successivi (CI/CD)

```bash
export NEW_TAG="1.1.0"
helm upgrade happypath ./helm/happypath \
  --namespace happypath \
  --reuse-values \
  --set backend.image.tag=$NEW_TAG \
  --set frontend.image.tag=$NEW_TAG
```

---

## Fase 10 — Checklist post-deploy

- [ ] `kubectl get pods -n happypath` → tutti i pod in `Running`
- [ ] `kubectl logs -l app.kubernetes.io/name=happypath-backend -n happypath` → nessun errore di startup
- [ ] Flyway ha applicato le migrazioni DB (log backend: `Successfully applied N migrations`)
- [ ] `curl https://happypath.io/api/actuator/health` → `{"status":"UP"}`
- [ ] Il frontend carica correttamente all'URL configurato
- [ ] La ManagedCertificate è in stato `Active`:
  ```bash
  kubectl describe managedcertificate happypath-prod-cert -n happypath
  ```
- [ ] WebSocket funzionante (notifiche real-time)
- [ ] MinIO bucket `happypath-media` creato (se MinIO abilitato)
- [ ] HPA attivi:
  ```bash
  kubectl get hpa -n happypath
  ```

---

## Note sull'architettura in produzione

### Sostituire MinIO con Google Cloud Storage

In produzione (`values-prod.yaml`, `minio.enabled: false`) il backend deve essere configurato per puntare a **GCS con interoperabilità S3**:

1. Abilita l'accesso interoperabilità S3 per GCS nel progetto GCP.
2. Crea un bucket GCS: `gsutil mb -l $REGION gs://happypath-media-prod`
3. Crea le HMAC keys per il Service Account:
   ```bash
   gsutil hmac create happypath-ksa@${PROJECT_ID}.iam.gserviceaccount.com
   ```
4. Aggiorna `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` con le HMAC keys.
5. Imposta `MINIO_ENDPOINT=https://storage.googleapis.com` nei valori Helm.

### WebSocket e GKE Ingress

GKE Ingress (basato su Google Cloud Load Balancer) supporta WebSocket **solo con backend HTTPS e il protocollo HTTP/1.1**. Assicurati che:
- Il path `/ws` nel `Ingress` punti al backend
- Il backend abbia un BackendConfig con `timeoutSec` elevato (es. 3600s) per le sessioni WS longevi

### CI/CD consigliata

Una pipeline Cloud Build o GitHub Actions tipica:
1. Test (`mvn test` / `npm run test`)
2. Build Docker images con tag = commit SHA
3. Push su Artifact Registry
4. `helm upgrade` con il nuovo tag

```yaml
# .github/workflows/deploy.yml (esempio)
name: Deploy to GKE
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker europe-west1-docker.pkg.dev
      - run: |
          TAG=${{ github.sha }}
          docker build -t europe-west1-docker.pkg.dev/$PROJECT_ID/happypath/backend:$TAG ./backend
          docker push europe-west1-docker.pkg.dev/$PROJECT_ID/happypath/backend:$TAG
          docker build -t europe-west1-docker.pkg.dev/$PROJECT_ID/happypath/frontend:$TAG ./frontend
          docker push europe-west1-docker.pkg.dev/$PROJECT_ID/happypath/frontend:$TAG
          helm upgrade happypath ./helm/happypath \
            --namespace happypath --reuse-values \
            --set backend.image.tag=$TAG \
            --set frontend.image.tag=$TAG
        env:
          PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
```
