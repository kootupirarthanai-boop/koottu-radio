/*  Koottu Pirarthanai - Tamil Blog Radio Player  */

const BLOG_URL = "https://koottuppirarthanai.blogspot.com";
const MAX_POSTS = 40;

let posts = [];
let current = 0;
let speaking = false;
let tamilVoice = null;

// ----- Load Tamil Voice -----
function pickTamilVoice() {
    const voices = speechSynthesis.getVoices();
    tamilVoice = voices.find(v => v.lang === "ta-IN") ||
                 voices.find(v => v.lang.startsWith("ta"));

    if (!tamilVoice) {
        const status = document.getElementById("radio-status");
        if (status)
            status.innerText = "⚠️ இந்த சாதனத்தில் தமிழ் குரல் நிறுவப்படவில்லை. தயவு செய்து Tamil Text-to-Speech ஐ நிறுவவும்.";
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
    if (status)
        status.innerText = `Loaded ${posts.length} Tamil posts. Press Play.`;
}

// JSON-in-script (CORS-free)
(function loadPosts() {
    const s = document.createElement("script");
    s.src = `${BLOG_URL}/feeds/posts/default?alt=json-in-script&max-results=${MAX_POSTS}&callback=handleFeed`;
    document.body.appendChild(s);
})();

// ----- Speak Tamil Text -----
function speakTamil(text, onEnd) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ta-IN";
    u.rate = 0.95;

    if (tamilVoice) u.voice = tamilVoice;

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
            "📻 Radio finished reading all Tamil posts ✔️";
        speaking = false;
        return;
    }

    const p = posts[current];

    document.getElementById("radio-status").innerText =
        `📖 இப்போது வாசிக்கும் (${current + 1}/${posts.length}): ${p.title}`;

    speakTamil(p.title, () => {
        speakTamil(p.text, () => {
            current++;
            playNextPost();
        });
    });
}

function pauseRadio() {
    speechSynthesis.pause();
}
function resumeRadio() {
    speechSynthesis.resume();
}
function stopRadio() {
    speaking = false;
    speechSynthesis.cancel();
    document.getElementById("radio-status").innerText = "Radio stopped.";
}

// ----- Mount Player UI -----
document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("blog-radio");
    if (!box) return;

    box.innerHTML = `
        <div style="font-family:Arial; background:#111; color:#fff; padding:14px; border-radius:10px;">
            <h3 style="margin:0 0 10px 0;">📻 Tamil Blog Radio – Koottu Pirarthanai</h3>

            <button onclick="startRadio()" style="padding:7px 14px;">▶ Play</button>
            <button onclick="pauseRadio()" style="padding:7px 14px;">⏸ Pause</button>
            <button onclick="resumeRadio()" style="padding:7px 14px;">🔊 Resume</button>
            <button onclick="stopRadio()" style="padding:7px 14px;">⏹ Stop</button>

            <p id="radio-status" style="margin-top:12px; font-size:14px;">Loading Tamil posts…</p>
        </div>
    `;
});
