'use strict';
const {Pool}=require('pg');
const migrations=require('../lib/migrations');
(async()=>{
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. No migration was attempted.');
  const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:/^(disable|false|0)$/i.test(String(process.env.PGSSLMODE||''))?false:{rejectUnauthorized:false},connectionTimeoutMillis:Number(process.env.PG_CONNECT_TIMEOUT_MS||5000)});
  try{const status=await migrations.runMigrations(pool);console.log(JSON.stringify({ok:true,status,manifest:migrations.manifest()},null,2));}
  finally{await pool.end();}
})().catch(error=>{console.error(error.message||error);process.exit(1);});
