#!/usr/bin/env python3
"""
sync.py — Sinkronisasi CSS chain, sidebar, dan navigasi Module 3

Cara pakai:
    python3 sync.py                  # jalankan di folder yang berisi HTML
    python3 sync.py /path/ke/folder  # tentukan folder secara eksplisit

Script mengedit file HTML secara in-place.
Aman dijalankan berulang kali (idempotent).
"""

import re, sys, os

# ── Urutan lesson ────────────────────────────────────────────────
LESSONS = [
    ('cnn-why',   'Mengapa CNN?'),
    ('cnn-intro', 'Introduction to CNNs'),
    ('cnn-relu',  'Aktivasi ReLU'),
    ('cnn-fc',    'FC Layer &amp; Softmax'),
    ('cnn-hands', 'Hands-on: CNN Pertama'),
    ('cnn-arch',  'Popular Architectures'),
]

# ── CSS chain per halaman ────────────────────────────────────────
CSS_CHAIN = {
    'cnn-why': [
        '/css/shared.css', '/css/cnn-intro.css', '/css/cnn-why.css',
    ],
    'cnn-intro': [
        '/css/shared.css', '/css/cnn-intro.css',
    ],
    'cnn-relu': [
        '/css/shared.css', '/css/cnn-intro.css',
        '/css/cnn-why.css', '/css/cnn-relu.css',
    ],
    'cnn-fc': [
        '/css/shared.css', '/css/cnn-intro.css',
        '/css/cnn-why.css', '/css/cnn-fc.css',
    ],
    'cnn-hands': [
        '/css/shared.css', '/css/cnn-intro.css',
        '/css/cnn-why.css', '/css/cnn-hands.css',
    ],
}

# ── Patch eksplisit per file (string lama → string baru) ─────────
# Format: { slug: [(old, new), ...] }
PATCHES = {
    'cnn-intro': [
        # Topbar next button
        (
            '<a href="#sec-demo" class="ltb-btn primary">Live Demo</a>',
            '<a href="/pages/ai-lab/cnn-relu.html" class="ltb-btn primary">Next: ReLU →</a>',
        ),
        # Pagination next
        (
            '<a href="#" class="lpag-btn next disabled">\n            Popular Architectures',
            '<a href="/pages/ai-lab/cnn-relu.html" class="lpag-btn next">\n            Aktivasi ReLU',
        ),
        # Pagination label
        (
            'Module 3 · 1 of 4',
            'Module 3 · 1 of 5',
        ),
    ],
}

BASE_URL = '/pages/ai-lab'


# ────────────────────────────────────────────────────────────────

def make_css_block(slug):
    return '\n'.join(
        f'<link rel="stylesheet" href="{h}">' for h in CSS_CHAIN[slug]
    )


def make_sidebar(current_slug):
    slugs = [s for s, _ in LESSONS]
    cur   = slugs.index(current_slug)
    lines = [
        '    <div class="sb-module-nav">',
        '      <div class="nav-section-label" style="padding:0 8px;margin-bottom:8px">'
        'Module 3 · Deep Learning for Vision</div>',
    ]
    for i, (slug, label) in enumerate(LESSONS):
        href = f'{BASE_URL}/{slug}.html'
        if i < cur:
            cls, dot, lock = 'smn-item done',    '<span class="smn-dot done"></span>', ''
        elif i == cur:
            cls, dot, lock = 'smn-item current', '<span class="smn-dot done"></span>', ''
        else:
            cls, dot, lock = 'smn-item locked',  '<span class="smn-dot"></span>', '<span class="smn-lock">🔒</span>'
        lines.append(f'      <a href="{href}" class="{cls}">{dot}<span>{label}</span>{lock}</a>')
    lines.append('    </div>')
    return '\n'.join(lines)


def fix_css_chain(html, slug):
    target = make_css_block(slug)
    if target in html:
        return html, False
    new = re.sub(
        r'(<link rel="stylesheet" href="/css/[^"]+">[\s\n]*)+',
        target + '\n', html, count=1
    )
    return new, new != html


def fix_sidebar(html, slug):
    target = make_sidebar(slug)
    if target in html:
        return html, False
    new = re.sub(
        r'    <div class="sb-module-nav">.*?</div>(?=\s*</aside>)',
        target, html, count=1, flags=re.DOTALL
    )
    return new, new != html


def fix_patches(html, slug):
    patches = PATCHES.get(slug, [])
    changed = False
    for old, new in patches:
        if old in html:
            html    = html.replace(old, new, 1)
            changed = True
    return html, changed


def process(slug, directory):
    path = os.path.join(directory, f'{slug}.html')
    if not os.path.exists(path):
        print(f'  ✗  tidak ditemukan: {path}')
        return

    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    html, c1 = fix_css_chain(html, slug)
    html, c2 = fix_sidebar(html, slug)
    html, c3 = fix_patches(html, slug)

    if not any([c1, c2, c3]):
        print('  –  sudah sinkron')
        return

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

    parts = []
    if c1: parts.append('CSS chain')
    if c2: parts.append('sidebar')
    if c3: parts.append('navigasi')
    print(f'  ✓  diperbarui: {", ".join(parts)}')


def main():
    directory = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
    print(f'\n📂  {directory}')
    print('─' * 52)
    for slug, label in LESSONS:
        print(f'\n▸  {label}  ({slug}.html)')
        process(slug, directory)
    print('\n' + '─' * 52)
    print('✅  Selesai.\n')


if __name__ == '__main__':
    main()