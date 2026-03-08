/**
 * Cloud Procurement Workshop - Digital Marketplace fetch API
 * Fetches G-Cloud service pages and extracts data for pre-population
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1kb' }));
app.use('/govuk', express.static(path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk')));
app.use('/assets', express.static(path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk/assets')));
app.use(express.static(path.join(__dirname)));

const ALLOWED_HOSTS = [
  'applytosupply.digitalmarketplace.service.gov.uk',
  'www.applytosupply.digitalmarketplace.service.gov.uk',
  'digitalmarketplace.service.gov.uk',
  'www.digitalmarketplace.service.gov.uk'
];

function isAllowedUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return ALLOWED_HOSTS.includes(u.hostname) &&
      /\/g-cloud\/services\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * G-Cloud lots: 1=Cloud Hosting (IaaS/PaaS), 2=Cloud Software (SaaS), 3=Cloud Support
 * Returns { type, source: 'lot'|'inferred' } — source indicates confidence
 */
function mapLotToServiceType(lot) {
  const lower = (lot || '').toLowerCase();
  // Lot 2: Cloud Software = SaaS (definitive from lot)
  if (lower.includes('software') || lower.includes('saas') || /lot\s*2|cloud\s*software/.test(lower)) {
    return { type: 'saas', source: 'lot' };
  }
  // Lot 3: Cloud Support (not IaaS/PaaS/SaaS)
  if (lower.includes('support') || /lot\s*3|cloud\s*support/.test(lower)) {
    return { type: 'support', source: 'lot' };
  }
  // Lot 1: Cloud Hosting — contains both IaaS and PaaS, need to infer
  if (lower.includes('hosting') || lower.includes('infrastructure') || lower.includes('iaas') || /lot\s*1|cloud\s*hosting/.test(lower)) {
    return { type: '', source: 'lot' }; // caller will infer IaaS vs PaaS
  }
  return { type: '', source: '' };
}

function inferIaaSvsPaaS(text) {
  const t = (text || '').toLowerCase();
  const iaasScore = (
    /\b(virtual\s*machine|vm\s*instance|compute\s*instance|ec2|bare\s*metal|object\s*storage|block\s*storage|s3|blob\s*storage|virtual\s*server|vps|dedicated\s*server|cdn\s*network|load\s*balancer|vpc|networking|infrastructure)\b/.test(t) ? 2 : 0
  ) + (/\b(iaas|infrastructure\s*as\s*a\s*service)\b/.test(t) ? 2 : 0);
  const paasScore = (
    /\b(platform\s*as\s*a\s*service|paas|serverless|lambda|functions\s*as\s*a\s*service|faas|deploy|runtime|build\s*pipeline|application\s*hosting|app\s*platform|managed\s*database|container\s*service|kubernetes|elastic\s*beanstalk|heroku|app\s*engine)\b/.test(t) ? 2 : 0
  ) + (/\b(platform|developer\s*platform|no.?server|event.?driven)\b/.test(t) ? 1 : 0);
  if (paasScore > iaasScore) return 'paas';
  if (iaasScore > paasScore) return 'iaas';
  return ''; // unclear, default to iaas for Lot 1 (broader category)
}

function inferFramework(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('g-cloud') || lower.includes('digital marketplace')) return 'gcloud';
  return '';
}

function ruleBasedScoreHints(fullText) {
  const t = (fullText || '').toLowerCase();
  const hints = {};
  if (/\b(net zero|carbon|climate|sustainability|iso14001|environmental)\b/.test(t))
    hints.netZero = '3';
  if (/\b(gdpr|ncsc|iso.?27001|cyber essentials|security clearance)\b/.test(t))
    hints.compliance = '3';
  if (/\b(citizen|resident|public|customer.?centric)\b/.test(t))
    hints.citizenCentric = '3';
  if (/\b(collaboration|shared|integration|api|interoperability)\b/.test(t))
    hints.collaboration = '3';
  if (/\b(efficiency|automation|dashboards|reporting)\b/.test(t))
    hints.efficiency = '3';
  if (/\b(resilience|availability|redundancy|backup|recovery)\b/.test(t))
    hints.resilience = '3';
  if (/\b(innovation|modern|flexible|customis)\b/.test(t))
    hints.innovation = '3';
  if (/\b(data.?portability|data.?extract|exit|lock.?in)\b/.test(t))
    hints.delivery = '3';
  if (/\b(social value|local|sme|disability|inclusive)\b/.test(t))
    hints.social = '3';
  if (/\b(fair work|equal opportunit|ethical|transparency|workplace adjustment)\b/.test(t))
    hints.fairWork = '3';
  return hints;
}

app.post('/api/fetch-dm', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL required' });
  }
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'Only Digital Marketplace G-Cloud service URLs are allowed' });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Fetch failed: ${resp.status}` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    const productName = $('h1.govuk-heading-l').first().text().trim();
    const supplier = $('.govuk-caption-l').first().text().trim();
    const fullText = $.text();
    const lotLink = $('a.govuk-breadcrumbs__link[href*="lot="]').first();
    const lotText = lotLink.text().trim();
    const lotParam = lotLink.attr('href')?.match(/lot=([^&]+)/)?.[1] || '';
    const lotInfo = mapLotToServiceType(lotText || lotParam);

    let serviceType = lotInfo.type;
    let serviceTypeSource = lotInfo.source;
    // Lot 1 (hosting): infer IaaS vs PaaS from page content
    if (!serviceType && lotInfo.source === 'lot') {
      serviceType = inferIaaSvsPaaS(fullText) || 'iaas'; // default Lot 1 to iaas if unclear
      serviceTypeSource = 'inferred';
    }

    let framework = '';
    $('h2.govuk-heading-s').each((_, el) => {
      if ($(el).text().trim() === 'Framework') {
        framework = $(el).next('p').text().trim();
        return false;
      }
    });
    if (!framework) framework = inferFramework($.text());

    const mainCol = $('h1.govuk-heading-l').closest('.govuk-grid-column-two-thirds');
    const descEl = mainCol.find('p.govuk-body').first();
    const description = descEl.length ? descEl.text().trim() : '';

    let pricing = '';
    $('p').each((_, el) => {
      const txt = $(el).text();
      if (/£|pound/.test(txt) && txt.length < 100) {
        pricing = txt.trim();
        return false;
      }
    });

    const scoreHints = ruleBasedScoreHints(fullText);

    res.json({
      productName: productName || $('title').text().replace(/\s*-\s*Digital Marketplace$/i, '').trim(),
      supplier: supplier || '',
      lotName: lotText || (lotParam ? `Lot ${lotParam}` : ''),
      serviceType: serviceType || (framework.toLowerCase().includes('g-cloud') ? 'saas' : ''),
      serviceTypeSource: serviceType ? (serviceTypeSource || 'lot') : '',
      framework: framework.toLowerCase().includes('g-cloud') ? 'gcloud' : (framework ? 'other' : ''),
      pricing: pricing || '',
      description: description || fullText.slice(0, 500),
      scoreHints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to fetch and parse' });
  }
});

app.listen(PORT, () => {
  console.log(`Cloud Procurement Workshop API on http://localhost:${PORT}`);
});
