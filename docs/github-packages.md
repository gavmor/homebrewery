# GitHub Packages auth for the `@gavmor` scope

This fork gets the Foxhole theme from **`@gavmor/foxhole-styles`**, published to
**GitHub Packages** (not npmjs.org) from the
[gavmor/foxhole-styles](https://github.com/gavmor/foxhole-styles) repo.

GitHub Packages requires an authenticated request for **every** read, including
reads of public packages. Anonymous `npm install` gets a `401`.

## What is committed

`.npmrc` at the repo root:

```
@gavmor:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Only the `@gavmor` scope is redirected; every other dependency still resolves
from the default public registry. The token is read from the `NODE_AUTH_TOKEN`
environment variable at install time — **no real token is ever committed.**

## Local development

Any token with the `read:packages` scope works. Easiest route, if you have the
GitHub CLI logged in:

```bash
export NODE_AUTH_TOKEN=$(gh auth token)
npm install
```

Otherwise create a classic personal access token with `read:packages` at
<https://github.com/settings/tokens> and export it the same way. Put the export
in your shell profile or a `direnv` `.envrc`; do not put the literal token in
`.npmrc`.

To avoid re-exporting per shell, you can instead write the token once into your
**user-level** `~/.npmrc` (which is outside the repo and never committed):

```
//npm.pkg.github.com/:_authToken=ghp_your_token_here
```

The repo-level `.npmrc` still supplies the scope→registry mapping; npm merges
the two files, and the user-level `_authToken` wins when `NODE_AUTH_TOKEN` is
unset.

## CI (GitHub Actions)

The workflow's built-in `GITHUB_TOKEN` is sufficient, because
`@gavmor/foxhole-styles` is published from a public repo. Two things are needed:

```yaml
permissions:
  packages: read        # in addition to whatever the job already needs

steps:
  - run: npm ci --no-audit --no-fund
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This is already wired into `.github/workflows/pages-demo.yml`.

If the package is ever republished **private**, `GITHUB_TOKEN` from a *different*
repository will not be able to read it. In that case either grant this
repository read access to the package (package page → Package settings → Manage
Actions access) or store a PAT with `read:packages` as a repository secret and
use that instead of `secrets.GITHUB_TOKEN`.

## Troubleshooting

| Symptom | Meaning |
| --- | --- |
| `401 Unauthorized ... unauthenticated: User cannot be authenticated with the token provided` | `NODE_AUTH_TOKEN` is unset, expired, or lacks `read:packages`. |
| `404 Not Found ... npm package "foxhole-styles" does not exist under owner "gavmor"` | Auth is fine; the package simply is not published (yet) at that name. |
| Other dependencies suddenly 404 | A `registry=` line (unscoped) crept into `.npmrc` and redirected *everything* to GitHub Packages. Only the scoped `@gavmor:registry=` line belongs here. |

## Verification

The auth path was verified end to end against a published `@gavmor` package:

```bash
export NODE_AUTH_TOKEN=$(gh auth token)
npm view @gavmor/telemetry-collector version    # -> 1.6.4
npm install @gavmor/telemetry-collector         # -> added 7 packages
```

`@gavmor/foxhole-styles` resolves through the identical path with no further
configuration. It is a normal entry in `dependencies`, so a plain `npm install`
(with the token exported) pulls it; the Foxhole theme is then compiled straight
out of `node_modules/@gavmor/foxhole-styles` by the Vite asset plugin — nothing
is copied into `themes/`.
