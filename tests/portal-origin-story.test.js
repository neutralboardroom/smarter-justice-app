const assert=require('assert');
const fs=require('fs');
const path=require('path');
const origin=require('../data/sharedOriginStory');
const integrations=require('../data/portalIntegrationContracts');
const root=path.join(__dirname,'..');
assert.strictEqual(origin.ORIGIN_STORY_STANDARD_VERSION,'1.1.0');
assert.strictEqual(origin.APPROVED_ORIGIN_SENTENCE,"Smarter Justice grew from years of street-level outreach through Justice Truck—meeting people where they were, listening to their legal concerns, speaking with attorneys, and seeing how difficult it could be to find the right starting point.");
assert.strictEqual(integrations.PORTAL_INTEGRATION_STANDARD_VERSION,'1.5.0');
assert.strictEqual(integrations.PORTAL_INTEGRATION_CONTRACTS.length,8);
for(const contract of integrations.PORTAL_INTEGRATION_CONTRACTS){
  assert(contract.originStory && contract.originStory.required, `${contract.name} missing required origin story`);
  assert.strictEqual(contract.originStory.approvedSentence,origin.APPROVED_ORIGIN_SENTENCE);
  assert(/not yet implemented|implemented|live verified/i.test(contract.originStory.implementationStatus));
  assert.strictEqual(contract.originStory.liveVerified,false);
  assert(contract.publicPaidHumanReview && contract.publicPaidHumanReview.standardVersion==='1.0.0', `${contract.name} missing public paid Human Review standard`);
  assert.strictEqual(contract.publicPaidHumanReview.ownerActivationApproved,false);
  assert(/paused/i.test(contract.publicPaidHumanReview.status));
}
const story=fs.readFileSync(path.join(root,'public','our-story.html'),'utf8');
assert(story.includes(origin.APPROVED_ORIGIN_SENTENCE));
for(const file of ['PORTAL_PROFESSIONAL_INTEGRATION_STANDARD.md','PORTAL_CONTINUATION_PROMPT_STANDARD.md','SMARTER_JUSTICE_MASTER_COORDINATION_STANDARD.md','PORTAL_BUILD_LIST_TEMPLATE.md']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  assert(text.includes('Justice Truck'), `${file} missing Justice Truck origin-story inheritance`);
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'portal-manifest.json'),'utf8'));
assert.strictEqual(manifest.sharedStandardVersion,require('../data/sharedPlatformStandards').SHARED_STANDARD_VERSION);
assert.strictEqual(manifest.capabilities.sharedMicroPortalOriginStoryStandard,true);
assert.strictEqual(manifest.capabilities.activeJusticeTruckSmarterJusticeBrandRelationship,true);
assert(/original and continuing community-access/i.test(origin.ORIGIN_STORY_STANDARD.brandHierarchy));
console.log('portal-origin-story.test.js passed');
