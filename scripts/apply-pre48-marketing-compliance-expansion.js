'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98',pub=path.join(root,'public'),src=path.resolve(__dirname,'..','public');
for(const name of ['marketing-compliance-pre48-data.js','professional-growth-pre48-addon.js']){const from=path.join(src,name),to=path.join(pub,name);if(!fs.existsSync(from))throw new Error(`Missing pre48 payload ${name}`);fs.copyFileSync(from,to);}
{
  const p=path.join(pub,'professional-growth.html');if(!fs.existsSync(p))throw new Error('Missing runtime professional-growth.html');let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE48_COMPLIANCE_EXPANSION')){
    if(!s.includes('/marketing-compliance-pre47-data.js'))throw new Error('Pre48 data-script anchor missing');
    s=s.replace('/marketing-compliance-pre47-data.js','/marketing-compliance-pre48-data.js');
    if(!s.includes('<script defer src="/professional-growth.js"></script>'))throw new Error('Pre48 addon-script anchor missing');
    s=s.replace('<script defer src="/professional-growth.js"></script>','<script defer src="/professional-growth.js"></script><script defer src="/professional-growth-pre48-addon.js"></script>');
    s=s.replace('<!-- SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH -->','<!-- SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH --><!-- SMARTER_JUSTICE_PRE48_COMPLIANCE_EXPANSION -->');
    s=s.replace('selected New York, Florida, and Texas issues','selected New York, Florida, Texas, California, and New Jersey issues');
    const opts='<option value="NY">New York</option><option value="FL">Florida</option><option value="TX">Texas</option><option value="OTHER">Other / not mapped</option>';
    const next='<option value="NY">New York</option><option value="FL">Florida</option><option value="TX">Texas</option><option value="CA">California</option><option value="NJ">New Jersey</option><option value="OTHER">Other / not mapped</option>';
    if(!s.includes(opts))throw new Error('Pre48 jurisdiction options anchor missing');s=s.replace(opts,next);
    const noContact='<label>Has this recipient asked not to be solicited?\n            <select id="marketingNoContact"><option value="NO">No</option><option value="YES">Yes</option><option value="UNKNOWN">Unknown</option></select>\n          </label>';
    const context=noContact+'\n          <label>California only: DVRO respondent solicitation status\n            <select id="marketingDvRestrainingOrder"><option value="NOT_APPLICABLE">Not applicable</option><option value="NO">Not a DVRO respondent solicitation</option><option value="YES_PRE_SERVICE">Yes — before service/proof of service</option><option value="UNKNOWN">Unknown</option></select>\n          </label>\n          <label>New Jersey only: Is a competitor lawyer or firm name being purchased as a search keyword?\n            <select id="marketingCompetitorKeyword"><option value="NOT_APPLICABLE">Not applicable</option><option value="NO">No</option><option value="YES">Yes</option><option value="UNKNOWN">Unknown</option></select>\n          </label>\n          <label>If the draft contains a testimonial or endorsement, is the endorser identified?\n            <select id="marketingEndorserIdentified"><option value="NOT_APPLICABLE">Not applicable</option><option value="YES">Yes</option><option value="NO">No</option><option value="UNKNOWN">Unknown</option></select>\n          </label>\n          <label>If the draft contains a testimonial or endorsement, was the endorser paid for the endorsement?\n            <select id="marketingTestimonialPaid"><option value="NOT_APPLICABLE">Not applicable</option><option value="NO">No</option><option value="YES">Yes</option><option value="UNKNOWN">Unknown</option></select>\n          </label>';
    if(!s.includes(noContact))throw new Error('Pre48 decision-context anchor missing');s=s.replace(noContact,context);fs.writeFileSync(p,s);
  }
}
{
  const p=path.join(pub,'growth-operations-compliance.html');if(!fs.existsSync(p))throw new Error('Missing runtime growth-operations-compliance.html');let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS')){const old='Use the browser-local, source-linked preflight for selected current New York, Florida, and Texas issues. Unmapped or uncertain questions require human review.';const next='<!-- SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS -->Use the browser-local, source-linked preflight for selected current New York, Florida, Texas, California, and New Jersey issues. Unmapped or uncertain questions require human review.';if(!s.includes(old))throw new Error('Pre48 GOC wording anchor missing');s=s.replace(old,next);fs.writeFileSync(p,s);}
}
console.log('PRE48_MARKETING_COMPLIANCE_EXPANSION_APPLIED');
