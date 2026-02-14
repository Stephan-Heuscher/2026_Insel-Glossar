/**
 * Sync Firestore with glossary terms from glossary_data.txt
 * Updates existing terms by matching `term` field.
 * Adds new terms if they don't exist.
 * 
 * Run: node scripts/sync_firestore.mjs
 */
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize with Application Default Credentials (from gcloud auth)
if (!String(process.env.FIREBASE_CONFIG || '').length) {
    // If running locally without emulation, it might fail if no creds. 
    // Assuming user has gcloud auth application-default login
}

initializeApp({
    credential: applicationDefault(),
    projectId: 'insel-glossar',
});

const db = getFirestore();
const dataPath = join(__dirname, 'glossary_data.txt');
const raw = readFileSync(dataPath, 'utf-8');

const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

console.log(`📖 Found ${lines.length} terms to sync...\n`);

let updated = 0;
let added = 0;
let skipped = 0;
let errors = 0;

async function sync() {
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 6) {
            console.log(`⚠️  Skipping malformed line: ${parts[0] || '(empty)'}`);
            skipped++;
            continue;
        }

        const [term, context, definitionDe, definitionEn, einfacheSprache, eselsleiter, source, sourceUrl] = parts;

        const termTrimmed = term.trim();

        // Prepare data object
        const data = {
            term: termTrimmed,
            context: context?.trim() || '',
            definitionDe: definitionDe?.trim() || '',
            definitionEn: definitionEn?.trim() || '',
            einfacheSprache: einfacheSprache?.trim() || '',
            // If existing eselsleitern exist, merge? Or overwrite? 
            // For now, let's just use the strict value.
            eselsleitern: eselsleiter?.trim() ? [eselsleiter.trim()] : [],
            source: source?.trim() || '',
            sourceUrl: sourceUrl?.trim() || '',
            updatedAt: new Date(),
        };

        try {
            // Check if exists
            const snapshot = await db.collection('glossary')
                .where('term', '==', termTrimmed)
                .get();

            if (!snapshot.empty) {
                // Update existing
                const batch = db.batch();
                snapshot.forEach(doc => {
                    // Update only specific fields to avoid overwriting user edits?
                    // But we want to enforce the source URL fix.
                    // We'll update everything except createdAt/createdBy
                    batch.update(doc.ref, data);
                });
                await batch.commit();
                console.log(`🔄 Updated "${termTrimmed}" (${snapshot.size} docs)`);
                updated++;
            } else {
                // Add new
                await db.collection('glossary').add({
                    ...data,
                    createdAt: new Date(),
                    createdBy: 'sync-script',
                    status: 'approved' // Assuming these are pre-approved
                });
                console.log(`✅ Added "${termTrimmed}"`);
                added++;
            }
        } catch (err) {
            console.error(`❌ Error syncing "${termTrimmed}":`, err.message);
            errors++;
        }
    }

    console.log(`\n🎉 Done! Updated: ${updated}, Added: ${added}, Skipped: ${skipped}, Errors: ${errors}`);
    process.exit(0);
}

sync();
