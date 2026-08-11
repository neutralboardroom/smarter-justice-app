(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const MAPPED=new Set(['NY','FL','TX','CA','NJ']);
  let state=null,lastReceipt=null,loadPromise=null;
  function esc(v){return String(v??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
  function jurisdiction(){return $('marketingJurisdiction')?.value||'';}
  function currentRow(code){return state?.jurisdictions?.[code]||null;}
  function setFailClosedResult(code,row){
    const h=$('marketingResultHeading'),s=$('marketingResultSummary'),box=$('marketingFindings');
    if(h)h.textContent='Human review required before publication.';
    if(s)s.textContent='Smarter Justice could not verify the current official rule sources for this jurisdiction. Deterministic preflight checks are disabled until the source-currentness gate verifies again.';
    const details=row?.sources||[];
    if(box)box.innerHTML=`<article class="card"><p class="eyebrow">SOURCE CURRENTNESS</p><h4>${esc(code||'Mapped jurisdiction')} is fail-closed</h4><p>Do not rely on automated rule checks for this draft. Review the current official authorities with a qualified human reviewer before publication.</p>${details.map(x=>`<p class="fine-print">${esc(x.sourceId)} · ${x.verified?'verified':'not verified'}${x.httpStatus?` · HTTP ${esc(x.httpStatus)}`:''}</p>`).join('')}</article>`;
    const dl=$('downloadMarketingReceipt');if(dl)dl.disabled=true;
  }
  function render(){
    const summary=$('marketingCurrentnessSummary'),list=$('marketingCurrentnessList'),download=$('downloadMarketingCurrentnessReceipt');
    if(!summary||!list)return;
    if(!state){summary.textContent='Checking the mapped official rule sources…';list.innerHTML='';if(download)download.disabled=true;return;}
    const rows=Object.entries(state.jurisdictions||{}),verified=rows.filter(([,r])=>r.deterministicAllowed).length;
    summary.textContent=state.allVerified?`Official-source currentness verified for all ${rows.length} mapped jurisdictions.`:`${verified} of ${rows.length} mapped jurisdictions verified. Any unverified jurisdiction is automatically human-review-only.`;
    list.innerHTML=rows.map(([code,row])=>`<div class="fine-print"><strong>${esc(code)} · ${esc(row.label||code)}</strong>: ${row.deterministicAllowed?'verified for deterministic use':'human review only'} · ${esc(row.verifiedSources)}/${esc(row.attemptedSources)} sources verified</div>`).join('');
    if(download)download.disabled=false;
    const note=$('marketingRulesetNote');if(note)note.textContent=`Ruleset: ${state.rulesetVersion} · source currentness checked ${state.checkedAt} · five mapped jurisdictions remain partial; any unavailable or changed authority fails closed to human review.`;
  }
  async function load(){
    if(loadPromise)return loadPromise;
    loadPromise=(async()=>{
      try{
        const response=await fetch('/api/marketing-compliance/currentness',{headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'}),data=await response.json();
        if(!response.ok||!data||data.failClosed!==true||!data.jurisdictions)throw new Error('Currentness service unavailable');
        state=data;lastReceipt={schemaVersion:'1.0.0',product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',currentnessVersion:data.currentnessVersion,rulesetVersion:data.rulesetVersion,checkedAt:data.checkedAt,coverageBoundary:data.coverageBoundary,failClosed:true,draftOrClientDataIncluded:false,allVerified:Boolean(data.allVerified),jurisdictions:data.jurisdictions};
      }catch(error){
        state={schemaVersion:'1.0.0',rulesetVersion:window.SJMarketingCompliancePre48?.rulesetVersion||'unknown',currentnessVersion:'sj-marketing-currentness-2026-08-11-pre49',checkedAt:new Date().toISOString(),coverageBoundary:'PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL',failClosed:true,allVerified:false,serviceError:String(error?.message||error),jurisdictions:Object.fromEntries([...MAPPED].map(code=>[code,{label:code,status:'HUMAN_REVIEW_ONLY_SOURCE_CURRENTNESS_UNVERIFIED',deterministicAllowed:false,attemptedSources:0,verifiedSources:0,sources:[]}]))};
        lastReceipt={...state,product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',draftOrClientDataIncluded:false};
      }finally{render();loadPromise=null;}return state;
    })();return loadPromise;
  }
  function gate(event){const code=jurisdiction();if(!MAPPED.has(code))return;const row=currentRow(code);if(row?.deterministicAllowed){lastReceipt=null;return;}event.preventDefault();event.stopImmediatePropagation();setFailClosedResult(code,row);}
  function downloadCurrentness(){if(!lastReceipt&&state)lastReceipt={...state,product:'Smarter Justice',tool:'Marketing Compliance Ruleset Source Currentness Monitor',draftOrClientDataIncluded:false};if(!lastReceipt)return;const blob=new Blob([JSON.stringify(lastReceipt,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`smarter-justice-marketing-source-currentness-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  document.addEventListener('DOMContentLoaded',()=>{const form=$('marketingPreflightForm');form?.addEventListener('submit',gate,true);$('downloadMarketingCurrentnessReceipt')?.addEventListener('click',downloadCurrentness);$('refreshMarketingCurrentness')?.addEventListener('click',async()=>{state=null;lastReceipt=null;render();await load();});render();load();});
})();
