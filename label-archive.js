/* Koottu Pirarthanai - Label Archive (Tamil labels) */

(function () {
  const BLOG_URL = "https://koottuppirarthanai.blogspot.com";
  const LABELS = ["31-08-2025 - திருஅண்ணாமலை", "2-11-2025- திருவண்ணாமலை", "05-10-2025 - மதுரை", "27-7-2025  - பாபநாசம்"];
  const MAX_POSTS = 500; // enough for whole blog

  function toggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === "none") ? "block" : "none";
  }

  function section(label, posts) {
    const id = "lbl_" + label.replace(/\s+/g, "_");
    let html = `
      <div style="margin:10px 0;">
        <div onclick="window.__kp_toggle('${id}')"
             style="cursor:pointer;font-weight:bold;color:#006600;font-size:17px;">
          ▶ ${label} (${posts.length})
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

  // Load all posts once via JSON-in-script
  function loadAllPosts() {
    return new Promise(resolve => {
      const cb = "__kp_all_" + Math.random().toString(36).slice(2);
      window[cb] = data => {
        const entries = (data.feed && data.feed.entry) ? data.feed.entry : [];
        resolve(entries);
        try { delete window[cb]; } catch(e){}
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

    let html = "";
    LABELS.forEach(label => {
      const postsForLabel = allPosts.filter(p => p.cats.includes(label));
      html += section(label, postsForLabel);
    });

    box.innerHTML = html;
  }

  // Expose a safe toggle func for inline onclick
  window.__kp_toggle = toggle;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
