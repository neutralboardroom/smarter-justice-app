'use strict';
const assert=require('assert');
const crypto=require('crypto');
const store=require('../lib/store');
(async()=>{
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the PostgreSQL acceptance test.');
  process.env.NODE_ENV=process.env.NODE_ENV||'production';
  const initial=await store.init();
  assert(initial.databaseReady&&initial.databaseSchemaCurrent,'database and migrations must be ready');
  const key=`acceptance-${crypto.randomBytes(8).toString('hex')}.json`;
  await Promise.all(Array.from({length:20},(_,i)=>store.mutateJson(key,{count:0,seen:[]},draft=>{draft.count+=1;draft.seen.push(i);return{value:draft,result:draft.count};})));
  await store.flush();
  let state=store.readJson(key,{});assert.equal(state.count,20);assert.equal(new Set(state.seen).size,20);
  const check=await store.verifyDatabaseConnection();assert(check.ok,check.error);
  await store.reconnect();state=store.readJson(key,{});assert.equal(state.count,20,'state must survive reconnect');
  console.log(JSON.stringify({ok:true,concurrentMutations:20,reconnectPersistence:true,migrationStatus:store.storageStatus().migrationStatus},null,2));
})().catch(error=>{console.error(error);process.exit(1);});
