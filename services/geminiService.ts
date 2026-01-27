
import { GoogleGenAI, Content } from "@google/genai";
import { IAResponse, Task, CalendarEvent, IAHistoryItem, Team, UserRole } from "../types";
import { buildIAContext } from "../utils/iaContextBuilder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
export const chatWithMaya = async (
    message: string, 
    history: any[], 
    mode: 'fast' | 'thinking' = 'fast',
    appContext?: { tasks: Task[], events: CalendarEvent[], history: IAHistoryItem[], currentTeam?: Team | null, userRole?: UserRole }
): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("API_KEY_MISSING");

  const validHistory = cleanHistory(history);
  const now = new Date();
  
  // FIX: Use Local Time formatting instead of UTC ISO
  const dayName = format(now, "EEEE", { locale: ptBR });
  const localTime = format(now, "HH:mm", { locale: ptBR });
  const fullDate = format(now, "dd/MM/yyyy", { locale: ptBR });

  // Construir o contexto dinâmico
  const dynamicContext = appContext 
      ? buildIAContext(appContext.tasks, appContext.events, appContext.history, appContext.currentTeam, appContext.userRole)
      : "No context provided.";

  // O Prompt do Sistema agora define o protocolo de comunicação E PERSONA DE GESTÃO
  const systemPrompt = `
  You are Maya, an advanced AI system agent for productivity and team management.
  Current Date: ${fullDate} (${dayName}).
  Current Local Time: ${localTime}.
  
  APP CONTEXT (READ-ONLY):
  ${dynamicContext}
  
  PROTOCOL:
  1. You act as an intermediary between the user and the app state.
  2. You DO NOT execute actions yourself. You return JSON instructions (Action Proposals).
  3. You MUST ALWAYS return a valid JSON object matching the Output Schema below.
  
  OUTPUT SCHEMA:
  {
    "message": "Your conversational response to the user (e.g. 'Entendido, sugiro agendar isso.')",
    "actions": [ ... list of action objects ... ]
  }

  PERSONA & BEHAVIOR:
  - If contextMode is 'PERSONAL_MODE': Focus on execution, focus, and clearing the user's daily schedule.
  - If contextMode is 'TEAM_MODE' and userRole is 'manager': Focus on team alignment, identifying bottlenecks, and preventing burnout. Do not micromanage individual task completion unless asked. Suggest 'REORGANIZE_WEEK' if the whole team is overloaded.
  - If contextMode is 'TEAM_MODE' and userRole is 'member': Focus on the user's assigned tasks within the team context.

  AVAILABLE ACTIONS (Types):
  - CREATE_TASK: { title: string, priority?: 'high'|'medium'|'low', dueDate?: string (ISO) }
  - CREATE_EVENT: { title: string, start: string (ISO), end?: string (ISO), category?: string }
  - RESCHEDULE_TASK: { taskId: string, newDate: string (ISO) }
  - REORGANIZE_WEEK: { changes: [{ taskId: string, taskTitle: string, from: string (ISO), to: string (ISO) }], reason: string }
  - CHANGE_SCREEN: { payload: 'day'|'week'|'month'|'tasks'|'analytics' }
  - ASK_CONFIRMATION: { message: string, action: ActionObject } 
  - NEGOTIATE_DEADLINE: { taskTitle: string, reason: string, options: [{ label: string, action: ActionObject }] }
  - COMPLETE_STEP: { taskId: string, stepId: string, workflowId: string }
  - PROPOSE_WORKFLOW: { title: string, steps: string[], description?: string }
  - NO_ACTION: {} 

  RULES:
  - If user says "My week is messy" or overload is detected, propose REORGANIZE_WEEK.
  - If user asks about performance, use CHANGE_SCREEN to 'analytics'.
  - If user asks to create a process, workflow, or "how to organize X", use PROPOSE_WORKFLOW with a logical list of steps.
  - If user asks to complete a workflow step, you MUST use ASK_CONFIRMATION wrapping COMPLETE_STEP.
  - Response MUST be ONLY the JSON object. Do not add markdown blocks like \`\`\`json.
  `;

  // Select Model based on mode
  const modelName = mode === 'thinking' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const config: any = {
       systemInstruction: systemPrompt
  };

  // Configure Thinking Mode
  if (mode === 'thinking') {
      config.thinkingConfig = { thinkingBudget: 32768 };
      // IMPORTANT: When using thinkingConfig, we CANNOT force responseMimeType to 'application/json' 
      // in some contexts because the thought trace is text. The prompt handles the JSON structure.
      // Also, maxOutputTokens must NOT be set.
  } else {
      // Standard Mode
      config.responseMimeType = "application/json";
      config.maxOutputTokens = 8192;
  }

  try {
    const chat = ai.chats.create({
      model: modelName, 
      history: validHistory,
      config: config
    });

    const result = await chat.sendMessage({ message });
    return result.text;

  } catch (error: any) {
    console.error("Chat Error Details:", error);
    
    // Fallback strategy for Thinking Mode errors (often beta instability or timeouts)
    if (mode === 'thinking') {
        console.log("⚠️ Thinking mode failed. Falling back to Flash model.");
        try {
            const fallbackChat = ai.chats.create({
                model: 'gemini-3-flash-preview',
                history: validHistory,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    maxOutputTokens: 8192
                }
            });
            const fallbackResult = await fallbackChat.sendMessage({ message });
            return fallbackResult.text;
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
        }
    }

    return JSON.stringify({
        message: "Desculpe, tive um erro de conexão com a IA. Tente novamente.",
        actions: []
    });
  }
}

// Video Understanding
export const analyzeVideo = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Video } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "Não consegui analisar o vídeo.";
    } catch (error: any) {
        console.error("Video Analysis Error:", error);
        return "Erro ao processar o vídeo. Verifique se o arquivo não é muito grande (recomendado < 20MB para upload direto).";
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
