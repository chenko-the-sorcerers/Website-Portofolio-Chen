// ═══ PARTICLE CANVAS ═══
const canvas=document.getElementById('particle-canvas');
const ctx=canvas.getContext('2d');
let W,H,particles=[];
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
class Particle{constructor(){this.reset();}reset(){this.x=Math.random()*W;this.y=Math.random()*H;this.size=Math.random()*.7+.2;this.speed=Math.random()*.25+.08;this.opacity=Math.random()*.35+.05;this.angle=Math.random()*Math.PI*2;this.vx=Math.cos(this.angle)*this.speed;this.vy=Math.sin(this.angle)*this.speed;}update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>W||this.y<0||this.y>H)this.reset();}draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${this.opacity})`;ctx.fill();}}
for(let i=0;i<100;i++)particles.push(new Particle());
(function animP(){ctx.clearRect(0,0,W,H);particles.forEach(p=>{p.update();p.draw();});particles.forEach((a,i)=>{particles.slice(i+1).forEach(b=>{const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<90){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(0,113,227,${.12*(1-d/90)})`;ctx.lineWidth=.5;ctx.stroke();}});});requestAnimationFrame(animP);})();

// ═══ GLASS CARD SPOTLIGHT ═══
document.querySelectorAll('.glass-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});
});

// ═══ CHATBOT ═══
const trigger=document.getElementById('chatbotTrigger');
const panel=document.getElementById('chatbotPanel');
const msgs=document.getElementById('chatbotMsgs');
const input=document.getElementById('chatbotInput');
const sendBtn=document.getElementById('chatbotSend');
const KB={
  'arutala':'Arutala v2.2 is an Indonesian Local Language Learning Environment — a multimodal AI ecosystem (LLM + VLM) supporting 700+ Nusantara languages with 21 distinct dialect personas via Dialekta v1.0.',
  'aruna':'ARUNA 7B is a foundation language model Chen built specifically for Indonesian local languages and dialects. It operates at 7 billion parameters. Its sibling model DIALEKTA 2B focuses specifically on dialect communication.',
  'indollnet':'IndoLLNet v2.1 is a CNN-based Optical Character Recognition system for Indonesian indigenous Nusantara scripts. The Arutala Aksara app built on it has 600K+ users and has been presented at 10+ discussion panels.',
  'background':"Chen (Marchel Andrian Shevchenko) is an AI builder based in Yogyakarta, Indonesia. He holds a Pre-PhD at MIT in Computational Science & Engineering, a CS degree from UTY, and an Economics degree from UniKL. He is Founder & CEO of Data Sorcerers, and a former ML Engineer at X Corp.",
  'collaborate':"To collaborate with Chen, reach out at Rianari990@gmail.com or call +62 822 4399 0884. He is open to AI research collaborations, consulting, speaking invitations, and startup partnerships.",
  'nvidia':"Chen is an awardee of the NVIDIA Inception Program with a USD $250K+ grant for AI development in 2025, plus a NVIDIA Deep Learning Grant of USD $112K+ for a certifications program from 2025-2027.",
  'mit':"Chen is currently a Pre-PhD researcher at MIT in Computational Science & Engineering, with research focused on Computer Vision and Computational Optimization. He placed 4th at MIT REAP 2025.",
  'mandala':'MANDALA is a Monitoring Safety and Railway Navigation system presented to PT. KAI (Indonesia Railway Company) in 2025 for national infrastructure safety.',
  'sabdarana':'SABDARANA is a Web3 & NFT-based Cultural Learn-to-Earn application for preserving Nusantara heritage. It was presented at Garuda Hacks 2025.',
  'data sorcerers':"Data Sorcerers is Chen's IT consulting company with 10 AI divisions (Computer Vision, NLP, Generative AI, etc.), 20+ projects, and a mission to develop AI for Culture, Healthcare, and Wellness.",
};
function findAnswer(q){
  const ql=q.toLowerCase();
  if(ql.includes('arutala'))return KB['arutala'];
  if(ql.includes('aruna')||ql.includes('dialekta'))return KB['aruna'];
  if(ql.includes('indollnet')||ql.includes('script')||ql.includes('nusantara'))return KB['indollnet'];
  if(ql.includes('background')||ql.includes('who is')||ql.includes('about'))return KB['background'];
  if(ql.includes('collab')||ql.includes('contact')||ql.includes('hire')||ql.includes('work with'))return KB['collaborate'];
  if(ql.includes('nvidia')||ql.includes('grant'))return KB['nvidia'];
  if(ql.includes('mit'))return KB['mit'];
  if(ql.includes('mandala')||ql.includes('railway'))return KB['mandala'];
  if(ql.includes('sabdarana')||ql.includes('web3')||ql.includes('nft'))return KB['sabdarana'];
  if(ql.includes('data sorcerer')||ql.includes('company')||ql.includes('startup'))return KB['data sorcerers'];
  if(ql.includes('skill')||ql.includes('python')||ql.includes('pytorch'))return "Chen's primary stack includes Python, PyTorch, TensorFlow, Computer Vision (CNN, OCR), NLP/LLM, CFD/OpenFOAM, GCP/Docker, and Bioinformatics tools like Nextflow and Seqera.";
  if(ql.includes('talk')||ql.includes('speak')||ql.includes('seminar'))return "Chen has delivered 50+ talks and seminars across Indonesia and internationally, covering AI, cybersecurity, Web3, bioinformatics, and cultural technology.";
  return "I can answer questions about Chen's projects (Arutala, ARUNA 7B, IndoLLNet), his experience at MIT/Kalbe/X Corp, Data Sorcerers, NVIDIA grants, talks, and how to collaborate. Try asking something more specific!";
}
function addMsg(text,who){const d=document.createElement('div');d.className='msg '+who;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
function showTyping(){const d=document.createElement('div');d.className='msg bot msg-typing';d.id='typing';d.innerHTML='<span></span><span></span><span></span>';msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
function removeTyping(){const t=document.getElementById('typing');if(t)t.remove();}
function sendMsg(q){if(!q.trim())return;addMsg(q,'user');showTyping();setTimeout(()=>{removeTyping();addMsg(findAnswer(q),'bot');},900+Math.random()*400);}
window.sendQuick=function(q){input.value=q;sendMsg(q);input.value='';};
sendBtn.addEventListener('click',()=>{sendMsg(input.value);input.value='';});
input.addEventListener('keydown',e=>{if(e.key==='Enter'){sendMsg(input.value);input.value='';}});
trigger.addEventListener('click',()=>{
  trigger.classList.toggle('open');
  panel.classList.toggle('open');
  trigger.textContent=panel.classList.contains('open')?'✕':'💬';
});
