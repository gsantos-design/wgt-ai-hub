// Translations
const translations = {
  en: {
    title: "Bold Horizons Financial",
    tagline: "Your wealth growth partner",
    checkingStatus: "Checking…",
    connected: "Connected",
    notConnected: "Not connected",
    error: "Error",
    inputPlaceholder: "Ask me about financial services...",
    sendBtn: "Send",
    speakBtn: "🔊 Speak",
    ttsPlaceholder: "Type text to hear it spoken...",
    calendlyText: "Book Free Consultation",
    footerText: "© Bold Horizons Financial with World Financial Group",
    listening: "Listening...",
    systemPrompt: "You are a helpful financial assistant for Bold Horizons with World Financial Group. Help customers understand our services including insurance, IUL, 401k rollovers, high-yield accounts, and entrepreneurial income opportunities. Be professional, friendly, and bilingual (English/Spanish)."
  },
  es: {
    title: "Bold Horizons Financial",
    tagline: "Tu socio en crecimiento financiero",
    checkingStatus: "Verificando…",
    connected: "Conectado",
    notConnected: "No conectado",
    error: "Error",
    inputPlaceholder: "Pregúntame sobre servicios financieros...",
    sendBtn: "Enviar",
    speakBtn: "🔊 Hablar",
    ttsPlaceholder: "Escribe texto para escucharlo...",
    calendlyText: "Reservar Consulta Gratuita",
    footerText: "© Bold Horizons Financial con World Financial Group",
    listening: "Escuchando...",
    systemPrompt: "Eres un asistente financiero útil para Bold Horizons con World Financial Group. Ayuda a los clientes a entender nuestros servicios incluyendo seguros, IUL, transferencias de 401k, cuentas de alto rendimiento y oportunidades de ingresos empresariales. Sé profesional, amigable y bilingüe (inglés/español). Responde en español."
  }
};

// Current language
let currentLang = 'en';

// Elements
const statusBadge = document.getElementById("statusBadge");
const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const ttsBtn = document.getElementById("tts-btn");
const ttsText = document.getElementById("tts-text");
const ttsAudio = document.getElementById("tts-audio");
const mainTitle = document.getElementById("mainTitle");
const tagline = document.getElementById("tagline");
const calendlyText = document.getElementById("calendlyText");
const footerText = document.getElementById("footerText");

// Chat history
let history = [];

// Speech recognition
let recognition = null;
let isRecognizing = false;

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecognizing = true;
    micBtn.classList.add('recording');
    micBtn.title = translations[currentLang].listening;
  };

  recognition.onend = () => {
    isRecognizing = false;
    micBtn.classList.remove('recording');
    micBtn.title = 'Click to speak';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputEl.value = transcript;
    // Auto-submit after speech
    formEl.dispatchEvent(new Event('submit'));
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    alert(`Speech error: ${event.error}`);
    isRecognizing = false;
    micBtn.classList.remove('recording');
  };
} else {
  micBtn.style.display = 'none';
}

// Mic button click
micBtn?.addEventListener('click', () => {
  if (!recognition) return;

  if (isRecognizing) {
    recognition.stop();
  } else {
    recognition.lang = currentLang === 'es' ? 'es-ES' : 'en-US';
    recognition.start();
  }
});

// Language switcher
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    if (lang === currentLang) return;

    // Update active state
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update language
    currentLang = lang;
    updateUI();

    // Add system message about language change
    const langMsg = lang === 'es'
      ? '🌐 Idioma cambiado a Español'
      : '🌐 Language changed to English';
    addMsg('bot', langMsg);
  });
});

// Update UI text
function updateUI() {
  const t = translations[currentLang];
  tagline.textContent = t.tagline;
  inputEl.placeholder = t.inputPlaceholder;
  sendBtn.textContent = t.sendBtn;
  ttsText.placeholder = t.ttsPlaceholder;
  calendlyText.textContent = t.calendlyText;
  footerText.textContent = t.footerText;
}

// Helper function
async function mustJson(r){
  if(!r.ok){
    let err = {}; try{err = await r.json();}catch{}
    throw new Error(err.error || err.reason || `HTTP ${r.status}`);
  }
  return r.json();
}

// Add message to chat
function addMsg(role, text){
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// Health check
async function checkHealth(){
  const t = translations[currentLang];
  try{
    const data = await mustJson(await fetch("/api/healthz", { cache:"no-store" }));
    if(data.ok){
      statusBadge.textContent = t.connected;
      statusBadge.className = "status ok";
    } else {
      statusBadge.textContent = t.notConnected;
      statusBadge.className = "status warn";
      console.warn("Health failed:", data);
    }
  }catch(e){
    statusBadge.textContent = t.error;
    statusBadge.className = "status error";
    console.error("Health error:", e);
  }
}

// Initialize
checkHealth();
updateUI();

// Welcome message
setTimeout(() => {
  const welcomeMsg = currentLang === 'es'
    ? '¡Hola! Soy tu asistente de Bold Horizons Financial. ¿En qué puedo ayudarte hoy?'
    : 'Hello! I\'m your Bold Horizons Financial assistant. How can I help you today?';
  addMsg('bot', welcomeMsg);
}, 500);

// Chat form submit
formEl.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const text = inputEl.value.trim();
  if(!text) return;

  addMsg("user", text);
  inputEl.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = currentLang === 'es' ? 'Enviando...' : 'Sending...';

  try{
    const t = translations[currentLang];
    const data = await mustJson(await fetch("/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message: text,
        history: history,
        system: t.systemPrompt
      })
    }));

    addMsg("bot", data.reply);
    history.push({ role:"user", content:text });
    history.push({ role:"assistant", content:data.reply });

    // Auto-play TTS response (optional)
    // await speakText(data.reply);
  }catch(err){
    addMsg("bot", `Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = translations[currentLang].sendBtn;
  }
});

// TTS function
async function speakText(text) {
  if (!text) return;

  try {
    const voice = currentLang === 'es' ? 'Kore' : 'Kore'; // You can configure different voices
    const r = await fetch("/api/tts", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ text, voice })
    });

    if(!r.ok){
      let err={};
      try{ err = await r.json(); }catch{}
      throw new Error(err.error || `TTS HTTP ${r.status}`);
    }

    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    ttsAudio.src = url;
    ttsAudio.style.display = 'block';
    ttsAudio.play();
  } catch(e) {
    console.error('TTS error:', e);
  }
}

// TTS button
ttsBtn.addEventListener("click", async ()=>{
  const text = ttsText.value.trim();
  if(!text) return;

  ttsBtn.disabled = true;
  ttsBtn.textContent = currentLang === 'es' ? 'Generando...' : 'Generating…';

  try {
    await speakText(text);
  } catch(e) {
    alert(e.message);
  } finally {
    ttsBtn.disabled = false;
    ttsBtn.textContent = translations[currentLang].speakBtn;
  }
});
