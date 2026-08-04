(function(){
  'use strict';

  const MAX_FILE_BYTES = 1024 * 1024;
  const MAX_TEXT_CHARS = 250000;
  const MAX_LINES = 5000;
  const LOOKAHEAD = 20;
  const ALLOWED_EXTENSIONS = new Set(['txt','md','markdown','csv','json']);
  const state = { reviewDownload:'', comparisonDownload:'', reviewContext:null, planFindings:[], planItems:[], corrections:[], actionPlanData:null, planTextDownload:'', planJsonDownload:'', communicationDraft:null, communicationTextDownload:'', preparationBinder:null, binderTextDownload:'', binderJsonDownload:'' };
  const $ = id => document.getElementById(id);

  function normalizeText(value){
    return String(value || '').replace(/\u0000/g, '').replace(/\r\n?/g, '\n');
  }

  function displayName(value, fallback){
    const clean = String(value || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, 120);
    return clean || fallback;
  }

  function validateText(value, label){
    const text = normalizeText(value);
    if (!text.trim()) return { error:`Enter or open text for ${label}.` };
    if (text.length > MAX_TEXT_CHARS) return { error:`${label} is longer than ${MAX_TEXT_CHARS.toLocaleString()} characters.` };
    const lines = text.split('\n');
    if (lines.length > MAX_LINES) return { error:`${label} contains more than ${MAX_LINES.toLocaleString()} lines. Use a smaller excerpt.` };
    return { text, lines };
  }

  function setError(box, message){
    box.hidden = !message;
    box.textContent = message || '';
    if (message) box.focus();
  }

  function updateCount(textarea, counter){
    counter.textContent = `${textarea.value.length.toLocaleString()} of ${MAX_TEXT_CHARS.toLocaleString()} characters`;
  }

  function extensionOf(name){
    const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  function readLocalText(file, textarea, sourceName, errorBox, counter){
    if (!file) return;
    const ext = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setError(errorBox, 'Choose a TXT, Markdown, CSV, or JSON file. PDFs and images are not supported here.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(errorBox, 'Choose a file no larger than 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError(errorBox, 'The browser could not read that local file.');
    reader.onload = () => {
      const result = validateText(reader.result, file.name);
      if (result.error) return setError(errorBox, result.error);
      textarea.value = result.text;
      if (sourceName && !sourceName.value.trim()) sourceName.value = file.name.slice(0, 120);
      updateCount(textarea, counter);
      setError(errorBox, '');
      textarea.focus();
    };
    reader.readAsText(file);
  }

  function create(tag, text, className){
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function quoteForLine(text){
    const clean = String(text || '').trim().replace(/\s+/g, ' ');
    return clean.length > 280 ? `${clean.slice(0, 277)}…` : clean;
  }

  function uniqueFindings(findings, limit){
    const seen = new Set();
    const result = [];
    for (const item of findings) {
      const key = `${item.line}:${item.quote}`;
      if (!item.quote || seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  }

  function scanLines(lines, pattern, limit=20){
    const findings = [];
    lines.forEach((line, index) => {
      const matches = String(line).match(pattern);
      if (!matches) return;
      findings.push({ line:index + 1, quote:quoteForLine(line), matches:[...new Set(matches.map(v => String(v).trim()))] });
    });
    return uniqueFindings(findings, limit);
  }

  function identifyHeadings(lines){
    const findings=[];
    lines.forEach((line,index)=>{
      const trimmed=String(line).trim();
      if(!trimmed || trimmed.length>120) return;
      const markdown=/^#{1,6}\s+\S/.test(trimmed);
      const titled=/^[A-Z][A-Z0-9 &'()\/.,:-]{4,}$/.test(trimmed) && /[A-Z]/.test(trimmed);
      const colon=/^[A-Z][^.!?]{2,80}:$/.test(trimmed);
      if(markdown || titled || colon) findings.push({line:index+1,quote:quoteForLine(trimmed)});
    });
    return uniqueFindings(findings,20);
  }

  function analyzeDocument(name, text, lines){
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const nonEmpty = lines.filter(line => line.trim()).length;
    const datePattern = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/gi;
    const moneyPattern = /(?:\$\s?|USD\s+)\d[\d,]*(?:\.\d{1,2})?/gi;
    const referencePattern = /\b(?:case|claim|account|invoice|reference|confirmation|policy|notice)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*[A-Z0-9][A-Z0-9-]{3,}\b/gi;
    const actionPattern = /\b(?:must|shall|required|due|respond|submit|send|return|appear|hearing|pay|contact|renew|appeal|object|sign|complete|provide|deliver|notify|cancel|terminate)\b/i;
    const contactPattern = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\bhttps?:\/\/\S+|\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b)/gi;
    const instructionPattern = /\b(?:ignore (?:all|any|the|previous) (?:instructions|directions)|system prompt|developer message|act as|do not follow (?:the|these|any)|execute (?:this|the following)|reveal (?:the )?(?:prompt|instructions))\b/i;
    return {
      name,
      metrics:{ characters:text.length, words, lines:lines.length, nonEmpty },
      headings:identifyHeadings(lines),
      dates:scanLines(lines,datePattern),
      amounts:scanLines(lines,moneyPattern),
      references:scanLines(lines,referencePattern),
      actions:uniqueFindings(lines.map((line,index)=>actionPattern.test(line)?{line:index+1,quote:quoteForLine(line)}:null).filter(Boolean),30),
      contacts:scanLines(lines,contactPattern,15),
      instructionLike:uniqueFindings(lines.map((line,index)=>instructionPattern.test(line)?{line:index+1,quote:quoteForLine(line)}:null).filter(Boolean),20)
    };
  }

  const PLAN_ITEM_TYPES = Object.freeze({
    question:'Question to resolve',
    'missing-information':'Information or document to find',
    'next-action':'Next action I choose',
    note:'User note'
  });

  function cleanUserText(value, limit=1200){
    return String(value || '').replace(/\u0000/g,'').replace(/\r\n?/g,'\n').trim().slice(0,limit);
  }

  function createPlanItemRecord(type, text, targetDate){
    const normalizedType=Object.prototype.hasOwnProperty.call(PLAN_ITEM_TYPES,type)?type:'note';
    const clean=cleanUserText(text);
    if(!clean) return {error:'Enter the question, missing-information item, next action, or note.'};
    const date=String(targetDate || '').trim();
    if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return {error:'Use a valid target date or leave it blank.'};
    return {item:{id:`item-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,type:normalizedType,label:PLAN_ITEM_TYPES[normalizedType],text:clean,targetDate:date||null}};
  }

  function createCorrectionRecord(lineValue, note, lines){
    const line=Number(lineValue);
    const clean=cleanUserText(note);
    if(!Number.isInteger(line) || line<1 || line>lines.length) return {error:`Enter a source line from 1 through ${lines.length.toLocaleString()}.`};
    if(!clean) return {error:'Explain the correction, uncertainty, or interpretation you want to keep separate.'};
    return {correction:{id:`correction-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,line,original:String(lines[line-1] || ''),note:clean}};
  }

  function planFindingsFromAnalysis(analysis){
    const groups=[
      ['heading','Possible heading or section',analysis.headings],
      ['stated-date','Date stated in source',analysis.dates],
      ['action-language','Action or response language',analysis.actions],
      ['amount','Amount stated in source',analysis.amounts],
      ['reference','Reference identifier',analysis.references],
      ['contact','Contact information or web address',analysis.contacts],
      ['instruction-like','Instruction-like source text',analysis.instructionLike]
    ];
    const seen=new Set();
    const result=[];
    groups.forEach(([kind,label,items])=>items.forEach(item=>{
      const key=`${kind}:${item.line}:${item.quote}`;
      if(seen.has(key)) return;
      seen.add(key);
      result.push({key,kind,label,line:item.line,quote:item.quote,matches:item.matches||[]});
    }));
    return result.slice(0,120);
  }

  function buildActionPlanData(sourceName, selectedFindings, items, corrections){
    return {
      schemaVersion:'1.0.0',
      tool:'Smarter Justice device-only source-linked action plan',
      sourceName:displayName(sourceName,'Document text'),
      generatedLocally:new Date().toISOString(),
      selectedSourceFindings:selectedFindings.map(item=>({kind:item.kind,label:item.label,line:item.line,exactExcerpt:item.quote,matches:item.matches||[]})),
      userItems:items.map(item=>({type:item.type,label:item.label,text:item.text,targetDate:item.targetDate||null})),
      separateCorrections:corrections.map(item=>({line:item.line,originalSourceLine:item.original,userCorrectionOrNote:item.note})),
      limitations:[
        'This organizer is based only on source text and user-entered notes in the current browser tab.',
        'A source date is not necessarily a legal deadline. Any target date was entered by the user and was not calculated or verified by the tool.',
        'Corrections and interpretations do not overwrite or alter the original source.',
        'This is not legal, tax, accounting, medical, financial, government, or other professional advice or review.',
        'Use the original document as the controlling source.'
      ]
    };
  }

  function actionPlanAsText(data){
    const out=[
      data.tool,
      `Source: ${data.sourceName}`,
      `Generated locally: ${data.generatedLocally}`,
      '',
      'SELECTED SOURCE FINDINGS'
    ];
    if(!data.selectedSourceFindings.length) out.push('None selected.');
    data.selectedSourceFindings.forEach(item=>out.push(`${item.label} — Line ${item.line}: ${item.exactExcerpt}${item.matches.length?` [Found: ${item.matches.join('; ')}]`:''}`));
    out.push('','USER QUESTIONS, MISSING INFORMATION, ACTIONS, AND NOTES');
    if(!data.userItems.length) out.push('None added.');
    data.userItems.forEach(item=>out.push(`${item.label}${item.targetDate?` | User-chosen target date: ${item.targetDate}`:''}: ${item.text}`));
    out.push('','SEPARATE CORRECTIONS AND INTERPRETATIONS');
    if(!data.separateCorrections.length) out.push('None recorded.');
    data.separateCorrections.forEach(item=>out.push(`Line ${item.line} original: ${item.originalSourceLine}\nUser correction or note: ${item.userCorrectionOrNote}`));
    out.push('','IMPORTANT LIMITS');
    data.limitations.forEach(item=>out.push(`- ${item}`));
    return out.join('\n');
  }


  const COMMUNICATION_TYPES = Object.freeze({
    clarification:'Request clarification',
    correction:'Request a correction or review',
    records:'Request records or information',
    questions:'Prepare questions',
    'follow-up':'Follow up on an earlier communication'
  });

  function createCommunicationDraft(options, selectedFindings){
    const type=Object.prototype.hasOwnProperty.call(COMMUNICATION_TYPES,options.type)?options.type:'clarification';
    const recipient=cleanUserText(options.recipient,120);
    const subject=cleanUserText(options.subject,160);
    const sender=cleanUserText(options.sender,120);
    const context=cleanUserText(options.context,1600);
    const request=cleanUserText(options.request,2000);
    const closing=['Thank you','Sincerely','Respectfully'].includes(options.closing)?options.closing:'Thank you';
    const responseDate=String(options.responseDate||'').trim();
    if(!recipient) return {error:'Enter the person, office, or organization you plan to contact.'};
    if(!request) return {error:'Enter the question or requested action you want included.'};
    if(!Array.isArray(selectedFindings) || !selectedFindings.length) return {error:'Choose at least one exact source finding to ground the draft.'};
    if(responseDate && !/^\d{4}-\d{2}-\d{2}$/.test(responseDate)) return {error:'Use a valid response date or leave it blank.'};
    const sourceName=displayName(options.sourceName,'Document text');
    const sources=selectedFindings.map(item=>({kind:item.kind,label:item.label,line:item.line,exactExcerpt:item.quote,matches:item.matches||[]}));
    const openingByType={
      clarification:`I am writing to request clarification about ${sourceName}.`,
      correction:`I am writing to request a review or correction concerning ${sourceName}.`,
      records:`I am writing to request information or records concerning ${sourceName}.`,
      questions:`I am writing with questions about ${sourceName}.`,
      'follow-up':`I am following up concerning ${sourceName}.`
    };
    const lines=[];
    if(subject) lines.push(`Subject: ${subject}`,'');
    lines.push(`Hello ${recipient},`,'',openingByType[type]);
    if(context) lines.push('',context);
    lines.push('','The source text includes the following statements:');
    sources.forEach(item=>lines.push(`- “${item.exactExcerpt}” (source line ${item.line})`));
    lines.push('',request);
    if(responseDate) lines.push('',`If possible, please respond by ${responseDate}.`);
    lines.push('',`${closing},`);
    if(sender) lines.push(sender);
    return {data:{
      schemaVersion:'1.0.0',
      tool:'Smarter Justice device-only factual communication preparation',
      sourceName,
      generatedLocally:new Date().toISOString(),
      draftType:type,
      draftTypeLabel:COMMUNICATION_TYPES[type],
      recipient,
      subject:subject||null,
      sender:sender||null,
      context:context||null,
      userRequest:request,
      userChosenResponseDate:responseDate||null,
      closing,
      selectedSourceFindings:sources,
      draftBody:lines.join('\n'),
      limitations:[
        'This is an editable user-controlled draft, not a message sent by Smarter Justice.',
        'Only user-entered text and affirmatively selected source excerpts are included.',
        'The tool does not invent facts, calculate a deadline, recommend strategy, contact a recipient, or create a professional relationship.',
        'Any response date was entered by the user and was not calculated or verified by the tool.',
        'Review every fact, quotation, recipient, and request against the original source before sending.'
      ]
    }};
  }

  function communicationDraftAsText(data, editableBody){
    const body=String(editableBody===undefined?data.draftBody:editableBody||'').trim();
    const out=[
      data.tool,
      `Source: ${data.sourceName}`,
      `Draft type: ${data.draftTypeLabel}`,
      `Generated locally: ${data.generatedLocally}`,
      '',
      'EDITABLE DRAFT',
      body || '[Draft text cleared by user]',
      '',
      'SOURCE APPENDIX — NOT AUTOMATICALLY PART OF THE MESSAGE'
    ];
    data.selectedSourceFindings.forEach(item=>out.push(`${item.label} — Line ${item.line}: ${item.exactExcerpt}`));
    out.push('','IMPORTANT LIMITS');
    data.limitations.forEach(item=>out.push(`- ${item}`));
    return out.join('\n');
  }


  const BINDER_PURPOSES = Object.freeze({
    'personal-records':'Organize personal records',
    'self-help-follow-up':'Prepare for user-directed follow-up',
    'professional-conversation':'Prepare before speaking with a professional',
    'agency-or-office-contact':'Prepare before contacting an office or organization'
  });

  function buildPreparationBinderData(options, selectedFindings, actionPlanData, communicationDraft, editableCommunicationBody){
    const binderTitle=cleanUserText(options.title,160);
    const purpose=Object.prototype.hasOwnProperty.call(BINDER_PURPOSES,options.purpose)?options.purpose:'personal-records';
    const userSummary=cleanUserText(options.summary,2400);
    const includePlan=Boolean(options.includePlan);
    const includeCommunication=Boolean(options.includeCommunication);
    if(!binderTitle) return {error:'Enter a title for the preparation binder.'};
    if(includePlan && !actionPlanData) return {error:'Build the action plan above before including it in the binder.'};
    if(includeCommunication && !communicationDraft) return {error:'Build the communication draft above before including it in the binder.'};
    const sourceName=displayName(options.sourceName,'Document text');
    const sources=(Array.isArray(selectedFindings)?selectedFindings:[]).map(item=>({kind:item.kind,label:item.label,line:item.line,exactExcerpt:item.quote,matches:item.matches||[]}));
    const plan=includePlan ? {
      selectedSourceFindings:(actionPlanData.selectedSourceFindings||[]).map(item=>({...item})),
      userItems:(actionPlanData.userItems||[]).map(item=>({...item})),
      separateCorrections:(actionPlanData.separateCorrections||[]).map(item=>({...item}))
    } : null;
    const communication=includeCommunication ? {
      draftTypeLabel:communicationDraft.draftTypeLabel,
      recipient:communicationDraft.recipient,
      subject:communicationDraft.subject||null,
      editableDraft:normalizeText(editableCommunicationBody===undefined?communicationDraft.draftBody:editableCommunicationBody).trim().slice(0,12000),
      selectedSourceFindings:(communicationDraft.selectedSourceFindings||[]).map(item=>({...item}))
    } : null;
    const planHasContent=Boolean(plan && (plan.selectedSourceFindings.length || plan.userItems.length || plan.separateCorrections.length));
    if(!sources.length && !planHasContent && !communication) return {error:'Choose at least one source finding or include a completed action plan or communication draft.'};
    return {data:{
      schemaVersion:'1.0.0',
      tool:'Smarter Justice device-only preparation binder',
      sourceName,
      binderTitle,
      purpose,
      purposeLabel:BINDER_PURPOSES[purpose],
      generatedLocally:new Date().toISOString(),
      userEnteredSummary:userSummary||null,
      selectedSourceFindings:sources,
      actionPlan:plan,
      communicationDraft:communication,
      limitations:[
        'This binder is assembled locally from user-entered information, affirmatively selected source excerpts, and work prepared in the current browser tab.',
        'Original source excerpts, user corrections, user notes, and draft language remain labeled as different kinds of information.',
        'The binder is not filed, uploaded, sent, reviewed by a professional, or shared with a professional by Smarter Justice.',
        'The tool does not determine legal effect, recommend strategy, verify a deadline, or create a professional relationship.',
        'Confirm every fact, quotation, date, amount, recipient, and requested action against the original source before relying on or sharing the binder.'
      ]
    }};
  }

  function preparationBinderAsText(data){
    const out=[
      data.tool,
      `Binder title: ${data.binderTitle}`,
      `Purpose: ${data.purposeLabel}`,
      `Primary source: ${data.sourceName}`,
      `Generated locally: ${data.generatedLocally}`,
      '',
      'USER-ENTERED SUMMARY',
      data.userEnteredSummary || 'No user-entered summary.',
      '',
      'SELECTED SOURCE FINDINGS'
    ];
    if(!data.selectedSourceFindings.length) out.push('None selected directly for this binder.');
    data.selectedSourceFindings.forEach(item=>out.push(`${item.label} — Line ${item.line}: ${item.exactExcerpt}`));
    out.push('','ACTION PLAN AND SEPARATE CORRECTIONS');
    if(!data.actionPlan) out.push('Not included.');
    else{
      if(data.actionPlan.selectedSourceFindings.length){out.push('Source findings carried from action plan:');data.actionPlan.selectedSourceFindings.forEach(item=>out.push(`- ${item.label} — Line ${item.line}: ${item.exactExcerpt}`));}
      if(data.actionPlan.userItems.length){out.push('User-added items:');data.actionPlan.userItems.forEach(item=>out.push(`- ${item.label}${item.targetDate?` | User-chosen target date: ${item.targetDate}`:''}: ${item.text}`));}
      if(data.actionPlan.separateCorrections.length){out.push('Separate corrections or notes:');data.actionPlan.separateCorrections.forEach(item=>out.push(`- Line ${item.line} original: ${item.originalSourceLine}\n  User correction or note: ${item.userCorrectionOrNote}`));}
      if(!data.actionPlan.selectedSourceFindings.length && !data.actionPlan.userItems.length && !data.actionPlan.separateCorrections.length) out.push('Included action plan contains no items.');
    }
    out.push('','EDITABLE COMMUNICATION DRAFT');
    if(!data.communicationDraft) out.push('Not included.');
    else{
      out.push(`Draft type: ${data.communicationDraft.draftTypeLabel}`);
      out.push(`Recipient: ${data.communicationDraft.recipient}`);
      if(data.communicationDraft.subject) out.push(`Subject: ${data.communicationDraft.subject}`);
      out.push('',data.communicationDraft.editableDraft || '[Draft text cleared by user]','', 'Communication source appendix:');
      data.communicationDraft.selectedSourceFindings.forEach(item=>out.push(`- ${item.label} — Line ${item.line}: ${item.exactExcerpt}`));
    }
    out.push('','IMPORTANT LIMITS');
    data.limitations.forEach(item=>out.push(`- ${item}`));
    return out.join('\n');
  }

  function findingList(title, findings, emptyText){
    const section=create('section',null,'source-finding-section');
    section.appendChild(create('h3',title));
    if(!findings.length){section.appendChild(create('p',emptyText,'fine-print'));return section;}
    const list=create('ol',null,'source-finding-list');
    findings.forEach(item=>{
      const li=create('li');
      const ref=create('strong',`Line ${item.line}`,'source-line-reference');
      li.appendChild(ref);
      li.appendChild(document.createTextNode(` — “${item.quote}”`));
      if(item.matches && item.matches.length){
        const match=create('span',`Found: ${item.matches.join('; ')}`,'source-match');
        li.appendChild(match);
      }
      list.appendChild(li);
    });
    section.appendChild(list);
    return section;
  }

  function renderReview(analysis){
    const root=$('reviewResult');
    root.replaceChildren();
    const heading=create('h2',`Review of ${analysis.name}`);
    heading.tabIndex=-1;
    root.appendChild(heading);
    const boundary=create('div',null,'notice review-boundary');
    boundary.appendChild(create('strong','Based only on the text shown here.'));
    boundary.appendChild(create('p','Line references below point to the text in this browser tab. A finding does not establish a legal deadline, obligation, entitlement, violation, or recommended action.'));
    root.appendChild(boundary);
    const metrics=create('div',null,'document-metrics');
    [['Lines',analysis.metrics.lines],['Non-empty lines',analysis.metrics.nonEmpty],['Words',analysis.metrics.words],['Characters',analysis.metrics.characters]].forEach(([label,value])=>{
      const card=create('div',null,'metric-card');
      card.appendChild(create('strong',Number(value).toLocaleString()));
      card.appendChild(create('span',label));
      metrics.appendChild(card);
    });
    root.appendChild(metrics);
    if(analysis.instructionLike.length){
      const warning=create('div',null,'notice warning-note');
      warning.appendChild(create('strong','Instruction-like text detected.'));
      warning.appendChild(create('p','It is displayed only as document content. The tool does not execute or follow instructions contained in a source document.'));
      root.appendChild(warning);
    }
    root.appendChild(findingList('Possible headings or section labels',analysis.headings,'No likely heading lines were detected.'));
    root.appendChild(findingList('Dates directly stated in the text',analysis.dates,'No common written date pattern was detected.'));
    root.appendChild(findingList('Action or response language',analysis.actions,'No common action or response terms were detected.'));
    root.appendChild(findingList('Amounts directly stated in the text',analysis.amounts,'No common currency pattern was detected.'));
    root.appendChild(findingList('Reference identifiers',analysis.references,'No common case, claim, account, invoice, policy, notice, or reference-number pattern was detected.'));
    root.appendChild(findingList('Contact information or web addresses',analysis.contacts,'No common email, telephone, or web-address pattern was detected.'));
    if(analysis.instructionLike.length) root.appendChild(findingList('Instruction-like source lines',analysis.instructionLike,'No instruction-like source language was detected.'));
    root.hidden=false;
    heading.focus();

    const sections=[
      ['Possible headings or section labels',analysis.headings],
      ['Dates directly stated in the text',analysis.dates],
      ['Action or response language',analysis.actions],
      ['Amounts directly stated in the text',analysis.amounts],
      ['Reference identifiers',analysis.references],
      ['Contact information or web addresses',analysis.contacts],
      ['Instruction-like source lines',analysis.instructionLike]
    ];
    const output=[
      `Smarter Justice device-only text review`,
      `Source: ${analysis.name}`,
      `Generated locally: ${new Date().toISOString()}`,
      '',
      `Lines: ${analysis.metrics.lines}`,
      `Non-empty lines: ${analysis.metrics.nonEmpty}`,
      `Words: ${analysis.metrics.words}`,
      `Characters: ${analysis.metrics.characters}`,
      '',
      'LIMITS: This rules-based summary is not legal, tax, accounting, medical, financial, government, or other professional advice. A stated date is not necessarily a deadline. Confirm every finding from the original source.'
    ];
    sections.forEach(([title,items])=>{
      output.push('',title.toUpperCase());
      if(!items.length) output.push('None detected.');
      items.forEach(item=>output.push(`Line ${item.line}: ${item.quote}${item.matches?.length?` [Found: ${item.matches.join('; ')}]`:''}`));
    });
    state.reviewDownload=output.join('\n');
    $('downloadReview').disabled=false;
  }

  function findWithin(lines,start,target){
    const end=Math.min(lines.length,start+LOOKAHEAD+1);
    for(let i=start;i<end;i++) if(lines[i]===target) return i-start;
    return -1;
  }

  function compareLines(aLines,bLines){
    const rows=[];
    let i=0,j=0;
    while(i<aLines.length || j<bLines.length){
      if(i<aLines.length && j<bLines.length && aLines[i]===bLines[j]){
        rows.push({type:'unchanged',aLine:i+1,bLine:j+1,a:aLines[i],b:bLines[j]});i++;j++;continue;
      }
      if(i>=aLines.length){rows.push({type:'added',aLine:null,bLine:j+1,a:'',b:bLines[j]});j++;continue;}
      if(j>=bLines.length){rows.push({type:'removed',aLine:i+1,bLine:null,a:aLines[i],b:''});i++;continue;}
      const addDistance=findWithin(bLines,j,aLines[i]);
      const removeDistance=findWithin(aLines,i,bLines[j]);
      if(addDistance>0 && (removeDistance<0 || addDistance<=removeDistance)){
        for(let k=0;k<addDistance;k++){rows.push({type:'added',aLine:null,bLine:j+1,a:'',b:bLines[j]});j++;}
        continue;
      }
      if(removeDistance>0){
        for(let k=0;k<removeDistance;k++){rows.push({type:'removed',aLine:i+1,bLine:null,a:aLines[i],b:''});i++;}
        continue;
      }
      rows.push({type:'changed',aLine:i+1,bLine:j+1,a:aLines[i],b:bLines[j]});i++;j++;
    }
    return rows;
  }

  function renderComparison(nameA,nameB,rows,includeUnchanged){
    const root=$('compareResult');
    root.replaceChildren();
    const heading=create('h2',`Comparison: ${nameA} and ${nameB}`);
    heading.tabIndex=-1;
    root.appendChild(heading);
    const counts=rows.reduce((acc,row)=>{acc[row.type]=(acc[row.type]||0)+1;return acc;},{});
    const metrics=create('div',null,'document-metrics');
    [['Added lines',counts.added||0],['Removed lines',counts.removed||0],['Changed line pairs',counts.changed||0],['Unchanged lines',counts.unchanged||0]].forEach(([label,value])=>{
      const card=create('div',null,'metric-card');card.appendChild(create('strong',value));card.appendChild(create('span',label));metrics.appendChild(card);
    });
    root.appendChild(metrics);
    const note=create('div',null,'notice review-boundary');
    note.appendChild(create('strong','Neutral text comparison.'));
    note.appendChild(create('p','Added, removed, and changed lines are described without deciding what a change means legally or whether either version is complete. Compare the original documents, formatting, exhibits, signatures, and attachments separately.'));
    root.appendChild(note);
    const visible=includeUnchanged?rows:rows.filter(row=>row.type!=='unchanged');
    if(!visible.length){root.appendChild(create('p','No line changes were detected after normalizing line endings.'));}
    else{
      const wrap=create('div',null,'table-wrap document-diff-wrap');
      const table=create('table',null,'document-diff-table');
      const caption=create('caption',`Line comparison between ${nameA} and ${nameB}`,'sr-only');table.appendChild(caption);
      const thead=create('thead');const headRow=create('tr');['Change','Version A line and text','Version B line and text'].forEach(text=>headRow.appendChild(create('th',text)));thead.appendChild(headRow);table.appendChild(thead);
      const tbody=create('tbody');
      visible.slice(0,2500).forEach(row=>{
        const tr=create('tr',null,`diff-${row.type}`);
        tr.appendChild(create('td',row.type[0].toUpperCase()+row.type.slice(1)));
        tr.appendChild(create('td',row.aLine?`Line ${row.aLine}: ${quoteForLine(row.a)}`:'—'));
        tr.appendChild(create('td',row.bLine?`Line ${row.bLine}: ${quoteForLine(row.b)}`:'—'));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);wrap.appendChild(table);root.appendChild(wrap);
      if(visible.length>2500) root.appendChild(create('p',`The display is limited to the first 2,500 comparison rows. The downloaded summary includes all ${visible.length.toLocaleString()} rows.`,'fine-print'));
    }
    root.hidden=false;heading.focus();
    const output=[
      'Smarter Justice device-only text comparison',
      `Version A: ${nameA}`,
      `Version B: ${nameB}`,
      `Generated locally: ${new Date().toISOString()}`,
      '',
      `Added lines: ${counts.added||0}`,
      `Removed lines: ${counts.removed||0}`,
      `Changed line pairs: ${counts.changed||0}`,
      `Unchanged lines: ${counts.unchanged||0}`,
      '',
      'LIMITS: This is a neutral rules-based line comparison, not professional advice or a determination of legal effect, completeness, validity, or enforceability.',
      ''
    ];
    rows.forEach(row=>{
      if(!includeUnchanged && row.type==='unchanged') return;
      output.push(`${row.type.toUpperCase()} | A ${row.aLine||'-'}: ${row.a||''} | B ${row.bLine||'-'}: ${row.b||''}`);
    });
    state.comparisonDownload=output.join('\n');
    $('downloadComparison').disabled=false;
  }

  function renderPlanSourcePicker(){
    const status=$('planSourceStatus');
    const root=$('planSourceFindings');
    root.replaceChildren();
    if(!state.reviewContext){
      status.textContent='Review text above to begin a source-linked plan.';
      root.appendChild(create('p','No reviewed source is available in this tab.','fine-print'));
      return;
    }
    const {analysis}=state.reviewContext;
    status.textContent=`Current source: ${analysis.name} — ${analysis.metrics.lines.toLocaleString()} lines. Nothing below is selected automatically.`;
    state.planFindings=planFindingsFromAnalysis(analysis);
    if(!state.planFindings.length){
      root.appendChild(create('p','No common source findings were detected. You can still add your own questions, missing information, actions, notes, and line-specific corrections.','fine-print'));
      return;
    }
    const grouped=new Map();
    state.planFindings.forEach(item=>{
      if(!grouped.has(item.label)) grouped.set(item.label,[]);
      grouped.get(item.label).push(item);
    });
    grouped.forEach((items,label)=>{
      const section=create('section',null,'plan-finding-group');
      section.appendChild(create('h3',label));
      items.forEach(item=>{
        const wrapper=create('label',null,'plan-finding-option');
        const input=create('input');
        input.type='checkbox';
        input.dataset.planFinding=item.key;
        wrapper.appendChild(input);
        const text=create('span');
        text.appendChild(create('strong',`Line ${item.line}`));
        text.appendChild(document.createTextNode(` — “${item.quote}”`));
        wrapper.appendChild(text);
        section.appendChild(wrapper);
      });
      root.appendChild(section);
    });
  }

  function renderPlanCollections(){
    const itemRoot=$('planItemsList');
    itemRoot.replaceChildren();
    if(!state.planItems.length) itemRoot.appendChild(create('p','No user-added items yet.','fine-print'));
    state.planItems.forEach(item=>{
      const card=create('article',null,'plan-list-card');
      card.appendChild(create('strong',item.label));
      card.appendChild(create('p',item.text));
      if(item.targetDate) card.appendChild(create('small',`User-chosen target date: ${item.targetDate}`));
      const remove=create('button','Remove','text-button'); remove.type='button';
      remove.addEventListener('click',()=>{state.planItems=state.planItems.filter(row=>row.id!==item.id);renderPlanCollections();resetPlanDownloads();});
      card.appendChild(remove);itemRoot.appendChild(card);
    });
    const correctionRoot=$('correctionsList');
    correctionRoot.replaceChildren();
    if(!state.corrections.length) correctionRoot.appendChild(create('p','No corrections recorded.','fine-print'));
    state.corrections.forEach(item=>{
      const card=create('article',null,'plan-list-card');
      card.appendChild(create('strong',`Source line ${item.line}`));
      card.appendChild(create('p',`Original: “${quoteForLine(item.original)}”`,'fine-print'));
      card.appendChild(create('p',`Your correction or note: ${item.note}`));
      const remove=create('button','Remove','text-button'); remove.type='button';
      remove.addEventListener('click',()=>{state.corrections=state.corrections.filter(row=>row.id!==item.id);renderPlanCollections();resetPlanDownloads();});
      card.appendChild(remove);correctionRoot.appendChild(card);
    });
  }

  function resetPlanDownloads(){
    state.planTextDownload='';state.planJsonDownload='';state.actionPlanData=null;
    $('downloadPlanText').disabled=true;$('downloadPlanJson').disabled=true;
    $('actionPlanResult').hidden=true;$('actionPlanResult').replaceChildren();
    resetBinderOutput();
  }

  function clearPlanState(clearSource=false){
    state.planItems=[];state.corrections=[];state.planFindings=[];state.actionPlanData=null;
    if(clearSource) state.reviewContext=null;
    $('actionPlanForm').reset();
    setError($('planError'),'');
    resetPlanDownloads();renderPlanCollections();renderPlanSourcePicker();
  }

  function selectedPlanFindings(){
    const selected=new Set([...document.querySelectorAll('[data-plan-finding]:checked')].map(node=>node.dataset.planFinding));
    return state.planFindings.filter(item=>selected.has(item.key));
  }

  function renderCommunicationSourcePicker(){
    const status=$('communicationSourceStatus');
    const root=$('communicationSourceFindings');
    root.replaceChildren();
    if(!state.reviewContext){
      status.textContent='Review text above to begin a draft based on exact source lines.';
      root.appendChild(create('p','No reviewed source is available in this tab.','fine-print'));
      return;
    }
    const {analysis}=state.reviewContext;
    status.textContent=`Current source: ${analysis.name} — ${analysis.metrics.lines.toLocaleString()} lines. Nothing below is selected automatically.`;
    const findings=planFindingsFromAnalysis(analysis);
    if(!findings.length){
      root.appendChild(create('p','No common source findings were detected. Use a smaller excerpt containing the exact lines you want to reference.','fine-print'));
      return;
    }
    const grouped=new Map();
    findings.forEach(item=>{if(!grouped.has(item.label)) grouped.set(item.label,[]);grouped.get(item.label).push(item);});
    grouped.forEach((items,label)=>{
      const section=create('section',null,'plan-finding-group');
      section.appendChild(create('h3',label));
      items.forEach(item=>{
        const wrapper=create('label',null,'plan-finding-option');
        const input=create('input');input.type='checkbox';input.dataset.communicationFinding=item.key;
        wrapper.appendChild(input);
        const text=create('span');text.appendChild(create('strong',`Line ${item.line}`));text.appendChild(document.createTextNode(` — “${item.quote}”`));
        wrapper.appendChild(text);section.appendChild(wrapper);
      });
      root.appendChild(section);
    });
  }

  function selectedCommunicationFindings(){
    if(!state.reviewContext) return [];
    const selected=new Set([...document.querySelectorAll('[data-communication-finding]:checked')].map(node=>node.dataset.communicationFinding));
    return planFindingsFromAnalysis(state.reviewContext.analysis).filter(item=>selected.has(item.key));
  }

  function updateCommunicationDownload(){
    if(!state.communicationDraft){state.communicationTextDownload='';$('downloadCommunication').disabled=true;return;}
    state.communicationTextDownload=communicationDraftAsText(state.communicationDraft,$('communicationDraftEditor').value);
    $('downloadCommunication').disabled=false;
    resetBinderOutput();
  }

  function renderCommunicationDraft(data){
    state.communicationDraft=data;
    $('communicationDraftEditor').value=data.draftBody;
    const appendix=$('communicationSourceAppendix');appendix.replaceChildren();
    const list=create('ol',null,'source-finding-list');
    data.selectedSourceFindings.forEach(item=>{
      const li=create('li');li.appendChild(create('strong',`${item.label} — Line ${item.line}`));li.appendChild(document.createTextNode(` — “${item.exactExcerpt}”`));list.appendChild(li);
    });
    appendix.appendChild(list);
    $('communicationResult').hidden=false;
    updateCommunicationDownload();
    $('communicationResultHeading').focus();
  }

  function clearCommunicationState(clearSource=false){
    state.communicationDraft=null;state.communicationTextDownload='';
    resetBinderOutput();
    if(clearSource) state.reviewContext=null;
    $('communicationForm').reset();
    setError($('communicationError'),'');
    $('communicationDraftEditor').value='';
    $('communicationSourceAppendix').replaceChildren();
    $('communicationResult').hidden=true;
    $('downloadCommunication').disabled=true;
    renderCommunicationSourcePicker();
  }


  function renderBinderSourcePicker(){
    const status=$('binderSourceStatus');
    const root=$('binderSourceFindings');
    root.replaceChildren();
    if(!state.reviewContext){
      status.textContent='Review text above to begin a source-grounded preparation binder.';
      root.appendChild(create('p','No reviewed source is available in this tab.','fine-print'));
      updateBinderAvailability();
      return;
    }
    const {analysis}=state.reviewContext;
    status.textContent=`Current source: ${analysis.name} — ${analysis.metrics.lines.toLocaleString()} lines. Nothing below is selected automatically.`;
    const findings=planFindingsFromAnalysis(analysis);
    if(!findings.length){root.appendChild(create('p','No common source findings were detected. Build an action plan or communication draft above, or use a smaller excerpt with the exact lines you want to organize.','fine-print'));updateBinderAvailability();return;}
    const grouped=new Map();
    findings.forEach(item=>{if(!grouped.has(item.label)) grouped.set(item.label,[]);grouped.get(item.label).push(item);});
    grouped.forEach((items,label)=>{
      const section=create('section',null,'plan-finding-group');section.appendChild(create('h3',label));
      items.forEach(item=>{
        const wrapper=create('label',null,'plan-finding-option');
        const input=create('input');input.type='checkbox';input.dataset.binderFinding=item.key;
        wrapper.appendChild(input);
        const text=create('span');text.appendChild(create('strong',`Line ${item.line}`));text.appendChild(document.createTextNode(` — “${item.quote}”`));
        wrapper.appendChild(text);section.appendChild(wrapper);
      });
      root.appendChild(section);
    });
    updateBinderAvailability();
  }

  function selectedBinderFindings(){
    if(!state.reviewContext) return [];
    const selected=new Set([...document.querySelectorAll('[data-binder-finding]:checked')].map(node=>node.dataset.binderFinding));
    return planFindingsFromAnalysis(state.reviewContext.analysis).filter(item=>selected.has(item.key));
  }

  function updateBinderAvailability(){
    const plan=$('binderIncludePlan');
    const communication=$('binderIncludeCommunication');
    const status=$('binderAvailability');
    if(!plan || !communication || !status) return;
    plan.disabled=!state.actionPlanData;
    communication.disabled=!state.communicationDraft;
    if(plan.disabled) plan.checked=false;
    if(communication.disabled) communication.checked=false;
    const parts=[state.actionPlanData?'Action plan ready.':'Action plan not built.',state.communicationDraft?'Communication draft ready.':'Communication draft not built.'];
    status.textContent=parts.join(' ');
  }

  function resetBinderOutput(){
    state.preparationBinder=null;state.binderTextDownload='';state.binderJsonDownload='';
    const result=$('preparationBinderResult');if(result){result.hidden=true;result.replaceChildren();}
    const textButton=$('downloadBinderText');if(textButton) textButton.disabled=true;
    const jsonButton=$('downloadBinderJson');if(jsonButton) jsonButton.disabled=true;
    updateBinderAvailability();
  }

  function clearPreparationBinderState(clearSource=false){
    if(clearSource) state.reviewContext=null;
    const form=$('preparationBinderForm');if(form) form.reset();
    const error=$('binderError');if(error) setError(error,'');
    resetBinderOutput();
    const editor=$('communicationDraftEditor');
    if(editor && state.communicationDraft) state.communicationTextDownload=communicationDraftAsText(state.communicationDraft,editor.value);
    renderBinderSourcePicker();
  }

  function renderPreparationBinder(data){
    state.preparationBinder=data;
    const root=$('preparationBinderResult');root.replaceChildren();
    const heading=create('h2',data.binderTitle);heading.tabIndex=-1;root.appendChild(heading);
    const note=create('div',null,'notice review-boundary');note.appendChild(create('strong','Local preparation package—review before relying on or sharing.'));note.appendChild(create('p','Source excerpts, user-entered information, separate corrections, and draft language remain labeled and are not treated as professional conclusions.'));root.appendChild(note);
    const summary=create('section',null,'source-finding-section');summary.appendChild(create('h3','Purpose and user-entered summary'));summary.appendChild(create('p',data.purposeLabel));summary.appendChild(create('p',data.userEnteredSummary||'No user-entered summary.','fine-print'));root.appendChild(summary);
    const findings=create('section',null,'source-finding-section');findings.appendChild(create('h3','Selected source findings'));
    if(!data.selectedSourceFindings.length) findings.appendChild(create('p','No source findings selected directly for this binder.','fine-print'));
    else{const list=create('ol',null,'source-finding-list');data.selectedSourceFindings.forEach(item=>{const li=create('li');li.appendChild(create('strong',`${item.label} — Line ${item.line}`));li.appendChild(document.createTextNode(` — “${item.exactExcerpt}”`));list.appendChild(li);});findings.appendChild(list);}root.appendChild(findings);
    const plan=create('section',null,'source-finding-section');plan.appendChild(create('h3','Action plan and separate corrections'));
    if(!data.actionPlan) plan.appendChild(create('p','Not included.','fine-print'));
    else{
      const list=create('ul',null,'check-list');
      data.actionPlan.userItems.forEach(item=>list.appendChild(create('li',`${item.label}${item.targetDate?` — user-chosen target ${item.targetDate}`:''}: ${item.text}`)));
      data.actionPlan.separateCorrections.forEach(item=>list.appendChild(create('li',`Line ${item.line} original: “${quoteForLine(item.originalSourceLine)}” — User correction or note: ${item.userCorrectionOrNote}`)));
      data.actionPlan.selectedSourceFindings.forEach(item=>list.appendChild(create('li',`${item.label} — Line ${item.line}: “${item.exactExcerpt}”`)));
      if(!list.children.length) plan.appendChild(create('p','Included action plan contains no items.','fine-print'));else plan.appendChild(list);
    }root.appendChild(plan);
    const communication=create('section',null,'source-finding-section');communication.appendChild(create('h3','Editable communication draft'));
    if(!data.communicationDraft) communication.appendChild(create('p','Not included.','fine-print'));
    else{communication.appendChild(create('pre',data.communicationDraft.editableDraft||'[Draft text cleared by user]','binder-draft-preview'));const list=create('ol',null,'source-finding-list');data.communicationDraft.selectedSourceFindings.forEach(item=>{const li=create('li');li.appendChild(create('strong',`${item.label} — Line ${item.line}`));li.appendChild(document.createTextNode(` — “${item.exactExcerpt}”`));list.appendChild(li);});communication.appendChild(list);}root.appendChild(communication);
    const limits=create('section',null,'source-finding-section');limits.appendChild(create('h3','Important limits'));const limitList=create('ul',null,'check-list');data.limitations.forEach(item=>limitList.appendChild(create('li',item)));limits.appendChild(limitList);root.appendChild(limits);
    root.hidden=false;heading.focus();
    state.binderTextDownload=preparationBinderAsText(data);state.binderJsonDownload=JSON.stringify(data,null,2);
    $('downloadBinderText').disabled=false;$('downloadBinderJson').disabled=false;
  }

  function renderActionPlan(data){
    state.actionPlanData=data;resetBinderOutput();
    const root=$('actionPlanResult');root.replaceChildren();
    const heading=create('h2',`Action plan for ${data.sourceName}`);heading.tabIndex=-1;root.appendChild(heading);
    const note=create('div',null,'notice review-boundary');
    note.appendChild(create('strong','User-controlled organizer, not a recommendation.'));
    note.appendChild(create('p','Selected source lines, your separate corrections, and your own questions or actions are shown together without changing the original document or calculating a deadline.'));
    root.appendChild(note);
    const sourceSection=create('section',null,'source-finding-section');sourceSection.appendChild(create('h3','Selected source findings'));
    if(!data.selectedSourceFindings.length) sourceSection.appendChild(create('p','No source findings selected.','fine-print'));
    else{
      const list=create('ol',null,'source-finding-list');data.selectedSourceFindings.forEach(item=>{
        const li=create('li');li.appendChild(create('strong',`${item.label} — Line ${item.line}`));li.appendChild(document.createTextNode(` — “${item.exactExcerpt}”`));list.appendChild(li);
      });sourceSection.appendChild(list);
    }
    root.appendChild(sourceSection);
    const itemsSection=create('section',null,'source-finding-section');itemsSection.appendChild(create('h3','Your questions, missing information, actions, and notes'));
    if(!data.userItems.length) itemsSection.appendChild(create('p','No user-added items.','fine-print'));
    else{
      const list=create('ul',null,'check-list');data.userItems.forEach(item=>list.appendChild(create('li',`${item.label}${item.targetDate?` — user-chosen target ${item.targetDate}`:''}: ${item.text}`)));itemsSection.appendChild(list);
    }root.appendChild(itemsSection);
    const correctionsSection=create('section',null,'source-finding-section');correctionsSection.appendChild(create('h3','Separate corrections and interpretations'));
    if(!data.separateCorrections.length) correctionsSection.appendChild(create('p','No corrections recorded.','fine-print'));
    else{
      const list=create('ol',null,'source-finding-list');data.separateCorrections.forEach(item=>{
        const li=create('li');li.appendChild(create('strong',`Line ${item.line} original`));li.appendChild(document.createTextNode(` — “${quoteForLine(item.originalSourceLine)}”`));li.appendChild(create('span',`Your correction or note: ${item.userCorrectionOrNote}`,'source-match'));list.appendChild(li);
      });correctionsSection.appendChild(list);
    }root.appendChild(correctionsSection);
    const limits=create('section',null,'source-finding-section');limits.appendChild(create('h3','Important limits'));const list=create('ul',null,'check-list');data.limitations.forEach(item=>list.appendChild(create('li',item)));limits.appendChild(list);root.appendChild(limits);
    root.hidden=false;heading.focus();
    state.planTextDownload=actionPlanAsText(data);
    state.planJsonDownload=JSON.stringify(data,null,2);
    $('downloadPlanText').disabled=false;$('downloadPlanJson').disabled=false;
  }

  function downloadText(filename,text){
    if(!text) return;
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = { normalizeText, validateText, analyzeDocument, compareLines, quoteForLine, createPlanItemRecord, createCorrectionRecord, planFindingsFromAnalysis, buildActionPlanData, actionPlanAsText, createCommunicationDraft, communicationDraftAsText, buildPreparationBinderData, preparationBinderAsText, MAX_FILE_BYTES, MAX_TEXT_CHARS, MAX_LINES };
    }
    return;
  }

  const reviewText=$('reviewText');
  const compareTextA=$('compareTextA');
  const compareTextB=$('compareTextB');
  [reviewText,compareTextA,compareTextB].forEach((textarea,index)=>{
    const counter=[$('reviewTextCount'),$('compareCountA'),$('compareCountB')][index];
    textarea.addEventListener('input',()=>updateCount(textarea,counter));
    updateCount(textarea,counter);
  });

  $('reviewFile').addEventListener('change',event=>readLocalText(event.target.files[0],reviewText,$('reviewSourceName'),$('reviewError'),$('reviewTextCount')));
  $('compareFileA').addEventListener('change',event=>readLocalText(event.target.files[0],compareTextA,$('compareNameA'),$('compareError'),$('compareCountA')));
  $('compareFileB').addEventListener('change',event=>readLocalText(event.target.files[0],compareTextB,$('compareNameB'),$('compareError'),$('compareCountB')));

  $('documentReviewForm').addEventListener('submit',event=>{
    event.preventDefault();
    const result=validateText(reviewText.value,'the document');
    if(result.error) return setError($('reviewError'),result.error);
    setError($('reviewError'),'');
    const analysis=analyzeDocument(displayName($('reviewSourceName').value,'Document text'),result.text,result.lines);
    state.reviewContext={analysis,text:result.text,lines:result.lines};
    state.planItems=[];state.corrections=[];resetPlanDownloads();renderPlanCollections();renderPlanSourcePicker();clearCommunicationState(false);clearPreparationBinderState(false);
    renderReview(analysis);
  });

  $('documentCompareForm').addEventListener('submit',event=>{
    event.preventDefault();
    const a=validateText(compareTextA.value,'Version A');
    const b=validateText(compareTextB.value,'Version B');
    if(a.error || b.error) return setError($('compareError'),a.error || b.error);
    setError($('compareError'),'');
    renderComparison(displayName($('compareNameA').value,'Version A'),displayName($('compareNameB').value,'Version B'),compareLines(a.lines,b.lines),$('includeUnchanged').checked);
  });

  $('addPlanItem').addEventListener('click',()=>{
    if(!state.reviewContext) return setError($('planError'),'Review source text above before adding plan items.');
    const result=createPlanItemRecord($('planItemType').value,$('planItemText').value,$('planTargetDate').value);
    if(result.error) return setError($('planError'),result.error);
    state.planItems.push(result.item);$('planItemText').value='';$('planTargetDate').value='';setError($('planError'),'');renderPlanCollections();resetPlanDownloads();$('planItemText').focus();
  });

  $('addCorrection').addEventListener('click',()=>{
    if(!state.reviewContext) return setError($('planError'),'Review source text above before recording a correction.');
    const result=createCorrectionRecord($('correctionLine').value,$('correctionNote').value,state.reviewContext.lines);
    if(result.error) return setError($('planError'),result.error);
    state.corrections.push(result.correction);$('correctionLine').value='';$('correctionNote').value='';setError($('planError'),'');renderPlanCollections();resetPlanDownloads();$('correctionLine').focus();
  });

  $('actionPlanForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(!state.reviewContext) return setError($('planError'),'Review source text above before building an action plan.');
    const selected=selectedPlanFindings();
    if(!selected.length && !state.planItems.length && !state.corrections.length) return setError($('planError'),'Select at least one source finding or add a question, missing-information item, action, note, or correction.');
    setError($('planError'),'');
    renderActionPlan(buildActionPlanData(state.reviewContext.analysis.name,selected,state.planItems,state.corrections));
  });

  $('preparationBinderForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(!state.reviewContext) return setError($('binderError'),'Review source text above before building a preparation binder.');
    const result=buildPreparationBinderData({
      sourceName:state.reviewContext.analysis.name,
      title:$('binderTitle').value,
      purpose:$('binderPurpose').value,
      summary:$('binderSummary').value,
      includePlan:$('binderIncludePlan').checked,
      includeCommunication:$('binderIncludeCommunication').checked
    },selectedBinderFindings(),state.actionPlanData,state.communicationDraft,$('communicationDraftEditor').value);
    if(result.error) return setError($('binderError'),result.error);
    setError($('binderError'),'');renderPreparationBinder(result.data);
  });
  $('clearBinder').addEventListener('click',()=>{clearPreparationBinderState(false);$('binderTitle').focus();});
  $('downloadBinderText').addEventListener('click',()=>downloadText('smarter-justice-device-only-preparation-binder.txt',state.binderTextDownload));
  $('downloadBinderJson').addEventListener('click',()=>downloadText('smarter-justice-device-only-preparation-binder.json',state.binderJsonDownload));

  $('communicationForm').addEventListener('submit',event=>{
    event.preventDefault();
    if(!state.reviewContext) return setError($('communicationError'),'Review source text above before building a communication draft.');
    const result=createCommunicationDraft({
      sourceName:state.reviewContext.analysis.name,
      type:$('communicationType').value,
      recipient:$('communicationRecipient').value,
      subject:$('communicationSubject').value,
      sender:$('communicationSender').value,
      context:$('communicationContext').value,
      request:$('communicationRequest').value,
      responseDate:$('communicationResponseDate').value,
      closing:$('communicationClosing').value
    },selectedCommunicationFindings());
    if(result.error) return setError($('communicationError'),result.error);
    setError($('communicationError'),'');
    renderCommunicationDraft(result.data);
  });
  $('communicationDraftEditor').addEventListener('input',updateCommunicationDownload);
  $('clearCommunication').addEventListener('click',()=>{clearCommunicationState(false);$('communicationRecipient').focus();});
  $('downloadCommunication').addEventListener('click',()=>downloadText('smarter-justice-device-only-communication-draft.txt',state.communicationTextDownload));

  $('clearPlan').addEventListener('click',()=>{clearPlanState(false);$('planItemText').focus();});
  $('downloadPlanText').addEventListener('click',()=>downloadText('smarter-justice-device-only-action-plan.txt',state.planTextDownload));
  $('downloadPlanJson').addEventListener('click',()=>downloadText('smarter-justice-device-only-action-plan.json',state.planJsonDownload));

  $('clearReview').addEventListener('click',()=>{
    $('documentReviewForm').reset();reviewText.value='';updateCount(reviewText,$('reviewTextCount'));$('reviewResult').replaceChildren();$('reviewResult').hidden=true;setError($('reviewError'),'');state.reviewDownload='';$('downloadReview').disabled=true;clearPlanState(true);clearCommunicationState(true);clearPreparationBinderState(true);reviewText.focus();
  });
  $('clearComparison').addEventListener('click',()=>{
    $('documentCompareForm').reset();compareTextA.value='';compareTextB.value='';updateCount(compareTextA,$('compareCountA'));updateCount(compareTextB,$('compareCountB'));$('compareResult').replaceChildren();$('compareResult').hidden=true;setError($('compareError'),'');state.comparisonDownload='';$('downloadComparison').disabled=true;compareTextA.focus();
  });
  renderPlanCollections();
  renderPlanSourcePicker();
  renderCommunicationSourcePicker();
  renderBinderSourcePicker();
  updateBinderAvailability();

  $('downloadReview').addEventListener('click',()=>downloadText('smarter-justice-device-only-review.txt',state.reviewDownload));
  $('downloadComparison').addEventListener('click',()=>downloadText('smarter-justice-device-only-comparison.txt',state.comparisonDownload));
})();
