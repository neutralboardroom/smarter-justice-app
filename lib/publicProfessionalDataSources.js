const { PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION, PUBLIC_PROFESSIONAL_DATA_SOURCES } = require('../data/publicProfessionalDataSources');

const MAX_PREVIEW_ROWS = 100;
const MAX_IMPORT_ROWS = 50;

function clean(value, max=300){ return String(value == null ? '' : value).trim().slice(0,max); }
function list(value, max=100){
  const source = Array.isArray(value) ? value : String(value || '').split(/\r?\n|,/);
  return [...new Set(source.map(v=>clean(v,180)).filter(Boolean))].slice(0,max);
}
function boundedInt(value, fallback, min, max){ if(value == null || String(value).trim() === '') return fallback; const n=Number(value); return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback; }
function quoteSoql(value){ return `'${clean(value,180).replace(/'/g,"''")}'`; }
function numericRegistration(value){ const raw=clean(value,20); return /^\d{1,12}$/.test(raw)?raw:''; }
function titleCase(value){ return clean(value,180).toLowerCase().replace(/\b([a-z])/g,m=>m.toUpperCase()); }
function compact(parts, separator=' '){ return parts.map(x=>clean(x,300)).filter(Boolean).join(separator).replace(/\s+/g,' ').trim(); }

function publicSources(){
  return { version:PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION, sources:PUBLIC_PROFESSIONAL_DATA_SOURCES };
}

function buildNysAttorneyQuery(input={}){
  const source=PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'];
  const params=new URLSearchParams();
  params.set('$select',source.fields.join(','));
  params.set('$order','last_name,first_name,registration_number');
  params.set('$limit',String(boundedInt(input.limit,25,1,MAX_PREVIEW_ROWS)));
  params.set('$offset',String(boundedInt(input.offset,0,0,10000000)));
  const where=[];
  const reg=numericRegistration(input.registrationNumber);
  if(reg) where.push(`registration_number=${reg}`);
  for(const [field,key] of [['first_name','firstName'],['last_name','lastName'],['county','county'],['status','status'],['city','city'],['state','state'],['company_name','companyName'],['street_1','streetAddress']]){
    const value=clean(input[key],180);
    if(value) where.push(`upper(${field}) like upper(${quoteSoql(`%${value}%`)})`);
  }
  if(where.length) params.set('$where',where.join(' AND '));
  return `${source.resourceEndpoint}?${params.toString()}`;
}

function buildNysAttorneyRegistrationQuery(registrationNumbers=[]){
  const source=PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'];
  const ids=[...new Set((registrationNumbers||[]).map(numericRegistration).filter(Boolean))].slice(0,MAX_IMPORT_ROWS);
  if(!ids.length) throw new Error('Add at least one valid New York attorney registration number.');
  const params=new URLSearchParams();
  params.set('$select',source.fields.join(','));
  params.set('$where',`registration_number in (${ids.join(',')})`);
  params.set('$order','last_name,first_name,registration_number');
  params.set('$limit',String(ids.length));
  return `${source.resourceEndpoint}?${params.toString()}`;
}

function mapNysCredentialStatus(value){
  const status=clean(value,120).toLowerCase();
  if(/currently registered|active|registered/.test(status) && !/not|inactive|retired|resigned|suspended|delinquent/.test(status)) return 'active';
  if(/suspend|disciplin/.test(status)) return 'suspended';
  if(/retired|resigned|inactive|deceased/.test(status)) return 'inactive';
  return 'unverified';
}

function normalizeNysAttorneyRow(row={}){
  const source=PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'];
  const registrationNumber=numericRegistration(row.registration_number);
  const firstName=titleCase(row.first_name);
  const middleName=titleCase(row.middle_name);
  const lastName=titleCase(row.last_name);
  const suffix=clean(row.suffix,40);
  const displayName=compact([firstName,middleName,lastName,suffix]);
  const zip=compact([row.zip,row.zip_plus_four], row.zip_plus_four?'-':'');
  const addressLine=compact([row.street_1,row.street_2],', ');
  const cityStateZip=compact([row.city,row.state,zip],', ');
  const country=clean(row.country,120);
  const publicBusinessAddress=compact([addressLine,cityStateZip,country],', ');
  const recordUrl=registrationNumber ? `${source.resourceEndpoint}?registration_number=${encodeURIComponent(registrationNumber)}` : source.landingPage;
  const factsSupported=['name','New York attorney registration number','registration status','year admitted','judicial department of admission','law school','public business contact and address where provided','company or firm name where provided'];
  return {
    externalSourceId:`${source.datasetId}:${registrationNumber || displayName}`,
    professionalType:'attorney',
    displayName,
    firstName,
    lastName,
    phone:clean(row.phone_number,80),
    officeLocations:publicBusinessAddress?[publicBusinessAddress]:[],
    jurisdictions:['New York'],
    practiceAreas:[],
    portalEligibility:['general-smarter-justice-start'],
    sourceSeeded:true,
    publicFacts:{
      registrationNumber,
      middleName,
      suffix,
      companyName:clean(row.company_name,240),
      publicBusinessAddress,
      city:clean(row.city,140),
      state:clean(row.state,80),
      county:clean(row.county,140),
      country,
      yearAdmitted:clean(row.year_admitted,20),
      judicialDepartmentOfAdmission:clean(row.judicial_department_of_admission,180),
      lawSchool:clean(row.law_school,240),
      registrationStatus:clean(row.status,180)
    },
    credentials: registrationNumber ? [{
      credentialType:'New York attorney registration',
      jurisdiction:'New York',
      identifier:registrationNumber,
      status:mapNysCredentialStatus(row.status),
      verificationSource:recordUrl,
      notes:'Credential status copied from the official NYS Attorney Registrations public dataset. Smarter Justice profile verification remains separate.'
    }] : [],
    sourceRecords:[{
      sourceType:'official licensing dataset',
      sourceName:source.name,
      sourceUrl:recordUrl,
      authorityLevel:'primary',
      reviewStatus:'approved source',
      retrievedAt:new Date().toISOString(),
      lastVerifiedAt:'',
      factsSupported,
      externalSourceId:`${source.datasetId}:${registrationNumber}`,
      datasetId:source.datasetId,
      publisher:source.publisher,
      sourceRecordUpdatedAt:'',
      termsOrUseNotes:`${source.publicBasis} Import only public fields and preserve correction/claim controls.`,
      notes:`Official dataset landing page: ${source.landingPage}`
    }],
    ownerNotes:'Imported from the official NYS Attorney Registrations dataset. Practice areas and focused-portal mapping require separate reliable public sources or professional confirmation before public use.'
  };
}

async function fetchJson(url, fetchImpl=global.fetch){
  if(typeof fetchImpl!=='function') throw new Error('Network retrieval is not available in this runtime.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetchImpl(url,{headers:{Accept:'application/json','User-Agent':'SmarterJustice-ProfessionalSourceImporter/1.0'},signal:controller.signal});
    if(!response.ok) throw new Error(`Official source returned HTTP ${response.status}.`);
    const data=await response.json();
    if(!Array.isArray(data)) throw new Error('Official source returned an unexpected response.');
    return data;
  } finally { clearTimeout(timer); }
}

async function previewNysAttorneys(input={}, fetchImpl=global.fetch){
  const queryUrl=buildNysAttorneyQuery(input);
  const rows=await fetchJson(queryUrl,fetchImpl);
  return {source:PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'],queryUrl,rows:rows.map(normalizeNysAttorneyRow),count:rows.length};
}

async function fetchNysAttorneysByRegistration(registrationNumbers=[], fetchImpl=global.fetch){
  const queryUrl=buildNysAttorneyRegistrationQuery(registrationNumbers);
  const rows=await fetchJson(queryUrl,fetchImpl);
  return {source:PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'],queryUrl,rows:rows.map(normalizeNysAttorneyRow),count:rows.length};
}

module.exports={
  PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION,
  PUBLIC_PROFESSIONAL_DATA_SOURCES,
  MAX_PREVIEW_ROWS,
  MAX_IMPORT_ROWS,
  publicSources,
  buildNysAttorneyQuery,
  buildNysAttorneyRegistrationQuery,
  normalizeNysAttorneyRow,
  previewNysAttorneys,
  fetchNysAttorneysByRegistration,
  mapNysCredentialStatus,
  list
};
