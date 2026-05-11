# Hosting NextBarrio Parser

This version can be hosted as a small Vercel app.

## Environment variables

Add these variables in the hosting dashboard:

- `CLAUDE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `CLAUDE_MODEL`

Do not upload `config.json`. It contains local secrets and is excluded by `.vercelignore`.

## Workflow after deploy

1. Open the hosted URL.
2. Drag the `Send to NextBarrio` bookmarklet to the bookmarks bar again.
3. Share the hosted URL with the team.
4. Future updates only require redeploying the app. Users do not need a new folder.

## Important security note

The Supabase service-role key must stay server-side only. Never paste it into browser code, a public README, or the bookmarklet.
