// ═══ CURSOR ═══
const cur=document.getElementById('cursor'),fol=document.getElementById('cursor-follower');
let mx=window.innerWidth/2,my=window.innerHeight/2,fx=mx,fy=my;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';},{passive:true});
(function anim(){fx+=(mx-fx)*.28;fy+=(my-fy)*.28;fol.style.transform='translate('+fx+'px,'+fy+'px) translate(-50%,-50%)';requestAnimationFrame(anim);})();

// ═══ REVEAL ON SCROLL ═══
const revealObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');revealObs.unobserve(e.target);}});
},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

// ═══ COMPONENTS LOADER ═══
(function loadComponents(){
  const navEl=document.getElementById('nav-placeholder');
  const footerEl=document.getElementById('footer-placeholder');

  // Helper: init everything that depends on nav existing
  function onNavReady(){
    // Active link
    const path=window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(a=>{
      a.classList.remove('active');
      const href=a.getAttribute('href');
      if(href===path||(path!=='/'&&href!=='/'&&path.startsWith(href))){
        a.classList.add('active');
      }
    });

    // Hamburger
    const ham=document.getElementById('navHamburger');
    const nl=document.getElementById('navLinks');
    if(ham&&nl){
      ham.addEventListener('click',()=>{ham.classList.toggle('open');nl.classList.toggle('open');});
    }

    // Init lang switcher AFTER nav is in DOM
    if(window.__langInit) window.__langInit();
  }

  if(navEl){
    fetch('/components/nav.html')
      .then(r=>r.text())
      .then(html=>{navEl.outerHTML=html;onNavReady();})
      .catch(()=>{
        // Fallback: if fetch fails (offline), try to find existing nav
        onNavReady();
      });
  } else {
    // Nav already in HTML (not using placeholder)
    onNavReady();
  }

  if(footerEl){
    fetch('/components/footer.html')
      .then(r=>r.text())
      .then(html=>{footerEl.outerHTML=html;});
  }
})();