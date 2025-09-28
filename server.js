import express from "express";
import fetch from "node-fetch";
import { Buffer } from "buffer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "2mb" }));
// Behind proxies (Render/Heroku) read real client IPs via X-Forwarded-For
app.set("trust proxy", true);

// Minimal request logging for API routes (skip noisy health check)
app.use((req, res, next) => {
  try {
    if (req.path && req.path.startsWith('/api') && req.path !== '/api/healthz') {
      console.log(`${req.method} ${req.originalUrl}`);
    }
  } catch {}
  next();
});

// Serve static files from ./public (so / works)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
const TTS_MODEL  = process.env.GEMINI_TTS_MODEL  || "gemini-2.5-flash-preview-tts";
const TTS_VOICE  = process.env.GEMINI_TTS_VOICE  || "Kore";

// LIVE health check (only ok:true if Gemini actually replies)
app.get("/api/healthz", async (req, res) => {
  if (!GEMINI_API_KEY) return res.json({ ok:false, gemini:false, reason:"Missing GEMINI_API_KEY" });
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ contents:[{ role:"user", parts:[{ text:"ping" }]}] }) });
    const body = await r.json();
    if (!r.ok) return res.json({ ok:false, gemini:true, reason:"Gemini call failed", details: body });
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.json({ ok: text.length>0, gemini:true, chatModel:CHAT_MODEL, ttsModel:TTS_MODEL, voice:TTS_VOICE });
  } catch (e) {
    return res.json({ ok:false, gemini:true, reason:String(e) });
  }
});

// Public config for frontend (safe values only)
app.get("/api/config", (req, res) => {
  res.json({ recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "" });
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(400).json({ error:"Missing GEMINI_API_KEY" });
    const { message = "", history = [], system = "You are a helpful assistant." } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error:"Empty message" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const contents = [
      { role:"user", parts:[{ text: system }] },
      ...history.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts:[{ text:m.content }]})),
      { role:"user", parts:[{ text: message }]}
    ];
    const r = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ contents })});
    const body = await r.json();
    if (!r.ok) return res.status(502).json({ error:"Gemini chat error", details:body });
    const reply = body?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(no reply)";
    res.json({ reply });
  } catch (e) { res.status(500).json({ error:String(e) }); }
});

// TTS -> WAV
app.post("/api/tts", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(400).json({ error:"Missing GEMINI_API_KEY" });
    const { text = "", voice = TTS_VOICE, model = TTS_MODEL } = req.body || {};
    if (!text.trim()) return res.status(400).json({ error:"Empty text" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      model,
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    };
    const r = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const body = await r.json();
    if (!r.ok) return res.status(502).json({ error:"Gemini TTS error", details:body });

    const b64 = body?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return res.status(500).json({ error:"No audio in response" });
    const pcm = Buffer.from(b64, "base64");

    // simple WAV wrapper for 24kHz 16-bit mono PCM
    const sampleRate=24000, channels=1, bits=16;
    const byteRate = sampleRate * channels * bits / 8;
    const blockAlign = channels * bits / 8;
    const dataSize = pcm.length;
    const total = 44 + dataSize;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0); header.writeUInt32LE(total-8, 4);
    header.write("WAVE", 8); header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28); header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bits, 34); header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    const wav = Buffer.concat([header, pcm]);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.send(wav);
  } catch (e) { res.status(500).json({ error:String(e) }); }
});

// --- Lead validation + simple in-memory rate limit ---
function isValidEmail(email="") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function trimSafe(v) { return (typeof v === "string" ? v : "").trim(); }
function leadValidator(req, res, next) {
  const body = req.body || {};
  // Honeypot fields: if filled -> likely bot
  const hp = trimSafe(body.website || body.url || body.hp || "");
  if (hp) return res.status(400).json({ error: "Spam detected" });
  // Simple minimum fill time gate (client sends elapsed ms)
  const ageMs = Number(body.ageMs || 0);
  const minAge = Number(process.env.LEAD_MIN_AGE_MS || 800);
  if (ageMs && ageMs < minAge) return res.status(400).json({ error: "Form submitted too quickly" });
  const name = trimSafe(body.name);
  const email = trimSafe(body.email);
  const message = trimSafe(body.message || "");
  const source = trimSafe(body.source || "web").slice(0, 120);
  const errors = {};
  if (name.length < 2 || name.length > 200) errors.name = "Name must be 2-200 characters";
  if (!isValidEmail(email) || email.length > 300) errors.email = "Invalid email";
  if (message.length > 5000) errors.message = "Message is too long";
  if (Object.keys(errors).length) return res.status(400).json({ error: "Invalid payload", details: errors });
  req.body = { name, email, message, source };
  next();
}

async function verifyRecaptcha(req) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return { ok: true };
  const token = trimSafe(req.body?.recaptchaToken || "");
  if (!token) return { ok: false, status: 400, error: "Missing reCAPTCHA token" };
  try {
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || "";
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    if (ip) params.append("remoteip", ip);
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: 502, error: "reCAPTCHA verification failed", details: body };
    const success = body?.success === true;
    const score = Number(body?.score || 0);
    const action = String(body?.action || "");
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    if (!success) return { ok: false, status: 400, error: "reCAPTCHA check not successful", details: body };
    if (score && score < minScore) return { ok: false, status: 400, error: "Low reCAPTCHA score", details: { score } };
    if (action && action !== "lead") return { ok: false, status: 400, error: "Unexpected reCAPTCHA action", details: { action } };
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 500, error: String(e) };
  }
}
const leadRateLimiter = (() => {
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const MAX = 10; // max submissions per window per IP
  const buckets = new Map(); // ip -> [timestamps]
  setInterval(() => {
    const now = Date.now();
    for (const [ip, arr] of buckets) {
      while (arr.length && now - arr[0] > WINDOW_MS) arr.shift();
      if (!arr.length) buckets.delete(ip);
    }
  }, 60 * 1000).unref?.();
  return (req, res, next) => {
    const now = Date.now();
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || "unknown";
    let arr = buckets.get(ip);
    if (!arr) { arr = []; buckets.set(ip, arr); }
    while (arr.length && now - arr[0] > WINDOW_MS) arr.shift();
    if (arr.length >= MAX) {
      res.setHeader("Retry-After", Math.ceil(WINDOW_MS / 1000).toString());
      return res.status(429).json({ error: "Too many requests, slow down" });
    }
    arr.push(now);
    res.setHeader("X-RateLimit-Limit", String(MAX));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, MAX - arr.length)));
    next();
  };
})();

// Lead capture proxy -> Google Apps Script (plus optional SendGrid email)
app.post("/api/lead", leadRateLimiter, leadValidator, async (req, res) => {
  try {
    const rc = await verifyRecaptcha(req);
    if (!rc.ok) return res.status(rc.status || 400).json({ error: rc.error || "reCAPTCHA failed", details: rc.details });
    const url = process.env.APPS_SCRIPT_LEADS_URL;
    if (!url) return res.status(500).json({ error: "Missing APPS_SCRIPT_LEADS_URL" });

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) {
      return res.status(502).json({ error: "Apps Script error", details: data });
    }

    // Optional SendGrid email notification
    if (process.env.SENDGRID_API_KEY && process.env.LEAD_NOTIFY_TO) {
      try {
        const sgMail = await import("@sendgrid/mail");
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
        const { name = "", email = "", message = "", source = "web" } = req.body || {};
        await sgMail.default.send({
          to: process.env.LEAD_NOTIFY_TO,
          from: process.env.LEAD_NOTIFY_TO,
          subject: `New lead from ${name}`,
          text: `Email: ${email}\nMessage: ${message}\nSource: ${source}`
        });
      } catch (e) {
        console.warn("SendGrid email failed:", e?.message || String(e));
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("/api/lead error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server on :${PORT}`));
