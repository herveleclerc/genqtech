import { GoogleGenAI } from "@google/genai";
import { GEMINI_PROMPT } from '../constants';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Extracts pure CSV content from a raw string, cleaning up introductory text
 * or markdown code blocks from the AI model's response.
 * @param rawText The raw text response from the Gemini API.
 * @returns The cleaned, CSV-only string.
 */
function extractCsvContent(rawText: string): string {
  // 1. Try to extract from a markdown code block (e.g., ```csv ... ``` or ``` ... ```)
  const csvRegex = /```(?:csv)?\s*([\s\S]*?)\s*```/;
  const match = rawText.match(csvRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. If no code block, find the start of the CSV header as a fallback.
  // The prompt specifies the first header is 'La question', which will be quoted.
  const csvHeader = '"La question"';
  const startIndex = rawText.indexOf(csvHeader);
  if (startIndex !== -1) {
    return rawText.substring(startIndex).trim();
  }
  
  // 3. As a last resort, if the specific header isn't found,
  // return the whole text and hope it's just the CSV.
  console.warn("Could not find CSV start marker. Returning the full response text, which may contain non-CSV data.");
  return rawText;
}


export async function generateQuestionsFromPDF(base64Pdf: string): Promise<string> {
  try {
    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Pdf,
      },
    };

    const textPart = {
      text: GEMINI_PROMPT,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, pdfPart] },
    });

    // Clean the response to only get the CSV data
    return extractCsvContent(response.text);
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Erreur de l'API Gemini : ${error.message}`);
    }
    throw new Error("Une erreur inconnue est survenue lors de la communication avec l'API Gemini.");
  }
}