'use strict';

/* ── Helpers ─────────────────────────────────────────────────── */
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ── 1. Progress / TOC / Sidebar ────────────────────────────── */
(function () {
  const bar = document.getElementById('readBar');
  if (bar) {
    const upd = () => { const d = document.documentElement; bar.style.width = Math.min(100, window.scrollY / (d.scrollHeight - d.clientHeight) * 100) + '%'; };
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }
})();
window.toggleSidebar = () => document.getElementById('lessonSidebar').classList.toggle('open');
document.addEventListener('click', e => {
  const sb = document.getElementById('lessonSidebar'), btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target)) sb.classList.remove('open');
});
(function () {
  const links = document.querySelectorAll('.lnav-item[data-sec]');
  const secs  = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const fill  = document.getElementById('progFill'), pct = document.getElementById('progPct');
  function upd() {
    const y = window.scrollY + 120; let ai = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) ai = i; });
    links.forEach((l, i) => {
      l.classList.toggle('active', i === ai);
      if (i < ai) { l.classList.add('done'); const d = l.querySelector('.lnav-dot'); if (d) d.style.background = '#34c759'; }
    });
    const p = Math.round(ai / Math.max(1, secs.length - 1) * 100);
    if (fill) fill.style.width = p + '%'; if (pct) pct.textContent = p + '%';
  }
  window.addEventListener('scroll', upd, { passive: true }); upd();
})();
document.querySelectorAll('.lnav-item[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});

/* ── 2. Dartboard canvases ───────────────────────────────────── */
(function () {
  const configs = {
    'db-lb':   { bias: 0.04, spread: 0.04, color: '#34c759' },
    'db-hb':   { bias: 0.3,  spread: 0.04, color: '#ff9f0a' },
    'db-hv':   { bias: 0.04, spread: 0.28, color: '#2997ff' },
    'db-hbhv': { bias: 0.28, spread: 0.28, color: '#ef4444' },
  };
  const r = rng(123);

  Object.entries(configs).forEach(([id, cfg]) => {
    const c = document.getElementById(id); if (!c) return;
    const ctx = c.getContext('2d'), W = c.width, H = c.height, cx = W/2, cy = H/2;

    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    // Rings
    [0.45, 0.32, 0.2, 0.1].forEach((r_, i) => {
      ctx.beginPath(); ctx.arc(cx, cy, r_*W, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + i*0.03})`; ctx.lineWidth = 1; ctx.stroke();
    });
    // Crosshair
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx-W*0.4, cy); ctx.lineTo(cx+W*0.4, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy-H*0.4); ctx.lineTo(cx, cy+H*0.4); ctx.stroke();

    // Center target
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();

    // Darts
    const bx = cfg.bias * W, by = cfg.bias * H;
    for (let i = 0; i < 12; i++) {
      const angle = r() * Math.PI * 2, dist = r() * cfg.spread * W;
      const dx = cx + bx + Math.cos(angle) * dist;
      const dy = cy + by + Math.sin(angle) * dist;
      ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI*2);
      ctx.fillStyle = cfg.color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
    }
  });
})();

/* ── 3. Polynomial fit demo ──────────────────────────────────── */
(function () {
  const canvas = document.getElementById('polyCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { t: 20, r: 20, b: 36, l: 44 };
  const CW = W - PAD.l - PAD.r, CH = H - PAD.t - PAD.b;

  const r = rng(77);
  const trueF = x => Math.sin(x * Math.PI * 1.5) * 0.4 + 0.5;
  const TRAIN_X = Array.from({length: 14}, () => r());
  const TRAIN_Y = TRAIN_X.map(x => Math.max(0, Math.min(1, trueF(x) + (r()-0.5)*0.22)));
  const TEST_X  = Array.from({length: 20}, () => r());
  const TEST_Y  = TEST_X.map(x => Math.max(0, Math.min(1, trueF(x) + (r()-0.5)*0.22)));

  function toC(x, y) { return [PAD.l + x * CW, PAD.t + (1-y) * CH]; }

  // Polynomial fit using Vandermonde
  function polyFit(xs, ys, deg) {
    const n = xs.length, m = deg + 1;
    const A = xs.map(x => Array.from({length: m}, (_, k) => Math.pow(x, k)));
    const AT = A[0].map((_, j) => A.map(row => row[j]));
    const ATA = AT.map(r1 => AT.map(r2 => r1.reduce((s, v, i) => s + v*A[i][AT.indexOf(r2)], 0)));
    // Simplified: use least squares via normal equations
    try {
      const ATy = AT.map(r1 => r1.reduce((s, v, i) => s + v*ys[i], 0));
      // Gauss elimination
      const mat = ATA.map((row, i) => [...row, ATy[i]]);
      for (let col = 0; col < m; col++) {
        let pivot = col;
        for (let row = col+1; row < m; row++) if (Math.abs(mat[row][col]) > Math.abs(mat[pivot][col])) pivot = row;
        [mat[col], mat[pivot]] = [mat[pivot], mat[col]];
        if (Math.abs(mat[col][col]) < 1e-10) continue;
        for (let row = 0; row < m; row++) {
          if (row === col) continue;
          const f = mat[row][col] / mat[col][col];
          for (let k = col; k <= m; k++) mat[row][k] -= f * mat[col][k];
        }
      }
      return mat.map((row, i) => row[m] / row[i]);
    } catch(e) { return Array(m).fill(0); }
  }

  function polyEval(coeffs, x) { return coeffs.reduce((s, c, k) => s + c * Math.pow(x, k), 0); }
  function mse(xs, ys, coeffs) { return Math.sqrt(xs.reduce((s, x, i) => s + Math.pow(polyEval(coeffs, x) - ys[i], 2), 0) / xs.length); }

  function draw(deg) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
    [0.25,0.5,0.75].forEach(v => {
      ctx.beginPath(); ctx.moveTo(PAD.l, toC(0,v)[1]); ctx.lineTo(W-PAD.r, toC(0,v)[1]); ctx.stroke();
    });

    // True function
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const x = i/100, [cx2, cy2] = toC(x, trueF(x)); i===0 ? ctx.moveTo(cx2,cy2) : ctx.lineTo(cx2,cy2); }
    ctx.stroke(); ctx.setLineDash([]);

    // Fit
    const coeffs = polyFit(TRAIN_X, TRAIN_Y, deg);
    ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= 200; i++) {
      const x = i/200, y = polyEval(coeffs, x);
      if (y < -0.5 || y > 1.5) { first = true; continue; }
      const [cx2, cy2] = toC(x, Math.max(-0.1, Math.min(1.1, y)));
      first ? ctx.moveTo(cx2, cy2) : ctx.lineTo(cx2, cy2);
      first = false;
    }
    ctx.stroke();

    // Train points
    TRAIN_X.forEach((x, i) => {
      ctx.beginPath(); ctx.arc(...toC(x, TRAIN_Y[i]), 5, 0, Math.PI*2);
      ctx.fillStyle = '#2997ff'; ctx.fill();
    });

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('x', PAD.l + CW/2, H - 4);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.font = '9px Space Mono,monospace';
    ctx.fillText('── fungsi sebenarnya', PAD.l + CW - 10, PAD.t + 12);
    ctx.fillStyle = '#2997ff';
    ctx.fillText('── model (degree ' + deg + ')', PAD.l + CW - 10, PAD.t + 24);

    // Stats
    const trainE = mse(TRAIN_X, TRAIN_Y, coeffs).toFixed(3);
    const testE  = mse(TEST_X,  TEST_Y,  coeffs).toFixed(3);
    document.getElementById('trainErr').textContent = trainE;
    const testEl = document.getElementById('testErr');
    testEl.textContent = testE;
    testEl.style.color = testE > 0.15 ? '#ef4444' : testE > 0.08 ? '#ff9f0a' : '#34c759';
    const status = document.getElementById('fitStatus');
    if (deg <= 2)       { status.textContent = 'Underfitting'; status.style.color = '#ef4444'; }
    else if (deg <= 5)  { status.textContent = 'Good Fit ✓';   status.style.color = '#34c759'; }
    else                { status.textContent = 'Overfitting';  status.style.color = '#ff9f0a'; }
  }

  const sl = document.getElementById('slDegree');
  const vl = document.getElementById('valDegree');
  if (sl) { sl.addEventListener('input', () => { vl.textContent = sl.value; draw(+sl.value); }); draw(1); }
})();

/* ── 4. Decomp viz ───────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('decompCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const TRUE_X = 0.5, TRUE_Y = 0.5;

  const MODES = {
    'low-bias-low-var':   { bias: 0.02, spread: 0.05, label: 'Low Bias + Low Variance — ideal!' },
    'high-bias-low-var':  { bias: 0.22, spread: 0.05, label: 'High Bias — konsisten tapi meleset dari target' },
    'low-bias-high-var':  { bias: 0.02, spread: 0.22, label: 'High Variance — rata-rata tepat tapi tidak stabil' },
    'high-bias-high-var': { bias: 0.2,  spread: 0.2,  label: 'High Bias + High Variance — kasus terburuk' },
  };

  window.setDecompMode = function(mode) {
    document.querySelectorAll('.dv-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    drawDecomp(mode);
  };

  function drawDecomp(mode) {
    const cfg = MODES[mode];
    const r = rng(42);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    const pts = Array.from({length: 80}, () => {
      const angle = r() * Math.PI * 2, dist = r() * cfg.spread;
      return { x: TRUE_X + cfg.bias + Math.cos(angle)*dist, y: TRUE_Y + Math.sin(angle)*dist };
    });

    // Mean prediction
    const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;

    // Draw points (faint)
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x*W, p.y*H, 4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(41,151,255,.25)'; ctx.fill();
    });

    // Bias arrow (true → mean)
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(TRUE_X*W, TRUE_Y*H); ctx.lineTo(mx*W, my*H); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px Space Mono,monospace';
    ctx.fillText('Bias', (TRUE_X + mx)/2*W + 6, (TRUE_Y + my)/2*H - 6);

    // Spread circle (variance)
    const spread = Math.sqrt(pts.reduce((s, p) => s + Math.pow(p.x-mx,2) + Math.pow(p.y-my,2), 0)/pts.length);
    ctx.strokeStyle = 'rgba(41,151,255,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.arc(mx*W, my*H, spread*W*2.2, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2997ff'; ctx.font = 'bold 11px Space Mono,monospace';
    ctx.fillText('Var', mx*W + spread*W*2.2 + 4, my*H);

    // True target
    ctx.beginPath(); ctx.arc(TRUE_X*W, TRUE_Y*H, 10, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(52,199,89,.2)'; ctx.fill();
    ctx.strokeStyle = '#34c759'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(TRUE_X*W, TRUE_Y*H, 10, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#34c759'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', TRUE_X*W, TRUE_Y*H);

    // Mean prediction dot
    ctx.beginPath(); ctx.arc(mx*W, my*H, 7, 0, Math.PI*2);
    ctx.fillStyle = '#2997ff'; ctx.fill();

    const statsEl = document.getElementById('dvStats');
    if (statsEl) statsEl.textContent = `E[ĥ] = (${mx.toFixed(2)}, ${my.toFixed(2)}) | Bias ≈ ${(Math.hypot(mx-TRUE_X, my-TRUE_Y)).toFixed(3)} | Var ≈ ${(spread*spread).toFixed(4)}`;
  }

  drawDecomp('low-bias-low-var');
})();

/* ── 5. Noise / overfitting demo ─────────────────────────────── */
(function () {
  const canvas = document.getElementById('noiseCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { t: 20, r: 20, b: 28, l: 40 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;

  let seed = 99;
  function toC(x, y) { return [PAD.l + x*CW, PAD.t + (1-y)*CH]; }

  function resample() {
    const r = rng(seed++);
    const noise = +document.getElementById('slNoise').value / 100;
    const n     = +document.getElementById('slDataN').value;
    const trueF = x => 0.1 + 0.8*Math.sin(x * Math.PI);
    const xs = Array.from({length: n}, () => r());
    const ys = xs.map(x => Math.max(0, Math.min(1, trueF(x) + (r()-0.5)*2*noise)));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
    [0.25,0.5,0.75].forEach(v => { ctx.beginPath(); ctx.moveTo(PAD.l, toC(0,v)[1]); ctx.lineTo(W-PAD.r, toC(0,v)[1]); ctx.stroke(); });

    // True function
    ctx.strokeStyle = 'rgba(52,199,89,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    ctx.beginPath();
    for(let i=0;i<=100;i++) { const x=i/100; const [cx2,cy2]=toC(x,trueF(x)); i===0?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2); }
    ctx.stroke(); ctx.setLineDash([]);

    // Degree-10 fit
    function polyFit10(xs, ys) {
      const deg = Math.min(10, xs.length - 1);
      const m = deg + 1, A = xs.map(x => Array.from({length:m}, (_,k)=>Math.pow(x,k)));
      const AT = A[0].map((_,j)=>A.map(r=>r[j]));
      const ATA = AT.map(r1=>AT[0].map((_,j)=>r1.reduce((s,v,i)=>s+v*A[i][j],0)));
      const ATy = AT.map(r1=>r1.reduce((s,v,i)=>s+v*ys[i],0));
      const mat = ATA.map((row,i)=>[...row,ATy[i]]);
      for(let col=0;col<m;col++){
        let piv=col;for(let row=col+1;row<m;row++)if(Math.abs(mat[row][col])>Math.abs(mat[piv][col]))piv=row;
        [mat[col],mat[piv]]=[mat[piv],mat[col]];
        if(Math.abs(mat[col][col])<1e-10)continue;
        for(let row=0;row<m;row++){if(row===col)continue;const f=mat[row][col]/mat[col][col];for(let k=col;k<=m;k++)mat[row][k]-=f*mat[col][k];}
      }
      return mat.map((row,i)=>row[m]/row[i]);
    }

    const coeffs = polyFit10(xs, ys);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); let first = true;
    for(let i=0;i<=300;i++){
      const x=i/300, y=coeffs.reduce((s,c,k)=>s+c*Math.pow(x,k),0);
      if(y<-0.3||y>1.3){first=true;continue;}
      const [cx2,cy2]=toC(x,Math.max(-0.1,Math.min(1.1,y)));
      first?ctx.moveTo(cx2,cy2):ctx.lineTo(cx2,cy2); first=false;
    }
    ctx.stroke();

    // Data points
    xs.forEach((x,i) => {
      ctx.beginPath(); ctx.arc(...toC(x,ys[i]), 5, 0, Math.PI*2);
      ctx.fillStyle = '#2997ff'; ctx.fill();
    });

    ctx.fillStyle='rgba(255,255,255,.2)'; ctx.font='9px Space Mono,monospace'; ctx.textAlign='left';
    ctx.fillStyle='rgba(52,199,89,.6)'; ctx.fillText('── fungsi sebenarnya', PAD.l+4, PAD.t+14);
    ctx.fillStyle='rgba(239,68,68,.8)'; ctx.fillText('── degree-10 fit (overfit)', PAD.l+4, PAD.t+26);
  }

  window.resampleNoise = resample;
  document.getElementById('slNoise')?.addEventListener('input', e => { document.getElementById('valNoise').textContent = e.target.value; resample(); });
  document.getElementById('slDataN')?.addEventListener('input', e => { document.getElementById('valDataN').textContent = e.target.value; resample(); });
  resample();
})();

/* ── 6. NFL Canvas ───────────────────────────────────────────── */
(function () {
  const c = document.getElementById('nflCanvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  const hW = W / 2 - 8;
  // Left panel: algo A wins on dist P
  function panel(ox, label, aLabel, bLabel, aGood) {
    ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fillRect(ox, 10, hW, H-20);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; ctx.strokeRect(ox, 10, hW, H-20);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, ox + hW/2, 26);

    const bars = [
      { label: aLabel, val: aGood ? 0.82 : 0.38, color: aGood ? '#34c759' : '#ef4444' },
      { label: bLabel, val: aGood ? 0.38 : 0.82, color: aGood ? '#ef4444' : '#34c759' },
    ];
    bars.forEach(({label: bl, val, color}, i) => {
      const y = 45 + i * 55;
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'left';
      ctx.fillText(bl, ox + 12, y + 14);
      const bw = (hW - 24) * val;
      ctx.fillStyle = color + '33'; ctx.fillRect(ox+12, y+20, bw, 18);
      ctx.fillStyle = color; ctx.fillRect(ox+12, y+20, bw, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Space Mono,monospace'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(val*100)+'%', ox+hW-12, y+33);
    });
  }

  panel(4,       'Distribusi P (gambar)', 'CNN (A)', 'MLP (B)', true);
  panel(hW+12, 'Distribusi Q (tabular)', 'CNN (A)', 'MLP (B)', false);

  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('→ Rata-rata semua distribusi: CNN dan MLP sama bagus ←', W/2, H-6);
})();

/* ── 7. Learning Curves ──────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('lcCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { t: 20, r: 20, b: 40, l: 48 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;

  const scenarios = {
    underfit: {
      train: n => 0.38 + 0.06 * Math.exp(-n*3),
      val:   n => 0.40 + 0.02 * Math.exp(-n*2),
      insight: '<strong>Underfitting:</strong> Training dan validation error keduanya tinggi dan konvergen ke nilai yang sama (≈40%). Menambah data tidak membantu. Masalah ada di model, bukan data — perlu model lebih kompleks.'
    },
    overfit: {
      train: n => 0.02 + 0.08 * Math.exp(-n*5),
      val:   n => 0.32 - 0.15 * (1 - Math.exp(-n*2)),
      insight: '<strong>Overfitting:</strong> Training error rendah sekali, tapi validation error jauh lebih tinggi. Gap ini adalah "generalization gap". Menambah lebih banyak data membantu — validation error turun seiring N naik.'
    },
    good: {
      train: n => 0.08 + 0.12 * Math.exp(-n*4),
      val:   n => 0.13 + 0.10 * Math.exp(-n*3),
      insight: '<strong>Good Fit:</strong> Kedua kurva konvergen ke nilai error yang rendah dengan gap yang kecil. Model sudah optimal — tidak terlalu simple, tidak terlalu kompleks.'
    }
  };

  window.setLC = function(sc) {
    document.querySelectorAll('.lc-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    drawLC(sc);
    document.getElementById('lcInsight').innerHTML = scenarios[sc].insight;
  };

  function drawLC(sc) {
    const s = scenarios[sc];
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

    function toX(n) { return PAD.l + n * CW; }
    function toY(v) { return PAD.t + (1 - Math.min(1, v) / 0.6) * CH; }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    [0.1,0.2,0.3,0.4,0.5].forEach(v => {
      const y = PAD.t + (1 - v/0.6) * CH;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W-PAD.r, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'right';
      ctx.fillText((v*100).toFixed(0)+'%', PAD.l-4, y+4);
    });

    function drawLine(fn, color, dash=[]) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
      ctx.beginPath();
      for(let i=0;i<=100;i++){ const n=i/100; const y=toY(fn(n)); i===0?ctx.moveTo(toX(n),y):ctx.lineTo(toX(n),y); }
      ctx.stroke(); ctx.setLineDash([]);
    }

    drawLine(s.train, '#2997ff', [4,3]);
    drawLine(s.val,   '#ef4444');

    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('Jumlah Data (N) →', PAD.l+CW/2, H-6);
    ctx.fillStyle = '#2997ff'; ctx.textAlign = 'right';
    ctx.fillText('── Training Error', W-PAD.r, PAD.t+14);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('── Validation Error', W-PAD.r, PAD.t+26);
  }

  drawLC('underfit');
})();

/* ── 8. Complexity Curves ────────────────────────────────────── */
(function () {
  const c = document.getElementById('ccCanvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const PAD = { t: 20, r: 20, b: 40, l: 48 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  function toX(t) { return PAD.l + t*CW; }
  function toY(v) { return PAD.t + CH - Math.min(1, Math.max(0, v))*CH; }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
  [0.25,0.5,0.75].forEach(v => {
    ctx.beginPath(); ctx.moveTo(PAD.l, toY(v)); ctx.lineTo(W-PAD.r, toY(v)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(v*100)+'%', PAD.l-4, toY(v)+4);
  });

  const trainFn = t => Math.max(0.01, 0.7*Math.exp(-5*t) + 0.02);
  const valFn   = t => 0.05 + 0.7*Math.pow(t-0.38, 2) + 0.15*Math.exp(-4*t);
  const optT = 0.38;

  function line(fn, color, lw=2, dash=[]) {
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.setLineDash(dash);
    ctx.beginPath(); for(let i=0;i<=100;i++){const t=i/100;i===0?ctx.moveTo(toX(t),toY(fn(t))):ctx.lineTo(toX(t),toY(fn(t)));} ctx.stroke(); ctx.setLineDash([]);
  }

  // Background zones
  ctx.fillStyle = 'rgba(239,68,68,.04)'; ctx.fillRect(PAD.l, PAD.t, CW*0.3, CH);
  ctx.fillStyle = 'rgba(52,199,89,.06)'; ctx.fillRect(PAD.l+CW*0.3, PAD.t, CW*0.2, CH);
  ctx.fillStyle = 'rgba(41,151,255,.04)'; ctx.fillRect(PAD.l+CW*0.5, PAD.t, CW*0.5, CH);

  line(trainFn, '#2997ff', 2, [4,3]);
  line(valFn,   '#ef4444', 2);

  // Optimal marker
  ctx.strokeStyle='#34c759'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(toX(optT), PAD.t); ctx.lineTo(toX(optT), H-PAD.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(toX(optT), toY(valFn(optT)), 7, 0, Math.PI*2);
  ctx.fillStyle='#34c759'; ctx.fill();

  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px Space Mono,monospace'; ctx.textAlign='center';
  ctx.fillText('Kompleksitas Model →', PAD.l+CW/2, H-6);
  ctx.fillStyle='#34c759'; ctx.fillText('★ Optimal', toX(optT), PAD.t-5);
})();

/* ── 9. Regularization canvases ─────────────────────────────── */
(function () {
  function drawL1(id) {
    const c = document.getElementById(id); if(!c) return;
    const ctx = c.getContext('2d'), W = c.width, H = c.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    // Diamond constraint region
    const cx = W*0.55, cy = H*0.5, r = H*0.35;
    ctx.fillStyle = 'rgba(168,85,247,.1)';
    ctx.beginPath(); ctx.moveTo(cx, cy-r); ctx.lineTo(cx+r, cy); ctx.lineTo(cx, cy+r); ctx.lineTo(cx-r, cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(168,85,247,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Loss contours (ellipses)
    [0.6,0.42,0.25].forEach(scale => {
      ctx.strokeStyle = `rgba(255,255,255,${0.05+scale*0.2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(W*0.25, H*0.3, W*scale*0.5, H*scale*0.3, -0.3, 0, Math.PI*2); ctx.stroke();
    });
    // Optimal point (corner of diamond)
    ctx.beginPath(); ctx.arc(cx-r, cy, 5, 0, Math.PI*2); ctx.fillStyle = '#a855f7'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('θᵢ = 0 (sparse!)', cx-r, cy-10);
  }

  function drawL2(id) {
    const c = document.getElementById(id); if(!c) return;
    const ctx = c.getContext('2d'), W = c.width, H = c.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    // Circle constraint
    const cx = W*0.55, cy = H*0.5, r = H*0.35;
    ctx.fillStyle = 'rgba(41,151,255,.1)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(41,151,255,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Loss contours
    [0.6,0.42,0.25].forEach(scale => {
      ctx.strokeStyle = `rgba(255,255,255,${0.05+scale*0.2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(W*0.25, H*0.3, W*scale*0.5, H*scale*0.3, -0.3, 0, Math.PI*2); ctx.stroke();
    });
    // Optimal (on circle, not at corner)
    ctx.beginPath(); ctx.arc(cx-r*0.7, cy-r*0.3, 5, 0, Math.PI*2); ctx.fillStyle = '#2997ff'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('θᵢ kecil, ≠ 0', cx-r*0.7+10, cy-r*0.3-10);
  }

  function drawDropout(id) {
    const c = document.getElementById(id); if(!c) return;
    const ctx = c.getContext('2d'), W = c.width, H = c.height;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    const layers = [[W*0.15,W*0.5,W*0.85], [W*0.15,W*0.38,W*0.62,W*0.85], [W*0.5]];
    const ys = [H*0.2, H*0.55, H*0.85];
    const r = rng(7);
    layers.forEach((lx, li) => {
      lx.forEach((x, ni) => {
        const dead = li === 1 && r() < 0.4;
        ctx.beginPath(); ctx.arc(x, ys[li], 10, 0, Math.PI*2);
        ctx.fillStyle = dead ? 'rgba(239,68,68,.15)' : 'rgba(52,199,89,.2)';
        ctx.strokeStyle = dead ? 'rgba(239,68,68,.4)' : '#34c759'; ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
        if (dead) {
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x-6,ys[li]-6); ctx.lineTo(x+6,ys[li]+6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x+6,ys[li]-6); ctx.lineTo(x-6,ys[li]+6); ctx.stroke();
        }
        if (li < 2) {
          layers[li+1].forEach(nx => {
            if (dead) return;
            ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, ys[li]+10); ctx.lineTo(nx, ys[li+1]-10); ctx.stroke();
          });
        }
      });
    });
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('🔴 = neuron mati (p=0.4)', W/2, H-4);
  }

  drawL1('l1Canvas'); drawL2('l2Canvas'); drawDropout('dropCanvas');
})();

/* ── 10. Ensemble canvas ─────────────────────────────────────── */
(function () {
  const c = document.getElementById('ensembleCanvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
  const PAD = 24;

  // Left: Bagging (parallel)
  const bagW = W*0.45;
  ctx.fillStyle = 'rgba(52,199,89,.06)'; ctx.strokeStyle = 'rgba(52,199,89,.2)'; ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, bagW-PAD, H-PAD*2); ctx.fillRect(PAD, PAD, bagW-PAD, H-PAD*2);
  ctx.fillStyle = '#34c759'; ctx.font = '11px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('BAGGING', PAD+(bagW-PAD)/2, PAD+16);

  const bagModels = [0.25,0.5,0.75];
  bagModels.forEach((y, i) => {
    const mx = PAD+30, my = H*y;
    ctx.fillStyle = 'rgba(52,199,89,.15)'; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#34c759'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#34c759'; ctx.font = 'bold 10px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('M'+(i+1), mx, my);
    ctx.strokeStyle = 'rgba(52,199,89,.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx+14, my); ctx.lineTo(bagW-PAD-30, H/2); ctx.stroke();
  });
  ctx.fillStyle = 'rgba(52,199,89,.25)'; ctx.beginPath(); ctx.arc(bagW-PAD-20, H/2, 16, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#34c759'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AVG', bagW-PAD-20, H/2);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono,monospace'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  ctx.fillText('↓ Variance berkurang', PAD+(bagW-PAD)/2, H-PAD+4);

  // Right: Boosting (sequential)
  const bstX = W*0.55;
  const bstW = W - bstX - PAD;
  ctx.fillStyle = 'rgba(255,159,10,.06)'; ctx.strokeStyle = 'rgba(255,159,10,.2)';
  ctx.strokeRect(bstX, PAD, bstW, H-PAD*2); ctx.fillRect(bstX, PAD, bstW, H-PAD*2);
  ctx.fillStyle = '#ff9f0a'; ctx.font = '11px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('BOOSTING', bstX+bstW/2, PAD+16);

  const bstModels = [0.25,0.5,0.75];
  bstModels.forEach((y, i) => {
    const mx = bstX + 30, my = H*y;
    ctx.fillStyle = 'rgba(255,159,10,.15)'; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ff9f0a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ff9f0a'; ctx.font = 'bold 10px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('h'+(i+1), mx, my);
    if (i < 2) {
      ctx.strokeStyle = 'rgba(255,159,10,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.moveTo(mx, my+14); ctx.lineTo(mx, H*bstModels[i+1]-14); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'left';
      ctx.fillText('fokus pada error', mx+16, (my + H*bstModels[i+1])/2);
    }
  });
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('↓ Bias berkurang', bstX+bstW/2, H-PAD+4);
})();

/* ── 11. Double Descent canvas ───────────────────────────────── */
(function () {
  const c = document.getElementById('ddCanvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const PAD = { t: 24, r: 24, b: 40, l: 52 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  function toX(t) { return PAD.l + t*CW; }
  function toY(v) { return PAD.t + CH - Math.min(1,Math.max(0,v))*CH; }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
  [0.25,0.5,0.75].forEach(v => {
    ctx.beginPath(); ctx.moveTo(PAD.l, toY(v)); ctx.lineTo(W-PAD.r, toY(v)); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.2)'; ctx.font='9px Space Mono,monospace'; ctx.textAlign='right';
    ctx.fillText(Math.round(v*100)+'%', PAD.l-4, toY(v)+4);
  });

  // Classical U-curve
  const classical = t => 0.05 + 0.65*Math.pow(t-0.38,2) + 0.12*Math.exp(-5*t);
  ctx.strokeStyle = 'rgba(255,159,10,.6)'; ctx.lineWidth = 2; ctx.setLineDash([5,4]);
  ctx.beginPath();
  for(let i=0;i<=60;i++){const t=i/100;i===0?ctx.moveTo(toX(t),toY(classical(t))):ctx.lineTo(toX(t),toY(classical(t)));}
  ctx.stroke(); ctx.setLineDash([]);

  // Double descent (modern)
  const modern = t => {
    if (t < 0.38) return 0.05 + 0.55*Math.pow(t-0.38,2) + 0.12*Math.exp(-6*t);
    if (t < 0.52) return 0.04 + 0.9*(t-0.38)/(0.14); // spike at interpolation threshold
    return 0.35 * Math.exp(-3*(t-0.52)) + 0.04 + 0.02*t;
  };
  ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for(let i=0;i<=100;i++){const t=i/100; i===0?ctx.moveTo(toX(t),toY(modern(t))):ctx.lineTo(toX(t),toY(modern(t)));}
  ctx.stroke();

  // Interpolation threshold
  const threshX = toX(0.45);
  ctx.strokeStyle = 'rgba(239,68,68,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(threshX, PAD.t); ctx.lineTo(threshX, H-PAD.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef4444'; ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('Interpolation', threshX, PAD.t-6);
  ctx.fillText('threshold', threshX, PAD.t+4);

  // Zone labels
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('Under-param.', toX(0.22), H-PAD.b+14);
  ctx.fillText('Over-param.', toX(0.72), H-PAD.b+14);
  ctx.fillText('Complexity →', PAD.l+CW/2, H-2);
})();

/* ── 12. Summary canvas ──────────────────────────────────────── */
(function () {
  const c = document.getElementById('summaryCanvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const PAD = { t: 20, r: 20, b: 40, l: 52 };
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);

  function toX(t) { return PAD.l + t*CW; }
  function toY(v) { return PAD.t + CH*(1 - v/0.8); }

  ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
  [0.2,0.4,0.6].forEach(v=>{ctx.beginPath();ctx.moveTo(PAD.l,toY(v));ctx.lineTo(W-PAD.r,toY(v));ctx.stroke();});

  const bias2 = t => Math.pow(0.7*Math.exp(-4*t), 2);
  const variance = t => 0.01 + 0.4*t*t*t;
  const irreducible = () => 0.04;
  const total = t => bias2(t) + variance(t) + irreducible();

  function line(fn, color, lw=2, dash=[]) {
    ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.setLineDash(dash);
    ctx.beginPath();for(let i=0;i<=100;i++){const t=i/100;i===0?ctx.moveTo(toX(t),toY(fn(t))):ctx.lineTo(toX(t),toY(fn(t)));}
    ctx.stroke();ctx.setLineDash([]);
  }

  // Shaded irreducible
  ctx.fillStyle='rgba(110,110,115,.08)';
  ctx.beginPath();ctx.moveTo(PAD.l,toY(0.04));ctx.lineTo(W-PAD.r,toY(0.04));ctx.lineTo(W-PAD.r,toY(0));ctx.lineTo(PAD.l,toY(0));ctx.closePath();ctx.fill();

  line(bias2, '#ef4444', 2, [4,3]);
  line(variance, '#2997ff', 2, [4,3]);
  line(() => irreducible(), '#6e6e73', 1.5, [2,4]);
  line(total, '#a855f7', 2.5);

  // Optimal
  let minT=0,minV=1;for(let i=0;i<=100;i++){const t=i/100,v=total(t);if(v<minV){minV=v;minT=t;}}
  ctx.strokeStyle='#34c759';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(toX(minT),PAD.t);ctx.lineTo(toX(minT),H-PAD.b);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(toX(minT),toY(minV),6,0,Math.PI*2);ctx.fillStyle='#34c759';ctx.fill();

  ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='10px Space Mono,monospace';ctx.textAlign='center';
  ctx.fillText('Kompleksitas Model →', PAD.l+CW/2, H-4);
  ctx.fillStyle='#34c759';ctx.fillText('★ Optimal', toX(minT), PAD.t-5);

  // Legend in corner
  [['#ef4444','Bias²',[4,3]],['#2997ff','Variance',[4,3]],['#6e6e73','Irreducible σ²',[2,4]],['#a855f7','Total EPE',[]]].forEach(([c,l,d],i)=>{
    ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.setLineDash(d);
    ctx.beginPath();ctx.moveTo(W-PAD.r-80,PAD.t+12+i*14);ctx.lineTo(W-PAD.r-56,PAD.t+12+i*14);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='9px Space Mono,monospace';ctx.textAlign='left';
    ctx.fillText(l,W-PAD.r-52,PAD.t+15+i*14);
  });
})();

/* ── 13. Scroll reveal ───────────────────────────────────────── */
(function () {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; io.unobserve(e.target); }
  }), { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('.lesson-sec,.worked-box,.decomp-formula-box,.bv-characteristics,.nfli-card,.rc-card,.ec-col,.ddep,.ds-step')
    .forEach(el => { el.style.transition='opacity .5s ease,transform .5s ease'; el.style.opacity='0'; el.style.transform='translateY(12px)'; io.observe(el); });
})();

/* ── 14. Prev/Next nav ───────────────────────────────────────── */
(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = { 'sec-intuisi':'Intuisi','sec-decomp':'Dekomposisi','sec-highbias':'High Bias','sec-highvar':'High Variance','sec-inductive':'Inductive Bias','sec-nfl':'No Free Lunch','sec-diagnosis':'Diagnosis','sec-mitigasi':'Mitigasi','sec-double':'Double Descent' };
  secs.forEach((sec, i) => {
    const prev=secs[i-1],next=secs[i+1];
    const nav=document.createElement('div'); nav.className='sec-nav-buttons';
    function btn(t,d){const b=document.createElement('a');b.className=`sec-nav-btn ${d}`;b.href='#'+t.id;const arr=`<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">${d==='prev'?'<path d="M10 3L5 8l5 5"/>':'<path d="M6 3l5 5-5 5"/>'}</svg>`;b.innerHTML=d==='prev'?`${arr} ${labels[t.id]}`:`${labels[t.id]} ${arr}`;b.addEventListener('click',e=>{e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});});return b;}
    nav.appendChild(prev?btn(prev,'prev'):document.createElement('span'));
    if(next)nav.appendChild(btn(next,'next'));
    sec.appendChild(nav);
  });
})();
