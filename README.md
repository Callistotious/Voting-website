# Medsam Voting

A voting platform built for groups of 200+ voters: email-OTP verified voting,
a client admin dashboard per poll, and a Medsam-only super admin layer that
matches the Terms of Service you were given (platform ownership, a disclosed
Service Status switch, no hidden mechanisms).

## Stack

- **Next.js 14** (App Router, JavaScript)
- **SQLite** via `better-sqlite3` — zero external services needed to run locally
- **Nodemailer** — sends OTP emails over SMTP
- **Tailwind CSS** — styling
- **bcryptjs / jsonwebtoken** — password hashing and session tokens

Nothing here requires a paid cloud service to try locally. For a real deployment,
swap SQLite for a hosted Postgres (e.g. Supabase) if you expect concurrent writes
at scale, and use a real transactional email provider for OTPs.

## 1. Install

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- `AUTH_SECRET` — any long random string (`openssl rand -hex 32`)
- `SMTP_*` — your email provider's SMTP credentials (Gmail app password, Resend,
  Brevo, SendGrid, etc). **If you leave these blank**, OTP codes are printed to
  your terminal instead of emailed — handy for testing the flow before you wire
  up real email.
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` — the first Medsam super admin login

## 3. Create the first Super Admin

```bash
npm run seed
```

This reads `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env.local` and
creates that account. Run it again later with different values to create
additional super admins if you ever need to.

## 4. Run it

```bash
npm run dev
```

Visit:
- `/` — public landing page
- `/super-admin/login` — Medsam's own login (use the account from step 3)
- `/admin/login` — client admin login (created by the super admin, see below)
- `/vote/<pollId>` — the voter flow, link you send to voters
- `/results/<pollId>` — public results page (if the client has published it)

## How it's organized

```
app/
  page.js                      Landing page
  admin/login, admin/dashboard, admin/polls/[pollId]   Client admin UI
  super-admin/login, super-admin/dashboard             Super admin UI
  vote/[pollId]                                        Voter flow (email -> OTP -> ballot)
  results/[pollId]                                      Public results page
  api/
    admin/...                  Client admin endpoints (own-poll only, enforced server-side)
    super-admin/...            Client creation + poll list + service status switch
    vote/[pollId]/...          start (send OTP) / verify / ballot / submit
    results/[pollId]           Public results, gated by results_public + service_status
lib/
  db.js            SQLite connection + schema (creates tables on first run)
  auth.js          Password hashing, JWT session helpers
  otp.js           OTP generation/hashing/expiry rules
  mailer.js        Sends the OTP email (or logs it in dev mode)
  session.js       Reads the admin/voter cookie on each API request
  pollAccess.js    Enforces that a client admin can only touch their own polls
  seedSuperAdmin.js  One-time script, see step 3
data/
  medsam.sqlite    Created automatically on first run (gitignored)
```

## The roles, and what each one can actually do

**Client admin** (what a client sees):
- Create polls, add categories and nominees
- Upload/paste the voter list, reset or remove a stuck voter
- Toggle voting open/closed, toggle OTP requirement
- See a live vote tally
- Publish/unpublish the public results page — **unless** the poll is locked

**Super admin** (Medsam only):
- Create client admin accounts
- See every poll across every client, with live voter/vote stats
- Set a poll's **Service Status**: Active / Grace Period / Locked
  - `locked` withholds the results page and the "publish results" toggle from
    the client admin and the public. Voting itself still works until you
    choose to also set `voting_status` to closed — locking doesn't yank the
    rug out from under voters mid-poll.

This mirrors the Terms of Service doc: the client is told exactly what they
control and what Medsam retains. There's no separate hidden switch — the
Service Status *is* the leverage, and it's the same one described there.

## Security notes worth knowing before you go live

- OTP codes are hashed (bcrypt) at rest, never stored in plain text.
- OTP has a 5-minute expiry, 3 wrong-attempt limit, and a resend cooldown —
  tune these in `lib/otp.js`.
- A voter's JWT session is only good for 20 minutes and is only issued after
  a correct OTP check.
- Votes are written inside a SQL transaction together with marking the voter
  "voted", so a double-submit can't double-count.
- All admin API routes re-check ownership server-side (`lib/pollAccess.js`) —
  the UI hiding a button is not the only thing stopping a client admin from
  touching someone else's poll.
- For a real election with real stakes, also consider: rate-limiting the
  `/api/vote/*/start` endpoint by IP, moving SQLite to Postgres for safer
  concurrent writes at higher voter counts, and running this behind HTTPS
  (required in production — cookies are marked `secure` automatically once
  `NODE_ENV=production`).

## Known gaps to fill in before a real launch

- No password-reset flow for admins yet (reset manually via the database, or
  add one before this goes to real clients).
- CSV voter upload is plain paste-in text (`email, name` per line), not a
  file-upload widget — works fine, just not drag-and-drop yet.
- No automated nightly backup/export job — see Section 4 of the Terms doc for
  why that matters; wire one up before running this for a paying client.
