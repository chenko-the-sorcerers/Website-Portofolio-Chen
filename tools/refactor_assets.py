"""
refactor_assets.py
──────────────────
Memisahkan CSS & JS dari setiap file HTML menjadi:

  css/
    shared.css      ← CSS yang muncul di 8+ halaman (nav, footer, cursor, dll)
    index.css       ← CSS khusus index.html
    contact.css     ← CSS khusus contact.html
    ...

  js/
    shared.js       ← JS yang muncul di 8+ halaman (cursor logic, hamburger, dll)
    index.js        ← JS khusus index.html
    contact.js      ← JS khusus contact.html
    ...

Setiap file HTML diupdate otomatis:
  - <style>...</style>  → <link rel="stylesheet" href="css/shared.css">
                          <link rel="stylesheet" href="css/namahalaman.css">
  - <script>...</script> inline → <script src="js/shared.js"></script>
                                   <script src="js/namahalaman.js"></script>

Cara pakai:
  1. Taruh script ini di folder yang sama dengan file .html
  2. python refactor_assets.py
  3. Cek folder css/ dan js/ yang terbentuk
"""

import os
import re
from collections import Counter

# ─── Konfigurasi ───────────────────────────────────────────────
SOURCE_DIR   = "."          # folder tempat file .html berada
CSS_DIR      = "css"        # folder output CSS
JS_DIR       = "js"         # folder output JS
SHARED_THRESHOLD = 8        # muncul di berapa file agar dianggap "shared"
# ───────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def extract_block(raw, tag):
    """Ambil isi pertama dari <tag>...</tag> (tanpa tag-nya)."""
    pattern = rf"<{tag}[^>]*>(.*?)</{tag}>"
    m = re.search(pattern, raw, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else ""

def split_css_chunks(css):
    """Pecah CSS menjadi list of rule-blocks (pisah di baris baru yang tidak indent)."""
    return [c.strip() for c in re.split(r'\n(?=[^\s])', css) if c.strip()]

def split_js_lines(js):
    """Kembalikan baris-baris JS sebagai list."""
    return [l for l in js.splitlines()]


# ══════════════════════════════════════════════════════════════
# STEP 1 — Kumpulkan semua CSS & JS dari setiap file
# ══════════════════════════════════════════════════════════════

def collect(html_files):
    data = {}  # filename → {css, js, raw}
    for filename in html_files:
        raw = read(os.path.join(SOURCE_DIR, filename))
        css = extract_block(raw, "style")

        # Ambil semua <script> inline (abaikan <script src=...>)
        js_blocks = re.findall(
            r"<script(?![^>]*\bsrc\b)[^>]*>(.*?)</script>",
            raw, re.DOTALL | re.IGNORECASE
        )
        js = "\n\n".join(b.strip() for b in js_blocks if b.strip())

        data[filename] = {"css": css, "js": js, "raw": raw}
    return data


# ══════════════════════════════════════════════════════════════
# STEP 2 — Deteksi shared CSS
# ══════════════════════════════════════════════════════════════

def detect_shared_css(data):
    all_chunks = []
    for d in data.values():
        all_chunks.extend(split_css_chunks(d["css"]))

    counts = Counter(all_chunks)
    shared_chunks = {chunk for chunk, count in counts.items()
                     if count >= SHARED_THRESHOLD}
    return shared_chunks


# ══════════════════════════════════════════════════════════════
# STEP 3 — Deteksi shared JS (baris yang identik di 8+ file)
# ══════════════════════════════════════════════════════════════

def detect_shared_js(data):
    all_lines = []
    for d in data.values():
        all_lines.extend(split_js_lines(d["js"]))

    counts = Counter(all_lines)
    shared_lines = {line for line, count in counts.items()
                    if count >= SHARED_THRESHOLD and line.strip()}
    return shared_lines


# ══════════════════════════════════════════════════════════════
# STEP 4 — Pisahkan shared vs per-page
# ══════════════════════════════════════════════════════════════

def build_shared_css(data, shared_chunks):
    """Ambil chunks shared dari file pertama (urutan asli terjaga)."""
    first_css = list(data.values())[0]["css"]
    result = []
    for chunk in split_css_chunks(first_css):
        if chunk in shared_chunks:
            result.append(chunk)
    return "\n".join(result)


def build_page_css(css, shared_chunks):
    """Sisakan chunks yang TIDAK shared."""
    result = []
    for chunk in split_css_chunks(css):
        if chunk not in shared_chunks:
            result.append(chunk)
    return "\n".join(result)


def build_shared_js(data, shared_lines):
    """Ambil baris shared dari file pertama (urutan asli terjaga)."""
    first_js = list(data.values())[0]["js"]
    result = []
    for line in split_js_lines(first_js):
        if line in shared_lines:
            result.append(line)
    return "\n".join(result)


def build_page_js(js, shared_lines):
    """Sisakan baris yang TIDAK shared."""
    result = []
    for line in split_js_lines(js):
        if line not in shared_lines:
            result.append(line)
    # Buang trailing empty lines
    while result and not result[-1].strip():
        result.pop()
    return "\n".join(result)


# ══════════════════════════════════════════════════════════════
# STEP 5 — Update HTML: ganti <style> & <script> inline
# ══════════════════════════════════════════════════════════════

def update_html(raw, page_name, has_page_css, has_page_js):
    # Tentukan tag pengganti CSS
    css_tags = ['<link rel="stylesheet" href="css/shared.css">']
    if has_page_css:
        css_tags.append(f'<link rel="stylesheet" href="css/{page_name}.css">')
    css_replacement = "\n".join(css_tags)

    # Tentukan tag pengganti JS
    js_tags = ['<script src="js/shared.js"></script>']
    if has_page_js:
        js_tags.append(f'<script src="js/{page_name}.js"></script>')
    js_replacement = "\n".join(js_tags)

    # Ganti blok <style>...</style>
    updated = re.sub(
        r"<style[^>]*>.*?</style>",
        css_replacement,
        raw,
        count=1,
        flags=re.DOTALL | re.IGNORECASE
    )

    # Ganti blok <script> inline pertama dengan tag baru
    first = True
    def replace_script(m):
        nonlocal first
        if first:
            first = False
            return js_replacement
        return ""  # hapus script inline berikutnya (sudah digabung)

    updated = re.sub(
        r"<script(?![^>]*\bsrc\b)[^>]*>.*?</script>",
        replace_script,
        updated,
        flags=re.DOTALL | re.IGNORECASE
    )

    return updated


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

    print(f"\n🔍  Ditemukan {len(html_files)} file HTML.\n")

    # Buat folder output
    os.makedirs(CSS_DIR, exist_ok=True)
    os.makedirs(JS_DIR,  exist_ok=True)

    # Kumpulkan data
    data = collect(html_files)

    # Deteksi shared
    shared_css_chunks = detect_shared_css(data)
    shared_js_lines   = detect_shared_js(data)

    print(f"📦  Shared CSS blocks  : {len(shared_css_chunks)} chunks")
    print(f"📦  Shared JS lines    : {len(shared_js_lines)} baris\n")

    # Tulis shared.css
    shared_css_content = build_shared_css(data, shared_css_chunks)
    write(os.path.join(CSS_DIR, "shared.css"), shared_css_content)
    print(f"✅  css/shared.css         ({len(shared_css_content):,} chars)")

    # Tulis shared.js
    shared_js_content = build_shared_js(data, shared_js_lines)
    write(os.path.join(JS_DIR, "shared.js"), shared_js_content)
    print(f"✅  js/shared.js           ({len(shared_js_content):,} chars)\n")

    # Per-file
    for filename in html_files:
        page_name = os.path.splitext(filename)[0]
        d = data[filename]

        # CSS per-halaman
        page_css = build_page_css(d["css"], shared_css_chunks)
        has_page_css = bool(page_css.strip())
        if has_page_css:
            css_path = os.path.join(CSS_DIR, f"{page_name}.css")
            write(css_path, page_css)
            css_info = f"css/{page_name}.css ({len(page_css):,} chars)"
        else:
            css_info = "— (semua CSS sudah di shared)"

        # JS per-halaman
        page_js = build_page_js(d["js"], shared_js_lines)
        has_page_js = bool(page_js.strip())
        if has_page_js:
            js_path = os.path.join(JS_DIR, f"{page_name}.js")
            write(js_path, page_js)
            js_info = f"js/{page_name}.js ({len(page_js):,} chars)"
        else:
            js_info = "— (semua JS sudah di shared)"

        # Update HTML
        updated_html = update_html(d["raw"], page_name, has_page_css, has_page_js)
        write(os.path.join(SOURCE_DIR, filename), updated_html)

        print(f"  📄  {filename:<25} CSS: {css_info}")
        print(f"  {'':25} JS : {js_info}")

    print(f"""
✨  Selesai! Struktur baru:

  css/
    shared.css      ← nav, footer, cursor, reset, dll
    index.css       ← CSS khusus per halaman
    ...

  js/
    shared.js       ← cursor logic, hamburger, dll
    index.js        ← JS khusus per halaman
    ...

  (semua .html sudah diupdate otomatis)
""")


if __name__ == "__main__":
    main()
