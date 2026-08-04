'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');
const data=require('../COMPETITIVE_LANDSCAPE_V1.7.23.json');const control=require('../lib/controlCenter');
assert.equal(data.version,'1.7.23');assert(data.competitors.length>=7);assert(data.approvedAdaptations.some(x=>/Options Navigator/.test(x)));assert(data.rejectedPatterns.some(x=>/Paid or sponsored/.test(x)));for(const item of data.competitors){assert(item.name&&item.category&&item.observedPatterns.length&&item.adaptation&&/^https:\/\//.test(item.source));}
const owner=control.getControlCenterData();assert.equal(owner.competitiveLandscape.version,'1.7.23');assert(fs.readFileSync(path.join(__dirname,'..','public','control-center.html'),'utf8').includes('competitiveLandscapeSection'));console.log('competitive-landscape-v1723.test.js passed');
