import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { extractTermsFromPdf, extractTermsFromUrl, generateQuizQuestions } from "./gemini";

initializeApp();

const db = getFirestore();

// Helper function to check authentication
function requireAuth(request: { auth?: { uid: string } }) {
    if (!request.auth) {
        logger.warn("Unauthenticated request rejected");
        throw new HttpsError('unauthenticated', 'Du musst angemeldet sein, um diese Funktion zu nutzen.');
    }
    return request.auth.uid;
}

/**
 * Extract terms from an uploaded PDF using Gemini 3 Flash.
 * The PDF is uploaded to Cloud Storage first, then its download URL is passed here.
 */
export const extractTermsFromPdfFn = onCall(
    { cors: true, invoker: 'public', timeoutSeconds: 540, region: 'europe-west1' },
    async (request) => {
        const userId = requireAuth(request);
        logger.info("PDF extraction requested", { userId });

        const { pdfUrl } = request.data;
        if (!pdfUrl) {
            throw new HttpsError('invalid-argument', 'PDF URL ist erforderlich.');
        }

        try {
            logger.info("Extracting terms from PDF...", { pdfUrl: pdfUrl.substring(0, 100) });
            const terms = await extractTermsFromPdf(pdfUrl);
            logger.info("Extraction complete", { termCount: terms.length });
            return { terms };
        } catch (error) {
            logger.error("Error extracting terms", error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new HttpsError('internal', `Fehler bei der Extraktion: ${msg}`);
        }
    }
);

/**
 * Extract terms from a URL (PDF or HTML) using Gemini 3 Flash.
 */
export const extractTermsFromUrlFn = onCall(
    { cors: true, invoker: 'public', timeoutSeconds: 540, region: 'europe-west1' },
    async (request) => {
        const userId = requireAuth(request);
        logger.info("URL extraction requested", { userId });

        const { url } = request.data;
        if (!url) {
            throw new HttpsError('invalid-argument', 'URL ist erforderlich.');
        }

        try {
            logger.info("Extracting terms from URL...", { url });
            const terms = await extractTermsFromUrl(url); // Use the new function from gemini.ts
            logger.info("Extraction complete", { termCount: terms.length });
            return { terms };
        } catch (error) {
            logger.error("Error extracting terms from URL", error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new HttpsError('internal', `Fehler bei der Extraktion: ${msg}`);
        }
    }
);


/**
 * Generate quiz questions from existing glossary terms using Gemini.
 * Also saves the generated questions to Firestore for reuse.
 */
export const generateQuizQuestionsFn = onCall(
    { cors: true, invoker: 'public', timeoutSeconds: 300, region: 'europe-west1' },
    async (request) => {
        const userId = requireAuth(request);
        logger.info("Quiz generation requested", { userId });

        const { termCount = 10 } = request.data;

        try {
            // Fetch random terms from Firestore
            const termsSnap = await db.collection('glossary')
                .where('status', '==', 'approved')
                .limit(termCount * 2) // Get more than needed for variety
                .get();

            const terms = termsSnap.docs.map(d => ({
                term: d.data().term,
                definitionDe: d.data().definitionDe,
                context: d.data().context || 'Allgemein',
            }));

            if (terms.length < 4) {
                throw new HttpsError('failed-precondition', 'Zu wenige Begriffe im Glossar. Mindestens 4 benötigt.');
            }

            // Generate questions with Gemini
            const questions = await generateQuizQuestions(terms);

            // Save questions to Firestore for reuse (user's feedback: don't always need LLM)
            const batch = db.batch();
            for (const q of questions) {
                const ref = db.collection('quizQuestions').doc();
                batch.set(ref, {
                    ...q,
                    generatedBy: 'llm',
                    createdAt: new Date(),
                });
            }
            await batch.commit();

            logger.info("Quiz generation complete", { questionCount: questions.length });
            return { questions };
        } catch (error) {
            logger.error("Error generating quiz", error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new HttpsError('internal', `Fehler bei der Quiz-Generierung: ${msg}`);
        }
    }
);


/**
 * Generate a proposal for a single term using Gemini.
 */
import { generateTermProposal } from "./gemini";

export const generateTermProposalFn = onCall(
    { cors: true, invoker: 'public', timeoutSeconds: 60, region: 'europe-west1' },
    async (request) => {
        const userId = requireAuth(request);
        logger.info("Term proposal requested", { userId });

        const { term, context, existingContexts } = request.data;
        if (!term) {
            throw new HttpsError('invalid-argument', 'Term ist erforderlich.');
        }

        try {
            const proposal = await generateTermProposal(term, context, existingContexts);
            logger.info("Proposal generated", { term });
            return proposal;
        } catch (error) {
            logger.error("Error generating proposal", error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new HttpsError('internal', `Fehler bei der Generierung: ${msg}`);
        }
    }
);
