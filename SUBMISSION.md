# AI Task Processing Platform — Submission Package

## Project Title

AI Task Processing Platform

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Express, TypeScript, Mongoose, JWT, bcrypt |
| Worker | Python 3.12, redis-py, pydantic-settings |
| Database | MongoDB 7 |
| Queue | Redis 7 (RPUSH / BLPOP) |
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes (k3s-compatible), Kustomize |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |

## Features

- User authentication (register / login) with JWT + bcrypt
- Task CRUD with ownership enforcement
- AI task queue using Redis (RPUSH / BLPOP)
- Python async worker processing tasks from the queue
- Task status polling on the frontend
- Responsive UI with reusable components
- Docker Compose orchestration (5 services)
- Kubernetes manifests with Kustomize overlays (staging / production)
- Argo CD GitOps deployment
- CI/CD pipelines: lint, build & push, infra update

## Architecture Summary

```
User → Web (Next.js) → API (Express) → Redis Queue → Worker (Python) → MongoDB
```

- The API authenticates users, accepts task requests, writes to MongoDB, and enqueues task IDs in Redis.
- The Python worker blocks on BLPOP, processes tasks, and writes results back to MongoDB.
- The frontend polls the API for task status and displays results.

## Repositories

| Repository | URL |
|------------|-----|
| Application | https://github.com/Feroz723/ai-task-platform |
| Infrastructure | https://github.com/Feroz723/ai-task-platform-infra |

## Local Setup

```bash
# Prerequisites: Node.js >= 20, Python >= 3.11, MongoDB, Redis

git clone https://github.com/Feroz723/ai-task-platform.git
cd ai-task-platform

# Install dependencies
npm install
npm run build:shared-types

# Terminal 1 — API
npm run dev:api

# Terminal 2 — Web
npm run dev:web

# Terminal 3 — Worker
cd apps/worker
pip install -r requirements.txt
python main.py
```

## Docker Setup

```bash
# Build and start all services
npm run docker:build
JWT_SECRET=your-secret-key npm run docker:up
npm run docker:logs

# Stop
npm run docker:down
```

## Kubernetes Deployment

```bash
# Clone the infrastructure repository
git clone https://github.com/Feroz723/ai-task-platform-infra.git
cd ai-task-platform-infra

# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/production

# Preview rendered manifests
kubectl kustomize k8s/overlays/production
```

## Argo CD

```yaml
# Application points to: k8s/overlays/production
# Auto-sync: enabled
# Self-heal: enabled
# Prune: enabled
```

The Argo CD Application manifest is at `argocd/application.yaml` in the infrastructure repository.

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| lint.yml | PR / push to main | Lint + typecheck |
| build-and-push.yml | push to main | Build 3 Docker images, push to GHCR |
| update-infra.yml | After build-and-push | Update image tags in infra repo, commit + push |

Images tagged with `sha-<commit>` and `latest` on GHCR:
- `ghcr.io/Feroz723/ai-task-platform/web`
- `ghcr.io/Feroz723/ai-task-platform/api`
- `ghcr.io/Feroz723/ai-task-platform/worker`

## Replica Counts

| Service | Staging | Production |
|---------|---------|------------|
| API | 1 | 2 |
| Web | 1 | 2 |
| Worker | 1 | 3 |
| MongoDB | 1 | 1 |
| Redis | 1 | 1 |

## Ingress Routes

| Path | Backend | Port |
|------|---------|------|
| `/api` | api | 4000 |
| `/` | web | 3000 |

Requires nginx ingress controller.
