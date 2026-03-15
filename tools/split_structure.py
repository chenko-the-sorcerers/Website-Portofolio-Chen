"""
split_structure.py
──────────────────
Memisahkan setiap file HTML portfolio menjadi 4 bagian:
  1. head.html   → <head> ... </head>
  2. style.css   → isi dalam <style> ... </style>
  3. body.html   → <body> ... </body>  (tanpa inline style/script)
  4. script.js   → isi dalam <script> ... </script>

Cara pakai:
  python split_structure.py

Output: folder  `output/<nama-file>/`
"""

import os
import re

# ─── Konfigurasi ───────────────────────────────────────────────
SOURCE_DIR = "."          # folder tempat file .html berada
OUTPUT_DIR = "output"     # folder output hasil split
# ───────────────────────────────────────────────────────────────


def split_html(filepath: str, out_dir: str) -> None:
    filename = os.path.basename(filepath)
    name     = os.path.splitext(filename)[0]
    dest     = os.path.join(out_dir, name)
    os.makedirs(dest, exist_ok=True)

    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    # ── 1. HEAD ────────────────────────────────────────────────
    head_match = re.search(r"<head[^>]*>(.*?)</head>", raw, re.DOTALL | re.IGNORECASE)
    head_content = head_match.group(0).strip() if head_match else ""

    # ── 2. STYLE (isi saja, tanpa tag <style>) ─────────────────
    style_match = re.search(r"<style[^>]*>(.*?)</style>", raw, re.DOTALL | re.IGNORECASE)
    style_content = style_match.group(1).strip() if style_match else ""

    # ── 3. SCRIPT (isi saja, tanpa tag <script>) ───────────────
    #    Ambil semua blok <script> inline (abaikan <script src=...>)
    script_blocks = re.findall(
        r"<script(?![^>]*\bsrc\b)[^>]*>(.*?)</script>",
        raw, re.DOTALL | re.IGNORECASE
    )
    script_content = "\n\n".join(b.strip() for b in script_blocks if b.strip())

    # ── 4. BODY (bersih dari <style> dan <script> inline) ──────
    body_match = re.search(r"<body[^>]*>(.*?)</body>", raw, re.DOTALL | re.IGNORECASE)
    if body_match:
        body_raw = body_match.group(1)
        # Hapus blok <style> dan <script> inline dari body (jika ada)
        body_clean = re.sub(r"<style[^>]*>.*?</style>", "", body_raw, flags=re.DOTALL | re.IGNORECASE)
        body_clean = re.sub(r"<script(?![^>]*\bsrc\b)[^>]*>.*?</script>", "", body_clean, flags=re.DOTALL | re.IGNORECASE)
        # Pertahankan <script src=...> (external)
        body_content = f"<body>\n{body_clean.strip()}\n</body>"
    else:
        body_content = ""

    # ── Tulis file output ───────────────────────────────────────
    _write(os.path.join(dest, "head.html"),   head_content)
    _write(os.path.join(dest, "style.css"),   style_content)
    _write(os.path.join(dest, "body.html"),   body_content)
    _write(os.path.join(dest, "script.js"),   script_content)

    print(f"✅  {filename:30s}  →  output/{name}/  "
          f"[style: {len(style_content):,} chars | script: {len(script_content):,} chars]")


def _write(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    html_files = sorted(
        f for f in os.listdir(SOURCE_DIR)
        if f.endswith(".html") and not f.startswith("_")
    )

    if not html_files:
        print("⚠️  Tidak ada file .html ditemukan di folder ini.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n🔍  Ditemukan {len(html_files)} file HTML. Memulai split...\n")

    for filename in html_files:
        split_html(os.path.join(SOURCE_DIR, filename), OUTPUT_DIR)

    print(f"\n✨  Selesai! Hasil disimpan di folder → ./{OUTPUT_DIR}/\n")
    print("Struktur output:")
    for name in sorted(os.listdir(OUTPUT_DIR)):
        sub = os.path.join(OUTPUT_DIR, name)
        if os.path.isdir(sub):
            files = sorted(os.listdir(sub))
            print(f"  {name}/")
            for f in files:
                size = os.path.getsize(os.path.join(sub, f))
                print(f"    ├─ {f:<15} ({size:,} bytes)")


if __name__ == "__main__":
    main()
