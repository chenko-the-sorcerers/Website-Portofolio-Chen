(function anim(){fx+=(mx-fx)*.12;fy+=(my-fy)*.12;fol.style.left=fx+'px';fol.style.top=fy+'px';requestAnimationFrame(anim);})();
document.querySelectorAll('.skill-card').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});});

// Animate bars on scroll
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      // Animate skill bars inside
      e.target.querySelectorAll && e.target.querySelectorAll('.skill-card').forEach(card=>{
        const lvl=card.dataset.level||80;
        const bar=card.querySelector('.sc-bar-fill');
        if(bar)setTimeout(()=>{bar.style.width=lvl+'%';},200);
      });
      obs.unobserve(e.target);
    }
  });
},{threshold:.1});

// Also animate single cards
const obs2=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const lvl=e.target.dataset.level||80;
      const bar=e.target.querySelector('.sc-bar-fill');
      if(bar)setTimeout(()=>{bar.style.width=lvl+'%';},300);
    }
  });
},{threshold:.3});
document.querySelectorAll('.skill-card').forEach(el=>obs2.observe(el));