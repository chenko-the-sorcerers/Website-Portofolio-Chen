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
      if (i < ai) { l.classList.add('done'); const d = l.querySelector('.lnav-dot'); if (d) d.style.background = '#34c759'; }
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

/* ── 5. ReLU single-value visualizer (#reluViz) ──────────────── */
(function () {
  const slX      = document.getElementById('slX');
  const valX     = document.getElementById('valX');
  const rioInput = document.getElementById('rioInput');
  const rioOutput= document.getElementById('rioOutput');
  const graph    = document.getElementById('reluGraph');
  if (!slX) return;

  function relu(x)     { return Math.max(0, x); }
  function fmtNum(n)   { return n.toFixed(1); }

  function drawGraph(currentX) {
    if (!graph) return;
    const W = graph.clientWidth || 280;
    const H = 140;
    const PAD = 24;
    const xMin = -5, xMax = 5;

    // Map data coords → SVG pixels
    function toSvgX(x) { return PAD + ((x - xMin) / (xMax - xMin)) * (W - PAD * 2); }
    function toSvgY(y) { return H - PAD - (y / xMax) * (H - PAD * 2); }

    let path = '';
    for (let x = xMin; x <= xMax; x += 0.1) {
      const sx = toSvgX(x), sy = toSvgY(relu(x));
      path += (x === xMin ? 'M' : 'L') + sx.toFixed(1) + ',' + sy.toFixed(1) + ' ';
    }

    const dotX = toSvgX(currentX);
    const dotY = toSvgY(relu(currentX));
    const isZero = currentX <= 0;

    graph.innerHTML = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <!-- axes -->
        <line x1="${PAD}" y1="${toSvgY(0)}" x2="${W - PAD}" y2="${toSvgY(0)}" stroke="rgba(255,255,255,.15)" stroke-width="1"/>
        <line x1="${toSvgX(0)}" y1="${PAD}" x2="${toSvgX(0)}" y2="${H - PAD}" stroke="rgba(255,255,255,.15)" stroke-width="1"/>
        <!-- ReLU curve -->
        <path d="${path}" fill="none" stroke="#2997ff" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- vertical guide -->
        <line x1="${dotX}" y1="${PAD}" x2="${dotX}" y2="${H - PAD}" stroke="rgba(255,255,255,.1)" stroke-dasharray="4,3" stroke-width="1"/>
        <!-- current point -->
        <circle cx="${dotX}" cy="${dotY}" r="5" fill="${isZero ? '#ff3b30' : '#34c759'}" stroke="#fff" stroke-width="1.5"/>
        <!-- labels -->
        <text x="${PAD}" y="${H - 6}" font-size="10" fill="rgba(255,255,255,.35)" font-family="monospace">${xMin}</text>
        <text x="${W - PAD - 4}" y="${H - 6}" font-size="10" fill="rgba(255,255,255,.35)" font-family="monospace">${xMax}</text>
        <text x="${toSvgX(0) + 4}" y="${PAD + 12}" font-size="10" fill="rgba(255,255,255,.35)" font-family="monospace">y</text>
      </svg>`;
  }

  function update() {
    const x   = parseFloat(slX.value);
    const out = relu(x);
    if (valX)      valX.textContent     = fmtNum(x);
    if (rioInput)  rioInput.textContent  = (x >= 0 ? '+' : '') + fmtNum(x);
    if (rioOutput) {
      rioOutput.textContent = fmtNum(out);
      rioOutput.style.color = out === 0 ? '#ff3b30' : '#34c759';
    }
    drawGraph(x);
  }

  slX.addEventListener('input', update);
  window.addEventListener('resize', () => drawGraph(parseFloat(slX.value)));
  update();
})();

/* ── 6. Variant comparison (#variantCompare) ─────────────────── */
(function () {
  const slXComp  = document.getElementById('slXComp');
  const valXComp = document.getElementById('valXComp');
  const container= document.getElementById('variantCompare');
  if (!slXComp || !container) return;

  const VARIANTS = [
    {
      name : 'ReLU',
      color: '#2997ff',
      fn   : x => Math.max(0, x),
    },
    {
      name : 'Leaky ReLU (α=0.01)',
      color: '#a855f7',
      fn   : x => x >= 0 ? x : 0.01 * x,
    },
    {
      name : 'Parametric ReLU (α=0.1)',
      color: '#ff9f0a',
      fn   : x => x >= 0 ? x : 0.1 * x,
    },
    {
      name : 'GELU',
      color: '#34c759',
      // approximation: x * Φ(x) ≈ 0.5x(1+tanh(√(2/π)(x+0.044715x³)))
      fn   : x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    },
  ];

  function update() {
    const x = parseFloat(slXComp.value);
    if (valXComp) valXComp.textContent = x.toFixed(1);

    container.innerHTML = '';
    VARIANTS.forEach(v => {
      const out = v.fn(x);
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:12px;padding:10px 12px;' +
        'background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:8px;';

      const dot = document.createElement('span');
      dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${v.color};flex-shrink:0;`;

      const label = document.createElement('span');
      label.style.cssText = 'font-family:var(--font-mono);font-size:12px;color:var(--text-2);flex:1;';
      label.textContent = v.name;

      const barWrap = document.createElement('div');
      barWrap.style.cssText = 'flex:2;height:8px;background:var(--bg-card);border-radius:4px;overflow:hidden;';
      const bar = document.createElement('div');
      const pct  = Math.max(0, Math.min(100, ((out + 4) / 8) * 100));
      bar.style.cssText = `height:100%;width:${pct.toFixed(1)}%;background:${v.color};border-radius:4px;transition:width .2s;`;
      barWrap.appendChild(bar);

      const val = document.createElement('span');
      val.style.cssText = `font-family:var(--font-mono);font-size:13px;font-weight:700;color:${v.color};width:52px;text-align:right;`;
      val.textContent = out.toFixed(3);

      row.append(dot, label, barWrap, val);
      container.appendChild(row);
    });
  }

  slXComp.addEventListener('input', update);
  update();
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
  document.querySelectorAll('.lesson-sec, .worked-box, .prob-card, .prop-card, .calc-step').forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    io.observe(el);
  });
})();

/* ── 8. Prev/Next section buttons ────────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-apa'       : 'Apa itu ReLU?',
    'sec-kenapa'    : 'Mengapa Bukan Sigmoid?',
    'sec-vanishing' : 'Vanishing Gradient',
    'sec-varian'    : 'Varian ReLU',
    'sec-praktis'   : 'Kapan Pakai Apa?',
  };
  secs.forEach((sec, i) => {
    const prev = secs[i - 1], next = secs[i + 1];
    const nav  = document.createElement('div');
    nav.className = 'sec-nav-buttons';
    function makeBtn(target, dir) {
      const btn = document.createElement('a');
      btn.className = `sec-nav-btn ${dir}`;
      btn.href = '#' + target.id;
      const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">` +
        (dir === 'prev' ? `<path d="M10 3L5 8l5 5"/>` : `<path d="M6 3l5 5-5 5"/>`) + `</svg>`;
      btn.innerHTML = dir === 'prev'
        ? `${arrow} ${labels[target.id] || 'Previous'}`
        : `${labels[target.id] || 'Next'} ${arrow}`;
      btn.addEventListener('click', e => { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      return btn;
    }
    nav.appendChild(prev ? makeBtn(prev, 'prev') : document.createElement('span'));
    if (next) nav.appendChild(makeBtn(next, 'next'));
    sec.appendChild(nav);
  });
})();
