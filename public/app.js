const el = (sel) => document.querySelector(sel);
const statusEl = el("#statusBadge");
const chatLog = el("#chatLog");
const chatInput = el("#chatInput");
const chatForm = el("#chatForm");
const ttsText = el("#ttsText");
const ttsBtn = el("#ttsBtn");
const ttsAudio = el("#ttsAudio");
const leadForm = el("#leadForm");

let history = [];

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function mustJson(r) {
  if (!r.ok) {
    let err = {};
    try { err = await r.json(); } catch {}
    throw new Error(err.error || err.reason || `HTTP ${r.status}`);
  }
  return r.json();
}

// ---- Health ----
async function checkHealth() {
  try {
    const d = await mustJson(await fetch("/api/healthz", { cache:"no-store" }));
    if (d.ok) {
      statusEl.textContent = `Connected • ${d.chatModel}`;
      statusEl.className = "status ok";
    } else {
      statusEl.textContent = "Not connected" + (d.reason ? ` • ${d.reason}` : "");
      statusEl.className = "status warn";
      console.warn("Health details:", d);
    }
  } catch (e) {
    statusEl.textContent = "Error";
    statusEl.className = "status err";
    console.error(e);
  }
}
checkHealth();

// ---- Chat ----
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg("user", text);
  chatInput.value = "";
  try {
    const data = await mustJson(await fetch("/api/chat", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: text, history })
    }));
    addMsg("bot", data.reply);
    history.push({ role:"user", content:text }, { role:"assistant", content:data.reply });
  } catch (err) {
    addMsg("bot", `Error: ${err.message}`);
  }
});

// ---- TTS ----
ttsBtn.addEventListener("click", async () => {
  const text = ttsText.value.trim();
  if (!text) return;
  const label = ttsBtn.textContent;
  ttsBtn.disabled = true; ttsBtn.textContent = "Generating…";
  try {
    const r = await fetch("/api/tts", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ text })
    });
    if (!r.ok) {
      let err={}; try{err = await r.json();}catch{}
      throw new Error(err.error || `TTS HTTP ${r.status}`);
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    ttsAudio.src = url; ttsAudio.play();
  } catch (e) { alert(e.message); }
  finally { ttsBtn.disabled = false; ttsBtn.textContent = label; }
});

// ---- Lead ----
leadForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(leadForm);
  const payload = {
    name: formData.get("name")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    message: formData.get("message")?.toString() || "",
    source: "wgt-landing"
  };
  const btn = leadForm.querySelector("button");
  const note = el("#leadNote");
  btn.disabled = true; btn.textContent = "Sending…"; note.textContent = "";
  try {
    const r = await fetch("/api/lead", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(()=>({}));
    if (!r.ok || !data.ok) throw new Error(data.error || "Submit failed");
    note.textContent = "Thanks! We’ll be in touch."; note.className = "note ok";
    leadForm.reset();
  } catch (e) {
    note.textContent = "Error: " + e.message; note.className = "note err";
  } finally {
    btn.disabled = false; btn.textContent = "Send";
  }
});

