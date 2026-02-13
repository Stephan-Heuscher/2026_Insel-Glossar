
/**
 * Deduplicate Firestore glossary terms.
 * Groups by Term + Context. Deletes all but the oldest entry.
 * 
 * Run: node scripts/deduplicate.mjs
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
    credential: applicationDefault(),
    projectId: 'insel-glossar',
});

const db = getFirestore();

async function deduplicate() {
    console.log('🔍 Fetching all glossary terms...');
    const snapshot = await db.collection('glossary').get();
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`📦 Found ${docs.length} total documents.`);

    const groups = {};

    for (const doc of docs) {
        // Create a unique key based on term and context (normalized)
        const key = `${doc.term?.trim().toLowerCase()}|${doc.context?.trim().toLowerCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
    }

    let deletedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let opCount = 0;

    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            // Sort by createdAt (older first) if available, otherwise just keep first
            // We usually want to keep the one that was created first (stable ID) or last (latest data).
            // Let's keep the one with the most content (longest keys?) or just the oldest.
            // Since our seed script adds them sequentially, oldest is fine.

            // Sort by creation time string comparison if available, else random stability
            // Actually, newer imports might have better data? 
            // The first 95 were imported, then 158 were imported (which included updated versions of first 95 maybe?).
            // Let's keep the *newest* one, assuming later imports might have fixes?
            // User script `fix_data.mjs` rewrote the file with corrected/augmented data.
            // So simpler: Keep the one created LAST.

            // But `createdAt` in `seed.mjs` is `new Date()`.
            group.sort((a, b) => {
                const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return tB - tA; // Descending (newest first)
            });

            const [toKeep, ...toDelete] = group;

            console.log(`Duplicate: "${toKeep.term}" (${toKeep.context}) - Keeping headers from latest, deleting ${toDelete.length} older copies.`);

            for (const docToDelete of toDelete) {
                batch.delete(db.collection('glossary').doc(docToDelete.id));
                opCount++;
                deletedCount++;

                if (opCount >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    opCount = 0;
                }
            }
        }
    }

    if (opCount > 0) {
        await batch.commit();
    }

    console.log(`\n🎉 Deduplication complete.`);
    console.log(`🗑️ Deleted ${deletedCount} duplicate documents.`);
    console.log(`✅ Remaining unique terms: ${Object.keys(groups).length}`);
    process.exit(0);
}

deduplicate().catch(console.error);
