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

/* ── 5. Feature vector demo tabs ─────────────────────────────── */
window.switchDemo = function(id) {
  document.querySelectorAll('.fv-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.fv-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('demo-' + id).classList.remove('hidden');
  event.target.classList.add('active');
};

/* ── 6. Input Space Canvas ───────────────────────────────────── */
(function () {
  const canvas = document.getElementById('inputSpaceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = 40;

  // Generate random data
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  const r = rng(42);
  const points = [];

  // Class 1: top-right cluster
  for (let i = 0; i < 18; i++) {
    points.push({ x: 0.55 + r() * 0.35, y: 0.1 + r() * 0.38, cls: 1 });
  }
  // Class 0: bottom-left cluster
  for (let i = 0; i < 18; i++) {
    points.push({ x: 0.08 + r() * 0.35, y: 0.48 + r() * 0.42, cls: 0 });
  }

  function toCanvas(nx, ny) {
    return [PAD + nx * (W - PAD * 2), PAD + ny * (H - PAD * 2)];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (W - PAD * 2);
      const y = PAD + (i / 5) * (H - PAD * 2);
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '12px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('x₁ (fitur 1)', W / 2, H - 6);
    ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂ (fitur 2)', 0, 0); ctx.restore();

    // Decision boundary (dashed diagonal)
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    const [lx1, ly1] = toCanvas(0.08, 0.08);
    const [lx2, ly2] = toCanvas(0.92, 0.92);
    ctx.beginPath(); ctx.moveTo(lx1, ly2); ctx.lineTo(lx2, ly1); ctx.stroke();
    ctx.setLineDash([]);

    // Label the boundary
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '10px Space Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('h(x) = 0 / h(x) = 1', ...toCanvas(0.52, 0.52));

    // Points
    points.forEach(p => {
      const [cx, cy] = toCanvas(p.x, 1 - p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      if (p.cls === 1) {
        ctx.fillStyle = '#2997ff';
        ctx.strokeStyle = 'rgba(41,151,255,.4)';
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = 'rgba(239,68,68,.4)';
      }
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

    // Region labels
    ctx.font = 'bold 11px Space Mono, monospace';
    ctx.fillStyle = 'rgba(41,151,255,.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Positif (y=1)', ...toCanvas(0.72, 0.3));
    ctx.fillStyle = 'rgba(239,68,68,.5)';
    ctx.fillText('Negatif (y=0)', ...toCanvas(0.25, 0.8));
  }

  draw();
})();

/* ── 7. Hypothesis interactive ───────────────────────────────── */
(function () {
  const canvas = document.getElementById('hypothesisCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = 30;

  const slAngle  = document.getElementById('slAngle');
  const slOffset = document.getElementById('slOffset');
  const angleVal = document.getElementById('angleVal');
  const fpEl = document.getElementById('fpCount');
  const fnEl = document.getElementById('fnCount');
  const errEl = document.getElementById('errorRate');

  // Fixed dataset
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  const r = rng(99);
  const pts = [];
  for (let i = 0; i < 12; i++) pts.push({ nx: 0.55 + r()*0.38, ny: 0.08 + r()*0.38, cls: 1 });
  for (let i = 0; i < 12; i++) pts.push({ nx: 0.05 + r()*0.38, ny: 0.52 + r()*0.40, cls: 0 });

  function toC(nx, ny) { return [PAD + nx*(W-PAD*2), PAD + ny*(H-PAD*2)]; }

  function classify(nx, ny, angle, offset) {
    const rad = (angle * Math.PI) / 180;
    const cx = 0.5, cy = 0.5;
    const dx = nx - cx, dy = ny - cy;
    const proj = dx * Math.cos(rad) + dy * Math.sin(rad);
    return proj + offset / (W - PAD * 2) > 0 ? 1 : 0;
  }

  function draw() {
    const angle  = +slAngle.value;
    const offset = +slOffset.value;
    angleVal.textContent = angle + '°';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = PAD + (i/4)*(W-PAD*2);
      const y = PAD + (i/4)*(H-PAD*2);
      ctx.beginPath(); ctx.moveTo(x,PAD); ctx.lineTo(x,H-PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD,y); ctx.lineTo(W-PAD,y); ctx.stroke();
    }

    // Decision line
    const rad = (angle * Math.PI) / 180;
    const cx = PAD + 0.5*(W-PAD*2) - offset*Math.sin(rad)*0;
    const cy = PAD + 0.5*(H-PAD*2);
    const nx2 = Math.cos(rad + Math.PI/2) * 400;
    const ny2 = Math.sin(rad + Math.PI/2) * 400;
    const perpX = Math.cos(rad) * offset;
    const perpY = Math.sin(rad) * offset;

    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + perpX - nx2, cy + perpY - ny2);
    ctx.lineTo(cx + perpX + nx2, cy + perpY + ny2);
    ctx.stroke();

    // Points
    let fp = 0, fn = 0;
    pts.forEach(p => {
      const pred = classify(p.nx, 1-p.ny, angle, offset);
      const [x, y] = toC(p.nx, 1-p.ny);
      const correct = pred === p.cls;
      if (!correct) { if (pred === 1) fp++; else fn++; }

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      if (p.cls === 1) ctx.fillStyle = correct ? '#2997ff' : 'rgba(41,151,255,.25)';
      else             ctx.fillStyle = correct ? '#ef4444' : 'rgba(239,68,68,.25)';
      ctx.fill();

      // Mismatch marker
      if (!correct) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x-5, y-5); ctx.lineTo(x+5, y+5);
        ctx.moveTo(x+5, y-5); ctx.lineTo(x-5, y+5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    const errPct = Math.round(((fp + fn) / pts.length) * 100);
    if (fpEl) fpEl.textContent = fp;
    if (fnEl) fnEl.textContent = fn;
    if (errEl) {
      errEl.textContent = errPct + '%';
      errEl.style.color = errPct === 0 ? '#34c759' : errPct < 20 ? '#ff9f0a' : '#ef4444';
    }
  }

  slAngle.addEventListener('input', draw);
  slOffset.addEventListener('input', draw);
  draw();
})();

/* ── 8. Model Zoo mini-canvases ──────────────────────────────── */
(function () {
  const datasets = (() => {
    const r = ((s) => { let v=s; return ()=>{ v=(v*16807)%2147483647; return (v-1)/2147483646; }})(77);
    const pos=[], neg=[];
    for(let i=0;i<8;i++) pos.push([0.55+r()*0.35, 0.15+r()*0.35]);
    for(let i=0;i<8;i++) neg.push([0.1+r()*0.35,  0.5+r()*0.4]);
    return { pos, neg };
  })();

  function drawMini(id, drawFn) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
    drawFn(ctx, W, H, datasets);
    // Points
    datasets.pos.forEach(([nx,ny]) => {
      ctx.beginPath(); ctx.arc(nx*W, ny*H, 4, 0, Math.PI*2);
      ctx.fillStyle = '#2997ff'; ctx.fill();
    });
    datasets.neg.forEach(([nx,ny]) => {
      ctx.beginPath(); ctx.arc(nx*W, ny*H, 4, 0, Math.PI*2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
    });
  }

  // Linear
  drawMini('mz-linear', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W*0.08, H*0.92); ctx.lineTo(W*0.92, H*0.08); ctx.stroke();
    ctx.fillStyle='rgba(41,151,255,.06)';
    ctx.beginPath(); ctx.moveTo(W*0.08,H*0.92); ctx.lineTo(W*0.92,H*0.08); ctx.lineTo(W,0); ctx.lineTo(W,0); ctx.closePath(); ctx.fill();
  });

  // Rectangle
  drawMini('mz-rect', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(W*0.5, H*0.1, W*0.44, H*0.38);
    ctx.fillStyle='rgba(41,151,255,.08)';
    ctx.fillRect(W*0.5, H*0.1, W*0.44, H*0.38);
  });

  // Circle
  drawMini('mz-circle', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W*0.7, H*0.32, H*0.28, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(41,151,255,.08)';
    ctx.beginPath(); ctx.arc(W*0.7, H*0.32, H*0.28, 0, Math.PI*2); ctx.fill();
  });

  // Polynomial (squiggly)
  drawMini('mz-poly', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let xi = 0; xi <= W; xi++) {
      const t = xi / W;
      const y = H * (0.5 + 0.3*Math.sin(t*Math.PI*2.5) - 0.1*t);
      if (xi === 0) ctx.moveTo(xi, y); else ctx.lineTo(xi, y);
    }
    ctx.stroke();
  });

  window.showModel = function(type) {
    // highlight selected
    document.querySelectorAll('.mz-card').forEach((c,i) => {
      const types = ['linear','rect','circle','poly'];
      c.style.borderColor = types[i] === type ? 'rgba(41,151,255,.5)' : '';
    });
  };
})();

/* ── 9. Version Space Canvas ─────────────────────────────────── */
(function () {
  const canvas = document.getElementById('versionSpaceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = 32;

  // Points
  const pos = [[0.45,0.25],[0.58,0.32],[0.52,0.45],[0.65,0.28],[0.42,0.38]];
  const neg = [[0.15,0.2],[0.2,0.55],[0.8,0.7],[0.75,0.15],[0.1,0.75],[0.85,0.45]];

  function toC(nx, ny) { return [PAD + nx*(W-PAD*2), PAD + ny*(H-PAD*2)]; }

  // Compute S (tightest) and G (loosest) bounding boxes
  const posX = pos.map(p=>p[0]), posY = pos.map(p=>p[1]);
  const minPX = Math.min(...posX), maxPX = Math.max(...posX);
  const minPY = Math.min(...posY), maxPY = Math.max(...posY);

  // G: largest rectangle not containing any negative point
  // Simplified: full canvas minus neg clearance
  const margin = 0.06;
  const S = { x1: minPX-margin, y1: minPY-margin, x2: maxPX+margin, y2: maxPY+margin };
  const G = { x1: 0.02, y1: 0.02, x2: 0.98, y2: 0.98 };

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Version space fill (area between G and S)
  ctx.fillStyle = 'rgba(168,85,247,.07)';
  const [gx1,gy1] = toC(G.x1, G.y1);
  const [gx2,gy2] = toC(G.x2, G.y2);
  ctx.fillRect(gx1, gy1, gx2-gx1, gy2-gy1);

  // G boundary
  ctx.strokeStyle = 'rgba(255,159,10,.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6,4]);
  ctx.strokeRect(gx1, gy1, gx2-gx1, gy2-gy1);

  // S boundary
  const [sx1,sy1] = toC(S.x1, S.y1);
  const [sx2,sy2] = toC(S.x2, S.y2);
  ctx.strokeStyle = '#34c759';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(sx1, sy1, sx2-sx1, sy2-sy1);

  // A few intermediate hypotheses in VS
  const intermediates = [
    { x1: S.x1-0.04, y1: S.y1-0.04, x2: S.x2+0.06, y2: S.y2+0.08 },
    { x1: S.x1-0.08, y1: S.y1-0.02, x2: S.x2+0.12, y2: S.y2+0.14 },
    { x1: S.x1-0.02, y1: S.y1-0.09, x2: S.x2+0.18, y2: S.y2+0.04 },
  ];
  intermediates.forEach(b => {
    const [bx1,by1]=toC(b.x1,b.y1), [bx2,by2]=toC(b.x2,b.y2);
    ctx.strokeStyle = 'rgba(168,85,247,.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3,3]);
    ctx.strokeRect(bx1,by1,bx2-bx1,by2-by1);
  });
  ctx.setLineDash([]);

  // Labels
  ctx.font = '11px Space Mono, monospace';
  ctx.fillStyle = '#34c759';
  ctx.fillText('S (spesifik)', sx1+4, sy2+14);
  ctx.fillStyle = '#ff9f0a';
  ctx.fillText('G (umum)', gx1+4, gy1-5);
  ctx.fillStyle = 'rgba(168,85,247,.7)';
  ctx.fillText('Version Space VS', gx1+6, gy1+16);

  // Positive points
  pos.forEach(([nx,ny]) => {
    const [cx,cy] = toC(nx,ny);
    ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2);
    ctx.fillStyle='#2997ff'; ctx.fill();
    ctx.strokeStyle='rgba(41,151,255,.4)'; ctx.lineWidth=2; ctx.stroke();
  });

  // Negative points
  neg.forEach(([nx,ny]) => {
    const [cx,cy] = toC(nx,ny);
    ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fillStyle='#ef4444'; ctx.fill();
    ctx.strokeStyle='rgba(239,68,68,.4)'; ctx.lineWidth=2; ctx.stroke();
  });
})();

/* ── 10. Scroll reveal ───────────────────────────────────────── */
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
    '.lesson-sec, .worked-box, .def-box, .tdef-card, .mz-card, .bt-card, .tc-item, .sf-node'
  ).forEach(el => {
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(12px)';
    io.observe(el);
  });
})();

/* ── 11. Prev / Next section buttons ─────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-vektor':    'Vektor Fitur',
    'sec-hipotesis': 'Hipotesis',
    'sec-model':     'Model & H',
    'sec-parameter': 'Parametrisasi',
    'sec-versi':     'Version Space',
    'sec-bias':      'Induktif Bias',
  };
  secs.forEach((sec, i) => {
    const prev = secs[i - 1], next = secs[i + 1];
    const nav = document.createElement('div');
    nav.className = 'sec-nav-buttons';
    function makeBtn(target, dir) {
      const btn = document.createElement('a');
      btn.className = `sec-nav-btn ${dir}`;
      btn.href = '#' + target.id;
      const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">${dir==='prev'?'<path d="M10 3L5 8l5 5"/>':'<path d="M6 3l5 5-5 5"/>'}</svg>`;
      btn.innerHTML = dir==='prev' ? `${arrow} ${labels[target.id]||'Sebelumnya'}` : `${labels[target.id]||'Berikutnya'} ${arrow}`;
      btn.addEventListener('click', e => { e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); });
      return btn;
    }
    nav.appendChild(prev ? makeBtn(prev,'prev') : document.createElement('span'));
    if (next) nav.appendChild(makeBtn(next,'next'));
    sec.appendChild(nav);
  });
})();
