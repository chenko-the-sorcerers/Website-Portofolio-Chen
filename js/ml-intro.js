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
    '.lesson-sec, .worked-box, .para-card, .motiv-card, .ut-card, .wl-item, .ps-step'
  ).forEach(el => {
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(12px)';
    io.observe(el);
  });
})();

/* ── 6. Prev / Next section buttons ─────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-definisi':     'Definisi ML',
    'sec-paradigma':    '3 Paradigma Utama',
    'sec-supervised':   'Supervised Learning',
    'sec-unsupervised': 'Unsupervised Learning',
    'sec-reinforcement':'Reinforcement Learning',
    'sec-kapan':        'Kapan Pakai ML?',
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
