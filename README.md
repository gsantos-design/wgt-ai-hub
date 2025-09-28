# WGT AI Hub

Single-service Node/Express app providing:
- Simple public UI (`/public`) with lead form
- API endpoints for Gemini chat and TTS
- Lead capture proxy (Google Apps Script) with optional SendGrid email
- Optional Google reCAPTCHA v3

## Quick Start

- Requirements: Node 20+
- Install deps: `npm ci`
- Configure env: copy `.env.example` to `.env` and fill values
- Start locally: `npm start` then open http://localhost:3000

## Environment Variables

Server-only (never expose to the browser):
- `GEMINI_API_KEY`: Google Generative Language API key.
- `RECAPTCHA_SECRET`: reCAPTCHA v3 Secret key.
- `APPS_SCRIPT_LEADS_URL`: HTTPS endpoint for Google Apps Script (lead handler).
- `SENDGRID_API_KEY`: SendGrid API key for email notifications.
- `LEAD_NOTIFY_TO`: Email address to receive lead notifications.

Safe to expose to client:
- `RECAPTCHA_SITE_KEY`: reCAPTCHA v3 Site key (frontend-only).

Other config:
- `RECAPTCHA_MIN_SCORE` (default `0.5`)
- `LEAD_MIN_AGE_MS` (default `800`)
- `PORT` (default `3000`)

## Security Notes

- Do not commit secrets. `.env` is git-ignored; use `.env.example` as a template.
- Keep the `GEMINI_API_KEY` server-side only. Frontend calls server endpoints; the server calls Google.
- The frontend only receives `RECAPTCHA_SITE_KEY`. The secret stays on the server and is used at `/api/lead`.
- In CI/CD or hosting (e.g., GitHub Actions, Render), configure secrets/variables in the platform settings.

## Deploy

- Render: see `render.yaml`. Set environment variables in the Render dashboard.
- GitHub Actions: uses Node 20 to install and run a lightweight check.

## Scripts

- `npm start` — start the server
- `npm run dev` — same as start (non-watch)
- `npm run check` — quick syntax check used by CI

