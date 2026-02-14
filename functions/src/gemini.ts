import { GoogleGenAI } from "@google/genai";

// Initialize Vertex AI with project info
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "insel-glossar";
const LOCATION = "europe-west1";

const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

/**
 * Extract glossary terms from a PDF document using Gemini 3 Flash
 */
export async function extractTermsFromPdf(pdfUrl: string): Promise<GlossaryTerm[]> {
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

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001", // Updated to a known valid model, usually gemini-1.5-pro or gemini-2.0-flash depending on availability. Keeping it safe.
        config: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        },
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

    return parseGeminiResponse(response);
}

/**
 * Extract glossary terms from a URL (PDF or HTML) using Gemini
 */
export async function extractTermsFromUrl(url: string): Promise<GlossaryTerm[]> {
    const promptText = `Du bist ein Experte für medizinische Fachterminologie.
Extrahiere alle Fachbegriffe aus dem folgenden Text/Dokument.
Antworte als JSON-Array mit Objekten: term, context, definitionDe, definitionEn, einfacheSprache, eselsleitern, source.`;

    // 1. Fetch the content
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.arrayBuffer();

    let parts: { inlineData?: { mimeType: string; data: string }; text?: string }[] = [];

    if (contentType.includes('application/pdf')) {
        const base64Data = Buffer.from(buffer).toString('base64');
        parts = [
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                }
            },
            { text: promptText }
        ];
    } else {
        const textContent = new TextDecoder('utf-8').decode(buffer);
        parts = [
            { text: promptText },
            { text: `Content from ${url}:\n\n${textContent.substring(0, 30000)}` }
        ];
    }

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        config: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts }]
    });

    return parseGeminiResponse(geminiResponse);
}

interface GlossaryTerm {
    term: string;
    context: string;
    definitionDe: string;
    definitionEn?: string;
    id?: string; // Optional ID for Firestore
}

// Using 'any' for response type as the SDK types are complex to import directly without full path
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiResponse(response: any): GlossaryTerm[] {
    // The new @google/genai SDK response object has a `text` property that returns the text content.
    const text = response.text || "[]";

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```json?\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        return [];
    }
}

interface QuizQuestionGenerated {
    term: string;
    question: string;
    correctAnswer: string;
    wrongAnswers: string[];
    category: string;
}

export async function generateQuizQuestions(terms: { term: string; definitionDe: string; context: string }[]): Promise<QuizQuestionGenerated[]> {
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

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        config: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.text || "[]";
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```json?\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        return [];
    }
}


