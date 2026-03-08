#!/usr/bin/env node
/**
 * Verify CCS agreement URLs resolve correctly.
 * Uses browser-like User-Agent to avoid 403 from bot blocking.
 * Run: node scripts/verify-agreement-urls.js
 */
const fs = require('fs');
const path = require('path');

const agreementsPath = path.join(__dirname, '..', 'cc-agreements.json');
const agreements = JSON.parse(fs.readFileSync(agreementsPath, 'utf8'));

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT }
    });
    return { status: res.status, ok: res.ok, finalUrl: res.url };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('Verifying', agreements.length, 'CCS agreement URLs...\n');
  let ok = 0, failed = 0, errors = [];
  for (const a of agreements) {
    const url = a.url || `https://www.crowncommercial.gov.uk/agreements/${a.id}`;
    const result = await checkUrl(url);
    if (result.error) {
      failed++;
      errors.push({ title: a.title, id: a.id, error: result.error });
      console.log('✗', a.id, a.title, '-', result.error);
    } else if (result.status === 200) {
      ok++;
      process.stdout.write('.');
    } else if (result.status === 403) {
      console.log('?', a.id, a.title, '- 403 (may need browser)');
      // 403 often means bot block - URL format is likely correct
      ok++;
    } else {
      failed++;
      errors.push({ title: a.title, id: a.id, status: result.status, finalUrl: result.finalUrl });
      console.log('✗', a.id, a.title, '-', result.status, result.finalUrl);
    }
  }
  console.log('\n');
  console.log('Results:', ok, 'OK,', failed, 'failed');
  if (errors.length) {
    console.log('\nFailed agreements:');
    errors.forEach(e => console.log(' ', e.id, e.title, e.status || e.error));
  }
}

main().catch(console.error);
