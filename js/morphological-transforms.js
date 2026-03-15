'use strict';

/* ── boilerplate ─────────────────────────────────────────────── */
(function(){const b=document.getElementById('readBar');if(!b)return;function u(){const d=document.documentElement;b.style.width=Math.min(100,(window.scrollY/(d.scrollHeight-d.clientHeight))*100)+'%'}window.addEventListener('scroll',u,{passive:true});u();})();
window.toggleSidebar=function(){document.getElementById('lessonSidebar').classList.toggle('open');};
document.addEventListener('click',(e)=>{const sb=document.getElementById('lessonSidebar');const btn=document.getElementById('menuBtn');if(sb&&btn&&!sb.contains(e.target)&&!btn.contains(e.target))sb.classList.remove('open');});
(function(){const links=document.querySelectorAll('.lnav-item[data-sec]');const secs=Array.from(document.querySelectorAll('.lesson-sec[id]'));const fill=document.getElementById('progFill');const pct=document.getElementById('progPct');function u(){const y=window.scrollY+120;let ai=0;secs.forEach((s,i)=>{if(s.offsetTop<=y)ai=i;});links.forEach((l,i)=>{l.classList.toggle('active',i===ai);if(i<ai){l.classList.add('done');const d=l.querySelector('.lnav-dot');if(d)d.style.background='#34c759';}});const p=Math.round((ai/Math.max(1,secs.length-1))*100);if(fill)fill.style.width=p+'%';if(pct)pct.textContent=p+'%';}window.addEventListener('scroll',u,{passive:true});u();})();
document.querySelectorAll('.lnav-item[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('lessonSidebar').classList.remove('open');});});

/* ═══════════════════════════════════════════════════════════════
   MORPHOLOGICAL PRIMITIVES (pure JS, used by all demos)
═══════════════════════════════════════════════════════════════ */
function makeSE(shape, size) {
  const se = [], c = Math.floor(size/2);
  for (let r=0;r<size;r++){se.push([]);for(let c2=0;c2<size;c2++){
    let v=0;
    if(shape==='rect')v=1;
    else if(shape==='cross')v=(r===c||c2===c)?1:0;
    else if(shape==='ellipse')v=(((r-c)/(c+.5))**2+((c2-c)/(c+.5))**2<=1)?1:0;
    se[r].push(v);
  }}
  return se;
}

function erodeImg(img, W, H, se) {
  const ks=se.length, pad=Math.floor(ks/2);
  const out=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    let ok=true;
    outer: for(let kr=0;kr<ks;kr++) for(let kc=0;kc<ks;kc++){
      if(!se[kr][kc])continue;
      const sy=y+kr-pad, sx=x+kc-pad;
      if(sy<0||sy>=H||sx<0||sx>=W){ok=false;break outer;}
      if(img[sy*W+sx]===0){ok=false;break outer;}
    }
    out[y*W+x]=ok?255:0;
  }
  return out;
}

function dilateImg(img, W, H, se) {
  const ks=se.length, pad=Math.floor(ks/2);
  const out=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    for(let kr=0;kr<ks;kr++) for(let kc=0;kc<ks;kc++){
      if(!se[kr][kc])continue;
      const sy=y+kr-pad, sx=x+kc-pad;
      if(sy>=0&&sy<H&&sx>=0&&sx<W&&img[sy*W+sx]===255){out[y*W+x]=255;break;}
    }
  }
  return out;
}

function openImg(img,W,H,se){return dilateImg(erodeImg(img,W,H,se),W,H,se);}
function closeImg(img,W,H,se){return erodeImg(dilateImg(img,W,H,se),W,H,se);}
function gradientImg(img,W,H,se){
  const d=dilateImg(img,W,H,se),e=erodeImg(img,W,H,se);
  return d.map((v,i)=>Math.max(0,v-e[i]));
}
function topHatImg(img,W,H,se){
  const op=openImg(img,W,H,se);
  return img.map((v,i)=>Math.max(0,v-op[i]));
}
function blackHatImg(img,W,H,se){
  const cl=closeImg(img,W,H,se);
  return cl.map((v,i)=>Math.max(0,v-img[i]));
}
function skeletonStep(img,W,H){
  const se3=makeSE('rect',3);
  const eroded=erodeImg(img,W,H,se3);
  const opened=openImg(img,W,H,se3);
  // S = eroded - open(eroded)
  const s=eroded.map((v,i)=>Math.max(0,v-opened[i]));
  return {eroded,s};
}
function skeletonize(img,W,H){
  let cur=new Uint8Array(img);
  const skel=new Uint8Array(W*H);
  const steps=[new Uint8Array(img)];
  for(let i=0;i<20;i++){
    const {eroded,s}=skeletonStep(cur,W,H);
    s.forEach((v,j)=>{if(v>0)skel[j]=255;});
    const snap=new Uint8Array(skel);
    steps.push(snap);
    if(eroded.every(v=>v===0))break;
    cur=eroded;
  }
  return steps;
}
function reconImg(img,W,H){
  // Remove objects touching border via simple marker reconstruction
  const marker=new Uint8Array(img);
  // zero interior
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)marker[y*W+x]=0;
  // flood fill from border using dilation constrained by original
  const se=makeSE('rect',3);
  let prev=null,cur=new Uint8Array(marker);
  for(let iter=0;iter<50;iter++){
    const d=dilateImg(cur,W,H,se).map((v,i)=>Math.min(v,img[i]));
    if(prev&&d.every((v,i)=>v===prev[i]))break;
    prev=d; cur=d;
  }
  // border objects = cur; result = original - border objects
  return img.map((v,i)=>Math.max(0,v-cur[i]));
}

function drawBinaryToCanvas(canvas, img, W, H, color) {
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const id=ctx.createImageData(W,H);
  for(let i=0;i<img.length;i++){
    const v=img[i];
    if(v>0){
      if(color){
        const c=hexToRgb(color);
        id.data[i*4]=c.r; id.data[i*4+1]=c.g; id.data[i*4+2]=c.b;
      } else {
        id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;
      }
    }
    id.data[i*4+3]=255;
  }
  ctx.putImageData(id,0,0);
}

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return{r,g,b};
}

function resizeImg(img,srcW,srcH,dstW,dstH){
  const out=new Uint8Array(dstW*dstH);
  for(let y=0;y<dstH;y++) for(let x=0;x<dstW;x++){
    const sy=Math.floor(y*srcH/dstH), sx=Math.floor(x*srcW/dstW);
    out[y*dstW+x]=img[sy*srcW+sx];
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   SE DESIGNER
═══════════════════════════════════════════════════════════════ */
(function(){
  const gridEl=document.getElementById('seGrid');
  if(!gridEl)return;
  let seSize=5, seData=null;

  const PRESETS={
    rect3:{size:3,data:()=>Array(9).fill(1)},
    rect5:{size:5,data:()=>Array(25).fill(1)},
    cross:{size:5,data:()=>{const d=Array(25).fill(0);const c=2;for(let i=0;i<5;i++){d[c*5+i]=1;d[i*5+c]=1;}return d;}},
    ellipse:{size:5,data:()=>{const d=[];const c=2;for(let r=0;r<5;r++)for(let x=0;x<5;x++)d.push(((r-c)/2.5)**2+((x-c)/2.5)**2<=1?1:0);return d;}},
    custom:{size:5,data:()=>{const d=Array(25).fill(0);d[0]=d[4]=d[12]=d[20]=d[24]=1;return d;}},
  };

  function applyPreset(name){
    const p=PRESETS[name];
    seSize=p.size; seData=p.data();
    renderGrid(); updatePreviews();
  }

  function renderGrid(){
    gridEl.style.gridTemplateColumns='repeat('+seSize+',28px)';
    gridEl.innerHTML='';
    seData.forEach((v,i)=>{
      const cell=document.createElement('div');
      cell.className='se-cell'+(v?' on':'');
      cell.addEventListener('click',()=>{seData[i]=seData[i]?0:1;renderGrid();updatePreviews();});
      gridEl.appendChild(cell);
    });
    const info=document.getElementById('seInfo');
    if(info){const ones=seData.filter(Boolean).length;info.innerHTML='Size: <span>'+seSize+'×'+seSize+'</span> · Active: <span>'+ones+'/'+seData.length+'</span>';}
  }

  function updatePreviews(){
    const se2d=[];for(let r=0;r<seSize;r++){se2d.push(seData.slice(r*seSize,(r+1)*seSize));}
    const W=20,H=20;
    // base shape: circle
    const orig=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(((y-9.5)/6.5)**2+((x-9.5)/6.5)**2<=1)orig[y*W+x]=255;
    // noise
    [2,3,16,17].forEach(p=>{if(p<W*H)orig[p]=255;});
    // hole
    orig[9*W+9]=orig[9*W+10]=orig[10*W+9]=0;

    const S=80;
    const draw=(id,img)=>{const c=document.getElementById(id);if(!c)return;drawBinaryToCanvas(c,resizeImg(img,W,H,S,S),S,S);};
    draw('seOrigCanvas', orig);
    draw('seEroCanvas',  erodeImg(orig,W,H,se2d));
    draw('seDilCanvas',  dilateImg(orig,W,H,se2d));
    draw('seOpenCanvas', openImg(orig,W,H,se2d));
    draw('seCloseCanvas',closeImg(orig,W,H,se2d));
  }

  document.querySelectorAll('.se-preset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.se-preset').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      applyPreset(btn.dataset.preset);
    });
  });

  applyPreset('rect5');
})();

/* ═══════════════════════════════════════════════════════════════
   EROSION/DILATION LIVE DRAW DEMO
═══════════════════════════════════════════════════════════════ */
(function(){
  const drawC=document.getElementById('drawCanvas');
  if(!drawC)return;
  const W=180,H=180;
  [drawC,document.getElementById('erosionCanvas'),document.getElementById('dilationCanvas')]
    .forEach(c=>{if(c){c.width=W;c.height=H;}});

  let drawing=false, drawTool='draw';
  let demoSEShape='rect', demoSESize=3, demoIter=1;
  const ctx=drawC.getContext('2d');
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);

  function getPos(e){
    const r=drawC.getBoundingClientRect();
    const cl=e.touches?e.touches[0]:e;
    return{x:Math.round((cl.clientX-r.left)*(W/r.width)),y:Math.round((cl.clientY-r.top)*(H/r.height))};
  }

  function drawAt(x,y){
    ctx.fillStyle=drawTool==='draw'?'#fff':'#000';
    ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
    scheduleUpdate();
  }

  drawC.addEventListener('mousedown',e=>{drawing=true;const p=getPos(e);drawAt(p.x,p.y);});
  drawC.addEventListener('mousemove',e=>{if(!drawing)return;const p=getPos(e);drawAt(p.x,p.y);});
  drawC.addEventListener('mouseup',()=>drawing=false);
  drawC.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const p=getPos(e);drawAt(p.x,p.y);},{passive:false});
  drawC.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;const p=getPos(e);drawAt(p.x,p.y);},{passive:false});
  drawC.addEventListener('touchend',()=>drawing=false);

  let updateTimer=null;
  function scheduleUpdate(){clearTimeout(updateTimer);updateTimer=setTimeout(updateResults,30);}

  function getImgData(){
    const id=ctx.getImageData(0,0,W,H);
    const img=new Uint8Array(W*H);
    for(let i=0;i<img.length;i++)img[i]=id.data[i*4]>127?255:0;
    return img;
  }

  function updateResults(){
    const img=getImgData();
    const se=makeSE(demoSEShape,demoSESize);
    let er=img,di=img;
    for(let i=0;i<demoIter;i++){er=erodeImg(er,W,H,se);di=dilateImg(di,W,H,se);}
    const eC=document.getElementById('erosionCanvas'),dC=document.getElementById('dilationCanvas');
    if(eC)drawBinaryToCanvas(eC,er,W,H,'#2997ff');
    if(dC)drawBinaryToCanvas(dC,di,W,H,'#ff9f0a');
    drawSEPreview();
  }

  function drawSEPreview(){
    const c=document.getElementById('demoSePreview');
    if(!c)return;
    const se=makeSE(demoSEShape,demoSESize);
    const S=60,cs=Math.floor(S/demoSESize);
    c.width=S;c.height=S;
    const ctx2=c.getContext('2d');
    ctx2.fillStyle='#0a0a0f';ctx2.fillRect(0,0,S,S);
    se.forEach((row,r)=>row.forEach((v,c2)=>{
      ctx2.fillStyle=v?'#2997ff33':'#ffffff08';
      ctx2.fillRect(c2*cs,r*cs,cs-1,cs-1);
      if(v){ctx2.fillStyle='#2997ff';ctx2.fillRect(c2*cs+2,r*cs+2,cs-4,cs-4);}
    }));
  }

  window.setDrawTool=function(btn,tool){
    document.querySelectorAll('#eroDilDemo .md-tool[data-tool]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); drawTool=tool;
  };
  window.clearDraw=function(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);updateResults();};
  window.setDemoSE=function(btn,shape){
    document.querySelectorAll('.md-se-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); demoSEShape=shape; updateResults();
  };
  window.updateDemoSESize=function(v){
    demoSESize=parseInt(v);
    document.getElementById('demoSeSize').textContent=v;
    document.getElementById('demoSeSizeB').textContent=v;
    updateResults();
  };
  window.updateDemoIter=function(v){
    demoIter=parseInt(v);
    document.getElementById('demoIter').textContent=v;
    updateResults();
  };
  window.loadPresetShape=function(name){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    if(name==='blob'){
      ctx.beginPath();ctx.ellipse(90,90,50,40,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(130,70,15,12,0,0,Math.PI*2);ctx.fill();
      // noise
      [[10,10],[20,160],[160,15],[5,80]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
      // holes
      ctx.fillStyle='#000';
      [[85,85],[95,95],[75,90]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();});
    } else if(name==='text'){
      ctx.font='bold 48px Arial';ctx.fillStyle='#fff';ctx.fillText('CV',30,110);
      ctx.font='bold 28px Arial';ctx.fillText('AI',100,150);
      // noise
      ctx.font='bold 1px Arial';
      for(let i=0;i<5;i++){const x=Math.random()*180,y=Math.random()*180;ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    } else if(name==='noise'){
      for(let i=0;i<800;i++){
        const x=Math.random()*180,y=Math.random()*180;
        ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
      }
    }
    updateResults();
  };

  loadPresetShape('blob');
})();

/* ═══════════════════════════════════════════════════════════════
   OPENING/CLOSING STEP DEMO
═══════════════════════════════════════════════════════════════ */
(function(){
  const origC=document.getElementById('ocOrigCanvas');
  if(!origC)return;
  const W=140,H=140;
  [origC,document.getElementById('ocStep1Canvas'),document.getElementById('ocStep2Canvas')]
    .forEach(c=>{if(c){c.width=W;c.height=H;}});

  let ocMode='opening', ocScene='noise', ocSize=3;

  function makeScene(scene){
    const img=new Uint8Array(W*H);
    // main shape: rectangle
    for(let y=25;y<115;y++)for(let x=25;x<115;x++)img[y*W+x]=255;
    if(scene==='noise'||scene==='both'){
      // white noise pixels outside
      [[5,5],[10,130],[130,10],[8,70],[140-10,140-8],[60,5]].forEach(([y,x])=>{if(y<H&&x<W)img[y*W+x]=255;});
    }
    if(scene==='holes'||scene==='both'){
      // black holes inside
      [[50,50],[70,70],[90,50],[60,90],[80,80]].forEach(([y,x])=>{if(y<H&&x<W)img[y*W+x]=0;});
    }
    return img;
  }

  function render(){
    const img=makeScene(ocScene);
    const se=makeSE('rect',ocSize);
    drawBinaryToCanvas(origC, img, W, H);
    const lbl1=document.getElementById('ocStep1Label'), lbl2=document.getElementById('ocStep2Label');
    if(ocMode==='opening'){
      const eroded=erodeImg(img,W,H,se);
      const opened=dilateImg(eroded,W,H,se);
      drawBinaryToCanvas(document.getElementById('ocStep1Canvas'), eroded, W, H, '#ff375f');
      drawBinaryToCanvas(document.getElementById('ocStep2Canvas'), opened, W, H, '#2997ff');
      if(lbl1)lbl1.textContent='Step 1: Erode';
      if(lbl2)lbl2.textContent='Step 2: Dilate';
    } else {
      const dilated=dilateImg(img,W,H,se);
      const closed=erodeImg(dilated,W,H,se);
      drawBinaryToCanvas(document.getElementById('ocStep1Canvas'), dilated, W, H, '#ff9f0a');
      drawBinaryToCanvas(document.getElementById('ocStep2Canvas'), closed,  W, H, '#a855f7');
      if(lbl1)lbl1.textContent='Step 1: Dilate';
      if(lbl2)lbl2.textContent='Step 2: Erode';
    }
  }

  window.setOCMode=function(btn,mode){
    document.querySelectorAll('.ocd-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); ocMode=mode; render();
  };
  window.setOCScene=function(btn,scene){
    document.querySelectorAll('.ocd-scene').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); ocScene=scene; render();
  };
  window.updateOCSize=function(v){
    ocSize=parseInt(v);
    document.getElementById('ocSeSize').textContent=v;
    document.getElementById('ocSeSizeB').textContent=v;
    render();
  };

  render();
})();

/* ═══════════════════════════════════════════════════════════════
   ADVANCED OPS DEMO
═══════════════════════════════════════════════════════════════ */
(function(){
  const advC=document.getElementById('advDrawCanvas');
  if(!advC)return;
  const W=140,H=140,S=100;
  advC.width=W; advC.height=H;
  let advTool='draw', advSize=5, advDrawing=false;
  const ctx=advC.getContext('2d');
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);

  function getPos(e){
    const r=advC.getBoundingClientRect();
    const cl=e.touches?e.touches[0]:e;
    return{x:Math.round((cl.clientX-r.left)*(W/r.width)),y:Math.round((cl.clientY-r.top)*(H/r.height))};
  }
  function drawAt(x,y){ctx.fillStyle=advTool==='draw'?'#fff':'#000';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();scheduleAdv();}
  advC.addEventListener('mousedown',e=>{advDrawing=true;drawAt(...Object.values(getPos(e)));});
  advC.addEventListener('mousemove',e=>{if(!advDrawing)return;drawAt(...Object.values(getPos(e)));});
  advC.addEventListener('mouseup',()=>advDrawing=false);
  advC.addEventListener('touchstart',e=>{e.preventDefault();advDrawing=true;drawAt(...Object.values(getPos(e)));},{passive:false});
  advC.addEventListener('touchmove',e=>{e.preventDefault();if(!advDrawing)return;drawAt(...Object.values(getPos(e)));},{passive:false});
  advC.addEventListener('touchend',()=>advDrawing=false);

  let advTimer=null;
  function scheduleAdv(){clearTimeout(advTimer);advTimer=setTimeout(updateAdv,40);}

  function getImg(){
    const id=ctx.getImageData(0,0,W,H);
    const img=new Uint8Array(W*H);
    for(let i=0;i<img.length;i++)img[i]=id.data[i*4]>127?255:0;
    return img;
  }

  function updateAdv(){
    const img=getImg();
    const se=makeSE('rect',advSize);
    const grad=gradientImg(img,W,H,se);
    const th=topHatImg(img,W,H,se);
    const bh=blackHatImg(img,W,H,se);
    const e2=erodeImg(img,W,H,se), ec=erodeImg(img.map(v=>255-v),W,H,makeSE('cross',3));
    const hm=e2.map((v,i)=>v>0&&ec[i]>0?255:0);

    const draw=(id,d,col)=>{const c=document.getElementById(id);if(!c){return;}c.width=S;c.height=S;drawBinaryToCanvas(c,resizeImg(d,W,H,S,S),S,S,col);};
    draw('advGradCanvas',  grad, '#2997ff');
    draw('advTopHatCanvas',th,   '#ffd600');
    draw('advBlkHatCanvas',bh,   '#a855f7');
    draw('advHitCanvas',   hm,   '#34c759');
  }

  window.setAdvTool=function(btn,tool){
    document.querySelectorAll('.adv-draw-tools .md-tool[onclick]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); advTool=tool;
  };
  window.clearAdvDraw=function(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);updateAdv();};
  window.loadAdvScene=function(name){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    if(name==='shapes'){
      ctx.beginPath();ctx.ellipse(50,50,25,20,0,0,Math.PI*2);ctx.fill();
      ctx.fillRect(80,70,40,35);
      ctx.beginPath();ctx.arc(50,110,20,0,Math.PI*2);ctx.fill();
    } else if(name==='text'){
      ctx.font='bold 40px Arial';ctx.fillText('A',30,90);
      ctx.font='bold 28px Arial';ctx.fillText('B',85,90);
    } else if(name==='lines'){
      for(let i=0;i<5;i++){ctx.fillRect(10,20+i*22,120,8);}
    } else if(name==='cells'){
      [[35,35],[35,105],[105,35],[105,105],[70,70]].forEach(([y,x])=>{ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();});
    }
    scheduleAdv();
  };
  window.updateAdvSE=function(v){
    advSize=parseInt(v);
    document.getElementById('advSeSize').textContent=v;
    document.getElementById('advSeSizeB').textContent=v;
    updateAdv();
  };

  window.loadAdvScene('shapes');
})();

/* ═══════════════════════════════════════════════════════════════
   SKELETON DEMO
═══════════════════════════════════════════════════════════════ */
(function(){
  const inC=document.getElementById('skInputCanvas');
  if(!inC)return;
  const W=140,H=140;
  inC.width=W; inC.height=H;
  const resC=document.getElementById('skResultCanvas');
  if(resC){resC.width=W;resC.height=H;}
  const ctx=inC.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  let skSteps=[], skCurrent=0, skAutoT=null;

  function computeSkel(){
    const id=ctx.getImageData(0,0,W,H);
    const img=new Uint8Array(W*H);
    for(let i=0;i<img.length;i++)img[i]=id.data[i*4]>127?255:0;
    skSteps=skeletonize(img,W,H);
    skCurrent=0; renderSkStep();
  }

  function renderSkStep(){
    if(!skSteps.length)return;
    const step=Math.min(skCurrent, skSteps.length-1);
    if(resC)drawBinaryToCanvas(resC,skSteps[step],W,H,'#34c759');
    const el=document.getElementById('skStep');
    if(el)el.textContent=step;
    const prog=document.getElementById('skProgFill');
    if(prog)prog.style.width=((step/(skSteps.length-1||1))*100)+'%';
    const info=document.getElementById('skInfo');
    if(info)info.textContent='Step '+step+' / '+(skSteps.length-1)+' — '+(step===0?'Original':step>=skSteps.length-1?'Final skeleton':'Iteration '+step);
  }

  window.skStepFwd=function(){skCurrent=Math.min(skSteps.length-1,(skCurrent||0)+1);renderSkStep();};
  window.skStepBack=function(){skCurrent=Math.max(0,(skCurrent||0)-1);renderSkStep();};
  window.skToggleAuto=function(){
    const btn=document.getElementById('skAutoBtn');
    if(skAutoT){clearInterval(skAutoT);skAutoT=null;if(btn)btn.textContent='▶ Auto';}
    else{if(btn)btn.textContent='⏸ Pause';skAutoT=setInterval(()=>{skCurrent=(skCurrent+1)%(skSteps.length||1);renderSkStep();},300);}
  };

  window.loadSkShape=function(name){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    if(name==='letter'){ctx.font='bold 80px Arial';ctx.fillText('A',30,110);}
    else if(name==='branch'){
      ctx.lineWidth=12;ctx.strokeStyle='#fff';ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(70,130);ctx.lineTo(70,50);ctx.stroke();
      ctx.beginPath();ctx.moveTo(70,70);ctx.lineTo(30,30);ctx.stroke();
      ctx.beginPath();ctx.moveTo(70,90);ctx.lineTo(115,40);ctx.stroke();
      ctx.beginPath();ctx.moveTo(70,110);ctx.lineTo(110,120);ctx.stroke();
    }
    else if(name==='circle'){ctx.lineWidth=14;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(70,70,45,0,Math.PI*2);ctx.stroke();}
    else if(name==='rect'){ctx.lineWidth=14;ctx.strokeStyle='#fff';ctx.strokeRect(25,35,90,60);}
    computeSkel();
  };

  window.loadSkShape('letter');
})();

/* ═══════════════════════════════════════════════════════════════
   RECONSTRUCTION DEMO
═══════════════════════════════════════════════════════════════ */
(function(){
  const origC=document.getElementById('reconOrigCanvas');
  if(!origC)return;
  const W=120,H=120;
  [origC,'reconMarkerCanvas','reconResultCanvas'].forEach(id=>{
    const c=typeof id==='string'?document.getElementById(id):id;
    if(c){c.width=W;c.height=H;}
  });

  let reconScene='mixed';

  function makeReconScene(name){
    const img=new Uint8Array(W*H);
    if(name==='mixed'){
      // objects not touching border
      for(let y=30;y<50;y++)for(let x=30;x<50;x++)img[y*W+x]=255;
      for(let y=70;y<95;y++)for(let x=60;x<85;x++)img[y*W+x]=255;
      // objects touching border
      for(let y=0;y<20;y++)for(let x=0;x<20;x++)img[y*W+x]=255; // top-left
      for(let y=100;y<H;y++)for(let x=85;x<W;x++)img[y*W+x]=255; // bottom-right
      for(let y=40;y<70;y++)img[y*W+(W-1)]=img[y*W+(W-2)]=img[y*W+(W-3)]=255; // right edge
    } else if(name==='cells'){
      [[25,25],[25,95],[95,25],[95,95],[60,60]].forEach(([y,x])=>{for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++)if(dy*dy+dx*dx<=144&&y+dy>=0&&y+dy<H&&x+dx>=0&&x+dx<W)img[(y+dy)*W+(x+dx)]=255;});
      // border-touching cell
      for(let dy=0;dy<=15;dy++)for(let dx=0;dx<=15;dx++)if(dy*dy+dx*dx<=225)img[dy*W+dx]=255;
    } else if(name==='lines'){
      for(let i=1;i<5;i++){for(let x=0;x<W;x++)img[(i*20)*W+x]=255;}
      // partial line touching border
      for(let x=0;x<60;x++)img[0*W+x]=255;
    }
    return img;
  }

  function render(){
    const img=makeReconScene(reconScene);
    const marker=new Uint8Array(img);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)marker[y*W+x]=0;
    const result=reconImg(img,W,H);
    drawBinaryToCanvas(origC,img,W,H);
    drawBinaryToCanvas(document.getElementById('reconMarkerCanvas'),marker,W,H,'#ff9f0a');
    drawBinaryToCanvas(document.getElementById('reconResultCanvas'),result,W,H,'#34c759');
  }

  window.setReconScene=function(btn,scene){
    document.querySelectorAll('.recon-scene-btns .ocd-scene').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    reconScene=scene; render();
  };
  render();
})();

/* ═══════════════════════════════════════════════════════════════
   FULL SANDBOX (all 10 ops)
═══════════════════════════════════════════════════════════════ */
(function(){
  const sbC=document.getElementById('sbInputCanvas');
  if(!sbC)return;
  const W=200,H=200,S=110;
  sbC.width=W; sbC.height=H;
  let sbTool='draw', sbDrawing=false;
  const ctx=sbC.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  function getPos(e){
    const r=sbC.getBoundingClientRect();
    const cl=e.touches?e.touches[0]:e;
    return{x:Math.round((cl.clientX-r.left)*(W/r.width)),y:Math.round((cl.clientY-r.top)*(H/r.height))};
  }
  function drawAt(x,y){ctx.fillStyle=sbTool==='draw'?'#fff':'#000';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();scheduleSb();}
  sbC.addEventListener('mousedown',e=>{sbDrawing=true;drawAt(...Object.values(getPos(e)));});
  sbC.addEventListener('mousemove',e=>{if(!sbDrawing)return;drawAt(...Object.values(getPos(e)));});
  sbC.addEventListener('mouseup',()=>sbDrawing=false);
  sbC.addEventListener('touchstart',e=>{e.preventDefault();sbDrawing=true;drawAt(...Object.values(getPos(e)));},{passive:false});
  sbC.addEventListener('touchmove',e=>{e.preventDefault();if(!sbDrawing)return;drawAt(...Object.values(getPos(e)));},{passive:false});
  sbC.addEventListener('touchend',()=>sbDrawing=false);

  let sbTimer=null;
  function scheduleSb(){clearTimeout(sbTimer);sbTimer=setTimeout(updateSandbox,50);}

  window.updateSandbox=function(){
    const id=ctx.getImageData(0,0,W,H);
    const img=new Uint8Array(W*H);
    for(let i=0;i<img.length;i++)img[i]=id.data[i*4]>127?255:0;

    const shape=document.getElementById('sbSeShape').value;
    const size=parseInt(document.getElementById('sbSeSize').value);
    const se=makeSE(shape,size);

    const er=erodeImg(img,W,H,se);
    const di=dilateImg(img,W,H,se);
    const op=openImg(img,W,H,se);
    const cl=closeImg(img,W,H,se);
    const gr=gradientImg(img,W,H,se);
    const th=topHatImg(img,W,H,se);
    const bh=blackHatImg(img,W,H,se);
    const skel=skeletonize(img,W,H);
    const skelFinal=skel[skel.length-1]||img;
    // hit-or-miss: find isolated pixels
    const e2=erodeImg(img,W,H,makeSE('cross',3));
    const ec=erodeImg(img.map(v=>255-v),W,H,makeSE('rect',3));
    const hm=e2.map((v,i)=>v>0&&ec[i]>0?255:0);
    const recon=reconImg(img,W,H);

    const ops=[
      ['sbErode',er,'#2997ff'],['sbDilate',di,'#ff9f0a'],
      ['sbOpen',op,'#34c759'],['sbClose',cl,'#a855f7'],
      ['sbGrad',gr,'#00c7be'],['sbTopHat',th,'#ffd600'],
      ['sbBlkHat',bh,'#ff375f'],['sbSkel',skelFinal,'#34c759'],
      ['sbHitMiss',hm,'#ff9f0a'],['sbRecon',recon,'#2997ff'],
    ];
    ops.forEach(([id,d,col])=>{
      const c=document.getElementById(id);
      if(!c)return;
      c.width=S;c.height=S;
      drawBinaryToCanvas(c,resizeImg(d,W,H,S,S),S,S,col);
    });
  };

  window.setSbTool=function(btn,tool){
    document.querySelectorAll('.sb-tool-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); sbTool=tool;
  };
  window.clearSb=function(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);updateSandbox();};
  window.loadSbScene=function(name){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    if(name==='defects'){
      ctx.fillRect(40,40,120,120);
      // holes
      [[80,80],[100,100],[120,80],[90,120]].forEach(([y,x])=>{ctx.fillStyle='#000';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';});
      // noise
      [[10,10],[15,185],[185,10],[5,100]].forEach(([y,x])=>{ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
    } else if(name==='text'){
      ctx.font='bold 60px Arial';ctx.fillText('CV',30,120);
      ctx.font='bold 36px Arial';ctx.fillText('AI',120,160);
    } else if(name==='cells'){
      [[50,50],[50,150],[150,50],[150,150],[100,100]].forEach(([y,x])=>{ctx.beginPath();ctx.arc(x,y,30,0,Math.PI*2);ctx.fill();});
    } else if(name==='circuit'){
      ctx.lineWidth=8;ctx.strokeStyle='#fff';
      [[20,20,180,20],[20,20,20,180],[180,20,180,180],[20,180,180,180]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
      ctx.lineWidth=6;
      [[20,100,100,100],[100,20,100,100],[100,100,180,100],[100,100,100,180]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
      [[50,50],[150,50],[50,150],[150,150],[100,100]].forEach(([x,y])=>{ctx.fillRect(x-8,y-8,16,16);});
    }
    scheduleSb();
  };

  window.loadSbScene('defects');
})();

/* ═══════════════════════════════════════════════════════════════
   PYODIDE + QUIZ + CHALLENGES
═══════════════════════════════════════════════════════════════ */
let pyodideInstance=null;
async function initPyodide(){
  try{
    const py=await loadPyodide();
    await py.loadPackage('numpy');
    pyodideInstance=py;
    const o=document.getElementById('pyLoading');if(o)o.style.display='none';
    const st=document.getElementById('pyStatus');
    if(st){st.textContent='✅ Python ready';st.className='py-status ready';}
    const dot=document.getElementById('pgReadyDot');if(dot)dot.style.background='#34c759';
  }catch(err){
    const o=document.getElementById('pyLoading');if(o)o.style.display='none';
    const st=document.getElementById('pyStatus');
    if(st){st.textContent='❌ Python failed';st.className='py-status error';}
  }
}
initPyodide();

async function runCode(code,outPre,checkEl,checkFn){
  if(!pyodideInstance){if(outPre){outPre.textContent='Python runtime not ready…';outPre.closest('.output-wrap').style.display='block';}return;}
  const btn=event&&event.currentTarget;
  if(btn){btn.disabled=true;btn.textContent='⏳ Running…';}
  try{
    let stdout='';
    pyodideInstance.setStdout({batched:(s)=>{stdout+=s+'\n';}});
    await pyodideInstance.runPythonAsync(code);
    if(outPre){outPre.textContent=stdout||'(no output)';outPre.closest('.output-wrap').style.display='block';}
    if(checkEl&&checkFn){const r=checkFn(stdout.trim());checkEl.textContent=r.msg;checkEl.className='check-result show '+(r.pass?'pass':'fail');}
  }catch(err){
    if(outPre){outPre.textContent='❌ '+err.message;outPre.closest('.output-wrap').style.display='block';}
  }
  if(btn){btn.disabled=false;btn.textContent='▶ Run';}
}

window.runChallenge=async function(edId,outId,checkId){
  const code=document.getElementById(edId).value;
  const outEl=document.getElementById(outId+'-pre');
  const chkEl=document.getElementById(checkId);
  const checks={
    'check-1':o=>({pass:o.includes('True')&&o.includes('True'),msg:o.includes('True')&&o.includes('True')?'✅ Erosion removes isolated pixels and shrinks the rectangle.':'❌ pad with 0, window=padded[y:y+3,x:x+3], condition: neighborhood.min()==255'}),
    'check-2':o=>({pass:o.includes('0\nAfter opening - main')&&o.includes('255\nAfter closing - hole filled')&&o.includes('True'),msg:(o.includes('0\n')&&o.includes('255\n'))?'✅ Opening removed noise, closing filled hole!':'❌ Opening=dilate(erode(img,se),se). Closing=erode(dilate(img,se),se)'}),
    'check-3':o=>({pass:o.includes('Interior pixel (5,5): 0')&&o.includes('Edge pixel (2,5): 255'),msg:o.includes('0')&&o.includes('255')?'✅ Gradient = dilation − erosion extracts edges correctly.':'❌ gradient = np.clip(dilated.astype(int) - eroded.astype(int), 0, 255)'}),
    'cq-1-check':o=>({pass:o.includes('Opening correct: True'),msg:o.includes('True')?'✅ Fixed! Opening = erode→dilate.':'❌ Opening = dilate(erode(img,ks),ks) — erode first, then dilate.'}),
    'cq-2-check':o=>({pass:o.includes('Spots found (>50): 3'),msg:o.includes('3')?'✅ Top-Hat found all 3 bright spots!':'❌ opened=dilate(erode(img,5),5), top_hat=np.clip(img-opened,0,255)'}),
    'cq-3-check':o=>({pass:o.includes('True')&&o.includes('False'),msg:(o.includes('True')&&o.includes('False'))?'✅ Complete defect detection pipeline!':'❌ cleaned=dilate(erode(img,3),3), filled=erode(dilate(cleaned,3),3), gradient=dilated-eroded'}),
  };
  await runCode(code,outEl,chkEl,checks[checkId]);
  checkFinalScore();
};

window.toggleHint=function(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'block':'none';};

const chDefaults={
  1:`import numpy as np\n\nimg = np.zeros((10, 10), dtype=np.uint8)\nimg[2:8, 2:8] = 255\nimg[1, 1]     = 255\n\nprint("Before erosion (row sums):", img.sum(axis=1).tolist())\n\ndef erode_3x3(binary):\n    out    = np.zeros_like(binary)\n    padded = np.pad(binary, 1, mode='constant', constant_values=___)\n    for y in range(binary.shape[0]):\n        for x in range(binary.shape[1]):\n            neighborhood = padded[y:y+___, x:x+___]\n            if neighborhood.___()===___:\n                out[y, x] = 255\n    return out\n\neroded = erode_3x3(img)\nprint("After  erosion (row sums):", eroded.sum(axis=1).tolist())\nprint("Noise removed:", eroded[1, 1] == 0)\nprint("Rectangle still present:", eroded[3, 3] == 255)`,
  2:`import numpy as np\n\ndef erode(img, se):\n    h, w = img.shape; ks = se.shape[0]; pad = ks//2\n    p   = np.pad(img, pad, mode='constant', constant_values=0)\n    out = np.zeros_like(img)\n    for y in range(h):\n        for x in range(w):\n            region = p[y:y+ks, x:x+ks]\n            if (region * se).min() >= 255 * se.max(): out[y,x] = 255\n    return out\n\ndef dilate(img, se):\n    h, w = img.shape; ks = se.shape[0]; pad = ks//2\n    p   = np.pad(img, pad, mode='constant', constant_values=0)\n    out = np.zeros_like(img)\n    for y in range(h):\n        for x in range(w):\n            region = p[y:y+ks, x:x+ks]\n            if (region & (se*255)).max() > 0: out[y,x] = 255\n    return out\n\nse3 = np.ones((3,3), dtype=np.uint8)\n\nimg = np.zeros((12,12), dtype=np.uint8)\nimg[2:10, 2:10] = 255\nimg[0, 0]  = 255\nimg[1, 9]  = 255\nimg[5, 5]  = 0\n\nprint("Noise pixels outside rect:", img[0,0], img[1,9])\nprint("Hole inside rect:", img[5,5])\n\nopened = dilate(___(img, se3), se3)\nprint("After opening - noise at (0,0):", opened[0,0])\nprint("After opening - main rect at (5,3):", opened[5,3])\n\nclosed = ___(___(img, se3), se3)\nprint("After closing - hole filled at (5,5):", closed[5,5])\nprint("After closing - main rect intact:", closed[3,3])`,
  3:`import numpy as np\n\ndef erode_simple(img, ks=3):\n    pad = ks//2\n    p = np.pad(img.astype(float), pad, mode='constant')\n    out = np.zeros_like(img, dtype=float)\n    for y in range(img.shape[0]):\n        for x in range(img.shape[1]):\n            out[y,x] = p[y:y+ks, x:x+ks].min()\n    return out.astype(np.uint8)\n\ndef dilate_simple(img, ks=3):\n    pad = ks//2\n    p = np.pad(img.astype(float), pad, mode='constant')\n    out = np.zeros_like(img, dtype=float)\n    for y in range(img.shape[0]):\n        for x in range(img.shape[1]):\n            out[y,x] = p[y:y+ks, x:x+ks].max()\n    return out.astype(np.uint8)\n\nimg = np.zeros((12,12), dtype=np.uint8)\nimg[2:10, 2:10] = 255\n\neroded  = erode_simple(img,  ks=3)\ndilated = dilate_simple(img, ks=3)\n\ngradient = ___\ngradient = np.clip(gradient.astype(int), 0, 255).astype(np.uint8)\n\nprint("Gradient non-zero pixels:", int((gradient > 0).sum()))\nprint("Interior pixel (5,5):", gradient[5,5])\nprint("Edge pixel (2,5):", gradient[2,5])\nprint("Edge pixel (5,2):", gradient[5,2])`,
};
window.resetChallenge=function(edId,num){if(chDefaults[num])document.getElementById(edId).value=chDefaults[num];};

const quizData=[
  {q:'An image has isolated white noise pixels (1px) and a large white object. Which operation removes only the noise?',opts:['Dilation with 3×3 SE','Erosion with 3×3 SE','Closing with 3×3 SE','Opening with 3×3 SE'],correct:3,fb:'Opening (erode→dilate) removes objects smaller than the SE, then restores the original object size. Closing fills holes, erosion shrinks everything, dilation grows everything.'},
  {q:'What does the Morphological Gradient operation produce?',opts:['Fills holes inside objects','Extracts the object edges/contours (dilate − erode)','Removes background noise','Finds the skeleton of an object'],correct:1,fb:'Gradient = Dilation − Erosion. Interior pixels have dilation=erode=255, so 255-255=0. Edge pixels have dilation=255, erode=0, so 255-0=255.'},
  {q:'You want to detect small bright spots on an uneven background (illumination not uniform). Which morphological operation best isolates the spots?',opts:['Erosion','Closing','Top-Hat (Original − Opening)','Morphological Gradient'],correct:2,fb:'Top-Hat = Original − Opening. Opening smooths the background. Subtracting it leaves only details brighter than their local neighborhood — perfect for spotting defects or bright particles.'},
  {q:'What is the correct order for the Closing operation?',opts:['Erode → Dilate','Dilate → Erode','Erode → Erode','Dilate → Dilate'],correct:1,fb:'Closing = Dilate then Erode. Dilation bridges gaps and fills holes first; erosion then restores the original object size. Opposite of Opening (Erode → Dilate).'},
  {q:'Hit-or-Miss transform is used to:',opts:['Remove all noise in the image','Find pixels matching a specific structural pattern','Compute the skeleton of binary objects','Extract edges better than Sobel'],correct:1,fb:'Hit-or-Miss finds locations where the foreground matches SE1 AND the background matches SE2 simultaneously. It is the only morphological operation that detects specific patterns/shapes.'},
];

let quizScore=0; const quizAnswered={};
(function buildQuiz(){
  const con=document.getElementById('quizContainer');
  if(!con)return;
  quizData.forEach((q,qi)=>{
    const div=document.createElement('div');div.className='quiz-item';
    div.innerHTML='<div class="quiz-q-num">Question '+(qi+1)+' of '+quizData.length+'</div>'+
    '<div class="quiz-q-text">'+q.q+'</div><div class="quiz-opts">'+
    q.opts.map((o,oi)=>'<button class="quiz-opt" onclick="answerQuiz('+qi+','+oi+')" id="qopt-'+qi+'-'+oi+'"><span class="quiz-opt-badge">'+String.fromCharCode(65+oi)+'</span>'+o+'</button>').join('')+
    '</div><div class="quiz-feedback" id="qfb-'+qi+'"></div>';
    con.appendChild(div);
  });
})();

window.answerQuiz=function(qi,oi){
  if(quizAnswered[qi])return;
  quizAnswered[qi]=true;
  const q=quizData[qi];const fb=document.getElementById('qfb-'+qi);
  const all=document.querySelectorAll('[id^="qopt-'+qi+'-"]');
  all.forEach(btn=>{btn.disabled=true;});
  const correct=oi===q.correct;if(correct)quizScore++;
  document.getElementById('qopt-'+qi+'-'+oi).classList.add(correct?'correct':'wrong');
  document.getElementById('qopt-'+qi+'-'+q.correct).classList.add('correct');
  all.forEach((btn,i)=>{if(i!==oi&&i!==q.correct)btn.classList.add('muted');});
  if(fb){fb.textContent=(correct?'✅ ':'❌ ')+q.fb;fb.className='quiz-feedback show '+(correct?'ok':'bad');}
  checkFinalScore();
};

function checkFinalScore(){
  const totalQ=quizData.length;
  const answered=Object.keys(quizAnswered).length;
  const c1=document.getElementById('cq-1-check')?.classList.contains('show');
  const c2=document.getElementById('cq-2-check')?.classList.contains('show');
  const c3=document.getElementById('cq-3-check')?.classList.contains('show');
  if(answered<totalQ||!c1||!c2||!c3)return;
  const cs=[
    document.getElementById('cq-1-check')?.classList.contains('pass'),
    document.getElementById('cq-2-check')?.classList.contains('pass'),
    document.getElementById('cq-3-check')?.classList.contains('pass'),
  ].filter(Boolean).length;
  const total=quizScore+cs,max=totalQ+3;
  const fsEl=document.getElementById('finalScore'),nlEl=document.getElementById('nextLesson');
  if(fsEl){
    fsEl.style.display='block';
    document.getElementById('fsScores').innerHTML=
      '<div class="fs-score-item"><div class="fs-score-num">'+quizScore+'/'+totalQ+'</div><div class="fs-score-lbl">Theory</div></div>'+
      '<div class="fs-score-divider"></div>'+
      '<div class="fs-score-item"><div class="fs-score-num">'+cs+'/3</div><div class="fs-score-lbl">Coding</div></div>'+
      '<div class="fs-score-divider"></div>'+
      '<div class="fs-score-item"><div class="fs-score-num">'+total+'/'+max+'</div><div class="fs-score-lbl">Total</div></div>';
    const pct=Math.round((total/max)*100);
    document.getElementById('fsMsg').textContent=pct>=80?'🎉 Excellent! Module 1 complete — you mastered morphological operations!':pct>=60?'👍 Good work! Review and try again.':'💪 Keep practicing!';
  }
  if(nlEl&&total>=Math.ceil(max*.6))nlEl.style.display='block';
}

const cqDefs={
  1:`import numpy as np\n\ndef erode(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\ndef dilate(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\n# BUG: this is Closing, not Opening\ndef opening(img, ks=3):\n    return erode(dilate(img, ks), ks)   # FIX THIS LINE\n\nimg = np.zeros((10,10), dtype=np.uint8)\nimg[2:8, 2:8] = 255\nimg[0,0] = 255\n\nresult = opening(img)\nprint("Noise pixel after opening:", result[0,0])\nprint("Main rect after opening:", result[4,4])\nprint("Opening correct:", result[0,0]==0 and result[4,4]==255)`,
  2:`import numpy as np\n\ndef erode(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\ndef dilate(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\nnp.random.seed(0)\nimg = np.zeros((16,16), dtype=np.uint8)\nfor y in range(16):\n    for x in range(16):\n        img[y,x] = int(y * 10)\n\nimg[2,2]  = min(255, img[2,2]  + 120)\nimg[2,13] = min(255, img[2,13] + 120)\nimg[7,7]  = min(255, img[7,7]  + 120)\n\nopened = ___(___(img, 5), 5)\ntop_hat = np.clip(img.astype(int) - ___.astype(int), 0, 255).astype(np.uint8)\n\nprint("Top-hat at spot (2,2):", top_hat[2,2])\nprint("Top-hat at spot (2,13):", top_hat[2,13])\nprint("Top-hat at spot (7,7):", top_hat[7,7])\nprint("Top-hat at background (8,2):", top_hat[8,2])\nprint("Spots found (>50):", (top_hat > 50).sum())`,
  3:`import numpy as np\n\ndef erode(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\ndef dilate(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\nnp.random.seed(42)\nimg = np.zeros((20,20), dtype=np.uint8)\nimg[2:7,  2:7]  = 255\nimg[13:18, 13:18] = 255\nimg[0, 0] = img[1,18] = img[18,1] = 255\nimg[4,4] = img[14,14] = 0\n\nprint(f"White pixels before: {int((img==255).sum())}")\n\ncleaned = ___(___( img, 3), 3)\nprint(f"White pixels after opening: {int((cleaned==255).sum())}")\nprint(f"Noise at (0,0) removed: {cleaned[0,0]==0}")\n\nfilled = ___(___(cleaned, 3), 3)\nprint(f"Hole at (4,4) filled: {filled[4,4]==255}")\nprint(f"Hole at (14,14) filled: {filled[14,14]==255}")\n\neroded  = erode(filled, 3)\ndilated = dilate(filled, 3)\ngradient = np.clip(dilated.astype(int) - ___.astype(int), 0, 255).astype(np.uint8)\nprint(f"Edge pixels: {int((gradient>0).sum())}")\nprint(f"Interior pixel (4,4) is edge: {gradient[4,4]>0}")`,
};
window.resetCodingQuiz=function(num){
  const eds={1:'cq-1-editor',2:'cq-2-editor',3:'cq-3-editor'};
  const ed=document.getElementById(eds[num]);
  if(ed&&cqDefs[num])ed.value=cqDefs[num];
};

const pgDefault=document.getElementById('playground-editor')?.value||'';
const snippets={
  erode:`import numpy as np\n\ndef erode(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min()\n        for x in range(img.shape[1])]\n        for y in range(img.shape[0])]).astype(np.uint8)\n\nimg = np.zeros((10,10),dtype=np.uint8)\nimg[2:8,2:8]=255; img[1,1]=255  # noise\nprint("Before:", img.sum(axis=1).tolist())\nprint("After erode:", erode(img).sum(axis=1).tolist())\nprint("Noise gone:", erode(img)[1,1]==0)`,
  dilate:`import numpy as np\n\ndef dilate(img, ks=3):\n    pad=ks//2; p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max()\n        for x in range(img.shape[1])]\n        for y in range(img.shape[0])]).astype(np.uint8)\n\nimg = np.zeros((10,10),dtype=np.uint8)\nimg[4:6,4:6]=255  # small 2x2 object\nprint("Before (white pixels):", int((img==255).sum()))\nprint("After dilate (white pixels):", int((dilate(img)==255).sum()))`,
  openclose:`import numpy as np\n\ndef erode(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\ndef dilate(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\nimg=np.zeros((12,12),dtype=np.uint8)\nimg[2:10,2:10]=255      # main object\nimg[0,0]=img[11,11]=255 # noise\nimg[5,5]=img[6,6]=0     # holes\n\nopened=dilate(erode(img,3),3)\nclosed=erode(dilate(img,3),3)\n\nprint("Original white:", int((img==255).sum()))\nprint("Opened  white:", int((opened==255).sum()), "(noise removed)")\nprint("Closed  white:", int((closed==255).sum()), "(holes filled)")\nprint("Noise at (0,0) — opened:", opened[0,0], "  closed:", closed[0,0])\nprint("Hole at (5,5) — opened:", opened[5,5], "  closed:", closed[5,5])`,
  gradient:`import numpy as np\n\ndef erode(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\ndef dilate(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\nimg=np.zeros((14,14),dtype=np.uint8)\nimg[3:11,3:11]=255\n\ngrad=np.clip(dilate(img).astype(int)-erode(img).astype(int),0,255).astype(np.uint8)\nprint("Gradient (shows edges):")\nfor row in grad: print(''.join('█' if v else '.' for v in row))`,
  tophat:`import numpy as np\n\ndef erode(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\ndef dilate(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\n# Uneven background with bright spots\nimg=np.zeros((16,16),dtype=np.uint8)\nfor y in range(16):\n    for x in range(16): img[y,x]=int(y*12)  # gradient bg\nimg[2,5]=min(255,img[2,5]+100)  # spot 1\nimg[3,12]=min(255,img[3,12]+100) # spot 2\n\nopened=dilate(erode(img,5),5)\ntop_hat=np.clip(img.astype(int)-opened.astype(int),0,255).astype(np.uint8)\n\nprint("Top-Hat at spot 1 (2,5):",   top_hat[2,5])\nprint("Top-Hat at spot 2 (3,12):",  top_hat[3,12])\nprint("Top-Hat at bg    (10,10):",  top_hat[10,10])\nprint("Spots detected (>50):",      int((top_hat>50).sum()))`,
  pipeline:`import numpy as np\n\ndef erode(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].min() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\ndef dilate(img,ks=3):\n    pad=ks//2;p=np.pad(img.astype(float),pad,mode='constant')\n    return np.array([[p[y:y+ks,x:x+ks].max() for x in range(img.shape[1])] for y in range(img.shape[0])]).astype(np.uint8)\n\nnp.random.seed(7)\n# Binary inspection image\nimg=np.zeros((20,20),dtype=np.uint8)\nimg[3:9,3:9]=255;img[12:18,12:18]=255  # 2 real objects\nimg[0,0]=img[1,19]=img[19,0]=255       # noise\nimg[5,5]=img[14,14]=0                  # holes\n\nprint(f"1. Input:   {int((img==255).sum())} white pixels")\ncleaned=dilate(erode(img,3),3)          # opening\nprint(f"2. Opened:  {int((cleaned==255).sum())} (noise removed)")\nfilled=erode(dilate(cleaned,3),3)       # closing\nprint(f"3. Closed:  {int((filled==255).sum())} (holes filled)")\ngrad=np.clip(dilate(filled).astype(int)-erode(filled).astype(int),0,255).astype(np.uint8)\nprint(f"4. Gradient:{int((grad>0).sum())} edge pixels")\ntop=np.clip(img.astype(int)-dilate(erode(img,5),5).astype(int),0,255).astype(np.uint8)\nblk=np.clip(erode(dilate(img,5),5).astype(int)-img.astype(int),0,255).astype(np.uint8)\nprint(f"5. Top-Hat: {int((top>0).sum())} bright details (noise)")\nprint(f"6. Blk-Hat: {int((blk>0).sum())} dark details (holes)")`,
};

window.loadSnippet=function(name){const ed=document.getElementById('playground-editor');if(ed&&snippets[name])ed.value=snippets[name];};
window.runPlayground=async function(){
  const ed=document.getElementById('playground-editor'),out=document.getElementById('pg-output-pre');
  if(!ed||!out)return;
  out.closest('.output-wrap').style.display='block';out.textContent='⏳ Running…';
  if(!pyodideInstance){out.textContent='Python runtime not ready…';return;}
  try{let s='';pyodideInstance.setStdout({batched:(x)=>{s+=x+'\n';}}); await pyodideInstance.runPythonAsync(ed.value);out.textContent=s||'(no output)';}
  catch(err){out.textContent='❌ '+err.message;}
};
window.resetPlayground=function(){
  const ed=document.getElementById('playground-editor');if(ed)ed.value=pgDefault;
  const out=document.getElementById('pg-output');if(out)out.style.display='none';
};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){if(document.activeElement?.classList.contains('playground-editor')){e.preventDefault();runPlayground();}}});
