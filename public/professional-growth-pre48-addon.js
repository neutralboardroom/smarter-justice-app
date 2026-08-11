(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const rules=window.SJMarketingCompliancePre48;
  let receipt=null;
  const esc=value=>String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  const finding=(level,id,title,detail,source)=>({level,id,title,detail,source});
  const risky=text=>/\b(guarantee(?:d|s)?|guaranteed result|best lawyer|best law firm|number\s*#?\s*1|top[- ]rated|never lose|100% success|win every|certain outcome)\b/i.test(text);
  const outcome=text=>/\b(prior results?|past results?|settlement|verdict|won|recovered|million|testimonial|endorsement|client says?|success rate)\b/i.test(text);
  const testimonial=text=>/\b(testimonial|endorsement|client says?|review(?:s|ed)?|past performance|prior results?|recovered|verdict|settlement)\b/i.test(text);
  const comparative=text=>/\b(best|the only|top[- ]?(?:rated)?|ultimate|number\s*#?\s*1)\b/i.test(text);
  const adLabel=text=>{const t=String(text||'').trim();return /^(advertisement|attorney advertisement)\b/i.test(t)&&/(advertisement|attorney advertisement)[.!]?$/i.test(t);};
  const njResultsDisclaimer=text=>/results may vary depending on your particular facts and legal circumstances/i.test(text);
  const njKeywordDisclaimer=text=>/paid advertisement/i.test(text)&&/affiliated only with/i.test(text);
  async function sha256(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
  function severity(rows){if(rows.some(x=>x.level==='BLOCK'))return 'BLOCK_OR_HUMAN_REVIEW';if(rows.some(x=>x.level==='REVIEW'))return 'HUMAN_REVIEW_REQUIRED';return 'NO_DETERMINISTIC_ISSUE_FOUND_HUMAN_REVIEW_STILL_REQUIRED';}
  function render(rows,status){
    $('marketingResultHeading').textContent=status==='BLOCK_OR_HUMAN_REVIEW'?'Do not publish yet.':'Human review required before publication.';
    $('marketingResultSummary').textContent='This is an issue-spotting result, not a compliance approval. Resolve every blocking and review item before publication.';
    $('marketingFindings').innerHTML=rows.map(x=>`<article class="card"><p class="eyebrow">${esc(x.level)}</p><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p>${x.source?`<p><a href="${esc(x.source)}" target="_blank" rel="noopener">Open primary source</a></p>`:''}<p class="fine-print">Rule ID: ${esc(x.id)}</p></article>`).join('');
  }
  function input(){return {jurisdiction:$('marketingJurisdiction').value,channel:$('marketingChannel').value,audience:$('marketingAudience').value,relationship:$('marketingRelationship').value,noContact:$('marketingNoContact').value,dvRestrainingOrder:$('marketingDvRestrainingOrder').value,competitorKeyword:$('marketingCompetitorKeyword').value,endorserIdentified:$('marketingEndorserIdentified').value,testimonialPaid:$('marketingTestimonialPaid').value,responsible:$('marketingResponsible').value,draft:$('marketingDraft').value};}
  function evaluateCA(x,row){
    const out=[];
    if(risky(x.draft))out.push(finding('REVIEW','CA-7.1-TRUTH','Potentially false, misleading, or absolute claim','California Rule 7.1 prohibits false or misleading communications. Verify the complete context and factual support.',row.source));
    if(outcome(x.draft))out.push(finding('REVIEW','CA-7.1-RESULTS','Results or testimonial language needs review','California Rule 7.1 comments explain that results/testimonials may mislead if they create unjustified expectations without appropriate context or qualifying language.',row.source));
    if(!x.responsible.trim())out.push(finding('BLOCK','CA-7.2-C-RESPONSIBLE','Responsible lawyer or firm information is missing','California Rule 7.2(c) requires the name and address of at least one lawyer or law firm responsible for the advertising communication.',row.source));
    if(x.noContact==='YES')out.push(finding('BLOCK','CA-7.3-NO-CONTACT','Recipient asked not to be solicited','California Rule 7.3(b) bars solicitation after the person has made known a desire not to be solicited.',row.source));
    if(x.noContact==='UNKNOWN'&&x.audience==='KNOWN_NEED')out.push(finding('REVIEW','CA-7.3-NO-CONTACT-UNKNOWN','Confirm recipient contact preference','Confirm that the specifically targeted person has not asked the lawyer or firm to stop soliciting.',row.source));
    if(x.channel==='LIVE_PERSON'&&x.audience==='KNOWN_NEED'&&!['FAMILY_CLOSE_PRIOR','LAWYER'].includes(x.relationship))out.push(finding('BLOCK','CA-7.3-LIVE-CONTACT','Live solicitation is restricted','California Rule 7.3(a) restricts in-person, live telephone, and real-time electronic solicitation for pecuniary gain unless a stated relationship exception applies.',row.source));
    if(x.audience==='KNOWN_NEED'&&['EMAIL_DIRECT','PAID_DIGITAL','AI_CHATBOT'].includes(x.channel)&&!['FAMILY_CLOSE_PRIOR','LAWYER'].includes(x.relationship)&&!adLabel(x.draft))out.push(finding('REVIEW','CA-7.3-ADVERTISEMENT-LABEL','Targeted solicitation advertisement label needs review','California Rule 7.3(c) requires Advertisement or similar wording for certain targeted written, recorded, or electronic solicitations, subject to stated exceptions and context.',row.source));
    if(x.dvRestrainingOrder==='YES_PRE_SERVICE')out.push(finding('BLOCK','CA-7.3-F-DVRO','DVRO respondent solicitation must not proceed yet','California Rule 7.3(f), effective June 1, 2026, restricts this solicitation until after service and docketed proof of service, subject to the rule’s current/former-client exception.',row.amendmentSource||row.source));
    if(x.dvRestrainingOrder==='UNKNOWN')out.push(finding('REVIEW','CA-7.3-F-DVRO-UNKNOWN','Confirm DVRO service status','If this concerns solicitation of a DVRO respondent, confirm service, docketed proof of service, and whether a stated exception applies.',row.amendmentSource||row.source));
    out.push(finding('REVIEW','CA-FINAL-RULE-REVIEW','Final California review still required','This mapping is partial. Review current California Rules of Professional Conduct and other applicable statutes or standards before publication.',row.source));
    return out;
  }
  function evaluateNJ(x,row){
    const out=[],has=testimonial(x.draft)||outcome(x.draft);
    if(risky(x.draft))out.push(finding('REVIEW','NJ-7.1-TRUTH','Potentially misleading or absolute claim','New Jersey RPC 7.1 restricts false or misleading communications and unjustified expectations.',row.rulesSource));
    if(has&&x.endorserIdentified!=='YES')out.push(finding('REVIEW','NJ-CAA-49-TESTIMONIAL-ID','Endorser identity needs review','CAA Opinion 49 states that the person making an endorsement or testimonial should be identified in the advertising.',row.testimonialSource));
    if(has&&outcome(x.draft)&&!njResultsDisclaimer(x.draft))out.push(finding('REVIEW','NJ-CAA-49-RESULTS-DISCLAIMER','Past-performance testimonial disclaimer appears missing','CAA Opinion 49 requires the results-may-vary disclaimer when an endorsement or testimonial contains past-performance statements.',row.testimonialSource));
    if(has&&comparative(x.draft))out.push(finding('BLOCK','NJ-CAA-49-COMPARISON','Comparative testimonial language is restricted','CAA Opinion 49 states comparative words such as best, only, top, or ultimate are not permitted in endorsements or testimonials.',row.testimonialSource));
    if(has&&x.testimonialPaid==='YES')out.push(finding('BLOCK','NJ-CAA-49-NO-PAYMENT','Paid testimonial requires correction','CAA Opinion 49 states lawyers cannot pay for endorsements or testimonials.',row.testimonialSource));
    if(has&&x.testimonialPaid==='UNKNOWN')out.push(finding('REVIEW','NJ-CAA-49-PAYMENT-UNKNOWN','Confirm testimonial was not paid','Confirm whether anything of value was paid for the endorsement or testimonial before publication.',row.testimonialSource));
    if(x.competitorKeyword==='YES'&&!njKeywordDisclaimer(x.draft))out.push(finding('REVIEW','NJ-ACPE-735-KEYWORD-DISCLAIMER','Competitive-keyword landing-page disclaimer appears incomplete','New Jersey guidance requires a prominent landing-page disclosure for paid keyword campaigns purchasing a competitor lawyer or firm name. This text check cannot verify prominence or all required identifying details.',row.keywordSource));
    if(x.competitorKeyword==='UNKNOWN')out.push(finding('REVIEW','NJ-ACPE-735-KEYWORD-UNKNOWN','Confirm competitive-keyword status','Determine whether this landing page is reached through a paid search campaign purchasing a competitor lawyer or law-firm name.',row.keywordSource));
    out.push(finding('INFO','NJ-7.2-RECORD-RETENTION','Preserve the advertising record','New Jersey RPC 7.2 includes advertising record-retention and website backup requirements. Preserve the communication and verify the current retention method and period.',row.rulesSource));
    out.push(finding('REVIEW','NJ-FINAL-RULE-REVIEW','Final New Jersey advertising review still required','This mapping is partial. Review current New Jersey RPCs, Committee on Attorney Advertising guidance, and channel-specific requirements before publication.',row.rulesSource));
    return out;
  }
  async function submit(e){
    const x=input(); if(!['CA','NJ'].includes(x.jurisdiction))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!rules){$('marketingResultHeading').textContent='Ruleset unavailable.';$('marketingResultSummary').textContent='Fail closed: do not publish from this tool until the ruleset loads.';return;}
    if(!x.draft.trim()){$('marketingResultHeading').textContent='Add a draft first.';return;}
    const row=rules.jurisdictions[x.jurisdiction],findings=x.jurisdiction==='CA'?evaluateCA(x,row):evaluateNJ(x,row),status=severity(findings);
    receipt={schemaVersion:'1.0.0',product:'Smarter Justice',tool:'Jurisdiction-Aware Marketing Compliance Preflight',rulesetVersion:rules.rulesetVersion,coverageClaim:rules.coverageClaim,createdAt:new Date().toISOString(),sourceCheckedAt:rules.checkedAt,jurisdiction:x.jurisdiction,channel:x.channel,audience:x.audience,relationship:x.relationship,noContact:x.noContact,dvRestrainingOrder:x.dvRestrainingOrder,competitorKeyword:x.competitorKeyword,endorserIdentified:x.endorserIdentified,testimonialPaid:x.testimonialPaid,responsiblePartyProvided:Boolean(x.responsible.trim()),contentSha256:await sha256(x.draft),status,findings,draftIncluded:false};
    render(findings,status);$('downloadMarketingReceipt').disabled=false;
  }
  function download(e){if(!receipt)return;e.preventDefault();e.stopImmediatePropagation();const b=new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`smarter-justice-marketing-preflight-${receipt.jurisdiction}-${receipt.createdAt.replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);}
  document.addEventListener('DOMContentLoaded',()=>{
    $('marketingPreflightForm')?.addEventListener('submit',submit,true);
    $('downloadMarketingReceipt')?.addEventListener('click',download,true);
    const note=$('marketingRulesetNote'); if(note&&rules)note.textContent=`Ruleset: ${rules.rulesetVersion} · checked ${rules.checkedAt} · five mapped jurisdictions are partial; unsupported or uncertain issues fail closed to human review.`;
  });
})();
