const fs = require('fs');
const p = 'c:/PAINEL CLARO/painel-claro/BACKEND/src/controllers/authController.js';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/const STORES = \[[\s\S]*?\];\r?\n/, '');
c = c.replace(
  'const matchedStore = STORES.find(s => s.code.toUpperCase() === storeCode.toUpperCase());',
  'const matchedStore = findStore(storeCode);'
);

fs.writeFileSync(p, c, 'utf8');
console.log('authController.js successfully updated with findStore!');

