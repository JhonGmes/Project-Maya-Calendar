
import { GoogleGenAI, Content } from "@google/genai";
import { IAResponse } from "../types";

// --- ENVIRONMENT SHIM ---
try {
  if (typeof process === "undefined") {
    (window as any).process = { env: {} };
  }
  if (!process.env) {
    (window as any).process.env = {};
  }
  const viteEnv = (import.meta as any).env || {};
  
  if (!process.env.API_KEY) {
    process.env.API_KEY = viteEnv.VITE_GEMINI_API_KEY || viteEnv.VITE_API_KEY || viteEnv.VITE_GOOGLE_API_KEY || '';
  }
} catch (e) {
  console.warn("Erro ao configurar ambiente:", e);
}

const getAI = () => {
  let key = process.env.API_KEY;
  if ((!key || key.trim() === '') && typeof window !== 'undefined') {
      key = localStorage.getItem('maya_api_key') || '';
  }
  key = key ? key.trim() : '';

  if (!key) {
      console.error("CRITICAL: Gemini API Key is missing.");
      throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: key });
}

// Clean history to remove empty messages which cause Gemini 400 Errors
function cleanHistory(history: any[]): Content[] {
    const cleaned: Content[] = [];
    let lastRole = '';

    for (const msg of history) {
        if (!msg.parts || msg.parts.length === 0 || !msg.parts[0].text || msg.parts[0].text.trim() === '') {
            continue;
        }
        if (msg.role === lastRole) {
            continue; 
        }
        cleaned.push({
            role: msg.role,
            parts: [{ text: msg.parts[0].text }]
        });
        lastRole = msg.role;
    }
    return cleaned;
}

/**
 * Nova função de chat que espera uma resposta estruturada (JSON)
 * compatível com o IAActionEngine.
 */
export const chatWithMaya = async (message: string, history: any[], mode: 'fast' | 'thinking' = 'fast'): Promise<string> => {
  try {
    const ai = getAI();
    
    if (!ai) throw new Error("API_KEY_MISSING");

    const validHistory = cleanHistory(history);
    const now = new Date();
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = days[now.getDay()];

    const modelName = mode === 'thinking' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // O Prompt do Sistema agora define o protocolo de comunicação
    const systemPrompt = `
    You are Maya, an advanced AI system agent for productivity.
    Current Time: ${now.toISOString()} (${dayName}).
    
    PROTOCOL:
    1. You act as an intermediary between the user and the app state.
    2. You DO NOT execute actions yourself. You return JSON instructions.
    3. You MUST ALWAYS return a valid JSON object with this structure:
    {
      "message": "Friendly response to the user",
      "actions": [
         { "type": "ACTION_TYPE", "payload": { ... } }
      ]
    }

    AVAILABLE ACTIONS (Types):
    - CREATE_TASK: { title: string, priority?: 'high'|'medium'|'low', dueDate?: string (ISO) }
    - CREATE_EVENT: { title: string, start: string (ISO), end?: string (ISO), category?: string }
    - RESCHEDULE_TASK: { taskId: string, newDate: string (ISO) }
    - CHANGE_SCREEN: { payload: 'day'|'week'|'month'|'tasks' }
    - ASK_CONFIRMATION: { message: string, action: ActionObject } 
      (Use ASK_CONFIRMATION when the action is significant, like rescheduling many tasks or deleting).
    - NO_ACTION: {} (Use when just chatting).

    RULES:
    - If the user implies a relative date (e.g., "tomorrow at 2pm"), calculate the ISO string based on Current Time.
    - If the user message is just conversation, return "actions": [].
    - Be concise in the "message" field.
    - Response MUST be raw JSON, no markdown blocks.
    `;

    const config: any = {
         systemInstruction: systemPrompt,
         responseMimeType: "application/json" // Força output JSON
    };

    if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const chat = ai.chats.create({
      model: modelName, 
      history: validHistory,
      config: config
    });

    const result = await chat.sendMessage({ message });
    return result.text;

  } catch (error: any) {
    console.error("Chat Error Details:", error);
    // Retorna um JSON de erro válido para o Engine não quebrar
    return JSON.stringify({
        message: "Desculpe, tive um erro de conexão. Tente novamente.",
        actions: []
    });
  }
}

// Mantendo funções auxiliares de imagem/audio para compatibilidade
export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
    try {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) await (window as any).aistudio.openSelectKey();
        }
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { imageSize: size } },
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error: any) { return null; }
}

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } }, { text: prompt }] },
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) { return null; }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) { return null; }
}

export const suggestOptimalTimes = async (events: any[], title: string, referenceDate: Date, workingHours: any, duration: number) => {
    return []; // Placeholder simplificado
}
