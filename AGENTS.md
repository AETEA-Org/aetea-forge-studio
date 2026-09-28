# aetea-forge-studio — working agreement

For anyone (and any coding agent) making changes in this repo. Read this before your first
commit; a lot of it changed on 2026-09-28 and older instructions are wrong.

## 1. Push to `dev`. Never to `main`, and no pull requests.

```bash
git checkout dev
# ...changes...
git push origin dev
```

**A push deploys.** There is no separate deploy step and no review gate:

| Branch | Deploys to |
|---|---|
| `dev` | https://dev.aetea.studio |
| `main` | https://aetea.studio — **production, real users** |

`main` is reached only by the repo owner merging `dev` into it. Do not commit to `main`, do not
open a PR, do not force-push either branch.

Check your change on **dev.aetea.studio** after pushing. Vercel takes a minute or two.

## 2. There are three environments now, and they share nothing

Until recently there was one of everything, so a frontend running on your laptop talked to the
deployed backend and the deployed database. That is over.

| | local | dev | prod |
|---|---|---|---|
| Frontend | `localhost:8080` | `dev.aetea.studio` | `aetea.studio` |
| Backend | `localhost:8000` | `api-dev.aetea.studio` | `api.aetea.studio` |
| Supabase | Docker, on your machine | dev project | prod project |

**Local reaches nothing in the cloud.** That is the point: you can break anything locally
without touching real data.

## 3. Configuration comes from environment variables, never from source

```bash
cp .env.example .env    # the values in it ARE the local ones
npm install
npm run dev
```

`.env.example` is the whole list. Three matter:

| Variable | What it picks |
|---|---|
| `VITE_API_BASE_URL` | which backend this build talks to |
| `VITE_SUPABASE_URL` | which database this build talks to |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the key for that database |

⚠ **Never hardcode a URL, a key or a hostname in source.** A hardcoded backend URL in
`src/services/config.ts` was exactly what made a second environment impossible, and produced a
bug where clicking Stripe checkout on localhost redirected you to the deployed site. If you
need a new setting, add a `VITE_*` variable and a line in `.env.example`.

⚠ **`VITE_*` values are baked in at *build* time**, not read at runtime. Changing one in Vercel
needs a redeploy, not just a refresh.

⚠ **Nothing in a `VITE_*` variable is secret.** It ships inside the JavaScript bundle and
anyone can read it. The Supabase publishable key is designed for that — Row Level Security
protects the data, not the key. Never put a real secret in one.

## 4. Things that used to be true and are not

- **The backend is not a Hugging Face Space any more.** It runs on Railway, on its own domain,
  and it is public. Nothing needs a gate token.
- **`VITE_AETEA_API_TOKEN` is gone and must not come back.** It was a Hugging Face token that
  shipped in the browser bundle where anyone could read it.
- **Requests carry one header, not two:** `X-AETEA-Auth: Bearer <supabase access token>`, built
  in `src/services/authHeaders.ts`. The old second `Authorization` header is deleted. Build
  headers there, not at call sites.
- **`supabase/` is gone from this repo** — no migrations, no edge functions, no `config.toml`.
  The schema now lives in `AETEA-AI/supabase/migrations/` and is owned by the backend.
- **Row Level Security is on for every table.** The browser cannot read app data directly from
  Supabase any more; it goes through the backend. If a direct Supabase query returns an empty
  list where it used to return rows, that is RLS working, not a bug.
- **Sign-in is Google only.** Email/password is disabled and sign-ups are closed until launch.
  Your account has to be added by the owner.

## 5. You will not have credentials for Railway, Vercel, Supabase or Stripe

That is deliberate, and it is not a gap to work around. If a task seems to need one:

- **Don't** try to deploy, run migrations, change environment variables, or call a cloud API.
- **Don't** invent or ask for a service key, and never commit one.
- **Do** make the change, push to `dev`, check it on dev.aetea.studio, and say plainly what you
  could not verify and who needs to do it.

Everything you need for day-to-day UI work runs locally.

## 6. If you use a coding agent

Point it at this file and ask it to **revise its own skills** to match — particularly anything
that still says push to `main`, that names a Hugging Face Space or an `api-proxy` edge
function, or that assumes one shared database. Instructions written before 2026-09-28 will send
it to the wrong place.

## Where the full picture lives

`aetea-docs/` (repo `AETEA-Org/aetea-docs`) is the written record. Start with
`03-architecture.md` → *Environments*; `07-frontend.md` covers this repo specifically.
