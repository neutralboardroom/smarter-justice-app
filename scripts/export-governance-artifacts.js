const fs = require('fs');
const path = require('path');
const rules = require('../data/masterRulesPack');
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.json');
const mdPath = path.join(root, 'SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.md');
fs.writeFileSync(jsonPath, JSON.stringify(rules.apiPayload(), null, 2) + '\n');
fs.writeFileSync(mdPath, rules.markdown());
console.log(`Exported Master Rules Pack ${rules.MASTER_RULES_PACK_VERSION} (${rules.checksum()})`);
