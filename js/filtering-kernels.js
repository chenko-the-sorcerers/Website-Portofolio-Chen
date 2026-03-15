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
    let ai  = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) ai = i; });
    links.forEach((l, i) => {
      l.classList.toggle('active', i === ai);
      if (i < ai) {
        l.classList.add('done');
        const dot = l.querySelector('.lnav-dot');
        if (dot) dot.style.background = '#34c759';
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

/* ═══════════════════════════════════════════════════════════════
   5. CONVOLUTION STEPPER
═══════════════════════════════════════════════════════════════ */
(function () {
  const inputEl  = document.getElementById('convInputGrid');
  const kernelEl = document.getElementById('convKernelGrid');
  const mathEl   = document.getElementById('convMath');
  const outputEl = document.getElementById('convOutputVal');
  const posEl    = document.getElementById('convPosInfo');
  const progEl   = document.getElementById('convProgFill');
  if (!inputEl) return;

  const INPUT = [
    [40,  80, 120, 160, 200],
    [60,  90, 110, 140, 180],
    [50, 100, 130, 150, 170],
    [70,  85, 115, 145, 175],
    [45,  95, 125, 155, 185],
  ];

  const KERNELS = {
    blur:    [[1,1,1],[1,1,1],[1,1,1]],
    sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
    edge:    [[0,1,0],[1,-4,1],[0,1,0]],
    sobelx:  [[-1,0,1],[-2,0,2],[-1,0,1]],
    emboss:  [[-2,-1,0],[-1,1,1],[0,1,2]],
  };

  let currentKernel = 'blur';
  let currentPos    = 0;
  let autoTimer     = null;

  const POSITIONS = [];
  for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) POSITIONS.push([r, c]);

  function getKernelVals() {
    const raw = KERNELS[currentKernel];
    if (currentKernel === 'blur') return raw.map(row => row.map(v => v / 9));
    return raw;
  }

  function renderInput(hR, hC) {
    inputEl.style.gridTemplateColumns = 'repeat(5, 34px)';
    inputEl.innerHTML = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const cell = document.createElement('div');
      cell.className = 'cs-cell';
      const inWin = (r >= hR-1 && r <= hR+1 && c >= hC-1 && c <= hC+1);
      if (inWin) cell.classList.add('highlighted');
      const v = INPUT[r][c];
      cell.style.background = `rgba(${v},${v},${v},0.15)`;
      cell.textContent = v;
      inputEl.appendChild(cell);
    }
  }

  function renderKernel() {
    const kv = getKernelVals();
    kernelEl.style.gridTemplateColumns = 'repeat(3, 34px)';
    kernelEl.innerHTML = '';
    kv.forEach(row => row.forEach(v => {
      const cell = document.createElement('div');
      cell.className = 'cs-cell kernel-cell';
      cell.textContent = Number.isInteger(v) ? v : v.toFixed(2).replace(/\.?0+$/, '');
      kernelEl.appendChild(cell);
    }));
  }

  function renderMath(row, col) {
    const kv = getKernelVals();
    let sum = 0;
    const terms = [];
    for (let kr = 0; kr < 3; kr++) for (let kc = 0; kc < 3; kc++) {
      const pv   = INPUT[row-1+kr][col-1+kc];
      const kVal = kv[kr][kc];
      sum += pv * kVal;
      terms.push(pv + '×' + (kVal % 1 === 0 ? kVal : kVal.toFixed(2)));
    }
    if (mathEl) mathEl.textContent =
      terms.slice(0,3).join(' + ') + '\n+ ' +
      terms.slice(3,6).join(' + ') + '\n+ ' +
      terms.slice(6).join(' + ');
    return Math.round(Math.max(0, Math.min(255, sum)));
  }

  function render() {
    const [row, col] = POSITIONS[currentPos];
    renderInput(row, col);
    renderKernel();
    const result = renderMath(row, col);
    if (outputEl) outputEl.textContent = result;
    if (posEl)    posEl.textContent = 'position (' + row + ', ' + col + ')';
    if (progEl)   progEl.style.width = ((currentPos / (POSITIONS.length-1)) * 100) + '%';
  }

  window.convStep = function(dir) {
    currentPos = Math.max(0, Math.min(POSITIONS.length-1, currentPos + dir));
    render();
  };

  window.convToggleAuto = function() {
    const btn = document.getElementById('convAutoBtn');
    if (autoTimer) {
      clearInterval(autoTimer); autoTimer = null;
      if (btn) btn.textContent = '▶ Auto';
    } else {
      if (btn) btn.textContent = '⏸ Pause';
      autoTimer = setInterval(() => {
        currentPos = (currentPos + 1) % POSITIONS.length;
        render();
      }, 800);
    }
  };

  document.querySelectorAll('.ks-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ks-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentKernel = btn.dataset.k;
      render();
    });
  });

  render();
})();

/* ═══════════════════════════════════════════════════════════════
   6. GAUSSIAN BLUR DEMO
═══════════════════════════════════════════════════════════════ */
(function () {
  const gridEl  = document.getElementById('gaussKernelGrid');
  const curveEl = document.getElementById('gaussCurveCanvas');
  const statsEl = document.getElementById('gaussStats');
  if (!gridEl) return;

  let gaussSize = 3;

  function gaussian1D(size, sigma) {
    const center = Math.floor(size / 2);
    const arr = []; let sum = 0;
    for (let i = 0; i < size; i++) {
      const x = i - center;
      const v = Math.exp(-(x*x) / (2*sigma*sigma));
      arr.push(v); sum += v;
    }
    return arr.map(v => v / sum);
  }

  function buildGrid(size, sigma) {
    const g1 = gaussian1D(size, sigma);
    const g2 = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        g2.push(g1[r] * g1[c]);
    const maxV = Math.max(...g2);
    gridEl.style.gridTemplateColumns = 'repeat(' + size + ', 30px)';
    gridEl.innerHTML = '';
    g2.forEach(v => {
      const cell = document.createElement('div');
      cell.className = 'gauss-cell';
      const intensity = Math.round((v / maxV) * 180);
      cell.style.background = 'rgba(41,151,' + (intensity+75) + ',' + (0.15 + (v/maxV)*0.6) + ')';
      cell.textContent = v.toFixed(3).slice(1);
      gridEl.appendChild(cell);
    });
    return g2;
  }

  function drawCurve(size, sigma) {
    if (!curveEl) return;
    const ctx = curveEl.getContext('2d');
    const W = curveEl.width, H = curveEl.height;
    ctx.clearRect(0, 0, W, H);
    const g1  = gaussian1D(size, sigma);
    const PAD = { l:30, r:10, t:12, b:24 };
    const pW  = W - PAD.l - PAD.r;
    const pH  = H - PAD.t - PAD.b;
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, PAD.t+pH);
    ctx.lineTo(PAD.l+pW, PAD.t+pH); ctx.stroke();
    ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2;
    ctx.shadowColor = '#2997ff'; ctx.shadowBlur = 4;
    ctx.beginPath();
    const maxG = Math.max(...g1);
    g1.forEach((v, i) => {
      const x = PAD.l + (i / (g1.length-1)) * pW;
      const y = PAD.t + (1 - v/maxG) * pH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.shadowBlur = 0;
    g1.forEach((v, i) => {
      const x = PAD.l + (i / (g1.length-1)) * pW;
      const y = PAD.t + (1 - v/maxG) * pH;
      ctx.fillStyle = '#2997ff';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
    g1.forEach((_, i) => {
      const x = PAD.l + (i / (g1.length-1)) * pW;
      ctx.fillText((i - Math.floor(size/2)).toString(), x, PAD.t+pH+13);
    });
  }

  window.setGaussSize = function(btn, size) {
    document.querySelectorAll('.gd-size-btns .gd-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gaussSize = size;
    updateGaussian();
  };

  window.updateGaussian = function() {
    const sigma = parseFloat(document.getElementById('sigmaSlider').value) / 10;
    document.getElementById('sigmaVal').textContent = sigma.toFixed(1);
    const g2 = buildGrid(gaussSize, sigma);
    drawCurve(gaussSize, sigma);
    if (statsEl) {
      const maxW = Math.max(...g2), minW = Math.min(...g2);
      statsEl.innerHTML = 'Center: <span>' + maxW.toFixed(4) + '</span> &nbsp;·&nbsp; Corner: <span>' + minW.toFixed(4) + '</span> &nbsp;·&nbsp; Sum: <span>' + g2.reduce((a,v)=>a+v,0).toFixed(5) + '</span>';
    }
  };

  updateGaussian();
})();

/* ═══════════════════════════════════════════════════════════════
   7. MEDIAN FILTER DEMO
═══════════════════════════════════════════════════════════════ */
(function () {
  const origEl  = document.getElementById('mdOriginal');
  const noisyEl = document.getElementById('mdNoisy');
  const gaussEl = document.getElementById('mdGaussian');
  const medEl   = document.getElementById('mdMedian');
  if (!origEl) return;

  const W = 148, H = 111;
  let medianSize = 3;

  function makeOriginal() {
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = Math.round(40 + 160*(x/W) + 20*Math.sin(y*0.15));
      const g = Math.round(60 + 100*(y/H) + 25*Math.cos(x*0.12));
      const b = Math.round(80 + 120*(1-x/W));
      data[i]   = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
      data[i+3] = 255;
    }
    return data;
  }

  const origData = makeOriginal();
  drawToCanvas(origEl, origData, W, H);

  function addNoise(data, pct) {
    const noisy = new Uint8ClampedArray(data);
    const n = Math.round(W * H * pct / 100);
    for (let k = 0; k < n; k++) {
      const i = Math.floor(Math.random() * W * H) * 4;
      const v = Math.random() > 0.5 ? 255 : 0;
      noisy[i] = noisy[i+1] = noisy[i+2] = v;
    }
    return noisy;
  }

  function gaussianBlur3(data) {
    const k   = [1,2,1,2,4,2,1,2,1];
    const out = new Uint8ClampedArray(data.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, w = 0;
      for (let kr = -1; kr <= 1; kr++) for (let kc = -1; kc <= 1; kc++) {
        const sy = Math.max(0, Math.min(H-1, y+kr));
        const sx = Math.max(0, Math.min(W-1, x+kc));
        const ki = (kr+1)*3 + (kc+1);
        const di = (sy*W+sx)*4;
        r += data[di]*k[ki]; g += data[di+1]*k[ki]; b += data[di+2]*k[ki]; w += k[ki];
      }
      const oi = (y*W+x)*4;
      out[oi]=r/w; out[oi+1]=g/w; out[oi+2]=b/w; out[oi+3]=255;
    }
    return out;
  }

  function medianFilter(data, size) {
    const half = Math.floor(size/2);
    const out  = new Uint8ClampedArray(data.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const rs=[], gs=[], bs=[];
      for (let kr=-half; kr<=half; kr++) for (let kc=-half; kc<=half; kc++) {
        const sy = Math.max(0, Math.min(H-1, y+kr));
        const sx = Math.max(0, Math.min(W-1, x+kc));
        const si = (sy*W+sx)*4;
        rs.push(data[si]); gs.push(data[si+1]); bs.push(data[si+2]);
      }
      const oi = (y*W+x)*4;
      out[oi]=med(rs); out[oi+1]=med(gs); out[oi+2]=med(bs); out[oi+3]=255;
    }
    return out;
  }

  function med(arr) {
    const s = arr.slice().sort((a,b)=>a-b);
    return s[Math.floor(s.length/2)];
  }

  function countSpikes(data) {
    let n = 0;
    for (let i = 0; i < data.length; i+=4)
      if (data[i]===0 || data[i]===255) n++;
    return n;
  }

  function drawToCanvas(canvas, data, w, h) {
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  }

  window.setMedianSize = function(btn, size) {
    document.querySelectorAll('.gd-size-btns .gd-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    medianSize = size;
    updateMedianDemo();
  };

  window.updateMedianDemo = function() {
    const pct = parseInt(document.getElementById('noiseSlider').value);
    document.getElementById('noiseVal').textContent = pct;
    const noisy    = addNoise(origData, pct);
    const gaussed  = gaussianBlur3(noisy);
    const medianed = medianFilter(noisy, medianSize);
    drawToCanvas(noisyEl, noisy,    W, H);
    drawToCanvas(gaussEl, gaussed,  W, H);
    drawToCanvas(medEl,   medianed, W, H);
    const statsEl = document.getElementById('mdStatsRow');
    if (statsEl) {
      statsEl.innerHTML =
        'Spikes — Noisy: <span>' + countSpikes(noisy) +
        '</span> &nbsp;·&nbsp; Gaussian: <span>' + countSpikes(gaussed) +
        '</span> &nbsp;·&nbsp; Median: <span>' + countSpikes(medianed) + '</span>';
    }
  };

  updateMedianDemo();
})();

/* ═══════════════════════════════════════════════════════════════
   8. UNSHARP MASKING DEMO
═══════════════════════════════════════════════════════════════ */
(function () {
  const origEl  = document.getElementById('udOriginal');
  const maskEl  = document.getElementById('udMask');
  const sharpEl = document.getElementById('udSharpened');
  if (!origEl) return;

  const W = 148, H = 111;

  function makeBase() {
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y*W+x)*4;
      const inR1 = (x>18 && x<58  && y>14 && y<54);
      const inR2 = (x>78 && x<128 && y>54 && y<94);
      let v = Math.round(80 + 60*(x/W) + 20*Math.sin(y*0.1));
      if (inR1) v = Math.min(255, v+80);
      if (inR2) v = Math.max(0,   v-40);
      data[i] = data[i+1] = data[i+2] = Math.min(255, Math.max(0, v));
      data[i+3] = 255;
    }
    return data;
  }

  function gaussBlur(data, sigma) {
    const size = Math.max(3, Math.min(15, Math.round(sigma*3)*2+1));
    const half = Math.floor(size/2);
    const k1d  = []; let ksum = 0;
    for (let i = 0; i < size; i++) {
      const x = i-half;
      const v = Math.exp(-(x*x)/(2*sigma*sigma));
      k1d.push(v); ksum += v;
    }
    k1d.forEach((_,i) => k1d[i] /= ksum);
    const tmp = new Float32Array(W*H);
    const out = new Uint8ClampedArray(data.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      k1d.forEach((kv, ki) => {
        const sx = Math.max(0, Math.min(W-1, x+ki-half));
        s += data[(y*W+sx)*4] * kv;
      });
      tmp[y*W+x] = s;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      k1d.forEach((kv, ki) => {
        const sy = Math.max(0, Math.min(H-1, y+ki-half));
        s += tmp[sy*W+x] * kv;
      });
      const i = (y*W+x)*4;
      out[i]=out[i+1]=out[i+2]=Math.max(0,Math.min(255,s)); out[i+3]=255;
    }
    return out;
  }

  function drawC(canvas, data) {
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), W, H), 0, 0);
  }

  const baseData = makeBase();
  drawC(origEl, baseData);

  window.updateUnsharp = function() {
    const sigma  = parseFloat(document.getElementById('unsharpSigma').value) / 10;
    const amount = parseFloat(document.getElementById('unsharpAmount').value) / 10;
    document.getElementById('unsharpSigmaVal').textContent  = sigma.toFixed(1);
    document.getElementById('unsharpAmountVal').textContent = amount.toFixed(1);
    const blurred = gaussBlur(baseData, sigma);
    const maskData  = new Uint8ClampedArray(W*H*4);
    const sharpData = new Uint8ClampedArray(W*H*4);
    for (let i = 0; i < baseData.length; i+=4) {
      const diff = baseData[i] - blurred[i];
      maskData[i] = maskData[i+1] = maskData[i+2] = Math.max(0, Math.min(255, 128 + diff*2));
      maskData[i+3] = 255;
      sharpData[i] = sharpData[i+1] = sharpData[i+2] = Math.max(0, Math.min(255, baseData[i] + amount*diff));
      sharpData[i+3] = 255;
    }
    drawC(maskEl,  maskData);
    drawC(sharpEl, sharpData);
  };

  updateUnsharp();
})();

/* ═══════════════════════════════════════════════════════════════
   9. OTSU DEMO
═══════════════════════════════════════════════════════════════ */
(function () {
  const histCanvas = document.getElementById('otsuHistCanvas');
  if (!histCanvas) return;

  const W = 116, H = 87;
  let currentScene = 'bimodal';

  const SCENES = {
    bimodal: () => {
      const p = new Array(256).fill(0);
      for (let i = 0; i < 256; i++) {
        p[i] += Math.exp(-0.5*((i-60)/20)**2) * 3000;
        p[i] += Math.exp(-0.5*((i-180)/25)**2) * 2000;
      }
      return p;
    },
    skewed: () => {
      const p = new Array(256).fill(0);
      for (let i = 0; i < 256; i++) {
        p[i] = Math.exp(-0.5*((i-80)/40)**2)*4000 + Math.exp(-0.5*((i-190)/15)**2)*800;
      }
      return p;
    },
    flat: () => {
      const p = new Array(256).fill(0);
      for (let i = 0; i < 256; i++) {
        p[i] = 200 + 100*Math.sin(i*0.1);
        if (i>110 && i<150) p[i] += 600;
      }
      return p;
    },
  };

  function computeOtsu(hist) {
    const total = hist.reduce((a,v)=>a+v, 0);
    const p     = hist.map(v=>v/total);
    let bestT = 0, bestVar = 0;
    for (let t = 1; t < 255; t++) {
      const w0 = p.slice(0,t).reduce((a,v)=>a+v, 0);
      const w1 = 1 - w0;
      if (w0===0 || w1===0) continue;
      const mu0 = p.slice(0,t).reduce((a,v,i)=>a+v*i, 0) / w0;
      const mu1 = p.slice(t).reduce((a,v,i)=>a+v*(i+t), 0) / w1;
      const bv  = w0*w1*(mu0-mu1)**2;
      if (bv>bestVar) { bestVar=bv; bestT=t; }
    }
    return { t: bestT, score: bestVar };
  }

  function computeManualScore(hist, t) {
    const total = hist.reduce((a,v)=>a+v, 0);
    const p     = hist.map(v=>v/total);
    const w0    = p.slice(0,t).reduce((a,v)=>a+v, 0);
    const w1    = 1 - w0;
    if (w0===0 || w1===0) return 0;
    const mu0 = p.slice(0,t).reduce((a,v,i)=>a+v*i, 0) / w0;
    const mu1 = p.slice(t).reduce((a,v,i)=>a+v*(i+t), 0) / w1;
    return w0*w1*(mu0-mu1)**2;
  }

  function drawHist(hist, otsuT, manT) {
    const ctx  = histCanvas.getContext('2d');
    const CW   = histCanvas.width, CH = histCanvas.height;
    ctx.clearRect(0, 0, CW, CH);
    const maxV = Math.max(...hist);
    const PAD  = { l:4, r:4, t:8, b:18 };
    const pW   = CW - PAD.l - PAD.r;
    const pH   = CH - PAD.t - PAD.b;
    ctx.fillStyle = 'rgba(255,255,255,.02)';
    ctx.fillRect(PAD.l, PAD.t, pW, pH);
    hist.forEach((v, i) => {
      const x  = PAD.l + (i/255)*pW;
      const bh = (v/maxV)*pH;
      ctx.fillStyle = (i < Math.min(otsuT,manT) ? '#2997ff' : i < Math.max(otsuT,manT) ? '#ff9f0a' : '#a855f7') + '80';
      ctx.fillRect(Math.floor(x), PAD.t+pH-bh, Math.ceil(pW/256)+1, bh);
    });
    // Otsu line
    const ox = PAD.l + (otsuT/255)*pW;
    ctx.strokeStyle='#34c759'; ctx.lineWidth=2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox,PAD.t); ctx.lineTo(ox,PAD.t+pH); ctx.stroke();
    ctx.fillStyle='#34c759'; ctx.font='9px Space Mono,monospace'; ctx.textAlign='left';
    ctx.fillText('Otsu='+otsuT, ox+3, PAD.t+10);
    // Manual line
    const mx = PAD.l + (manT/255)*pW;
    ctx.strokeStyle='#ff9f0a'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(mx,PAD.t); ctx.lineTo(mx,PAD.t+pH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#ff9f0a'; ctx.fillText('T='+manT, mx+3, PAD.t+22);
    // Axis
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD.l,PAD.t+pH); ctx.lineTo(PAD.l+pW,PAD.t+pH); ctx.stroke();
  }

  function makeSceneImage(hist) {
    const data  = new Uint8ClampedArray(W*H*4);
    const total = hist.reduce((a,v)=>a+v, 0);
    const cdf   = [];
    let acc     = 0;
    hist.forEach((v,i) => { acc+=v; cdf[i]=acc/total; });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t   = x/W;
      let val   = 0;
      for (let i = 0; i < 256; i++) { if (cdf[i]>=t) { val=i; break; } }
      val = Math.round(val*0.7 + (y/H*80 + x/W*60)*0.3);
      val = Math.max(0, Math.min(255, val));
      const pi = (y*W+x)*4;
      data[pi]=data[pi+1]=data[pi+2]=val; data[pi+3]=255;
    }
    return data;
  }

  function applyThreshold(data, t) {
    const out = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i+=4) {
      const v = data[i]>=t ? 255 : 0;
      out[i]=out[i+1]=out[i+2]=v; out[i+3]=255;
    }
    return out;
  }

  function drawC(id, data) {
    const c = document.getElementById(id);
    if (!c) return;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), W, H), 0, 0);
  }

  function renderAll() {
    const hist   = SCENES[currentScene]();
    const manT   = parseInt(document.getElementById('manualThresh').value);
    const { t: otsuT, score: otsuScore } = computeOtsu(hist);
    const manScore = computeManualScore(hist, manT);
    drawHist(hist, otsuT, manT);
    document.getElementById('manualThreshVal').textContent    = manT;
    document.getElementById('otsuThreshDisplay').textContent  = otsuT;
    document.getElementById('otsuScoreDisplay').textContent   = otsuScore.toFixed(6);
    document.getElementById('manualScoreDisplay').textContent = manScore.toFixed(6);
    const imgData = makeSceneImage(hist);
    drawC('otsuImgOrig',   imgData);
    drawC('otsuImgOtsu',   applyThreshold(imgData, otsuT));
    drawC('otsuImgManual', applyThreshold(imgData, manT));
  }

  window.setOtsuScene = function(btn, scene) {
    document.querySelectorAll('.otsu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScene = scene;
    renderAll();
  };

  window.updateOtsu = function() { renderAll(); };
  renderAll();
})();

/* ═══════════════════════════════════════════════════════════════
   10. PYODIDE
═══════════════════════════════════════════════════════════════ */
let pyodideInstance = null;

async function initPyodide() {
  try {
    const py = await loadPyodide();
    await py.loadPackage('numpy');
    pyodideInstance = py;
    const overlay = document.getElementById('pyLoading');
    if (overlay) overlay.style.display = 'none';
    const st = document.getElementById('pyStatus');
    if (st) { st.textContent = '✅ Python ready'; st.className = 'py-status ready'; }
    const dot = document.getElementById('pgReadyDot');
    if (dot) dot.style.background = '#34c759';
  } catch (err) {
    const overlay = document.getElementById('pyLoading');
    if (overlay) overlay.style.display = 'none';
    const st = document.getElementById('pyStatus');
    if (st) { st.textContent = '❌ Python failed'; st.className = 'py-status error'; }
    console.error('Pyodide failed:', err);
  }
}
initPyodide();

async function runCode(code, outPre, checkEl, checkFn) {
  if (!pyodideInstance) {
    if (outPre) { outPre.textContent = 'Python runtime not ready yet…'; outPre.closest('.output-wrap').style.display = 'block'; }
    return;
  }
  const btn = event && event.currentTarget;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Running…'; }
  try {
    let stdout = '';
    pyodideInstance.setStdout({ batched: (s) => { stdout += s + '\n'; } });
    await pyodideInstance.runPythonAsync(code);
    if (outPre) {
      outPre.textContent = stdout || '(no output)';
      outPre.closest('.output-wrap').style.display = 'block';
    }
    if (checkEl && checkFn) {
      const result = checkFn(stdout.trim());
      checkEl.textContent = result.msg;
      checkEl.className   = 'check-result show ' + (result.pass ? 'pass' : 'fail');
    }
  } catch (err) {
    if (outPre) {
      outPre.textContent = '❌ ' + err.message;
      outPre.closest('.output-wrap').style.display = 'block';
    }
  }
  if (btn) { btn.disabled = false; btn.textContent = '▶ Run'; }
}

/* ── Challenge runner ────────────────────────────────────────── */
window.runChallenge = async function(edId, outId, checkId) {
  const code  = document.getElementById(edId).value;
  const outEl = document.getElementById(outId + '-pre');
  const chkEl = document.getElementById(checkId);

  const checks = {
    'check-1': o => {
      const pass = o.includes('130.0') && o.includes('True');
      return { pass, msg: pass ? '✅ Correct! Box blur = mean of 3×3 neighborhood = 130.0.' : '❌ kernel=np.ones((3,3))/9, neighborhood=patch[1:4,1:4], result should be 130.0.' };
    },
    'check-2': o => {
      const p = o.includes('1.0') && o.includes('(5, 5)');
      return { pass: p, msg: p ? '✅ Correct! 2D kernel (5,5) sums to 1.0, center > corner.' : '❌ gaussian_1d(5, sigma), g2=np.outer(g1,g1). Shape=(5,5), sum=1.0.' };
    },
    'check-3': o => {
      const pass = o.includes('after: 0') && o.includes('True');
      return { pass, msg: pass ? '✅ Correct! All 3 spikes removed.' : '❌ neighborhood=padded[i:i+3], result[i]=np.median(neighborhood). After: spikes=0.' };
    },
    'check-4': o => {
      const pass = o.includes('True');
      return { pass, msg: pass ? '✅ Correct! Unsharp mask amplified edge contrast.' : '❌ mask=signal-blurred, sharpened=signal+amount*mask, clip to [0,255].' };
    },
    'check-5': o => {
      const pass = o.includes('True');
      return { pass, msg: pass ? '✅ Correct! Otsu threshold between the two peaks.' : '❌ w1=1-w0, mu1=(ix[t:]*p[t:]).sum()/w1, between_var=w0*w1*(mu0-mu1)**2.' };
    },
    'cq-1-check': o => {
      const pass = o.includes('1.0') && o.includes('100.0') && o.includes('True');
      return { pass, msg: pass ? '✅ Fixed! kernel /= kernel.sum() normalizes to sum=1.' : '❌ Add: kernel /= kernel.sum(). Sum should be 1.0, output 100.0.' };
    },
    'cq-2-check': o => {
      const pass = o.includes('Spikes after median: 0') && o.includes('True');
      return { pass, msg: pass ? '✅ Correct! Median removed spikes, sharpening worked.' : '❌ mask=denoised-blurred, sharpened=denoised+amount*mask.' };
    },
    'cq-3-check': o => {
      const pass = o.includes('T between peaks: True') && o.includes('%');
      return { pass, msg: pass ? '✅ Complete pipeline! Otsu threshold correct, foreground classified.' : '❌ w1=1-w0, mu1=(ix[t:]*ph[t:]).sum()/w1, binary=(denoised>=best_t)*255.' };
    },
  };

  await runCode(code, outEl, chkEl, checks[checkId]);
  checkFinalScore();
};

window.toggleHint = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.resetChallenge = function(edId, num) {
  const defaults = {
    1: `import numpy as np\n\npatch = np.array([\n    [ 10,  20,  30,  40,  50],\n    [ 60,  70,  80,  90, 100],\n    [110, 120, 130, 140, 150],\n    [160, 170, 180, 190, 200],\n    [210, 220, 230, 240, 250],\n], dtype=np.float32)\n\nkernel = np.ones((___, ___), dtype=np.float32) / ___\nneighborhood = patch[___:___, ___:___]\nresult = np.sum(neighborhood * kernel)\nprint("Convolution output:", round(result, 2))\nexpected = np.mean(patch[1:4, 1:4])\nprint("Mean of 3x3 center:", round(expected, 2))\nprint("Match:", abs(result - expected) < 0.001)`,
    2: `import numpy as np\n\ndef gaussian_1d(size, sigma):\n    center = size // 2\n    x = np.arange(size) - center\n    g = np.exp(-x**2 / (2 * sigma**2))\n    return g / g.sum()\n\nsigma = 1.0\ng1 = gaussian_1d(___, sigma)\nprint("1D kernel:", np.round(g1, 4).tolist())\nprint("1D sum:", round(g1.sum(), 6))\ng2 = np.outer(___, ___)\nprint("2D shape:", g2.shape)\nprint("2D sum:", round(g2.sum(), 6))\nprint("Center weight:", round(g2[2,2], 4))\nprint("Corner weight:", round(g2[0,0], 4))`,
    3: `import numpy as np\n\nsignal = np.array([80, 82, 255, 85, 83, 0, 88, 90, 87, 255, 84], dtype=np.float32)\nprint("Noisy: ", signal.astype(int).tolist())\n\ndef median_filter_1d(sig, window=3):\n    pad = window // 2\n    padded = np.pad(sig, pad, mode='edge')\n    result = np.zeros_like(sig)\n    for i in range(len(sig)):\n        neighborhood = padded[___:___]\n        result[i] = np.___(___)\n    return result\n\nfiltered = median_filter_1d(signal)\nprint("Filtered:", filtered.astype(int).tolist())\nspikes_before = int(np.sum((signal == 0) | (signal == 255)))\nspikes_after  = int(np.sum((filtered == 0) | (filtered == 255)))\nprint(f"Spikes before: {spikes_before}, after: {spikes_after}")\nprint("All spikes removed:", spikes_after == 0)`,
    4: `import numpy as np\n\nsignal = np.array([50, 50, 52, 50, 100, 150, 150, 148, 150, 150], dtype=np.float32)\n\ndef box_blur_1d(s, k=3):\n    padded = np.pad(s, k//2, mode='edge')\n    return np.array([padded[i:i+k].mean() for i in range(len(s))])\n\nblurred = box_blur_1d(signal)\nprint("Original:", signal.astype(int).tolist())\nprint("Blurred: ", blurred.round(1).tolist())\n\nmask = ___ - ___\namount = 1.5\nsharpened = ___ + ___ * ___\nsharpened = np.clip(sharpened, ___, ___)\nprint("Sharpened:", sharpened.astype(int).tolist())\nprint("Edge amplified:", sharpened[4] <= signal[4] and sharpened[5] >= signal[5])`,
    5: `import numpy as np\n\nnp.random.seed(0)\ndark   = np.random.normal(60,  15, 3000).clip(0,255).astype(np.uint8)\nbright = np.random.normal(180, 20, 2000).clip(0,255).astype(np.uint8)\npixels = np.concatenate([dark, bright])\n\nhist, _ = np.histogram(pixels, bins=256, range=(0, 256))\np = hist / hist.sum()\nbest_t = 0; best_var = 0.0\n\nfor t in range(1, 256):\n    w0 = p[:t].sum()\n    w1 = ___\n    if w0 == 0 or w1 == 0: continue\n    ix  = np.arange(256)\n    mu0 = (ix[:t] * p[:t]).sum() / w0\n    mu1 = ___\n    between_var = ___ * ___ * (mu0 - mu1)**2\n    if between_var > best_var:\n        best_var = between_var; best_t = t\n\nprint(f"Otsu threshold: {best_t}")\nprint(f"Dark mean:  {dark.mean():.1f}")\nprint(f"Bright mean:{bright.mean():.1f}")\nprint(f"T between peaks: {float(dark.mean()) < best_t < float(bright.mean())}")`,
  };
  if (defaults[num]) document.getElementById(edId).value = defaults[num];
};

/* ── Quiz data ───────────────────────────────────────────────── */
const quizData = [
  {
    q: 'A box blur kernel np.ones((3,3)) applied to a flat image (all pixels=100) returns 900 per pixel. What is wrong?',
    opts: ['Nothing — 900 is correct', 'The kernel needs normalization: divide by 9', 'The kernel size must be (5,5)', 'filter2D rounds automatically'],
    correct: 1,
    fb: 'Box blur sums 9 pixels × weight 1 = 900. The kernel must be np.ones((3,3))/9 so weights sum to 1 and brightness is preserved.'
  },
  {
    q: 'Your image has 5% salt-and-pepper noise (random 0s and 255s). Which filter removes it best?',
    opts: ['cv2.GaussianBlur(img, (5,5), 1.5)', 'cv2.medianBlur(img, 5)', 'cv2.filter2D(img, -1, sharpen_kernel)', 'cv2.bilateralFilter(img, 9, 75, 75)'],
    correct: 1,
    fb: 'Median filter is specifically designed for salt-and-pepper noise. It sorts the neighborhood and picks the middle value — a spike (0 or 255) is sorted to an extreme end and never reaches the output.'
  },
  {
    q: 'You call cv2.GaussianBlur(img, (6,6), 1.0). What happens?',
    opts: ['It blurs normally', 'OpenCV raises an error — kernel size must be odd', 'It auto-rounds to (5,5)', 'It only blurs borders'],
    correct: 1,
    fb: 'GaussianBlur requires odd kernel dimensions (3,3), (5,5), (7,7)... Even dimensions cause an OpenCV error. Use (0,0) to let OpenCV auto-compute the size from sigma.'
  },
  {
    q: 'Otsu returns T=127. What does this mean?',
    opts: ['Equal amounts of dark and bright pixels', 'T=127 minimizes intra-class variance — best separates foreground from background', 'The histogram is perfectly flat', 'You should use T=128 for better results'],
    correct: 1,
    fb: 'Otsu finds T that minimizes intra-class variance (equivalent to maximizing between-class variance). It is the threshold that best separates the two clusters in the histogram.'
  },
  {
    q: 'You apply unsharp masking with amount=3.0 and see halos around edges. What should you do?',
    opts: ['Increase sigma further', 'Reduce amount to 0.5–1.5', 'Switch to median filter first', 'Convert to grayscale first'],
    correct: 1,
    fb: 'Halos are over-amplification of the detail mask. Amount > 2.0 is too strong. Safe range: sigma=1–2, amount=0.5–1.5. Reduce amount to eliminate halos.'
  }
];

let quizScore = 0;
const quizAnswered = {};

(function buildQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  quizData.forEach((q, qi) => {
    const div = document.createElement('div');
    div.className = 'quiz-item';
    div.innerHTML =
      '<div class="quiz-q-num">Question ' + (qi+1) + ' of ' + quizData.length + '</div>' +
      '<div class="quiz-q-text">' + q.q + '</div>' +
      '<div class="quiz-opts">' +
      q.opts.map((o, oi) =>
        '<button class="quiz-opt" onclick="answerQuiz(' + qi + ',' + oi + ')" id="qopt-' + qi + '-' + oi + '">' +
        '<span class="quiz-opt-badge">' + String.fromCharCode(65+oi) + '</span>' + o + '</button>'
      ).join('') + '</div>' +
      '<div class="quiz-feedback" id="qfb-' + qi + '"></div>';
    container.appendChild(div);
  });
})();

window.answerQuiz = function(qi, oi) {
  if (quizAnswered[qi]) return;
  quizAnswered[qi] = true;
  const q   = quizData[qi];
  const fb  = document.getElementById('qfb-' + qi);
  const all = document.querySelectorAll('[id^="qopt-' + qi + '-"]');
  all.forEach(btn => { btn.disabled = true; });
  const correct = oi === q.correct;
  if (correct) quizScore++;
  document.getElementById('qopt-' + qi + '-' + oi).classList.add(correct ? 'correct' : 'wrong');
  document.getElementById('qopt-' + qi + '-' + q.correct).classList.add('correct');
  all.forEach((btn, i) => { if (i!==oi && i!==q.correct) btn.classList.add('muted'); });
  if (fb) { fb.textContent = (correct ? '✅ ' : '❌ ') + q.fb; fb.className = 'quiz-feedback show ' + (correct ? 'ok' : 'bad'); }
  checkFinalScore();
};

function checkFinalScore() {
  const totalQ   = quizData.length;
  const answered = Object.keys(quizAnswered).length;
  const cq1Done  = document.getElementById('cq-1-check')?.classList.contains('show');
  const cq2Done  = document.getElementById('cq-2-check')?.classList.contains('show');
  const cq3Done  = document.getElementById('cq-3-check')?.classList.contains('show');
  if (answered < totalQ || !cq1Done || !cq2Done || !cq3Done) return;

  const codingScore = [
    document.getElementById('cq-1-check')?.classList.contains('pass'),
    document.getElementById('cq-2-check')?.classList.contains('pass'),
    document.getElementById('cq-3-check')?.classList.contains('pass'),
  ].filter(Boolean).length;

  const total = quizScore + codingScore;
  const max   = totalQ + 3;
  const fsEl  = document.getElementById('finalScore');
  const nlEl  = document.getElementById('nextLesson');

  if (fsEl) {
    fsEl.style.display = 'block';
    document.getElementById('fsScores').innerHTML =
      '<div class="fs-score-item"><div class="fs-score-num">' + quizScore + '/' + totalQ + '</div><div class="fs-score-lbl">Theory</div></div>' +
      '<div class="fs-score-divider"></div>' +
      '<div class="fs-score-item"><div class="fs-score-num">' + codingScore + '/3</div><div class="fs-score-lbl">Coding</div></div>' +
      '<div class="fs-score-divider"></div>' +
      '<div class="fs-score-item"><div class="fs-score-num">' + total + '/' + max + '</div><div class="fs-score-lbl">Total</div></div>';
    const pct = Math.round((total/max)*100);
    document.getElementById('fsMsg').textContent = pct>=80
      ? '🎉 Excellent! You\'ve mastered filtering & kernels. Ready for Morphological Transforms!'
      : pct>=60 ? '👍 Good work! Review the incorrect answers before moving on.'
      : '💪 Keep practicing! Re-read the sections and try the challenges again.';
  }
  if (nlEl && total >= Math.ceil(max*0.6)) nlEl.style.display = 'block';
}

/* ── Coding quiz resets ─────────────────────────────────────── */
const cqDefaults = {
  1: `import numpy as np\n\n# BUG: kernel is not normalized\nkernel = np.array([[1, 2, 1],[2, 4, 2],[1, 2, 1]], dtype=np.float32)\n# Add one line here to normalize\n\npatch  = np.full((3, 3), 100.0)\nresult = float(np.sum(patch * kernel))\nprint("Kernel sum:", round(float(kernel.sum()), 4))\nprint("Output on flat patch:", round(result, 2))\nprint("Correct:", abs(result - 100.0) < 0.01)`,
  2: `import numpy as np\nnp.random.seed(5)\nimg = np.random.randint(30, 220, (20, 20), dtype=np.uint8)\nnoisy = img.copy().ravel().astype(float)\nn = int(len(noisy) * 0.1)\nnoisy[np.random.choice(len(noisy), n, replace=False)] = 255\nnoisy[np.random.choice(len(noisy), n, replace=False)] = 0\nnoisy = noisy.reshape(20, 20).astype(np.uint8)\nprint("Spikes in noisy:", int(np.sum((noisy==0)|(noisy==255))))\n\ndef median_rows(image, w=3):\n    p   = np.pad(image.astype(float), ((0,0),(w//2,w//2)), mode='edge')\n    out = np.array([[np.median(p[y, x:x+w]) for x in range(image.shape[1])] for y in range(image.shape[0])])\n    return out.astype(np.uint8)\n\ndenoised = median_rows(noisy)\nprint("Spikes after median:", int(np.sum((denoised==0)|(denoised==255))))\n\ndef row_blur(img, k=3):\n    p = np.pad(img.astype(float), ((0,0),(k//2,k//2)), mode='edge')\n    return np.array([[p[y,x:x+k].mean() for x in range(img.shape[1])] for y in range(img.shape[0])])\n\nblurred   = row_blur(denoised)\nmask      = denoised.astype(float) - ___\namount    = 1.2\nsharpened = np.clip(denoised.astype(float) + ___ * mask, 0, 255).astype(np.uint8)\nprint("Std before sharpen:", round(float(denoised.std()), 2))\nprint("Std after  sharpen:", round(float(sharpened.std()), 2))\nprint("Sharpening worked:", sharpened.std() >= denoised.std() * 0.98)`,
  3: `import numpy as np\nnp.random.seed(7)\nimg = np.random.randint(40, 80, (30, 30), dtype=np.uint8)\nimg[10:20, 10:20] = np.random.randint(160, 200, (10,10), dtype=np.uint8)\nnoisy = img.copy().ravel().astype(float)\nn = int(len(noisy) * 0.06)\nnoisy[np.random.choice(len(noisy), n, replace=False)] = 255\nnoisy[np.random.choice(len(noisy), n, replace=False)] = 0\nnoisy = noisy.reshape(30,30).astype(np.uint8)\np = np.pad(noisy.astype(float), 1, mode='reflect')\ndenoised = np.array([[np.median(p[y:y+3, x:x+3]) for x in range(30)] for y in range(30)]).astype(np.uint8)\nprint("Spikes after median:", int(np.sum((denoised==0)|(denoised==255))))\nhist, _ = np.histogram(denoised.ravel(), 256, [0,256])\np_h = hist / hist.sum()\nbest_t, best_v = 0, 0.0\nfor t in range(1, 256):\n    w0 = p_h[:t].sum()\n    w1 = ___\n    if w0==0 or w1==0: continue\n    ix  = np.arange(256)\n    mu0 = (ix[:t]*p_h[:t]).sum()/w0\n    mu1 = ___\n    bv  = w0*w1*(mu0-mu1)**2\n    if bv>best_v: best_v,best_t=bv,t\nbinary = (denoised >= ___).astype(np.uint8) * 255\ndark_mean   = float(img[img < 120].mean())\nbright_mean = float(img[img >= 120].mean())\nprint(f"Otsu T: {best_t}")\nprint(f"T between peaks: {dark_mean < best_t < bright_mean}")\nprint(f"Foreground white: {(binary[10:20, 10:20] == 255).mean():.0%}  (expect >=90%)")`,
};

window.resetCodingQuiz = function(num) {
  const editors = { 1:'cq-1-editor', 2:'cq-2-editor', 3:'cq-3-editor' };
  const ed = document.getElementById(editors[num]);
  if (ed && cqDefaults[num]) ed.value = cqDefaults[num];
};

/* ── Playground ─────────────────────────────────────────────── */
const playgroundDefault = document.getElementById('playground-editor')?.value || '';

const playgroundSnippets = {
  gaussian: `import numpy as np\n\ndef gaussian_1d(size, sigma):\n    c = size // 2; x = np.arange(size) - c\n    g = np.exp(-x**2 / (2*sigma**2))\n    return g / g.sum()\n\nsigma = 1.5\ng1 = gaussian_1d(5, sigma)\ng2 = np.outer(g1, g1)\nprint("Kernel:"); print(np.round(g2, 4))\nprint("Sum:", round(float(g2.sum()), 6))\nprint("Center:", round(float(g2[2,2]), 4))\nprint("Corner:", round(float(g2[0,0]), 4))`,
  median: `import numpy as np\n\nsignal = np.array([80, 82, 255, 85, 83, 0, 88, 90, 87, 255, 84], dtype=np.float32)\nprint("Noisy:   ", signal.astype(int).tolist())\n\ndef med1d(s, w=3):\n    p = np.pad(s, w//2, mode='edge')\n    return np.array([np.median(p[i:i+w]) for i in range(len(s))])\n\nfor w in [3, 5, 7]:\n    f = med1d(signal, w)\n    spikes = int(np.sum((f==0)|(f==255)))\n    print(f"w={w}: {f.astype(int).tolist()} spikes={spikes}")`,
  unsharp: `import numpy as np\n\nsignal = np.array([50,50,50,100,150,150,150,80,80,180,180,80], dtype=np.float32)\n\ndef blur3(s):\n    p = np.pad(s, 1, mode='edge')\n    return np.array([p[i:i+3].mean() for i in range(len(s))])\n\nprint("Original:", signal.astype(int).tolist())\nfor amount in [0.5, 1.0, 1.5, 2.0]:\n    blurred = blur3(signal)\n    sharpened = np.clip(signal + amount*(signal-blurred), 0, 255)\n    print(f"amount={amount:.1f}: {sharpened.astype(int).tolist()}")`,
  otsu: `import numpy as np\nnp.random.seed(42)\ndark   = np.random.normal(70,  20, 2000).clip(0,255).astype(np.uint8)\nbright = np.random.normal(185, 15, 1500).clip(0,255).astype(np.uint8)\npixels = np.concatenate([dark, bright])\nhist, _ = np.histogram(pixels, 256, [0,256])\np = hist / hist.sum()\nbest_t, best_v = 0, 0.0\nfor t in range(1,256):\n    w0=p[:t].sum(); w1=1-w0\n    if w0==0 or w1==0: continue\n    ix=np.arange(256)\n    mu0=(ix[:t]*p[:t]).sum()/w0; mu1=(ix[t:]*p[t:]).sum()/w1\n    bv=w0*w1*(mu0-mu1)**2\n    if bv>best_v: best_v,best_t=bv,t\nprint(f"Otsu T: {best_t}")\nprint(f"Dark ~{dark.mean():.0f}, Bright ~{bright.mean():.0f}")\nprint(f"T between peaks: {float(dark.mean()) < best_t < float(bright.mean())}")`,
  pipeline: `import numpy as np\nnp.random.seed(0)\nimg = np.random.randint(30, 70, (40,40), dtype=np.uint8)\nimg[12:28,12:28] = np.random.randint(160, 200, (16,16), dtype=np.uint8)\nnoisy = img.copy().ravel().astype(float)\nn = int(len(noisy)*0.08)\nnoisy[np.random.choice(len(noisy),n,replace=False)]=255\nnoisy[np.random.choice(len(noisy),n,replace=False)]=0\nnoisy = noisy.reshape(40,40).astype(np.uint8)\nprint(f"1. Spikes: {int(np.sum((noisy==0)|(noisy==255)))}")\np = np.pad(noisy.astype(float),1,mode='reflect')\ndenoised = np.array([[np.median(p[y:y+3,x:x+3]) for x in range(40)] for y in range(40)]).astype(np.uint8)\nprint(f"2. After median: {int(np.sum((denoised==0)|(denoised==255)))} spikes")\nk=np.array([[1,2,1],[2,4,2],[1,2,1]],dtype=np.float32)/16\np2=np.pad(denoised.astype(float),1,mode='reflect')\nblurred=np.array([[(p2[y:y+3,x:x+3]*k).sum() for x in range(40)] for y in range(40)])\nsharp=np.clip(denoised+1.2*(denoised.astype(float)-blurred),0,255).astype(np.uint8)\nprint(f"3. Std: {denoised.std():.2f} -> {sharp.std():.2f}")\nhist,_=np.histogram(sharp.ravel(),256,[0,256])\nph=hist/hist.sum(); best_t,best_v=0,0.0\nfor t in range(1,256):\n    w0=ph[:t].sum();w1=1-w0\n    if w0==0 or w1==0:continue\n    ix=np.arange(256)\n    mu0=(ix[:t]*ph[:t]).sum()/w0;mu1=(ix[t:]*ph[t:]).sum()/w1\n    bv=w0*w1*(mu0-mu1)**2\n    if bv>best_v:best_v,best_t=bv,t\nbinary=(sharp>=best_t).astype(np.uint8)*255\nfg=binary[12:28,12:28]\nprint(f"4. Otsu T={best_t}, fg correct: {(fg==255).mean():.0%}")`,
};

window.loadSnippet = function(name) {
  const ed = document.getElementById('playground-editor');
  if (ed && playgroundSnippets[name]) ed.value = playgroundSnippets[name];
};

window.runPlayground = async function() {
  const ed  = document.getElementById('playground-editor');
  const out = document.getElementById('pg-output-pre');
  if (!ed || !out) return;
  out.closest('.output-wrap').style.display = 'block';
  out.textContent = '⏳ Running…';
  if (!pyodideInstance) { out.textContent = 'Python runtime not ready yet…'; return; }
  try {
    let stdout = '';
    pyodideInstance.setStdout({ batched: (s) => { stdout += s + '\n'; } });
    await pyodideInstance.runPythonAsync(ed.value);
    out.textContent = stdout || '(no output)';
  } catch(err) {
    out.textContent = '❌ ' + err.message;
  }
};

window.resetPlayground = function() {
  const ed = document.getElementById('playground-editor');
  if (ed) ed.value = playgroundDefault;
  const out = document.getElementById('pg-output');
  if (out) out.style.display = 'none';
};

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (document.activeElement?.classList.contains('playground-editor')) {
      e.preventDefault();
      runPlayground();
    }
  }
});
