#!/usr/bin/env node
'use strict';
const bundle=require('../lib/v14AcceptanceEvidenceBundle');const result=bundle.evaluate();console.log(JSON.stringify(result,null,2));if(!result.ok)process.exit(1);
