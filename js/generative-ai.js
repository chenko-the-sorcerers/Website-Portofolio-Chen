'use strict';

/* ── Reuse computer-vision.js scroll/TOC pattern ── */
(function () {
  // Read progress
  const bar = document.getElementById('readProgress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const d = document.documentElement;
      bar.style.width = Math.min(100, (window.scrollY / (d.scrollHeight - d.clientHeight)) * 100) + '%';
    }, { passive: true });
  }

  // TOC active state
  const tocLinks = document.querySelectorAll('.toc-link[data-module]');
  const modules  = Array.from(document.querySelectorAll('.module[id]'));
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 160;
    let active = modules[0];
    modules.forEach(m => { if (m.offsetTop <= y) active = m; });
    tocLinks.forEach(l => l.classList.toggle('active', l.dataset.module === active?.id));
  }, { passive: true });

  // Smooth scroll TOC
  tocLinks.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('#' + a.dataset.module)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Reveal on scroll
  const io = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
    { threshold: 0.07 }
  );
  document.querySelectorAll('.reveal, .reveal-up').forEach(el => io.observe(el));
})();

/* ── Animated noise canvas in hero ── */
(function () {
  const canvas = document.getElementById('genCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let frame = 0;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawNoise() {
    const w = canvas.width, h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    const t = frame * 0.008;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      // Structured noise — fade left (noisy) to right (clean)
      const fade = x / w;
      const noise = Math.random();
      const signal = (Math.sin(x * 0.04 + t) * Math.cos(y * 0.04 + t) + 1) / 2;
      const val = Math.round((noise * (1 - fade) + signal * fade) * 180);
      data[i] = val * 0.6;       // R — purple tint
      data[i+1] = val * 0.2;     // G
      data[i+2] = val * 1.0;     // B
      data[i+3] = 60;
    }
    ctx.putImageData(imageData, 0, 0);
    frame++;

    // Only animate when visible
    if (frame < 80) requestAnimationFrame(drawNoise);
    else {
      // Static after 80 frames to save CPU
      setTimeout(() => { frame = 0; requestAnimationFrame(drawNoise); }, 3000);
    }
  }
  requestAnimationFrame(drawNoise);
})();
