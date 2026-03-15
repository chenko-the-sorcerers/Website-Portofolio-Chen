(function anim(){fx+=(mx-fx)*.12;fy+=(my-fy)*.12;fol.style.left=fx+'px';fol.style.top=fy+'px';requestAnimationFrame(anim);})();
document.querySelectorAll('.c-link').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});});

function handleSubmit(){
  const f=document.getElementById('fname').value;
  const e=document.getElementById('email').value;
  const m=document.getElementById('message').value;
  if(!f||!e||!m){
    // Shake validation
    document.querySelectorAll('.form-input,.form-textarea').forEach(inp=>{
      if(!inp.value){
        inp.style.borderColor='rgba(255,80,80,.5)';
        inp.style.boxShadow='0 0 0 3px rgba(255,80,80,.1)';
        setTimeout(()=>{inp.style.borderColor='';inp.style.boxShadow='';},1500);
      }
    });
    return;
  }
  document.getElementById('form-wrap').style.display='none';
  document.getElementById('form-success').classList.add('show');
}