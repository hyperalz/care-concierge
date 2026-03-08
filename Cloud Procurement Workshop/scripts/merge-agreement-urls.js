/**
 * Merge URLs into cc-agreements.json
 * 
 * Create cc-agreement-urls.txt with one line per agreement:
 *   RM6348|https://www.crowncommercial.gov.uk/agreements/rm6348
 * or
 *   Adult Skills and Learning DPS|https://www.crowncommercial.gov.uk/agreements/rm6348
 * 
 * Run: node scripts/merge-agreement-urls.js
 */
const fs = require('fs');
const path = require('path');

const agreementsPath = path.join(__dirname, '../cc-agreements.json');
const urlsPath = path.join(__dirname, '../cc-agreement-urls.txt');

const agreements = JSON.parse(fs.readFileSync(agreementsPath, 'utf8'));
let urlsContent = '';
try {
  urlsContent = fs.readFileSync(urlsPath, 'utf8');
} catch (e) {
  console.error('Create cc-agreement-urls.txt with lines:');
  console.error('  RM6348|https://www.crowncommercial.gov.uk/agreements/...');
  console.error('or');
  console.error('  Agreement title|https://...');
  process.exit(1);
}

const urlByKey = new Map();
const urlRegex = /https?:\/\/[^\s\)\"\'\]]+/g;

urlsContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  // Preferred: key|url or key<tab>url
  const sep = trimmed.includes('|') ? trimmed.indexOf('|') : trimmed.indexOf('\t');
  if (sep >= 0) {
    const key = trimmed.slice(0, sep).trim();
    const url = trimmed.slice(sep + 1).trim().match(urlRegex)?.[0] || trimmed.slice(sep + 1).trim();
    if (url && /^https?:\/\//.test(url)) {
      urlByKey.set(key.toUpperCase(), url);
      urlByKey.set(key, url);
    }
  } else {
    // Fallback: line contains both RM number and URL
    const rm = trimmed.match(/RM[\d\.L]+/i)?.[0]?.toUpperCase();
    const url = trimmed.match(urlRegex)?.[0];
    if (rm && url) urlByKey.set(rm, url);
  }
});

let updated = 0;
agreements.forEach(a => {
  const id = (a.id || '').toUpperCase();
  const url = urlByKey.get(a.id) || urlByKey.get(id) || urlByKey.get(a.title) || urlByKey.get(a.name);
  if (url) {
    a.url = url;
    updated++;
  }
});

fs.writeFileSync(agreementsPath, JSON.stringify(agreements, null, 2), 'utf8');
console.log('Updated', updated, 'agreements with URLs.');
console.log('Total agreements:', agreements.length);
