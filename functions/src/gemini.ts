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

    return parseGeminiResponse(result);
}

/**
 * Extract glossary terms from a URL (PDF or HTML) using Gemini
 */
export async function extractTermsFromUrl(url: string): Promise<any[]> {
    const model = vertexAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        },
    });

    const promptText = `Du bist ein Experte für medizinische Fachterminologie.
Extrahiere alle Fachbegriffe aus dem folgenden Text/Dokument.
Antworte als JSON-Array mit Objekten: term, context, definitionDe, definitionEn, einfacheSprache, eselsleitern, source.`; // Shortened for brevity, Gemini is smart enough with the example.

    // 1. Fetch the content
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.arrayBuffer();

    let parts: any[] = [];

    if (contentType.includes('application/pdf')) {
        // For PDF, we need to upload it to GCS or pass base64? 
        // Vertex AI supports inline data for smaller files (up to 20MB) -> "inlineData"
        // But the previous implementation used `fileUri` (GCS). 
        // To avoid complexity of uploading to GCS here, let's try inline data.
        // Base64 encode the buffer
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
        // Assume text/html
        const textContent = new TextDecoder('utf-8').decode(buffer);
        // Basic cleanup/stripping of HTML might be good, but Gemini handles HTML well.
        // Let's just pass the text.
        parts = [
            { text: promptText },
            { text: `Content from ${url}:\n\n${textContent.substring(0, 30000)}` } // Limit length just in case
        ];
    }

    const result = await model.generateContent({
        contents: [{ role: "user", parts }]
    });

    return parseGeminiResponse(result);
}

function parseGeminiResponse(result: any): any[] {
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
