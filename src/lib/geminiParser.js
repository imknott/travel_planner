// lib/geminiParser.js
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

const systemInstructions = `
You are an AI assistant that extracts user travel preferences into structured JSON.
Only return JSON. No explanation, no extra formatting.
Possible fields include:
- name (string)
- homeAirport (string, 3-letter IATA or city)
- interests (array of keywords)
- bucketList (array of countries or destinations)
- style (string: "luxury", "budget", "solo", "family", etc.)
`;

export async function parseAnswer(answer, key) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
${systemInstructions}

Field to extract: "${key}"

User input:
"${answer}"

Respond with JSON only.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Invalid Gemini JSON:', text);
    return { [key]: answer }; // fallback
  }
}
