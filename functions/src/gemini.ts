import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI with project info
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "insel-glossar";
const LOCATION = "europe-west1";

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

/**
 * Extract glossary terms from a PDF document using Gemini 3 Flash
 */
export async function extractTermsFromPdf(pdfUrl: string): Promise<any[]> {
    const model = vertexAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        },
    });

    const prompt = `Du bist ein Experte für medizinische Fachterminologie am Inselspital Bern.
    
Extrahiere alle Fachbegriffe, Abkürzungen und relevanten Begriffe aus dem folgenden Dokument.

Für jeden Begriff erstelle einen JSON-Eintrag mit:
- "term": der Begriff/die Abkürzung
- "context": der Fachbereich (z.B. Kardiologie, Pflege, Administration)
- "definitionDe": deutsche Definition/Beschreibung  
- "definitionEn": englische Übersetzung/Definition (falls möglich)
- "einfacheSprache": Erklärung in einfacher Sprache, die auch Laien verstehen
- "eselsleitern": Array mit Merkhilfen/Eselsbrücken (falls passend, sonst leeres Array)
- "source": Quellenangabe aus dem Dokument

Antworte als JSON-Array. Extrahiere mindestens alle erkennbaren Fachbegriffe.

Beispiel für einen Eintrag:
{
  "term": "Anamnese",
  "context": "Allgemeinmedizin",
  "definitionDe": "Die Erhebung der Krankengeschichte eines Patienten im Gespräch.",
  "definitionEn": "Medical history - the process of gathering a patient's medical background through conversation.",
  "einfacheSprache": "Das Gespräch, in dem der Arzt fragt, was einem fehlt und welche Krankheiten man früher hatte.",
  "eselsleitern": ["ANA = Alles Nochmal Abfragen"],
  "source": ""
}`;

    const result = await model.generateContent({
        contents: [{
            role: "user",
            parts: [
                {
                    fileData: {
                        mimeType: "application/pdf",
                        fileUri: pdfUrl,
                    }
                },
                { text: prompt }
            ]
        }]
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    try {
        return JSON.parse(text);
    } catch {
        // Try to extract JSON from markdown code block
        const match = text.match(/```json?\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        return [];
    }
}

/**
 * Generate quiz questions from glossary terms using Gemini
 */
export async function generateQuizQuestions(terms: { term: string; definitionDe: string; context: string }[]): Promise<any[]> {
    const model = vertexAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
        },
    });

    const termList = terms.map(t => `${t.term}: ${t.definitionDe}`).join('\n');

    const prompt = `Erstelle Multiple-Choice-Quizfragen basierend auf diesen medizinischen Fachbegriffen:

${termList}

Für jede Frage erstelle:
- "term": der zugehörige Begriff
- "question": die Quizfrage (auf Deutsch)
- "correctAnswer": die richtige Antwort
- "wrongAnswers": Array mit 3 plausiblen aber falschen Antworten
- "category": der Fachbereich

Erstelle verschiedene Fragetypen:
1. "Was bedeutet [Begriff]?"
2. "Welcher Begriff beschreibt [Definition]?"
3. "In welchem Bereich wird [Begriff] verwendet?"

Antworte als JSON-Array.`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```json?\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        return [];
    }
}
