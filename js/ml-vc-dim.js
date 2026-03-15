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

/* ── 2. Sidebar / TOC ────────────────────────────────────────── */
window.toggleSidebar = function () {
  document.getElementById('lessonSidebar').classList.toggle('open');
};
document.addEventListener('click', e => {
  const sb = document.getElementById('lessonSidebar');
  const btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target)) sb.classList.remove('open');
});
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
document.querySelectorAll('.lnav-item[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});

/* ── 3. Shatter Interactive Demo ─────────────────────────────── */
(function () {
  const canvas = document.getElementById('shatterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Point configs for 2, 3, 4 points
  const CONFIGS = {
    2: [[0.25, 0.5], [0.75, 0.5]],
    3: [[0.25, 0.72], [0.75, 0.72], [0.5, 0.25]],
    4: [[0.22, 0.72], [0.78, 0.72], [0.22, 0.28], [0.78, 0.28]]
  };

  let nPts = 2;
  let currentLabeling = 0;

  function genLabelings(n) {
    const res = [];
    for (let i = 0; i < (1 << n); i++) {
      const lab = [];
      for (let j = 0; j < n; j++) lab.push((i >> j) & 1);
      res.push(lab);
    }
    return res;
  }

  // Check if labeling is linearly separable
  function isSeparable(pts, labels) {
    const pos = pts.filter((_, i) => labels[i] === 1);
    const neg = pts.filter((_, i) => labels[i] === 0);
    if (pos.length === 0 || neg.length === 0) return true;
    // Try many random hyperplanes
    for (let trial = 0; trial < 500; trial++) {
      const angle = (trial / 500) * Math.PI * 2;
      const nx = Math.cos(angle), ny = Math.sin(angle);
      // Find projection range
      const posProj = pos.map(p => p[0]*nx + p[1]*ny);
      const negProj = neg.map(p => p[0]*nx + p[1]*ny);
      const posMax = Math.max(...posProj);
      const negMax = Math.max(...negProj);
      const posMin = Math.min(...posProj);
      const negMin = Math.min(...negProj);
      if (posMin > negMax + 0.001 || negMin > posMax + 0.001) return true;
    }
    return false;
  }

  // Find separator line for drawing
  function findSeparator(pts, labels) {
    const pos = pts.filter((_, i) => labels[i] === 1);
    const neg = pts.filter((_, i) => labels[i] === 0);
    if (pos.length === 0 || neg.length === 0) return null;
    for (let trial = 0; trial < 500; trial++) {
      const angle = (trial / 500) * Math.PI * 2;
      const nx = Math.cos(angle), ny = Math.sin(angle);
      const posProj = pos.map(p => p[0]*nx + p[1]*ny);
      const negProj = neg.map(p => p[0]*nx + p[1]*ny);
      const posMax = Math.max(...posProj);
      const negMax = Math.max(...negProj);
      const posMin = Math.min(...posProj);
      const negMin = Math.min(...negProj);
      if (posMin > negMax + 0.001) {
        const mid = (posMin + negMax) / 2;
        return { nx, ny, mid, angle };
      }
      if (negMin > posMax + 0.001) {
        const mid = (negMin + posMax) / 2;
        return { nx: -nx, ny: -ny, mid: -mid, angle: angle + Math.PI };
      }
    }
    return null;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    const pts = CONFIGS[nPts];
    const labelings = genLabelings(nPts);
    const labels = labelings[currentLabeling] || labelings[0];
    const sep = findSeparator(pts, labels);
    const separable = sep !== null || labels.every(l => l === 1) || labels.every(l => l === 0);

    // Draw separator if found
    if (sep) {
      const { nx, ny, mid } = sep;
      const px = nx * mid, py = ny * mid;
      const tx = -ny, ty = nx;
      ctx.strokeStyle = 'rgba(255,255,255,.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo((px - tx * 2) * W, (py - ty * 2) * H);
      ctx.lineTo((px + tx * 2) * W, (py + ty * 2) * H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw points
    pts.forEach(([nx_, ny_], i) => {
      const x = nx_ * W, y = ny_ * H;
      const isPos = labels[i] === 1;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = isPos ? 'rgba(41,151,255,.15)' : 'rgba(239,68,68,.15)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = isPos ? '#2997ff' : '#ef4444';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isPos ? '+' : '−', x, y);
    });

    // Status
    const statusEl = document.getElementById('shatterStatus');
    const iconEl   = document.getElementById('ssIcon');
    const textEl   = document.getElementById('ssText');
    if (statusEl) {
      if (separable) {
        statusEl.style.background = 'rgba(52,199,89,.2)';
        statusEl.style.border = '1px solid rgba(52,199,89,.4)';
        if (iconEl) { iconEl.textContent = '✓'; iconEl.style.color = '#34c759'; }
        if (textEl) { textEl.textContent = 'Bisa dipisahkan'; textEl.style.color = '#34c759'; }
      } else {
        statusEl.style.background = 'rgba(239,68,68,.2)';
        statusEl.style.border = '1px solid rgba(239,68,68,.4)';
        if (iconEl) { iconEl.textContent = '✗'; iconEl.style.color = '#ef4444'; }
        if (textEl) { textEl.textContent = 'Tidak bisa dipisahkan'; textEl.style.color = '#ef4444'; }
      }
    }
  }

  function buildLabelingBtns() {
    const container = document.getElementById('labelingBtns');
    if (!container) return;
    container.innerHTML = '';
    const pts = CONFIGS[nPts];
    const labelings = genLabelings(nPts);
    labelings.forEach((lab, idx) => {
      const btn = document.createElement('button');
      btn.className = 'sd-lab-btn' + (idx === currentLabeling ? ' active' : '');
      const dots = lab.map(l => `<span class="sd-lab-dot" style="background:${l?'#2997ff':'#ef4444'}"></span>`).join('');
      btn.innerHTML = dots + ` y=(${lab.join(',')})`;
      btn.onclick = () => { currentLabeling = idx; document.querySelectorAll('.sd-lab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); draw(); };
      container.appendChild(btn);
    });
  }

  window.setPoints = function(n) {
    nPts = n;
    currentLabeling = 0;
    document.querySelectorAll('.sd-btn').forEach((b, i) => b.classList.toggle('active', [2,3,4][i] === n));
    buildLabelingBtns();
    draw();
  };

  buildLabelingBtns();
  draw();
})();

/* ── 4. Dimension Examples Mini Canvases ─────────────────────── */
(function () {
  function drawDim(id, fn) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, c.width, c.height);
    fn(ctx, c.width, c.height);
  }

  // ℝ¹ — threshold on number line
  drawDim('de1', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(10, H/2); ctx.lineTo(W-10, H/2); ctx.stroke();
    ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W*0.55, H*0.2); ctx.lineTo(W*0.55, H*0.8); ctx.stroke();
    [[0.25, 1], [0.4, 0], [0.7, 1], [0.85, 0]].forEach(([x, cls]) => {
      ctx.beginPath(); ctx.arc(x*W, H/2, 6, 0, Math.PI*2);
      ctx.fillStyle = cls ? '#2997ff' : '#ef4444'; ctx.fill();
    });
  });

  // ℝ² — line separating 3 points
  drawDim('de2', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(W*0.1, H*0.85); ctx.lineTo(W*0.9, H*0.15); ctx.stroke();
    ctx.setLineDash([]);
    [[0.65, 0.3, 1],[0.8, 0.55, 1],[0.25, 0.6, 0]].forEach(([x,y,cls]) => {
      ctx.beginPath(); ctx.arc(x*W, y*H, 7, 0, Math.PI*2);
      ctx.fillStyle = cls ? '#2997ff' : '#ef4444'; ctx.fill();
    });
  });

  // ℝ³ — 4 points hint
  drawDim('de3', (ctx, W, H) => {
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
    [[0.2,0.3],[0.8,0.3],[0.2,0.7],[0.8,0.7]].forEach(([x1,y1], i, arr) => {
      arr.forEach(([x2,y2], j) => { if (j>i) { ctx.beginPath(); ctx.moveTo(x1*W,y1*H); ctx.lineTo(x2*W,y2*H); ctx.stroke(); } });
    });
    [[0.2,0.3,1],[0.8,0.3,0],[0.2,0.7,0],[0.8,0.7,1]].forEach(([x,y,cls]) => {
      ctx.beginPath(); ctx.arc(x*W, y*H, 7, 0, Math.PI*2);
      ctx.fillStyle = cls ? '#2997ff' : '#ef4444'; ctx.fill();
    });
  });

  // ℝⁿ — formula
  drawDim('den', (ctx, W, H) => {
    ctx.fillStyle = '#2997ff';
    ctx.font = 'bold 20px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('n+1', W/2, H/2);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.font = '11px Space Mono, monospace';
    ctx.fillText('dimensi', W/2, H*0.78);
  });
})();

/* ── 5. Model Compare Canvas ─────────────────────────────────── */
(function () {
  const canvas = document.getElementById('modelCompareCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let currentModel = 'line';

  const MODEL_INFO = {
    line:   { vc: 3, desc: 'Model garis lurus bisa men-shatter 3 titik (semua 8 pelabelan), tapi tidak bisa men-shatter 4 titik karena XOR tidak linearly separable.' },
    rect:   { vc: 4, desc: 'Model persegi panjang axis-aligned punya 4 parameter (x1, x2, y1, y2). Bisa men-shatter 4 titik — satu di setiap sudut persegi panjang.' },
    circle: { vc: 1, desc: 'Lingkaran dengan pusat di asal hanya punya 1 parameter (radius r). Hanya bisa men-shatter 1 titik — sangat terbatas kapasitasnya.' }
  };

  // Data points
  const pts3 = [[0.25, 0.72], [0.75, 0.72], [0.5, 0.25]];
  const pts4 = [[0.22, 0.72], [0.78, 0.72], [0.22, 0.28], [0.78, 0.28]];

  function drawModel(model) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    if (model === 'line') {
      // Show 3 points with separator
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(W*0.08, H*0.9); ctx.lineTo(W*0.92, H*0.1); ctx.stroke();
      ctx.setLineDash([]);
      pts3.forEach(([nx,ny], i) => {
        ctx.beginPath(); ctx.arc(nx*W, ny*H, 12, 0, Math.PI*2);
        ctx.fillStyle = i<2 ? '#2997ff' : '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(i<2?'+':'−', nx*W, ny*H);
      });
      // Show XOR fail
      const xorPts = [[0.58, 0.72],[0.78, 0.52],[0.58, 0.52],[0.78, 0.72]];
      const xorLabs = [1,1,0,0];
      xorPts.forEach(([nx,ny],i) => {
        ctx.beginPath(); ctx.arc(nx*W+80, ny*H-20, 8, 0, Math.PI*2);
        ctx.fillStyle = xorLabs[i] ? 'rgba(41,151,255,.6)' : 'rgba(239,68,68,.6)'; ctx.fill();
      });
      ctx.fillStyle = '#ef4444'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('XOR → tidak bisa!', W*0.82, H*0.88);
    }

    else if (model === 'rect') {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(W*0.18, H*0.22, W*0.64, H*0.56);
      ctx.fillStyle = 'rgba(41,151,255,.06)'; ctx.fillRect(W*0.18, H*0.22, W*0.64, H*0.56);
      pts4.forEach(([nx,ny], i) => {
        const inside = nx > 0.18 && nx < 0.82 && ny > 0.22 && ny < 0.78;
        ctx.beginPath(); ctx.arc(nx*W, ny*H, 12, 0, Math.PI*2);
        ctx.fillStyle = inside ? '#2997ff' : '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(inside?'+':'−', nx*W, ny*H);
      });
    }

    else if (model === 'circle') {
      const cx = W*0.42, cy = H*0.5, r = H*0.28;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(41,151,255,.06)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      [[0.42, 0.5, 1],[0.72, 0.5, 0],[0.42, 0.2, 0],[0.15, 0.5, 0]].forEach(([nx,ny,cls]) => {
        ctx.beginPath(); ctx.arc(nx*W, ny*H, 11, 0, Math.PI*2);
        ctx.fillStyle = cls ? '#2997ff' : '#ef4444'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cls?'+':'−', nx*W, ny*H);
      });
      ctx.fillStyle = '#2997ff'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
      ctx.fillText('VC = 1 (hanya 1 parameter: r)', W*0.05, H*0.93);
    }
  }

  window.selectModel = function(m) {
    currentModel = m;
    document.querySelectorAll('.mc-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    drawModel(m);
    const info = MODEL_INFO[m];
    document.getElementById('mcVcVal').textContent  = info.vc;
    document.getElementById('mcDesc').textContent   = info.desc;
  };

  drawModel('line');
})();

/* ── 6. VC Bound Calculator ──────────────────────────────────── */
(function () {
  const slN   = document.getElementById('slN');
  const slVC  = document.getElementById('slVC');
  const slErr = document.getElementById('slErr');
  if (!slN) return;

  function calcBound(N, vc, empErr) {
    if (N <= vc) return Infinity;
    const conf = Math.sqrt((vc * (Math.log(2*N/vc) + 1) + Math.log(4/0.05)) / N);
    return Math.min(1, empErr/100 + conf);
  }

  function update() {
    const N   = +slN.value;
    const vc  = +slVC.value;
    const err = +slErr.value;
    document.getElementById('valN').textContent   = N;
    document.getElementById('valVC').textContent  = vc;
    document.getElementById('valErr').textContent = err + '%';

    if (N <= vc) {
      document.getElementById('resComplexity').textContent = 'N ≤ VC! Bound tidak valid';
      document.getElementById('resComplexity').style.color = '#ef4444';
      document.getElementById('resTotal').textContent = '∞';
      document.getElementById('resTotal').style.color = '#ef4444';
      return;
    }

    const conf = Math.sqrt((vc * (Math.log(2*N/vc) + 1) + Math.log(4/0.05)) / N);
    const total = Math.min(1, err/100 + conf);
    const confPct = (conf * 100).toFixed(1);
    const totalPct = (total * 100).toFixed(1);

    document.getElementById('resComplexity').textContent = confPct + '%';
    document.getElementById('resComplexity').style.color = conf > 0.3 ? '#ef4444' : conf > 0.1 ? '#ff9f0a' : '#34c759';
    document.getElementById('resEmpErr').textContent = err + '%';
    document.getElementById('resTotal').textContent = totalPct + '%';
    document.getElementById('resTotal').style.color = total > 0.4 ? '#ef4444' : total > 0.2 ? '#ff9f0a' : '#34c759';

    drawBoundChart(N, vc, err);
  }

  function drawBoundChart(N, vc, empErrPct) {
    const canvas = document.getElementById('boundChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PAD = { t: 20, r: 20, b: 36, l: 52 };
    const CW = W - PAD.l - PAD.r;
    const CH = H - PAD.t - PAD.b;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    const maxN = 2000;
    const pts = 200;

    function toX(n) { return PAD.l + (n / maxN) * CW; }
    function toY(v) { return PAD.t + CH - Math.min(1, Math.max(0, v)) * CH; }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(v => {
      ctx.beginPath(); ctx.moveTo(PAD.l, toY(v)); ctx.lineTo(W-PAD.r, toY(v)); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '10px Space Mono, monospace';
      ctx.textAlign = 'right'; ctx.fillText(Math.round(v*100)+'%', PAD.l-4, toY(v)+4);
    });

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono, monospace';
    ctx.textAlign = 'center';
    [200,500,1000,2000].forEach(n => {
      ctx.fillText(n, toX(n), H-PAD.b+14);
    });
    ctx.fillText('N (training examples)', W/2, H-2);

    // Draw lines
    function drawLine(color, fn, dash=[]) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const n = Math.max(vc+1, (i/pts)*maxN);
        const v = fn(n);
        if (i === 0) ctx.moveTo(toX(n), toY(v));
        else ctx.lineTo(toX(n), toY(v));
      }
      ctx.stroke(); ctx.setLineDash([]);
    }

    const empDecay = (n) => Math.max(0.005, (empErrPct/100) * Math.pow(n/N, -0.1));
    const conf     = (n) => n <= vc ? 1 : Math.sqrt((vc*(Math.log(2*n/vc)+1)+Math.log(4/0.05))/n);
    const bound    = (n) => Math.min(1, empDecay(n) + conf(n));
    const trueGen  = (n) => Math.min(1, (empErrPct/100)*1.2 + 0.15*Math.exp(-n/500));

    drawLine('rgba(41,151,255,.8)',   empDecay, [4,3]);
    drawLine('rgba(255,159,10,.8)',   conf,     [4,3]);
    drawLine('rgba(168,85,247,1)',    bound);
    drawLine('rgba(52,199,89,.6)',    trueGen,  [2,4]);

    // Current N marker
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(toX(N), PAD.t); ctx.lineTo(toX(N), H-PAD.b); ctx.stroke();
    ctx.setLineDash([]);
  }

  [slN, slVC, slErr].forEach(s => s.addEventListener('input', update));
  update();
})();

/* ── 7. SRM Canvas ───────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('srmCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { t: 24, r: 24, b: 48, l: 56 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H-PAD.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD.l, H-PAD.b); ctx.lineTo(W-PAD.r, H-PAD.b); ctx.stroke();

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  [0.25,0.5,0.75].forEach(v => {
    const y = PAD.t + CH*(1-v);
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W-PAD.r, y); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.2)'; ctx.font='10px Space Mono,monospace';
    ctx.textAlign='right'; ctx.fillText(Math.round(v*100)+'%', PAD.l-4, y+4);
  });

  const pts = 120;
  function toX(t) { return PAD.l + t * CW; }
  function toY(v) { return PAD.t + CH - Math.min(1, Math.max(0, v)) * CH; }

  // Empirical error — decreasing
  const empFn  = t => Math.max(0.02, 0.7 * Math.exp(-4*t) + 0.03);
  // VC confidence — increasing
  const confFn = t => Math.min(0.95, 0.04 + 0.9 * t * t);
  // Bound = sum
  const boundFn = t => Math.min(0.98, empFn(t) + confFn(t));

  function drawLine(color, fn, lw=2, dash=[]) {
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.setLineDash(dash);
    ctx.beginPath();
    for(let i=0;i<=pts;i++){ const t=i/pts; if(i===0) ctx.moveTo(toX(t),toY(fn(t))); else ctx.lineTo(toX(t),toY(fn(t))); }
    ctx.stroke(); ctx.setLineDash([]);
  }

  drawLine('rgba(41,151,255,.8)',   empFn,  2, [5,3]);
  drawLine('rgba(255,159,10,.8)',   confFn, 2, [5,3]);
  drawLine('rgba(168,85,247,1)',    boundFn,2.5);

  // Find minimum of bound
  let minT = 0, minV = 1;
  for(let i=0;i<=pts;i++){ const t=i/pts; const v=boundFn(t); if(v<minV){minV=v;minT=t;} }

  // Optimal marker
  ctx.strokeStyle='#34c759'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(toX(minT), PAD.t); ctx.lineTo(toX(minT), H-PAD.b); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(toX(minT), toY(minV), 7, 0, Math.PI*2);
  ctx.fillStyle='#34c759'; ctx.fill();
  ctx.strokeStyle='rgba(52,199,89,.4)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(toX(minT), toY(minV), 12, 0, Math.PI*2); ctx.stroke();

  // Labels
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px Space Mono,monospace'; ctx.textAlign='center';
  ctx.fillText('VC(H) / Kapasitas Model →', PAD.l + CW/2, H-8);
  ctx.save(); ctx.translate(14, PAD.t+CH/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('Error', 0, 0); ctx.restore();

  ctx.fillStyle='#34c759'; ctx.font='11px Space Mono,monospace'; ctx.textAlign='center';
  ctx.fillText('H* optimal', toX(minT), PAD.t-6);
})();

/* ── 8. Scroll reveal ────────────────────────────────────────── */
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
    '.lesson-sec, .worked-box, .def-box, .de-item, .vci-card, .srms-step, .ps-part'
  ).forEach(el => {
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(12px)';
    io.observe(el);
  });
})();

/* ── 9. Prev / Next buttons ──────────────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-kapasitas':    'Kapasitas Model',
    'sec-shatter':      'Shatter & VC-Dim',
    'sec-linear':       'VC-Dim Linear',
    'sec-models':       'Berbagai Model',
    'sec-generalisasi': 'VC & Generalisasi',
    'sec-srmvc':        'SRM',
  };
  secs.forEach((sec, i) => {
    const prev = secs[i-1], next = secs[i+1];
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

/* ── Interval proof canvas ───────────────────────────────────── */
(function () {
  const c = document.getElementById('wpIntervalCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  const pts = [{x:0.18,label:1},{x:0.5,label:0},{x:0.82,label:1}];
  const names = ['x₁','x₂','x₃'];

  // Number line
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W*0.08, H*0.42); ctx.lineTo(W*0.92, H*0.42); ctx.stroke();

  // Interval covering x1 and x3 (red — shows the problem)
  ctx.fillStyle = 'rgba(239,68,68,.12)';
  ctx.fillRect(pts[0].x*W - 8, H*0.28, (pts[2].x - pts[0].x)*W + 16, H*0.28);
  ctx.strokeStyle = 'rgba(239,68,68,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  ctx.strokeRect(pts[0].x*W - 8, H*0.28, (pts[2].x - pts[0].x)*W + 16, H*0.28);
  ctx.setLineDash([]);

  ctx.fillStyle = '#ef4444'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('Interval yang mencakup x₁ dan x₃ pasti mencakup x₂ juga!', W*0.5, H*0.15);

  // Points
  pts.forEach(({x,label}, i) => {
    ctx.beginPath(); ctx.arc(x*W, H*0.42, 10, 0, Math.PI*2);
    ctx.fillStyle = label ? '#2997ff' : '#ef4444'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label?'+':'−', x*W, H*0.42);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '11px Space Mono,monospace'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(names[i], x*W, H*0.85);
    ctx.fillStyle = label ? '#2997ff' : '#ef4444'; ctx.font = '10px monospace';
    ctx.fillText('y='+label, x*W, H*0.98);
  });
})();

/* ── Rectangle proof canvas ──────────────────────────────────── */
(function () {
  const c = document.getElementById('wpRectCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  // Show 4 labeling examples (2x2 grid)
  const examples = [
    { pts: [{x:.16,y:.5,l:1},{x:.5,y:.22,l:0},{x:.84,y:.5,l:0},{x:.5,y:.78,l:0}], label: '(1,0,0,0)' },
    { pts: [{x:.16,y:.5,l:1},{x:.5,y:.22,l:1},{x:.84,y:.5,l:0},{x:.5,y:.78,l:0}], label: '(1,1,0,0)' },
    { pts: [{x:.16,y:.5,l:1},{x:.5,y:.22,l:1},{x:.84,y:.5,l:1},{x:.5,y:.78,l:0}], label: '(1,1,1,0)' },
    { pts: [{x:.16,y:.5,l:1},{x:.5,y:.22,l:1},{x:.84,y:.5,l:1},{x:.5,y:.78,l:1}], label: '(1,1,1,1)' },
  ];

  const cellW = W/4;
  examples.forEach(({pts, label}, ei) => {
    const ox = ei * cellW;
    ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fillRect(ox, 0, cellW-2, H);

    const pospts = pts.filter(p=>p.l===1);
    if (pospts.length > 0) {
      const minX = Math.min(...pospts.map(p=>p.x))*cellW + ox - 8;
      const maxX = Math.max(...pospts.map(p=>p.x))*cellW + ox + 8;
      const minY = Math.min(...pospts.map(p=>p.y))*H - 8;
      const maxY = Math.max(...pospts.map(p=>p.y))*H + 8;
      ctx.fillStyle = 'rgba(41,151,255,.08)'; ctx.fillRect(minX, minY, maxX-minX, maxY-minY);
      ctx.strokeStyle = 'rgba(41,151,255,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(minX, minY, maxX-minX, maxY-minY);
    }

    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x*cellW+ox, p.y*H, 8, 0, Math.PI*2);
      ctx.fillStyle = p.l ? '#2997ff' : '#ef4444'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.l?'+':'−', p.x*cellW+ox, p.y*H);
    });

    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, ox+cellW/2, H-3);
  });
})();

/* ── Growth Function Canvas ──────────────────────────────────── */
(function () {
  const c = document.getElementById('growthCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const PAD = { t:16, r:16, b:36, l:56 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  const d = 3; // VC-dim
  const maxN = 20;

  function comb(n, k) {
    if (k > n) return 0; if (k === 0) return 1;
    let r = 1; for (let i = 0; i < k; i++) r = r*(n-i)/(i+1);
    return Math.round(r);
  }
  function sauerBound(n) { let s=0; for(let k=0;k<=d;k++) s+=comb(n,k); return s; }
  function exponential(n) { return Math.pow(2, n); }

  const maxVal = exponential(maxN);

  function toX(n) { return PAD.l + ((n-1)/(maxN-1))*CW; }
  function toY(v) { return PAD.t + CH - Math.log2(Math.min(v,maxVal))/Math.log2(maxVal)*CH; }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
  [4,8,12,16,20].forEach(n => {
    ctx.beginPath(); ctx.moveTo(toX(n), PAD.t); ctx.lineTo(toX(n), H-PAD.b); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.25)'; ctx.font='9px Space Mono,monospace'; ctx.textAlign='center';
    ctx.fillText(n, toX(n), H-PAD.b+12);
  });

  // Exponential line
  ctx.strokeStyle = 'rgba(239,68,68,.7)'; ctx.lineWidth = 2; ctx.setLineDash([5,3]);
  ctx.beginPath();
  for(let n=1;n<=maxN;n++) { if(n===1) ctx.moveTo(toX(n),toY(exponential(n))); else ctx.lineTo(toX(n),toY(exponential(n))); }
  ctx.stroke(); ctx.setLineDash([]);

  // Sauer bound
  ctx.strokeStyle = 'rgba(168,85,247,.9)'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for(let n=1;n<=maxN;n++) { if(n===1) ctx.moveTo(toX(n),toY(sauerBound(n))); else ctx.lineTo(toX(n),toY(sauerBound(n))); }
  ctx.stroke();

  // Breakpoint line at N = VC-dim
  ctx.strokeStyle = '#34c759'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(toX(d), PAD.t); ctx.lineTo(toX(d), H-PAD.b); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#34c759'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('N=d='+d, toX(d), PAD.t-4);

  // Labels
  ctx.font='10px Space Mono,monospace'; ctx.textAlign='right';
  ctx.fillStyle='rgba(239,68,68,.8)'; ctx.fillText('2ᴺ (exponential)', W-PAD.r, PAD.t+14);
  ctx.fillStyle='rgba(168,85,247,.9)'; ctx.fillText('Sauer bound O(Nᵈ)', W-PAD.r, PAD.t+28);

  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.textAlign='center';
  ctx.fillText('N (titik)', PAD.l+CW/2, H-2);
})();