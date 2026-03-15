// Spotlight
document.querySelectorAll('.bc').forEach(c=>{
  c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
  });
});

// Filter
document.getElementById('filter-bar').addEventListener('click',e=>{
  if(!e.target.matches('.filter-btn'))return;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  const f=e.target.dataset.filter;
  document.querySelectorAll('#bento-grid .bc').forEach(card=>{
    if(f==='all'||(card.dataset.tags&&card.dataset.tags.includes(f))){
      card.style.display='';
    } else {
      card.style.display='none';
    }
  });
}); // ← FIXED: was missing this

// Reveal
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});
},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
