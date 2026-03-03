# Release Matrix

Track approved server↔client image tag pairs per environment.

Tag format:

- Server: `server-vX.Y.Z`
- Client: `client-vX.Y.Z`

## Current Approved Pairs

| Environment | Server Tag    | Client Tag    | Approved By | Date       | Notes |
| ----------- | ------------- | ------------- | ----------- | ---------- | ----- |
| dev         | server-v0.0.0 | client-v0.0.0 |             | YYYY-MM-DD |       |
| staging     |               |               |             |            |       |
| production  |               |               |             |            |       |

## Rollback Pairs

| Environment | Previous Server Tag | Previous Client Tag | Trigger / Incident | Date       |
| ----------- | ------------------- | ------------------- | ------------------ | ---------- |
| staging     |                     |                     |                    | YYYY-MM-DD |
| production  |                     |                     |                    | YYYY-MM-DD |

## Usage

1. Update this file when promoting a release.
2. Keep server and client tags as tested pairs.
3. On incident, rollback both services to the previous approved pair.
4. Use tags created by Release Please release PR merges (do not manually create release tags).
