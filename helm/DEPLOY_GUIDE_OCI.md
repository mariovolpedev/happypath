# HappyPath — Guida al Deploy su Oracle Cloud (OKE) Always Free

Questa guida copre il deploy completo di HappyPath su **Oracle Kubernetes Engine (OKE)** sfruttando il **Always Free Tier** di Oracle Cloud. L'infrastruttura è **completamente gratuita e permanente**.

---

## Risorse Always Free disponibili

| Risorsa | Quota free |
|---|---|
| CPU ARM (Ampere A1) | 4 core totali |
| RAM | 24 GB totali |
| Block Volume (storage) | 200 GB totali |
| Object Storage | 20 GB |
| Load Balancer | 1 (10 Mbps) |
| VM AMD | 2x micro (1 GB RAM ciascuna) |

HappyPath gira comodamente nei 4 core / 24 GB con tutti i servizi (backend, frontend, PostgreSQL, Redis, MinIO).

---

## Prerequisiti

| Tool | Versione minima |
|---|---|
| `oci` CLI | >= 3.40 |
| `kubectl` | >= 1.29 |
| `helm` | >= 3.14 |
| Docker | >= 24 |

Installazione OCI CLI:
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
oci setup config   # inserisci tenancy OCID, user OCID, region, genera API key
```

---

## Fase 1 — Account e tenancy OCI

1. Registrati su https://cloud.oracle.com/free (carta di credito richiesta per verifica, non viene addebitata nulla)
2. Scegli la **home region** più vicina, es. `eu-frankfurt-1` — **non puoi cambiarla dopo**
3. Annota:
   - **Tenancy OCID**: `ocid1.tenancy.oc1..xxxxxx`
   - **Tenancy namespace**: visibile in *Object Storage → Namespace* (es. `abcdefgh1234`)
   - **Region key**: es. `fra` per Frankfurt, `lhr` per London

---

## Fase 2 — Crea il cluster OKE (Always Free)

### 2.1 Via OCI Console (consigliato prima volta)

1. Vai su **Developer Services → Kubernetes Clusters (OKE)**
2. Clicca **Create Cluster → Quick Create**
3. Configura:
   - **Name**: `happypath-cluster`
   - **Kubernetes version**: ultima stabile (es. `v1.30`)
   - **Shape nodi**: `VM.Standard.A1.Flex` (ARM) → **4 OCPU, 24 GB RAM** (massimo free)
   - **Number of nodes**: 1 (un singolo nodo da 4 core / 24 GB)
   - **Boot volume**: 50 GB
4. Clicca **Create** — attendi ~10 minuti

### 2.2 Ottieni le credenziali kubectl

```bash
oci ce cluster create-kubeconfig \
  --cluster-id <CLUSTER_OCID> \
  --file $HOME/.kube/config \
  --region eu-frankfurt-1 \
  --token-version 2.0.0

kubectl get nodes   # verifica: 1 nodo Ready
```

### 2.3 Crea il namespace

```bash
kubectl create namespace happypath
```

---

## Fase 3 — Oracle Container Registry (OCIR)

OCIR è il registry Docker di OCI. Il free tier include storage gratuito per immagini private.

### 3.1 Crea un Auth Token

1. In OCI Console → **Identity → Users → Il tuo utente → Auth Tokens**
2. Clicca **Generate Token** → copia il token (visibile solo una volta)

### 3.2 Login Docker su OCIR

```bash
export REGION="eu-frankfurt-1"         # la tua region
export TENANCY_NS="abcdefgh1234"        # il tuo namespace tenancy
export OCI_USER_EMAIL="tua@email.com"  # email account OCI

docker login ${REGION}.ocir.io \
  --username "${TENANCY_NS}/${OCI_USER_EMAIL}" \
  --password "IL_TUO_AUTH_TOKEN"
```

### 3.3 Build e push delle immagini

```bash
export REPO="${REGION}.ocir.io/${TENANCY_NS}/happypath"
export TAG="1.0.0"

# Backend
cd backend
docker buildx build --platform linux/arm64 -t ${REPO}/backend:${TAG} . --push

# Frontend
cd ../frontend
docker buildx build --platform linux/arm64 -t ${REPO}/frontend:${TAG} . --push
```

> ⚠️ **Importante — ARM64**: il nodo OKE usa CPU ARM (A1). Le immagini devono essere compilate per `linux/arm64`.
> Le immagini base (`openjdk`, `node`, `nginx`, `postgres`, `redis`) hanno tutte varianti ARM64 su Docker Hub.
> Usa `docker buildx` con `--platform linux/arm64` oppure una pipeline CI che gira su ARM.

### 3.4 Crea il Secret per il pull delle immagini

```bash
kubectl create secret docker-registry ocir-secret \
  --namespace happypath \
  --docker-server=${REGION}.ocir.io \
  --docker-username="${TENANCY_NS}/${OCI_USER_EMAIL}" \
  --docker-password="IL_TUO_AUTH_TOKEN"
```

Aggiungi `imagePullSecrets` al ServiceAccount:
```bash
kubectl patch serviceaccount happypath-sa \
  --namespace happypath \
  -p '{"imagePullSecrets": [{"name": "ocir-secret"}]}'
```

---

## Fase 4 — NGINX Ingress Controller

OKE non include un Ingress controller di default. Installa NGINX:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

Attendi che il LoadBalancer OCI venga assegnato (1-2 minuti):

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
# Annota l'EXTERNAL-IP (es. 130.61.x.x)
```

---

## Fase 5 — DNS

Nel tuo provider DNS, crea un record **A** che punta il tuo dominio (es. `happypath.example.com`) all'IP del LoadBalancer ottenuto sopra.

Se non hai un dominio, puoi usare un servizio gratuito come **nip.io**:
- Es: `130.61.10.20.nip.io` risolve automaticamente a `130.61.10.20`
- Imposta `ingress.host: "130.61.10.20.nip.io"` nel values

---

## Fase 6 — cert-manager (TLS Let's Encrypt gratuito)

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

Verifica che i pod siano Running:
```bash
kubectl get pods -n cert-manager
```

Il `ClusterIssuer` Let's Encrypt viene creato automaticamente dall'Helm chart di HappyPath (template `cert-manager-issuer.yaml`) quando `ingress.tls.enabled: true`.

> ⚠️ Prima di abilitare TLS, assicurati che il DNS stia risolvendo correttamente — Let's Encrypt fallirà altrimenti.

---

## Fase 7 — Secrets Kubernetes

```bash
kubectl create secret generic happypath-secrets \
  --namespace happypath \
  --from-literal=DB_USERNAME=happypath_user \
  --from-literal=DB_PASSWORD=$(openssl rand -base64 16) \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=MINIO_ACCESS_KEY=minioadmin \
  --from-literal=MINIO_SECRET_KEY=$(openssl rand -base64 16) \
  --from-literal=ACTUATOR_USER=actuator \
  --from-literal=ACTUATOR_PASSWORD=$(openssl rand -base64 12) \
  --from-literal=REDIS_PASSWORD=""
```

Salva le password generate da qualche parte sicura (es. password manager).

---

## Fase 8 — Deploy con Helm

```bash
# Prima di eseguire, aggiorna values-oci.yaml con i tuoi valori:
# - backend.image.repository: eu-frankfurt-1.ocir.io/TUO_NAMESPACE/happypath/backend
# - frontend.image.repository: eu-frankfurt-1.ocir.io/TUO_NAMESPACE/happypath/frontend
# - ingress.host: il tuo dominio o IP.nip.io

helm upgrade --install happypath ./helm/happypath \
  --namespace happypath \
  --values helm/happypath/values.yaml \
  --values helm/happypath/values-oci.yaml \
  --wait --timeout=10m
```

---

## Fase 9 — Verifica

```bash
# Tutti i pod Running?
kubectl get pods -n happypath

# Ingress con IP assegnato?
kubectl get ingress -n happypath

# Certificato TLS emesso?
kubectl get certificate -n happypath

# Log backend (Flyway migrazioni OK?)
kubectl logs -l app.kubernetes.io/name=happypath-backend -n happypath --tail=50

# Health check
curl https://happypath.example.com/api/actuator/health
```

---

## Fase 10 — Checklist post-deploy

- [ ] Tutti i pod in `Running` (backend, frontend, postgres, redis, minio)
- [ ] `happypath-minio-init` Job completato (`Completed`)
- [ ] Flyway: log backend mostra `Successfully applied N migrations`
- [ ] `curl https://<host>/api/actuator/health` → `{"status":"UP"}`
- [ ] Frontend caricabile nel browser
- [ ] Certificato TLS `Ready: True`
- [ ] WebSocket (notifiche real-time) funzionante
- [ ] Upload media su MinIO funzionante

---

## Note importanti OCI

### Storage class
OKE usa `oci-bv` (Block Volume) come storage class di default — già configurato in `values-oci.yaml`. I Block Volume OCI hanno un minimo fatturabile di **50 GB** anche se richiedi meno, ma rientrano nel free tier (200 GB totali).

### ARM64 e Spring Boot
Spring Boot 3.2 + Java 21 girano perfettamente su ARM64. L'immagine base consigliata per il backend:
```dockerfile
FROM eclipse-temurin:21-jre-alpine
# oppure
FROM amazoncorretto:21-alpine
```
Entrambe hanno immagini ARM64 su Docker Hub.

### WebSocket e timeout LoadBalancer OCI
Il LoadBalancer OCI ha un timeout di idle di default di **60 secondi** — troppo poco per sessioni WebSocket longeve. Aumentalo:
```bash
kubectl annotate svc ingress-nginx-controller \
  -n ingress-nginx \
  oci.oraclecloud.com/load-balancer-type="lb" \
  service.beta.kubernetes.io/oci-load-balancer-connection-idle-timeout="3600"
```

### Aggiornamenti immagini
```bash
export NEW_TAG="1.1.0"
docker buildx build --platform linux/arm64 -t ${REPO}/backend:${NEW_TAG} ./backend --push
docker buildx build --platform linux/arm64 -t ${REPO}/frontend:${NEW_TAG} ./frontend --push

helm upgrade happypath ./helm/happypath \
  --namespace happypath \
  --reuse-values \
  --set backend.image.tag=$NEW_TAG \
  --set frontend.image.tag=$NEW_TAG
```
