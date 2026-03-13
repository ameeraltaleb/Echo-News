import { GoogleGenAI } from '@google/genai';
import { verifyAuthHeader } from '../_lib/auth.js';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

const SYSTEM_PROMPT = `
You are an expert dual-language (Arabic and English) journalistic AI assistant for a professional news website.
Your task is to take a user's prompt (which might be a short idea, a headline, or a few sentences) and generate a fully structured, professional, and highly engaging news article. 

You MUST return the output EXACTLY as a raw JSON object with the following structure. Pay close attention to the HTML formatting requirements for the content fields.

{
  "title_en": "A catchy, professional English headline",
  "title_ar": "عنوان صحفي عربي جذاب واحترافي",
  "summary_en": "A 2-3 sentence engaging summary in English",
  "summary_ar": "ملخص مشوق من 2-3 جمل باللغة العربية",
  "content_en": "The full detailed article in English. MUST BE FORMATTED IN HTML (using <p>, <h2>, <h3>, <strong>, <ul>, <li> tags where appropriate). No markdown.",
  "content_ar": "المقال التفصيلي الكامل باللغة العربية. يجب أن يكون منسقاً باستخدام وسوم HTML (مثل <p>, <h2>, <ul>). بدون ماركداون.",
  "tags": ["arabic", "english", "keywords", "relevant", "to", "topic"]
}

Rules:
1. DO NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the raw JSON string.
2. The HTML in content_en and content_ar should be clean and not include <html>, <head>, or <body> tags. Just the interior content suitable for a rich text editor.
3. Keep the tone objective and journalistic.
4. Language boundary is STRICT: The '_en' fields MUST be written entirely in English. The '_ar' fields MUST be written entirely in Arabic. Even if the user's prompt is in Arabic, translate the ideas and write the '_en' fields in English!
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication
    const payload = await verifyAuthHeader(req.headers.authorization);
    if (!payload || payload.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Validate Input
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A valid written prompt is required.' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server.' });
    }

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7, // Good balance of creativity and structure
        responseMimeType: 'application/json',
      }
    });

    const outputText = response.text || '';
    
    // 4. Clean and parse the output
    // Gemini sometimes wraps JSON in markdown blocks despite instructions
    let jsonStr = outputText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const generatedArticle = JSON.parse(jsonStr);

    // 5. Return to frontend
    res.status(200).json(generatedArticle);
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to generate article using AI.', details: err.message });
  }
}
