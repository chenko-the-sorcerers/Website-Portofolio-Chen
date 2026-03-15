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

/* ── 5. Code copy buttons ────────────────────────────────────── */
(function () {
  document.querySelectorAll('.cb-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const pre = document.getElementById(targetId);
      if (!pre) return;
      // Strip HTML tags to get plain text
      const text = pre.textContent || pre.innerText;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = '#34c759';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
      }).catch(() => {
        // fallback: select text
        const range = document.createRange();
        range.selectNodeContents(pre);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      });
    });
  });
})();

/* ── 6. Simulated training progress animation ────────────────── */
(function () {
  // Animate the output-preview block when it enters viewport
  const outputEl = document.querySelector('.output-preview');
  if (!outputEl) return;

  const LINES = [
    'Epoch  5 | Train loss: 1.312 acc: 52.1% | Val loss: 1.198 acc: 57.3%',
    'Epoch 10 | Train loss: 1.089 acc: 61.5% | Val loss: 1.054 acc: 62.8%',
    'Epoch 20 | Train loss: 0.872 acc: 69.4% | Val loss: 0.891 acc: 69.1%',
    'Epoch 30 | Train loss: 0.751 acc: 74.1% | Val loss: 0.812 acc: 72.4%',
    'Epoch 50 | Train loss: 0.624 acc: 78.3% | Val loss: 0.756 acc: 75.2%',
  ];

  let animated = false;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !animated) {
        animated = true;
        outputEl.textContent = '';
        let i = 0;
        function addLine() {
          if (i >= LINES.length) return;
          outputEl.textContent += (i > 0 ? '\n' : '') + LINES[i];
          i++;
          setTimeout(addLine, 320);
        }
        setTimeout(addLine, 400);
        io.unobserve(outputEl);
      }
    });
  }, { threshold: 0.4 });
  io.observe(outputEl);
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
  document.querySelectorAll('.lesson-sec, .worked-box, .code-block, .prop-card, .calc-step').forEach(el => {
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
    'sec-setup'    : 'Setup & Dataset',
    'sec-model'    : 'Definisi Model',
    'sec-training' : 'Training Loop',
    'sec-eval'     : 'Evaluasi & Visualisasi',
    'sec-improve'  : 'Cara Meningkatkan Akurasi',
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
