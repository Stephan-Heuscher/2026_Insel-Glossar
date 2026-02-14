import { GoogleGenAI } from "@google/genai";

// Initialize Vertex AI with project info
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "insel-glossar";
const LOCATION = "us-central1";

const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

/**
 * Extract glossary terms from a PDF document using Gemini 3 Flash
 */
export async function extractTermsFromPdf(pdfUrl: string): Promise<GlossaryTerm[]> {
    const prompt = `Du bist ein Experte für Fachterminologie und Glossare.
    
Extrahiere alle Fachbegriffe, Abkürzungen und relevanten Begriffe aus dem folgenden Dokument. Das Glossar ist nicht auf medizinische Begriffe beschränkt, sondern kann Begriffe aus allen Bereichen enthalten die im Dokument vorkommen.

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
        model: "gemini-3-flash-preview",
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
    const promptText = `Du bist ein Experte für Fachterminologie.
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
        model: "gemini-3-flash-preview",
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

    const prompt = `Erstelle Multiple-Choice-Quizfragen basierend auf diesen Fachbegriffen:

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
        model: "gemini-3-flash-preview",
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

export interface TermProposal {
    definitionDe: string;
    definitionEn: string;
    einfacheSprache: string;
    eselsleitern: string[];
    context: string;
}

export async function generateTermProposal(term: string, context: string = '', existingContexts: string[] = []): Promise<TermProposal> {
    const contextList = existingContexts.join(', ');

    const prompt = `
    You are a medical and glossary expert.
    Generate a proposal for the term "${term}"${context ? ` in the context of "${context}"` : ''}.
    
    Existing contexts in the glossary are: ${contextList}.
    If the term fits well into one of these existing contexts, prefer using that one. Otherwise, suggest a new, appropriate context.

    Please provide:
    1. A German definition (definitionDe)
    2. An English definition (definitionEn)
    3. A simple language explanation (einfacheSprache) - VERY SIMPLE, for laypeople.
    4. 3 Mnemonics / Eselsleitern (eselsleitern) - creative and helpful memory aids.
    5. The best matching context (context).

    Return ONLY raw JSON (no markdown formatting) with the following structure:
    {
      "definitionDe": "...",
      "definitionEn": "...",
      "einfacheSprache": "...",
      "eselsleitern": ["...", "...", "..."],
      "context": "..."
    }
  `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.text || "{}";
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```json?\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        throw new Error("Failed to parse JSON response");
    }
}


