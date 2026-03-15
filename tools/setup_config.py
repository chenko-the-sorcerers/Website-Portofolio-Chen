"""
setup_config.py
───────────────
Membuat file konfigurasi deployment:
  - vercel.json
  - netlify.toml

Cara pakai:
  python setup_config.py
"""

import os
import json

SOURCE_DIR = "."

PAGES = [
    "projects", "experience", "education", "skills",
    "achievements", "talks", "volunteering", "ai-lab", "contact"
]

# ══════════════════════════════════════════════════════════════
# vercel.json
# ══════════════════════════════════════════════════════════════

def make_vercel():
    rewrites = []

    # Root
    rewrites.append({"source": "/", "destination": "/index.html"})

    # Setiap halaman → pages/slug/index.html
    for page in PAGES:
        rewrites.append({
            "source": f"/{page}",
            "destination": f"/pages/{page}/index.html"
        })
        rewrites.append({
            "source": f"/{page}/",
            "destination": f"/pages/{page}/index.html"
        })

    config = {
        "cleanUrls": True,
        "trailingSlash": False,
        "rewrites": rewrites,
        "headers": [
            {
                "source": "/css/(.*)",
                "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
            },
            {
                "source": "/js/(.*)",
                "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
            },
            {
                "source": "/assets/(.*)",
                "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
            }
        ]
    }

    path = os.path.join(SOURCE_DIR, "vercel.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"  ✅  vercel.json")


# ══════════════════════════════════════════════════════════════
# netlify.toml
# ══════════════════════════════════════════════════════════════

def make_netlify():
    redirects = []

    for page in PAGES:
        redirects.append(f"""
[[redirects]]
  from = "/{page}"
  to   = "/pages/{page}/index.html"
  status = 200

[[redirects]]
  from = "/{page}/"
  to   = "/pages/{page}/index.html"
  status = 200""")

    content = f"""[build]
  publish = "."
  functions = "api"

[build.environment]
  NODE_VERSION = "18"

# Cache static assets
[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Page rewrites
{''.join(redirects)}

# Fallback — 404
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 404
"""

    path = os.path.join(SOURCE_DIR, "netlify.toml")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅  netlify.toml")


# ══════════════════════════════════════════════════════════════
# .gitignore
# ══════════════════════════════════════════════════════════════

def make_gitignore():
    content = """# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Build output
.vercel/
.netlify/

# OS
.DS_Store
Thumbs.db

# Temp
*.log
output/
"""
    path = os.path.join(SOURCE_DIR, ".gitignore")
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅  .gitignore")
    else:
        print(f"  ⏭️   .gitignore (sudah ada, dilewati)")


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

def main():
    print("\n⚙️   Membuat file konfigurasi deployment...\n")
    make_vercel()
    make_netlify()
    make_gitignore()
    print(f"""
✨  Selesai!

Untuk Vercel  → pakai vercel.json  (sudah otomatis terbaca saat deploy)
Untuk Netlify → pakai netlify.toml (sudah otomatis terbaca saat deploy)

Pilih salah satu saja sesuai platform yang kamu pakai,
file satunya bisa dihapus atau dibiarkan (tidak mengganggu).
""")

if __name__ == "__main__":
    main()
