/* ═══════════════════════════════════════════════════════════════
   computer-vision.js — AI Lab › Computer Vision
   ═══════════════════════════════════════════════════════════════ */

   'use strict';

   /* ── 1. Reading Progress Bar ─────────────────────────────────── */
   (function initReadProgress() {
     const bar = document.getElementById('readProgress');
     if (!bar) return;
   
     function updateProgress() {
       const scrollTop  = window.scrollY || document.documentElement.scrollTop;
       const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
       const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
       bar.style.width  = Math.min(100, pct) + '%';
     }
   
     window.addEventListener('scroll', updateProgress, { passive: true });
     updateProgress();
   })();
   
   
   /* ── 2. Reveal on Scroll (Intersection Observer) ─────────────── */
   (function initReveal() {
     const els = document.querySelectorAll('.reveal, .reveal-up');
     if (!els.length) return;
   
     const io = new IntersectionObserver(
       (entries) => {
         entries.forEach(entry => {
           if (entry.isIntersecting) {
             entry.target.classList.add('visible');
             io.unobserve(entry.target);
           }
         });
       },
       { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
     );
   
     els.forEach(el => io.observe(el));
   })();
   
   
   /* ── 3. Active TOC Link on Scroll ────────────────────────────── */
   (function initTocHighlight() {
     const tocLinks = document.querySelectorAll('.toc-link[data-module]');
     const sections = Array.from(document.querySelectorAll('.module[id]'));
   
     if (!tocLinks.length || !sections.length) return;
   
     let ticking = false;
   
     function updateToc() {
       const scrollY    = window.scrollY + 120; // offset for sticky header
       let activeId     = sections[0].id;
   
       for (const sec of sections) {
         if (sec.offsetTop <= scrollY) {
           activeId = sec.id;
         }
       }
   
       tocLinks.forEach(link => {
         const isActive = link.dataset.module === activeId;
         link.classList.toggle('active', isActive);
       });
   
       ticking = false;
     }
   
     window.addEventListener('scroll', () => {
       if (!ticking) {
         requestAnimationFrame(updateToc);
         ticking = true;
       }
     }, { passive: true });
   
     updateToc();
   })();
   
   
   /* ── 4. Smooth Scroll for TOC Links ──────────────────────────── */
   (function initSmoothScroll() {
     document.querySelectorAll('.toc-link[href^="#"]').forEach(anchor => {
       anchor.addEventListener('click', function (e) {
         e.preventDefault();
         const target = document.querySelector(this.getAttribute('href'));
         if (!target) return;
   
         target.scrollIntoView({ behavior: 'smooth', block: 'start' });
   
         // Update active class immediately on click
         document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
         this.classList.add('active');
       });
     });
   })();
   
   
   /* ── 5. Cursor hover states (cursor handled by shared.js) ────── */
   (function initCursorHover() {
     // shared.js handles the cursor movement — we just add hover class triggers
     // for page-specific elements that shared.js doesn't know about
     const hoverEls = document.querySelectorAll(
       '.topic-item, .arch-node, .dp-step, .compare-card'
     );
     const cursor   = document.getElementById('cursor');
     const follower = document.getElementById('cursor-follower');
     if (!cursor || !follower) return;
   
     hoverEls.forEach(el => {
       el.addEventListener('mouseenter', () => {
         cursor.classList.add('cursor--hover');
         follower.classList.add('cursor--hover');
       });
       el.addEventListener('mouseleave', () => {
         cursor.classList.remove('cursor--hover');
         follower.classList.remove('cursor--hover');
       });
     });
   })();
   
   
   /* ── 6. Floating Chips Stagger Init ─────────────────────────── */
   (function initChips() {
     const chips = document.querySelectorAll('.hero-chip');
     chips.forEach((chip, i) => {
       chip.style.animationDelay = `${i * 1.5}s`;
       chip.style.opacity = '0';
       // Fade in staggered
       setTimeout(() => {
         chip.style.transition = 'opacity .8s ease';
         chip.style.opacity    = '1';
       }, 800 + i * 300);
     });
   })();
   
   
   /* ── 7. Hero Title Letter Animation ─────────────────────────── */
   (function initHeroAnimation() {
     const titleLines = document.querySelectorAll('.hero-title .title-line');
     titleLines.forEach((line, i) => {
       line.style.opacity    = '0';
       line.style.transform  = 'translateY(40px)';
       line.style.transition = `opacity .8s cubic-bezier(.22,.61,.36,1) ${i * 0.15 + 0.2}s, transform .8s cubic-bezier(.22,.61,.36,1) ${i * 0.15 + 0.2}s`;
       requestAnimationFrame(() => {
         requestAnimationFrame(() => {
           line.style.opacity   = '1';
           line.style.transform = 'translateY(0)';
         });
       });
     });
   
     // Cascade other hero elements
     const heroEls = ['.hero-breadcrumb', '.hero-tag-row', '.hero-sub', '.hero-stats'];
     heroEls.forEach((sel, i) => {
       const el = document.querySelector(sel);
       if (!el) return;
       el.style.opacity    = '0';
       el.style.transform  = 'translateY(20px)';
       el.style.transition = `opacity .7s ease ${0.5 + i * 0.1}s, transform .7s ease ${0.5 + i * 0.1}s`;
       requestAnimationFrame(() => {
         requestAnimationFrame(() => {
           el.style.opacity   = '1';
           el.style.transform = 'translateY(0)';
         });
       });
     });
   })();
   
   
   /* ── 8. Topic Item hover ripple ─────────────────────────────── */
   (function initTopicRipple() {
     document.querySelectorAll('.topic-item').forEach(item => {
       item.addEventListener('mouseenter', function() {
         const icon = this.querySelector('.topic-icon');
         if (!icon) return;
         icon.style.transform = 'scale(1.08) rotate(-4deg)';
         icon.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)';
       });
       item.addEventListener('mouseleave', function() {
         const icon = this.querySelector('.topic-icon');
         if (!icon) return;
         icon.style.transform = 'scale(1) rotate(0deg)';
       });
     });
   })();
   
   
   /* ── 9. Code block copy button ──────────────────────────────── */
   (function initCodeCopy() {
     document.querySelectorAll('.topic-code pre').forEach(pre => {
       const btn = document.createElement('button');
       btn.textContent = 'copy';
       btn.className   = 'code-copy-btn';
   
       // Inline styles to avoid needing extra CSS rules
       Object.assign(btn.style, {
         position:    'absolute',
         top:         '8px',
         right:       '8px',
         background:  'rgba(255,255,255,.06)',
         border:      '1px solid rgba(255,255,255,.1)',
         borderRadius: '4px',
         color:       '#8888a0',
         fontFamily:  "'Space Mono', monospace",
         fontSize:    '10px',
         padding:     '3px 8px',
         cursor:      'pointer',
         letterSpacing: '.04em',
         transition:  'all .15s',
       });
   
       // Wrap pre in relative container
       const wrapper = document.createElement('div');
       wrapper.style.position = 'relative';
       pre.parentNode.insertBefore(wrapper, pre);
       wrapper.appendChild(pre);
       wrapper.appendChild(btn);
   
       btn.addEventListener('click', async () => {
         const code = pre.innerText;
         try {
           await navigator.clipboard.writeText(code);
           btn.textContent = 'copied!';
           btn.style.color = '#34c759';
           setTimeout(() => {
             btn.textContent = 'copy';
             btn.style.color = '#8888a0';
           }, 2000);
         } catch {
           btn.textContent = 'error';
           setTimeout(() => { btn.textContent = 'copy'; }, 2000);
         }
       });
     });
   })();
   
   
   /* ── 10. Keyboard navigation for TOC ────────────────────────── */
   (function initKeyboardNav() {
     const modules = Array.from(document.querySelectorAll('.module[id]'));
     if (!modules.length) return;
   
     document.addEventListener('keydown', (e) => {
       // Only when not in an input
       if (document.activeElement.tagName === 'INPUT') return;
   
       const scrollY    = window.scrollY + 160;
       let currentIdx   = 0;
   
       for (let i = 0; i < modules.length; i++) {
         if (modules[i].offsetTop <= scrollY) currentIdx = i;
       }
   
       if (e.key === 'ArrowDown' && currentIdx < modules.length - 1) {
         e.preventDefault();
         modules[currentIdx + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
       if (e.key === 'ArrowUp' && currentIdx > 0) {
         e.preventDefault();
         modules[currentIdx - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
     });
   })();