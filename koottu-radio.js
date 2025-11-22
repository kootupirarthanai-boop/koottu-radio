// ✅ KOOTTU RADIO - FIXED FOR INDIA AND ALL ANDROID PHONES
// This version waits for Tamil voices to load and reads full blog without stopping.

function getTamilVoice() {
  const voices = speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === "ta-IN") ||
    voices.find(v => v.lang.startsWith("ta")) ||
    voices[0]
  );
}

function splitIntoChunks(text, maxLen = 180) {
  const clean = text.replace(/\n+/g, " ").trim();
  const sentences = clean.split(/(?<=[.!?।])\s+/);

  const chunks = [];
  let buf = "";

  for (const s of sentences) {
    if ((buf + " " + s).length > maxLen) {
      if (buf.trim()) chunks.push(buf.trim());
      buf = s;
    } else {
      buf += " " + s;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

async function speakTextSafely(fullText) {
  speechSynthesis.cancel();

  // ✅ Wait for voices (India Android fix)
  if (!speechSynthesis.getVoices().length) {
    await new Promise(res => {
      speechSynthesis.onvoiceschanged = () => res();
      setTimeout(res, 1500); // backup wait
    });
  }

  const voice = getTamilVoice();
  const chunks = splitIntoChunks(fullText);

  let i = 0;

  function speakNext() {
    if (i >= chunks.length) return;

    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang = "ta-IN";
    if (voice) u.voice = voice;
    u.rate = 1;
    u.pitch = 1;

    u.onend = () => {
      i++;
      speakNext();
    };

    u.onerror = () => {
      i++;
      speakNext(); // ✅ never stop fully
    };

    speechSynthesis.speak(u);
  }

  speakNext();
}

// ✅ Extract blog text (simple safe version)
function extractBlogText() {
  const post = document.querySelector(".post-body, article, .entry-content");
  if (!post) return "";
  return post.innerText || post.textContent || "";
}

// ✅ Play button binding (must exist on page)
function initKoottuRadio() {
  const btn = document.getElementById("radioPlayBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const text = extractBlogText();
    if (!text.trim()) {
      alert("இந்த பதிவில் வாசிக்கத் தேவையான தகவல் இல்லை.");
      return;
    }
    speakTextSafely(text);
  });
}

document.addEventListener("DOMContentLoaded", initKoottuRadio);
