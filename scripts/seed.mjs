/**
 * Seed Firestore with glossary terms from glossary_data.txt
 * Uses Firebase Admin SDK with Application Default Credentials (gcloud auth).
 * 
 * Run: node scripts/seed.mjs
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize with Application Default Credentials (from gcloud auth)
initializeApp({
    credential: applicationDefault(),
    projectId: 'insel-glossar',
});

const db = getFirestore();
const dataPath = join(__dirname, 'glossary_data.txt');
const raw = readFileSync(dataPath, 'utf-8');

const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

console.log(`📖 Found ${lines.length} terms to seed...\n`);

let added = 0;
let skipped = 0;

for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 6) {
        console.log(`⚠️  Skipping malformed line: ${parts[0] || '(empty)'}`);
        skipped++;
        continue;
    }

    const [term, context, definitionDe, definitionEn, einfacheSprache, eselsleiter, source] = parts;

    const doc = {
        term: term.trim(),
        context: context?.trim() || '',
        definitionDe: definitionDe?.trim() || '',
        definitionEn: definitionEn?.trim() || '',
        einfacheSprache: einfacheSprache?.trim() || '',
        eselsleitern: eselsleiter?.trim() ? [eselsleiter.trim()] : [],
        source: source?.trim() || '',
        createdAt: new Date(),
        createdBy: 'seed-script',
    };

    try {
        const ref = await db.collection('glossary').add(doc);
        console.log(`✅ ${doc.term} (${doc.context}) → ${ref.id}`);
        added++;
    } catch (err) {
        console.error(`❌ Error adding "${doc.term}":`, err.message);
        skipped++;
    }
}

console.log(`\n🎉 Done! Added: ${added}, Skipped: ${skipped}`);
process.exit(0);
