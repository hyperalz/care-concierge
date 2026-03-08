/**
 * Clean Caerphilly scraped services list - remove non-services
 * Run: node scripts/clean-services.js
 */
const fs = require('fs');
const path = require('path');

// Read the raw data - paste scraped content or path to file
const rawPath = path.join(__dirname, '../caerphilly-services-raw.txt');
let raw = '';
try {
  raw = fs.readFileSync(rawPath, 'utf8');
} catch (e) {
  console.error('Create caerphilly-services-raw.txt with tab/space separated scraped data');
  process.exit(1);
}

// Split by whitespace (tabs, newlines) to get all tokens
const all = raw.split(/[\t\n\r]+/).map(s => s.trim()).filter(Boolean);

const seen = new Set();
const excludePatterns = [
  /^[a-z]$/i,                                    // single letter
  /^a to z of services$/i,
  /connect to us on social media/i,
  /for your experience this site is best viewed/i,
  /^disclaimer$/i,
  /^copyright$/i,
  /^privacy policy$/i,
  /^cookies$/i,
  /^sitemap$/i,
  /copyright © \d{4}/i,
  /document not found/i,
  /^[a-z]\s*$/,                                  // single letter with optional space
  /^unit\s+\d+[a-z]?\s/i,                        // Unit 4A, Suite 13, etc.
  /^suite\s+\d+/i,
  /^(choose\s+(bargoed|blackwood|caerphilly|risca|ystrad mynach))$/i,
  /^(press|press tir-y-berth|press treharris)$/i,
  /contents:\s*index/i,
  /^[a-z]$/,                                     // lone single letter in column
  /edition\s+\d+/,                               // Edition 19 July 2023
  /meeting minutes\s+\d+/i,
  /notice of (poll|election|casual vacancy|particulars)/i,
  /declaration of result of poll/i,
  /consultation report notification letter/i,
  /statement of (persons nominated|licensing policy)/i,
  /budget (impact assessments|consultation|templates)\s*\d/i,
  /draft statement of accounts/i,
  /reporting duties\s+\d{4}/i,
  /week\s+\d+\s+-\s+(primary|secondary) school meals/i,
  /timetable of meetings:\s+september\s+\d{4}/i,
  /^youtube$/i,
  /^instagram$/i,
  /^facebook$/i,
  /^twitter$/i,
  /^linkedin$/i,
];

// Care home / residential home / provider names (not service areas)
const providerNames = [
  'abacare', 'ashville care home', 'ashville residential home', 'bargoed care home',
  'beatrice webb residential home', 'beechlea', 'blue bird care', 'brodawel residential home',
  'caledan ltd', 'care one 2 one', 'castle view residential home', 'cera care',
  'church view care home', 'codi group ltd', 'cynefin care ltd', 'encompass care',
  'evergreen care', 'evergreen care wales ltd', 'glan-yr-afon nursing home',
  'glencourt', 'highfields nursing home', 'hill view care home',
  'i-care', 'lexon group', 'liberty care', 'luk ros residential home', 'lynton care',
  'medhurst care home', 'millbrook residential home', 'min y mynydd residential home',
  'mirus-wales', 'new directions care and support', 'oakdale manor', 'parklands care centre',
  'pc cymru care ltd', 'pro-care support services', 'q-care',
  'rachel kathryn residential home', 'ravenswood court', 'seren support services',
  'springfield residential home', 'trafalgar park nursing home', 'trafalgar park residential home',
  'try-celyn court', 'ty afon care', 'ty clyd residential home', 'ty darren',
  'ty derwen residential home', 'ty iscoed residential home', 'ty llwyd quarry frequently asked questions',
  'ty parc residential home', 'ty penrhos care home', 'uplands house',
  'valley view care home', 'village support services', 'victoria house',
  'wales england care', 'white rose care centre', 'woodland lodge residential home',
  'ynys hywel covid memoria', 'ynysddu nursing home', 'achieve together', 'bryn group',
];

// Specific school names (not service areas - keep "Schools and learning" type)
const schoolNames = [
  'idris davies school 3-18', 'blackwood comprehensive school', 'hendre junior school and hendre infants school',
  'lewis girls school and lewis school pengam', 'llancaeach junior and llanfabon infants school',
  'lloyds bank foundation for england and wales', 'newbridge school', 'rhydri primary school',
  'trinity fields special school and resource centre', 'ysgol gyfun cwm rhymni', 'ysgol gymraeg cwm gwyd',
  'ysgol y lawnt', 'cwm glas infants school', 'cwm hyfryd', 'cwmaber junior school and cwmaber infants school',
  'cwmfelinfach and ynysddu primary schools', 'cwmgelli lodge nursing home', 'fleeur de lis and pengam primary schools',
  'gilfach fargoed and park primary schools', 'bedwas junior and rhydri primary primary schools',
  'pontllanfraith centre for vulnerable learners',
];

// Place names only (location, not a service) - be conservative, many "X Library" are services
const placeOnly = [
  'aberbargoed', 'aberbargoed grasslands', 'abertridwr', 'bedwas', 'cefn fforest', 'cefn glas',
  'fleur de lys', 'gelligaer', 'gilfach & bargoed', 'lansbury park', 'nelson', 'penalltau',
  'penllwyn', 'penmaen', 'penyrheol', 'phillipstown', 'pontlottyn', 'rhymney',
  'risca and ty sign', 'trehir', 'ystrad mynach', 'graig y rhacca', 'llanbradach',
];

// Land/property references (not services)
const landRefs = [
  'land adjoining 2 coed main, porset park', 'land at birchgrove, tirphil',
  'senghenydd bowling green & pavillion', 'senghenydd land adjacent to upper brynhyfryd terrace',
  'senghenydd land to rear of alexandra terrace', 'st mary\'s street allotments bedwas',
  'riverside park', 'fields park recreation ground newbridge', 'bronrhiw park, old caerphilly police station',
  'longbridge fields risca', 'risca senior citizens hall (land only)', 'cwmcarn garage site at nantcarn road',
];

function shouldExclude(item) {
  const t = item.trim();
  if (t.length < 3) return true;
  if (seen.has(t.toLowerCase())) return true;
  for (const p of excludePatterns) {
    if (p.test(t)) return true;
  }
  const lower = t.toLowerCase();
  if (providerNames.some(p => lower === p || lower.startsWith(p + ' '))) return true;
  if (schoolNames.some(s => lower.includes(s))) return true;
  if (placeOnly.includes(lower)) return true;
  if (landRefs.some(l => lower.includes(l))) return true;
  // Care/residential home (pattern)
  if (/\b(residential home|nursing home|care home)\s*$/i.test(t) && t.length < 50) return true;
  // Address-like: starts with Unit/Suite and has comma or long
  if (/^(unit|suite)\s+\d+/.test(lower) && (t.includes(',') || t.length > 40)) return true;
  // Document/consultation with year
  if (/\b(consultation|report|notice|strategy|plan)\b.*\b(19|20)\d{2}/i.test(t) && t.length > 50) return true;
  // Specific traffic/road orders (e.g. "A472 ... Prohibition of Driving")
  if (/^[A-Z]\d+\s+.*(prohibition|restriction|order)\s*\d{4}/i.test(t)) return true;
  // Consultations (standalone)
  if (/\bconsultation\s*(stage|on|phase|\d)/i.test(t) || /consultation$/i.test(t)) return true;
  // Malformed concatenated (e.g. CabinetDangerous)
  if (/[a-z][A-Z][a-z]/.test(t) && t.length < 40) return true;
  // "[Place] Library" - keep "Libraries" as service, drop branch names
  if (/^[A-Za-z\s\-']+\s+Library\s*$/i.test(t) && !/^Libraries$/i.test(t)) return true;
  // Dataset (data asset, not a service)
  if (/\bdataset\s*$/i.test(t)) return true;
  // FAQ / policy doc titles
  if (/\b(FAQs?|privacy notice|strategy\s+\d{4}|plan\s+\d{4})\s*$/i.test(t) && t.length > 30) return true;
  // "About ..." meta pages
  if (/^About\s+(the|this|us|your)/i.test(t)) return true;
  return false;
}

const cleaned = [];
for (const item of all) {
  const t = item.trim();
  if (!t || t.length < 4) continue;
  if (shouldExclude(t)) continue;
  const key = t.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  cleaned.push(t);
}

cleaned.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const outPath = path.join(__dirname, '../caerphilly-services-cleaned.json');
fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log(`Wrote ${cleaned.length} services to ${outPath}`);

// Also output as simple list for review
const txtPath = path.join(__dirname, '../caerphilly-services-cleaned.txt');
fs.writeFileSync(txtPath, cleaned.join('\n'), 'utf8');
console.log(`Wrote ${txtPath}`);

// Curated service areas - high-level categories for procurement dropdown
// Picked/consolidated from cleaned list; alphabetical
const serviceAreas = [
  'Adult services',
  'Benefits and grants',
  'Births, marriages and deaths',
  'Blue badges',
  'Building control',
  'Business rates',
  'Care and support',
  'Cemeteries',
  'Children and families',
  'Commercial waste',
  'Community centres',
  'Community safety',
  'Complaints and feedback',
  'Council Tax',
  'Customer services',
  'Education',
  'Electoral services',
  'Employment support',
  'Environmental health',
  'Fostering and adoption',
  'Housing',
  'Libraries',
  'Licences and permits',
  'Planning and building control',
  'Regeneration',
  'Registration service',
  'Roads and pavements',
  'Schools and learning',
  'Social care',
  'Social services',
  'Sport and leisure',
  'Trading standards',
  'Transport and parking',
  'Waste and recycling',
  'Youth services',
  'Other',
];
const areasPath = path.join(__dirname, '../caerphilly-service-areas.json');
fs.writeFileSync(areasPath, JSON.stringify(serviceAreas, null, 2), 'utf8');
console.log(`Wrote ${serviceAreas.length} service areas to ${areasPath}`);
