/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { CURRICULUM } from "../curriculum";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `
You are a supportive AI Personal Learning Assistant. Your goal is to help students learn the following curriculum:
${JSON.stringify(CURRICULUM, null, 2)}

Rules:
1. Only answer questions related to the curriculum content provided above.
2. If a user asks something outside the curriculum, politely redirect them to the topics covered in the curriculum.
3. Provide clear, accurate, and beginner-friendly explanations.
4. Use a supportive and encouraging tone.
5. Keep responses concise but informative.
`;

export async function askQuestion(question: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const model = "gemini-1.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: question }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function getNextStepSuggestions(completedTopics: string[], currentTopicId: string | null) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Based on the following curriculum and the user's progress, suggest the next 2-3 topics they should study.
    
    Curriculum: ${JSON.stringify(CURRICULUM.map(t => ({ id: t.id, title: t.title })), null, 2)}
    Completed Topics: ${JSON.stringify(completedTopics)}
    Current Topic: ${currentTopicId || 'None'}
    
    Return the suggestions as a JSON array of strings (topic IDs).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (e) {
    console.error("Failed to parse suggestions", e);
    return [];
  }
}

export async function summarizeChat(history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Please provide a concise, bulleted summary of the key learning points discussed in this conversation so far. 
    Focus on what the learner has asked and what concepts have been explained.
    Keep it supportive and encouraging.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
  });

  return response.text;
}
