# Deploy

The site is a static Vite build served by Cloudflare Workers static assets. Config: `wrangler.jsonc`. Unknown paths such as `/radlo` fall back to `index.html`, the SPA handles routing.

CI in `.github/workflows/ci.yml`:

- **Every push and PR:** typecheck, unit tests, Playwright, build.
- **Push to `main`:** `wrangler deploy` to production.
- **Pull request:** `wrangler versions upload --preview-alias pr-<number>`, the preview URL is posted as a PR comment. Production is not touched.
- **No secrets set:** the deploy job runs but skips every step and says so in the job summary. PRs from forks never get secrets, so they never deploy.

## What the owner must set up once

1. **Cloudflare account.** Note the Account ID: dashboard, Workers & Pages, right sidebar.
2. **workers.dev subdomain.** Workers & Pages, first visit asks you to pick one. Previews live at `pr-<n>-adventni-okenka.<subdomain>.workers.dev`, production at `adventni-okenka.<subdomain>.workers.dev` until the domain is attached.
3. **API token.** My Profile, API Tokens, Create Token, template "Edit Cloudflare Workers". Scope it to this account only.
4. **GitHub secrets.** In `Zdenctorm/rozsvitme-vesnici`, Settings, Secrets and variables, Actions, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. **Custom domain, after `adventniokenka.cz` is on Cloudflare DNS.** Workers & Pages, `adventni-okenka`, Settings, Domains & Routes, Add, Custom domain `adventniokenka.cz`, optionally `www`. Cloudflare issues the HTTPS certificate. Alternatively add to `wrangler.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "adventniokenka.cz", "custom_domain": true }]
   ```

HTTPS is on by default for both `workers.dev` and custom domains.

## Manual deploy

```bash
npm run build
npx wrangler login
npx wrangler deploy
```
