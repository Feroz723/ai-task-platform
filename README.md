# AI Task Processing Platform

A production-ready monorepo for AI-powered task processing with Next.js frontend, Express API, Python async worker, and GitOps deployment via Kubernetes + Argo CD.

---

## Architecture

```
                    +-------------------+
                    |                   |
                    |   Web (Next.js)   |
                    |   :3000           |
                    |                   |
                    +---------+---------+
                              |
                              | HTTP / JSON
                              v
+-------------------+  +-------------------+  +-------------------+
|                   |  |                   |  |                   |
|   MongoDB         |  |   API (Express)   |  |   Redis            |
|   :27017          |  |   :4000           |  |   :6379            |
|                   |  |                   |  |                   |
+--------+----------+  +---------+---------+  +--------+----------+
         ^                        |                     |
         |                        | RPUSH               | BLPOP
         |                        v                     |
         |               +-------------------+          |
         |               |                   |          |
         +---------------+   Worker (Python) |----------+
                         |                   |
                         +-------------------+

Services:
  Web     – Next.js 15 (TypeScript, Tailwind, React 19)
  API     – Express REST API (TypeScript, Mongoose, JWT)
  Worker  – Python async consumer (BLPOP from Redis)
  MongoDB – Primary data store
  Redis   – Task queue (RPUSH / BLPOP on ai-task-queue)
```

---

## Prerequisites

- Node.js >= 20
- Python >= 3.11
- Docker & Docker Compose (for containerized setup)
- kubectl + k3s / kind (for Kubernetes deployment)
- Argo CD (for GitOps)

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Build shared packages
npm run build:shared-types

# 3. Start services (requires MongoDB + Redis running locally on default ports)

# Terminal 1 – API (http://localhost:4000)
npm run dev:api

# Terminal 2 – Web (http://localhost:3000)
npm run dev:web

# Terminal 3 – Worker
cd apps/worker
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

---

## Docker Usage

```bash
# Build images
npm run docker:build

# Start all services in background
JWT_SECRET=your-32-char-secret npm run docker:up

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

| Service  | Port  | Container         |
|----------|-------|-------------------|
| Web      | 3000  | ai-task-web       |
| API      | 4000  | ai-task-api       |
| Worker   | —     | ai-task-worker    |
| MongoDB  | 27017 | ai-task-mongodb   |
| Redis    | 6379  | ai-task-redis     |

Volumes: `mongodb-data`, `redis-data`

---

## Kubernetes Deployment

### Infrastructure repository

All Kubernetes manifests live in a separate repository:
[ai-task-platform-infra](https://github.com/Feroz723/ai-task-platform-infra)

### Apply directly

```bash
# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/production

# Preview rendered manifests
kubectl kustomize k8s/overlays/production
```

### Replica counts

| Service | Staging | Production |
|---------|---------|------------|
| API     | 1       | 2          |
| Web     | 1       | 2          |
| Worker  | 1       | 3          |
| MongoDB | 1       | 1          |
| Redis   | 1       | 1          |

### Ingress routes

| Path   | Backend | Port |
|--------|---------|------|
| `/api` | api     | 4000 |
| `/`    | web     | 3000 |

Requires nginx ingress controller. On k3s, install with:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

---

## Argo CD Setup

```bash
# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create the application
kubectl apply -f ai-task-platform-infra/argocd/application.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

The Application manifest points to `k8s/overlays/production` and enables:
- **Automated sync** – deploys changes automatically
- **Self-heal** – corrects manual drift
- **Prune** – removes resources removed from Git

---

## CI/CD Pipelines

### Workflows

| Workflow          | Trigger                                   | Actions                                                    |
|-------------------|-------------------------------------------|------------------------------------------------------------|
| `lint.yml`        | PR + push to `main`                       | checkout, npm ci, build shared-types, lint, typecheck      |
| `build-and-push`  | push to `main`                            | Build + push `web`, `api`, `worker` images to GHCR         |
| `update-infra`    | on completion of `build-and-push`         | Update image tags in infra repo, commit + push             |

### Image tags

- `ghcr.io/<org>/ai-task-platform/web:sha-<commit>` (unique)
- `ghcr.io/<org>/ai-task-platform/web:latest`
- Same pattern for `api` and `worker`

### End-to-end flow

```
PR merged → lint.yml (pass) → build-and-push.yml (images pushed)
  → update-infra.yml (tags updated) → Argo CD detects drift
  → Kubernetes rolling update (zero-downtime)
```

---

## Repository Structure

```
ai-task-platform/
├── .github/workflows/       # CI/CD pipeline definitions
│   ├── lint.yml             # Lint + typecheck
│   ├── build-and-push.yml   # Container image builds
│   └── update-infra.yml     # Infrastructure tag updates
├── apps/
│   ├── web/                 # Next.js frontend (TypeScript)
│   │   ├── src/             # App Router pages & components
│   │   ├── Dockerfile       # 3-stage build
│   │   └── .dockerignore
│   ├── api/                 # Express REST API (TypeScript)
│   │   ├── src/             # Routes, middleware, services
│   │   ├── Dockerfile       # 3-stage build
│   │   └── .dockerignore
│   └── worker/              # Python async worker
│       ├── app/             # Consumer & processor
│       ├── Dockerfile       # 2-stage build
│       └── .dockerignore
├── packages/
│   ├── shared-types/        # Shared TypeScript type definitions
│   └── eslint-config/       # Shared ESLint configuration
├── docs/
│   └── architecture.md      # Full architecture documentation
├── docker-compose.yml       # Local container orchestration
├── package.json             # Workspace root
└── tsconfig.base.json       # Shared TypeScript config
```

Infrastructure repository (`ai-task-platform-infra`):

```
ai-task-platform-infra/
├── k8s/
│   ├── base/                # Shared base Kustomize resources
│   │   ├── namespace.yaml, configmap.yaml, ingress.yaml
│   │   ├── mongodb/, redis/, api/, worker/, web/
│   │   └── kustomization.yaml
│   ├── overlays/
│   │   ├── staging/         # 1 replica, smaller resources
│   │   └── production/      # Full replica counts, larger resources
│   └── README.md
├── argocd/
│   └── application.yaml     # Argo CD Application manifest
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| MongoDB connection refused | Database not running | Start `mongod` or Docker container |
| Redis connection refused | Redis not running | Start `redis-server` or Docker container |
| Worker exits immediately | Redis unreachable | Check `REDIS_URL` env var; ensure Redis is healthy |
| Frontend shows blank page | API URL misconfigured | Verify `NEXT_PUBLIC_API_URL` points to running API |
| 401 on API requests | JWT token expired or missing | Re-login; check localStorage for token |
| Auth fails in Docker | JWT_SECRET not set | Pass `JWT_SECRET=... npm run docker:up` |
| `wget --spider` error | BusyBox wget (no --spider) | Fixed in latest Docker Compose |
| `ps: command not found` | procps not in slim image | Fixed in latest Docker Compose |

---

## Project Status

Complete. All phases implemented:

- [x] Monorepo scaffolding & shared packages
- [x] Express API with auth, task CRUD, queue
- [x] Python async worker (Redis BLPOP consumer)
- [x] Next.js frontend with auth & task management
- [x] Docker Compose orchestration (5 services)
- [x] Kubernetes manifests (Kustomize + Argo CD)
- [x] CI/CD pipelines (lint, build, deploy)
- [x] Architecture documentation
