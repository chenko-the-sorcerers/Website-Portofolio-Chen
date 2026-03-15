// ═══ CURSOR ═══
const cur = document.getElementById('cursor');
const curF = document.getElementById('cursor-follower');
if (cur && curF) {
  let mx=0,my=0,fx=0,fy=0;
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    cur.style.left=mx+'px'; cur.style.top=my+'px';
  });
  (function animCursor() {
    fx += (mx-fx)*.12; fy += (my-fy)*.12;
    curF.style.left=fx+'px'; curF.style.top=fy+'px';
    requestAnimationFrame(animCursor);
  })();
}

// ═══ READ PROGRESS ═══
const progressBar = document.getElementById('readProgress');
window.addEventListener('scroll', () => {
  const total = document.body.scrollHeight - window.innerHeight;
  const pct = Math.min(100, (window.scrollY / total) * 100);
  if (progressBar) progressBar.style.width = pct + '%';
});

// ═══ SCROLL REVEAL ═══
const revealEls = document.querySelectorAll('.reveal, .reveal-up');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
revealEls.forEach(el => observer.observe(el));

// ═══ TOC ACTIVE STATE ═══
const sections = document.querySelectorAll('.module');
const tocLinks = document.querySelectorAll('.toc-link');

const tocObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.toc-link[data-module="${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

sections.forEach(s => tocObserver.observe(s));
