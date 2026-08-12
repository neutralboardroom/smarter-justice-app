'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const repairs={
  'attorney-call-tour.html':'https://smarterjustice.com/attorney-call-tour.html',
  'navigator.html':'https://smarterjustice.com/navigator'
};
const marker='SMARTER_JUSTICE_PRE56_CLEAN_CARRIER_CANONICAL_REPAIR';
for(const [name,canonical] of Object.entries(repairs)){
  const file=path.join(root,'public',name);if(!fs.existsSync(file))continue;let html=fs.readFileSync(file,'utf8');
  if(!/<link[^>]+rel=["']canonical["']/i.test(html)){
    if(!html.includes('</head>'))throw new Error(`PRE56 carrier repair head seam missing in ${name}`);
    html=html.replace('</head>',`<link rel="canonical" href="${canonical}"><!-- ${marker} --></head>`);
    fs.writeFileSync(file,html,'utf8');
  }
  if(!html.includes(`href="${canonical}"`))throw new Error(`PRE56 carrier repair canonical mismatch in ${name}`);
}
console.log('PRE56_CLEAN_CARRIER_CANONICAL_REPAIR_APPLIED');
