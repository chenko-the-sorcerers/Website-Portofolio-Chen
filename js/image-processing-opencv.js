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

/* ── 5. imread canvas demo ───────────────────────────────────── */
(function () {
  const canvas = document.getElementById('imreadCanvas');
  if (!canvas) return;
  const W = 240, H = 180;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const id  = ctx.createImageData(W, H);

  // Generate a vivid synthetic "photo" (gradient + noise)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const nx = x / W, ny = y / H;
    // Gradient base
    const R = Math.round(40  + 180 * nx + 20 * Math.sin(ny * 8));
    const G = Math.round(60  + 120 * ny + 30 * Math.cos(nx * 6));
    const B = Math.round(100 + 100 * (1 - nx) + 40 * Math.sin((nx + ny) * 5));
    id.data[i]   = Math.min(255, Math.max(0, R));
    id.data[i+1] = Math.min(255, Math.max(0, G));
    id.data[i+2] = Math.min(255, Math.max(0, B));
    id.data[i+3] = 255;
  }
  ctx.putImageData(id, 0, 0);

  // Initial pixel info
  function updateInfo(px, py) {
    const i  = (py * W + px) * 4;
    const Rv = id.data[i], Gv = id.data[i+1], Bv = id.data[i+2];
    // OpenCV is BGR
    const s = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
    s('imdPixel', `[${Bv}, ${Gv}, ${Rv}]`);
    const setBar = (barId, numId, val) => {
      const b = document.getElementById(barId), n = document.getElementById(numId);
      if(b) b.style.width = (val/255*100)+'%';
      if(n) n.textContent = val;
    };
    setBar('barB', 'numB', Bv);
    setBar('barG', 'numG', Gv);
    setBar('barR', 'numR', Rv);
  }

  function getCoords(cx, cy) {
    const r  = canvas.getBoundingClientRect();
    const px = Math.min(W-1, Math.floor((cx - r.left) * (W / r.width)));
    const py = Math.min(H-1, Math.floor((cy - r.top)  * (H / r.height)));
    return {px, py};
  }

  canvas.addEventListener('mousemove', e => {
    const {px, py} = getCoords(e.clientX, e.clientY);
    updateInfo(px, py);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const {px, py} = getCoords(e.touches[0].clientX, e.touches[0].clientY);
    updateInfo(px, py);
  }, { passive: false });

  updateInfo(120, 90);
})();

/* ── 6. Resize demo ─────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('resizeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const OW = 300, OH = 225;
  canvas.width = OW; canvas.height = OH;

  // Draw a colorful synthetic image
  const id = ctx.createImageData(OW, OH);
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    const i = (y * OW + x) * 4;
    id.data[i]   = Math.round(220 * (x/OW));
    id.data[i+1] = Math.round(180 * (y/OH) + 40 * Math.sin(x*.08));
    id.data[i+2] = Math.round(100 + 100 * Math.cos((x+y)*.04));
    id.data[i+3] = 255;
  }
  ctx.putImageData(id, 0, 0);

  window.updateResize = function () {
    const pct    = parseInt(document.getElementById('scaleSlider').value);
    const newW   = Math.round(OW * pct / 100);
    const newH   = Math.round(OH * pct / 100);
    const overlay = document.getElementById('resizeOverlay');
    const wrap    = document.querySelector('.resize-canvas-wrap');

    if (overlay && wrap) {
      const wW = wrap.offsetWidth;
      const wH = wrap.offsetHeight;
      const scaleX = (newW / OW) * 100;
      const scaleY = (newH / OH) * 100;
      overlay.style.borderWidth = pct < 100 ? '2px' : '0';
      // Simulate by showing a visual border indication
    }

    document.getElementById('scaleVal').textContent  = pct + '%';
    document.getElementById('rsOrig').textContent    = `${OW} × ${OH}`;
    document.getElementById('rsResult').textContent  = `${newW} × ${newH}`;
    document.getElementById('rsPixels').textContent  = (newW * newH).toLocaleString();
  };

  window.setInterp = function (btn) {
    document.querySelectorAll('.interp-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateResize();
  };

  updateResize();
})();

/* ── 7. Crop demo ───────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const CW = 320, CH = 240;
  canvas.width = CW; canvas.height = CH;

  // Draw synthetic background image
  const id = ctx.createImageData(CW, CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = (y * CW + x) * 4;
    id.data[i]   = Math.round(30 + 200 * (x/CW));
    id.data[i+1] = Math.round(80 + 120 * Math.sin(x*.03 + y*.04));
    id.data[i+2] = Math.round(180 - 150 * (y/CH));
    id.data[i+3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  const bgSnap = ctx.getImageData(0, 0, CW, CH);

  let dragging = false, sx = 0, sy = 0, ex = 0, ey = 0;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const cl = e.touches ? e.touches[0] : e;
    return {
      x: Math.min(CW-1, Math.max(0, Math.round((cl.clientX - r.left) * (CW / r.width)))),
      y: Math.min(CH-1, Math.max(0, Math.round((cl.clientY - r.top)  * (CH / r.height))))
    };
  }

  function drawBox() {
    ctx.putImageData(bgSnap, 0, 0);
    const x1 = Math.min(sx, ex), y1 = Math.min(sy, ey);
    const x2 = Math.max(sx, ex), y2 = Math.max(sy, ey);
    if (x2 - x1 < 5 || y2 - y1 < 5) return;
    ctx.save();
    ctx.strokeStyle = '#2997ff';
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x1, y1, x2-x1, y2-y1);
    ctx.fillStyle = 'rgba(41,151,255,.12)';
    ctx.fillRect(x1, y1, x2-x1, y2-y1);
    ctx.restore();
    // Update info
    document.getElementById('ccY1').textContent = y1;
    document.getElementById('ccY2').textContent = y2;
    document.getElementById('ccX1').textContent = x1;
    document.getElementById('ccX2').textContent = x2;
    document.getElementById('ccSlice').textContent = `${y1}:${y2}, ${x1}:${x2}`;
    document.getElementById('cropSizeInfo').textContent = `${x2-x1} × ${y2-y1} pixels`;
    document.getElementById('showROIBtn').style.display = 'inline-block';
    document.getElementById('resetCropBtn').style.display = 'inline-block';
  }

  canvas.addEventListener('mousedown', e => { dragging = true; const p = getPos(e); sx = p.x; sy = p.y; });
  canvas.addEventListener('mousemove', e => { if (!dragging) return; const p = getPos(e); ex = p.x; ey = p.y; drawBox(); });
  canvas.addEventListener('mouseup',   () => { dragging = false; });
  canvas.addEventListener('touchstart', e => { dragging = true; const p = getPos(e); sx = p.x; sy = p.y; }, { passive: true });
  canvas.addEventListener('touchmove',  e => { if (!dragging) return; const p = getPos(e); ex = p.x; ey = p.y; drawBox(); }, { passive: true });
  canvas.addEventListener('touchend',   () => { dragging = false; });

  window.showROI = function () {
    const x1 = Math.min(sx, ex), y1 = Math.min(sy, ey);
    const x2 = Math.max(sx, ex), y2 = Math.max(sy, ey);
    if (x2 - x1 < 5 || y2 - y1 < 5) return;
    const roi = ctx.getImageData(x1, y1, x2-x1, y2-y1);
    ctx.putImageData(bgSnap, 0, 0);
    // Draw dimmed background
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,15,.6)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.restore();
    // Draw ROI bright
    ctx.putImageData(roi, x1, y1);
    ctx.save();
    ctx.strokeStyle = '#34c759';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(x1, y1, x2-x1, y2-y1);
    ctx.restore();
  };

  window.resetCrop = function () {
    ctx.putImageData(bgSnap, 0, 0);
    sx = sy = ex = ey = 0;
    document.getElementById('ccY1').textContent = '—';
    document.getElementById('ccY2').textContent = '—';
    document.getElementById('ccX1').textContent = '—';
    document.getElementById('ccX2').textContent = '—';
    document.getElementById('ccSlice').textContent = '—:—, —:—';
    document.getElementById('cropSizeInfo').textContent = 'Draw a region on the image';
    document.getElementById('showROIBtn').style.display = 'none';
    document.getElementById('resetCropBtn').style.display = 'none';
  };
})();

/* ── 8. Flip demo ───────────────────────────────────────────── */
(function () {
  const src = document.getElementById('flipSrc');
  const dst = document.getElementById('flipDst');
  if (!src || !dst) return;
  const W = 200, H = 150;
  src.width = W; src.height = H;
  dst.width = W; dst.height = H;

  const srcCtx = src.getContext('2d');
  const dstCtx = dst.getContext('2d');

  // Draw a recognizable asymmetric image
  const id = srcCtx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    // Sky-like gradient top, ground bottom; arrow shape in middle
    const inArrow = (x > W*0.1 && x < W*0.5 && y > H*0.35 && y < H*0.65) ||
                    (x > W*0.5 && x < W*0.65 && y > H*0.2 && y < H*0.8);
    id.data[i]   = inArrow ? 41  : Math.round(10 + 180*(x/W));
    id.data[i+1] = inArrow ? 151 : Math.round(50 + 100*(1-y/H));
    id.data[i+2] = inArrow ? 255 : Math.round(80 + 80*(y/H));
    id.data[i+3] = 255;
  }
  // Draw text "L" in top-left as orientation marker
  for (let y = 10; y < 50; y++) for (let x = 10; x < 20; x++) {
    const i = (y * W + x) * 4;
    id.data[i] = 255; id.data[i+1] = 200; id.data[i+2] = 0; id.data[i+3] = 255;
  }
  for (let y = 45; y < 55; y++) for (let x = 10; x < 35; x++) {
    const i = (y * W + x) * 4;
    id.data[i] = 255; id.data[i+1] = 200; id.data[i+2] = 0; id.data[i+3] = 255;
  }
  srcCtx.putImageData(id, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, W, H);

  function flipData(data, mode) {
    const out = new Uint8ClampedArray(data.data.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4;
      let tx = x, ty = y;
      if (mode === 0 || mode === -1) ty = H - 1 - y;
      if (mode === 1 || mode === -1) tx = W - 1 - x;
      const di = (ty * W + tx) * 4;
      out[di] = data.data[si]; out[di+1] = data.data[si+1];
      out[di+2] = data.data[si+2]; out[di+3] = data.data[si+3];
    }
    return new ImageData(out, W, H);
  }

  function rotateData(data, angle) {
    const out  = new Uint8ClampedArray(data.data.length);
    const rad  = (angle * Math.PI) / 180;
    const cos  = Math.cos(rad), sin = Math.sin(rad);
    const cx   = W / 2, cy = H / 2;
    for (let dy = 0; dy < H; dy++) for (let dx = 0; dx < W; dx++) {
      const nx = (dx - cx) * cos + (dy - cy) * sin + cx;
      const ny = -(dx - cx) * sin + (dy - cy) * cos + cy;
      const si = (Math.round(ny) * W + Math.round(nx)) * 4;
      const di = (dy * W + dx) * 4;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        out[di] = data.data[si]; out[di+1] = data.data[si+1];
        out[di+2] = data.data[si+2]; out[di+3] = 255;
      }
    }
    return new ImageData(out, W, H);
  }

  window.applyFlip = function (btn, code) {
    document.querySelectorAll('.flip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const flipped = flipData(srcData, code);
    dstCtx.putImageData(flipped, 0, 0);
  };

  window.applyRotate = function (btn, deg) {
    document.querySelectorAll('.flip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    dstCtx.clearRect(0, 0, W, H);
    const rotated = rotateData(srcData, deg);
    dstCtx.putImageData(rotated, 0, 0);
  };

  // Default: vertical flip
  applyFlip(document.querySelector('.flip-btn.active'), 0);
})();

/* ── 9. Bitwise demo ────────────────────────────────────────── */
(function () {
  const canvA   = document.getElementById('bwA');
  const canvB   = document.getElementById('bwB');
  const canvRes = document.getElementById('bwResult');
  if (!canvA || !canvB || !canvRes) return;
  const S = 120;
  [canvA, canvB, canvRes].forEach(c => { c.width = S; c.height = S; });

  const ctxA = canvA.getContext('2d');
  const ctxB = canvB.getContext('2d');
  const ctxR = canvRes.getContext('2d');

  // Draw Image A: white rectangle on black
  const dataA = ctxA.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i  = (y * S + x) * 4;
    const on = (x > 10 && x < 80 && y > 10 && y < 80);
    dataA.data[i] = dataA.data[i+1] = dataA.data[i+2] = on ? 255 : 0;
    dataA.data[i+3] = 255;
  }
  ctxA.putImageData(dataA, 0, 0);

  // Draw Image B: white circle on black
  const dataB = ctxB.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i  = (y * S + x) * 4;
    const on = ((x-70)*(x-70) + (y-70)*(y-70)) <= 42*42;
    dataB.data[i] = dataB.data[i+1] = dataB.data[i+2] = on ? 255 : 0;
    dataB.data[i+3] = 255;
  }
  ctxB.putImageData(dataB, 0, 0);

  const descs = {
    and: 'AND: keeps pixels where BOTH images are white (255). Used to apply a binary mask.',
    or:  'OR: keeps pixels where EITHER image is white. Used to combine shapes.',
    xor: 'XOR: keeps pixels where images DIFFER. Useful for detecting changes between frames.',
    not: 'NOT (A): inverts Image A — white becomes black and vice versa. Used to invert a mask.'
  };

  window.updateBitwise = function () {
    const op   = document.getElementById('bwOpSelect').value;
    const res  = ctxR.createImageData(S, S);
    const lbl  = document.getElementById('bwResultLbl');
    const desc = document.getElementById('bwDesc');
    if (lbl) lbl.textContent = op.toUpperCase() + ' result';
    if (desc) desc.textContent = descs[op] || '';

    for (let i = 0; i < dataA.data.length; i += 4) {
      let v = 0;
      if      (op === 'and') v = dataA.data[i] & dataB.data[i];
      else if (op === 'or' ) v = dataA.data[i] | dataB.data[i];
      else if (op === 'xor') v = dataA.data[i] ^ dataB.data[i];
      else if (op === 'not') v = ~dataA.data[i] & 0xFF;
      res.data[i] = res.data[i+1] = res.data[i+2] = v;
      res.data[i+3] = 255;
    }
    ctxR.putImageData(res, 0, 0);
  };
  updateBitwise();
})();

/* ── 10. Pyodide ─────────────────────────────────────────────── */
let pyodideInstance = null;

async function initPyodide() {
  try {
    const py = await loadPyodide();
    await py.loadPackage('numpy');
    pyodideInstance = py;
    // Hide loading overlay
    const overlay = document.getElementById('pyLoading');
    if (overlay) overlay.style.display = 'none';
    // Update status
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
  if (!pyodideInstance) { if (outPre) { outPre.textContent = 'Python runtime not ready yet…'; outPre.closest('.output-wrap').style.display = 'block'; } return; }
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

/* ── challenge defaults ─────────────────────────────────────── */
const defaults = {
  1: `import numpy as np\n\n# Simulate what cv2.imread returns for a 480x640 color image\n# OpenCV stores as (height, width, channels) in BGR order\nimg = np.random.randint(0, 256, (___, ___, ___), dtype=np.uint8)\n\n# Print the shape\nprint("Shape:", img.shape)\n\n# Print the dtype\nprint("Dtype:", img.dtype)\n\n# Access the pixel at row=10, col=20 (returns [B, G, R])\npixel = img[___, ___]\nprint("Pixel [B,G,R]:", pixel)\n\n# How many total elements (pixels * channels)?\nprint("Total elements:", img.size)`,
  2: `import numpy as np\n\n# Simulate a 1080x1920 image (portrait phone photo)\nimg = np.zeros((1080, 1920, 3), dtype=np.uint8)\n\nh, w = img.shape[___]   # get height and width only\nprint(f"Original: {w} × {h}")\n\nTARGET_W = 512\n\n# Compute scale factor\nscale = ___ / ___        # target_width / original_width\n\n# Compute new height (preserve ratio)\nnew_h = int(___ * scale)\nnew_w = TARGET_W\n\nprint(f"Scale factor: {scale:.4f}")\nprint(f"Resized: {new_w} × {new_h}")\n\n# Verify ratio is preserved (should be equal)\norig_ratio = round(w / h, 4)\nnew_ratio  = round(new_w / new_h, 4)\nprint(f"Aspect ratio preserved: {orig_ratio == new_ratio}")`,
  3: `import numpy as np\n\n# 480x640 random image\nnp.random.seed(7)\nimg = np.random.randint(50, 200, (480, 640, 3), dtype=np.uint8)\n\nH, W = img.shape[:2]\ncy, cx = H // 2, W // 2   # center pixel\n\n# Crop 200×200 center (100px from center in each direction)\nroi = img[cy-___:cy+___, cx-___:cx+___]\nprint("ROI shape:", roi.shape)\n\n# Draw a white border on the TOP row of the ROI (set to 255)\n# Hint: the ROI is a view, so this modifies img directly\nroi[___, :] = 255    # top row\n\n# Verify: check the top-left pixel of the ROI\nprint("ROI top-left pixel:", roi[0, 0])\n\n# Also print mean pixel value of the roi\nprint("ROI mean:", round(float(roi.mean()), 2))`,
  4: `import numpy as np\n\nimg = np.array([\n    [[10, 20, 30], [40, 50, 60], [70, 80, 90]],\n    [[11, 21, 31], [41, 51, 61], [71, 81, 91]],\n    [[12, 22, 32], [42, 52, 62], [72, 82, 92]],\n], dtype=np.uint8)  # shape: (3, 3, 3)\n\n# Horizontal flip: reverse columns (axis=1)\n# Hint: img[:, ::-1] reverses columns\nh_flip = img[___, ___]\nprint("Horizontal flip top-left pixel:", h_flip[0, 0])\n\n# Vertical flip: reverse rows (axis=0)\n# Hint: img[::-1, :] reverses rows\nv_flip = img[___, ___]\nprint("Vertical flip top-left pixel:", v_flip[0, 0])\n\n# Both axes: reverse rows AND columns\nboth_flip = img[___, ___]\nprint("Both axes flip top-left pixel:", both_flip[0, 0])`,
  5: `import numpy as np\n\n# 100×100 image, all pixels = 200\nimg = np.full((100, 100, 3), 200, dtype=np.uint8)\n\n# Create a circular mask: 1 inside circle, 0 outside\n# Circle centered at (50,50) with radius 40\nmask = np.zeros((100, 100), dtype=np.uint8)\ny_coords, x_coords = np.ogrid[:100, :100]\ncircle = (x_coords - 50)**2 + (y_coords - 50)**2 <= 40**2\nmask[circle] = ___         # set inside circle to 255\n\n# Apply mask: keep pixels where mask=255, zero elsewhere\n# Replicate mask to 3 channels, then multiply\nmask_3ch = np.stack([___, ___, ___], axis=-1)   # shape (100,100,3)\nresult = img * (mask_3ch // 255)\n\n# Verify: corner pixel (0,0) should be 0 (outside circle)\nprint("Corner pixel:", result[0, 0])\n\n# Verify: center pixel (50,50) should be [200,200,200] (inside)\nprint("Center pixel:", result[50, 50])\n\n# Count how many pixels are inside (non-zero)\ninside_count = np.count_nonzero(result[:,:,0])\nprint("Pixels inside circle:", inside_count)`,
};

window.runChallenge = async function(edId, outId, checkId) {
  const code  = document.getElementById(edId).value;
  const outEl = document.getElementById(outId + '-pre');
  const chkEl = document.getElementById(checkId);

  const checks = {
    'check-1': (o) => {
      const pass = o.includes('(480, 640, 3)') && o.includes('uint8') && o.includes('921600');
      return { pass, msg: pass ? '✅ Correct! Shape (480,640,3), dtype uint8, size 921600.' : '❌ Check shape=(480,640,3), dtype=uint8, and total elements=921600.' };
    },
    'check-2': (o) => {
      const pass = o.includes('512 × 288') && o.includes('0.2667') && o.includes('True');
      return { pass, msg: pass ? '✅ Correct! Scale=0.2667, target 512×288.' : '❌ Scale factor should be 512/1920 ≈ 0.2667, new size 512×288.' };
    },
    'check-3': (o) => {
      const pass = o.includes('(200, 200, 3)') && o.includes('[255 255 255]');
      return { pass, msg: pass ? '✅ Correct! ROI is 200×200 and top row is white.' : '❌ Use [cy-100:cy+100, cx-100:cx+100]. Top row set to 255 → [255 255 255].' };
    },
    'check-4': (o) => {
      const pass = o.includes('[70 80 90]') && o.includes('[12 22 32]') && o.includes('[72 82 92]');
      return { pass, msg: pass ? '✅ Correct! Horizontal=[70,80,90], Vertical=[12,22,32], Both=[72,82,92].' : '❌ h_flip=img[:,  ::-1], v_flip=img[::-1,  :], both=img[::-1, ::-1].' };
    },
    'check-5': (o) => {
      const pass = o.includes('[0 0 0]') && o.includes('[200 200 200]') && o.includes('5017');
      return { pass, msg: pass ? '✅ Correct! Corner=0, center=200, inside=5017 pixels.' : '❌ mask[circle]=255, stack mask 3 times, multiply by mask//255.' };
    },
    'cq-1-check': (o) => {
      const pass = o.includes('(360, 640, 3)');
      return { pass, msg: pass ? '✅ Fixed! cv2.resize takes (width, height) → (640, 360).' : '❌ Swap to (640, 360). cv2.resize wants (width, height).' };
    },
    'cq-2-check': (o) => {
      const pass = o.includes('(100, 150, 3)') && o.includes('127.19');
      return { pass, msg: pass ? '✅ Correct! Bottom-right quadrant is (100, 150, 3).' : '❌ Use img[H//2:, W//2:] for bottom-right quadrant.' };
    },
    'cq-3-check': (o) => {
      const pass = o.includes('(100, 100, 3)') && o.includes('[0 0 0]');
      return { pass, msg: pass ? '✅ Pipeline complete! All steps correct.' : '❌ Step 1: img[0::2, 0::2]. Step 2: full slice. Step 3: [:, ::-1]. Step 4: zero rows 0:10.' };
    },
  };

  await runCode(code, outEl, chkEl, checks[checkId]);
  // Show final score if all coding quizzes done
  checkFinalScore();
};

window.toggleHint = function(hintId) {
  const el = document.getElementById(hintId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.resetChallenge = function(edId, num) {
  if (defaults[num]) document.getElementById(edId).value = defaults[num];
};

/* ── Quiz data ───────────────────────────────────────────────── */
const quizData = [
  {
    q: 'What does cv2.imread() return when a file is not found?',
    opts: ['It raises a FileNotFoundError', 'It returns None', 'It returns an empty array', 'It returns -1'],
    correct: 1,
    fb: 'cv2.imread() silently returns None on failure — no exception is raised. Always check: if img is None: raise FileNotFoundError(...)'
  },
  {
    q: 'You have an image img with shape (480, 640, 3). What is the correct call to resize it to width=320, height=240 using cv2?',
    opts: ['cv2.resize(img, (480, 640))', 'cv2.resize(img, (240, 320))', 'cv2.resize(img, (320, 240))', 'cv2.resize(img, (640, 480))'],
    correct: 2,
    fb: 'cv2.resize takes (width, height) — the opposite of NumPy shape order (height, width). So (320, 240) = width 320, height 240.'
  },
  {
    q: 'What does roi = img[50:150, 100:300] produce?',
    opts: ['A copy of rows 100-300 and columns 50-150', 'A view of rows 50-150 and columns 100-300', 'A copy of columns 50-150 and rows 100-300', 'An error — this syntax is invalid'],
    correct: 1,
    fb: 'img[y1:y2, x1:x2] — rows (y) first, then columns (x). NumPy slices return views, not copies. Use .copy() to get an independent array.'
  },
  {
    q: 'Which cv2.flip() flipCode rotates the image 180°?',
    opts: ['flipCode = 0 (vertical)', 'flipCode = 1 (horizontal)', 'flipCode = -1 (both axes)', 'flipCode = 2'],
    correct: 2,
    fb: '-1 flips both axes simultaneously, equivalent to a 180° rotation. 0 = vertical only, 1 = horizontal only.'
  },
  {
    q: 'When would you use cv2.bitwise_and(img, img, mask=mask)?',
    opts: ['To add two images together', 'To keep only the pixels where mask=255 and zero out the rest', 'To subtract the mask from the image', 'To invert the image colors'],
    correct: 1,
    fb: 'bitwise_and with a mask zeroes pixels where mask=0 and preserves pixels where mask=255. This is the core operation for masking in computer vision pipelines.'
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
    div.innerHTML = `
      <div class="quiz-q-num">Question ${qi+1} of ${quizData.length}</div>
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-opts">
        ${q.opts.map((o, oi) => `
          <button class="quiz-opt" onclick="answerQuiz(${qi},${oi})" id="qopt-${qi}-${oi}">
            <span class="quiz-opt-badge">${String.fromCharCode(65+oi)}</span>
            ${o}
          </button>`).join('')}
      </div>
      <div class="quiz-feedback" id="qfb-${qi}"></div>
    `;
    container.appendChild(div);
  });
})();

window.answerQuiz = function(qi, oi) {
  if (quizAnswered[qi]) return;
  quizAnswered[qi] = true;
  const q   = quizData[qi];
  const fb  = document.getElementById(`qfb-${qi}`);
  const all = document.querySelectorAll(`[id^="qopt-${qi}-"]`);

  all.forEach(btn => { btn.disabled = true; });
  const correct = oi === q.correct;
  if (correct) quizScore++;

  document.getElementById(`qopt-${qi}-${oi}`).classList.add(correct ? 'correct' : 'wrong');
  document.getElementById(`qopt-${qi}-${q.correct}`).classList.add('correct');
  all.forEach((btn, i) => {
    if (i !== oi && i !== q.correct) btn.classList.add('muted');
  });

  if (fb) {
    fb.textContent = (correct ? '✅ ' : '❌ ') + q.fb;
    fb.className   = 'quiz-feedback show ' + (correct ? 'ok' : 'bad');
  }

  checkFinalScore();
};

function checkFinalScore() {
  const totalQ     = quizData.length;
  const answered   = Object.keys(quizAnswered).length;
  const cq1Done    = document.getElementById('cq-1-check')?.classList.contains('show');
  const cq2Done    = document.getElementById('cq-2-check')?.classList.contains('show');
  const cq3Done    = document.getElementById('cq-3-check')?.classList.contains('show');
  const codingDone = cq1Done && cq2Done && cq3Done;
  if (answered < totalQ || !codingDone) return;

  const cq1Pass = document.getElementById('cq-1-check')?.classList.contains('pass');
  const cq2Pass = document.getElementById('cq-2-check')?.classList.contains('pass');
  const cq3Pass = document.getElementById('cq-3-check')?.classList.contains('pass');
  const codingScore = [cq1Pass, cq2Pass, cq3Pass].filter(Boolean).length;
  const total       = quizScore + codingScore;
  const max         = totalQ + 3;

  const fsEl  = document.getElementById('finalScore');
  const fsScores = document.getElementById('fsScores');
  const fsMsg    = document.getElementById('fsMsg');
  const nlEl     = document.getElementById('nextLesson');

  if (fsEl) {
    fsEl.style.display = 'block';
    fsScores.innerHTML = `
      <div class="fs-score-item"><div class="fs-score-num">${quizScore}/${totalQ}</div><div class="fs-score-lbl">Theory</div></div>
      <div class="fs-score-divider"></div>
      <div class="fs-score-item"><div class="fs-score-num">${codingScore}/3</div><div class="fs-score-lbl">Coding</div></div>
      <div class="fs-score-divider"></div>
      <div class="fs-score-item"><div class="fs-score-num">${total}/${max}</div><div class="fs-score-lbl">Total</div></div>
    `;
    const pct = Math.round((total/max)*100);
    fsMsg.textContent = pct >= 80
      ? '🎉 Excellent! You\'ve mastered OpenCV basics. Ready for Filtering & Kernels!'
      : pct >= 60
        ? '👍 Good work! Review the incorrect answers before moving on.'
        : '💪 Keep practicing! Re-read the sections and try again.';
    fsEl.style.display = 'block';
  }

  if (nlEl && total >= Math.ceil(max * 0.6)) {
    nlEl.style.display = 'block';
  }
}

/* ── Coding quiz resets ─────────────────────────────────────── */
const cqDefaults = {
  1: `import numpy as np\n\nimg = np.zeros((1080, 1920, 3), dtype=np.uint8)\n\n# BUG: dimensions are (height, width) but cv2.resize needs (width, height)\n# Fix the tuple below\ntarget = (360, 640)  # WRONG ORDER — fix this\n\n# Simulate resize by simply slicing (no cv2 in playground)\nnew_h, new_w = target  # after fix this should be new_h=360, new_w=640\nresult = np.zeros((new_h, new_w, 3), dtype=np.uint8)\n\nprint("Result shape:", result.shape)\nprint("Expected: (360, 640, 3)")`,
  2: `import numpy as np\n\nnp.random.seed(99)\nimg = np.random.randint(0, 256, (200, 300, 3), dtype=np.uint8)\n\nH, W = img.shape[:2]\n\n# Crop the bottom-right quadrant\n# Rows: from H//2 to end, Cols: from W//2 to end\nroi = img[___:___, ___:___]\n\nprint("ROI shape:", roi.shape)            # should be (100, 150, 3)\nprint("ROI mean:", round(float(roi.mean()), 2))  # some value ~127\nprint("ROI min:", int(roi.min()))\nprint("ROI max:", int(roi.max()))`,
  3: `import numpy as np\n\nnp.random.seed(42)\nimg = np.random.randint(0, 256, (200, 200, 3), dtype=np.uint8)\n\n# Step 1: Resize to 50% via sub-sampling\nstep1 = img[___::2, ___::2]       # take every 2nd row and col from start\nprint("After resize:", step1.shape)\n\n# Step 2: Crop top-left 100×100\nstep2 = step1[___:___, ___:___]\nprint("After crop:", step2.shape)\n\n# Step 3: Horizontal flip\nstep3 = step2[___, ___]\nprint("After flip:", step3.shape)\n\n# Step 4: Zero-out top 10 rows\nstep4 = step3.copy()\nstep4[___:___, :] = 0\nprint("Top-left after zeroing:", step4[0, 0])\nprint("Row 10 pixel:", step4[10, 0])`,
};

window.resetCodingQuiz = function(num) {
  const editors = { 1:'cq-1-editor', 2:'cq-2-editor', 3:'cq-3-editor' };
  const ed = document.getElementById(editors[num]);
  if (ed && cqDefaults[num]) ed.value = cqDefaults[num];
};

/* ── Playground ─────────────────────────────────────────────── */
const playgroundSnippets = {
  imread:  `import numpy as np\n\n# Simulate cv2.imread result\nimg = np.random.randint(0, 256, (480, 640, 3), dtype=np.uint8)\nprint("Shape:", img.shape)       # (height, width, channels)\nprint("Dtype:", img.dtype)       # uint8\nprint("Size:", img.size)         # 480*640*3\nprint("Pixel [0,0]:", img[0,0]) # [B, G, R] values\n\n# Simulate cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\ngray = (0.114*img[:,:,0] + 0.587*img[:,:,1] + 0.299*img[:,:,2]).astype(np.uint8)\nprint("Gray shape:", gray.shape)\nprint("Gray pixel [0,0]:", gray[0,0])`,
  resize:  `import numpy as np\n\nimg = np.zeros((1080, 1920, 3), dtype=np.uint8)\nh, w = img.shape[:2]\nprint(f"Original: {w} x {h}")\n\n# Scale to 50%\nscale = 0.5\nnew_w = int(w * scale)\nnew_h = int(h * scale)\nprint(f"50% size: {new_w} x {new_h}")\n\n# Preserve aspect ratio to target width 800\ntarget_w = 800\nscale_ar = target_w / w\nnew_h_ar = int(h * scale_ar)\nprint(f"AR-preserved to w=800: {target_w} x {new_h_ar}")\nprint(f"Aspect ratios same: {round(w/h,4) == round(target_w/new_h_ar,4)}")`,
  crop:    `import numpy as np\n\nnp.random.seed(0)\nimg = np.random.randint(0, 256, (600, 800, 3), dtype=np.uint8)\nh, w = img.shape[:2]\n\n# Basic crop (top-left region)\ntl = img[0:200, 0:300]\nprint("Top-left crop:", tl.shape)\n\n# Center crop 300x300\ncy, cx = h//2, w//2\ncenter = img[cy-150:cy+150, cx-150:cx+150]\nprint("Center crop:", center.shape)\n\n# Crop via bounding box [x, y, bw, bh]\nbx, by, bw, bh = 100, 50, 400, 300\nbbox_roi = img[by:by+bh, bx:bx+bw]\nprint("Bbox crop:", bbox_roi.shape)\n\n# Check: view vs copy\nroi_view = img[0:100, 0:100]\nroi_copy = img[0:100, 0:100].copy()\nroi_view[0,0] = [255,255,255]\nprint("View modifies original:", (img[0,0] == [255,255,255]).all())`,
  flip:    `import numpy as np\n\nimg = np.array([\n  [[1,1,1],[2,2,2],[3,3,3]],\n  [[4,4,4],[5,5,5],[6,6,6]],\n  [[7,7,7],[8,8,8],[9,9,9]],\n], dtype=np.uint8)\n\nprint("Original top-left:", img[0,0])\nprint("Original top-right:", img[0,2])\n\n# Horizontal flip\nh_flip = img[:, ::-1]\nprint("\\nHorizontal flip:")\nprint("  top-left now:", h_flip[0,0], "(was top-right)")\n\n# Vertical flip\nv_flip = img[::-1, :]\nprint("\\nVertical flip:")\nprint("  top-left now:", v_flip[0,0], "(was bottom-left)")\n\n# Both (= 180° rotation)\nboth = img[::-1, ::-1]\nprint("\\nBoth axes flip:")\nprint("  top-left now:", both[0,0], "(was bottom-right)")`,
  bitwise: `import numpy as np\n\n# Create two binary masks\nA = np.zeros((10, 10), dtype=np.uint8)\nA[2:8, 1:7] = 255   # rectangle\n\nB = np.zeros((10, 10), dtype=np.uint8)\nB[4:9, 3:9] = 255   # different rectangle\n\n# AND: intersection\nand_res = A & B\nprint("AND nonzero pixels:", np.count_nonzero(and_res))\n\n# OR: union\nor_res = A | B\nprint("OR nonzero pixels:", np.count_nonzero(or_res))\n\n# XOR: symmetric difference\nxor_res = A ^ B\nprint("XOR nonzero pixels:", np.count_nonzero(xor_res))\n\n# NOT: invert\nnot_a = ~A & 0xFF\nprint("NOT-A nonzero pixels:", np.count_nonzero(not_a))\nprint("A + NOT-A =", np.count_nonzero(A) + np.count_nonzero(not_a), "(should be 100)")`,
};

const playgroundDefault = document.getElementById('playground-editor')?.value || '';

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

// Ctrl+Enter to run playground
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const active = document.activeElement;
    if (active && active.classList.contains('playground-editor')) {
      e.preventDefault();
      runPlayground();
    }
  }
});
