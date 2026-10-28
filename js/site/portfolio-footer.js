// Cursor-following tilt, parallax and light, driven by actual pointer events.
(() => {
  'use strict';
  const card = document.querySelector('.footer-feature-card');
  if (!card) return;
  const frame = card.closest('.footer-card-perspective');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, lastTime = 0;
  let current = {x:0, y:0, light:0}, target = {x:0, y:0, light:0};
  const allowed = () => !reduced.matches;
  function paint() {
    const {x,y,light} = current;
    card.style.setProperty('--tilt-x', `${-y*8.4}deg`);
    card.style.setProperty('--tilt-y', `${x*8.4}deg`);
    card.style.setProperty('--move-x', `${x*5}px`);
    card.style.setProperty('--move-y', `${y*5}px`);
    card.style.setProperty('--art-x', `${-x*6}px`);
    card.style.setProperty('--art-y', `${-y*6}px`);
    card.style.setProperty('--shadow-x', `${-x*12}px`);
    card.style.setProperty('--shine-x', `${(x+1)*50}%`);
    card.style.setProperty('--shine-y', `${(y+1)*50}%`);
    card.style.setProperty('--shine-opacity', `${light}`);
    card.style.setProperty('--foil-angle', `${Math.atan2(y,x)*180/Math.PI+135}deg`);
  }
  function tick(time) {
    const dt = lastTime ? Math.min(50,time-lastTime) : 16.67;
    lastTime = time;
    const easing = 1-Math.exp(-dt/95);
    let unsettled = false;
    for (const key of ['x','y','light']) {
      current[key] += (target[key]-current[key])*easing;
      if (Math.abs(target[key]-current[key])>.0005) unsettled=true;
      else current[key]=target[key];
    }
    paint();
    if (unsettled) raf=requestAnimationFrame(tick);
    else {raf=0;lastTime=0;}
  }
  function animate() {if(!raf) {lastTime=0;raf=requestAnimationFrame(tick);}}
  function move(event) {
    if(!allowed() || event.pointerType === 'touch')return;
    // Use the untransformed parent, not the moving card, to avoid feedback jitter.
    const r=frame.getBoundingClientRect();
    const clamp=value=>Math.max(-1,Math.min(1,value));
    target.x=clamp((event.clientX-r.left)/card.offsetWidth*2-1);
    target.y=clamp((event.clientY-r.top)/card.offsetHeight*2-1);
    target.light=1;
    animate();
  }
  let touchTimer = 0, touchStart = null;
  function reset() {
    clearTimeout(touchTimer);
    target={x:0,y:0,light:0};
    if(allowed())animate();
    else {cancelAnimationFrame(raf);raf=0;lastTime=0;current={...target};paint();}
  }
  frame.addEventListener('pointerenter',move);
  frame.addEventListener('pointermove',move);
  frame.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')reset();});
  frame.addEventListener('pointercancel',reset);
  // Fallback for environments delivering mouse events without Pointer Events.
  if (!('PointerEvent' in window)) {frame.addEventListener('mousemove',move);frame.addEventListener('mouseleave',reset);}
  frame.addEventListener('focusin',()=>{if(allowed()){target={x:0,y:0,light:.65};animate();}});
  frame.addEventListener('focusout',reset);
  // A short preview after a tap; do not capture touch or block normal page scrolling.
  frame.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchStart={x:e.clientX,y:e.clientY};},{passive:true});
  frame.addEventListener('pointerup',e=>{
    if(e.pointerType!=='touch'||!touchStart||!allowed())return;
    const start=touchStart;touchStart=null;
    if(e.target.closest('a,button')||Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;
    clearTimeout(touchTimer);target={x:.22,y:-.18,light:.9};animate();
    touchTimer=setTimeout(reset,1400);
  },{passive:true});
  reduced.addEventListener('change',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=0;target={x:0,y:0,light:0};current={...target};paint();}});
})();
