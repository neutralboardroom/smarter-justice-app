'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');
const root=path.join(__dirname,'..');const cc=require('../lib/controlCenter');
const standard=fs.readFileSync(path.join(root,'PORTAL_CONTINUATION_PROMPT_STANDARD.md'),'utf8');
assert(standard.includes('Mandatory Cross-Portal Learning and Adaptation section'));assert(standard.includes('newest uploaded portal artifact remains implementation truth'));assert(standard.includes('prohibit blind copying'));
for(const slug of ['business-launch-desk','justice-tax-solutions','immigration-oasis']){
 const prompt=cc.promptForPortal(slug);assert(prompt);assert(prompt.includes('## Cross-Portal Learning and Adaptation'));assert(prompt.includes('Current source artifacts represented'));assert(prompt.includes('Decisions applicable to this portal'));assert(prompt.includes('Mandatory continuation-prompt contract'));assert(prompt.includes('newest uploaded portal ZIP'));
}
const io=cc.promptForPortal('immigration-oasis');assert(io.includes('v1.10.254'));assert(io.includes('v1.10.162'));assert(io.includes('must never be clean-deployed alone'));assert(io.includes('non-destructively'));
const tax=cc.promptForPortal('justice-tax-solutions');assert(tax.includes('0.1.107'));assert(tax.includes('verify-first'));
const bld=cc.promptForPortal('business-launch-desk');assert(bld.includes('0.2.39'));
const master=cc.masterCoordinationPrompt();assert(master.includes('## Cross-Portal Learning and Adaptation'));assert(master.includes('Maintain the shared Cross-Portal Capability Registry'));
console.log('continuation-learning-standard-v1728.test.js passed');
