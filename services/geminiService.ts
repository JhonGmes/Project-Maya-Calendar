import { GoogleGenAI, Content } from "@google/genai";
import {
  Task,
  CalendarEvent,
  IAHistoryItem,
  Team,
  UserRole
} from "../types";
import { buildIAContext } from "../utils/iaContextBuilder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* =======================
   ENVIRONMENT SAFE SETUP
======================= */
try {
  if (typeof process === "undefined") {
    (window as any).process = { env: {} };
  }
  if (!process.env) {
    (window as any).process.env = {};
  }

  const viteEnv = (import.meta as any).env || {};
  process.env.API_KEY =
    viteEnv.VITE_GEMINI_API_KEY ||
    viteEnv.VITE_API_KEY ||
    viteEnv.VITE_GOOGLE_API_KEY ||
    process.env.API_KEY ||
    "";
} catch {
  console.warn("Erro ao configurar ambiente");
}

const getAI = () => {
  let key = process.env.API_KEY;
  if (!key && typeof window !== "undefined") {
    key = localStorage.getItem("maya_api_key") || "";
  }

  if (!key) {
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey: key.trim() });
};

/* =======================
   HISTORY SANITIZER
======================= */
function cleanHistory(history: any[]): Content[] {
  return history
    .filter(
      msg =>
        msg?.parts?.[0]?.text &&
        msg.parts[0].text.trim().length > 0
    )
    .map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }]
    }));
}

/* =======================
   MAIN CHAT FUNCTION
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
  }
): Promise<string> => {
  const ai = getAI();

  const now = new Date();
  const dateInfo = `
Data: ${format(now, "dd/MM/yyyy", { locale: ptBR })}
Dia: ${format(now, "EEEE", { locale: ptBR })}
Hora: ${format(now, "HH:mm")}
`;

  const context = appContext
    ? buildIAContext(
        appContext.tasks,
        appContext.events,
        appContext.history,
        appContext.currentTeam,
        appContext.userRole
      )
    : "Sem contexto.";

  const systemPrompt = `
Você é Maya, uma IA de produtividade.

${dateInfo}

CONTEXTO:
${context}

REGRAS IMPORTANTES:
- NUNCA execute ações automaticamente
- Apenas SUGIRA ações estruturadas
- Se detectar um fluxo ou checklist, gere um WORKFLOW
- Sempre responda APENAS em JSON válido

FORMATO DE RESPOSTA:
{
  "message": "texto para o usuário",
  "actions": []
}

AÇÕES PERMITIDAS:
- CREATE_TASK
- CREATE_EVENT
- CREATE_WORKFLOW
- CHANGE_SCREEN
- NO_ACTION

CREATE_WORKFLOW payload:
{
  "title": string,
  "steps": string[]
}
`;

  try {
    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      history: cleanHistory(history),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const result = await chat.sendMessage(message);
    return result.text || "";
  } catch (err) {
    console.error("Gemini Error:", err);
    return JSON.stringify({
      message:
        "Desculpe, não consegui processar isso agora. (Erro de conexão com IA)",
      actions: []
    });
  }
};

/* =======================
   IMAGE + SPEECH EXPORTS
   (mantidos p/ não quebrar imports)
======================= */

export const generateImage = async () => null;
export const editImage = async () => null;
export const generateSpeech = async () => null;
export const analyzeVideo = async () => "";
export const suggestOptimalTimes = async () => [];
