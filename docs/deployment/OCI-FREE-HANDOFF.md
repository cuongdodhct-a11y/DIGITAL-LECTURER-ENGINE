# OCI Free deployment handoff

## Required user-side access

The deployment workflow is ready, but the assistant cannot create an Oracle Cloud tenancy or accept Oracle account terms on the user's behalf.

Create one OCI Always Free VM in the tenancy's home region:

- Shape: `VM.Standard.A1.Flex`
- Architecture: ARM64
- Initial allocation: **2 OCPU / 12 GB RAM** to stay within the current Always Free tenancy allowance documented by Oracle.
- Boot volume: **50 GB**
- Public IPv4: enabled
- OS: Oracle Linux ARM64
- Open only SSH (22) initially. Port 3000 may be opened temporarily for first verification; production should later use HTTPS on 443.

Oracle currently documents Always Free A1 for an Always Free tenancy as 2 OCPUs + 12 GB memory; the broader A1 entitlement shown for other tenancy/account states can be higher. Do not allocate above the confirmed free allowance shown in the OCI Console for the user's tenancy.

## GitHub Actions secrets

In the repository settings, add these **Actions secrets**:

- `OCI_HOST` — public IPv4 address or DNS name of the OCI VM.
- `OCI_USER` — SSH user, normally `opc` for Oracle Linux.
- `OCI_SSH_PRIVATE_KEY` — the private SSH key corresponding to the public key installed on the VM. Put it only in GitHub Secrets; never paste it into chat or source.
- `OCI_KNOWN_HOSTS` — output of `ssh-keyscan -H <OCI_HOST>` performed from a trusted machine after independently verifying the VM fingerprint.
- `OCI_APP_DIR` — optional; default is `/opt/digital-lecturer-engine`.

## One-time VM preparation

SSH to the VM and install the container runtime:

```bash
sudo dnf -y install container-tools git
sudo systemctl enable --now podman.socket
sudo mkdir -p /opt/digital-lecturer-engine
sudo chown -R $(id -un):$(id -gn) /opt/digital-lecturer-engine
```

Create the runtime environment file:

```bash
nano /opt/digital-lecturer-engine/.env
chmod 600 /opt/digital-lecturer-engine/.env
```

Do not commit `.env`.

## Storage guardrails

The workflow deliberately:

1. Refuses deployment when the deployment filesystem has less than 15 GiB free.
2. Excludes `.git`, `node_modules`, IDE files and runtime `data/` from the upload bundle.
3. Keeps runtime data outside release directories.
4. Keeps only the newest 3 source releases.
5. Removes only dangling container image layers after a verified deployment.
6. Never runs volume pruning.
7. Never deletes the runtime data directory.

The target boot volume is 50 GB initially. If VieNeu model/cache data requires more space, expand only the OCI Always Free block-volume allowance after measuring actual usage.

## Deployment flow

```
GitHub branch deploy-oci-free
        |
        v
GitHub Actions
        |
        | SSH/SCP
        v
OCI ARM64 VM
        |
        v
Podman Compose
        |
        v
Digital Lecturer Engine
        |
        +--> /healthz
        +--> /api/...
        +--> runtime data
```

The deployment is not considered complete until the workflow's remote smoke test returns HTTP 200 from `/healthz`.

## Safety boundary

This deployment is independent of the frozen Vercel project. It does not delete, reset, redeploy, or modify the existing Vercel application.

Vercel remediation will be handled only after the OCI deployment is independently running and verified.
