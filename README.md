# GitOps deployment simulation

Miniature of a monorepo GitOps deployment model — Helm OCI charts in ghcr,
Argo CD tracking `1.0.*`, no git write-back — sized to run on a local kind
cluster.

- 3 backend services (`order`, `inventory`, `gateway`) sharing **one**
  Docker image (`shared-backend`, identity via `SERVICE_NAME` env)
- 2 frontends (`web-app`, `admin-app`) with independent images
- 1 cronjob (`ticker-cron`)
- every deployable keeps its Helm chart next to its code
  (`services/<name>/chart/<chart-name>/`)

The gateway service composes its peers' versions at `/composed` — during a
rolling deploy you can watch old and new versions being served together
(the mixed-version window that makes "atomic" multi-service deploys hard).

Start with [RUNBOOK.md](RUNBOOK.md).
