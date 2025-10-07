# WGT AI Hub (Gemini + Express)

Minimal, production-ready starter: real health check, chat, and TTS.

## Run locally

```bash
cp .env.example .env
# put your GEMINI_API_KEY in .env
npm i
npm run dev
# open http://localhost:3000
```

## Deploy to Render

- Create a Web Service from this repo.
- Set `GEMINI_API_KEY` in the Render dashboard.
- Health check path: `/api/healthz`.
- Static files are served from `public/` by Express.
