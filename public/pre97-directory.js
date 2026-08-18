(()=>{
  'use strict';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  function replaceText(root,from,to){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{if(node.nodeValue&&node.nodeValue.includes(from))node.nodeValue=node.nodeValue.replaceAll(from,to);});
  }
  function relabel(name,labelText,placeholder){
    const input=document.querySelector(`[name="${name}"]`);if(!input)return;
    const label=input.closest('label');
    if(label){const first=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&norm(n.nodeValue));if(first)first.nodeValue=labelText;}
    if(placeholder)input.placeholder=placeholder;
  }
  function run(){
    if(!document.body.classList.contains('professional-directory-page'))return;
    document.body.classList.add('pre97-national-directory');
    relabel('city','City','Example: Chicago');
    relabel('postalCode','ZIP code','Example: 60601');
    relabel('county','County or service region','Example: Cook County');
    relabel('state','State or D.C.','Example: IL, DC, or full state name');
    const q=document.querySelector('#professionalSearchForm [name="q"]');if(q)q.placeholder='Example: Smith, family law, Chicago, or 60601';
    const practice=document.querySelector('#professionalSearchForm [name="practice"]');if(practice)practice.placeholder='Example: family law or personal injury';
    replaceText(document.body,'currently configured New York official attorney-registration connector','available official jurisdiction connector. New York is currently connected here; additional qualified connectors can be added nationally');
    replaceText(document.body,'City or borough','City');
    const active=document.querySelector('#professionalActiveFilters');if(active)active.setAttribute('aria-label','Current directory filters');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
