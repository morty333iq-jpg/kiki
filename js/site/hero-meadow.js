// Always-moving scenery while visible, with reduced-motion and hidden-tab safeguards.
(() => {
  'use strict';
  const stage=document.querySelector('.welcome-stage'),video=stage?.querySelector('.hero-landscape video');
  if(!stage||!video)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width:680px)');let visible=true;video.muted=true;
  function selectSource(){const src=video.dataset[narrow.matches?'videoMobile':'videoDesktop'];if(video.getAttribute('src')!==src){stage.classList.remove('scenery-ready');video.poster=video.dataset[narrow.matches?'posterMobile':'posterDesktop'];video.src=src;video.load();}}
  narrow.addEventListener('change',()=>{selectSource();update();});
  function update(){stage.classList.toggle('scenery-still',reduced.matches);if(reduced.matches||!visible||document.hidden){video.pause();return;}video.play().catch(()=>{});}
  video.addEventListener('loadeddata',()=>stage.classList.add('scenery-ready'));
  new IntersectionObserver(es=>{visible=es[0].isIntersecting;update();},{threshold:.05}).observe(stage);
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  const copy={
    ru:{eyebrow:'kiki / графический дизайн',title0:'Дизайн, который',title1:'хочется рассматривать.',description:'Постеры, айдентика и визуальные истории со своим характером. Я kiki — собираю их с вниманием к каждой детали.',works:'Смотреть работы',contact:'Связаться со мной',navWork:'Работы',navAbout:'Обо мне',navContact:'Контакт'},
    en:{eyebrow:'kiki / graphic design',title0:'Design worth',title1:'a closer look.',description:"Posters, brand identities, and visuals with a character of their own. I'm kiki — I bring them together with care for every detail.",works:'See my work',contact:"Let's talk",navWork:'Work',navAbout:'About',navContact:'Contact'}
  };
  function translate(){const t=copy[document.documentElement.lang==='ru'?'ru':'en'];stage.querySelectorAll('[data-welcome]').forEach(e=>{e.textContent=t[e.dataset.welcome]});stage.querySelector('nav').setAttribute('aria-label',document.documentElement.lang==='ru'?'Навигация по портфолио':'Portfolio navigation');}
  document.addEventListener('kiki:language',translate);translate();selectSource();update();
  const glass=stage.querySelector('.welcome-glass');
  glass.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced.matches)return;const r=glass.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;glass.style.setProperty('--glass-x',x*100+'%');glass.style.setProperty('--glass-y',y*100+'%');glass.style.setProperty('--glass-tx',(x-.5)*7+'px');glass.style.setProperty('--glass-ty',(y-.5)*5+'px')});
  function reset(){['--glass-x','--glass-y','--glass-tx','--glass-ty'].forEach(n=>glass.style.removeProperty(n));}
  glass.addEventListener('pointerleave',reset);glass.addEventListener('blur',reset);reduced.addEventListener('change',reset);
})();
