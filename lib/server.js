import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini implementation of the ExtractionProvider contract (see types.js).
 * Uses gemini-1.5-flash: free-tier eligible and fast enough for
 * synchronous extraction on upload.
 *
 * @type {import("./types.js").ExtractionProvider}
 */
export const geminiProvider = {
  key: "gemini",

  async extract({ imageBase64, mimeType, description }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY in .env.local");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const descriptionBlock = description
      ? `The user describes this file as: "${description}". Use this to correctly label and disambiguate entities (e.g. distinguish a staff list from a client list).`
      : `The user did not provide a description for this file. Infer the most sensible labels from context.`;

    const prompt = `You are an information extraction engine for a workspace app. Look at the attached image and extract every discrete, useful fact you can find (people, dates, times, amounts, line items, appointments, contact info, table rows — anything a person might later want to search for or ask a question about).

${descriptionBlock}

Return ONLY valid JSON matching this exact shape, no markdown fences, no commentary:

{
  "facts": [
    {
      "data": { "<field_name>": "<value>", ... },
      "content": "<one sentence, natural language summary of this fact, self-contained enough to answer a question without seeing the image>"
    }
  ]
}

Rules:
- One fact per row/entry/record you find. If the image is a single unstructured note, one fact for the whole note is fine.
- "data" fields should be normalized (dates as YYYY-MM-DD, times as HH:MM 24h) where confidently inferable.
- "content" must stand alone — it will be shown to an AI that cannot see the image.
- If the image contains nothing extractable, return { "facts": [] }.`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.facts)) {
      throw new Error("Gemini response missing a 'facts' array");
    }

    return { facts: parsed.facts };
  },
};
