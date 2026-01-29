
import { GoogleGenAI, Content, Part } from "@google/genai";
import {
  Task,
  CalendarEvent,
  IAHistoryItem,
  Team,
  UserRole,
  TimeSuggestion
} from "../types";
import { buildIAContext } from "../utils/iaContextBuilder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* =======================
   1. INICIALIZAÇÃO SEGURA
======================= */
const getAI = () => {
  // Always obtain API key exclusively from process.env.API_KEY as per guidelines
  const apiKey = process.env.API_KEY;

  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: apiKey });
};

/* =======================
   2. LIMPEZA DE HISTÓRICO (ANTI-CRASH)
======================= */
function sanitizeHistory(history: any[]): Content[] {
  return history
    .slice(-10) // Mantém apenas o contexto recente
    .map(msg => {
      const role = (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'model';
      let textContent = "";

      if (msg.parts && Array.isArray(msg.parts)) {
        textContent = msg.parts.map((p: any) => p.text || "").join(" ");
      } else {
        textContent = msg.text || msg.content || "";
      }

      const cleanText = textContent.trim();
      if (!cleanText) return null;

      return {
        role: role as "user" | "model",
        parts: [{ text: cleanText }]
      };
    })
    .filter((msg): msg is Content => msg !== null);
}

/* =======================
   3. CHAT INTELIGENTE (MAYA)
======================= */
export const chatWithMaya = async (
  message: string,
  history: any[],
  mode: "fast" | "thinking" = "fast",
  appContext?: {
    tasks: Task[];
    events: CalendarEvent[];
    history: IAHistoryItem[];
    currentTeam?: Team | null;
    userRole?: UserRole;
  },
  image?: string
): Promise<string> => {
  try {
    const ai = getAI();
    const isThinking = mode === 'thinking';
    const modelName = isThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const now = new Date();
    const dateInfo = format(now, "eeee, dd/MM HH:mm", { locale: ptBR });
    const context = appContext ? buildIAContext(appContext.tasks, appContext.events) : "{}";

    const systemInstruction = `
Você é Maya, assistente IA de produtividade de elite.
DATA ATUAL: ${dateInfo}
CONTEXTO DO USUÁRIO: ${context}

DIRETRIZES:
1. Responda estritamente em JSON: { "message": "Texto", "actions": [] }
2. Actions válidas: CREATE_TASK, CREATE_EVENT, CHANGE_SCREEN, RESCHEDULE_TASK, REORGANIZE_WEEK, NO_ACTION.
3. Se o usuário estiver sobrecarregado, seja empática e sugira adiar tarefas.
`;

    const chatHistory = sanitizeHistory(history);

    const config: any = {
      // systemInstruction should be a direct string in the config object
      systemInstruction: systemInstruction,
      responseMimeType: "application/json"
    };

    // Aplica Thinking Budget se for o modelo Pro
    if (isThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const chat = ai.chats.create({
      model: modelName,
      history: chatHistory,
      config: config
    });

    const parts: Part[] = [{ text: message }];
    
    if (image) {
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Data }
      });
    }

    // chat.sendMessage accepts a 'message' parameter, not 'contents'
    const result = await chat.sendMessage({ message: parts });
    // Use .text property directly
    return result.text || JSON.stringify({ message: "Não consegui processar agora.", actions: [] });

  } catch (err: any) {
    console.error("Maya Chat Error:", err);
    return JSON.stringify({
      message: "Minha rede neural teve um soluço. Pode repetir?",
      actions: []
    });
  }
};

// Stubs para compatibilidade
// Fixed: components/MayaModal.tsx on line 209: Expected 1 arguments, but got 2.
export const generateImage = async (p: string, size?: string) => null;
export const editImage = async (b: string, p: string) => null;
export const generateSpeech = async (t: string) => null;
export const analyzeVideo = async (b: string, m: string, p: string) => "Análise indisponível.";
// Fixed: components/EventModal.tsx on line 67: Expected 0 arguments, but got 5.
export const suggestOptimalTimes = async (...args: any[]) => [];
