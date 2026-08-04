(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SmarterJusticePreparationQuality=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const labels={facts:'Facts',sources:'Sources',dates:'Dates and events',records:'Documents and records',questions:'Unresolved questions',nextStep:'Next step'};
  function lines(value){return String(value||'').split(/\r?\n/).map((text,index)=>({text:text.trim(),line:index+1})).filter(x=>x.text);}
  function normalize(text){return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function mask(text){return String(text||'').replace(/\d(?=\d{2})/g,'•');}
  function finding(kind,title,message,section='',line=0,review='Review the original entry before changing anything.'){return{findingId:`finding-${kind}-${section||'packet'}-${line||0}-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,kind,title,message,section,line,review};}
  function evaluate(packet,generatedAt){
    const safePacket={facts:String(packet?.facts||''),sources:String(packet?.sources||''),dates:String(packet?.dates||''),records:String(packet?.records||''),questions:String(packet?.questions||''),nextStep:String(packet?.nextStep||''),privacyReviewed:packet?.privacyReviewed===true};
    const out=[];const required=['facts','sources','dates','records','questions','nextStep'];
    for(const key of required){const count=lines(safePacket[key]).length;if(!count)out.push(finding('attention',`${labels[key]} section is empty`,'Add at least one clear item or state that the information is not yet known.',key));else out.push(finding('strength',`${labels[key]} section is present`,`${count} visible item${count===1?'':'s'} found.`,key,0,'Presence does not prove accuracy or legal sufficiency.'));}
    if(!safePacket.privacyReviewed)out.push(finding('attention','Privacy review is not confirmed','Review the packet for sensitive information before downloading or sharing a local report.','privacyReviewed'));
    const all=[];for(const key of required)for(const row of lines(safePacket[key]))all.push({...row,section:key,norm:normalize(row.text)});
    const seen=new Map();for(const row of all){if(row.norm.length<8)continue;if(seen.has(row.norm)){const first=seen.get(row.norm);out.push(finding('attention','Possible duplicate entry',`This line closely matches ${labels[first.section]}, line ${first.line}.`,row.section,row.line,'Keep both only when they represent distinct events or sources.'));}else seen.set(row.norm,row);}
    const keyed=new Map();for(const row of all){const match=row.text.match(/^([^:]{2,80}):\s*(.+)$/);if(!match)continue;const key=normalize(match[1]);const value=normalize(match[2]);if(!key||!value)continue;if(keyed.has(key)&&keyed.get(key).value!==value){const first=keyed.get(key);out.push(finding('attention','Possible inconsistent values',`“${match[1].trim()}” has a different visible value than ${labels[first.section]}, line ${first.line}.`,row.section,row.line,'This is only a pattern match. The entries may describe different dates, people, periods, or sources.'));}else keyed.set(key,{value,section:row.section,line:row.line});}
    for(const row of lines(safePacket.dates)){if(!/(source|user[- ]?entered|estimated|stated|document|letter|message|email|portal|calendar|record|unknown)/i.test(row.text))out.push(finding('attention','Date source is not labeled','The date or event line does not visibly say where the date came from or whether it is user-entered, estimated, source-stated, or unknown.','dates',row.line));}
    for(const row of lines(safePacket.sources)){if(!/(\b20\d{2}\b|\b19\d{2}\b|reviewed|dated|effective|updated|accessed|unknown date)/i.test(row.text))out.push(finding('attention','Source date is not visible','The source line does not visibly include a source date, review date, effective date, or an “unknown date” label.','sources',row.line));}
    const sensitivePatterns=[{name:'Social Security number pattern',regex:/\b\d{3}-\d{2}-\d{4}\b/g},{name:'long account or identifier pattern',regex:/\b\d{9,19}\b/g},{name:'payment-card-like pattern',regex:/\b(?:\d[ -]*?){13,19}\b/g}];
    for(const row of all){for(const pattern of sensitivePatterns){const matches=row.text.match(pattern.regex)||[];for(const value of matches){if(/^20\d{2}$/.test(value.replace(/\D/g,'')))continue;out.push(finding('privacy',`Possible ${pattern.name}`,`A number pattern resembling “${mask(value)}” appears in this line.`,row.section,row.line,'This can be a false positive. Remove or redact it when it is not necessary for your local report.'));}}}
    for(const row of lines(safePacket.facts)){if(!/(source|according|user[- ]?entered|user recollection|document|record|message|letter|unknown|unverified|disputed)/i.test(row.text))out.push(finding('attention','Fact source or status is not visible','The fact line does not visibly distinguish its source or whether it is user-entered, source-stated, disputed, unknown, or unverified.','facts',row.line));}
    const attention=out.filter(x=>x.kind!=='strength').length;const strengths=out.filter(x=>x.kind==='strength').length;
    return{schemaVersion:'1.0.0',tool:'Smarter Justice Preparation Quality Check',generatedAt:generatedAt||new Date().toISOString(),storageModel:'current-tab only; local download only when the user chooses',boundaries:['No truth determination','No credibility determination','No legal-merit determination','No evidence-sufficiency conclusion','No case-strength score','No legal deadline calculation','No server transmission','No external AI','No filing','No professional routing','No automatic modification of source records'],packet:safePacket,summary:{strengths,attentionItems:attention,totalFindings:out.length},findings:out};
  }
  return{evaluate,labels};
});
