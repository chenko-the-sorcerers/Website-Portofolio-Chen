(function a(){fx+=(mx-fx)*.12;fy+=(my-fy)*.12;fol.style.left=fx+'px';fol.style.top=fy+'px';requestAnimationFrame(a);})();
const ham=document.getElementById('navHamburger'),nl=document.getElementById('navLinks');
ham.addEventListener('click',()=>{ham.classList.toggle('open');nl.classList.toggle('open');});
document.querySelectorAll('.edu-card').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});});
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});},{threshold:.08});