'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function generateTermProposal(term: string, context: string = '', existingContexts: string[] = []) {
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using a model that is likely to exist or fallback. 
  // WARNING: DO NOT DOWNGRADE TO GEMINI 2. GEMINI 3 IS REQUIRED.
  const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });

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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown code blocks if the model adds them
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error generating proposal:', error);
    throw new Error('Failed to generate proposal');
  }
}
