---
title: PostgreSQL TLS configuration
description: Why production database connections use TLS without certificate verification, and how to enable verification when ready.
tags: [infrastructure, security, postgres]
---

# PostgreSQL TLS configuration

## What this page is about

This page documents the **intentional** PostgreSQL TLS setting in `src/lib/db.ts` where production uses encrypted connections but **does not verify the server certificate** (`rejectUnauthorized: false`).

## Current behaviour

In production, the app connects with:

```ts
ssl: { rejectUnauthorized: false }
```

That means:

- Traffic between the app and Postgres **is encrypted**.
- Node.js **does not** validate that the certificate belongs to the expected hostname or was signed by a trusted CA.

Development disables TLS entirely (`ssl: false`) because local Docker Postgres typically does not terminate TLS on the container port.

## Why verification is disabled today

Managed or containerised Postgres in this project’s deployments often falls into one of these cases:

1. **Self-signed or internal CA** — the server presents a cert Node’s default trust store does not know.
2. **Provider-managed rotation** — some hosts rotate intermediate CAs; pinning without ops follow-up breaks deploys.
3. **Private network path** — TLS encrypts on the wire inside a VPC/Docker network; strict verification was deferred until a stable CA bundle is wired into the runtime.

There is **no current requirement** to turn on verification until infrastructure supplies a CA file or uses a public CA chain Node trusts by default.

## Risk if left as-is

An attacker who can **MITM the network path** between the app and database (compromised router, malicious peer on a flat network, etc.) could present a fake certificate and read or modify queries. Risk is **low on isolated Docker/private networks**, **higher on shared or untrusted networks**.

## How to enable verification later

When you are ready:

1. Obtain the provider’s CA certificate (PEM).
2. Set `POSTGRES_SSL_CA` (or mount the file and point `ssl.ca` at it) in the postgres client options.
3. Change `rejectUnauthorized` to `true`.
4. Deploy to staging first and confirm connections succeed.

Example direction (not active in code yet):

```ts
ssl: {
  rejectUnauthorized: true,
  ca: process.env.POSTGRES_SSL_CA
}
```

## Related files

- `src/lib/db.ts` — connection configuration
- `docker-compose` / deployment manifests — where Postgres TLS is terminated
