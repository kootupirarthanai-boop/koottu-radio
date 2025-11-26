// koottu-radio.js
// Simple "Listen to this post" player using Web Speech API

(function () {
  // ---- helpers -------------------------------------------------------------

  function log(msg) {
    if (window.console && console.log) {
      console.log("[Koottu Radio]", msg);
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  // ---- speech synthesis setup ---------------------------------------------

  const synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let isPlaying = false;
  let voiceReady = false;
  let selectedVoice = null;

  function findBestVoice() {
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    // Prefer Tamil voices
    let taVoices = voices.filter(v =>
      v.lang && v.lang.toLowerCase().startsWith("ta")
    );
    if (taVoices.length) return taVoices[0];

    // Fallback: any Indian English voice
    let enIn = voices.filter(v =>
      v.lang && v.lang.toLowerCase().startsWith("en-in")
    );
    if (enIn.length) return enIn[0];

    // Last fallback: first available
    return voices[0];
  }

  function ensureVoiceReady(callback) {
    if (!synth) return callback();

    const trySet = () => {
      selectedVoice = findBestVoice();
      voiceReady = true;
      callback();
    };

    // Some browsers already have voices
    const voices = synth.getVoices();
    if (voices && voices.length) {
      trySet();
      return;
    }

    // Others fire voiceschanged when ready
    synth.addEventListener("voiceschanged", function onVoicesChanged() {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      trySet();
    });
  }

  // ---- building the player -------------------------------------------------

  function buildPlayer() {
    let container = document.getElementById("blog-radio");
    if (!container) {
      // If the widget div is missing, create one at the end of the body
      container = createEl("div");
      container.id = "blog-radio";
      document.body.appendChild(container);
    }
    container.innerHTML = "";

    // Wrapper
    const box = createEl("div", "kr-box");
    container.appendChild(box);

    const title = createEl(
      "div",
      "kr-title",
      "கூட்டுப் பிரார்த்தனை அருள்வாக்கு ரேடியோ 24/7"
    );
    box.appendChild(title);

    const subtitle = createEl(
      "div",
      "kr-subtitle",
      "இந்த பதிவை உரையாடும் குரலில் கேட்க Play பொத்தானை அழுத்தவும்."
    );
    box.appendChild(subtitle);

    // Controls
    const controls = createEl("div", "kr-controls");
    const playBtn = createEl("button", "kr-btn kr-play", "▶ Play");
    const stopBtn = createEl("button", "kr-btn kr-stop", "■ Stop");
    stopBtn.disabled = true;
    controls.appendChild(playBtn);
    controls.appendChild(stopBtn);
    box.appendChild(controls);

    // Status
    const status = createEl("div", "kr-status", "");
    status.setAttribute("aria-live", "polite");
    box.appendChild(status);

    // Styling (simple, no external CSS)
    const style = document.createElement("style");
    style.textContent = `
      #blog-radio .kr-box {
        border-radius: 8px;
        padding: 12px 14px;
        background: #fffaf0;
        border: 1px solid #e0c48a;
        font-family: "Noto Sans Tamil", "Latha", Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      }
      #blog-radio .kr-title {
        font-weight: 700;
        color: #b35412;
        margin-bottom: 4px;
      }
      #blog-radio .kr-subtitle {
        font-size: 14px;
        margin-bottom: 8px;
        color: #333;
      }
      #blog-radio .kr-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
      }
      #blog-radio .kr-btn {
        flex: 0 0 auto;
        padding: 6px 12px;
        font-size: 14px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
      }
      #blog-radio .kr-play {
        background: #0b8043;
        color: #fff;
      }
      #blog-radio .kr-stop {
        background: #d32f2f;
        color: #fff;
      }
      #blog-radio .kr-btn:disabled {
        opacity: 0.5;
        cursor: default;
      }
      #blog-radio .kr-status {
        font-size: 13px;
        color: #555;
      }
    `;
    document.head.appendChild(style);

    // ---- behaviour --------------------------------------------------------

    if (!synth) {
      status.textContent =
        "இந்த உலாவியில் (browser) குரல் ஒலி வசதி இல்லை. தயவு செய்து Chrome / Edge போன்ற உலாவியை பயன்படுத்தவும்.";
      playBtn.disabled = true;
      stopBtn.disabled = true;
      return;
    }

    function getPostText() {
      // Try typical Blogger post body containers
      const bodyEl =
        document.querySelector(".post-body") ||
        document.querySelector(".post") ||
        document.querySelector("article") ||
        document.body;

      const text = (bodyEl.innerText || bodyEl.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      return text;
    }

    function speak() {
      const text = getPostText();
      if (!text) {
        status.textContent = "இந்தப் பதிவில் படிக்க text எதுவும் இல்லை.";
        return;
      }

      if (synth.speaking) {
        synth.cancel();
      }

      const utter = new SpeechSynthesisUtterance(text);
      currentUtterance = utter;

      if (selectedVoice) utter.voice = selectedVoice;
      utter.rate = 0.9; // a bit slower to make Tamil clearer
      utter.pitch = 1.0;

      utter.onstart = function () {
        isPlaying = true;
        playBtn.textContent = "⏸ Pause";
        stopBtn.disabled = false;
        status.textContent = "பதிவு வாசிக்கப்படுகிறது…";
      };
      utter.onend = function () {
        isPlaying = false;
        playBtn.textContent = "▶ Play";
        stopBtn.disabled = true;
        status.textContent = "வாசிப்பு முடிந்தது.";
      };
      utter.onerror = function (e) {
        log(e.error || e);
        isPlaying = false;
        playBtn.textContent = "▶ Play";
        stopBtn.disabled = true;
        status.textContent =
          "ஒலி வாசிப்பில் சிக்கல் ஏற்பட்டது. சில நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
      };

      synth.speak(utter);
    }

    playBtn.addEventListener("click", function () {
      if (!voiceReady) {
        // First click: ensure voices are ready, then speak
        ensureVoiceReady(function () {
          voiceReady = true;
          speak();
        });
        return;
      }

      if (!isPlaying && !synth.speaking) {
        speak();
      } else if (synth.paused) {
        synth.resume();
        playBtn.textContent = "⏸ Pause";
        status.textContent = "வாசிப்பு தொடர்கிறது…";
      } else if (synth.speaking) {
        synth.pause();
        playBtn.textContent = "▶ Resume";
        status.textContent = "வாசிப்பு இடைநிறுத்தப்பட்டது.";
      }
    });

    stopBtn.addEventListener("click", function () {
      if (synth.speaking || synth.paused) {
        synth.cancel();
      }
      isPlaying = false;
      playBtn.textContent = "▶ Play";
      stopBtn.disabled = true;
      status.textContent = "வாசிப்பு நிறுத்தப்பட்டது.";
    });
  }

  // ---- bootstrap ----------------------------------------------------------

  function initWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", buildPlayer);
    } else {
      buildPlayer();
    }
  }

  try {
    initWhenReady();
  } catch (e) {
    log(e);
  }
})();
