# Beulah Dashboard

A single-file sales tracking dashboard. Hosts as one `index.html` on any static host (DreamHost subdomain works great). Stores data in Supabase (free).

## What you get

- Login screen (email + password)
- Sidebar: every lead, filterable + sortable, mini progress bar each
- Lead detail: full progress bar with clickable stage, activity timeline, todos, free-form notes
- Bottom log bar: type "forwarded proposal email" → it's logged on the selected lead with a timestamp
- Stages: **Lead → Contacted → Proposal → Negotiating → Signed**

Total cost: **$0/month** at this scale.

---

## Setup (≈ 10 minutes)

### 1. Create a Supabase project (free)

1. Go to <https://supabase.com> → **Start your project** → sign in with GitHub or Google.
2. Click **New project**. Pick any name (e.g. `beulah`), set a database password (save it somewhere — you won't need it day-to-day, but save it), pick the region closest to you.
3. Wait ~2 minutes for the project to provision.

### 2. Run the schema

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. Open `schema.sql` from this folder, copy everything, paste into the editor.
4. Click **Run**. You should see "Success. No rows returned."

### 3. Get your API keys and paste them into `index.html`

1. In Supabase, click **Settings** (gear icon) → **API**.
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon / public** key (a long string starting with `eyJ…`). The `anon` key is safe to put in the browser — it's gated by Row-Level Security.
4. Open `index.html` in a text editor. Near the top you'll see:

   ```js
   const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

5. Replace both placeholders with the values you copied. Save the file.

### 4. Create the sales employee's login

1. In Supabase, click **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the employee's email + a password. **Uncheck** "auto-confirm" if it asks (or use the "Confirm user" toggle — you want them able to sign in immediately).
3. Share these credentials with the employee privately.

### 5. Test it locally first

1. Open `index.html` directly in your browser (double-click the file, or run `open index.html` in Terminal).
2. Sign in with the email + password from step 4.
3. Click **+ New lead** → add a few leads → click on one → try the log bar at the bottom → add a todo → check it off → change the stage.
4. Refresh the page. Everything should still be there (proves data is in Supabase, not the browser).

---

## Deploy to DreamHost

1. Log into the **DreamHost panel**.
2. Go to **Websites → Manage Websites** (or **Domains → Manage Domains** depending on your DreamHost version).
3. Either pick an existing domain or **Add Hosting to a Domain / Sub-Domain** and create something like `beulah.yourdomain.com`. Choose static / fully-hosted (no PHP needed, no database needed — DreamHost is just serving a file).
4. Once the subdomain shows "ready," upload `index.html` to its document root. Two ways:
   - **DreamHost File Manager** (browser): panel → **Files → Manage Files** → navigate into the subdomain folder → upload `index.html`.
   - **SFTP** (e.g. Cyberduck, FileZilla, or `scp`): connect with your DreamHost SFTP credentials, drop `index.html` into the subdomain folder.
5. Visit `https://beulah.yourdomain.com`. The login screen should load. Sign in.

Done. The site is now hosted by DreamHost 24/7. Your computer can be off.

---

## Updating the dashboard later

Edit `index.html` locally, test by opening it in your browser, then re-upload to DreamHost. That's the whole workflow.

## What's not built yet (planned)

- **Gmail integration** — auto-import emails into a lead's activity timeline. Add later via Supabase Edge Function.
- **Calendar integration** — meetings auto-logged.
- **Multi-user / team** — Row-Level Security is already in place per user; just create more Supabase users.
- **AI summaries** — "what's the next step for John?" via Claude API.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page shows "Setup needed" amber box | You haven't filled in `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `index.html`. |
| "Invalid login credentials" | The user wasn't created in Supabase Auth, or password is wrong. Re-create in Auth → Users. |
| Login works but no leads save | Schema didn't run. Re-run `schema.sql` in the SQL Editor. |
| "permission denied for table leads" | RLS policies missing. Re-run `schema.sql`. |
| Site is blank on DreamHost | Make sure `index.html` is at the **document root** of the subdomain, not in a subfolder. |
