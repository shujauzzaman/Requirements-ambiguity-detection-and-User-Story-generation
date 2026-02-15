
import { GoogleGenAI, Type } from "@google/genai";
import { AmbiguityResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Senior Business Analyst and Requirements Engineer.
Your goal is to help users transform vague requirements into high-quality, unambiguous User Stories.

PROCESS:
1. Analyze the provided requirement for ambiguity (vagueness, missing actors, unclear actions, missing outcomes, or contradictions).
2. If ambiguity exists:
   - Identify specific points of confusion.
   - Formulate clear, concise clarification questions.
3. If the requirement is clear (or becomes clear after user answers):
   - Generate a professional User Story in the format: "As a [role], I want [action], so that [benefit]".
   - Include 3-5 key Acceptance Criteria.

RESPONSE FORMAT:
You MUST respond in valid JSON matching this schema:
{
  "isAmbiguous": boolean,
  "clarifications": string[], (Empty if not ambiguous)
  "userStory": string, (Empty if ambiguous)
  "summary": string (Brief summary of your findings)
}
`;

export const analyzeRequirement = async (
  input: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<AmbiguityResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: input }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAmbiguous: { type: Type.BOOLEAN },
            clarifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            userStory: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["isAmbiguous", "clarifications", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AmbiguityResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze requirement. Please try again.");
  }
};
