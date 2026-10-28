// Client-side checklist only: no network requests, no changes to portfolio data.
(() => {
  'use strict';
  const key = 'kiki:design-review:v1';
  let checked = new Set();
  try { const value=JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(value))checked=new Set(value.filter(x=>typeof x==='string')); } catch (_) {}
  function render() {
    const root=document.querySelector('[data-project-checklist]'); if(!root)return;
    const inputs=[...root.querySelectorAll('[data-check-id]')];
    inputs.forEach(input=>{input.checked=checked.has(input.dataset.checkId);});
    const counter=root.querySelector('[data-checklist-counter]');
    counter.textContent=`${counter.dataset.label} ${inputs.filter(i=>i.checked).length} / ${inputs.length}`;
  }
  function save() {try {localStorage.setItem(key,JSON.stringify([...checked]));} catch(_){} render();}
  document.addEventListener('change', e=>{
    const input=e.target.closest('[data-project-checklist] [data-check-id]'); if(!input)return;
    if(input.checked)checked.add(input.dataset.checkId);else checked.delete(input.dataset.checkId); save();
  });
  document.addEventListener('click', e=>{if(e.target.closest('[data-checklist-reset]')){checked.clear();save();}});
  document.addEventListener('kiki:language',render);
  addEventListener('storage',e=>{
    if(e.key!==key)return;
    try{const next=JSON.parse(e.newValue||'[]');checked=new Set(Array.isArray(next)?next:[]);}catch(_){checked.clear();}render();
  });
  render();
})();
