const { GoogleGenAI } = require("@google/genai");

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "insel-glossar";
const LOCATION = "global";
const MODEL = "gemini-3-flash-preview";

console.log(`Testing ${MODEL} in ${LOCATION}...`);

async function testModel() {
    try {
        const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts: [{ text: "Hello from global" }] }]
        });

        console.log(`SUCCESS: ${MODEL} works in ${LOCATION}`);
        console.log(JSON.stringify(response).substring(0, 100));
    } catch (error) {
        console.log(`FAILED: ${LOCATION}`);
        console.log(`Error: ${error.message}`);
    }
}

testModel();
