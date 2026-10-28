/* A scripted conversation demo, not a connected chat or an AI service. */
(() => {
  'use strict';
  const root = document.getElementById('design-studio');
  if (!root) return;
  const copy = {
    en: {project:'Poster / New project',step0:'Brief',step1:'Ideas',step2:'Type',step3:'Color',step4:'Layout',step5:'Details',step6:'Review',step7:'Export',artboard:'Poster · 1080 × 1440',footnote:'kiki / from your idea to the final file',chatTab:'Chat',processTab:'Process',filesTab:'Files',demo:'Example conversation',client:'Client',request:'I need a poster for a music night. Something bold, with strong type.',reply:'Let’s do it. I’ll start with the type, add a fresh color palette, and put together a first version. Then we’ll refine it together.',task:'Designing your poster',running:'In progress',ready:'For review',done:'Here’s the first version. What do you think? We can adjust the colors and details together.',attachment:'First version · ready for review',processHeading:'From idea to finished poster',processNote:'You’re part of every step. We discuss, refine, and make it yours.',filesHeading:'Example deliverables',print:'Print-ready poster',social:'Version for social media',filesNote:'Final formats are agreed on for each project.',cta:'Tell me about your idea...',replay:'Replay animation'},
    ru: {project:'Плакат / Новый проект',step0:'Задача',step1:'Идеи',step2:'Шрифт',step3:'Цвет',step4:'Макет',step5:'Детали',step6:'Правки',step7:'Экспорт',artboard:'Плакат · 1080 × 1440',footnote:'kiki / от твоей идеи до готового файла',chatTab:'Чат',processTab:'Процесс',filesTab:'Файлы',demo:'Пример переписки',client:'Клиент',request:'Нужен плакат для музыкального вечера. Что-то яркое, с крупной типографикой.',reply:'Давай сделаем. Начну со шрифта, подберу свежую палитру и соберу первый вариант. Потом вместе доведём его до результата.',task:'Создаю твой плакат',running:'В работе',ready:'На просмотр',done:'Вот первый вариант. Как тебе? Можем вместе изменить цвета и детали.',attachment:'Первый вариант · можно обсудить',processHeading:'От идеи до готового плаката',processNote:'Ты участвуешь в каждом этапе. Обсуждаем, дорабатываем и делаем по-твоему.',filesHeading:'Пример готовых файлов',print:'Плакат для печати',social:'Версия для соцсетей',filesNote:'Финальные форматы согласуем для каждого проекта.',cta:'Расскажи о своей идее...',replay:'Повторить анимацию'}
  };
  let timers = [], started = false, visible = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const typed = root.querySelector('.studio-typed');
  const words = () => copy[document.documentElement.lang === 'ru' ? 'ru' : 'en'];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function translate() {
    const t = words();
    root.querySelectorAll('[data-studio]').forEach(el => {el.textContent = t[el.dataset.studio];});
    root.querySelector('.studio-replay').setAttribute('aria-label', t.replay);
    root.setAttribute('aria-label', t.processHeading);
  }
  function complete() {
    root.classList.add('studio-complete');
    root.classList.remove('studio-playing');
    root.dataset.phase = '7';
    root.querySelector('.studio-task-status').textContent = words().ready;
    root.querySelectorAll('.studio-node').forEach(n => n.classList.remove('is-active'));
    root.querySelector('[data-step="7"]').classList.add('is-active');
  }
  function play() {
    clear(); translate(); started = true;
    root.classList.remove('studio-complete');root.classList.add('studio-playing');root.dataset.phase='0';typed.textContent='';
    root.querySelectorAll('.studio-node').forEach(n => n.classList.remove('is-active'));
    if (reduced.matches) { typed.textContent = words().reply; complete(); return; }
    for (let i=0;i<8;i++) later(() => {
      root.dataset.phase=String(i);
      root.querySelectorAll('.studio-node').forEach(n => n.classList.toggle('is-active', Number(n.dataset.step)===i));
    }, i*1450);
    const text=words().reply;
    function type(i) { typed.textContent=text.slice(0,i); if(i<text.length) later(()=>type(i+1),26); }
    later(()=>type(1),850);
    later(complete,11800);
    // Hold the completed design long enough to read the conversation.
    later(()=>{if(visible && !document.hidden) play();else started=false;},29000);
  }
  translate();
  typed.textContent=words().reply; root.dataset.phase='7';root.classList.add('studio-complete');
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible && !started) play();
    if(!visible) {clear();started=false;root.classList.remove('studio-playing');}
  },{threshold:.18});observer.observe(root);
  root.querySelector('.studio-replay').addEventListener('click',play);
  document.addEventListener('kiki:language',()=>{translate();if(visible)play();else {typed.textContent=words().reply;complete();}});
  const tabs=[...root.querySelectorAll('[data-view]')];
  function select(tab) {
    tabs.forEach(b=>{const on=b===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
    ['chat','process','files'].forEach(v=>{root.querySelector('#studio-'+v+'-panel').hidden=v!==tab.dataset.view;});
  }
  tabs.forEach((tab,index)=>{tab.tabIndex=index===0?0:-1;tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',e=>{let i;if(e.key==='ArrowRight')i=(index+1)%tabs.length;else if(e.key==='ArrowLeft')i=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();select(tabs[i]);tabs[i].focus();});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();started=false;root.classList.remove('studio-playing');}else if(visible&&!started)play();});
})();
