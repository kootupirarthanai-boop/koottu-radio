/* Koottu Pirarthanai - Label Archive (Tamil labels, safer version) */

(function () {
  const BLOG_URL = "https://koottuppirarthanai.blogspot.com";
  const MAX_POSTS = 500; // enough for whole blog

  // key  = exact label text in Blogger
  // title = heading we show in the sidebar
  const LABEL_CONFIG = [
    {
      key: "31-08-2025 - திருஅண்ணாமலை",
      title: "31-08-2025 - திருஅண்ணாமலை"
    },
    {
      // EXACT Blogger label text (no spaces before/after last dash)
      key: "02-11-2025-திருஅண்ணாமலை",
      // Nicely formatted title to show in the widget
      title: "02-11-2025 - திருஅண்ணாமலை"
    },
    {
      // EXACT Blogger label text (no spaces before/after last dash)
      key: "19-12-2025-இலங்கை",
      // Nicely formatted title to show in the widget
      title: "19-12-2025-இலங்கை"
    },
    {
      // EXACT Blogger label text (no spaces before/after last dash)
      key: "23-12-2025-இலங்கை",
      // Nicely formatted title to show in the widget
      title: "23-12-2025-இலங்கை"
    },
    {
      // EXACT Blogger label text (no spaces before/after last dash)
      key: "21-12-2025-இலங்கை",
      // Nicely formatted title to show in the widget
      title: "21-12-2025-இலங்கை"
    },
    {
      // EXACT Blogger label text (no spaces before/after last dash)
      key: "07-12-2025-மதுரை",
      // Nicely formatted title to show in the widget
      title: "07-12-2025 - மதுரை"
    },
    {
      key: "05-10-2025 - மதுரை",
      title: "05-10-2025 - மதுரை"
    },
    {
      key: "27-7-2025  - பாபநாசம்", // note the double space before the dash
      title: "27-7-2025  - பாபநாசம்"
    }
  ];

  function toggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === "none") ? "block" : "none";
  }

  function section(title, posts) {
    const id = "lbl_" + title.replace(/\s+/g, "_");
    let html = `
      <div style="margin:10px 0;">
        <div onclick="window.__kp_toggle('${id}')"
             style="cursor:pointer;font-weight:bold;color:#006600;font-size:17px;">
          ▶ ${title} (${posts.length})
        </div>
        <ul id="${id}" style="display:none;padding-left:18px;margin:6px 0 0 0;">
    `;

    posts.forEach(p => {
      html += `
        <li style="margin:4px 0;">
          <a href="${p.link}" style="color:#006600;text-decoration:none;">
            ${p.title}
          </a>
        </li>
      `;
    });

    html += `</ul></div>`;
    return html;
  }

  // Load all posts via Blogger JSON-in-script
  function loadAllPosts() {
    return new Promise(resolve => {
      const cb = "__kp_all_" + Math.random().toString(36).slice(2);

      window[cb] = data => {
        const entries = (data.feed && data.feed.entry) ? data.feed.entry : [];
        resolve(entries);
        try { delete window[cb]; } catch (e) {}
        s.remove();
      };

      const s = document.createElement("script");
      s.src = `${BLOG_URL}/feeds/posts/default?alt=json-in-script&max-results=${MAX_POSTS}&callback=${cb}`;
      document.body.appendChild(s);
    });
  }

  async function build() {
    const box = document.getElementById("label-archive");
    if (!box) return;
    box.innerHTML = "Loading…";

    const entries = await loadAllPosts();

    const allPosts = entries.map(e => {
      const title = e.title.$t;
      const linkObj = (e.link || []).find(l => l.rel === "alternate");
      const link = linkObj ? linkObj.href : "#";
      const cats = (e.category || []).map(c => (c.term || "").trim());
      return { title, link, cats };
    });

    // Debug: log all labels we actually see from the feed
    const uniqueLabels = new Set();
    allPosts.forEach(p => p.cats.forEach(c => uniqueLabels.add(c)));
    console.log("ALL LABELS FROM FEED:", Array.from(uniqueLabels));

    let html = "";

    LABEL_CONFIG.forEach(cfg => {
      const postsForLabel = allPosts.filter(p =>
        p.cats.some(c => c.trim() === cfg.key.trim())
      );
      html += section(cfg.title, postsForLabel);
    });

    box.innerHTML = html;
  }

  // Expose toggle function globally for onclick
  window.__kp_toggle = toggle;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
