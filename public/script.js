const $ = (sel) => document.querySelector(sel);

async function mustJson(res) {
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || err.reason || `HTTP ${res.status}`);
  }
  return res.json();
}

function setBadge(status) {
  const b = $("#badge");
  b.classList.remove("checking", "ok", "warn", "error");
  b.classList.add(status);
  b.textContent = status === "ok" ? "Connected"
    : status === "warn" ? "Not connected"
    : status === "error" ? "Error"
    : "Checking…";
}

async function checkHealth() {
  setBadge("checking");
  try {
    const d = await mustJson(await fetch("/api/healthz", { cache: "no-store" }));
    setBadge(d.ok ? "ok" : "warn");
  } catch {
    setBadge("error");
  }
}

// Chat state
const history = [];

function appendMsg(role, text) {
  const box = $("#chat-box");
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendChat(e) {
  e.preventDefault();
  const input = $("#chat-input");
  const btn = $("#chat-send");
  const text = (input.value || "").trim();
  if (!text) return;
  input.value = "";

  appendMsg("user", text);
  history.push({ role: "user", content: text });
  btn.disabled = true;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history })
    });
    const data = await mustJson(res);
    appendMsg("assistant", data.reply || "(no reply)");
    history.push({ role: "assistant", content: data.reply || "(no reply)" });
  } catch (e) {
    appendMsg("assistant", `Error: ${e.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function speak() {
  const input = $("#tts-input");
  const btn = $("#tts-btn");
  const audio = $("#tts-audio");
  const text = (input.value || "").trim();
  if (!text) return;
  btn.disabled = true;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      let err = {}; try { err = await res.json(); } catch {}
      throw new Error(err.error || `TTS HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    await audio.play();
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = false;
  }
}

async function submitLead(e) {
  e.preventDefault();
  const name = $("#lead-name").value.trim();
  const email = $("#lead-email").value.trim();
  const message = $("#lead-message").value.trim();
  const website = $("#lead-website").value.trim(); // honeypot
  const btn = $("#lead-send");
  const note = $("#lead-note");

  if (!name || !email) {
    note.className = "note err";
    note.textContent = "Please fill in name and email.";
    return;
  }

  btn.disabled = true;
  note.textContent = "";
  try {
    // Compute elapsed ms since page load for simple timing gate
    const ageEl = $("#lead-age");
    const ageMs = window.__leadStartTs ? Math.max(0, Date.now() - window.__leadStartTs) : 0;
    if (ageEl) ageEl.value = String(ageMs);

    // reCAPTCHA v3 (optional)
    let recaptchaToken = "";
    if (window.__recaptchaSiteKey && window.grecaptcha && window.grecaptcha.execute) {
      try {
        recaptchaToken = await window.grecaptcha.execute(window.__recaptchaSiteKey, { action: "lead" });
      } catch {}
    }

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, source: "wgt-public", website, ageMs, recaptchaToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Lead failed");
    note.className = "note ok";
    note.textContent = "Thanks! We’ll be in touch.";
    $("#lead-form").reset();
  } catch (e) {
    note.className = "note err";
    note.textContent = `Error: ${e.message}`;
  } finally {
    btn.disabled = false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Health badge
  checkHealth();

  // Chat
  $("#chat-form").addEventListener("submit", sendChat);

  // TTS
  $("#tts-btn").addEventListener("click", speak);

  // Lead
  $("#lead-form").addEventListener("submit", submitLead);
  // Capture start time for timing gate
  window.__leadStartTs = Date.now();
  const ageEl = $("#lead-age");
  if (ageEl) ageEl.value = "0";

  // Fetch config and load reCAPTCHA if available
  fetch("/api/config", { cache: "no-store" })
    .then(r => r.json())
    .then(cfg => {
      if (cfg && cfg.recaptchaSiteKey) {
        window.__recaptchaSiteKey = cfg.recaptchaSiteKey;
        const s = document.createElement("script");
        s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(cfg.recaptchaSiteKey)}`;
        s.async = true; s.defer = true;
        document.head.appendChild(s);
      }
    })
    .catch(() => {});
});

