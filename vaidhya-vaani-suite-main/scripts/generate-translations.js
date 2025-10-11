// Convert script to ESM-compatible implementation (package.json uses "type": "module")
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const outPath = path.join(ROOT, 'src', 'contexts', 'translations.generated.ts');
const mtMappingPath = path.join(ROOT, 'api', 'mt', 'mt_mapping.py');
// Add alternative candidate locations in case the UI lives under a subfolder
const mtMappingCandidates = [
  mtMappingPath,
  path.join(ROOT, 'vaidhya-vaani-suite-main', 'api', 'mt', 'mt_mapping.py'),
  path.join(ROOT, '..', 'api', 'mt', 'mt_mapping.py'),
  path.join(__dirname, '..', 'api', 'mt', 'mt_mapping.py'),
];

const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL || 'http://localhost:5000';
const TRANSLATION_API_KEY = process.env.TRANSLATION_API_KEY;

// Ensure fetch exists (Node 18+ has global fetch; polyfill if not)
if (!globalThis.fetch) {
  // top-level await is allowed in ESM; dynamically import node-fetch
  const nodeFetchModule = await import('node-fetch');
  // node-fetch v3 exports default
  globalThis.fetch = nodeFetchModule.default;
}

// Embedded English base (extracted from your original translations)
const en = {
  // Navbar
  'nav.dashboard': 'Dashboard',
  'nav.samvaad': 'Samvaad',
  'nav.lipiGyan': 'Lipi-Gyan',
  'nav.saaransh': 'Saaransh',
  'nav.siksha': 'Siksha',
  'nav.appName': 'Vaidya-Vaani',

  // Index page
  'index.hero.title': 'Welcome to Vaidya-Vaani',
  'index.hero.subtitle': 'Breaking language barriers in healthcare with AI-powered communication and document intelligence',
  'index.samvaad.title': 'Samvaad',
  'index.samvaad.description': 'Real-time communication tools for clinical consultations, reception triage, and pharmacy interactions',
  'index.lipiGyan.title': 'Lipi-Gyan',
  'index.lipiGyan.description': 'Document intelligence for prescriptions, lab reports, and discharge summaries',
  'index.saaransh.title': 'Saaransh',
  'index.saaransh.description': 'AI-powered insights including clinical notes, action plans, and health summaries',
  'index.siksha.title': 'Siksha',
  'index.siksha.description': 'Patient education with proactive learning assistance and medicine encyclopedia',
  'index.stats.tools': 'Specialized Tools',
  'index.stats.languages': 'Indian Languages',
  'index.stats.modules': 'Core Modules',
  'index.stats.accessible': 'Accessible',

  // Samvaad module
  'samvaad.title': 'Samvaad Module',
  'samvaad.subtitle': 'Real-time communication tools breaking language barriers in clinical settings',
  'samvaad.consultation.title': 'Clinical Consultation Room',
  'samvaad.consultation.description': 'Live doctor-patient conversations with split-screen transcripts and key point marking',
  'samvaad.consultation.badge': 'Real-time',
  'samvaad.triage.title': 'Smart Reception & Triage',
  'samvaad.triage.description': 'Guided conversational intake for patient registration and symptom screening',
  'samvaad.triage.badge': 'Automated',
  'samvaad.pharmacy.title': 'Pharmacy Connect',
  'samvaad.pharmacy.description': 'Clear communication between patients and pharmacists with prescription access',
  'samvaad.pharmacy.badge': 'Interactive',

  // Lipi-Gyan module
  'lipiGyan.title': 'Lipi-Gyan Module',
  'lipiGyan.subtitle': 'Document intelligence making medical documents accessible and understandable',
  'lipiGyan.prescription.title': 'Prescription Decoder',
  'lipiGyan.prescription.description': 'Structured tables showing medicine names, dosages, frequency, and duration with reminders',
  'lipiGyan.prescription.badge': 'OCR',
  'lipiGyan.labReport.title': 'Lab Report Analyzer',
  'lipiGyan.labReport.description': 'Color-coded analysis of test results with green/amber/red indicators and explanations',
  'lipiGyan.labReport.badge': 'AI-Powered',
  'lipiGyan.discharge.title': 'Discharge Summary Navigator',
  'lipiGyan.discharge.description': 'Tabbed interface for easy navigation of diagnosis, treatment, medications, and follow-ups',
  'lipiGyan.discharge.badge': 'Smart Parse',

  // Saaransh module
  'saaransh.title': 'Saaransh Module',
  'saaransh.subtitle': 'AI-powered insights generating actionable summaries for doctors and patients',
  'saaransh.clinicalNotes.title': 'Clinical Note Generator',
  'saaransh.clinicalNotes.description': 'Automatic SOAP notes from consultation transcripts for doctors',
  'saaransh.clinicalNotes.badge': 'SOAP',
  "saaransh.actionPlan.title": "Patient's Action Plan",
  "saaransh.actionPlan.description": "Simple, bulleted action items extracted from consultation in patient's language",
  'saaransh.actionPlan.badge': 'Simplified',
  'saaransh.healthSummary.title': 'Longitudinal Health Summary',
  'saaransh.healthSummary.description': "Chronological overview of patient's medical history from multiple documents",
  'saaransh.healthSummary.badge': 'Timeline',

  // Siksha module
  'siksha.title': 'Siksha Module',
  'siksha.subtitle': 'Personalized health education and medicine information in your language',
  'siksha.proactive.title': 'Proactive Learning Assistant',
  'siksha.proactive.description': 'Context-aware educational content delivered based on your diagnosis and prescriptions',
  'siksha.proactive.badge': 'Smart',
  'siksha.encyclopedia.title': 'Interactive Medicine Encyclopedia',
  'siksha.encyclopedia.description': 'Detailed medicine information with videos in your local language',
  'siksha.encyclopedia.badge': 'Video',

  // Common
  'common.explore': 'Explore',
  'common.backToDashboard': 'Back to Dashboard',
};

const keys = Object.keys(en);
const values = keys.map(k => en[k]);

// Map short codes to language names used in mt_mapping.py
const languageInfo = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  mr: 'Marathi',
  te: 'Telugu',
  ta: 'Tamil',
  gu: 'Gujarati',
  ur: 'Urdu',
  kn: 'Kannada',
  od: 'Odia',
  ml: 'Malayalam',
};

async function translateSingle(text, destName) {
  const url = `${TRANSLATION_API_URL.replace(/\/$/, '')}/mt`;
  const body = { text, source: 'English', dest: destName };
  const headers = { 'Content-Type': 'application/json' };
  if (TRANSLATION_API_KEY) {
    headers['Authorization'] = `Bearer ${TRANSLATION_API_KEY}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translation API error: ${res.status} ${txt}`);
  }
  // tolerate several possible response shapes
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    if (!json) return '';
    if (typeof json === 'string') return json;
    if (json.text) return json.text;
    if (json.translatedText) return json.translatedText;
    if (json.translation) return json.translation;
    for (const k of Object.keys(json)) {
      if (typeof json[k] === 'string') return json[k];
    }
    return '';
  } else {
    // maybe plain text
    return await res.text();
  }
}

async function translateTexts(destName, texts) {
  const promises = texts.map(t =>
    translateSingle(t, destName).catch(err => {
      console.error('translateSingle failed for text:', t, err && err.message ? err.message : err);
      return t; // fallback original text
    })
  );
  return Promise.all(promises);
}

function parseMtMapping() {
  for (const candidate of mtMappingCandidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, 'utf-8');
      console.log(`Using mt_mapping.py at: ${candidate}`);
      const map = {};
      // simple regex to capture lines like "English,Hindi": "https://..."
      const re = /"English,([^"]+)":\s*"([^"]+)"/g;
      let m;
      while ((m = re.exec(raw))) {
        const destName = m[1].trim();
        const url = m[2].trim();
        map[destName] = url;
      }
      return map;
    } catch (err) {
      // try next candidate
    }
  }
  console.warn('Could not find or read mt_mapping.py in candidate locations — continuing without availability checks.');
  return {};
}

(async () => {
  try {
    const mtMap = parseMtMapping();

    // languages to generate (short codes)
    const codes = Object.keys(languageInfo); // en, hi, bn, mr, te, ta, gu, ur, kn, od, ml

    const result = {};

    for (const code of codes) {
      if (code === 'en') {
        result[code] = en;
        continue;
      }
      const destName = languageInfo[code];
      if (!destName) {
        console.warn(`No language name for code ${code}, skipping`);
        result[code] = en;
        continue;
      }
      // warn if not present in mt_mapping.py
      if (mtMap && !mtMap[destName]) {
        console.warn(`Warning: mt_mapping.py does not contain "English,${destName}" — generator will still call /mt with dest="${destName}" but the backend may not have a model.`);
      }

      console.log(`Translating to ${destName} (${code}) — ${keys.length} strings...`);
      try {
        const translated = await translateTexts(destName, values);
        const mapped = {};
        for (let i = 0; i < keys.length; i++) {
          mapped[keys[i]] = translated[i] || values[i];
        }
        result[code] = mapped;
      } catch (err) {
        console.error(`Failed to translate to ${destName}:`, err && err.message ? err.message : err);
        result[code] = en;
      }
    }

    // Write the generated TypeScript file
    const fileContent =
`// Auto-generated by scripts/generate-translations.js
/* eslint-disable */
// Do not edit by hand — this file is generated at dev start.
export const translations = ${JSON.stringify(result, null, 2)} as any;
`;
    fs.writeFileSync(outPath, fileContent, 'utf-8');
    console.log('Wrote translations to', outPath);
  } catch (err) {
    console.error('Translation generation failed:', err);
    process.exitCode = 1;
  }
})();
