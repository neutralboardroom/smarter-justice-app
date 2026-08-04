#!/usr/bin/env node
'use strict';const readiness=require('../lib/deploymentReadiness');const out=readiness.validate();process.stdout.write(JSON.stringify({command:'deployment:doctor',mode:'READ_ONLY_LOCAL',...out},null,2)+'\n');if(!out.ok)process.exitCode=1;
