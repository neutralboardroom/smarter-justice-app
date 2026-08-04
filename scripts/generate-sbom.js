'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const pkg=require('../package.json');
const lock=require('../package-lock.json');
const manifest=require('../portal-manifest.json');

const entries=Object.entries(lock.packages||{}).filter(([location,record])=>location&&record.version).sort(([a],[b])=>a.localeCompare(b));
const packages=entries.map(([location,record])=>{
  const name=record.name||location.replace(/^node_modules\//,'');
  return {
    SPDXID:`SPDXRef-Package-${name.replace(/[^A-Za-z0-9.-]/g,'-')}-${record.version}`,
    name,
    versionInfo:record.version,
    downloadLocation:record.resolved||'NOASSERTION',
    checksums:record.integrity?[{algorithm:'SHA512',checksumValue:String(record.integrity).replace(/^sha512-/,'')}]:[],
    licenseConcluded:'NOASSERTION',
    licenseDeclared:record.license||'NOASSERTION'
  };
});
const releaseDate=String(manifest.lastExactArtifactTestDate||'1970-01-01');
const defaultCreated=`${releaseDate}T00:00:00.000Z`;
const requestedCreated=String(process.env.SBOM_CREATED_AT||defaultCreated);
if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(requestedCreated))throw new Error('SBOM_CREATED_AT must be an exact UTC ISO timestamp.');
const namespaceDigest=crypto.createHash('sha256').update(JSON.stringify({version:pkg.version,packages})).digest('hex').slice(0,32);
const doc={
  spdxVersion:'SPDX-2.3',
  dataLicense:'CC0-1.0',
  SPDXID:'SPDXRef-DOCUMENT',
  name:`Smarter Justice ${pkg.version} dependency SBOM`,
  documentNamespace:`https://smarterjustice.com/sbom/${pkg.version}/${namespaceDigest}`,
  creationInfo:{created:requestedCreated,creators:['Tool: Smarter Justice generate-sbom.js']},
  packages,
  relationships:packages.map(item=>({spdxElementId:'SPDXRef-DOCUMENT',relationshipType:'DESCRIBES',relatedSpdxElement:item.SPDXID}))
};
fs.writeFileSync(path.join(__dirname,'..','SBOM.spdx.json'),JSON.stringify(doc,null,2)+'\n');
console.log(`SBOM.spdx.json written deterministically with ${packages.length} dependency packages.`);
