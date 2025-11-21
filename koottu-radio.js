/*  Koottu Pirarthanai - Tamil Blog Radio Player (User Toggle)  */

const BLOG_URL = "https://koottuppirarthanai.blogspot.com";
const MAX_POSTS = 40;

let posts = [];
let current = 0;
let speaking = false;

let tamilVoice = null;
let tamilEnabled = false; // ✅ default OFF, user can turn ON

// ----- Voice Picker -----
function pickTamilVoice() {
  const voices = speechSynthesis.getVoices();

  tamilVoice =
    voices.find(v => v.lang === "ta-IN" && /google/i.test(v.name)) ||
    voices.find(v => v.lang === "ta-IN") ||
    voices.find(v => v.lang.startsWith("ta")) ||
    null;

  const status = document.getElementById("radio-status");
  if (tamilEnabled && !tamilVoice && status) {
    status.innerText =
      "⚠️ Tamil voice not found on this device. Please install Tamil Text-to-Speech in phone settings.";
  }
}
speechSynthesis.onvoiceschanged = pickTamilVoice;
pickTamilVoice();

// ----- Load Posts from Blogger Feed -----
function handleFeed(data) {
  posts = (data.feed.entry || []).map(e => {
    const title = e.title.$t;
    const content = (e.content ? e.content.$t : "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { title, text: content };
  });

  const status = document.getElementById("radio-status");
  if (status) {
    status.innerText = `Loaded ${posts.length} posts. Press Play.`;
  }
}

// JSON-in-script (CORS-free)
(function loadPosts() {
  const s = document.createElement("script");
  s.src = `${BLOG_URL}/feeds/posts/default?alt=json-in-script&max-results=${MAX_POSTS}&callback=handleFeed`;
  document.body.appendChild(s);
})();

// ----- Speak Text -----
function speakText(text, onEnd) {
  const u = new SpeechSynthesisUtterance(text);

  if (tamilEnabled && tamilVoice) {
    u.lang = "ta-IN";
    u.voice = tamilVoice;
  } else {
    u.lang = "en-IN"; // fallback language
  }

  u.rate = 0.95;
  u.onend = onEnd;
  speechSynthesis.speak(u);
}

// ----- Radio Controls -----
function startRadio() {
  if (!posts.length) {
    document.getElementById("radio-status").innerText =
      "Posts not loaded yet. Wait a few seconds.";
    return;
  }
  if (speaking) return;

  speaking = true;
  current = 0;
  playNextPost();
}

function playNextPost() {
  if (!speaking || current >= posts.length) {
    document.getElementById("radio-status").innerText =
      "📻 Radio finished reading all posts ✔️";
    speaking = false;
    return;
  }

  const p = posts[current];
  document.getElementById("radio-status").innerText =
    `📖 Now reading (${current + 1}/${posts.length}): ${p.title}`;

  speakText(p.title, () => {
    speakText(p.text, () => {
      current++;
      playNextPost();
    });
  });
}

function pauseRadio() { speechSynthesis.pause(); }
function resumeRadio() { speechSynthesis.resume(); }
function stopRadio() {
  speaking = false;
  speechSynthesis.cancel();
  document.getElementById("radio-status").innerText = "Radio stopped.";
}

// ----- Tamil Toggle -----
function toggleTamilVoice() {
  tamilEnabled = !tamilEnabled;
  pickTamilVoice();

  const btn = document.getElementById("tamil-toggle");
  if (btn) {
    btn.innerText = tamilEnabled ? "தமிழ் குரல்: ON" : "தமிழ் குரல்: OFF";
  }

  const status = document.getElementById("radio-status");
  if (status) {
    status.innerText = tamilEnabled
      ? "Tamil voice ON. Press Play."
      : "Tamil voice OFF. Press Play.";
  }
}

// ----- Mount Player UI -----
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("blog-radio");
  if (!box) return;

  box.innerHTML = `
    <div style="font-family:Arial; background:#111; color:#fff; padding:14px; border-radius:10px;">
      <h3 style="margin:0 0 10px 0;">📻 Blog Radio – Koottu Pirarthanai</h3>

      <button onclick="startRadio()" style="padding:7px 14px;">▶ Play</button>
      <button onclick="pauseRadio()" style="padding:7px 14px;">⏸ Pause</button>
      <button onclick="resumeRadio()" style="padding:7px 14px;">🔊 Resume</button>
      <button onclick="stopRadio()" style="padding:7px 14px;">⏹ Stop</button>

      <button id="tamil-toggle" onclick="toggleTamilVoice()"
        style="padding:7px 14px; margin-left:6px; background:#0a7; color:#fff; border:0; border-radius:6px; cursor:pointer;">
        தமிழ் குரல்: OFF
      </button>

      <p id="radio-status" style="margin-top:12px; font-size:14px;">Loading posts…</p>

      <p style="margin-top:8px; font-size:12px; opacity:0.8;">
        💡 Tamil voice works if your phone has Tamil Text-to-Speech installed (Android: Settings → Text-to-Speech → Install Tamil voice).
      </p>
    </div>
  `;
});
