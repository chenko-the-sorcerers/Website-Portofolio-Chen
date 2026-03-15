'use strict';

/* ══════════════════════════════════════════════════════════════
   tfidf.js — TF-IDF Interactive Search Engine
   ══════════════════════════════════════════════════════════════ */

/* ── Page scaffolding ────────────────────────────────────────── */
(function () {
  const bar = document.getElementById('readBar');
  if (!bar) return;
  function upd() { const d = document.documentElement; bar.style.width = Math.min(100, (window.scrollY / (d.scrollHeight - d.clientHeight)) * 100) + '%'; }
  window.addEventListener('scroll', upd, { passive: true }); upd();
})();

window.toggleSidebar = function () { document.getElementById('lessonSidebar').classList.toggle('open'); };
document.addEventListener('click', (e) => {
  const sb = document.getElementById('lessonSidebar'), btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target)) sb.classList.remove('open');
});

(function () {
  const links = document.querySelectorAll('.lnav-item[data-sec]');
  const secs  = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const fill  = document.getElementById('progFill'), pct = document.getElementById('progPct');
  function upd() {
    const y = window.scrollY + 100; let ai = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) ai = i; });
    links.forEach((l, i) => {
      l.classList.toggle('active', i === ai);
      if (i < ai) { l.classList.add('done'); const d = l.querySelector('.lnav-dot'); if (d) d.style.background = '#34c759'; }
    });
    const p = Math.round((ai / Math.max(1, secs.length - 1)) * 100);
    if (fill) fill.style.width = p + '%'; if (pct) pct.textContent = p + '%';
  }
  window.addEventListener('scroll', upd, { passive: true }); upd();
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
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; io.unobserve(e.target); }
  }), { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('.lesson-sec, .worked-box, .cmp-card, .calc-step').forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity = '0'; el.style.transform = 'translateY(14px)';
    io.observe(el);
  });
})();

(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = { 'sec-masalah':'Batasan BoW','sec-tf':'Term Frequency','sec-idf':'Inverse Document Freq','sec-tfidf':'Skor TF-IDF','sec-search':'Mesin Pencari','sec-preproses':'Pra-pemrosesan','sec-lab':'Lab Search Engine' };
  secs.forEach((sec, i) => {
    const prev = secs[i - 1], next = secs[i + 1];
    const nav = document.createElement('div'); nav.className = 'sec-nav-buttons';
    function makeBtn(target, dir) {
      const btn = document.createElement('a'); btn.className = `sec-nav-btn ${dir}`; btn.href = '#' + target.id;
      const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">${dir==='prev'?'<path d="M10 3L5 8l5 5"/>':'<path d="M6 3l5 5-5 5"/>'}</svg>`;
      btn.innerHTML = dir === 'prev' ? `${arrow} ${labels[target.id]||'Sebelumnya'}` : `${labels[target.id]||'Berikutnya'} ${arrow}`;
      btn.addEventListener('click', e => { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      return btn;
    }
    nav.appendChild(prev ? makeBtn(prev, 'prev') : document.createElement('span'));
    if (next) nav.appendChild(makeBtn(next, 'next'));
    sec.appendChild(nav);
  });
})();

/* ══════════════════════════════════════════════════════════════
   TF-IDF ENGINE
   ══════════════════════════════════════════════════════════════ */

const STOP_ID = new Set([
  'yang','dan','di','ke','dari','ini','itu','dengan','untuk','pada','adalah','tidak','juga',
  'saya','kamu','dia','kita','kami','mereka','ada','akan','sudah','bisa','lebih','sangat',
  'atau','tetapi','tapi','namun','serta','oleh','sebagai','dalam','antara','setiap','dapat',
  'telah','karena','hingga','sampai','seperti','ketika','saat','setelah','sebelum','selama',
  'menjadi','tentang','terhadap','sehingga','agar','supaya','atas','bawah','semua','para',
  'tiap','hanya','belum','pun','lagi','masih','saja','yaitu','yakni','hal','cara','kali',
  'orang','masyarakat','sejak','lalu','kemudian','selain','berbagai','beberapa','banyak',
  'sebuah','salah','satu','dua','tiga','memiliki','merupakan','bahwa','jika','kalau','bila',
  'sudah','sedang','akan','mau','ingin','harus','boleh','juga','pun','saja','aja','lah',
  'deh','dong','nih','sih','ya','iya','tak','bukan','jangan','masih','oleh','atas','bawah',
]);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_ID.has(w));
}

function computeTF(tokens) {
  const counts = {}, total = tokens.length;
  tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const tf = {};
  Object.entries(counts).forEach(([w, c]) => { tf[w] = c / total; });
  return tf;
}

function buildIDF(docs) {
  const df = {}, N = docs.length;
  docs.forEach(doc => {
    const unique = new Set(tokenize(doc));
    unique.forEach(w => { df[w] = (df[w] || 0) + 1; });
  });
  const idf = {};
  Object.entries(df).forEach(([w, d]) => { idf[w] = Math.log((N + 1) / (d + 1)) + 1; });
  return idf;
}

function computeTFIDF(doc, idf) {
  const tokens = tokenize(doc);
  const tf = computeTF(tokens);
  const tfidf = {};
  Object.entries(tf).forEach(([w, v]) => { tfidf[w] = v * (idf[w] || 0); });
  return tfidf;
}

function vectorize(doc, vocab, idf) {
  const tfidf = computeTFIDF(doc, idf);
  return vocab.map(w => tfidf[w] || 0);
}

function cosineSim(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; ma += a[i]*a[i]; mb += b[i]*b[i]; }
  if (ma === 0 || mb === 0) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

/* ══════════════════════════════════════════════════════════════
   STATIC DEMOS
   ══════════════════════════════════════════════════════════════ */

/* IDF scale demo */
(function () {
  const el = document.getElementById('idfScaleDemo');
  if (!el) return;
  const N = 1000;
  const words = [
    { word: '"dan" (stop word)',    df: 1000, color: '#ef4444' },
    { word: '"jakarta"',            df: 420,  color: '#ff9f0a' },
    { word: '"startup"',            df: 85,   color: '#2997ff' },
    { word: '"unicorn"',            df: 12,   color: '#30d158' },
    { word: '"korupsi" (langka)',   df: 3,    color: '#bf5af2' },
  ];
  const maxIDF = Math.log((N + 1) / (1 + 1)) + 1;

  // Header
  const hdr = document.createElement('div'); hdr.className = 'idf-scale-row';
  hdr.style.cssText = 'background:rgba(255,255,255,.03);font-weight:600;';
  hdr.innerHTML = `<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;">Kata</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);text-align:center;">df</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);text-align:center;">IDF</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);">Kelangkaan →</div>`;
  el.appendChild(hdr);

  words.forEach(({ word, df, color }) => {
    const idfVal = Math.log((N + 1) / (df + 1)) + 1;
    const pct = (idfVal / maxIDF) * 100;
    const row = document.createElement('div'); row.className = 'idf-scale-row';
    row.innerHTML = `
      <div class="idf-word">${word}</div>
      <div class="idf-df">${df.toLocaleString()}</div>
      <div class="idf-score" style="color:${color};">${idfVal.toFixed(3)}</div>
      <div class="idf-bar-wrap"><div class="idf-bar-fill" style="width:0%;background:${color};transition:width .8s cubic-bezier(.22,.61,.36,1);"></div></div>
    `;
    el.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      row.querySelector('.idf-bar-fill').style.width = pct + '%';
    }));
  });
})();

/* TF-IDF word demo */
(function () {
  const el = document.getElementById('tfidfWordDemo');
  if (!el) return;

  const words = [
    { word: '"dan"',     tf: 0.18, idf: 0.001, color: '#ef4444' },
    { word: '"indonesia"', tf: 0.06, idf: 1.8,  color: '#ff9f0a' },
    { word: '"startup"', tf: 0.09, idf: 3.2,  color: '#2997ff' },
  ];

  // Header
  const hdr = document.createElement('div'); hdr.className = 'tfidf-row header';
  hdr.innerHTML = `
    <div class="tfidf-col-label word">Kata</div>
    <div class="tfidf-col-label">Skor (bar)</div>
    <div class="tfidf-col-label tf">TF</div>
    <div class="tfidf-col-label idf">IDF</div>
    <div class="tfidf-col-label score">TF-IDF</div>
  `;
  el.appendChild(hdr);

  const maxScore = Math.max(...words.map(w => w.tf * w.idf));

  words.forEach(({ word, tf, idf, color }) => {
    const score = tf * idf;
    const pct = (score / maxScore) * 100;
    const row = document.createElement('div'); row.className = 'tfidf-row';
    row.innerHTML = `
      <div class="tfidf-word">${word}</div>
      <div class="tfidf-bar-wrap"><div class="tfidf-bar-fill" style="width:0%;background:${color};transition:width .8s var(--ease);"></div></div>
      <div class="tfidf-val tf">${tf.toFixed(3)}</div>
      <div class="tfidf-val idf">${idf.toFixed(3)}</div>
      <div class="tfidf-val score" style="color:${color};">${score.toFixed(4)}</div>
    `;
    el.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      row.querySelector('.tfidf-bar-fill').style.width = pct + '%';
    }));
  });
})();

/* ══════════════════════════════════════════════════════════════
   INTERACTIVE PLAYGROUND
   ══════════════════════════════════════════════════════════════ */

const DOC_COLORS = ['#2997ff','#30d158','#bf5af2','#ff9f0a','#ff6b6b','#00c7be'];
const DOC_NAMES  = ['D1','D2','D3','D4','D5','D6'];

const DEFAULT_DOCS = [
  'Gojek startup unicorn Indonesia berhasil meluncurkan layanan ojek online pertama di Jakarta',
  'Tokopedia dan Shopee bersaing ketat memperebutkan pasar belanja online Indonesia',
  'Startup teknologi Indonesia makin banyak mendapat pendanaan dari investor asing dan lokal',
  'Bank Indonesia menaikkan suku bunga acuan untuk mengendalikan inflasi dan stabilkan rupiah',
  'Timnas sepak bola Indonesia berhasil lolos ke semifinal Piala Asia setelah mengalahkan Korea',
];

let corpusDocs = [...DEFAULT_DOCS];
let indexBuilt = false;
let globalVocab = [];
let globalIDF   = {};
let globalVectors = [];

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

/* ── Render corpus inputs ───────────────────────────────────── */
function renderCorpus() {
  const container = document.getElementById('corpusInputs');
  if (!container) return;
  container.innerHTML = '';
  corpusDocs.forEach((doc, i) => {
    const row = document.createElement('div'); row.className = 'doc-input-row';
    row.innerHTML = `
      <div class="doc-label">
        <div class="doc-label-dot" style="background:${DOC_COLORS[i % DOC_COLORS.length]};"></div>
        <div class="doc-label-num">${DOC_NAMES[i] || 'D'+(i+1)}</div>
      </div>
      <div style="display:flex;gap:6px;flex:1;">
        <textarea class="doc-textarea" data-idx="${i}" style="flex:1;">${doc}</textarea>
        ${corpusDocs.length > 2 ? `<button class="pg-reset-btn" data-del="${i}" style="align-self:flex-start;padding:6px 10px;flex-shrink:0;">✕</button>` : ''}
      </div>
    `;
    container.appendChild(row);
  });

  // Sync text changes
  container.querySelectorAll('.doc-textarea').forEach(ta => {
    ta.addEventListener('input', () => { corpusDocs[+ta.dataset.idx] = ta.value; indexBuilt = false; updateCorpusInfo(); });
  });

  // Delete buttons
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      corpusDocs.splice(+btn.dataset.del, 1);
      indexBuilt = false;
      renderCorpus(); updateCorpusInfo();
    });
  });

  updateCorpusInfo();
}

function updateCorpusInfo() {
  const el = document.getElementById('corpusInfo');
  const total = corpusDocs.reduce((s, d) => s + tokenize(d).length, 0);
  if (el) el.textContent = `${corpusDocs.length} dokumen · ${total} token`;
}

/* ── Build TF-IDF index ─────────────────────────────────────── */
function buildIndex() {
  // Collect vocab
  const allWords = new Set();
  corpusDocs.forEach(d => tokenize(d).forEach(w => allWords.add(w)));
  globalVocab = Array.from(allWords).sort();
  globalIDF   = buildIDF(corpusDocs);
  globalVectors = corpusDocs.map(d => vectorize(d, globalVocab, globalIDF));
  indexBuilt = true;

  renderIndexTable();
  // Force-apply bar colors after DOM is ready
  setTimeout(() => {
    document.querySelectorAll('.idx-bar-fill').forEach(bar => {
      const pct = bar.dataset.pct;
      if (pct) bar.style.width = pct + '%';
    });
  }, 150);
  const info = document.getElementById('indexInfo');
  if (info) info.textContent = `vocab: ${globalVocab.length} kata`;

  // Auto switch to index tab
  document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pg-pane').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector('[data-tab="index"]');
  if (tab) { tab.classList.add('active'); document.getElementById('pane-index').classList.add('active'); }
}

/* ── Render index table (top keywords per doc) ──────────────── */
function renderIndexTable() {
  const el = document.getElementById('indexTable');
  if (!el) return;
  el.innerHTML = '';

  corpusDocs.forEach((doc, di) => {
    const tfidf = computeTFIDF(doc, globalIDF);
    const top = Object.entries(tfidf).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxScore = top[0]?.[1] || 1;
    const color = DOC_COLORS[di % DOC_COLORS.length];

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:20px;';

    const docTitle = document.createElement('div');
    docTitle.style.cssText = `font-family:var(--font-mono);font-size:11px;font-weight:700;color:${color};margin-bottom:8px;padding:4px 0;border-bottom:1px solid var(--border);`;
    docTitle.textContent = `${DOC_NAMES[di] || 'D'+(di+1)} — ${doc.slice(0, 60)}${doc.length > 60 ? '…' : ''}`;
    section.appendChild(docTitle);

    top.forEach(([word, score]) => {
      const pct = (score / maxScore) * 100;
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:130px 1fr 70px;gap:10px;align-items:center;margin-bottom:5px;';
      row.innerHTML = `
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text);">${word}</div>
        <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
          <div class="idx-bar-fill" data-pct="${pct}" data-color="${color}" style="height:100%;width:0%;border-radius:3px;transition:width .6s .05s ease;"></div>
        </div>
        <div style="font-family:var(--font-mono);font-size:11px;color:${color};text-align:right;">${score.toFixed(4)}</div>
      `;
      // Set color explicitly after innerHTML to avoid template sanitization
      const fill = row.querySelector('.idx-bar-fill');
      if (fill) fill.style.background = color;
      section.appendChild(row);
      setTimeout(() => { if (fill) fill.style.width = pct + '%'; }, 80);
    });

    el.appendChild(section);
  });
}

/* ── Search ─────────────────────────────────────────────────── */
function runSearch() {
  const query = (document.getElementById('searchInput') || {}).value || '';
  const el    = document.getElementById('searchResults');
  const qa    = document.getElementById('queryAnalysis');
  if (!el) return;

  if (!indexBuilt) { el.innerHTML = '<div class="sr-empty">Build index terlebih dahulu.</div>'; return; }
  if (!query.trim()) { el.innerHTML = '<div class="sr-empty">Masukkan query untuk mencari.</div>'; return; }

  const qVec = vectorize(query, globalVocab, globalIDF);
  const qTfidf = computeTFIDF(query, globalIDF);
  const qTerms = Object.entries(qTfidf).sort((a,b) => b[1]-a[1]).slice(0,5);

  // Query analysis
  if (qa) {
    qa.style.display = 'block';
    qa.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:6px;">Token query setelah preprocessing:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${qTerms.map(([w, s]) => `<span style="padding:3px 10px;border-radius:6px;background:rgba(41,151,255,.12);border:1px solid rgba(41,151,255,.3);color:#2997ff;font-family:var(--font-mono);font-size:11px;">${w}<span style="opacity:.6;margin-left:4px;">${s.toFixed(3)}</span></span>`).join('')}
        ${qTerms.length === 0 ? '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);">Tidak ada token tersisa setelah stopword removal</span>' : ''}
      </div>
    `;
  }

  const scored = corpusDocs.map((doc, i) => ({ doc, i, score: cosineSim(qVec, globalVectors[i]) }))
    .sort((a, b) => b.score - a.score);

  const maxScore = scored[0].score;
  el.innerHTML = '';

  if (maxScore === 0) {
    el.innerHTML = '<div class="sr-empty">Tidak ada dokumen yang cocok. Coba kata kunci lain.</div>';
    return;
  }

  scored.forEach((item, rank) => {
    const color = DOC_COLORS[item.i % DOC_COLORS.length];
    const barW  = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
    const div   = document.createElement('div');
    div.className = `search-result${rank === 0 && item.score > 0 ? ' top-result' : ''}`;
    div.style.cssText = 'opacity:0;animation:fadeUp .3s ease ' + (rank * 0.08) + 's forwards;';
    div.innerHTML = `
      <div class="sr-rank" style="color:${rank===0?color:'var(--text-3)'};">${['🥇','🥈','🥉'][rank] || (rank+1)}</div>
      <div class="sr-body">
        <div class="sr-text">
          <strong style="color:${color};font-family:var(--font-mono);">${DOC_NAMES[item.i]||'D'+(item.i+1)}</strong>
          <span style="color:var(--text-2);"> — ${item.doc.slice(0,80)}${item.doc.length>80?'…':''}</span>
        </div>
        <div class="sr-bar-wrap" style="margin-top:6px;">
          <div class="sr-bar" style="width:${barW.toFixed(1)}%;background:${color};"></div>
        </div>
      </div>
      <div class="sr-score" style="color:${item.score>0?color:'var(--text-3)'};">${(item.score*100).toFixed(1)}%</div>
    `;
    el.appendChild(div);
  });
}

/* ── Wire up ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCorpus();

  const btnAdd   = document.getElementById('btnAddDoc');
  const btnBuild = document.getElementById('btnBuild');
  const btnReset = document.getElementById('btnReset');
  const searchBtn   = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (btnAdd) btnAdd.addEventListener('click', () => {
    if (corpusDocs.length >= 6) return;
    corpusDocs.push('');
    indexBuilt = false;
    renderCorpus();
  });

  if (btnBuild) btnBuild.addEventListener('click', buildIndex);

  if (btnReset) btnReset.addEventListener('click', () => {
    corpusDocs = [...DEFAULT_DOCS];
    indexBuilt = false;
    renderCorpus();
    document.getElementById('indexTable').innerHTML = 'Build index terlebih dahulu…';
    document.getElementById('indexInfo').textContent = '—';
    document.getElementById('searchResults').innerHTML = '<div class="sr-empty">Build index terlebih dahulu.</div>';
    if (document.getElementById('queryAnalysis')) document.getElementById('queryAnalysis').style.display = 'none';
    // Switch to corpus tab
    document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pg-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="corpus"]').classList.add('active');
    document.getElementById('pane-corpus').classList.add('active');
  });

  if (searchBtn) searchBtn.addEventListener('click', runSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
});

/* ── CSS animation ──────────────────────────────────────────── */
(function() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    @keyframes tokenAppear { from{opacity:0;transform:translateY(8px) scale(.9)} to{opacity:1;transform:none} }
  `;
  document.head.appendChild(s);
})();

/* ── PATCH: fix index bar animations ────────────────────────── */
(function patchIndexBars() {
  const orig = window.buildIndex || buildIndex;
  // After buildIndex renders, trigger bar widths with setTimeout
  const _render = renderIndexTable;
  window._patchedRenderIndexTable = function() {
    _render();
    setTimeout(() => {
      document.querySelectorAll('#indexTable .idx-bar-fill').forEach(el => {
        el.style.width = (el.dataset.pct || 0) + '%';
      });
    }, 60);
  };
})();