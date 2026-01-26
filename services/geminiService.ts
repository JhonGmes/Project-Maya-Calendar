
import { GoogleGenAI, Type, Schema, Modality, FunctionDeclaration, Tool, Content } from "@google/genai";
import { CalendarEvent, Task, TimeSuggestion } from "../types";

// --- ENVIRONMENT SHIM ---
try {
  if (typeof process === "undefined") {
    (window as any).process = { env: {} };
  }
  if (!process.env) {
    (window as any).process.env = {};
  }
  const viteEnv = (import.meta as any).env || {};
  
  // Prioritize VITE_ prefixed keys for production/vercel support
  if (!process.env.API_KEY) {
    process.env.API_KEY = viteEnv.VITE_GEMINI_API_KEY || viteEnv.VITE_API_KEY || viteEnv.VITE_GOOGLE_API_KEY || '';
  }
} catch (e) {
  console.warn("Erro ao configurar ambiente:", e);
}
// ------------------------

const getAI = () => {
  if (!process.env.API_KEY) {
      console.error("CRITICAL: Gemini API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// --- TOOL DEFINITIONS ---
const taskTool: FunctionDeclaration = {
    name: 'create_task',
    description: 'Create a new task or to-do item in the user\'s list.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Title of the task" },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string for the deadline (e.g. 2023-12-25T15:00:00). Calculate based on user prompt relative to now." },
            priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
        },
        required: ['title']
    }
};

const eventTool: FunctionDeclaration = {
    name: 'create_event',
    description: 'Schedule a new event, meeting, or appointment in the calendar.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Title of the event" },
            start: { type: Type.STRING, description: "ISO 8601 start date time (YYYY-MM-DDTHH:mm:ss)" },
            end: { type: Type.STRING, description: "ISO 8601 end date time. Usually 1 hour after start if not specified." },
            category: { type: Type.STRING, enum: ['work', 'personal', 'meeting', 'routine', 'health'] },
            location: { type: Type.STRING }
        },
        required: ['title', 'start', 'end']
    }
};

const routineTool: FunctionDeclaration = {
    name: 'create_routine',
    description: 'Add a recurring routine habit.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            time: { type: Type.STRING, description: "Time of day (HH:mm)" }
        },
        required: ['title']
    }
};

const appTools: Tool[] = [
    { functionDeclarations: [taskTool, eventTool, routineTool] }
];

// --- EXISTING HELPERS ---

const commandSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ['create_event', 'create_task', 'create_routine', 'unknown'] },
    eventData: { type: Type.OBJECT, nullable: true, properties: { title: { type: Type.STRING }, startTime: { type: Type.STRING }, endTime: { type: Type.STRING }, isAllDay: { type: Type.BOOLEAN }, category: { type: Type.STRING } } },
    taskData: { type: Type.OBJECT, nullable: true, properties: { title: { type: Type.STRING }, dueDate: { type: Type.STRING }, priority: { type: Type.STRING } } }
  },
  required: ['action']
};

export const parseSmartCommand = async (input: string, referenceDate: Date = new Date()) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: input,
      config: {
        systemInstruction: `Data Ref: ${referenceDate.toLocaleString("pt-BR")}. Retorne JSON.`,
        responseMimeType: "application/json",
        responseSchema: commandSchema,
      },
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) { 
      console.error("Erro no comando inteligente:", error);
      return null; 
  }
};

export const suggestOptimalTimes = async (
  events: CalendarEvent[],
  title: string,
  referenceDate: Date,
  workingHours: { start: string; end: string } = { start: '09:00', end: '18:00' },
  durationMinutes: number = 60
): Promise<TimeSuggestion[]> => {
  try {
    const ai = getAI();
    const relevantEvents = events.filter(e => {
       const diff = Math.abs(new Date(e.start).getTime() - referenceDate.getTime());
       return diff < 172800000; 
    }).map(e => ({ start: e.start, end: e.end, title: e.title }));

    const prompt = `
      Suggest 3 optimal time slots for a ${durationMinutes}-minute event titled "${title}".
      Reference Date: ${referenceDate.toLocaleString("pt-BR")}.
      Working Hours: ${workingHours.start} to ${workingHours.end}.
      Existing Events: ${JSON.stringify(relevantEvents)}.
      Rules: Avoid overlaps. Prioritize working hours. Suggest times near reference date.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING },
              end: { type: Type.STRING },
              reason: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (error) { return []; }
};

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
    } catch (error: any) {
        console.error("Image Gen Error", error);
        return null;
    }
}

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
                    { text: prompt },
                ],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) {
        console.error("Image Edit Error", error);
        return null;
    }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) { return null; }
}

// --- UPDATED CHAT FUNCTION ---

export interface ChatResponse {
    text: string;
    toolCall?: {
        name: string;
        args: any;
    };
}

// Clean history to remove empty messages which cause Gemini 400 Errors
function cleanHistory(history: any[]): Content[] {
    const cleaned: Content[] = [];
    let lastRole = '';

    for (const msg of history) {
        // Skip empty messages
        if (!msg.parts || msg.parts.length === 0 || !msg.parts[0].text || msg.parts[0].text.trim() === '') {
            continue;
        }

        // Ensure alternating roles (User -> Model -> User)
        if (msg.role === lastRole) {
            continue; // Skip duplicate role to prevent 400 error
        }

        cleaned.push({
            role: msg.role,
            parts: [{ text: msg.parts[0].text }]
        });
        lastRole = msg.role;
    }
    return cleaned;
}

export const chatWithMaya = async (message: string, history: any[], mode: 'fast' | 'thinking' = 'fast'): Promise<ChatResponse> => {
  try {
    const ai = getAI();
    
    // Validate API Key presence
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Check .env file.");
    }

    const validHistory = cleanHistory(history);
    const now = new Date();
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = days[now.getDay()];

    // Select model based on mode
    const modelName = mode === 'thinking' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // Define config
    const config: any = {
         systemInstruction: `You are Maya, an efficient AI assistant. 
         Current Time: ${now.toLocaleString("pt-BR")}.
         Today is: ${dayName}.
         Use tools to create events/tasks.
         Important: If the user asks for an event in the past, DO NOT call the tool immediately. Ask for confirmation first.
         When calling tools, always use full ISO 8601 dates (e.g., 2024-02-26T15:00:00).`,
         tools: appTools,
    };

    // Apply Thinking Config if in Thinking Mode
    if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for deep reasoning
        // NOTE: maxOutputTokens must NOT be set when using thinkingConfig
    }

    const chat = ai.chats.create({
      model: modelName, 
      history: validHistory,
      config: config
    });

    const result = await chat.sendMessage({ message });
    
    // Check for function calls
    const functionCalls = result.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        return {
            text: "Processando solicitação...",
            toolCall: {
                name: call.name,
                args: call.args
            }
        };
    }

    // Standard text response
    let text = result.text;
    
    // Check grounding
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web?.uri)
            .filter((uri: string) => uri)
            .join('\n');
        if (sources) text += `\n\nSources:\n${sources}`;
    }
    
    return { text };

  } catch (error: any) {
    console.error("Chat Error Details:", error);
    if (error.message.includes("API Key")) {
        return { text: "Erro: Chave de API não configurada no ambiente." };
    }
    return { text: "Desculpe, tive um problema de conexão. Tente novamente." };
  }
}
