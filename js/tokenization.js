'use strict';

/* ── 1. Reading progress ─────────────────────────────────────── */
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

/* ── 2. Sidebar toggle ───────────────────────────────────────── */
window.toggleSidebar = function () {
  document.getElementById('lessonSidebar').classList.toggle('open');
};
document.addEventListener('click', (e) => {
  const sb  = document.getElementById('lessonSidebar');
  const btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target))
    sb.classList.remove('open');
});

/* ── 3. Active TOC on scroll ─────────────────────────────────── */
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
      if (i < ai) {
        l.classList.add('done');
        const d = l.querySelector('.lnav-dot');
        if (d) d.style.background = '#34c759';
      }
    });
    const p = Math.round((ai / Math.max(1, secs.length - 1)) * 100);
    if (fill) fill.style.width = p + '%';
    if (pct)  pct.textContent  = p + '%';
  }
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* ── 4. Smooth scroll ────────────────────────────────────────── */
document.querySelectorAll('.lnav-item[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});

/* ── 5. Scroll reveal ────────────────────────────────────────── */
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
  document.querySelectorAll(
    '.lesson-sec, .worked-box, .prob-card, .strategy-card, .calc-step, .prop-card'
  ).forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    io.observe(el);
  });
})();

/* ── 6. Prev / Next section buttons ─────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-konsep':    'Apa itu Token?',
    'sec-strategi':  'Empat Strategi',
    'sec-indonesia': 'Tantangan B. Indonesia',
    'sec-modern':    'Tokenizer Modern',
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
      btn.innerHTML = dir === 'prev'
        ? `${arrow} ${labels[target.id] || 'Sebelumnya'}`
        : `${labels[target.id] || 'Berikutnya'} ${arrow}`;
      btn.addEventListener('click', e => {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return btn;
    }
    nav.appendChild(prev ? makeBtn(prev, 'prev') : document.createElement('span'));
    if (next) nav.appendChild(makeBtn(next, 'next'));
    sec.appendChild(nav);
  });
})();

/* ══════════════════════════════════════════════════════════════
   INTERACTIVE TOKENIZER PLAYGROUND
   ══════════════════════════════════════════════════════════════ */

/* ── Indonesian Morphology Engine ─────────────────────────── */
const ID_PREFIXES = [
  'mempertanggung','memperlakukan','mempermasalah',
  'memper','mempere','ketidak',
  'menge','meng','mem','men','meny','me',
  'penge','peng','pem','pen','peny','pe',
  'membe','mempel',
  'ber','per','ter','ke','se',
  'di','ku','kau',
];
const ID_SUFFIXES = ['isasi','isme','logi','wati','wan','kan','an','nya','i','lah','kah','pun','tah'];

const COMMON_WORDS = new Set([
  'saya','aku','kamu','kau','anda','dia','ia','kita','kami','mereka','beliau',
  'gue','gw','lo','lu','kalian',
  'di','ke','dari','dan','atau','tapi','tetapi','namun','melainkan',
  'dengan','untuk','pada','oleh','dalam','antara','tentang',
  'karena','sebab','sehingga','agar','supaya','bahwa',
  'jika','kalau','apabila','bila','ketika','saat','sambil',
  'setelah','sebelum','selama','sejak','hingga','sampai',
  'sudah','telah','belum','tidak','bukan','jangan','tak',
  'masih','sedang','akan','mau','ingin','harus','bisa','boleh',
  'juga','pun','saja','aja','lagi','lah','deh','dong','nih','sih','ya','iya',
  'ini','itu','sini','situ','sana','mana','apa','siapa','kapan','bagaimana','mengapa','kenapa',
  'orang','anak','bapak','ibu','pak','bu','mas','mbak','bang','kak',
  'kota','desa','jalan','rumah','kantor','sekolah','pasar','toko','warung',
  'waktu','hari','malam','pagi','siang','sore','tahun','bulan',
  'baik','buruk','bagus','jelek','besar','kecil','baru','lama','lain',
  'banyak','sedikit','semua','seluruh','setiap','beberapa','para',
  'ada','buat','beli','jual','makan','minum','pergi','datang','pulang',
  'kerja','main','baca','tulis','lihat','dengar','tahu','tanya','jawab',
  'satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh',
  'gaskeun','gapapa','yaudah','wkwk','hehe','haha','fix','banget','poll',
  'ojek','online','internet','aplikasi','startup',
  'jakarta','surabaya','bandung','medan','semarang','yogyakarta','bali',
  'indonesia','jawa','sumatra','kalimantan','sulawesi','papua',
  'gojek','tokopedia','bukalapak','shopee','traveloka',
  'yang','cara','punya','milik','sesuai','berupa','berisi',
]);

function detectMorphemes(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length <= 3 || COMMON_WORDS.has(clean)) return null;
  let prefix = null, suffix = null, root = clean;
  for (const p of ID_PREFIXES) {
    if (clean.startsWith(p) && clean.length > p.length + 2) { prefix = clean.slice(0, p.length); root = clean.slice(p.length); break; }
  }
  for (const s of ID_SUFFIXES) {
    if (root.endsWith(s) && root.length > s.length + 2) { suffix = root.slice(root.length - s.length); root = root.slice(0, root.length - s.length); break; }
  }
  if (prefix === null && suffix === null) return null;
  return { prefix, root, suffix, original: word };
}

/* ── Tokenization algorithms ───────────────────────────────── */
function tokenizeWord(text) {
  const result = [];
  const regex = /([A-Za-zÀ-ÿ0-9](?:[A-Za-zÀ-ÿ0-9._-]*[A-Za-zÀ-ÿ0-9])?)|([^\w\s])/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) result.push({ text: m[1], type: 'word', index: m.index });
    else if (m[2]) result.push({ text: m[2], type: 'punct', index: m.index });
  }
  return result;
}

function tokenizeSubword(text) {
  const words = [];
  const regex = /([A-Za-zÀ-ÿ0-9](?:[A-Za-zÀ-ÿ0-9._-]*[A-Za-zÀ-ÿ0-9])?)|([^\w\s])/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m[1]) words.push({ text: m[1], type: 'word' });
    else if (m[2]) words.push({ text: m[2], type: 'punct' });
  }
  const result = [];
  for (const w of words) {
    if (w.type === 'punct') { result.push({ text: w.text, type: 'punct', wordRef: w.text }); continue; }
    const morph = detectMorphemes(w.text);
    if (morph) {
      if (morph.prefix) result.push({ text: morph.prefix + '-', type: 'prefix', wordRef: w.text });
      result.push({ text: morph.root, type: 'root', wordRef: w.text });
      if (morph.suffix) result.push({ text: '-' + morph.suffix, type: 'suffix', wordRef: w.text });
    } else if (w.text.length > 10 && !COMMON_WORDS.has(w.text.toLowerCase())) {
      const mid = Math.ceil(w.text.length / 2);
      result.push({ text: w.text.slice(0, mid), type: 'word', wordRef: w.text });
      result.push({ text: '##' + w.text.slice(mid), type: 'suffix', wordRef: w.text });
    } else {
      result.push({ text: w.text, type: 'word', wordRef: w.text });
    }
  }
  return result;
}

function tokenizeChar(text) {
  return [...text].map(c => ({
    text: c === ' ' ? '·' : c === '\n' ? '↵' : c,
    type: c === ' ' || c === '\n' ? 'space' : /[A-Za-zÀ-ÿ]/.test(c) ? 'char' : 'punct',
    raw: c,
  }));
}

/* ── Color palette ─────────────────────────────────────────── */
const TOKEN_PALETTE = [
  { bg:'rgba(191,90,242,.14)', border:'rgba(191,90,242,.4)', color:'#bf5af2' },
  { bg:'rgba(41,151,255,.14)', border:'rgba(41,151,255,.4)', color:'#2997ff' },
  { bg:'rgba(48,209,88,.14)',  border:'rgba(48,209,88,.4)',  color:'#30d158' },
  { bg:'rgba(255,159,10,.14)', border:'rgba(255,159,10,.4)', color:'#ff9f0a' },
  { bg:'rgba(255,107,107,.14)',border:'rgba(255,107,107,.4)',color:'#ff6b6b' },
  { bg:'rgba(0,199,190,.14)',  border:'rgba(0,199,190,.4)',  color:'#00c7be' },
  { bg:'rgba(168,85,247,.14)', border:'rgba(168,85,247,.4)', color:'#a855f7' },
  { bg:'rgba(255,214,10,.14)', border:'rgba(255,214,10,.4)', color:'#ffd60a' },
];
const TYPE_STYLES = {
  prefix: { bg:'rgba(41,151,255,.14)', border:'rgba(41,151,255,.4)',  color:'#2997ff' },
  root:   { bg:'rgba(48,209,88,.14)',  border:'rgba(48,209,88,.4)',   color:'#30d158' },
  suffix: { bg:'rgba(255,159,10,.14)', border:'rgba(255,159,10,.4)',  color:'#ff9f0a' },
  punct:  { bg:'rgba(255,255,255,.05)',border:'rgba(255,255,255,.12)',color:'#55556a' },
  space:  { bg:'rgba(255,255,255,.03)',border:'rgba(255,255,255,.06)',color:'#44445a' },
};
const MODE_DESCRIPTIONS = {
  word:    '<strong>Berbasis Kata:</strong> Pisahkan teks berdasarkan spasi dan tanda baca. Satu kata = satu token.',
  subword: '<strong>Subkata (BPE):</strong> Kata umum tetap utuh. Kata berafiks dipecah menjadi awalan + akar + akhiran.',
  char:    '<strong>Karakter:</strong> Setiap karakter adalah satu token. Spasi ditampilkan sebagai <code style="color:#bf5af2">·</code>',
};

/* ── Render tokens ─────────────────────────────────────────── */
function renderTokens(tokens, mode) {
  const container = document.getElementById('tokenOutput');
  container.innerHTML = '';
  const displayTokens = mode === 'char' ? tokens : tokens.filter(t => t.type !== 'space');
  let pi = 0;
  const colorMap = {};
  const typeLabels = { word:'kata', prefix:'awalan', root:'akar', suffix:'akhiran', punct:'tanda baca', space:'spasi', char:'karakter' };

  displayTokens.forEach((tok, i) => {
    const chip = document.createElement('span');
    chip.className = 'token-chip';
    let style = TYPE_STYLES[tok.type];
    if (!style) {
      const key = tok.wordRef || tok.text;
      if (!(key in colorMap)) { colorMap[key] = TOKEN_PALETTE[pi % TOKEN_PALETTE.length]; pi++; }
      style = colorMap[key];
    }
    chip.style.cssText = `background:${style.bg};border:1px solid ${style.border};color:${style.color};animation-delay:${Math.min(i * 0.025, 1)}s`;

    const txt = document.createElement('span');
    txt.textContent = tok.text;
    chip.appendChild(txt);

    const idx = document.createElement('span');
    idx.className = 'token-index';
    idx.textContent = `#${i}`;
    chip.appendChild(idx);

    const tip = document.createElement('div');
    tip.className = 'token-tooltip';
    tip.textContent = `${typeLabels[tok.type] || tok.type} · token #${i}`;
    chip.appendChild(tip);
    container.appendChild(chip);
  });
  return displayTokens;
}

/* ── Update stats ──────────────────────────────────────────── */
function animateNum(el, val, suffix = '') {
  if (!el) return;
  el.classList.add('updated');
  el.textContent = val + suffix;
  setTimeout(() => el.classList.remove('updated'), 500);
}

function updateStats(tokens, rawText) {
  const dt = tokens.filter(t => t.type !== 'space');
  const unique = new Set(dt.map(t => t.text.toLowerCase())).size;
  const avgLen = dt.length ? (dt.reduce((a, t) => a + t.text.replace(/[#·↵→-]/g,'').length, 0) / dt.length).toFixed(1) : 0;
  const chars  = rawText.replace(/\s/g, '').length;
  const ratio  = dt.length ? (chars / dt.length).toFixed(1) : 0;
  animateNum(document.getElementById('statTotal'), dt.length);
  animateNum(document.getElementById('statUnique'), unique);
  animateNum(document.getElementById('statAvgLen'), avgLen);
  animateNum(document.getElementById('statCompression'), ratio, '×');
  const badge = document.getElementById('tokenCountBadge');
  if (badge) badge.textContent = `${dt.length} token`;
}

/* ── Morphology panel ──────────────────────────────────────── */
function makeMorphoPiece(val, label, cls) {
  const p = document.createElement('div');
  p.className = `morpho-piece ${cls}`;
  p.innerHTML = `<div class="morpho-value">${val}</div><div class="morpho-type">${label}</div>`;
  return p;
}
function makeSep(c) {
  const s = document.createElement('div');
  s.className = 'morpho-sep'; s.textContent = c; return s;
}

function updateMorphoPanel(text, show) {
  const panel = document.getElementById('morphoPanel');
  const grid  = document.getElementById('morphoGrid');
  if (!panel || !grid) return;
  if (!show) { panel.classList.remove('visible'); return; }
  panel.classList.add('visible');
  const words    = [...text.matchAll(/[A-Za-zÀ-ÿ]{3,}/g)].map(m => m[0]);
  const analyzed = words.filter((w, i, a) => a.indexOf(w) === i).map(detectMorphemes).filter(Boolean);
  if (!analyzed.length) {
    grid.innerHTML = '<div class="morpho-empty">Tidak ada kata berafiks yang terdeteksi. Coba "mempertanggungjawabkan" atau "mengerjakan".</div>';
    return;
  }
  grid.innerHTML = '';
  analyzed.forEach(morph => {
    const card = document.createElement('div');
    card.className = 'morpho-word-card';
    card.innerHTML = `<div class="morpho-original">${morph.original}</div>`;
    const bd = document.createElement('div');
    bd.className = 'morpho-breakdown';
    if (morph.prefix) { bd.appendChild(makeMorphoPiece(morph.prefix + '-', 'awalan', 'm-prefix')); bd.appendChild(makeSep('+')); }
    bd.appendChild(makeMorphoPiece(morph.root, 'akar', 'm-root'));
    if (morph.suffix) { bd.appendChild(makeSep('+')); bd.appendChild(makeMorphoPiece('-' + morph.suffix, 'akhiran', 'm-suffix')); }
    card.appendChild(bd);
    grid.appendChild(card);
  });
}

/* ── Main playground controller ───────────────────────────── */
(function initPlayground() {
  const inputEl  = document.getElementById('inputText');
  const modeDesc = document.getElementById('modeDesc');
  const tabs     = document.querySelectorAll('.mode-tab');
  let currentMode = 'word';
  let debounce = null;

  function run() {
    const text = inputEl ? inputEl.value : '';
    if (!text.trim()) {
      const out = document.getElementById('tokenOutput');
      if (out) out.innerHTML = '';
      ['statTotal','statUnique','statAvgLen'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0'; });
      const sc = document.getElementById('statCompression');
      if (sc) sc.textContent = '0×';
      const b = document.getElementById('tokenCountBadge');
      if (b) b.textContent = '0 token';
      updateMorphoPanel('', false);
      return;
    }
    const tokens = currentMode === 'word' ? tokenizeWord(text)
                 : currentMode === 'subword' ? tokenizeSubword(text)
                 : tokenizeChar(text);
    renderTokens(tokens, currentMode);
    updateStats(tokens, text);
    updateMorphoPanel(text, currentMode === 'subword');
  }

  if (inputEl) {
    inputEl.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(run, 160); });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      if (modeDesc) modeDesc.innerHTML = MODE_DESCRIPTIONS[currentMode];
      run();
    });
  });

  document.querySelectorAll('.example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (inputEl) { inputEl.value = chip.dataset.text; run(); }
    });
  });

  const btnClear = document.getElementById('btnClear');
  if (btnClear) btnClear.addEventListener('click', () => { if (inputEl) { inputEl.value = ''; run(); inputEl.focus(); } });

  run();
})();