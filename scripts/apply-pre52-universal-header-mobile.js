'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public');
const cssPath=path.join(pub,'styles.css');
const MARK='SMARTER_JUSTICE_PRE52_UNIVERSAL_HEADER_MOBILE';
for(const name of fs.readdirSync(pub).filter(n=>n.endsWith('.html'))){
  const p=path.join(pub,name); let s=fs.readFileSync(p,'utf8');
  const hasUniversal=/class=["'][^"']*\bu-nav\b/i.test(s)&&/class=["'][^"']*\bu-links\b/i.test(s);
  const hasSiteHeader=/class=["'][^"']*\bsite-header\b/i.test(s);
  if(!hasUniversal&&!hasSiteHeader)continue;
  if(hasUniversal){
    if(!/data-nav-toggle/i.test(s))s=s.replace(/(<nav[^>]*class=["'][^"']*\bu-links\b[^"']*["'][^>]*>)/i,`<button class="nav-toggle u-nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>Menu</button>$1`);
    s=s.replace(/<nav([^>]*class=["'][^"']*\bu-links\b[^"']*["'][^>]*)>/i,(m,attrs)=>/data-nav(?:\s|=|$)/i.test(attrs)?m:`<nav${attrs} data-nav>`);
  }
  if(hasSiteHeader){
    const headerMatch=s.match(/<header[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i);
    if(headerMatch&&/<nav\b/i.test(headerMatch[0])){
      let header=headerMatch[0];
      if(!/data-nav-toggle/i.test(header)){
        const navAt=header.search(/<nav\b/i);
        header=header.slice(0,navAt)+`<button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>Menu</button>`+header.slice(navAt);
      }
      header=header.replace(/<nav([^>]*)>/i,(m,attrs)=>/data-nav(?:\s|=|$)/i.test(attrs)?m:`<nav${attrs} data-nav>`);
      s=s.replace(headerMatch[0],header);
    }
  }
  if(!/src=["']\/app\.js/i.test(s))s=s.replace('</head>','<script defer src="/app.js"></script></head>');
  if(!s.includes(MARK))s=s.replace('<body','<!-- '+MARK+' --><body');
  fs.writeFileSync(p,s,'utf8');
}
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes(MARK)){
  css+=`\n/* ${MARK} */\n.u-header .u-nav-toggle{display:none;margin-left:auto;border:1px solid #d9e2ec;background:#fff;color:#102a43;border-radius:9px;padding:.62rem .8rem;font:inherit;font-weight:750;min-width:72px;min-height:44px;cursor:pointer}\n@media(max-width:900px){.u-header .u-nav{position:relative}.u-header .u-nav-toggle{display:inline-flex!important;align-items:center;justify-content:center;order:2}.u-header .u-links{display:none!important;position:absolute!important;left:0!important;right:0!important;top:calc(100% + .4rem)!important;z-index:120!important;background:#fff!important;border:1px solid #d9e2ec!important;border-radius:16px!important;padding:.65rem!important;box-shadow:0 20px 45px rgba(16,42,67,.18)!important;max-height:calc(100vh - 96px)!important;overflow:auto!important}.u-header .u-links.open{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:.15rem!important}.u-header .u-links.open a{display:block!important;width:100%!important;min-height:44px!important;padding:.72rem .8rem!important;border-radius:10px!important}.u-header .u-brand{margin-right:auto}.u-header .u-sign{border:0!important}}\n`;
  fs.writeFileSync(cssPath,css,'utf8');
}
console.log('PRE52_UNIVERSAL_HEADER_MOBILE_APPLIED');
