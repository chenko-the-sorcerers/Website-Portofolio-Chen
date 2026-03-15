'use strict';

/* ══════════════════════════════════════════════════════════════
   cnn-arch.js — Popular Architectures · all interactive logic
   Sections:
   1.  Boilerplate (progress, sidebar, scroll spy, smooth scroll)
   2.  Architecture data (presets, layer types)
   3.  Architecture Builder (layer editor + pipeline viz + stats)
   4.  Gradient flow simulation (canvas)
   5.  Residual block configurator (SVG diagram)
   6.  EfficientNet compound scaling explorer
   7.  Upload & feature-map visualizer (pure JS convolution)
   8.  Tensor flow step-by-step
   9.  Backbone recommender
   10. Scroll reveal + prev/next buttons
══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   1. BOILERPLATE
───────────────────────────────────────────────────────────── */
(function () {
  const bar = document.getElementById('readBar');
  if (bar) {
    const upd = () => {
      const d = document.documentElement;
      bar.style.width = Math.min(100, window.scrollY / (d.scrollHeight - d.clientHeight) * 100) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }
})();

window.toggleSidebar = function () {
  document.getElementById('lessonSidebar').classList.toggle('open');
};
document.addEventListener('click', e => {
  const sb = document.getElementById('lessonSidebar');
  const btn = document.getElementById('menuBtn');
  if (sb && btn && !sb.contains(e.target) && !btn.contains(e.target))
    sb.classList.remove('open');
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
    const p = Math.round(ai / Math.max(1, secs.length - 1) * 100);
    if (fill) fill.style.width = p + '%';
    if (pct)  pct.textContent  = p + '%';
  }
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

document.querySelectorAll('.lnav-item[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});


/* ─────────────────────────────────────────────────────────────
   2. ARCHITECTURE DATA
───────────────────────────────────────────────────────────── */
const LAYER_COLORS = {
  conv:'#2997ff', pool:'#ff9f0a', bn:'#34c759', relu:'#a855f7',
  dropout:'#ff375f', fc:'#00c7be', gap:'#ffd600', residual:'#ff453a',
  input:'#6e6e73', softmax:'#ff9f0a'
};

const LAYER_DEFAULTS = {
  conv:     { filters:64,  kernel:3, stride:1, padding:1 },
  pool:     { type:'max',  size:2,   stride:2 },
  bn:       { },
  relu:     { },
  dropout:  { rate:0.5 },
  fc:       { units:512 },
  gap:      { },
  residual: { filters:64, type:'basic' },
};

// Each layer: { type, ...params, id }
let layerIdCounter = 0;
function mkLayer(type, overrides = {}) {
  return { type, id: ++layerIdCounter, ...JSON.parse(JSON.stringify(LAYER_DEFAULTS[type] || {})), ...overrides };
}

const PRESETS = {
  alexnet: [
    mkLayer('conv',    { filters:96,  kernel:11, stride:4, padding:0 }),
    mkLayer('relu'),
    mkLayer('pool',    { type:'max', size:3, stride:2 }),
    mkLayer('conv',    { filters:256, kernel:5,  stride:1, padding:2 }),
    mkLayer('relu'),
    mkLayer('pool',    { type:'max', size:3, stride:2 }),
    mkLayer('conv',    { filters:384, kernel:3,  stride:1, padding:1 }),
    mkLayer('relu'),
    mkLayer('conv',    { filters:384, kernel:3,  stride:1, padding:1 }),
    mkLayer('relu'),
    mkLayer('conv',    { filters:256, kernel:3,  stride:1, padding:1 }),
    mkLayer('relu'),
    mkLayer('pool',    { type:'max', size:3, stride:2 }),
    mkLayer('fc',      { units:4096 }),
    mkLayer('relu'),
    mkLayer('dropout', { rate:0.5 }),
    mkLayer('fc',      { units:4096 }),
    mkLayer('relu'),
    mkLayer('dropout', { rate:0.5 }),
    mkLayer('fc',      { units:1000 }),
  ],
  vgg16: [
    mkLayer('conv',{ filters:64,  kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:64,  kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('pool',{ type:'max', size:2, stride:2 }),
    mkLayer('conv',{ filters:128, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:128, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('pool',{ type:'max', size:2, stride:2 }),
    mkLayer('conv',{ filters:256, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:256, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:256, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('pool',{ type:'max', size:2, stride:2 }),
    mkLayer('conv',{ filters:512, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:512, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('conv',{ filters:512, kernel:3, stride:1, padding:1 }), mkLayer('relu'),
    mkLayer('pool',{ type:'max', size:2, stride:2 }),
    mkLayer('fc',  { units:4096 }), mkLayer('relu'), mkLayer('dropout',{ rate:0.5 }),
    mkLayer('fc',  { units:4096 }), mkLayer('relu'), mkLayer('dropout',{ rate:0.5 }),
    mkLayer('fc',  { units:1000 }),
  ],
  resnet50: [
    mkLayer('conv',   { filters:64, kernel:7, stride:2, padding:3 }), mkLayer('bn'), mkLayer('relu'),
    mkLayer('pool',   { type:'max', size:3, stride:2 }),
    mkLayer('residual',{ filters:64,  type:'bottleneck' }),
    mkLayer('residual',{ filters:64,  type:'bottleneck' }),
    mkLayer('residual',{ filters:64,  type:'bottleneck' }),
    mkLayer('residual',{ filters:128, type:'bottleneck' }),
    mkLayer('residual',{ filters:128, type:'bottleneck' }),
    mkLayer('residual',{ filters:128, type:'bottleneck' }),
    mkLayer('residual',{ filters:128, type:'bottleneck' }),
    mkLayer('residual',{ filters:256, type:'bottleneck' }),
    mkLayer('residual',{ filters:256, type:'bottleneck' }),
    mkLayer('residual',{ filters:256, type:'bottleneck' }),
    mkLayer('residual',{ filters:512, type:'bottleneck' }),
    mkLayer('residual',{ filters:512, type:'bottleneck' }),
    mkLayer('residual',{ filters:512, type:'bottleneck' }),
    mkLayer('gap'),
    mkLayer('fc', { units:1000 }),
  ],
  efficientb0: [
    mkLayer('conv',   { filters:32, kernel:3, stride:2, padding:1 }), mkLayer('bn'), mkLayer('relu'),
    mkLayer('conv',   { filters:16, kernel:3, stride:1, padding:1 }), mkLayer('bn'), mkLayer('relu'),
    mkLayer('residual',{ filters:24,  type:'basic' }),
    mkLayer('residual',{ filters:24,  type:'basic' }),
    mkLayer('residual',{ filters:40,  type:'basic' }),
    mkLayer('residual',{ filters:40,  type:'basic' }),
    mkLayer('residual',{ filters:80,  type:'basic' }),
    mkLayer('residual',{ filters:80,  type:'basic' }),
    mkLayer('residual',{ filters:112, type:'basic' }),
    mkLayer('residual',{ filters:192, type:'basic' }),
    mkLayer('residual',{ filters:320, type:'basic' }),
    mkLayer('conv',   { filters:1280, kernel:1, stride:1, padding:0 }), mkLayer('bn'), mkLayer('relu'),
    mkLayer('gap'),
    mkLayer('dropout',{ rate:0.2 }),
    mkLayer('fc', { units:1000 }),
  ],
};

/* ─────────────────────────────────────────────────────────────
   3. ARCHITECTURE BUILDER
───────────────────────────────────────────────────────────── */
(function () {
  let layers = JSON.parse(JSON.stringify(PRESETS.alexnet));
  let inputH = 224, inputC = 3, numClasses = 1000;

  const listEl    = document.getElementById('layerList');
  const pipeEl    = document.getElementById('pipelineViz');
  const pBtns     = document.getElementById('presetBtns');
  const selRes    = document.getElementById('selResolution');
  const selCh     = document.getElementById('selChannels');
  const inpCls    = document.getElementById('inpClasses');
  if (!listEl) return;

  // ── compute output shapes ──────────────────────────────────
  function computeShapes() {
    let H = inputH, W = inputH, C = inputC;
    const shapes = [{ H, W, C }];
    let prevC = C;
    layers.forEach(l => {
      let nH = H, nW = W, nC = C;
      if (l.type === 'conv') {
        nH = Math.floor((H + 2 * l.padding - l.kernel) / l.stride + 1);
        nW = Math.floor((W + 2 * l.padding - l.kernel) / l.stride + 1);
        nC = l.filters;
      } else if (l.type === 'pool') {
        nH = Math.floor((H - l.size) / l.stride + 1);
        nW = Math.floor((W - l.size) / l.stride + 1);
      } else if (l.type === 'gap') {
        nH = 1; nW = 1;
      } else if (l.type === 'fc') {
        nH = 1; nW = 1; nC = l.units;
      } else if (l.type === 'residual') {
        nC = l.filters;
      }
      H = Math.max(1, nH); W = Math.max(1, nW); C = Math.max(1, nC);
      shapes.push({ H, W, C });
    });
    return shapes;
  }

  // ── compute params ─────────────────────────────────────────
  function computeStats(shapes) {
    let params = 0, flops = 0;
    let prevC = inputC;
    layers.forEach((l, i) => {
      const sh = shapes[i];
      const outH = shapes[i+1].H, outW = shapes[i+1].W;
      if (l.type === 'conv') {
        const p = l.kernel * l.kernel * prevC * l.filters + l.filters;
        params += p;
        flops  += 2 * l.kernel * l.kernel * prevC * l.filters * outH * outW;
        prevC   = l.filters;
      } else if (l.type === 'bn') {
        params += prevC * 4;
      } else if (l.type === 'fc') {
        const inUnits = sh.H * sh.W * sh.C;
        params += inUnits * l.units + l.units;
        flops  += 2 * inUnits * l.units;
        prevC   = l.units;
      } else if (l.type === 'residual') {
        // bottleneck: 1x1 + 3x3 + 1x1
        const bCh = Math.round(l.filters / 4);
        const p = l.type === 'bottleneck'
          ? prevC * bCh + bCh + bCh * bCh * 9 + bCh + bCh * l.filters + l.filters
          : prevC * l.filters * 9 + l.filters + l.filters * l.filters * 9 + l.filters;
        params += p + l.filters * 4;
        flops  += p * 2 * outH * outW;
        prevC   = l.filters;
      }
    });
    return { params, flops };
  }

  function fmtNum(n) {
    if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return n.toFixed(0);
  }

  // ── render layer list ──────────────────────────────────────
  function renderList(shapes) {
    listEl.innerHTML = '';
    layers.forEach((l, idx) => {
      const row = document.createElement('div');
      row.className = 'layer-item';
      row.dataset.idx = idx;

      // drag handle
      const drag = document.createElement('span');
      drag.className = 'li-drag';
      drag.textContent = '⠿';

      // type badge
      const badge = document.createElement('span');
      badge.className = `li-type ${l.type}`;
      badge.textContent = l.type.toUpperCase();

      // params editor
      const paramsEl = document.createElement('div');
      paramsEl.className = 'li-params';
      buildParamEditor(paramsEl, l, () => { computeAll(); });

      // output shape
      const outEl = document.createElement('span');
      outEl.className = 'li-output';
      const sh = shapes[idx + 1];
      outEl.textContent = sh ? `${sh.H}×${sh.W}×${sh.C}` : '—';

      // delete
      const del = document.createElement('button');
      del.className = 'li-del';
      del.textContent = '×';
      del.addEventListener('click', e => { e.stopPropagation(); layers.splice(idx, 1); computeAll(); });

      row.append(drag, badge, paramsEl, outEl, del);
      row.addEventListener('click', () => {
        listEl.querySelectorAll('.layer-item').forEach(r => r.classList.remove('selected'));
        row.classList.toggle('selected');
      });
      listEl.appendChild(row);
    });
  }

  function buildParamEditor(el, l, onChange) {
    const defs = {
      conv:    [['filters',16,512,16,'Filters'],['kernel',1,11,1,'Kernel'],['stride',1,4,1,'Stride'],['padding',0,5,1,'Pad']],
      pool:    [['size',2,5,1,'Size'],['stride',1,4,1,'Stride']],
      dropout: [['rate',0.1,0.9,0.1,'Rate']],
      fc:      [['units',16,4096,16,'Units']],
      residual:[['filters',16,512,16,'Filters']],
    };
    const fields = defs[l.type] || [];
    fields.forEach(([key, min, max, step, label]) => {
      const wrap = document.createElement('span');
      wrap.className = 'li-param';
      const lbl = document.createElement('label');
      lbl.textContent = label;
      const inp = document.createElement('input');
      inp.type  = 'number';
      inp.min   = min; inp.max = max; inp.step = step;
      inp.value = l[key] || min;
      inp.addEventListener('change', () => { l[key] = +inp.value; onChange(); });
      inp.addEventListener('click', e => e.stopPropagation());
      wrap.append(lbl, inp);
      el.appendChild(wrap);
    });
    // pool type select
    if (l.type === 'pool') {
      const wrap = document.createElement('span');
      wrap.className = 'li-param';
      const lbl = document.createElement('label');
      lbl.textContent = 'Type';
      const sel = document.createElement('select');
      ['max','avg'].forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; if (l.type_val === v) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', e => { e.stopPropagation(); l.type = sel.value; onChange(); });
      sel.addEventListener('click', e => e.stopPropagation());
      wrap.append(lbl, sel);
      el.appendChild(wrap);
    }
  }

  // ── render pipeline ────────────────────────────────────────
  function renderPipeline(shapes) {
    pipeEl.innerHTML = '';
    const scroll = document.createElement('div');
    scroll.className = 'pipeline-scroll';

    // input node
    scroll.appendChild(makePipeNode({
      label:'Input', shape:shapes[0], color:'#6e6e73', height:40, abbr:'IN'
    }));

    layers.forEach((l, i) => {
      const sh     = shapes[i + 1];
      const color  = LAYER_COLORS[l.type] || '#888';
      const inSh   = shapes[i];
      // scale height by spatial size (log scale)
      const maxSz  = inputH * inputH;
      const curSz  = sh ? sh.H * sh.W : 1;
      const boxH   = Math.max(18, Math.min(72, Math.round(14 + (Math.log(curSz+1)/Math.log(maxSz+1)) * 58)));

      scroll.appendChild(makeArrow());
      scroll.appendChild(makePipeNode({
        label: layerAbbr(l), shape: sh, color, height: boxH,
        isResidual: l.type === 'residual',
      }));
    });
    pipeEl.appendChild(scroll);
  }

  function layerAbbr(l) {
    const abbrs = { conv:'CONV', pool:'POOL', bn:'BN', relu:'ReLU', dropout:'DROP', fc:'FC', gap:'GAP', residual:'RES' };
    return abbrs[l.type] || l.type.toUpperCase();
  }

  function makePipeNode({ label, shape, color, height, isResidual }) {
    const node = document.createElement('div');
    node.className = 'pv-node';
    const box = document.createElement('div');
    box.className = 'pv-box';
    const w = Math.max(36, Math.min(72, shape ? Math.round(14 + (shape.C / 512) * 48) : 36));
    box.style.cssText = `width:${w}px;height:${height}px;background:${color}22;border-color:${color}88;`;
    box.textContent = label;

    const nameEl = document.createElement('div');
    nameEl.className = 'pv-name';
    nameEl.textContent = label;
    nameEl.style.color = color;

    const shapeEl = document.createElement('div');
    shapeEl.className = 'pv-shape';
    shapeEl.textContent = shape ? `${shape.H}×${shape.W}×${shape.C}` : '';

    if (isResidual) {
      box.style.borderStyle = 'dashed';
      box.style.borderColor = '#34c75988';
    }
    node.append(box, nameEl, shapeEl);
    return node;
  }

  function makeArrow() {
    const wrap = document.createElement('div');
    wrap.className = 'pv-arrow';
    const line = document.createElement('div');
    line.className = 'pv-arrow-line';
    wrap.appendChild(line);
    return wrap;
  }

  // ── update stats bar ───────────────────────────────────────
  function updateStats(shapes, stats) {
    const lastSh = shapes[shapes.length - 1];
    const p = stats.params;
    const pEl = document.getElementById('statParams');
    const fEl = document.getElementById('statFlops');
    const sEl = document.getElementById('statSize');
    const oEl = document.getElementById('statOutput');
    if (pEl) { pEl.textContent = fmtNum(p); pEl.className = 'stat-val' + (p > 100e6 ? ' danger' : p < 10e6 ? ' good' : ''); }
    if (fEl) { fEl.textContent = fmtNum(stats.flops) + 'OP'; }
    if (sEl) { sEl.textContent = (p * 4 / 1e6).toFixed(1) + ' MB'; }
    if (oEl && lastSh) oEl.textContent = `${lastSh.H}×${lastSh.W}×${lastSh.C}`;
  }

  // ── main render ────────────────────────────────────────────
  function computeAll() {
    const shapes = computeShapes();
    const stats  = computeStats(shapes);
    renderList(shapes);
    renderPipeline(shapes);
    updateStats(shapes, stats);
  }

  // ── presets ────────────────────────────────────────────────
  pBtns && pBtns.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pBtns.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.preset !== 'custom') {
        layers = JSON.parse(JSON.stringify(PRESETS[btn.dataset.preset] || PRESETS.alexnet));
      }
      computeAll();
    });
  });

  // ── add layer buttons ──────────────────────────────────────
  document.querySelectorAll('.le-add').forEach(btn => {
    btn.addEventListener('click', () => {
      layers.push(mkLayer(btn.dataset.type));
      computeAll();
    });
  });

  // ── input config ───────────────────────────────────────────
  selRes && selRes.addEventListener('change', () => { inputH = +selRes.value; computeAll(); });
  selCh  && selCh.addEventListener('change',  () => { inputC = +selCh.value;  computeAll(); });
  inpCls && inpCls.addEventListener('change', () => { numClasses = +inpCls.value; computeAll(); });

  computeAll();
})();


/* ─────────────────────────────────────────────────────────────
   4. GRADIENT FLOW SIMULATION
───────────────────────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('gradientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let nLayers = 8, gradInit = 1.0, mode = 'both';

  const slL   = document.getElementById('slLayers');
  const slG   = document.getElementById('slGradInit');
  const valL  = document.getElementById('valLayers');
  const valG  = document.getElementById('valGradInit');

  function vanillaGrad(layer, n, g0) {
    // Each layer multiplies by random weight ~0.3–0.8
    const scale = 0.5;
    return g0 * Math.pow(scale, layer);
  }
  function resnetGrad(layer, n, g0) {
    // Skip connection keeps gradient + residual
    const scale = 0.5;
    // Simplified: gradient ≈ g0 * (1 + small) per block — doesn't vanish
    return g0 * Math.pow(1 + scale * 0.15, layer);
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const PAD = { l:50, r:20, t:20, b:40 };
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, PAD.t + plotH);
    ctx.lineTo(PAD.l + plotW, PAD.t + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = '11px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Layer (awal → output)', PAD.l + plotW/2, H - 4);
    ctx.save();
    ctx.translate(13, PAD.t + plotH/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText('|Gradient|', 0, 0);
    ctx.restore();

    const N = nLayers;
    const g0 = gradInit;

    // compute max for y scale
    const allVals = [];
    for (let i = 0; i <= N; i++) {
      allVals.push(vanillaGrad(i, N, g0), resnetGrad(i, N, g0));
    }
    const maxVal = Math.max(...allVals, 0.001);

    function toX(layer) { return PAD.l + (layer / N) * plotW; }
    function toY(val) { return PAD.t + plotH - Math.min(1, val / maxVal) * plotH; }

    // draw guide lines
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      const y = PAD.t + (1-frac) * plotH;
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + plotW, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.textAlign = 'right';
      ctx.font = '9px Space Mono, monospace';
      ctx.fillText((frac * maxVal).toFixed(2), PAD.l - 4, y + 3);
    });

    // x axis ticks
    for (let i = 0; i <= N; i++) {
      if (i % Math.max(1, Math.round(N/8)) === 0) {
        ctx.fillStyle = 'rgba(255,255,255,.3)';
        ctx.font = '9px Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i, toX(i), PAD.t + plotH + 14);
      }
    }

    function drawLine(colorStr, fn, label) {
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = colorStr;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const v = fn(i, N, g0);
        const x = toX(i), y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // dots
      ctx.shadowBlur = 0;
      for (let i = 0; i <= N; i++) {
        const v = fn(i, N, g0);
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(toX(i), toY(v), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    if (mode !== 'resnet')  drawLine('#ff3b30', vanillaGrad);
    if (mode !== 'vanilla') drawLine('#34c759', resnetGrad);
  }

  slL && slL.addEventListener('input', () => { nLayers = +slL.value; valL.textContent = nLayers; draw(); });
  slG && slG.addEventListener('input', () => { gradInit = +slG.value; valG.textContent = gradInit.toFixed(1); draw(); });

  document.getElementById('btnShowBoth')    ?.addEventListener('click', function(){ mode='both';    setActive(this); draw(); });
  document.getElementById('btnShowVanilla') ?.addEventListener('click', function(){ mode='vanilla'; setActive(this); draw(); });
  document.getElementById('btnShowResnet')  ?.addEventListener('click', function(){ mode='resnet';  setActive(this); draw(); });

  function setActive(btn) {
    document.querySelectorAll('.gs-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // resize observer
  const ro = new ResizeObserver(() => {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    canvas.width  = wrap.clientWidth  || 700;
    canvas.height = Math.round((canvas.width) * 0.4);
    draw();
  });
  ro.observe(canvas.parentElement);
  draw();
})();


/* ─────────────────────────────────────────────────────────────
   5. RESIDUAL BLOCK CONFIGURATOR
───────────────────────────────────────────────────────────── */
(function () {
  const diagEl = document.getElementById('resblockDiagram') || document.getElementById('rbDiagram');
  const statsEl = document.getElementById('rbStats');
  if (!diagEl) return;

  let blockType = 'basic';
  let inCh  = 64, outCh = 64, bnRatio = 4;

  document.querySelectorAll('.rb-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rb-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      blockType = btn.dataset.type;
      const bnRow = document.getElementById('bottleneckRow');
      if (bnRow) bnRow.style.display = blockType === 'bottleneck' ? '' : 'none';
      render();
    });
  });

  const slIn  = document.getElementById('slInCh');
  const slOut = document.getElementById('slOutCh');
  const slBn  = document.getElementById('slBnRatio');
  slIn  && slIn.addEventListener('input',  () => { inCh     = +slIn.value;  document.getElementById('valInCh').textContent  = inCh;     render(); });
  slOut && slOut.addEventListener('input', () => { outCh    = +slOut.value; document.getElementById('valOutCh').textContent = outCh;    render(); });
  slBn  && slBn.addEventListener('input',  () => { bnRatio  = +slBn.value;  document.getElementById('valBnRatio').textContent = bnRatio; render(); });

  function computeBlockParams() {
    if (blockType === 'basic') {
      return inCh * outCh * 9 + outCh + outCh * outCh * 9 + outCh + outCh * 4;
    } else {
      const mid = Math.round(outCh / bnRatio);
      return inCh * mid + mid + mid * mid * 9 + mid + mid * outCh + outCh + outCh * 4;
    }
  }

  function render() {
    const W = 520, H = blockType === 'basic' ? 320 : 420;
    const cx = W / 2;
    const params = computeBlockParams();
    const mid = Math.round(outCh / bnRatio);

    const boxes = blockType === 'basic' ? [
      { label:`Conv 3×3  (${inCh}→${outCh})`,  color:'#2997ff', params: inCh*outCh*9 },
      { label:`BN + ReLU`,                       color:'#34c759', params: outCh*4 },
      { label:`Conv 3×3  (${outCh}→${outCh})`,  color:'#2997ff', params: outCh*outCh*9 },
      { label:`BN`,                              color:'#34c759', params: outCh*4 },
    ] : [
      { label:`Conv 1×1  (${inCh}→${mid})`,    color:'#a855f7', params: inCh*mid },
      { label:`BN + ReLU`,                      color:'#34c759', params: mid*4 },
      { label:`Conv 3×3  (${mid}→${mid})`,     color:'#2997ff', params: mid*mid*9 },
      { label:`BN + ReLU`,                      color:'#34c759', params: mid*4 },
      { label:`Conv 1×1  (${mid}→${outCh})`,   color:'#a855f7', params: mid*outCh },
      { label:`BN`,                             color:'#34c759', params: outCh*4 },
    ];

    const boxH = 32, boxW = 220, gap = 14;
    const totalH = boxes.length * (boxH + gap) - gap;
    const startY = (H - totalH - 40) / 2 + 20;

    const needSkip1x1 = inCh !== outCh;
    const skipColor = needSkip1x1 ? '#ff9f0a' : '#34c759';
    const skipX = cx + boxW / 2 + 40;

    let svgParts = [`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`];
    svgParts.push(`<defs><marker id="arh" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M1,1 L7,4 L1,7 Z" fill="rgba(255,255,255,.4)"/></marker><marker id="arG" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M1,1 L7,4 L1,7 Z" fill="${skipColor}"/></marker></defs>`);

    // draw arrows between boxes
    boxes.forEach((_, i) => {
      if (i === 0) return;
      const prevY = startY + (i-1) * (boxH + gap) + boxH;
      const nextY = startY + i * (boxH + gap);
      svgParts.push(`<line x1="${cx}" y1="${prevY}" x2="${cx}" y2="${nextY}" stroke="rgba(255,255,255,.25)" stroke-width="1.5" marker-end="url(#arh)"/>`);
    });

    // draw boxes
    boxes.forEach((b, i) => {
      const y = startY + i * (boxH + gap);
      svgParts.push(`<rect x="${cx - boxW/2}" y="${y}" width="${boxW}" height="${boxH}" rx="6" fill="${b.color}1a" stroke="${b.color}77" stroke-width="1.5"/>`);
      svgParts.push(`<text x="${cx}" y="${y + boxH/2 + 4}" text-anchor="middle" font-size="11" fill="${b.color}" font-family="'Space Mono', monospace">${b.label}</text>`);
      // param badge
      const pStr = b.params > 1000 ? (b.params/1000).toFixed(1)+'K' : b.params.toString();
      svgParts.push(`<text x="${cx + boxW/2 + 6}" y="${y + boxH/2 + 4}" font-size="9" fill="rgba(255,255,255,.3)" font-family="'Space Mono', monospace">${pStr}</text>`);
    });

    // skip connection arc
    const skipY1 = startY + boxH / 2;
    const skipY2 = startY + (boxes.length - 1) * (boxH + gap) + boxH / 2;
    svgParts.push(`<path d="M ${skipX} ${skipY1} Q ${skipX+44} ${skipY1} ${skipX+44} ${(skipY1+skipY2)/2} Q ${skipX+44} ${skipY2} ${skipX} ${skipY2}" fill="none" stroke="${skipColor}" stroke-width="1.8" stroke-dasharray="5,3"/>`);
    svgParts.push(`<line x1="${skipX+42}" y1="${skipY2-2}" x2="${skipX+4}" y2="${skipY2-2}" stroke="${skipColor}" stroke-width="1.8" marker-end="url(#arG)"/>`);
    svgParts.push(`<text x="${skipX+52}" y="${(skipY1+skipY2)/2+4}" font-size="10" fill="${skipColor}" font-family="'Space Mono', monospace">+x</text>`);
    if (needSkip1x1) {
      svgParts.push(`<text x="${skipX+52}" y="${(skipY1+skipY2)/2+16}" font-size="9" fill="${skipColor}99" font-family="'Space Mono', monospace">1×1</text>`);
    }

    // input / output labels
    svgParts.push(`<text x="${cx}" y="${startY - 8}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,.4)" font-family="'Space Mono', monospace">Input: ${inCh}ch</text>`);
    const botY = startY + boxes.length * (boxH + gap) - gap + 18;
    svgParts.push(`<text x="${cx}" y="${botY}" text-anchor="middle" font-size="10" fill="#34c759" font-family="'Space Mono', monospace">Output: ${outCh}ch</text>`);

    svgParts.push('</svg>');
    diagEl.innerHTML = svgParts.join('');

    // stats
    if (statsEl) {
      const fmt = n => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n;
      statsEl.innerHTML = `
        <span class="rbs-stat">Params: <strong>${fmt(params)}</strong></span>
        <span class="rbs-stat">Type: <strong>${blockType === 'basic' ? 'Block Sederhana (2×Conv 3×3)' : `Block Efisien (1×1→3×3→1×1, channel mid=${mid})`}</strong></span>
        <span class="rbs-stat">Skip: <strong>${needSkip1x1 ? '1×1 projection' : 'identity'}</strong></span>
      `;
    }
  }

  render();
})();


/* ─────────────────────────────────────────────────────────────
   6. EFFICIENTNET COMPOUND SCALING
───────────────────────────────────────────────────────────── */
(function () {
  const slPhi = document.getElementById('slPhi') || document.getElementById('slEffPhi');
  const grid  = document.getElementById('csDisplay') || document.getElementById('effGrid');
  const scCmp = document.getElementById('scalingCompare');
  if (!slPhi) return;

  const SPECS = [
    { res:224,  depth:1.0, width:1.0,  params:5.3,  acc:77.1, flops:0.39 },
    { res:240,  depth:1.1, width:1.0,  params:7.8,  acc:79.1, flops:0.70 },
    { res:260,  depth:1.2, width:1.1,  params:9.2,  acc:80.1, flops:1.0  },
    { res:300,  depth:1.4, width:1.2,  params:12,   acc:81.6, flops:1.8  },
    { res:380,  depth:1.8, width:1.4,  params:19,   acc:82.9, flops:4.2  },
    { res:456,  depth:2.2, width:1.6,  params:30,   acc:83.6, flops:9.9  },
    { res:528,  depth:2.6, width:1.8,  params:43,   acc:84.0, flops:19   },
    { res:600,  depth:3.1, width:2.0,  params:66,   acc:84.4, flops:37   },
  ];
  const MAX = { res:600, depth:3.1, width:2.0, acc:84.4, params:66 };
  const COLORS = { depth:'#2997ff', width:'#a855f7', res:'#ff9f0a', acc:'#34c759', params:'#ff3b30' };

  function buildGrid(s) {
    if (!grid) return;
    const dims = [
      { label:'Depth',      val:`×${s.depth.toFixed(1)}`,  color:COLORS.depth,  pct:s.depth/MAX.depth*100, sub:`${Math.round(s.depth*100)}% of B0` },
      { label:'Width',      val:`×${s.width.toFixed(1)}`,  color:COLORS.width,  pct:s.width/MAX.width*100, sub:`${Math.round(s.width*100)}% of B0` },
      { label:'Resolution', val:`${s.res}px`,              color:COLORS.res,    pct:s.res/MAX.res*100,     sub:`input image size` },
    ];
    grid.innerHTML = dims.map(d => `
      <div class="eff-dim-card" style="border-color:${d.color}22">
        <div class="eff-dim-label">${d.label}</div>
        <div class="eff-dim-val" style="color:${d.color}">${d.val}</div>
        <div class="eff-dim-bar-wrap" style="width:85%">
          <div class="eff-dim-bar" style="width:${d.pct.toFixed(1)}%;background:${d.color}"></div>
        </div>
        <div class="eff-dim-sub">${d.sub}</div>
      </div>`).join('') +
      `<div class="eff-dim-card eff-acc-card" style="border-color:${COLORS.acc}33">
        <div class="eff-dim-label">Top-1 Accuracy</div>
        <div class="eff-dim-val" style="color:${COLORS.acc}">${s.acc}%</div>
        <div class="eff-dim-bar-wrap" style="width:85%">
          <div class="eff-dim-bar" style="width:${(s.acc/MAX.acc*100).toFixed(1)}%;background:${COLORS.acc}"></div>
        </div>
        <div class="eff-dim-sub">${s.flops}B FLOPS</div>
      </div>
      <div class="eff-dim-card eff-param-card">
        <div class="eff-dim-label">Parameters</div>
        <div class="eff-dim-val" style="color:${COLORS.params}">${s.params}M</div>
        <div class="eff-dim-bar-wrap" style="width:85%">
          <div class="eff-dim-bar" style="width:${(s.params/MAX.params*100).toFixed(1)}%;background:${COLORS.params}"></div>
        </div>
        <div class="eff-dim-sub">model weights</div>
      </div>`;
  }

  function buildScalingCompare() {
    if (!scCmp) return;
    // Compare: depth-only, width-only, res-only, compound — at similar FLOPS
    const strategies = [
      { name:'Depth only (deeper)',          acc:80.0, color:'#ff3b30', flops:4.1 },
      { name:'Width only (more channels)',   acc:81.5, color:'#ff9f0a', flops:4.1 },
      { name:'Resolution only (bigger input)',acc:81.8, color:'#2997ff', flops:4.1 },
      { name:'Compound (EfficientNet-B4)',   acc:82.9, color:'#34c759', flops:4.2 },
      { name:'ResNet-50 (baseline)',         acc:76.0, color:'#6e6e73', flops:4.1 },
    ];
    const maxAcc = 84;
    scCmp.innerHTML = `<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.08em">Top-1 Accuracy pada ~4B FLOPS</div>` +
      strategies.map(s => `
        <div class="sc-row">
          <span class="sc-name">${s.name}</span>
          <div class="sc-bar-wrap">
            <div class="sc-bar" style="width:${(s.acc/maxAcc*100).toFixed(1)}%;background:${s.color}"></div>
          </div>
          <span class="sc-acc">${s.acc}%</span>
        </div>`).join('');
  }

  slPhi.addEventListener('input', () => {
    const phi = +slPhi.value;
    (document.getElementById('valPhi') || document.getElementById('valEffPhi') || {}).textContent = phi;
    buildGrid(SPECS[phi]);
  });
  buildGrid(SPECS[0]);
  buildScalingCompare();
})();


/* ─────────────────────────────────────────────────────────────
   7. UPLOAD & FEATURE MAP VISUALIZER
───────────────────────────────────────────────────────────── */
(function () {
  const dropZone   = document.getElementById('uploadDropZone');
  const fileInput  = document.getElementById('fileInput');
  const udzBtn     = document.getElementById('udzBtn');
  const overlay    = document.getElementById('udzOverlay');
  const preview    = document.getElementById('uploadPreview');
  const runBtn     = document.getElementById('upRunBtn');
  const runLabel   = document.getElementById('upRunLabel');
  const layerBtns  = document.getElementById('upLayerBtns');
  const fmGrid     = document.getElementById('featureMapGrid');
  const fmInfo     = document.getElementById('fmLayerInfo');
  const rtTitle    = document.getElementById('upRightTitle');
  const rtSub      = document.getElementById('upRightSub');
  const selArch    = document.getElementById('selUpArch');
  const tfFlow     = document.getElementById('tensorFlow');
  const tfControls = document.getElementById('tfControls');
  if (!dropZone) return;

  let imgData  = null;   // ImageData 224×224
  let currentLayerIdx = 0;
  let tfSteps  = [];
  let tfCurrent = 0;
  let autoplayTimer = null;

  // ── File handling ──────────────────────────────────────────
  udzBtn  && udzBtn.addEventListener('click',  () => fileInput.click());
  fileInput && fileInput.addEventListener('change', e => loadFile(e.target.files[0]));

  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  });

  function loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        // draw into 224×224 preview canvas
        const ctx = preview.getContext('2d');
        preview.width = 224; preview.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);
        imgData = ctx.getImageData(0, 0, 224, 224);
        overlay.classList.add('hidden');
        dropZone.classList.add('has-image');
        runBtn.disabled = false;
        buildLayerButtons();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ── Build layer selector buttons ───────────────────────────
  const ARCH_LAYERS = {
    alexnet:     ['conv1','relu1','pool1','conv2','pool2','conv3','conv4','conv5','pool3'],
    vgg16:       ['conv1_1','conv1_2','pool1','conv2_1','conv2_2','pool2','conv3_1','conv3_2','pool3'],
    resnet50:    ['conv1','pool1','res2a','res2b','res2c','res3a','pool_avg'],
    efficientb0: ['stem','mbconv1','mbconv2','mbconv3','mbconv4','mbconv5','head'],
  };

  function buildLayerButtons() {
    if (!layerBtns) return;
    const arch   = selArch ? selArch.value : 'resnet50';
    const layers = ARCH_LAYERS[arch] || ARCH_LAYERS.resnet50;
    layerBtns.innerHTML = '';
    currentLayerIdx = 0;
    layers.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.className = 'up-layer-btn' + (i === 0 ? ' active' : '');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        layerBtns.querySelectorAll('.up-layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLayerIdx = i;
        if (fmGrid.querySelector('.fm-item')) showFeatureMaps(i);
      });
      layerBtns.appendChild(btn);
    });
  }

  selArch && selArch.addEventListener('change', () => { if (imgData) buildLayerButtons(); });

  // ── Convolution helpers ────────────────────────────────────
  function imgDataToGrayscale(id, targetW, targetH) {
    // resize naively by sampling
    const out = new Float32Array(targetW * targetH);
    const sx = id.width / targetW, sy = id.height / targetH;
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const px = Math.floor(x * sx), py = Math.floor(y * sy);
        const idx = (py * id.width + px) * 4;
        out[y * targetW + x] = (id.data[idx] * 0.299 + id.data[idx+1] * 0.587 + id.data[idx+2] * 0.114) / 255;
      }
    }
    return { data: out, w: targetW, h: targetH };
  }

  function conv2d(src, kernel, ks) {
    // src: {data,w,h}  kernel: flat ks×ks Float32Array
    const { data, w, h } = src;
    const out = new Float32Array(w * h);
    const half = Math.floor(ks / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let ky = 0; ky < ks; ky++) {
          for (let kx = 0; kx < ks; kx++) {
            const sy = y + ky - half, sx = x + kx - half;
            if (sy >= 0 && sy < h && sx >= 0 && sx < w) {
              sum += data[sy * w + sx] * kernel[ky * ks + kx];
            }
          }
        }
        out[y * w + x] = sum;
      }
    }
    return { data: out, w, h };
  }

  function relu(src) {
    return { data: src.data.map(v => Math.max(0, v)), w: src.w, h: src.h };
  }

  function maxpool(src, size = 2, stride = 2) {
    const nw = Math.floor((src.w - size) / stride + 1);
    const nh = Math.floor((src.h - size) / stride + 1);
    const out = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let m = -Infinity;
        for (let py = 0; py < size; py++) {
          for (let px = 0; px < size; px++) {
            const v = src.data[(y*stride+py)*src.w + (x*stride+px)] || 0;
            if (v > m) m = v;
          }
        }
        out[y * nw + x] = m;
      }
    }
    return { data: out, w: nw, h: nh };
  }

  // Predefined kernels — diverse filters
  const KERNELS_3x3 = [
    new Float32Array([0,-1,0,-1,4,-1,0,-1,0]),         // Laplacian
    new Float32Array([-1,-1,-1,0,0,0,1,1,1]),           // Sobel Y
    new Float32Array([-1,0,1,-2,0,2,-1,0,1]),           // Sobel X
    new Float32Array([0,0,0,-1,1,0,0,0,0]),             // Derivative X
    new Float32Array([1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9,1/9]), // Blur
    new Float32Array([2,-1,-1,-1,2,-1,-1,-1,2]),        // Sharpening diagonal
    new Float32Array([0,1,0,1,-4,1,0,1,0]),             // Edge detect
    new Float32Array([-1,-2,-1,0,0,0,1,2,1]),           // Prewitt Y
    new Float32Array([1,0,-1,2,0,-2,1,0,-1]),           // Prewitt X
    new Float32Array([0,-1,0,-1,5,-1,0,-1,0]),          // Sharpen
    new Float32Array([1,1,1,1,1,1,1,1,1]).map(v=>v/9), // Average
    new Float32Array([-2,-1,0,-1,1,1,0,1,2]),           // Emboss
  ];

  // Simulate pipeline and get intermediate feature maps
  function simulatePipeline(id, archName) {
    const size32 = imgDataToGrayscale(id, 32, 32);
    const steps  = [];

    // Step 0: input
    steps.push({ name:'Input', shape:`224×224×3`, data:size32, desc:'Gambar asli di-resize ke 32×32 untuk visualisasi. Pipeline nyata menggunakan resolusi penuh.' });

    // Step 1: 6 filter conv
    const conv1Maps = KERNELS_3x3.slice(0,6).map((k,i) => conv2d(size32, k, 3));
    const conv1Relu = conv1Maps.map(relu);
    steps.push({ name:'Conv 3×3 (6 filters)', shape:`30×30×6`, maps: conv1Relu, desc:'Konvolusi pertama mengekstrak edge dan tekstur dasar menggunakan 6 filter berbeda.' });

    // Step 2: pool
    const pool1Maps = conv1Relu.map(m => maxpool(m, 2, 2));
    steps.push({ name:'MaxPool 2×2', shape:`15×15×6`, maps: pool1Maps, desc:'Max pooling mengurangi resolusi spasial 2×, mempertahankan fitur paling kuat.' });

    // Step 3: second conv
    const conv2Maps = pool1Maps.flatMap(m => KERNELS_3x3.slice(0,2).map(k => conv2d(m, k, 3)));
    const conv2Relu = conv2Maps.slice(0,12).map(relu);
    steps.push({ name:'Conv 3×3 (12 filters)', shape:`13×13×12`, maps: conv2Relu, desc:'Layer kedua menggabungkan fitur dari conv1. Pola lebih kompleks mulai muncul.' });

    // Step 4: pool 2
    const pool2Maps = conv2Relu.map(m => maxpool(m, 2, 2));
    steps.push({ name:'MaxPool 2×2', shape:`6×6×12`, maps: pool2Maps, desc:'Reduksi kedua. Setiap sel feature map kini merepresentasikan area 12×12 piksel asli.' });

    // Step 5: conv 3
    const conv3Maps = pool2Maps.slice(0,4).flatMap(m => KERNELS_3x3.slice(0,4).map(k => conv2d(m, k, 3)));
    const conv3Relu = conv3Maps.slice(0,16).map(relu);
    steps.push({ name:'Conv 3×3 (16 filters)', shape:`4×4×16`, maps: conv3Relu, desc:'Fitur abstrak tingkat tinggi. Satu neuron kini memiliki receptive field ~48×48 piksel asli.' });

    // Step 6: GAP
    const gapVals = conv3Relu.map(m => {
      const sum = m.data.reduce((a,v) => a+v, 0);
      return sum / m.data.length;
    });
    steps.push({ name:'Global Avg Pool', shape:`1×1×16`, gapVals, desc:'Global Average Pooling merata-ratakan setiap feature map menjadi satu nilai. Output: vektor 16 dimensi.' });

    return steps;
  }

  // ── Draw feature map to canvas ─────────────────────────────
  function drawFM(canvas, fm, sz = 52) {
    canvas.width = sz; canvas.height = sz;
    const ctx = canvas.getContext('2d');
    const d   = fm.data;
    const w   = fm.w, h = fm.h;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < d.length; i++) { if (d[i] < mn) mn = d[i]; if (d[i] > mx) mx = d[i]; }
    const rng = (mx - mn) || 1;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < d.length; i++) {
      const v = Math.round(((d[i] - mn) / rng) * 255);
      img.data[i*4]   = v;
      img.data[i*4+1] = v;
      img.data[i*4+2] = v;
      img.data[i*4+3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, sz, sz);
  }

  function drawGrayscale(canvas, src, sz = 52) {
    drawFM(canvas, src, sz);
  }

  // ── Show feature maps for selected layer step ──────────────
  function showFeatureMaps(stepIdx) {
    if (!tfSteps.length) return;
    const step = tfSteps[Math.min(stepIdx, tfSteps.length-1)];
    fmGrid.innerHTML = '';

    if (step.maps) {
      step.maps.forEach((m, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'fm-item';
        const c = document.createElement('canvas');
        c.className = 'fm-canvas';
        drawFM(c, m, 52);
        const lbl = document.createElement('div');
        lbl.className = 'fm-label';
        lbl.textContent = `ch ${i+1}`;
        wrap.append(c, lbl);
        fmGrid.appendChild(wrap);
      });
    } else if (step.gapVals) {
      step.gapVals.forEach((v, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'fm-item';
        const c = document.createElement('canvas');
        c.className = 'fm-canvas';
        c.width = 52; c.height = 52;
        const ctx = c.getContext('2d');
        const brightness = Math.round(Math.max(0, Math.min(1, v)) * 200 + 30);
        ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
        ctx.fillRect(0, 0, 52, 52);
        ctx.fillStyle = `rgba(41,151,255,.6)`;
        const barH = Math.round(v * 52);
        ctx.fillRect(10, 52-barH, 32, barH);
        const lbl = document.createElement('div');
        lbl.className = 'fm-label';
        lbl.textContent = v.toFixed(3);
        wrap.append(c, lbl);
        fmGrid.appendChild(wrap);
      });
    } else if (step.data) {
      // input
      const wrap = document.createElement('div');
      wrap.className = 'fm-item';
      const c = document.createElement('canvas');
      c.className = 'fm-canvas';
      drawGrayscale(c, step.data, 52);
      const lbl = document.createElement('div');
      lbl.className = 'fm-label';
      lbl.textContent = 'input';
      wrap.append(c, lbl);
      fmGrid.appendChild(wrap);
    }

    if (fmInfo) {
      fmInfo.style.display = 'flex';
      fmInfo.innerHTML = `<span class="fli-item">Layer: <strong>${step.name}</strong></span><span class="fli-item">Shape: <strong>${step.shape}</strong></span><span class="fli-item">${step.desc.substring(0,80)}...</span>`;
    }
    if (rtTitle) rtTitle.textContent = step.name;
    if (rtSub) rtSub.textContent = step.shape;
  }

  // ── Run pipeline ───────────────────────────────────────────
  runBtn && runBtn.addEventListener('click', () => {
    if (!imgData) return;
    runBtn.classList.add('running');
    runLabel.textContent = '⏳ Processing...';
    runBtn.disabled = true;

    setTimeout(() => {
      tfSteps = simulatePipeline(imgData, selArch ? selArch.value : 'resnet50');
      showFeatureMaps(currentLayerIdx);
      buildTensorFlow();
      runBtn.classList.remove('running');
      runLabel.textContent = '▶ Re-process';
      runBtn.disabled = false;
    }, 60);
  });

  // ── Tensor flow step display ───────────────────────────────
  function buildTensorFlow() {
    if (!tfFlow || !tfSteps.length) return;
    tfFlow.innerHTML = '';
    tfCurrent = 0;

    tfSteps.forEach((step, i) => {
      const div = document.createElement('div');
      div.className = 'tf-step' + (i === 0 ? ' active' : '');
      div.id = `tf-step-${i}`;

      const header = document.createElement('div');
      header.className = 'tf-step-header';
      header.innerHTML = `<div class="tf-step-num">${i+1}</div><div class="tf-step-title">${step.name}</div><div class="tf-step-shape">${step.shape}</div>`;

      const desc = document.createElement('div');
      desc.className = 'tf-step-desc';
      desc.textContent = step.desc;

      const canvases = document.createElement('div');
      canvases.className = 'tf-step-canvases';
      const previewMaps = step.maps ? step.maps.slice(0,6) : step.data ? [step.data] : [];
      previewMaps.forEach(m => {
        const c = document.createElement('canvas');
        c.style.width = c.style.height = '40px';
        drawFM(c, m, 40);
        canvases.appendChild(c);
      });
      if (step.gapVals) {
        const c = document.createElement('canvas');
        c.style.width = '120px'; c.style.height = '40px';
        c.width = 120; c.height = 40;
        const ctx = c.getContext('2d');
        step.gapVals.forEach((v, idx) => {
          const x = idx * (120/step.gapVals.length);
          const w2 = (120/step.gapVals.length) - 1;
          const bh = Math.max(2, v * 36);
          ctx.fillStyle = '#2997ff88';
          ctx.fillRect(x, 40-bh, w2, bh);
        });
        canvases.appendChild(c);
      }

      div.append(header, desc, canvases);
      tfFlow.appendChild(div);
    });

    if (tfControls) tfControls.style.display = 'flex';
    updateTFIndicator();
  }

  function updateTFIndicator() {
    const ind = document.getElementById('tfStepIndicator');
    if (ind) ind.textContent = `Step ${tfCurrent+1} / ${tfSteps.length}`;
  }

  function goToStep(i) {
    const steps = tfFlow.querySelectorAll('.tf-step');
    steps.forEach(s => s.classList.remove('active'));
    tfCurrent = Math.max(0, Math.min(tfSteps.length-1, i));
    if (steps[tfCurrent]) steps[tfCurrent].classList.add('active');
    updateTFIndicator();
    showFeatureMaps(tfCurrent);
    // sync layer button
    if (layerBtns) {
      const btns = layerBtns.querySelectorAll('.up-layer-btn');
      btns.forEach((b,idx) => b.classList.toggle('active', idx === tfCurrent));
    }
  }

  document.getElementById('tfPrev')?.addEventListener('click', () => { clearAuto(); goToStep(tfCurrent - 1); });
  document.getElementById('tfNext')?.addEventListener('click', () => { clearAuto(); goToStep(tfCurrent + 1); });
  document.getElementById('tfPlay')?.addEventListener('click', function() {
    if (autoplayTimer) { clearAuto(); this.textContent = '▶ Auto-play'; return; }
    this.textContent = '⏸ Pause';
    autoplayTimer = setInterval(() => {
      if (tfCurrent < tfSteps.length - 1) { goToStep(tfCurrent + 1); }
      else { clearAuto(); document.getElementById('tfPlay').textContent = '▶ Auto-play'; }
    }, 1400);
  });

  function clearAuto() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }

  buildLayerButtons();
})();


/* ─────────────────────────────────────────────────────────────
   8b. ARCHITECTURE COMPARISON CHART (sec-compare)
───────────────────────────────────────────────────────────── */
(function () {
  const tabs   = document.querySelectorAll('#acTabs .ac-tab');
  const chart  = document.getElementById('acChart');
  if (!tabs.length || !chart) return;

  const ARCHS = [
    { name:'AlexNet',          params:60,   flops:0.7,  latency:null, acc:56.5, color:'#6e6e73' },
    { name:'VGG-16',           params:138,  flops:15.5, latency:50,   acc:71.6, color:'#ff3b30' },
    { name:'ResNet-50',        params:25.6, flops:4.1,  latency:25,   acc:76.0, color:'#2997ff' },
    { name:'ResNet-101',       params:44.5, flops:7.8,  latency:40,   acc:77.4, color:'#2997ff' },
    { name:'MobileNetV2',      params:3.4,  flops:0.3,  latency:6,    acc:72.0, color:'#34c759' },
    { name:'EfficientNet-B0',  params:5.3,  flops:0.4,  latency:8,    acc:77.1, color:'#a855f7' },
    { name:'EfficientNet-B4',  params:19,   flops:4.2,  latency:25,   acc:82.9, color:'#a855f7' },
    { name:'EfficientNet-B7',  params:66,   flops:37,   latency:160,  acc:84.4, color:'#ff9f0a' },
  ];

  const UNIT = { params:'M', flops:'B', latency:'ms' };

  let current = 'params';

  function render(metric) {
    const vals  = ARCHS.map(a => a[metric] || 0);
    const maxVal = Math.max(...vals, 0.001);
    chart.innerHTML = ARCHS.map(a => {
      const v   = a[metric];
      const pct = v ? Math.max(1, (v / maxVal * 100)).toFixed(1) : 0;
      const txt = v ? `${v}${UNIT[metric]}` : '—';
      return `<div class="ac-row">
        <span class="ac-model">${a.name}</span>
        <div class="ac-bar-wrap">
          <div class="ac-bar" style="width:${pct}%;background:${a.color}"></div>
        </div>
        <span class="ac-metric">${txt}</span>
        <span class="ac-acc">${a.acc}%</span>
      </div>`;
    }).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      current = tab.dataset.metric;
      render(current);
    });
  });

  render(current);
})();


/* ─────────────────────────────────────────────────────────────
   9. BACKBONE RECOMMENDER
───────────────────────────────────────────────────────────── */
(function () {
  const qEl = document.getElementById('bcQuestions');
  const rEl = document.getElementById('bcResult');
  if (!qEl) return;

  const Qs = [
    { id:'deploy',   q:'Di mana model di-deploy?',
      opts:[{v:'mobile',l:'📱 Mobile / Edge'},{v:'server',l:'☁️ Server / Cloud'},{v:'offline',l:'💻 Offline / Batch'}] },
    { id:'priority', q:'Prioritas utama?',
      opts:[{v:'speed',l:'⚡ Kecepatan'},{v:'accuracy',l:'🎯 Akurasi'},{v:'balance',l:'⚖️ Seimbang'}] },
    { id:'task',     q:'Tipe task?',
      opts:[{v:'classify',l:'🏷️ Klasifikasi'},{v:'detect',l:'🔍 Detection'},{v:'segment',l:'🖼️ Segmentasi'}] },
  ];

  const RECS = {
    'mobile+speed+classify':   {m:'MobileNetV3-Small',  r:'2.5M params, &lt;5ms CPU. Terkecil dan tercepat untuk klasifikasi mobile.'},
    'mobile+accuracy+classify':{m:'EfficientNet-B0',    r:'5.3M params, 77.1% acc. Terbaik untuk akurasi tinggi di mobile.'},
    'mobile+balance+classify': {m:'MobileNetV2',        r:'3.4M params, 72.0% acc. Ekosistem terlengkap, TFLite siap pakai.'},
    'mobile+speed+detect':     {m:'MobileNet + SSDLite',r:'Kombinasi terbaik real-time detection di mobile, ~100ms.'},
    'mobile+accuracy+detect':  {m:'EfficientDet-D0',    r:'mAP 33.8, FLOPS terendah di EfficientDet family.'},
    'mobile+balance+detect':   {m:'YOLOv8-nano',        r:'Cepat, akurat, mudah deploy ke mobile.'},
    'server+speed+classify':   {m:'ResNet-50',          r:'25.6M params, ~25ms, ekosistem besar, solid di production.'},
    'server+accuracy+classify':{m:'EfficientNet-B4',    r:'19M params, 82.9% acc. Sweet spot terbaik accuracy/efficiency.'},
    'server+balance+classify': {m:'ResNet-50',          r:'Standar industri. Stabil, banyak pretrained weight tersedia.'},
    'server+speed+detect':     {m:'ResNet-50 + FPN',    r:'Default Detectron2 & MMDet. Cepat dan proven di COCO.'},
    'server+accuracy+detect':  {m:'ResNet-101 + FPN',   r:'mAP lebih tinggi dari R50 untuk latency yang masih wajar.'},
    'server+balance+detect':   {m:'ResNet-50 + FPN',    r:'Ekosistem terlengkap, pretrained COCO di semua framework.'},
    'offline+speed+classify':  {m:'EfficientNet-B0',    r:'Cepat dan akurat untuk batch processing, throughput tinggi.'},
    'offline+accuracy+classify':{m:'EfficientNet-B7',   r:'84.4% Top-1, SOTA ImageNet. Latency tidak masalah untuk batch.'},
    'offline+balance+classify' :{m:'EfficientNet-B4',   r:'Best point di accuracy/compute tradeoff curve.'},
    'offline+speed+detect':    {m:'ResNet-50 + FPN',    r:'Throughput tinggi untuk batch detection offline.'},
    'offline+accuracy+detect': {m:'EfficientDet-D7',    r:'55.1 COCO mAP, terbaik untuk akurasi maximum.'},
    'offline+balance+detect':  {m:'ResNet-101 + FPN',   r:'mAP bagus, throughput masih tinggi untuk batch processing.'},
    'mobile+speed+segment':    {m:'MobileNet + DeepLab',r:'Segmentasi ringan untuk mobile dengan DeepLabV3.'},
    'mobile+accuracy+segment': {m:'EfficientNet-B0 + FPN',r:'Segmentasi akurat di mobile dengan backbone efisien.'},
    'mobile+balance+segment':  {m:'MobileNetV2 + DeepLab',r:'Balance terbaik ukuran dan akurasi untuk segmentasi mobile.'},
    'server+speed+segment':    {m:'ResNet-50 + FPN + Mask',r:'Mask R-CNN standar, ~5fps real-time dengan GPU.'},
    'server+accuracy+segment': {m:'ResNet-101 + FPN + Mask',r:'Lebih akurat dari R50 untuk segmentasi detail tinggi.'},
    'server+balance+segment':  {m:'ResNet-50 + FPN + Mask',r:'Default paling banyak dipakai, pretrained COCO tersedia.'},
    'offline+speed+segment':   {m:'ResNet-50 + FPN + Mask',r:'Throughput solid untuk batch segmentation.'},
    'offline+accuracy+segment':{m:'ResNet-101 + FPN + Mask',r:'Akurasi tinggi untuk dataset segmentasi kualitas tinggi.'},
    'offline+balance+segment': {m:'ResNet-50 + FPN + Mask',r:'Proven, pretrained COCO, ekosistem MMDetection lengkap.'},
  };

  const answers = {};
  function render() {
    qEl.innerHTML = '';
    Qs.forEach(q => {
      const div = document.createElement('div');
      div.innerHTML = `<div class="bc-q">${q.q}</div>`;
      const opts = document.createElement('div');
      opts.className = 'bc-opts';
      q.opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'bc-opt' + (answers[q.id] === o.v ? ' selected' : '');
        btn.textContent = o.l;
        btn.addEventListener('click', () => { answers[q.id] = o.v; render(); });
        opts.appendChild(btn);
      });
      div.appendChild(opts);
      qEl.appendChild(div);
    });
    if (Qs.every(q => answers[q.id])) {
      const key = Qs.map(q => answers[q.id]).join('+');
      const rec = RECS[key] || { m:'ResNet-50', r:'Pilihan aman sebagai starting point.' };
      rEl.style.display = 'block';
      rEl.innerHTML = `
        <div class="bc-result-title">✅ Rekomendasi untuk kamu</div>
        <div class="bc-result-model">${rec.m}</div>
        <div class="bc-result-reason">${rec.r}</div>
        <button class="bc-reset">↺ Reset</button>`;
    } else {
      rEl.style.display = 'none';
    }
  }
  document.addEventListener('click', e => { if (e.target.classList.contains('bc-reset')) { Object.keys(answers).forEach(k => delete answers[k]); render(); }});
  render();
})();


/* ─────────────────────────────────────────────────────────────
   10. SCROLL REVEAL + PREV/NEXT
───────────────────────────────────────────────────────────── */
(function () {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; io.unobserve(e.target); }
  }), { threshold: 0.06 });
  document.querySelectorAll('.lesson-sec, .worked-box, .prop-card, .calc-step').forEach(el => {
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(14px)';
    io.observe(el);
  });
})();

(function () {
  const secs = Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const labels = {
    'sec-builder':     'Architecture Builder',
    'sec-resnet':      'ResNet Deep Dive',
    'sec-efficientnet':'EfficientNet Scaling',
    'sec-upload':      'Upload & Visualize',
    'sec-choose':      'Pilih Backbone',
  };
  secs.forEach((sec, i) => {
    const nav = document.createElement('div');
    nav.className = 'sec-nav-buttons';
    function makeBtn(target, dir) {
      const btn = document.createElement('a');
      btn.className = `sec-nav-btn ${dir}`;
      btn.href = '#' + target.id;
      const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">${dir==='prev'?'<path d="M10 3L5 8l5 5"/>':'<path d="M6 3l5 5-5 5"/>'}</svg>`;
      btn.innerHTML = dir === 'prev' ? `${arrow} ${labels[target.id]||'Prev'}` : `${labels[target.id]||'Next'} ${arrow}`;
      btn.addEventListener('click', e => { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); });
      return btn;
    }
    nav.appendChild(secs[i-1] ? makeBtn(secs[i-1],'prev') : document.createElement('span'));
    if (secs[i+1]) nav.appendChild(makeBtn(secs[i+1],'next'));
    sec.appendChild(nav);
  });
})();