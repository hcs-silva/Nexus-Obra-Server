# Server Release Checklist

## 1) Pre-release checks

- Ensure branch is up to date (`main`/`master`)
- Run local quality checks:
  - `pnpm test`
  - `pnpm build`

## 2) Create and push release tag

```bash
git checkout main
git pull
git tag -a vX.Y.Z -m "Server release vX.Y.Z"
git push origin vX.Y.Z
```

This triggers GitHub Actions to publish image tags to GHCR:

- `ghcr.io/<owner>/nexus-obra-server:vX.Y.Z`
- `ghcr.io/<owner>/nexus-obra-server:sha-<commit>`

## 3) Verify GHCR artifact

- Open GitHub repo → Packages
- Confirm `nexus-obra-server` contains `vX.Y.Z`
- Confirm workflow run is green

## 4) Deploy

Set server image tag in your deployment to the new release tag:

- `ghcr.io/<owner>/nexus-obra-server:vX.Y.Z`

## 5) Rollback

If release has issues, deploy previous known-good tag:

- `ghcr.io/<owner>/nexus-obra-server:vX.Y.(Z-1)`

No code revert is required for immediate rollback; just redeploy using the prior image tag.

## 6) Cross-repo release mapping

Because client and server are separate repos, record release pairs in each release note:

- Server `vX.Y.Z` ↔ Client `vA.B.C`

Use mapped pairs during rollback to avoid version drift between frontend and backend.

Also update [RELEASE_MATRIX.md](./RELEASE_MATRIX.md) with the approved pair for each environment.
