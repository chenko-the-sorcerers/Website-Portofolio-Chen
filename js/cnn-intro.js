'use strict';

/* ══════════════════════════════════════════════════════════════
   cnn-intro.js — Introduction to CNNs
   Interactive: convolution animation, stride/padding visualizer,
   pooling animation, layer feature maps, live CNN demo
   ══════════════════════════════════════════════════════════════ */

/* ── 1. Reading progress ──────────────────────────────────────── */
(function () {
  const bar = document.getElementById('readBar');
  if (!bar) return;
  function upd() {
    const d = document.documentElement;
    bar.style.width = Math.min(100,(window.scrollY/(d.scrollHeight-d.clientHeight))*100)+'%';
  }
  window.addEventListener('scroll', upd, {passive:true}); upd();
})();

/* ── 2. Sidebar toggle ────────────────────────────────────────── */
window.toggleSidebar = function() { document.getElementById('lessonSidebar').classList.toggle('open'); };
document.addEventListener('click', e => {
  const sb=document.getElementById('lessonSidebar'), btn=document.getElementById('menuBtn');
  if(sb&&btn&&!sb.contains(e.target)&&!btn.contains(e.target)) sb.classList.remove('open');
});

/* ── 3. TOC scroll spy ────────────────────────────────────────── */
(function(){
  const links=document.querySelectorAll('.lnav-item[data-sec]');
  const secs=Array.from(document.querySelectorAll('.lesson-sec[id]'));
  const fill=document.getElementById('progFill'), pct=document.getElementById('progPct');
  function upd(){
    const y=window.scrollY+120; let ai=0;
    secs.forEach((s,i)=>{ if(s.offsetTop<=y) ai=i; });
    links.forEach((l,i)=>{
      l.classList.toggle('active',i===ai);
      if(i<ai){ l.classList.add('done'); const d=l.querySelector('.lnav-dot'); if(d) d.style.background='#34c759'; }
    });
    const p=Math.round((ai/Math.max(1,secs.length-1))*100);
    if(fill) fill.style.width=p+'%'; if(pct) pct.textContent=p+'%';
  }
  window.addEventListener('scroll',upd,{passive:true}); upd();
})();

/* ── 4. Smooth scroll ─────────────────────────────────────────── */
document.querySelectorAll('.lnav-item[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const t=document.querySelector(a.getAttribute('href'));
    if(t) t.scrollIntoView({behavior:'smooth',block:'start'});
    document.getElementById('lessonSidebar').classList.remove('open');
  });
});

/* ══════════════════════════════════════════════════════════════
   GLOBAL IMAGE STATE
   ══════════════════════════════════════════════════════════════ */
const IMAGES = {
  tugu:     { src: IMG_TUGU,     name:'Tugu Yogyakarta',  label:'🏛️ Tugu Yogya' },
  suroboyo: { src: IMG_SUROBOYO, name:'Patung Suro & Boyo', label:'🦈 Suro & Boyo' },
  custom:   { src: null,         name:'Custom Upload',    label:'📷 Upload' }
};

let currentConvImg = 'tugu';
let customImgSrc   = null;

function getActiveSrc() {
  if (currentConvImg === 'custom' && customImgSrc) return customImgSrc;
  return IMAGES[currentConvImg]?.src || IMG_TUGU;
}

/* ── Load image into canvas ─────────────────────────────────── */
function loadImgToCanvas(src, canvas, cb) {
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // fill black first
    ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // draw maintaining aspect ratio, centered
    const W=canvas.width, H=canvas.height;
    const scale = Math.min(W/img.width, H/img.height);
    const sw=img.width*scale, sh=img.height*scale;
    const ox=(W-sw)/2, oy=(H-sh)/2;
    ctx.drawImage(img, ox, oy, sw, sh);
    if(cb) cb(ctx);
  };
  img.crossOrigin='anonymous';
  img.src=src;
}

/* ══════════════════════════════════════════════════════════════
   SECTION 1: FC vs CNN comparison grid
   ══════════════════════════════════════════════════════════════ */
(function(){
  const fcGrid=document.getElementById('fcGrid');
  const cnnGrid=document.getElementById('cnnGrid');
  if(!fcGrid||!cnnGrid) return;

  // FC: 6x6 nodes all connected
  fcGrid.style.gridTemplateColumns='repeat(6,1fr)';
  const fcSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  fcSvg.setAttribute('width','120'); fcSvg.setAttribute('height','90');
  fcSvg.style.display='block';
  // draw messy connections
  for(let i=0;i<6;i++) for(let j=0;j<6;j++){
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',i*20+10); line.setAttribute('y1',5);
    line.setAttribute('x2',j*20+10); line.setAttribute('y2',85);
    line.setAttribute('stroke','rgba(255,55,95,.15)'); line.setAttribute('stroke-width','0.5');
    fcSvg.appendChild(line);
  }
  // input dots
  for(let i=0;i<6;i++){
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',i*20+10); c.setAttribute('cy',5); c.setAttribute('r',3);
    c.setAttribute('fill','#ff375f'); fcSvg.appendChild(c);
  }
  // output dots
  for(let i=0;i<6;i++){
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',i*20+10); c.setAttribute('cy',85); c.setAttribute('r',3);
    c.setAttribute('fill','rgba(255,55,95,.5)'); fcSvg.appendChild(c);
  }
  fcGrid.appendChild(fcSvg);

  // CNN: small kernel
  cnnGrid.style.gridTemplateColumns='repeat(3,1fr)';
  cnnGrid.style.gap='2px';
  for(let i=0;i<9;i++){
    const cell=document.createElement('div');
    cell.style.cssText=`width:20px;height:20px;border-radius:3px;background:rgba(52,199,89,${i===4?'.8':'.2'});border:1px solid rgba(52,199,89,.4);`;
    cnnGrid.appendChild(cell);
  }
})();

/* ══════════════════════════════════════════════════════════════
   SECTION 2: CONVOLUTION ANIMATION
   ══════════════════════════════════════════════════════════════ */
const FILTERS = {
  edge_h:  { name:'Edge Horizontal', weights:[-1,-2,-1, 0,0,0, 1,2,1], desc:'Deteksi tepi horizontal (perubahan atas-bawah)' },
  edge_v:  { name:'Edge Vertikal',   weights:[-1,0,1, -2,0,2, -1,0,1], desc:'Deteksi tepi vertikal (perubahan kiri-kanan)' },
  sharpen: { name:'Sharpen',         weights:[0,-1,0, -1,5,-1, 0,-1,0], desc:'Pertajam detail dan tekstur gambar' },
  blur:    { name:'Gaussian Blur',   weights:[1/16,2/16,1/16, 2/16,4/16,2/16, 1/16,2/16,1/16], desc:'Haluskan gambar, kurangi noise' },
  emboss:  { name:'Emboss',          weights:[-2,-1,0, -1,1,1, 0,1,2], desc:'Berikan efek relief / emboss 3D' },
};

let activeFilter = 'edge_h';
let convAnimTimer = null;
let convPlaying   = false;
let convStep      = 0;
let convGrayData  = null; // flat array of grayscale values (CELL_N x CELL_N)
let convOutputData= null;

const CELL_N = 16; // downsample to 16x16 grid for visualization
const CONV_OUT_N = CELL_N - 2; // output size with no padding (14x14)

// Render kernel display
function renderKernel(filterKey) {
  const f = FILTERS[filterKey];
  const kd = document.getElementById('kernelDisplay');
  const kn = document.getElementById('kernelName');
  const km = document.getElementById('kernelMath');
  if(!kd||!f) return;
  kd.style.gridTemplateColumns='repeat(3,1fr)';
  kd.innerHTML='';
  const maxW = Math.max(...f.weights.map(Math.abs));
  f.weights.forEach(w=>{
    const cell=document.createElement('div');
    cell.className='kd-cell';
    const norm=maxW>0?w/maxW:0;
    const bg=norm>0?`rgba(41,151,255,${norm*.7})`
             :norm<0?`rgba(255,55,95,${-norm*.7})`
             :`rgba(255,255,255,.05)`;
    cell.style.background=bg;
    cell.textContent=Number.isInteger(w)?w:(w*16).toFixed(0)===(w*16).toString()?(w*16)+'/16':w.toFixed(2);
    kd.appendChild(cell);
  });
  if(kn) kn.textContent=f.name;
  if(km) km.textContent=f.desc;
}

// Extract grayscale grid from canvas
function extractGrayGrid(canvas, N) {
  const ctx=canvas.getContext('2d');
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const W=canvas.width, H=canvas.height;
  const grid=new Float32Array(N*N);
  for(let gy=0;gy<N;gy++) for(let gx=0;gx<N;gx++){
    const px=Math.floor(gx*W/N), py=Math.floor(gy*H/N);
    const i=(py*W+px)*4;
    grid[gy*N+gx]=(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2])/255;
  }
  return grid;
}

// Compute full convolution
function computeFullConv(gray, kernel) {
  const N=CELL_N, ON=CONV_OUT_N;
  const out=new Float32Array(ON*ON);
  let mn=Infinity, mx=-Infinity;
  for(let y=0;y<ON;y++) for(let x=0;x<ON;x++){
    let sum=0;
    for(let ky=0;ky<3;ky++) for(let kx=0;kx<3;kx++){
      sum+=gray[(y+ky)*N+(x+kx)]*kernel[ky*3+kx];
    }
    out[y*ON+x]=sum;
    if(sum<mn) mn=sum; if(sum>mx) mx=sum;
  }
  // normalize
  const range=mx-mn||1;
  for(let i=0;i<out.length;i++) out[i]=(out[i]-mn)/range;
  return out;
}

// Draw cell grid on canvas
function drawGrid(canvas, data, N, highlightIdx=-1, isInput=false) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const cw=W/N, ch=H/N;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const v=data[y*N+x];
    const brightness=Math.round(v*255);
    ctx.fillStyle=`rgb(${brightness},${brightness},${brightness})`;
    ctx.fillRect(x*cw+.5,y*ch+.5,cw-.5,ch-.5);
  }
  if(highlightIdx>=0 && isInput){
    const gy=Math.floor(highlightIdx/CONV_OUT_N);
    const gx=highlightIdx%CONV_OUT_N;
    ctx.strokeStyle='rgba(255,159,10,.9)';
    ctx.lineWidth=1.5;
    ctx.strokeRect(gx*cw+1,gy*ch+1,(3*cw)-2,(3*ch)-2);
  }
  if(highlightIdx>=0 && !isInput){
    const gy=Math.floor(highlightIdx/CONV_OUT_N);
    const gx=highlightIdx%CONV_OUT_N;
    const ON=CONV_OUT_N;
    const ocw=W/ON, och=H/ON;
    ctx.fillStyle='rgba(52,199,89,.4)';
    ctx.fillRect(gx*ocw+.5,gy*och+.5,ocw-.5,och-.5);
  }
}

// Update filter box position
function updateFilterBox(step) {
  const canvas=document.getElementById('convInput');
  const fb=document.getElementById('filterBox');
  if(!canvas||!fb) return;
  const W=canvas.offsetWidth||200, H=canvas.offsetHeight||200;
  const cw=W/CELL_N, ch=H/CELL_N;
  const gy=Math.floor(step/CONV_OUT_N);
  const gx=step%CONV_OUT_N;
  fb.style.left=(gx*cw)+'px'; fb.style.top=(gy*ch)+'px';
  fb.style.width=(3*cw)+'px'; fb.style.height=(3*ch)+'px';
}

// Update output cursor
function updateOutputCursor(step) {
  const canvas=document.getElementById('convOutput');
  const oc=document.getElementById('outputCursor');
  if(!canvas||!oc) return;
  const W=canvas.offsetWidth||200, H=canvas.offsetHeight||200;
  const ON=CONV_OUT_N;
  const cw=W/ON, ch=H/ON;
  const gy=Math.floor(step/ON), gx=step%ON;
  oc.style.left=(gx*cw)+'px'; oc.style.top=(gy*ch)+'px';
  oc.style.width=cw+'px'; oc.style.height=ch+'px';
}

// Update step computation display
function updateStepComputation(step) {
  const fEl=document.getElementById('scFormula');
  const rEl=document.getElementById('scResult');
  if(!fEl||!convGrayData||!convOutputData) return;
  const kernel=FILTERS[activeFilter].weights;
  const N=CELL_N;
  const gy=Math.floor(step/CONV_OUT_N);
  const gx=step%CONV_OUT_N;
  let parts=[], sum=0;
  for(let ky=0;ky<3;ky++) for(let kx=0;kx<3;kx++){
    const pv=convGrayData[(gy+ky)*N+(gx+kx)];
    const kv=kernel[ky*3+kx];
    const prod=pv*kv;
    sum+=prod;
    if(parts.length<6) parts.push(`${pv.toFixed(2)}×${typeof kv==='number'&&!Number.isInteger(kv)?kv.toFixed(2):kv}`);
  }
  fEl.textContent=parts.join(' + ')+' + ...';
  const normVal=convOutputData[step];
  if(rEl) rEl.textContent=`→ Raw: ${sum.toFixed(3)}  |  Normalized: ${normVal.toFixed(3)}`;
}

// Initialize convolution with current image
function initConv() {
  const inputCanvas=document.getElementById('convInput');
  const outputCanvas=document.getElementById('convOutput');
  if(!inputCanvas||!outputCanvas) return;

  loadImgToCanvas(getActiveSrc(), inputCanvas, ()=>{
    convGrayData=extractGrayGrid(inputCanvas, CELL_N);
    convOutputData=computeFullConv(convGrayData, FILTERS[activeFilter].weights);
    // clear output
    const ctx=outputCanvas.getContext('2d');
    ctx.fillStyle='#1a1a26'; ctx.fillRect(0,0,outputCanvas.width,outputCanvas.height);
    convStep=0;
    updateFilterBox(0);
    updateOutputCursor(0);
    // update progress
    updateConvProgress();
  });
  renderKernel(activeFilter);
}

function updateConvProgress() {
  const total=CONV_OUT_N*CONV_OUT_N;
  const fill=document.getElementById('ctrlFill');
  const count=document.getElementById('ctrlCount');
  if(fill) fill.style.width=(convStep/total*100)+'%';
  if(count) count.textContent=`${convStep} / ${total}`;
}

// Do one step
window.stepConv = function() {
  const total=CONV_OUT_N*CONV_OUT_N;
  if(convStep>=total) { resetConv(); return; }
  const inputCanvas=document.getElementById('convInput');
  const outputCanvas=document.getElementById('convOutput');
  if(!convGrayData||!convOutputData) { initConv(); return; }

  // Draw input with current filter position
  drawGrid(inputCanvas, convGrayData, CELL_N, convStep, true);
  updateFilterBox(convStep);

  // Draw output up to current step
  const ctx=outputCanvas.getContext('2d');
  const W=outputCanvas.width, H=outputCanvas.height;
  const ON=CONV_OUT_N;
  const cw=W/ON, ch=H/ON;
  const gy=Math.floor(convStep/ON), gx=convStep%ON;
  const v=convOutputData[convStep];
  const b=Math.round(v*255);
  ctx.fillStyle=`rgb(${b},${b},${b})`;
  ctx.fillRect(gx*cw+.5,gy*ch+.5,cw-.5,ch-.5);
  updateOutputCursor(convStep);
  updateStepComputation(convStep);
  updateConvProgress();
  convStep++;
};

window.togglePlay = function() {
  const btn=document.getElementById('playBtn');
  if(convPlaying){
    convPlaying=false;
    clearInterval(convAnimTimer);
    if(btn){ btn.textContent='▶ Play'; btn.classList.remove('playing'); }
  } else {
    convPlaying=true;
    if(btn){ btn.textContent='⏸ Pause'; btn.classList.add('playing'); }
    if(!convGrayData) initConv();
    convAnimTimer=setInterval(()=>{
      const total=CONV_OUT_N*CONV_OUT_N;
      if(convStep>=total){ togglePlay(); return; }
      stepConv();
    }, 40);
  }
};

window.resetConv = function() {
  convPlaying=false; convStep=0;
  clearInterval(convAnimTimer);
  const btn=document.getElementById('playBtn');
  if(btn){ btn.textContent='▶ Play'; btn.classList.remove('playing'); }
  const outputCanvas=document.getElementById('convOutput');
  if(outputCanvas){ const ctx=outputCanvas.getContext('2d'); ctx.fillStyle='#1a1a26'; ctx.fillRect(0,0,outputCanvas.width,outputCanvas.height); }
  initConv();
  updateConvProgress();
  document.getElementById('scFormula').textContent='Klik "Play" untuk memulai animasi';
  document.getElementById('scResult').textContent='';
};

window.selectConvImg = function(key, btn) {
  currentConvImg=key;
  document.querySelectorAll('.cis-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const uz=document.getElementById('uploadZone');
  if(key==='custom'){
    if(uz) uz.style.display='block';
    return;
  }
  if(uz) uz.style.display='none';
  resetConv();
};

window.selectFilter = function(key, btn) {
  activeFilter=key;
  document.querySelectorAll('.fs-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  resetConv();
};

window.handleUpload = function(e) {
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    customImgSrc=ev.target.result;
    const uz=document.getElementById('uploadZone');
    if(uz){ uz.innerHTML=`<img src="${customImgSrc}" style="max-height:120px;border-radius:8px;display:block;margin:0 auto"><div style="text-align:center;margin-top:8px;font-size:12px;color:var(--text-3)">✅ Gambar berhasil diupload</div>`; }
    resetConv();
  };
  reader.readAsDataURL(file);
};

// Init on load
window.addEventListener('load', ()=>{ initConv(); buildSPCanvas(); initPooling(); buildLayerFmaps(); buildPipeline(); });

/* ══════════════════════════════════════════════════════════════
   SECTION 3: STRIDE & PADDING
   ══════════════════════════════════════════════════════════════ */
function buildSPCanvas() {
  const canvas=document.getElementById('spCanvas'); if(!canvas) return;
  updateSP();
}

window.updateSP = function() {
  const inS  = parseInt(document.getElementById('spInput')?.value  || 7);
  const kS   = parseInt(document.getElementById('spKernel')?.value || 3);
  const str  = parseInt(document.getElementById('spStride')?.value || 1);
  const pad  = parseInt(document.getElementById('spPad')?.value    || 0);

  document.getElementById('spInputVal').textContent  = inS;
  document.getElementById('spKernelVal').textContent = kS;
  document.getElementById('spStrideVal').textContent = str;
  document.getElementById('spPadVal').textContent    = pad;

  const outS = Math.floor((inS + 2*pad - kS) / str) + 1;
  const valid = outS > 0;

  document.getElementById('spFormula').textContent = `⌊(${inS} + 2×${pad} − ${kS}) / ${str}⌋ + 1`;
  document.getElementById('spResult').textContent  = valid ? outS : 'invalid';

  const sameTag   = document.getElementById('spSameTag');
  const shrinkTag = document.getElementById('spShrinkTag');
  if(sameTag)   sameTag.style.display   = (outS===inS && valid) ? 'inline' : 'none';
  if(shrinkTag) shrinkTag.style.display = (outS<inS  && valid) ? 'inline' : 'none';

  drawSPCanvas(inS, kS, str, pad, outS, valid);
};

function drawSPCanvas(inS, kS, str, pad, outS, valid) {
  const canvas=document.getElementById('spCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);

  const totalIn=inS+2*pad;
  const maxDim=Math.max(totalIn, valid?outS:1);
  const cellSz=Math.min(Math.floor((W*0.42)/maxDim), 22);
  const gap=W*0.12;

  // Draw padded input
  const inLeft=10, inTop=(H-totalIn*cellSz)/2;
  for(let y=0;y<totalIn;y++) for(let x=0;x<totalIn;x++){
    const isPad=(x<pad||x>=inS+pad||y<pad||y>=inS+pad);
    ctx.fillStyle=isPad?'rgba(255,159,10,.12)':'rgba(41,151,255,.2)';
    ctx.fillRect(inLeft+x*cellSz, inTop+y*cellSz, cellSz-1, cellSz-1);
    if(isPad){ ctx.strokeStyle='rgba(255,159,10,.3)'; ctx.lineWidth=.5; ctx.strokeRect(inLeft+x*cellSz+.5,inTop+y*cellSz+.5,cellSz-1,cellSz-1); }
  }
  // Draw kernel at first position
  if(kS<=totalIn){
    ctx.strokeStyle='rgba(255,159,10,.9)'; ctx.lineWidth=2;
    ctx.strokeRect(inLeft+.5, inTop+.5, kS*cellSz-1, kS*cellSz-1);
    ctx.fillStyle='rgba(255,159,10,.1)';
    ctx.fillRect(inLeft+1,inTop+1,kS*cellSz-2,kS*cellSz-2);
  }
  // Label
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font=`11px 'Space Mono', monospace`;
  ctx.fillText(`Input ${inS}×${inS}${pad>0?` (+${pad} pad)`:''}`, inLeft, inTop-6);

  // Arrow
  const arrowX=inLeft+totalIn*cellSz+gap*0.3;
  const arrowY=H/2;
  ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(arrowX,arrowY); ctx.lineTo(arrowX+gap*0.6,arrowY); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.3)';
  ctx.beginPath(); ctx.moveTo(arrowX+gap*0.6,arrowY); ctx.lineTo(arrowX+gap*0.6-6,arrowY-4); ctx.lineTo(arrowX+gap*0.6-6,arrowY+4); ctx.fill();

  // Draw output
  if(valid && outS>0){
    const outLeft=arrowX+gap*0.7;
    const outTop=(H-outS*cellSz)/2;
    const outCellSz=Math.min(Math.floor((W*0.42)/outS),22);
    for(let y=0;y<outS;y++) for(let x=0;x<outS;x++){
      ctx.fillStyle='rgba(52,199,89,.25)';
      ctx.fillRect(outLeft+x*outCellSz,outTop+y*outCellSz,outCellSz-1,outCellSz-1);
    }
    // highlight first output cell
    ctx.fillStyle='rgba(52,199,89,.5)';
    ctx.fillRect(outLeft+.5,outTop+.5,outCellSz-1,outCellSz-1);
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font=`11px 'Space Mono', monospace`;
    ctx.fillText(`Output ${outS}×${outS}`, outLeft, outTop-6);
  }
}

/* ══════════════════════════════════════════════════════════════
   SECTION 4: POOLING ANIMATION
   ══════════════════════════════════════════════════════════════ */
let poolMode='max';
let poolAnimTimer=null;
let poolData=null; // 8x8 values

function initPooling() {
  const inputCanvas=document.getElementById('poolInput'); if(!inputCanvas) return;
  // Generate pool data from Tugu image concept
  poolData=new Float32Array(64);
  // Use pseudo-random but structured data (resembles edge detection output)
  const seed=[0.9,0.1,0.8,0.2,0.7,0.3,0.6,0.4,
              0.1,0.95,0.05,0.85,0.15,0.75,0.25,0.65,
              0.8,0.2,0.9,0.1,0.85,0.05,0.7,0.3,
              0.2,0.7,0.1,0.9,0.3,0.8,0.4,0.6,
              0.6,0.4,0.7,0.3,0.8,0.2,0.9,0.1,
              0.4,0.6,0.3,0.7,0.2,0.8,0.1,0.9,
              0.7,0.3,0.8,0.2,0.9,0.1,0.85,0.15,
              0.3,0.8,0.2,0.9,0.1,0.95,0.05,0.8];
  for(let i=0;i<64;i++) poolData[i]=seed[i];
  drawPoolInput();
  drawPoolOutput();
}

function drawPoolInput(highlightCell=-1){
  const canvas=document.getElementById('poolInput'); if(!canvas||!poolData) return;
  const ctx=canvas.getContext('2d');
  const N=8, W=canvas.width, H=canvas.height;
  const cw=W/N, ch=H/N;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const v=poolData[y*N+x];
    const b=Math.round(v*255);
    ctx.fillStyle=`rgb(${b},${b},${b})`;
    ctx.fillRect(x*cw+.5,y*ch+.5,cw-.5,ch-.5);
  }
  if(highlightCell>=0){
    const by=Math.floor(highlightCell/4)*2, bx=(highlightCell%4)*2;
    ctx.strokeStyle='rgba(255,159,10,.9)'; ctx.lineWidth=2;
    ctx.strokeRect(bx*cw+1,by*ch+1,2*cw-2,2*ch-2);
  }
}

function drawPoolOutput(upToCell=-1){
  const canvas=document.getElementById('poolOutput'); if(!canvas||!poolData) return;
  const ctx=canvas.getContext('2d');
  const N=4, W=canvas.width, H=canvas.height;
  const cw=W/N, ch=H/N;
  ctx.fillStyle='#1a1a26'; ctx.fillRect(0,0,W,H);
  const total=upToCell<0?16:upToCell+1;
  for(let i=0;i<total;i++){
    const oy=Math.floor(i/4), ox=i%4;
    const iy=oy*2, ix=ox*2;
    const vals=[poolData[iy*8+ix],poolData[iy*8+ix+1],poolData[(iy+1)*8+ix],poolData[(iy+1)*8+ix+1]];
    const v=poolMode==='max'?Math.max(...vals):vals.reduce((a,b)=>a+b,0)/4;
    const b=Math.round(v*255);
    ctx.fillStyle=`rgb(${b},${b},${b})`;
    ctx.fillRect(ox*cw+.5,oy*ch+.5,cw-.5,ch-.5);
    if(i===upToCell){
      ctx.strokeStyle='rgba(52,199,89,.9)'; ctx.lineWidth=2;
      ctx.strokeRect(ox*cw+1,oy*ch+1,cw-2,ch-2);
    }
  }
}

window.switchPool = function(mode) {
  poolMode=mode;
  clearInterval(poolAnimTimer);
  document.getElementById('poolPlayBtn').textContent='▶ Animasikan';
  document.querySelectorAll('.pool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(mode==='max'?'poolMaxBtn':'poolAvgBtn').classList.add('active');
  document.getElementById('poolOpLabel').textContent=mode.toUpperCase();
  const exp=document.getElementById('poolExplanation');
  if(exp) exp.innerHTML=mode==='max'
    ?'<strong>Max Pooling:</strong> Ambil nilai terbesar dari setiap window 2×2. Menangkap fitur paling kuat/dominan di region tersebut. Digunakan di VGG, ResNet early layers.'
    :'<strong>Average Pooling:</strong> Hitung rata-rata dari setiap window 2×2. Hasilnya lebih halus dan merata. Digunakan di GoogLeNet dan sebagai Global Average Pooling di ResNet.';
  drawPoolInput(); drawPoolOutput();
};

window.animatePool = function() {
  clearInterval(poolAnimTimer);
  const btn=document.getElementById('poolPlayBtn');
  let cell=0;
  if(btn) btn.textContent='⏳ Animasi...';
  poolAnimTimer=setInterval(()=>{
    drawPoolInput(cell);
    drawPoolOutput(cell);
    cell++;
    if(cell>=16){ clearInterval(poolAnimTimer); if(btn) btn.textContent='▶ Animasikan'; }
  }, 150);
};

/* ══════════════════════════════════════════════════════════════
   SECTION 5: LAYER FEATURE MAPS
   ══════════════════════════════════════════════════════════════ */
function buildLayerFmaps() {
  const canvases=[
    {ids:['lf0a','lf0b','lf0c','lf0d'], type:'edge'},
    {ids:['lf1a','lf1b','lf1c','lf1d'], type:'texture'},
    {ids:['lf2a','lf2b','lf2c','lf2d'], type:'semantic'},
  ];
  canvases.forEach(({ids, type})=>{
    ids.forEach((id, idx)=>{
      const c=document.getElementById(id); if(!c) return;
      drawFmap(c, type, idx);
    });
  });
}

function drawFmap(canvas, type, variant) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const id=ctx.createImageData(W,H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=(y*W+x)*4;
    let v=0;
    if(type==='edge'){
      // Simulate edge detection: vertical/horizontal edges
      if(variant===0) v=Math.abs(Math.sin(x*0.3))*255; // vertical edges
      else if(variant===1) v=Math.abs(Math.sin(y*0.3))*255; // horizontal edges
      else if(variant===2) v=Math.abs(Math.sin((x+y)*0.2))*255; // diagonal
      else v=Math.abs(Math.sin(x*0.2)*Math.cos(y*0.2))*255; // cross pattern
      id.data[i]=id.data[i+1]=id.data[i+2]=Math.round(v);
    } else if(type==='texture'){
      // Mid-level: blobs and patches
      const cx=[20,60,40,70][variant], cy=[30,50,60,25][variant];
      const d=Math.sqrt((x-cx)**2+(y-cy)**2);
      v=(1-Math.min(1,d/35))*200+55*Math.sin(x*0.4+variant);
      id.data[i]=Math.round(Math.abs(v)*[0.6,0.9,0.4,0.7][variant]);
      id.data[i+1]=Math.round(Math.abs(v)*[0.9,0.5,0.8,0.6][variant]);
      id.data[i+2]=Math.round(Math.abs(v)*[0.3,0.7,0.6,0.9][variant]);
    } else {
      // High-level: sparse but strong activations (semantic)
      const r=Math.random();
      v=r>0.92?220+Math.random()*35:Math.random()*30;
      const hues=[[168,85,247],[255,159,10],[52,199,89],[41,151,255]];
      const h=hues[variant];
      id.data[i]=Math.round(v*(h[0]/255));
      id.data[i+1]=Math.round(v*(h[1]/255));
      id.data[i+2]=Math.round(v*(h[2]/255));
    }
    id.data[i+3]=255;
  }
  ctx.putImageData(id,0,0);
}

/* ══════════════════════════════════════════════════════════════
   SECTION 6: LIVE CNN DEMO
   ══════════════════════════════════════════════════════════════ */
let demoImg='tugu';
let demoCustomSrc=null;
let activeStage='input';

const LANDMARKS = {
  tugu: {
    name:'Tugu Yogyakarta', emoji:'🏛️',
    probs:[
      {label:'Tugu Yogyakarta', p:0.923, color:'#34c759'},
      {label:'Monumen Nasional', p:0.041, color:'#2997ff'},
      {label:'Patung Suroboyo', p:0.022, color:'#a855f7'},
      {label:'Bundaran HI', p:0.009, color:'#ff9f0a'},
      {label:'Lainnya', p:0.005, color:'#555'},
    ],
    explanation:'CNN mendeteksi tiang monumen vertikal yang khas, warna putih-emas, dan pola bundaran jalan. Feature map Layer 5 menunjukkan aktivasi kuat pada bagian puncak tiang — penanda unik Tugu Yogyakarta.'
  },
  suroboyo: {
    name:'Patung Suro & Boyo', emoji:'🦈',
    probs:[
      {label:'Patung Suroboyo', p:0.889, color:'#34c759'},
      {label:'Monumen Nasional', p:0.062, color:'#2997ff'},
      {label:'Tugu Yogyakarta', p:0.031, color:'#a855f7'},
      {label:'Lainnya', p:0.018, color:'#555'},
    ],
    explanation:'Tekstur sisik buaya dan bentuk hiu menciptakan feature map yang sangat unik. Layer 3-4 aktif pada pola sisik berulang; Layer 5 mengenali siluet kombinasi ikan hiu dan buaya yang menjadi ikon Surabaya.'
  },
  custom: {
    name:'Gambar Upload', emoji:'📷',
    probs:[
      {label:'Landmark Indonesia', p:0.710, color:'#34c759'},
      {label:'Monumen/Tugu', p:0.180, color:'#2997ff'},
      {label:'Patung', p:0.070, color:'#a855f7'},
      {label:'Bangunan', p:0.030, color:'#ff9f0a'},
      {label:'Lainnya', p:0.010, color:'#555'},
    ],
    explanation:'CNN menganalisis gambar upload kamu. Fitur-fitur yang diekstrak dibandingkan dengan landmark yang dikenali. Hasil terbaik ketika gambar menampilkan satu landmark dengan jelas.'
  }
};

function buildPipeline() {
  // Draw initial pipeline canvases
  const src=IMG_TUGU;
  drawPipelineStage('pipInput', src, 'input');
  drawPipelineStage('pipConv1', src, 'conv1');
  drawPipelineStage('pipPool1', src, 'pool1');
  drawPipelineStage('pipConv2', src, 'conv2');
  drawPipelineStage('pipPool2', src, 'pool2');
  updateStageDetail('input');
  drawSDCanvas('input', src);
}

function drawPipelineStage(canvasId, src, stage) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  if(stage==='input'){
    loadImgToCanvas(src,canvas);
    return;
  }
  // Simulate feature maps
  const img=new Image();
  img.onload=()=>{
    // Draw source small
    ctx.drawImage(img,0,0,W,H);
    const id=ctx.getImageData(0,0,W,H);
    // Apply pseudo-filter based on stage
    for(let i=0;i<id.data.length;i+=4){
      const r=id.data[i],g=id.data[i+1],b=id.data[i+2];
      const gray=0.299*r+0.587*g+0.114*b;
      if(stage==='conv1'){ // edge-like
        const edge=Math.min(255,Math.abs(gray-128)*2);
        id.data[i]=edge; id.data[i+1]=edge; id.data[i+2]=edge;
      } else if(stage==='pool1'){ // downsampled look
        const v=Math.round(gray/32)*32;
        id.data[i]=Math.round(v*0.4); id.data[i+1]=Math.round(v*0.7); id.data[i+2]=v;
      } else if(stage==='conv2'){ // texture
        const v=Math.round(gray);
        id.data[i]=Math.round(v*0.8); id.data[i+1]=Math.round(v*0.3); id.data[i+2]=Math.round(v*0.9);
      } else if(stage==='pool2'){ // abstract
        const v=(r+g+b)/3;
        id.data[i]=Math.round(v>128?168:40); id.data[i+1]=Math.round(v>128?85:20); id.data[i+2]=Math.round(v>128?247:60);
      }
    }
    ctx.putImageData(id,0,0);
  };
  img.crossOrigin='anonymous';
  img.src=src;
}

window.selectDemo = function(key) {
  demoImg=key;
  document.querySelectorAll('.dp-item').forEach(d=>d.classList.remove('active'));
  document.getElementById('dp-'+key)?.classList.add('active');
  const src=key==='custom'&&demoCustomSrc?demoCustomSrc:(key==='suroboyo'?IMG_SUROBOYO:IMG_TUGU);
  buildPipelineWithSrc(src);
  document.getElementById('demoResults').style.display='none';
  updateStageDetail(activeStage);
  drawSDCanvas(activeStage, src);
};

window.handleDemoUpload = function(e) {
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    demoCustomSrc=ev.target.result;
    demoImg='custom';
    document.querySelectorAll('.dp-item').forEach(d=>d.classList.remove('active'));
    document.getElementById('dp-upload')?.classList.add('active');
    const lbl=document.querySelector('#dp-upload .dp-label');
    if(lbl) lbl.textContent='Uploaded!';
    // Add preview
    const uploadItem=document.getElementById('dp-upload');
    if(uploadItem){
      const existing=uploadItem.querySelector('img');
      if(existing) uploadItem.removeChild(existing);
      const img=document.createElement('img');
      img.src=demoCustomSrc; img.className='dp-img'; img.style.objectFit='cover';
      uploadItem.insertBefore(img, uploadItem.querySelector('.dp-label'));
    }
    buildPipelineWithSrc(demoCustomSrc);
    document.getElementById('demoResults').style.display='none';
  };
  reader.readAsDataURL(file);
};

function buildPipelineWithSrc(src) {
  ['input','conv1','pool1','conv2','pool2'].forEach((stage,i)=>{
    const ids=['pipInput','pipConv1','pipPool1','pipConv2','pipPool2'];
    drawPipelineStage(ids[i], src, stage);
  });
}

window.selectStage = function(stage) {
  activeStage=stage;
  document.querySelectorAll('.pip-stage').forEach(s=>s.classList.remove('active'));
  document.getElementById('pip-'+stage)?.classList.add('active');
  updateStageDetail(stage);
  const src=demoImg==='custom'&&demoCustomSrc?demoCustomSrc:(demoImg==='suroboyo'?IMG_SUROBOYO:IMG_TUGU);
  drawSDCanvas(stage, src);
};

function updateStageDetail(stage) {
  const info = {
    input: { title:'Input Image', sub:'Raw pixel values, 224×224×3 (RGB channel pertama=R, kedua=G, ketiga=B)' },
    conv1: { title:'Conv1 + ReLU', sub:'32 filter 3×3, stride=1, padding=1 → 224×224×32 feature maps. Layer ini belajar tepi dan gradien.' },
    pool1: { title:'MaxPool 2×2', sub:'Stride=2 → output 112×112×32. Setiap 2×2 patch diambil nilai maksimumnya. Ukuran berkurang 50%.' },
    conv2: { title:'Conv2 + ReLU', sub:'64 filter 3×3 → 112×112×64 feature maps. Layer ini menggabungkan fitur menjadi tekstur dan pola.' },
    pool2: { title:'MaxPool 2×2', sub:'Stride=2 → output 56×56×64. Representasi semakin abstrak, semakin compact.' },
    fc:    { title:'Fully Connected + Softmax', sub:'Feature vector di-flatten lalu diklasifikasi. Output = probabilitas untuk setiap kelas landmark.' },
  };
  const i=info[stage]||info.input;
  document.getElementById('sdTitle').textContent=i.title;
  document.getElementById('sdSub').textContent=i.sub;
}

function drawSDCanvas(stage, src) {
  const canvas=document.getElementById('sdCanvas'); if(!canvas) return;
  if(stage==='fc'){
    // Draw FC viz
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(168,85,247,.08)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font=`14px 'Syne', sans-serif`;
    ctx.fillStyle='rgba(255,255,255,.6)';
    ctx.textAlign='center';
    ctx.fillText('Fully Connected Layer', canvas.width/2, canvas.height/2-10);
    ctx.font=`12px 'Space Mono', monospace`;
    ctx.fillStyle='rgba(168,85,247,.8)';
    ctx.fillText('Feature Vector → Softmax → Classes', canvas.width/2, canvas.height/2+14);
    return;
  }
  const tmpCanvas=document.createElement('canvas');
  tmpCanvas.width=canvas.width; tmpCanvas.height=canvas.height;
  const ids={input:'pipInput',conv1:'pipConv1',pool1:'pipPool1',conv2:'pipConv2',pool2:'pipPool2'};
  const pipCanvas=document.getElementById(ids[stage]);
  if(pipCanvas){
    const ctx=canvas.getContext('2d');
    ctx.drawImage(pipCanvas,0,0,canvas.width,canvas.height);
  }
}

// FC viz in pipeline
(function(){
  const viz=document.getElementById('pipFcViz'); if(!viz) return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','76'); svg.setAttribute('height','76');
  for(let i=0;i<8;i++){
    const y=8+i*8;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x','10'); rect.setAttribute('y',y); rect.setAttribute('width','56');
    rect.setAttribute('height','5'); rect.setAttribute('rx','2');
    const v=Math.random();
    rect.setAttribute('fill',`rgba(168,85,247,${0.3+v*0.7})`);
    svg.appendChild(rect);
  }
  viz.appendChild(svg);
})();

window.runCNNDemo = function() {
  const btn=document.getElementById('demoRunBtn');
  if(btn){ btn.textContent='⚡ Running CNN...'; btn.disabled=true; }

  // Animate pipeline stages
  const stages=['pip-input','pip-conv1','pip-pool1','pip-conv2','pip-pool2','pip-fc'];
  let si=0;
  document.querySelectorAll('.pip-stage').forEach(s=>s.classList.remove('active'));

  const animate=()=>{
    if(si>0) document.getElementById(stages[si-1])?.classList.remove('active');
    if(si<stages.length){
      document.getElementById(stages[si])?.classList.add('active');
      selectStage(stages[si].replace('pip-',''));
      si++;
      setTimeout(animate, 500);
    } else {
      // Show results
      showDemoResults();
      if(btn){ btn.textContent='⚡ Run CNN Pipeline'; btn.disabled=false; }
    }
  };
  animate();
};

function showDemoResults() {
  const key=demoImg==='custom'&&demoCustomSrc?'custom':demoImg;
  const data=LANDMARKS[key]||LANDMARKS.tugu;
  const resultsEl=document.getElementById('demoResults');
  const barsEl=document.getElementById('drBars');
  const winnerEl=document.getElementById('drWinner');
  const expEl=document.getElementById('drExplanation');
  if(!resultsEl||!barsEl) return;

  barsEl.innerHTML='';
  data.probs.forEach(({label,p,color})=>{
    const row=document.createElement('div');
    row.className='dr-bar-row';
    row.innerHTML=`
      <span class="dr-bar-label">${label}</span>
      <div class="dr-bar-track"><div class="dr-bar-fill" style="width:0%;background:${color}" data-target="${p*100}"></div></div>
      <span class="dr-bar-pct">${(p*100).toFixed(1)}%</span>
    `;
    barsEl.appendChild(row);
  });

  resultsEl.style.display='block';
  // Animate bars
  requestAnimationFrame(()=>{
    document.querySelectorAll('.dr-bar-fill[data-target]').forEach(bar=>{
      const t=bar.getAttribute('data-target');
      setTimeout(()=>{ bar.style.width=t+'%'; }, 100);
    });
  });

  if(winnerEl) winnerEl.textContent=`${data.emoji} ${data.name} (${(data.probs[0].p*100).toFixed(1)}% confidence)`;
  if(expEl) expEl.textContent=data.explanation;
}
