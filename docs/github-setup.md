# GitHub Actions Setup Guide

This guide covers the one-time GitHub configuration required to enable CI/CD for the AI Task Platform.

---

## 1. Required Repository Secrets

Create these secrets in **both** repositories under `Settings > Secrets and variables > Actions > New repository secret`:

| Secret | Where | Value |
|--------|-------|-------|
| `INFRA_REPO_TOKEN` | `Feroz723/ai-task-platform` | A GitHub Personal Access Token (classic) with `repo` scope, used by `update-infra.yml` to push to the infra repo |
| `GITHUB_TOKEN` | Auto-provided | Automatically available in all workflow runs — no setup needed |

### Additional secrets for production (recommended)

| Secret | Where | Value |
|--------|-------|-------|
| `JWT_SECRET` | `Feroz723/ai-task-platform-infra` | A cryptographically random string (64+ bytes, base64-encoded) |
| `MONGODB_URI` | `Feroz723/ai-task-platform-infra` | Full MongoDB connection string |
| `REDIS_PASSWORD` | `Feroz723/ai-task-platform-infra` | Redis password if authentication is enabled |

---

## 2. How to Create INFRA_REPO_TOKEN

1. Go to `GitHub.com > Settings > Developer settings > Personal access tokens > Tokens (classic)`
2. Click **Generate new token (classic)**
3. Give it a name like `ai-task-platform-infra-token`
4. Select the `repo` scope (full control of private repositories)
5. Click **Generate token**
6. Copy the token immediately (it will not be shown again)
7. Go to `https://github.com/Feroz723/ai-task-platform/settings/secrets/actions`
8. Click **New repository secret**
9. Name: `INFRA_REPO_TOKEN`
10. Value: paste the token
11. Click **Add secret**

---

## 3. Required GitHub Permissions

The workflows require these permissions:

### lint.yml
- `contents: read` (default) — checkout code

### build-and-push.yml
- `contents: read` — checkout code
- `packages: write` — push container images to GHCR
- `attestations: write` — attest build provenance

These are configured via the `permissions:` block in the workflow. No manual action required.

### update-infra.yml
- `contents: write` — uses `INFRA_REPO_TOKEN` (not `GITHUB_TOKEN`) to push to the infra repo
- Token with `repo` scope is required (see step 2)

---

## 4. How to Enable Actions

GitHub Actions is enabled by default on all repositories. Verify:

1. Go to `https://github.com/Feroz723/ai-task-platform/settings/actions`
2. Ensure **Allow all actions and reusable workflows** is selected
3. Scroll to **Workflow permissions** and ensure **Read and write permissions** is selected
4. Save if changes were made

---

## 5. How to Trigger the Pipeline

### lint.yml

Triggers automatically:
- On **pull request** to `main`
- On **push** to `main`

### build-and-push.yml

Triggers automatically:
- On **push** to `main`

### update-infra.yml

Triggers automatically:
- After **build-and-push** completes successfully

### Manual trigger

You can also run workflows manually:

1. Go to `https://github.com/Feroz723/ai-task-platform/actions`
2. Select the workflow from the sidebar
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

### First-time setup

```bash
# Push to main to trigger the full pipeline
git push origin main
```

The first run will:
1. Run lint checks
2. Build and push 3 Docker images to GHCR (`web`, `api`, `worker`)
3. Update image tags in the infra repository
4. Argo CD detects the change and syncs the production overlay

---

## 6. Verify Workflow Runs

Check workflow status at:

```
https://github.com/Feroz723/ai-task-platform/actions
```

Container images appear at:

```
https://github.com/Feroz723/ai-task-platform/pkgs/container/ai-task-platform%2Fweb
https://github.com/Feroz723/ai-task-platform/pkgs/container/ai-task-platform%2Fapi
https://github.com/Feroz723/ai-task-platform/pkgs/container/ai-task-platform%2Fworker
```
