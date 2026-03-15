# 📁 Project Structure — Marchel Andrian Shevchenko Portfolio

> Vanilla HTML/CSS/JS · Deploy target: Vercel/Netlify · Scale: Static → Backend/API ready

---

## Filosofi Struktur

| Prinsip | Penerapan |
|---|---|
| **Separation of Concerns** | HTML = struktur, CSS = style, JS = behaviour, dipisah per folder |
| **DRY** | `shared.css` & `shared.js` untuk komponen yang muncul di semua halaman |
| **Page-based routing** | Setiap halaman = folder sendiri dengan `index.html` di dalamnya |
| **API-ready** | Folder `api/` disiapkan sejak awal, Netlify/Vercel Functions compatible |
| **Maintainable** | Setiap folder punya tanggung jawab yang jelas dan terisolasi |

---

## Struktur Direktori

```
portfolio/
│
├── 📄 index.html                        # Entry point (root)
│
├── 📁 pages/                            # Semua halaman selain home
│   ├── 📁 about/
│   │   └── index.html
│   ├── 📁 projects/
│   │   └── index.html
│   ├── 📁 experience/
│   │   └── index.html
│   ├── 📁 education/
│   │   └── index.html
│   ├── 📁 skills/
│   │   └── index.html
│   ├── 📁 achievements/
│   │   └── index.html
│   ├── 📁 talks/
│   │   └── index.html
│   ├── 📁 volunteering/
│   │   └── index.html
│   ├── 📁 ai-lab/
│   │   └── index.html
│   └── 📁 contact/
│       └── index.html
│
├── 📁 css/                              # Semua stylesheet
│   ├── shared.css                       # Nav, footer, cursor, reset — dipakai semua halaman
│   ├── index.css                        # CSS khusus homepage
│   ├── projects.css
│   ├── experience.css
│   ├── education.css
│   ├── skills.css
│   ├── achievements.css
│   ├── talks.css
│   ├── volunteering.css
│   ├── ai-lab.css
│   └── contact.css
│
├── 📁 js/                               # Semua JavaScript
│   ├── shared.js                        # Cursor, hamburger, nav scroll — dipakai semua halaman
│   ├── lang.js                          # i18n / language switcher (sudah ada)
│   ├── index.js                         # JS khusus homepage
│   ├── projects.js
│   ├── experience.js
│   ├── education.js
│   ├── skills.js
│   ├── achievements.js
│   ├── talks.js
│   ├── volunteering.js
│   ├── ai-lab.js
│   └── contact.js
│
├── 📁 assets/                           # File statis
│   ├── 📁 images/                       # Foto, thumbnail, OG image
│   │   ├── profile.jpg
│   │   ├── og-image.jpg                 # Open Graph default
│   │   └── 📁 projects/                # Screenshot per project
│   ├── 📁 icons/                        # SVG icons / favicon
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   └── apple-touch-icon.png
│   └── 📁 docs/                         # CV, sertifikat, dll yang bisa didownload
│       └── cv-marchel.pdf
│
├── 📁 api/                              # Backend/serverless functions (Vercel/Netlify ready)
│   ├── 📄 README.md                     # Dokumentasi endpoint
│   ├── contact.js                       # POST /api/contact → kirim email (form contact)
│   └── views.js                         # GET/POST /api/views → page view counter (opsional)
│
├── 📁 data/                             # Data statis dalam JSON (pengganti hardcode di HTML)
│   ├── projects.json                    # List project
│   ├── experience.json                  # List pengalaman kerja
│   ├── education.json                   # List pendidikan
│   ├── skills.json                      # List skills & level
│   ├── achievements.json                # List pencapaian
│   ├── talks.json                       # List talks/speaking
│   ├── volunteering.json                # List volunteering
│   └── i18n/                            # Data terjemahan
│       ├── en.json
│       └── id.json
│
├── 📁 components/                       # Potongan HTML reusable (untuk di-include manual)
│   ├── nav.html                         # Navbar markup
│   ├── footer.html                      # Footer markup
│   └── cursor.html                      # Cursor markup
│
├── 📁 docs/                             # Dokumentasi proyek (untuk developer)
│   ├── STRUCTURE.md                     # ← file ini
│   ├── CHANGELOG.md                     # Riwayat perubahan
│   ├── ROADMAP.md                       # Rencana fitur ke depan
│   └── API.md                           # Dokumentasi endpoint api/
│
├── 📄 netlify.toml                      # Config Netlify (redirects, headers, functions)
│   atau
├── 📄 vercel.json                       # Config Vercel (redirects, rewrites, functions)
│
├── 📄 .gitignore
└── 📄 README.md                         # Dokumentasi publik proyek
```

---

## Penjelasan Per Folder

### `pages/`
Setiap halaman menggunakan pola **folder + `index.html`** agar URL-nya clean:

| File lama | URL lama | URL baru |
|---|---|---|
| `projects.html` | `/projects.html` | `/projects/` |
| `contact.html` | `/contact.html` | `/contact/` |
| `ai-lab.html` | `/ai-lab.html` | `/ai-lab/` |

Path ke CSS & JS dari dalam `pages/namahalaman/index.html` menggunakan path absolut:
```html
<link rel="stylesheet" href="/css/shared.css">
<link rel="stylesheet" href="/css/projects.css">
<script src="/js/shared.js"></script>
<script src="/js/projects.js"></script>
```

---

### `css/`
| File | Isi |
|---|---|
| `shared.css` | `:root` variables, reset, nav, footer, cursor, scrollbar, utility classes |
| `[page].css` | Style yang hanya dipakai di halaman tersebut |

---

### `js/`
| File | Isi |
|---|---|
| `shared.js` | Cursor logic, hamburger menu, nav scroll effect, active nav link |
| `lang.js` | Language switcher (sudah ada, tidak diubah) |
| `[page].js` | Logic yang hanya dipakai di halaman tersebut |

---

### `api/`
Serverless functions, compatible dengan **Vercel** (`/api/*.js`) dan **Netlify** (`netlify/functions/`).

| File | Method | Fungsi |
|---|---|---|
| `contact.js` | `POST /api/contact` | Terima form contact, kirim email via Resend/Nodemailer |
| `views.js` | `GET/POST /api/views` | Baca/tulis page view counter |

> Untuk Netlify, pindahkan ke `netlify/functions/` dan sesuaikan `netlify.toml`.

---

### `data/`
Konten halaman disimpan sebagai JSON agar mudah diupdate tanpa menyentuh HTML.
JS per-halaman fetch data ini dan render ke DOM.

```
Alur: data/projects.json → js/projects.js → pages/projects/index.html
```

---

### `components/`
Karena Vanilla HTML tidak punya component system, file di sini adalah **referensi markup**
yang di-copy ke setiap halaman, atau bisa di-fetch via JS:

```js
// Contoh: load nav via fetch
fetch('/components/nav.html').then(r => r.text()).then(html => {
  document.getElementById('nav-placeholder').innerHTML = html;
});
```

---

## Urutan Pengerjaan (Recommended)

```
Phase 1 — Fondasi
  [ ] Buat struktur folder lengkap
  [ ] Pindahkan CSS ke css/ dan JS ke js/ (sudah selesai via refactor_assets.py)
  [ ] Pindahkan semua halaman ke pages/namahalaman/index.html
  [ ] Update semua href internal ke path absolut (/pages/..., /css/..., /js/...)
  [ ] Setup vercel.json / netlify.toml

Phase 2 — Komponen & Data
  [ ] Ekstrak nav & footer ke components/
  [ ] Pindahkan data hardcode ke data/*.json
  [ ] Update JS per halaman untuk fetch dari data/

Phase 3 — API
  [ ] Setup api/contact.js (form contact)
  [ ] Test deploy ke Vercel/Netlify

Phase 4 — Polish
  [ ] Tambah assets/ (favicon, OG image, CV)
  [ ] Isi docs/CHANGELOG.md dan docs/ROADMAP.md
  [ ] Audit performa & SEO
```

---

## Config Deployment

### `vercel.json` (minimal)
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### `netlify.toml` (minimal)
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Status Tracking

| Item | Status | Catatan |
|---|---|---|
| CSS dipisah ke `css/` | ✅ Done | via `refactor_assets.py` |
| JS dipisah ke `js/` | ✅ Done | via `refactor_assets.py` |
| Halaman dipindah ke `pages/` | ⬜ Todo | |
| Path diupdate ke absolut | ⬜ Todo | |
| `vercel.json` / `netlify.toml` | ⬜ Todo | |
| `components/` nav & footer | ⬜ Todo | |
| `data/*.json` | ⬜ Todo | |
| `api/contact.js` | ⬜ Todo | |
| `assets/` lengkap | ⬜ Todo | |
| Deploy pertama | ⬜ Todo | |

---

*Last updated: 2026-03-14*
