'use strict';

/* ══════════════════════════════════════════════════════════════
   bow.js — Bag-of-Words Interactive Engine
   ══════════════════════════════════════════════════════════════ */

/* ── 1. Page scaffolding (identical to tokenization.js) ─────── */
(function () {
  const bar = document.getElementById('readBar');
  if (!bar) return;
  function upd() {
    const d = document.documentElement;
    bar.style.width = Math.min(100, (window.scrollY / (d.scrollHeight - d.clientHeight)) * 100) + '%';
  }
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

window.toggleSidebar = function () {
  document.getElementById('lessonSidebar').classList.toggle('open');
};
document.addEventListener('click', (e) => {
  const sb  = document.getElementById('lessonSidebar');
  const btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target))
    sb.classList.remove('open');
});

(function () {
  const links = document.querySelectorAll('.lnav-item[data-sec]');
  const secs  = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const fill  = document.getElementById('progFill');
  const pct   = document.getElementById('progPct');
  function upd() {
    const y = window.scrollY + 100;
    let ai = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) ai = i; });
    links.forEach((l, i) => {
      l.classList.toggle('active', i === ai);
      if (i < ai) { l.classList.add('done'); const d = l.querySelector('.lnav-dot'); if (d) d.style.background = '#34c759'; }
    });
    const p = Math.round((ai / Math.max(1, secs.length - 1)) * 100);
    if (fill) fill.style.width = p + '%';
    if (pct)  pct.textContent  = p + '%';
  }
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

document.querySelectorAll('.lnav-item[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});

(function () {
  const io = new IntersectionObserver(
    es => es.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.07, rootMargin: '0px 0px -24px 0px' }
  );
  document.querySelectorAll('.lesson-sec, .worked-box, .cmp-card, .sim-card, .calc-step').forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    io.observe(el);
  });
})();

(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-intuisi':   'Intuisi BoW',
    'sec-membangun': 'Membangun Vocabulary',
    'sec-cosine':    'Cosine Similarity',
    'sec-batas':     'Batas & Kelebihan',
    'sec-lab':       'Lab Interaktif',
  };
  secs.forEach((sec, i) => {
    const prev = secs[i - 1];
    const next = secs[i + 1];
    const nav  = document.createElement('div');
    nav.className = 'sec-nav-buttons';
    function makeBtn(target, dir) {
      const btn = document.createElement('a');
      btn.className = `sec-nav-btn ${dir}`;
      btn.href = '#' + target.id;
      const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">` +
        (dir === 'prev' ? `<path d="M10 3L5 8l5 5"/>` : `<path d="M6 3l5 5-5 5"/>`) + `</svg>`;
      btn.innerHTML = dir === 'prev' ? `${arrow} ${labels[target.id] || 'Sebelumnya'}` : `${labels[target.id] || 'Berikutnya'} ${arrow}`;
      btn.addEventListener('click', e => { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      return btn;
    }
    nav.appendChild(prev ? makeBtn(prev, 'prev') : document.createElement('span'));
    if (next) nav.appendChild(makeBtn(next, 'next'));
    sec.appendChild(nav);
  });
})();

/* ══════════════════════════════════════════════════════════════
   BoW CORE ENGINE
   ══════════════════════════════════════════════════════════════ */

/* ── Indonesian stop words ─────────────────────────────────── */
const STOP_WORDS = new Set([
  'yang','dan','di','ke','dari','ini','itu','dengan','untuk','pada','adalah',
  'tidak','juga','saya','kamu','dia','kita','kami','mereka','ada','akan',
  'sudah','bisa','lebih','sangat','atau','tetapi','tapi','namun','serta',
  'oleh','sebagai','dalam','antara','setiap','dapat','telah','karena',
  'hingga','sampai','seperti','ketika','saat','setelah','sebelum','selama',
  'menjadi','menjadi','tentang','terhadap','sehingga','agar','supaya',
  'dalam','antara','atas','bawah','semua','para','tiap','hanya','sudah',
  'belum','pun','juga','pun','lagi','masih','saja','yaitu','yakni',
  'hal','cara','kali','tahun','bulan','hari','waktu','kota','negara',
  'orang','orang','masyarakat','sejak','sejak','lalu','kemudian','selain',
  'berbagai','beberapa','banyak','sebuah','salah','satu','dua','tiga',
]);

/* ── Simple Indonesian tokenizer (no library) ──────────────── */
function tokenizeId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/* ── Build vocabulary from array of documents ──────────────── */
function buildVocabulary(docs) {
  const freq = {};
  docs.forEach(doc => {
    const tokens = tokenizeId(doc);
    tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  });
  // Sort by frequency desc, then alpha
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word, count]) => ({ word, count }));
}

/* ── Build BoW vector for a single document ─────────────────── */
function bowVector(text, vocab) {
  const tokens = tokenizeId(text);
  const counts = {};
  tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  return vocab.map(({ word }) => counts[word] || 0);
}

/* ── Dot product ────────────────────────────────────────────── */
function dot(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/* ── Magnitude ──────────────────────────────────────────────── */
function magnitude(v) {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

/* ── Cosine similarity ──────────────────────────────────────── */
function cosineSim(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot(a, b) / (magA * magB);
}

/* ── Colour for similarity value ────────────────────────────── */
function simToColor(val) {
  // 0 = dark, 1 = vivid green
  const alpha = 0.05 + val * 0.7;
  const intensity = Math.round(40 + val * 180);
  return {
    bg:     `rgba(48,209,88,${alpha.toFixed(2)})`,
    border: `rgba(48,209,88,${(alpha * 1.6).toFixed(2)})`,
    color:  val > 0.5 ? '#30d158' : val > 0.2 ? '#e8e8f0' : '#8888a0',
  };
}

/* ══════════════════════════════════════════════════════════════
   STATIC DEMOS (Section 1)
   ══════════════════════════════════════════════════════════════ */
(function buildStaticDemo() {
  const container = document.getElementById('staticBowDemo');
  if (!container) return;

  const sentences = [
    { label: 'D1 — Transportasi', text: 'Gojek ojek online Jakarta', color: '#30d158' },
    { label: 'D2 — E-commerce', text: 'Tokopedia Shopee belanja online', color: '#2997ff' },
    { label: 'D3 — Startup', text: 'Gojek Tokopedia startup Indonesia', color: '#bf5af2' },
  ];
  const sharedVocab = ['gojek', 'ojek', 'online', 'jakarta', 'tokopedia', 'shopee', 'belanja', 'startup', 'indonesia'];

  sentences.forEach((s, si) => {
    const tokens = tokenizeId(s.text);
    const counts = {};
    tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

    const wrap = document.createElement('div');
    wrap.className = 'bvd-doc';
    wrap.innerHTML = `
      <div class="bvd-doc-header">
        <div class="bvd-dot" style="background:${s.color}"></div>
        <div class="bvd-label">${s.label}</div>
      </div>
      <div class="bvd-sentence">${s.text.replace(/(\w+)/g, (m) => tokens.includes(m.toLowerCase()) ? `<strong>${m}</strong>` : m)}</div>
      <div class="bvd-vector" id="bvd-vec-${si}"></div>
    `;
    container.appendChild(wrap);

    requestAnimationFrame(() => {
      const vecEl = document.getElementById(`bvd-vec-${si}`);
      if (!vecEl) return;
      sharedVocab.forEach(word => {
        const cnt = counts[word] || 0;
        const cell = document.createElement('div');
        cell.className = `bvd-cell${cnt > 0 ? ' active' : ''}`;
        if (cnt > 0) cell.style.borderColor = s.color + '80';
        if (cnt > 0) cell.style.background = s.color + '18';
        cell.innerHTML = `<span class="bvd-word">${word}</span><span class="bvd-count" style="${cnt > 0 ? `color:${s.color}` : ''}">${cnt}</span>`;
        vecEl.appendChild(cell);
      });
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   SPARSE MATRIX VISUAL (Section 2)
   ══════════════════════════════════════════════════════════════ */
(function buildSparseVisual() {
  const container = document.getElementById('sparseVisual');
  if (!container) return;

  const ROWS = 20; // documents
  const COLS = 60; // words
  const DENSITY = 0.08; // ~8% non-zero

  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${COLS},18px);gap:2px;`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'width:18px;height:14px;border-radius:2px;transition:all .2s;cursor:default;';
      const rand = Math.random();
      if (rand < DENSITY * 0.3) {
        cell.style.background = 'rgba(48,209,88,.35)';
        cell.style.border = '1px solid rgba(48,209,88,.5)';
        cell.title = `Doc ${r+1} × Word ${c+1} = 2`;
      } else if (rand < DENSITY) {
        cell.style.background = 'rgba(48,209,88,.18)';
        cell.style.border = '1px solid rgba(48,209,88,.3)';
        cell.title = `Doc ${r+1} × Word ${c+1} = 1`;
      } else {
        cell.style.background = 'rgba(255,255,255,.03)';
        cell.style.border = '1px solid rgba(255,255,255,.04)';
        cell.title = `Doc ${r+1} × Word ${c+1} = 0`;
      }
      cell.addEventListener('mouseenter', function() { this.style.transform = 'scale(1.5)'; this.style.zIndex = '5'; });
      cell.addEventListener('mouseleave', function() { this.style.transform = ''; this.style.zIndex = ''; });
      grid.appendChild(cell);
    }
  }
  container.appendChild(grid);
})();

/* ══════════════════════════════════════════════════════════════
   INTERACTIVE PLAYGROUND
   ══════════════════════════════════════════════════════════════ */

const DEFAULT_DOCS = [
  'Ojek online seperti Gojek dan Grab sudah mengubah cara masyarakat Jakarta bepergian setiap hari.',
  'Tokopedia dan Shopee bersaing ketat di pasar belanja online Indonesia dengan jutaan transaksi setiap hari.',
  'Startup teknologi Indonesia seperti Gojek dan Tokopedia sudah berkembang menjadi perusahaan besar kelas dunia.',
];

let currentVocab   = [];
let currentVectors = [];
let currentDocs    = [...DEFAULT_DOCS];

const DOC_COLORS = ['#30d158', '#2997ff', '#bf5af2'];
const DOC_NAMES  = ['D1', 'D2', 'D3'];

/* ── Tab switching ──────────────────────────────────────────── */
document.querySelectorAll('.pg-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pg-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pane = document.getElementById('pane-' + tab.dataset.tab);
    if (pane) pane.classList.add('active');
  });
});

/* ── Run BoW ────────────────────────────────────────────────── */
function runBoW() {
  const d1 = (document.getElementById('doc1') || {}).value || '';
  const d2 = (document.getElementById('doc2') || {}).value || '';
  const d3 = (document.getElementById('doc3') || {}).value || '';
  currentDocs = [d1, d2, d3];

  // Build vocab
  currentVocab = buildVocabulary(currentDocs);

  // Build vectors (use top 30 words max for display)
  const displayVocab = currentVocab.slice(0, 30);
  currentVectors = currentDocs.map(doc => bowVector(doc, displayVocab));

  // Word count info
  const totalWords = currentDocs.reduce((sum, d) => sum + tokenizeId(d).length, 0);
  const wc = document.getElementById('wordCountInfo');
  if (wc) wc.textContent = `${currentVocab.length} kata unik · ${totalWords} total token`;

  renderVocab(displayVocab);
  renderMatrix(displayVocab, currentVectors);
  renderHeatmap();
}

/* ── Render vocabulary chips ────────────────────────────────── */
function renderVocab(vocab) {
  const el = document.getElementById('vocabChips');
  const cnt = document.getElementById('vocabCount');
  if (!el) return;
  if (cnt) cnt.textContent = `${currentVocab.length} kata`;

  el.innerHTML = '';
  if (!vocab.length) { el.innerHTML = '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);">Tidak ada kata setelah stop word dihapus.</span>'; return; }

  vocab.forEach(({ word, count }, i) => {
    const chip = document.createElement('div');
    chip.className = 'vocab-chip';
    chip.style.animationDelay = `${i * 0.02}s`;
    chip.style.opacity = '0';
    chip.style.animation = `tokenAppear .3s ease ${i * 0.025}s forwards`;
    chip.innerHTML = `${word}<span class="vocab-chip-count">${count}</span>`;
    el.appendChild(chip);
  });
}

/* ── Render document-term matrix table ──────────────────────── */
function renderMatrix(vocab, vectors) {
  const el = document.getElementById('matrixTable');
  const info = document.getElementById('matrixInfo');
  if (!el) return;
  if (!vocab.length) { el.innerHTML = '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);">—</span>'; return; }

  if (info) info.textContent = `${vectors.length} dok × ${vocab.length} kata`;

  const table = document.createElement('table');
  table.className = 'matrix-table';

  // Header
  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  const th0   = document.createElement('th');
  th0.className = 'row-header';
  th0.textContent = 'Dokumen';
  hrow.appendChild(th0);
  vocab.forEach(({ word }) => {
    const th = document.createElement('th');
    th.textContent = word;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  vectors.forEach((vec, ri) => {
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.className = 'doc-name';
    td0.innerHTML = `<span style="color:${DOC_COLORS[ri]};font-weight:700;">${DOC_NAMES[ri]}</span>`;
    tr.appendChild(td0);

    vec.forEach(cnt => {
      const td = document.createElement('td');
      td.textContent = cnt;
      td.className = `cell-${Math.min(cnt, 3)}`;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  el.innerHTML = '';
  el.appendChild(table);
}

/* ── Render cosine similarity heatmap ──────────────────────── */
function renderHeatmap() {
  const el   = document.getElementById('heatmapGrid');
  const info = document.getElementById('heatmapInfo');
  if (!el) return;

  if (!currentVocab.length) {
    el.innerHTML = '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);">—</span>';
    return;
  }

  // Compute 3×3 sim matrix
  const n = currentVectors.length;
  const sims = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => cosineSim(currentVectors[i], currentVectors[j]))
  );

  if (info) {
    const maxOff = Math.max(sims[0][1], sims[0][2], sims[1][2]);
    info.textContent = `Pasangan paling mirip: ${(maxOff * 100).toFixed(0)}%`;
  }

  el.innerHTML = '';

  const CELL_SIZE = 84;
  const LABEL_W   = 48;

  // Build table layout: label col + 3 heatmap cols
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:inline-flex;flex-direction:column;gap:0;';

  // Column labels row
  const colLabels = document.createElement('div');
  colLabels.style.cssText = `display:flex;gap:0;margin-left:${LABEL_W}px;`;
  DOC_NAMES.forEach((name, j) => {
    const lbl = document.createElement('div');
    lbl.style.cssText = `width:${CELL_SIZE}px;text-align:center;font-family:var(--font-mono);font-size:11px;color:${DOC_COLORS[j]};padding-bottom:6px;font-weight:700;`;
    lbl.textContent = name;
    colLabels.appendChild(lbl);
  });
  wrapper.appendChild(colLabels);

  // Rows
  sims.forEach((row, i) => {
    const rowEl = document.createElement('div');
    rowEl.style.cssText = 'display:flex;gap:0;margin-bottom:3px;align-items:center;';

    // Row label
    const rowLabel = document.createElement('div');
    rowLabel.style.cssText = `width:${LABEL_W}px;font-family:var(--font-mono);font-size:11px;color:${DOC_COLORS[i]};font-weight:700;padding-right:8px;text-align:right;flex-shrink:0;`;
    rowLabel.textContent = DOC_NAMES[i];
    rowEl.appendChild(rowLabel);

    row.forEach((val, j) => {
      const isDiag = i === j;
      const c = simToColor(isDiag ? 1 : val);
      const cell = document.createElement('div');
      cell.style.cssText = `
        width:${CELL_SIZE}px; height:${CELL_SIZE}px;
        background:${isDiag ? 'rgba(255,255,255,.06)' : c.bg};
        border:1px solid ${isDiag ? 'rgba(255,255,255,.1)' : c.border};
        border-radius:8px; margin-right:3px;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
        cursor:default; position:relative; transition:all .2s;
        font-family:var(--font-mono);
      `;

      const scoreEl = document.createElement('div');
      scoreEl.style.cssText = `font-size:20px;font-weight:800;color:${isDiag ? 'var(--text-3)' : c.color};line-height:1;`;
      scoreEl.textContent = isDiag ? '—' : val.toFixed(2);

      const labelEl = document.createElement('div');
      labelEl.style.cssText = 'font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;';
      labelEl.textContent = isDiag ? 'sama' : val >= 0.7 ? 'sangat mirip' : val >= 0.4 ? 'cukup mirip' : val >= 0.1 ? 'sedikit mirip' : 'berbeda';

      // Tooltip
      const tip = document.createElement('div');
      tip.style.cssText = `
        position:absolute;bottom:calc(100%+8px);left:50%;transform:translateX(-50%);
        background:#1e1e2a;border:1px solid rgba(255,255,255,.12);border-radius:6px;
        padding:6px 10px;font-size:10px;color:var(--text-2);white-space:nowrap;
        opacity:0;visibility:hidden;transition:all .15s;z-index:20;pointer-events:none;
      `;
      if (!isDiag) {
        tip.textContent = `sim(${DOC_NAMES[i]}, ${DOC_NAMES[j]}) = ${val.toFixed(4)}`;
      }

      cell.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.08)';
        this.style.zIndex = '10';
        tip.style.opacity = '1'; tip.style.visibility = 'visible';
      });
      cell.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.zIndex = '';
        tip.style.opacity = '0'; tip.style.visibility = 'hidden';
      });

      cell.appendChild(scoreEl);
      cell.appendChild(labelEl);
      if (!isDiag) cell.appendChild(tip);
      rowEl.appendChild(cell);
    });

    wrapper.appendChild(rowEl);
  });

  el.appendChild(wrapper);
}

/* ── Document search ────────────────────────────────────────── */
function runSearch() {
  const query = (document.getElementById('searchInput') || {}).value || '';
  const el    = document.getElementById('searchResults');
  if (!el) return;

  if (!query.trim() || !currentVocab.length) {
    el.innerHTML = '<div class="sr-empty">Jalankan BoW terlebih dahulu, lalu masukkan query.</div>';
    return;
  }

  const displayVocab = currentVocab.slice(0, 30);
  const qVec = bowVector(query, displayVocab);
  const qMag = magnitude(qVec);

  if (qMag === 0) {
    el.innerHTML = '<div class="sr-empty">Tidak ada kata dalam query yang cocok dengan vocabulary. Coba kata lain.</div>';
    return;
  }

  // Score each doc
  const scored = currentDocs.map((doc, i) => ({
    doc, i,
    score: cosineSim(qVec, currentVectors[i]),
  })).sort((a, b) => b.score - a.score);

  const maxScore = scored[0].score;

  el.innerHTML = '';
  scored.forEach((item, rank) => {
    const isTop = rank === 0 && item.score > 0;
    const div   = document.createElement('div');
    div.className = `search-result${isTop ? ' top-result' : ''}`;
    div.style.opacity = '0';
    div.style.animation = `tokenAppear .3s ease ${rank * 0.1}s forwards`;

    const barWidth = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
    const snippetWords = item.doc.slice(0, 90) + (item.doc.length > 90 ? '…' : '');

    div.innerHTML = `
      <div class="sr-rank">${rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</div>
      <div class="sr-body">
        <div class="sr-text" style="color:${DOC_COLORS[item.i]}80;">
          <strong style="color:${DOC_COLORS[item.i]};">${DOC_NAMES[item.i]}</strong> — ${snippetWords}
        </div>
        <div class="sr-bar-wrap"><div class="sr-bar" style="width:${barWidth.toFixed(1)}%;background:${DOC_COLORS[item.i]};"></div></div>
      </div>
      <div class="sr-score" style="color:${DOC_COLORS[item.i]};">${(item.score * 100).toFixed(1)}%</div>
    `;
    el.appendChild(div);
  });
}

/* ── Wire up buttons ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const btnRun   = document.getElementById('btnRun');
  const btnReset = document.getElementById('btnReset');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (btnRun) btnRun.addEventListener('click', runBoW);

  if (btnReset) btnReset.addEventListener('click', () => {
    ['doc1','doc2','doc3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.value = DEFAULT_DOCS[i];
    });
    runBoW();
  });

  if (searchBtn) searchBtn.addEventListener('click', runSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  }

  // Auto-run on doc input change (debounced)
  let debounce = null;
  ['doc1','doc2','doc3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(runBoW, 400);
    });
  });

  // Initial run
  runBoW();
});

/* ── CSS animation keyframe (dynamic injection) ─────────────── */
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes tokenAppear {
      from { opacity:0; transform:translateY(8px) scale(.9); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);
})();
