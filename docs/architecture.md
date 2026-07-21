# Architecture Document

## 1. System Architecture

The AI Task Processing Platform is a monorepo consisting of five components:

```
+-------------------+       +-------------------+
|                   |       |                   |
|   Web (Next.js)   |       |  API (Express)    |
|   Port 3000       |       |  Port 4000        |
|                   |       |                   |
+--------+----------+       +--------+----------+
         |                           |
         | HTTP/JSON                  | HTTP/JSON
         |                           |
         v                           v
+-------------------+       +-------------------+
|                   |       |                   |
|   Ingress         |       |   MongoDB          |
|   (nginx)         |       |   Port 27017       |
|                   |       |                   |
+-------------------+       +-------------------+
         |                           ^
         |                           |
         v                           |
+-------------------+               |
|                   |               |
|   Redis           |               |
|   Port 6379       |               |
|                   |               |
+--------+----------+               |
         |                          |
         | BLPOP / RPUSH             |
         v                          |
+-------------------+               |
|                   |               |
|   Worker (Python) |---------------+
|                   |
+-------------------+
```

**Components:**

- **Web** — Next.js 15 frontend with App Router, Tailwind CSS, React 19. Provides the user interface for task creation, monitoring, and authentication (login/register).
- **API** — Express REST API with TypeScript. Handles authentication (JWT, bcrypt), task CRUD, queue orchestration, and serves as the single backend entry point.
- **Worker** — Python async worker consuming tasks from Redis via BLPOP. Each task is an AI operation executed by the processor, with results written back to MongoDB.
- **MongoDB** — Primary data store for users, tasks, and task results. Accessed by both the API (write tasks, read status) and the worker (update task results).
- **Redis** — Queue backend. The API pushes task IDs via RPUSH to `ai-task-queue`. The worker blocks on BLPOP waiting for new tasks.

## 2. Request Lifecycle

A complete end-to-end flow from user action to result display:

```
User                    Web              API              Redis            Worker            MongoDB
 |                       |                |                 |                 |                  |
 |  1. POST /login       |                |                 |                 |                  |
 |---------------------->|                |                 |                 |                  |
 |                       |  2. POST /api/ |                 |                 |                  |
 |                       |  v1/auth/login |                 |                 |                  |
 |                       |--------------->|                 |                 |                  |
 |                       |                |  3. Verify      |                 |                  |
 |                       |                |  password       |                 |                  |
 |                       |                |  (bcrypt)       |                 |                  |
 |                       |                |  4. Generate    |                 |                  |
 |                       |                |  JWT token      |                 |                  |
 |                       |  5. { token }  |                 |                 |                  |
 |                       |<---------------|                 |                 |                  |
 |  6. Store token       |                |                 |                 |                  |
 |<----------------------|                |                 |                 |                  |
 |                       |                |                 |                 |                  |
 |  7. POST /tasks       |                |                 |                 |                  |
 |---------------------->|                |                 |                 |                  |
 |                       |  8. POST /api/ |                 |                 |                  |
 |                       |  v1/tasks      |                 |                 |                  |
 |                       |--------------->|                 |                 |                  |
 |                       |                |  9. Validate    |                 |                  |
 |                       |                |  JWT (middleware)|                 |                  |
 |                       |                |  10. Insert     |                 |                  |
 |                       |                |  task doc       |                 |                 |
 |                       |                |-------------------------------->|  task.created     |
 |                       |                |  11. RPUSH      |                 |                  |
 |                       |                |  taskId         |                 |                  |
 |                       |                |--------------->|                 |                  |
 |                       |                |                 |  12. BLPOP     |                  |
 |                       |                |                 |<---------------|                  |
 |                       |                |                 |  13. taskId    |                  |
 |                       |                |                 |--------------->|                  |
 |                       |                |                 |                 |  14. Process     |
 |                       |                |                 |                 |  operation       |
 |                       |                |                 |                 |  15. Update      |
 |                       |                |                 |                 |  task result     |
 |                       |                |                 |                 |----------------->|
 |                       |  16. Poll /api/|                 |                 |                  |
 |                       |  v1/tasks/:id  |                 |                 |                  |
 |                       |<---------------|                 |                 |                  |
 |                       |                |  17. Query task |                 |                  |
 |                       |                |-------------------------------->|                  |
 |                       |                |  18. Task doc   |                 |                  |
 |                       |                |<--------------------------------|                  |
 |                       |  19. Status    |                 |                 |                  |
 |                       |  + result      |                 |                 |                  |
 | 20. Display result    |                |                 |                 |                  |
 |<----------------------|                |                 |                 |                  |
```

### Key timing:

| Step | Description | Duration (estimate) |
|------|-------------|---------------------|
| 1-6 | Authentication | < 100ms |
| 7-11 | Task creation + enqueue | < 50ms |
| 12-13 | Queue handoff | < 5ms |
| 14 | AI processing | 100ms–30s (operation-dependent) |
| 15 | Result persistence | < 20ms |
| 16-20 | Polling + display | 3s poll interval |

## 3. Worker Scaling Strategy

The worker deployment is a standard Kubernetes Deployment (not a Job or DaemonSet) because it runs as a long-lived service consuming from a Redis queue.

### Scaling model

```
       Redis Queue (RPUSH/BLPOP)
       +---------------------------+
       | task-1 | task-2 | task-3  |  <- pending tasks
       +---------------------------+
              ^         ^
              | BLPOP   | BLPOP
              v         v
       +-----------+ +-----------+
       | Worker 1  | | Worker 2  |
       +-----------+ +-----------+
```

- **Competing consumer pattern**: All worker pods block on BLPOP against the same `ai-task-queue` list in Redis. Redis guarantees each task is delivered to exactly one consumer.
- **Horizontal scaling**: Add or remove worker pods at any time. Redis BLPOP distributes tasks evenly across available workers.
- **No leader election** required — Redis BLPOP handles atomic task distribution.
- **Graceful shutdown**: Workers catch SIGTERM, complete their current task, and stop polling. In-flight tasks may be re-queued on Redis restart.

### Production configuration

| Environment | Replicas | Rationale |
|-------------|----------|-----------|
| Staging | 1 | Single worker sufficient for low-volume testing |
| Production | 3 | Handles peak load with redundancy during rolling updates |

## 4. Handling 100,000 Tasks Per Day

100,000 tasks/day ~= 1.16 tasks/second average, with potential peaks of 5-10 tasks/second.

### Throughput calculations

| Metric | Value |
|--------|-------|
| Average daily throughput | 100,000 tasks |
| Average sustained rate | ~1.16 tasks/sec |
| Peak rate (2x burst) | ~2.3 tasks/sec |
| Peak rate (10x burst) | ~12 tasks/sec |
| Worker capacity (per pod) | ~20 tasks/sec (assuming 50ms processing) |
| Required workers @ peak | 1 pod (safety margin: 3 pods) |

### Bottleneck analysis

| Component | Capacity | Risk |
|-----------|----------|------|
| Redis RPUSH/BLPOP | 50,000+ ops/sec | None |
| MongoDB writes | 5,000+ writes/sec | None |
| API request handling | 500+ req/sec | None |
| Worker Python processing | 20+ tasks/sec/pod | None |

At 100,000 tasks/day, no component is under stress. The system can handle an order of magnitude more without architectural changes.

## 5. MongoDB Indexing Strategy

### Collections and indexes

**users collection:**
| Field | Index Type | Purpose |
|-------|-----------|---------|
| `email` | Unique | Efficient login lookups and duplicate prevention |

**tasks collection:**
| Field | Index Type | Purpose |
|-------|-----------|---------|
| `userId` | Ascending | Filter tasks by owner (all queries include userId) |
| `status` | Ascending | Filter by pending/completed/failed status |
| `createdAt` | Descending | Sort by creation time for paginated listings |
| `userId + createdAt` | Compound | Cover most list queries in a single index scan |
| `status + createdAt` | Compound | Admin queries filtering by status over time |

### Index size estimate at 100,000 tasks

| Index | Estimated Size |
|-------|---------------|
| `userId` | ~2 MB |
| `createdAt` | ~2 MB |
| `userId + createdAt` | ~3 MB |
| `status` | ~0.5 MB |

Total index footprint: ~10 MB — negligible for MongoDB.

## 6. Redis Failure and Recovery Strategy

### Failure scenarios

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Redis process crash | Tasks cannot be enqueued or consumed | Kubernetes restarts the pod; pending tasks remain in Redis persistence file (RDB/AOF) |
| Redis pod restart | Brief queue unavailability (seconds) | API worker retry with backoff; worker BLPOP timeout reconnects |
| Full data loss | In-flight queue tasks lost | Tasks in `pending` status in MongoDB are not re-enqueued automatically (design choice — see below) |
| Network partition | Queue unavailable | API returns 503 for task creation; worker exits with connection error |

### Mitigation

- **Persistence**: Redis `appendonly yes` with AOF fsync every second. RDB snapshots every 5 minutes.
- **Backup**: Redis data is ephemeral by design. The queue is a transient buffer — durable state lives in MongoDB.
- **Task recovery**: Tasks are created in MongoDB (`status: pending`) before being enqueued to Redis. If Redis data is lost, a reconciliation script can re-enqueue tasks where `status: pending` and `createdAt > now - 24h`. This script is not part of the critical path.
- **Retry logic**: API uses `ioredis` with built-in retry strategy. Worker uses `redis-py` with `retry_on_timeout=True`.

## 7. Deployment Strategy

### Staging

| Aspect | Configuration |
|--------|--------------|
| Purpose | Integration testing, pre-production validation |
| Kubernetes overlay | `k8s/overlays/staging` |
| Replicas | API: 1, Web: 1, Worker: 1 |
| Resources | 50% of production requests/limits |
| CI/CD | Lint + typecheck only; images built on merge to main |
| Argo CD | Optional; can be applied manually via `kubectl apply -k` |
| Domain | staging.ai-task-platform.example.com |

### Production

| Aspect | Configuration |
|--------|--------------|
| Purpose | Live user-facing service |
| Kubernetes overlay | `k8s/overlays/production` |
| Replicas | API: 2, Web: 2, Worker: 3 |
| Resources | Full requests/limits |
| CI/CD | Lint → Build & Push → Update Infra (automatic) |
| Argo CD | Auto-sync from `k8s/overlays/production` |
| Domain | app.ai-task-platform.example.com |

### Rollout strategy

1. PR merged to `main` on application repository
2. `build-and-push.yml` builds images tagged `sha-<commit>` and `latest`
3. `update-infra.yml` updates image tags in `ai-task-platform-infra` repository
4. Argo CD detects drift and syncs the production overlay
5. Kubernetes performs a rolling update (no downtime with 2+ replicas)

## 8. Security Considerations

| Measure | Implementation | Purpose |
|---------|---------------|---------|
| **JWT authentication** | `jsonwebtoken` with HMAC-SHA256, 7-day expiry | Stateless auth for API; token stored in localStorage by frontend |
| **Password hashing** | `bcryptjs` with 10 salt rounds | Protects credentials at rest; computationally expensive to brute-force |
| **Secrets management** | Kubernetes Secrets + Kustomize `secretGenerator`; no secrets in version control | JWT_SECRET, MONGODB_URI, REDIS_PASSWORD are injected at deploy time |
| **Rate limiting** | `express-rate-limit` on all routes | Prevents brute-force auth attacks and API abuse |
| **HTTP headers** | `helmet` middleware | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| **Input validation** | Zod schemas on all API endpoints | Prevents injection and malformed data attacks |
| **Auth middleware** | JWT verification on all protected routes | Ensures only authenticated users access their resources |
| **Ownership checks** | Task queries filtered by `userId` from JWT | Users cannot access other users' tasks |
| **CORS** | `cors` middleware configured with `CLIENT_URL` | Only the frontend origin can make API requests |

### Security considerations for production

- Replace `change-me-in-production` JWT secret with a cryptographically random value (64+ bytes, base64-encoded)
- Enable HTTPS via cert-manager or cloud provider TLS termination
- Add network policies to restrict pod-to-pod communication
- Enable MongoDB authentication (currently disabled for local development)
- Rotate JWT secrets periodically

## 9. Observability

### Logging

| Component | Library | Output |
|-----------|---------|--------|
| API | Structured logger (custom) | JSON lines to stdout |
| Worker | Python `logging` | Structured format to stdout |
| Web | Next.js built-in | Console output |

All container logs are captured by Kubernetes and accessible via:

```bash
kubectl logs -n ai-task-platform deployment/api
kubectl logs -n ai-task-platform deployment/worker
kubectl logs -n ai-task-platform deployment/web
```

### Health checks

| Component | Endpoint / Command | Purpose |
|-----------|-------------------|---------|
| API | `GET /api/v1/health` | Liveness + readiness probe; verifies server is responding |
| Web | `GET /` | Liveness + readiness probe; verifies Next.js is serving |
| MongoDB | `mongosh --eval "db.adminCommand('ping')"` | Verifies database process is alive |
| Redis | `redis-cli ping` | Verifies Redis process is alive |
| Worker | `python -c "import sys; sys.exit(0)"` | Verifies Python runtime is running |

### Probes in Kubernetes

| Deployment | Liveness | Readiness | Failure Threshold |
|-----------|----------|-----------|-------------------|
| api | HTTP GET `/api/v1/health` :4000 | Same as liveness | 3 failures |
| web | HTTP GET `/` :3000 | Same as liveness | 3 failures |
| worker | Exec: `python -c "import sys; sys.exit(0)"` | Same as liveness | 3 failures |
| mongodb | Exec: `mongosh ping` | Same as liveness | 5 failures (startup) |
| redis | Exec: `redis-cli ping` | Same as liveness | 3 failures |
