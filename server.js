// server.js — Gemini-powered AI Hub (Express)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "2mb" }));

// --- Env Vars ---
// Set GEMINI_API_KEY in your environment or Render Dashboard.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";

// --- Health check (LIVE ping to Gemini) ---
app.get("/api/healthz", async (req, res) => {
  if (!GEMINI_API_KEY) return res.json({ ok: false, gemini: false, reason: "Missing GEMINI_API_KEY" });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] })
    });
    const body = await r.json();
    if (!r.ok) return res.json({ ok: false, gemini: true, reason: "Gemini call failed", details: body });
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ ok: text.length > 0, gemini: true, chatModel: CHAT_MODEL, ttsModel: TTS_MODEL, voice: TTS_VOICE });
  } catch (e) {
    res.json({ ok: false, gemini: true, reason: String(e) });
  }
});

// --- Chat endpoint ---
app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(400).json({ error: "Missing GEMINI_API_KEY" });
    const { message = "", history = [], system = "You are a helpful assistant." } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: "Empty message" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const contents = [
      { role: "user", parts: [{ text: system }] },
      ...history.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: message }] }
    ];

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents }) });
    const body = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Gemini chat error", details: body });

    const reply = body?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(no reply)";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- TTS endpoint (Gemini -> WAV) ---
app.post("/api/tts", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(400).json({ error: "Missing GEMINI_API_KEY" });
    const { text = "", voice = TTS_VOICE, model = TTS_MODEL } = req.body || {};
    if (!text.trim()) return res.status(400).json({ error: "Empty text" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      model,
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    };

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Gemini TTS error", details: body });

    const b64 = body?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return res.status(500).json({ error: "No audio in response" });

    const pcm = Buffer.from(b64, "base64");
    const wavBuffer = pcmToWav(pcm, 24000, 1, 16);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.send(wavBuffer);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Static hosting (optional) ---
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));

function pcmToWav(pcmBuf, sampleRate, channels, bitsPerSample) {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuf.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buf = Buffer.alloc(totalSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(totalSize - 8, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  pcmBuf.copy(buf, 44);
  return buf;
}
