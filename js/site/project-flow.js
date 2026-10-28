// Interactive walkthrough. No real project statuses or analytics are shown.
(() => {
 'use strict';
 const root=document.querySelector('.project-flow');if(!root)return;
 const visual=root.querySelector('.project-flow-visual');
 const steps=[...root.querySelectorAll('[data-flow-stage]')];
 const events=[...root.querySelectorAll('[data-flow-event]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let stage=0,timer=0,visible=false,manual=false;
 const text=()=>window.KIKI_TRANSLATIONS[document.documentElement.lang==='ru'?'ru':'en'];
 function stop(){clearTimeout(timer);timer=0;}
 function show(index,open=false){
  stage=index;const t=text();visual.dataset.flowPhase=String(index);
  root.querySelector('.flow-stage-number').textContent=`0${index+1} / 04`;
  root.querySelector('.flow-activity-count').textContent=`0${index+1} / 04`;
  root.querySelector('.flow-focus').textContent=t['flowFocus'+index];
  root.querySelector('.flow-foot-label').textContent=index===3?t.flowDelivery:t['flowFocus'+index];
  root.querySelector('.flow-pixels-stage').style.width=((index+1)*25)+'%';
  root.querySelector('.flow-replay').setAttribute('aria-label',t.flowReplay);
  steps.forEach((b,i)=>{b.closest('.project-flow-step').classList.toggle('is-current',i===index);b.setAttribute('aria-expanded',String(open&&i===index));document.getElementById(b.getAttribute('aria-controls')).hidden=!(open&&i===index);});
  root.querySelectorAll('.flow-stage-track span').forEach((e,i)=>e.classList.toggle('done',i<=index));
  events.forEach((e,i)=>{const done=i<index||index===3;const current=i===index&&index!==3;e.classList.toggle('is-done',done);e.classList.toggle('is-current',current);e.querySelector('.flow-event-copy').textContent=done?t['flowLog'+i]:t['flowStep'+i];e.querySelector('.flow-event-status').textContent=done?t.flowFinished:current?t.flowWorking:t.flowQueued;});
 }
 function schedule(){stop();if(!visible||manual||reduced.matches||document.hidden)return;timer=setTimeout(()=>{show((stage+1)%4);schedule();},stage===3?6500:3400);}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else stop();},{threshold:.3});observer.observe(root);
 steps.forEach((b,i)=>b.addEventListener('click',()=>{const opened=b.getAttribute('aria-expanded')==='true';manual=true;stop();show(i,!opened);}));
 root.querySelector('.flow-replay').addEventListener('click',()=>{manual=false;show(0);schedule();});
 document.addEventListener('kiki:language',()=>{const opened=steps[stage].getAttribute('aria-expanded')==='true';show(stage,opened);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
 reduced.addEventListener('change',()=>{stop();if(reduced.matches)show(3);else schedule();});
 show(reduced.matches?3:0);
})();
