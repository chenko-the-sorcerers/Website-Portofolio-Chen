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
    const y = window.scrollY + 120;
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

/* ── 5. Parameter Explorer ───────────────────────────────────── */
(function () {
  const RES_MAP  = [32, 64, 128, 224];

  const slRes = document.getElementById('slRes');
  const slH1  = document.getElementById('slH1');
  const slH2  = document.getElementById('slH2');
  if (!slRes) return;

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' miliar';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + ' juta';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + ' ribu';
    return n.toLocaleString();
  }
  function fmtExact(n) { return n.toLocaleString('id-ID'); }

  function html(parts) { return parts.join(''); }
  function span(cls, text) { return `<span class="math-term ${cls}">${text}</span>`; }
  function op(t)           { return `<span class="math-op">${t}</span>`; }
  function res(cls, text)  { return `<span class="math-result ${cls}">${text}</span>`; }
  function cmt(text)       { return `<span class="math-comment">${text}</span>`; }

  function update() {
    const resolution = RES_MAP[+slRes.value];
    const h1         = +slH1.value;
    const h2         = +slH2.value;

    // Labels
    document.getElementById('valRes').textContent  = resolution;
    document.getElementById('valRes2').textContent = resolution;
    document.getElementById('valH1').textContent   = h1;
    document.getElementById('valH2').textContent   = h2;

    // Calculations — params = (n_in × n_out) + n_out (bias)
    const nIn   = resolution * resolution * 3;
    const p1    = nIn * h1 + h1;
    const p2    = h1  * h2 + h2;
    const p3    = h2  * 10 + 10;
    const total = p1 + p2 + p3;
    const cnnP  = 3 * 3 * 3 * 32 + 32;   // 896 — Conv 3×3, 3ch in, 32 filters

    // Step 1 — flatten
    document.getElementById('peStep1').innerHTML = html([
      cmt('// Tinggi × Lebar × Channels'), '<br>',
      span('blue', resolution), op('×'), span('blue', resolution), op('×'), span('blue', '3'),
      op('='), res('', fmtExact(nIn) + ' neuron input'),
    ]);

    // Step 2 — H1
    document.getElementById('peLabel2').textContent = `Hidden Layer 1: ${h1.toLocaleString()} neuron`;
    const largeP1 = p1 > 50_000_000;
    document.getElementById('peStep2').innerHTML = html([
      span('blue', fmtExact(nIn)), op('×'), span('purple', fmtExact(h1)),
      op('+'), span('purple', fmtExact(h1)), cmt(' (bias)'),
      op('='), res(largeP1 ? 'red' : '', fmtExact(p1) + ' params'),
    ]);

    // Step 3 — H2
    document.getElementById('peLabel3').textContent = `Hidden Layer 2: ${h2.toLocaleString()} neuron`;
    document.getElementById('peStep3').innerHTML = html([
      span('purple', fmtExact(h1)), op('×'), span('purple', fmtExact(h2)),
      op('+'), span('purple', fmtExact(h2)), cmt(' (bias)'),
      op('='), res('red', fmtExact(p2) + ' params'),
    ]);

    // Step 4 — output
    document.getElementById('peStep4').innerHTML = html([
      span('purple', fmtExact(h2)), op('×'), span('green', '10'),
      op('+'), span('green', '10'), cmt(' (bias)'),
      op('='), res('green', fmtExact(p3) + ' params'),
    ]);

    // Total
    const danger = total > 10_000_000;
    document.getElementById('peTotalMath').innerHTML =
      fmtExact(p1) + ' + ' + fmtExact(p2) + ' + ' + fmtExact(p3);
    document.getElementById('peTotalResult').textContent = fmtExact(total) + ' parameter';
    document.getElementById('peTotalResult').style.color = danger ? '#ef4444' : '#34c759';
    document.getElementById('peTotalNote').textContent   =
      `untuk gambar ${resolution}×${resolution} — ${fmt(total)}`;
    document.getElementById('peTotal').className =
      'calc-total' + (danger ? ' danger' : '');

    // Bar comparison
    const ratio    = p1 / cnnP;
    const cnnWidth = Math.max(0.5, (cnnP / p1) * 100);
    document.getElementById('barMLP').style.width = '100%';
    document.getElementById('barCNN').style.width = cnnWidth + '%';
    document.getElementById('numMLP').textContent = fmt(p1);
    document.getElementById('numCNN').textContent = fmt(cnnP);
    document.getElementById('peRatio').innerHTML  =
      `MLP layer 1 punya <strong style="color:#ef4444">${Math.round(ratio).toLocaleString()}×</strong> lebih banyak parameter dari Conv 3×3 dengan 32 filter`;

    // Warning badge
    const warn = document.getElementById('peWarning');
    if (total > 50_000_000) {
      warn.style.display = 'flex';
      document.getElementById('peWarningText').textContent =
        `${fmt(total)} parameter — GPU biasa hanya punya 8–16 GB VRAM. Satu batch saja bisa habis memory!`;
    } else if (total > 10_000_000) {
      warn.style.display = 'flex';
      document.getElementById('peWarningText').textContent =
        `${fmt(total)} parameter — sangat mudah overfit tanpa dataset yang sangat besar.`;
    } else {
      warn.style.display = 'none';
    }
  }

  slRes.addEventListener('input', update);
  slH1.addEventListener('input',  update);
  slH2.addEventListener('input',  update);
  update();
})();

/* ── 5b. Pixel grid — flatten demo ──────────────────────────── */
(function () {
  const PIXELS = [
    [40,  40,  40,  40],
    [40,  200, 40,  200],  // eyes
    [40,  40,  40,  40],
    [40,  180, 180, 40],   // mouth
  ];
  const COLORS = [
    '#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e',
    '#1a1a2e','#2997ff','#1a1a2e','#2997ff',
    '#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e',
    '#1a1a2e','#a855f7','#a855f7','#1a1a2e',
  ];
  const LABELS = [
    'bg','bg','bg','bg',
    'bg','eye_L','bg','eye_R',
    'bg','bg','bg','bg',
    'bg','mouth','mouth','bg',
  ];

  const grid = document.getElementById('pixelGrid');
  const flat = document.getElementById('flatVector');
  if (!grid || !flat) return;

  const values = PIXELS.flat();

  values.forEach((v, i) => {
    const cell = document.createElement('div');
    cell.className = 'px-cell';
    cell.textContent = v;
    cell.style.background = COLORS[i];
    cell.style.color = v > 100 ? '#fff' : 'rgba(255,255,255,.4)';
    cell.title = `(${Math.floor(i / 4)}, ${i % 4}) = ${v}  [${LABELS[i]}]`;
    grid.appendChild(cell);
  });

  values.forEach((v, i) => {
    const cell = document.createElement('div');
    cell.className = 'fv-cell';
    cell.style.background = COLORS[i];
    cell.style.color = v > 100 ? '#fff' : 'rgba(255,255,255,.4)';
    cell.innerHTML =
      `<span style="min-width:28px;font-size:10px;opacity:.5">[${i}]</span>` +
      ` ${v} ` +
      `<span style="margin-left:auto;font-size:10px;opacity:.4">${LABELS[i]}</span>`;
    flat.appendChild(cell);
  });
})();

/* ── 6. Translation demo ─────────────────────────────────────── */
(function () {
  const leftGrid  = document.getElementById('catLeft');
  const rightGrid = document.getElementById('catRight');
  const leftBars  = document.getElementById('neuronsLeft');
  const rightBars = document.getElementById('neuronsRight');
  if (!leftGrid) return;

  const CAT_L = [
    [0,1,0,1,0],
    [0,1,1,1,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
    [0,0,0,0,0],
  ];
  const CAT_R = [
    [0,0,1,0,1],
    [0,0,1,1,1],
    [0,0,0,1,0],
    [0,0,1,1,1],
    [0,0,0,0,0],
  ];

  function buildGrid(container, data) {
    data.flat().forEach(v => {
      const d = document.createElement('div');
      d.className = 'td-cell';
      d.style.background  = v ? 'rgba(41,151,255,.25)' : 'rgba(255,255,255,.04)';
      d.style.borderColor = v ? 'rgba(41,151,255,.4)'  : 'var(--border)';
      container.appendChild(d);
    });
  }

  function buildNeurons(container, data, colorFn) {
    data.flat().forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className       = 'tn-bar';
      bar.style.width     = v ? (30 + Math.random() * 50) + 'px' : '4px';
      bar.style.background = colorFn(i, v);
      bar.style.opacity   = v ? '1' : '0.15';
      container.appendChild(bar);
    });
  }

  buildGrid(leftGrid,  CAT_L);
  buildGrid(rightGrid, CAT_R);
  buildNeurons(leftBars,  CAT_L, (i, v) => v ? '#2997ff' : 'var(--border-s)');
  buildNeurons(rightBars, CAT_R, (i, v) => v ? '#a855f7' : 'var(--border-s)');
})();

/* ── 7. Scroll reveal ────────────────────────────────────────── */
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
    '.lesson-sec, .worked-box, .prob-card, .prop-card, .bh-level, .calc-step'
  ).forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    io.observe(el);
  });
})();

/* ── 8. Prev / Next section buttons ─────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-masalah': 'Masalah MLP',
    'sec-params':  'Ledakan Parameter',
    'sec-spatial': 'Konteks Spasial Hilang',
    'sec-bio':     'Inspirasi Biologis',
    'sec-solusi':  'Solusi CNN',
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
        (dir === 'prev'
          ? `<path d="M10 3L5 8l5 5"/>`
          : `<path d="M6 3l5 5-5 5"/>`) +
        `</svg>`;
      btn.innerHTML = dir === 'prev'
        ? `${arrow} ${labels[target.id] || 'Previous'}`
        : `${labels[target.id] || 'Next'} ${arrow}`;
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