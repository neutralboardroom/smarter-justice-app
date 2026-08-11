(()=>{
  'use strict';
  const rules=window.SJMarketingCompliancePre46;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  let lastReceipt=null;

  function finding(level,id,title,detail,source){return {level,id,title,detail,source};}
  function sourceFor(j){
    const row=rules?.jurisdictions?.[j];
    return row?.source||row?.filingSource||row?.sourcePage||'';
  }
  async function sha256(text){
    const data=new TextEncoder().encode(text);
    const digest=await crypto.subtle.digest('SHA-256',data);
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function riskyClaim(text){return /\b(guarantee(?:d|s)?|guaranteed result|best lawyer|best law firm|number\s*#?\s*1|top[- ]rated|never lose|100% success|win every|certain outcome)\b/i.test(text);}
  function outcomeClaim(text){return /\b(prior results?|past results?|settlement|verdict|won|recovered|million|testimonial|client says?|success rate)\b/i.test(text);}
  function specialistClaim(text){return /\b(specialist|specialized|certified specialist|expert)\b/i.test(text);}
  function flAiDisclosurePresent(text){return /\bAI\b|artificial intelligence/i.test(text) && /not\s+(?:a\s+)?lawyer/i.test(text) && /not\s+(?:an?\s+)?(?:employee|member)\s+of\s+(?:the\s+)?law\s*firm/i.test(text);}

  function evaluate({jurisdiction,channel,audience,relationship,noContact,responsible,draft}){
    const out=[];
    const row=rules?.jurisdictions?.[jurisdiction];
    if(!row){
      out.push(finding('REVIEW','UNMAPPED-JURISDICTION','Human review required','This jurisdiction is not mapped in the current deterministic ruleset. Do not publish based on this preflight.', ''));
      return out;
    }
    if(riskyClaim(draft))out.push(finding('REVIEW','GENERAL-MISLEADING-CLAIM','Potentially misleading or absolute claim','The draft contains language that can imply a guaranteed, superior, or certain outcome. A lawyer should verify the complete context under the current jurisdiction rules.',sourceFor(jurisdiction)));
    if(outcomeClaim(draft))out.push(finding('REVIEW','GENERAL-RESULTS-TESTIMONIAL','Results or testimonial language needs review','The draft appears to reference results, recoveries, testimonials, or success. The current preflight does not determine whether all jurisdiction-specific conditions, context, or disclaimers are satisfied.',sourceFor(jurisdiction)));

    if(jurisdiction==='NY'){
      if(!responsible.trim())out.push(finding('BLOCK','NY-7.1-D-RESPONSIBLE','Responsible lawyer or firm information is missing','Current New York Rule 7.1(d) requires the name and contact information of at least one lawyer or law firm responsible for the communication.',row.source));
      if(specialistClaim(draft))out.push(finding('REVIEW','NY-7.1-C-SPECIALIST','Specialist or expertise wording needs certification review','Current New York Rule 7.1(c) restricts specialist-certification statements. This browser cannot verify the certifying organization or whether the exception applies.',row.source));
      if(noContact==='YES')out.push(finding('BLOCK','NY-7.3-NO-CONTACT','Recipient asked not to be solicited','Current New York Rule 7.3 bars solicitation when the target has made known a desire not to be solicited.',row.source));
      if(noContact==='UNKNOWN' && audience==='KNOWN_NEED')out.push(finding('REVIEW','NY-7.3-NO-CONTACT-UNKNOWN','Confirm recipient contact preference','Because this is a person-specific solicitation, confirm that the recipient has not asked the lawyer or firm to stop soliciting.',row.source));
      if(channel==='LIVE_PERSON' && audience==='KNOWN_NEED' && relationship==='NONE')out.push(finding('BLOCK','NY-7.3-LIVE-SOLICITATION','Live person-to-person solicitation is restricted','For a person known to need legal services in a particular matter, live person-to-person solicitation for pecuniary gain is restricted unless a stated exception applies. No exception was selected.',row.source));
      out.push(finding('REVIEW','NY-7.1-A-TRUTH','Final truthfulness review still required','The browser cannot determine whether the communication contains a material misrepresentation or omits a fact needed to avoid a misleading impression.',row.source));
    }
    if(jurisdiction==='FL'){
      if(channel==='AI_CHATBOT' && !flAiDisclosurePresent(draft))out.push(finding('BLOCK','FL-OP-24-1-AI-DISCLOSURE','AI chatbot disclosure appears incomplete','Florida Ethics Opinion 24-1 says a generative-AI chatbot communicating with clients or third parties must disclose that it is an AI program and not a lawyer or employee of the law firm.',row.aiSource));
      if(['EMAIL_DIRECT','PAID_DIGITAL','PRINT_BROADCAST'].includes(channel))out.push(finding('REVIEW','FL-4-7.19-FILING','Advertising filing review required','Florida requires filing for certain non-exempt direct mail/direct email and other advertisements at least 20 days before first use. This tool cannot determine every exemption or filing consequence.',row.filingSource));
      out.push(finding('REVIEW','FL-FINAL-RULE-REVIEW','Florida advertising-rule review still required','The current mapping is partial. Review the complete current Florida advertising rules, including content, filing, solicitation, record, and medium-specific requirements before publication.',row.advertisingSource));
    }
    if(jurisdiction==='TX'){
      if(['WEBSITE','SOCIAL','PAID_DIGITAL','EMAIL_DIRECT','PRINT_BROADCAST','AI_CHATBOT'].includes(channel))out.push(finding('REVIEW','TX-PART-VII-REVIEW','Determine Texas submission or exemption status','The State Bar of Texas says most public marketing efforts must be submitted for review unless an exemption applies. This preflight does not decide the exemption.',row.typesSource));
      out.push(finding('REVIEW','TX-FINAL-RULE-REVIEW','Texas Part VII review still required','Review the current Texas lawyer-advertising rules, interpretive comments, and submission requirements before publication.',row.source));
    }
    return out;
  }

  function severity(findings){
    if(findings.some(x=>x.level==='BLOCK'))return 'BLOCK_OR_HUMAN_REVIEW';
    if(findings.some(x=>x.level==='REVIEW'))return 'HUMAN_REVIEW_REQUIRED';
    return 'NO_DETERMINISTIC_ISSUE_FOUND_HUMAN_REVIEW_STILL_REQUIRED';
  }
  function render(findings,status){
    const heading=$('marketingResultHeading'),summary=$('marketingResultSummary'),box=$('marketingFindings');
    heading.textContent=status==='BLOCK_OR_HUMAN_REVIEW'?'Do not publish yet.':status==='HUMAN_REVIEW_REQUIRED'?'Human review required before publication.':'No deterministic issue found; review is still required.';
    summary.textContent='This is an issue-spotting result, not a compliance approval. Resolve every blocking item and review item before publication.';
    box.innerHTML=findings.map(x=>`<article class="card"><p class="eyebrow">${esc(x.level)}</p><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p>${x.source?`<p><a href="${esc(x.source)}" target="_blank" rel="noopener">Open primary source</a></p>`:''}<p class="fine-print">Rule ID: ${esc(x.id)}</p></article>`).join('');
  }
  function renderSources(){
    const target=$('marketingSourceCards'); if(!target||!rules)return;
    target.innerHTML=Object.entries(rules.jurisdictions).map(([code,row])=>{
      const links=[row.source,row.sourcePage,row.filingSource,row.advertisingSource,row.aiSource,row.typesSource].filter(Boolean);
      const unique=[...new Set(links)];
      return `<article class="card"><p class="eyebrow">${esc(code)} · ${esc(row.status)}</p><h3>${esc(row.label)}</h3><p>Effective/reference date: ${esc(row.effectiveDate||rules.checkedAt)}</p>${unique.map((u,i)=>`<p><a href="${esc(u)}" target="_blank" rel="noopener">Primary source${unique.length>1?` ${i+1}`:''}</a></p>`).join('')}</article>`;
    }).join('');
  }
  function downloadReceipt(){
    if(!lastReceipt)return;
    const blob=new Blob([JSON.stringify(lastReceipt,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`smarter-justice-marketing-preflight-${lastReceipt.jurisdiction}-${lastReceipt.createdAt.replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  async function submit(event){
    event.preventDefault();
    if(!rules){$('marketingResultHeading').textContent='Ruleset unavailable.';$('marketingResultSummary').textContent='Fail closed: do not publish from this tool until the ruleset loads.';return;}
    const input={jurisdiction:$('marketingJurisdiction').value,channel:$('marketingChannel').value,audience:$('marketingAudience').value,relationship:$('marketingRelationship').value,noContact:$('marketingNoContact').value,responsible:$('marketingResponsible').value,draft:$('marketingDraft').value};
    if(!input.draft.trim()){$('marketingResultHeading').textContent='Add a draft first.';return;}
    const findings=evaluate(input),status=severity(findings),contentSha256=await sha256(input.draft);
    lastReceipt={schemaVersion:'1.0.0',product:'Smarter Justice',tool:'Jurisdiction-Aware Marketing Compliance Preflight',rulesetVersion:rules.rulesetVersion,coverageClaim:rules.coverageClaim,createdAt:new Date().toISOString(),jurisdiction:input.jurisdiction,channel:input.channel,audience:input.audience,relationship:input.relationship,noContact:input.noContact,responsiblePartyProvided:Boolean(input.responsible.trim()),contentSha256,status,findings:findings.map(({level,id,title,detail,source})=>({level,id,title,detail,source})),draftIncluded:false};
    render(findings,status);$('downloadMarketingReceipt').disabled=false;
  }
  function clear(){
    $('marketingPreflightForm').reset();$('marketingResultHeading').textContent='Ready when you are.';$('marketingResultSummary').textContent='Choose a jurisdiction and channel, paste a draft, and run the preflight.';$('marketingFindings').innerHTML='';$('downloadMarketingReceipt').disabled=true;lastReceipt=null;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    renderSources();
    $('marketingRulesetNote').textContent=rules?`Ruleset: ${rules.rulesetVersion} · checked ${rules.checkedAt} · unsupported or uncertain issues fail closed to human review.`:'Ruleset unavailable — fail closed.';
    $('marketingPreflightForm')?.addEventListener('submit',submit);
    $('clearMarketingPreflight')?.addEventListener('click',clear);
    $('downloadMarketingReceipt')?.addEventListener('click',downloadReceipt);
  });
})();
