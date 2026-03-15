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

/* ── 5. Softmax real-time calculator (#softmaxCalc) ─────────── */
(function () {
  const sliders = [
    { sl: document.getElementById('slZ0'), val: document.getElementById('valZ0'), prob: document.getElementById('probZ0') },
    { sl: document.getElementById('slZ1'), val: document.getElementById('valZ1'), prob: document.getElementById('probZ1') },
    { sl: document.getElementById('slZ2'), val: document.getElementById('valZ2'), prob: document.getElementById('probZ2') },
  ];
  const barsEl = document.getElementById('softmaxBars');
  const sumEl  = document.getElementById('softmaxSum');
  if (!sliders[0].sl) return;

  const LABELS = ['Kucing', 'Anjing', 'Burung'];
  const COLORS = ['#2997ff', '#a855f7', '#ff9f0a'];

  // Build bar rows once
  if (barsEl) {
    barsEl.innerHTML = '';
    LABELS.forEach((lbl, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
      row.innerHTML =
        `<span style="font-size:12px;font-family:var(--font-mono);color:var(--text-2);width:52px;">${lbl}</span>` +
        `<div style="flex:1;height:10px;background:var(--bg-card);border-radius:5px;overflow:hidden;">` +
        `  <div id="smBar${i}" style="height:100%;width:0%;background:${COLORS[i]};border-radius:5px;transition:width .25s;"></div>` +
        `</div>` +
        `<span id="smPctLbl${i}" style="font-size:13px;font-family:var(--font-mono);font-weight:700;color:${COLORS[i]};width:48px;text-align:right;">—</span>`;
      barsEl.appendChild(row);
    });
  }

  function softmax(logits) {
    const exps = logits.map(z => Math.exp(z));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  function update() {
    const logits = sliders.map(s => parseFloat(s.sl.value));
    const probs  = softmax(logits);
    const sum    = probs.reduce((a, b) => a + b, 0);

    sliders.forEach((s, i) => {
      s.val.textContent  = logits[i].toFixed(1);
      s.prob.textContent = (probs[i] * 100).toFixed(1) + '%';
      const bar = document.getElementById(`smBar${i}`);
      const lbl = document.getElementById(`smPctLbl${i}`);
      if (bar) bar.style.width = (probs[i] * 100).toFixed(1) + '%';
      if (lbl) lbl.textContent = (probs[i] * 100).toFixed(1) + '%';
    });

    if (sumEl) sumEl.textContent = `∑ probabilitas = ${sum.toFixed(4)} (selalu = 1)`;
  }

  sliders.forEach(s => s.sl.addEventListener('input', update));
  update();
})();

/* ── 6. Cross-entropy loss calculator (#slProb) ─────────────── */
(function () {
  const slProb  = document.getElementById('slProb');
  const valProb = document.getElementById('valProb');
  const ceMath  = document.getElementById('ceMath');
  const ceResult= document.getElementById('ceResult');
  const ceNote  = document.getElementById('ceNote');
  if (!slProb) return;

  function update() {
    const p    = parseFloat(slProb.value);
    const loss = -Math.log(p);

    if (valProb)  valProb.textContent  = p.toFixed(2);
    if (ceMath)   ceMath.textContent   = `−log(${p.toFixed(2)})`;
    if (ceResult) {
      ceResult.textContent = `= ${loss.toFixed(4)}`;
      ceResult.style.color = p > 0.7 ? '#34c759' : p > 0.4 ? '#ff9f0a' : '#ef4444';
    }
    if (ceNote) {
      if      (p > 0.9)  ceNote.textContent = '🟢 Prediksi sangat bagus. Loss mendekati 0.';
      else if (p > 0.7)  ceNote.textContent = '🟡 Prediksi cukup baik.';
      else if (p > 0.4)  ceNote.textContent = '🟠 Prediksi ragu-ragu. Model perlu latihan lebih.';
      else               ceNote.textContent = '🔴 Prediksi sangat salah. Loss tinggi — gradient besar, belajar cepat.';
    }
  }

  slProb.addEventListener('input', update);
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
    'sec-peran'      : 'Peran FC Layer',
    'sec-flatten'    : 'Global Pooling vs Flatten',
    'sec-softmax'    : 'Softmax & Probabilitas',
    'sec-loss'       : 'Cross-Entropy Loss',
    'sec-arsitektur' : 'Arsitektur Lengkap CNN',
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
