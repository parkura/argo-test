# GitOps simulation — runbook

## 1. One-time setup

```bash
# cluster + Argo CD (same minor as the argocd CLI here, v3.0.x)
kind create cluster --name gitops-sim
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.0.12/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server

# CLI login
kubectl -n argocd port-forward svc/argocd-server 8080:443 &
argocd admin initial-password -n argocd
argocd login localhost:8080 --username admin --insecure

# register ghcr as an OCI helm repo + create the appset
kubectl apply -f argocd/repo-secret.yaml
kubectl apply -f argocd/applicationset.yaml
```

After the FIRST CI run: ghcr packages are private by default, even in a
public repo. Make them public once (github.com → profile → Packages →
each of: shared-backend, web-app, admin-app, ticker-cron, and the 6
helm-charts/* entries → Package settings → Change visibility → Public).
Until then Argo shows `unable to resolve` and pods hit ImagePullBackOff.

## 2. The core loop

```bash
# 1. change something (e.g. src/server.mjs), push to main
# 2. wait for the ci-cd-oci workflow to finish (pushes images + 6 charts)
# 3. apps flip to OutOfSync once Argo re-resolves 1.0.* (~3 min polling,
#    or force it: argocd app get <app> --hard-refresh)
# 4. sync from the UI, or:
argocd app sync gateway-service order-service inventory-service
```

## 3. Test scenarios

**Semver resolution.** After a CI run, `argocd app get order-service --hard-refresh`
— `1.0.*` resolves to the newest chart version. Then prove the prerelease
trap: `helm push` a chart packaged as `--version 1.0.999-test` and watch
Argo ignore it entirely.

**Rolling deploys are not atomic.** Sync the three backend apps and
immediately watch mixed versions during the rollout:

```bash
kubectl -n sim port-forward svc/gateway-service 3000:3000 &
watch -n1 'curl -s localhost:3000/composed'
```

`/composed` aggregates the peer services' versions gateway-style — during
the rolling window you SEE old and new versions composed together.

**Rollback without git.** Pin a previous chart version:

```bash
argocd app set order-service --revision 1.0.<previous>
argocd app sync order-service
# back to floating:
argocd app set order-service --revision '1.0.*'
```

Note what this demonstrates: the rollback state lives in the Application
spec, not in git — the audit-trail tradeoff of the no-write-back model.

**Update latency.** Push to main, run nothing, and time how long until
apps flip to OutOfSync (default repo polling ~3 min, plus OCI index
cache) — that lag is the cost of having no explicit trigger.

## 4. Reset

```bash
kind delete cluster --name gitops-sim
```
