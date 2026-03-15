"""
migrate_pages.py
────────────────
Memindahkan semua halaman HTML ke struktur pages/ dan mengupdate
semua internal href & src ke path absolut.

SEBELUM:
  projects.html           → href="projects.html"
  contact.html            → href="contact.html"

SESUDAH:
  pages/projects/index.html  → href="/projects/"
  pages/contact/index.html   → href="/contact/"
  index.html tetap di root   → href="/"

Yang diupdate otomatis:
  ✅ href="namahalaman.html"     → href="/namahalaman/"
  ✅ href="index.html"           → href="/"
  ✅ src="css/..."               → src="/css/..."
  ✅ src="js/..."                → src="/js/..."
  ✅ href="css/..."              → href="/css/..."
  ✅ src="lang.js"               → src="/js/lang.js"

Cara pakai:
  1. Pastikan refactor_assets.py sudah dijalankan dulu
  2. Taruh script ini di folder yang sama dengan file .html
  3. python migrate_pages.py
"""

import os
import re
import shutil

# ─── Konfigurasi ────────────────────────────────────────────
SOURCE_DIR = "."
PAGES_DIR  = "pages"

# Halaman yang TIDAK dipindah ke pages/ (tetap di root)
ROOT_PAGES = {"index.html"}

# Mapping: nama file → slug URL
PAGE_MAP = {
    "index.html"        : "/",
    "projects.html"     : "/projects/",
    "experience.html"   : "/experience/",
    "education.html"    : "/education/",
    "skills.html"       : "/skills/",
    "achievements.html" : "/achievements/",
    "talks.html"        : "/talks/",
    "volunteering.html" : "/volunteering/",
    "ai-lab.html"       : "/ai-lab/",
    "contact.html"      : "/contact/",
}
# ────────────────────────────────────────────────────────────


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# ══════════════════════════════════════════════════════════════
# Update semua path di dalam konten HTML
# ══════════════════════════════════════════════════════════════

def update_paths(content):
    # 1. href="namahalaman.html" → href="/namahalaman/"
    #    href="index.html"       → href="/"
    def replace_href(m):
        filename = m.group(1)
        if filename in PAGE_MAP:
            return f'href="{PAGE_MAP[filename]}"'
        return m.group(0)  # biarkan jika tidak dikenal

    content = re.sub(r'href="([a-zA-Z0-9_-]+\.html)"', replace_href, content)

    # 2. src="css/..." → src="/css/..."
    content = re.sub(r'(src|href)="css/', r'\1="/css/', content)

    # 3. src="js/..." → src="/js/..."
    content = re.sub(r'src="js/', r'src="/js/', content)

    # 4. src="lang.js" → src="/js/lang.js"
    content = re.sub(r'src="lang\.js"', r'src="/js/lang.js"', content)

    return content


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

def main():
    html_files = sorted(
        f for f in os.listdir(SOURCE_DIR)
        if f.endswith(".html") and not f.startswith("_")
    )

    if not html_files:
        print("⚠️  Tidak ada file .html ditemukan.")
        return

    print(f"\n🚀  Migrasi {len(html_files)} file HTML ke struktur pages/\n")

    # Pindahkan lang.js ke js/ jika belum
    lang_src = os.path.join(SOURCE_DIR, "lang.js")
    lang_dst = os.path.join(SOURCE_DIR, "js", "lang.js")
    if os.path.exists(lang_src) and not os.path.exists(lang_dst):
        shutil.copy2(lang_src, lang_dst)
        print(f"  📦  lang.js  →  js/lang.js\n")

    for filename in html_files:
        src_path = os.path.join(SOURCE_DIR, filename)
        content  = read(src_path)

        # Update semua path dulu
        updated = update_paths(content)

        if filename in ROOT_PAGES:
            # index.html tetap di root, overwrite langsung
            write(src_path, updated)
            print(f"  ✅  {filename:<25} → (tetap di root, path diupdate)")
        else:
            # Pindah ke pages/slug/index.html
            slug     = PAGE_MAP.get(filename, "").strip("/")
            dst_path = os.path.join(SOURCE_DIR, PAGES_DIR, slug, "index.html")
            write(dst_path, updated)

            # Hapus file .html lama di root
            os.remove(src_path)
            print(f"  ✅  {filename:<25} → pages/{slug}/index.html")

    print(f"""
✨  Selesai! Struktur baru:

  index.html                ← tetap di root
  pages/
    projects/index.html
    experience/index.html
    education/index.html
    skills/index.html
    achievements/index.html
    talks/index.html
    volunteering/index.html
    ai-lab/index.html
    contact/index.html
  css/
    shared.css
    [page].css
  js/
    shared.js
    lang.js
    [page].js

⚠️  Jangan lupa:
  1. Tambahkan vercel.json atau netlify.toml (jalankan setup_config.py)
  2. Test semua link di browser sebelum deploy
""")


if __name__ == "__main__":
    main()
