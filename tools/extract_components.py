"""
extract_components.py
─────────────────────
Ekstrak nav & footer ke components/ dan update semua HTML.

Sebelum:
  <nav>...</nav>          → inline di setiap halaman
  <footer>...</footer>    → inline di setiap halaman

Sesudah:
  components/nav.html     → markup nav (dengan placeholder active class)
  components/footer.html  → markup footer
  shared.js               → fetch & inject components, set active nav link

Cara pakai:
  python extract_components.py
"""

import os, re

SOURCE_DIR   = "."
PAGES_DIR    = "pages"
COMP_DIR     = "components"

# ── Nav markup (tanpa class="active" — diset dinamis oleh JS) ──
NAV_HTML = """<nav>
  <div class="nav-inner">
    <a class="nav-logo" href="/">M<span>.</span>AS</a>
    <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links" id="navLinks">
      <li><a href="/">Home</a></li>
      <li><a href="/experience/">Experience</a></li>
      <li><a href="/projects/">Projects</a></li>
      <li><a href="/skills/">Skills</a></li>
      <li><a href="/education/">Education</a></li>
      <li><a href="/achievements/">Achievements</a></li>
      <li><a href="/talks/">Talks</a></li>
      <li><a href="/volunteering/">Volunteering</a></li>
      <li><a href="/ai-lab/">AI Lab ✦</a></li>
    </ul>
    <button id="langBtn" aria-label="Switch language" style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#f5f5f7;font-size:12px;font-weight:600;padding:6px 11px;border-radius:8px;cursor:pointer;transition:all .2s;letter-spacing:.3px;white-space:nowrap;font-family:inherit;margin-right:8px;"><span class="lb-flag">🌐</span><span class="lb-code">EN</span></button>
    <a class="nav-cta" href="/contact/">Contact →</a>
  </div>
</nav>"""

# ── Footer markup ───────────────────────────────────────────────
FOOTER_HTML = """<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="footer-logo">M<span>.</span>AS</div>
        <p class="footer-tagline">AI Builder focused on multimodal systems and foundation models for Indonesian local languages. Bridging culture, language, and intelligence.</p>
        <div class="footer-social">
          <a href="mailto:Rianari990@gmail.com" class="social-icon" title="Email">✉️</a>
          <a href="#" class="social-icon" title="LinkedIn">in</a>
          <a href="#" class="social-icon" title="GitHub" style="font-size:12px;font-weight:700;">GH</a>
          <a href="#" class="social-icon" title="X / Twitter" style="font-size:12px;font-weight:800;">𝕏</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <a href="/">Home</a>
        <a href="/experience/">Experience</a>
        <a href="/projects/">Projects</a>
        <a href="/skills/">Skills</a>
        <a href="/education/">Education</a>
        <a href="/achievements/">Achievements</a>
        <a href="/talks/">Talks</a>
        <a href="/ai-lab/">AI Lab</a>
        <a href="/contact/">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Featured Projects</h4>
        <a href="/projects/">Arutala v2.2</a>
        <a href="/projects/">IndoLLNet v2.1</a>
        <a href="/projects/">ARUNA 7B</a>
        <a href="/projects/">DIALEKTA 2B</a>
        <a href="/projects/">MANDALA</a>
        <a href="/projects/">SABDARANA</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="mailto:Rianari990@gmail.com">Rianari990@gmail.com</a>
        <a href="tel:+6282243990884">+62 822 4399 0884</a>
        <a href="#">Yogyakarta, Indonesia</a>
        <div style="margin-top:16px;">
          <span class="footer-badge">● Available for Collab</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© 2025 Marchel Andrian Shevchenko · Built with 🤖 & ☕ in Yogyakarta · <a href="mailto:Rianari990@gmail.com">Get in Touch</a></div>
      <div class="footer-bottom-right">AI Builder · MIT Pre-PhD · NVIDIA Awardee</div>
    </div>
  </div>
</footer>"""

# ── JS snippet to append to shared.js ──────────────────────────
SHARED_JS_ADDITION = """
// ═══ COMPONENTS LOADER ═══
(function loadComponents() {
  // Inject nav
  const navEl = document.getElementById('nav-placeholder');
  if (navEl) {
    fetch('/components/nav.html')
      .then(r => r.text())
      .then(html => {
        navEl.outerHTML = html;
        // Set active link based on current path
        const path = window.location.pathname;
        document.querySelectorAll('.nav-links a').forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === path || 
              (path !== '/' && a.getAttribute('href') !== '/' && path.startsWith(a.getAttribute('href')))) {
            a.classList.add('active');
          }
        });
        // Re-init hamburger after nav is loaded
        const ham = document.getElementById('navHamburger');
        const nl  = document.getElementById('navLinks');
        if (ham && nl) ham.addEventListener('click', () => { ham.classList.toggle('open'); nl.classList.toggle('open'); });
      });
  }

  // Inject footer
  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) {
    fetch('/components/footer.html')
      .then(r => r.text())
      .then(html => { footerEl.outerHTML = html; });
  }
})();
"""


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def replace_tag(html, tag, placeholder_id):
    """Ganti <tag>...</tag> dengan <div id="placeholder_id"></div>"""
    pattern = rf"<{tag}[\s>].*?</{tag}>"
    placeholder = f'<div id="{placeholder_id}"></div>'
    result = re.sub(pattern, placeholder, html, count=1, flags=re.DOTALL | re.IGNORECASE)
    return result


def main():
    print("\n🔧  Extracting components...\n")

    # 1. Buat folder components/
    os.makedirs(COMP_DIR, exist_ok=True)

    # 2. Tulis nav.html & footer.html
    write(os.path.join(COMP_DIR, "nav.html"),    NAV_HTML)
    write(os.path.join(COMP_DIR, "footer.html"), FOOTER_HTML)
    print(f"  ✅  components/nav.html")
    print(f"  ✅  components/footer.html\n")

    # 3. Update index.html (root)
    index_path = os.path.join(SOURCE_DIR, "index.html")
    html = read(index_path)
    html = replace_tag(html, "nav",    "nav-placeholder")
    html = replace_tag(html, "footer", "footer-placeholder")
    write(index_path, html)
    print(f"  ✅  index.html")

    # 4. Update semua pages/
    pages = sorted(os.listdir(PAGES_DIR))
    for page in pages:
        path = os.path.join(PAGES_DIR, page, "index.html")
        if not os.path.exists(path):
            continue
        html = read(path)
        html = replace_tag(html, "nav",    "nav-placeholder")
        html = replace_tag(html, "footer", "footer-placeholder")
        write(path, html)
        print(f"  ✅  pages/{page}/index.html")

    # 5. Append component loader ke shared.js
    shared_js_path = os.path.join(SOURCE_DIR, "js", "shared.js")
    current_js = read(shared_js_path)
    if "COMPONENTS LOADER" not in current_js:
        with open(shared_js_path, "a", encoding="utf-8") as f:
            f.write(SHARED_JS_ADDITION)
        print(f"\n  ✅  js/shared.js (component loader ditambahkan)")
    else:
        print(f"\n  ⏭️   js/shared.js (sudah ada component loader)")

    print(f"""
✨  Selesai!

  components/
    nav.html      ← satu sumber nav untuk semua halaman
    footer.html   ← satu sumber footer untuk semua halaman

  Semua HTML sekarang pakai:
    <div id="nav-placeholder"></div>
    <div id="footer-placeholder"></div>

  shared.js otomatis fetch & inject components saat halaman load.

⚠️  Mulai sekarang kalau mau edit nav atau footer,
    cukup edit di components/nav.html atau components/footer.html saja.
""")

if __name__ == "__main__":
    main()
