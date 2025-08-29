# K8s layout (GitOps-friendly)
.
├─ base/         # namespaces, network policies, shared defaults
├─ components/   # reusable blocks (db, redis, otel collector)
├─ apps/         # app-specific kustomizations (frontend, api-python)
└─ overlays/     # dev/staging/prod patches

Keep layers shallow (2–3). Use Kustomize. Block unsafe specs with OPA/Gatekeeper.
