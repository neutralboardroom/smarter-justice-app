'use strict';
const data=require('../data/publicFreemiumV1775');
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(){const errors=[];if(data.releaseVersion!=='1.7.75')errors.push('release-version');if((data.freeCore||[]).length<10)errors.push('free-core');if((data.neverPaywall||[]).length<8)errors.push('never-paywall');if(data.highCostServices?.state!=='CLOSED')errors.push('high-cost-open');if(data.nonRegression?.paymentRequiredForFreeCore!==false)errors.push('free-core-payment');if(data.nonRegression?.paidAiRequiredForTierA!==false)errors.push('tier-a-ai');if(!(data.freeCore||[]).some(x=>/non-AI fallback/i.test(x)))errors.push('fallback');return{ok:errors.length===0,errors,releaseVersion:data.releaseVersion};}
function ownerView(){return{manifest:clone(data),validation:validate()};}
module.exports={validate,ownerView};
