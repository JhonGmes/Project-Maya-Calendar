import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { CalendarEvent, Task } from "../types";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    // API key must be obtained exclusively from process.env.API_KEY
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
}

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
        systemInstruction: `Data Ref: ${referenceDate.toISOString()}. Retorne JSON.`,
        responseMimeType: "application/json",
        responseSchema: commandSchema,
      },
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) { return null; }
};

export const optimizeSchedule = async (tasks: Task[], existingEvents: CalendarEvent[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Otimize: Tarefas ${JSON.stringify(tasks)}, Eventos ${JSON.stringify(existingEvents)}`,
      config: { thinkingConfig: { thinkingBudget: 32768 }, responseMimeType: "application/json" }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (error) { return []; }
};

export const generatePresentation = async (topic: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere apresentação JSON sobre: ${topic}. Inclua: topic, slides [{title, bullets[], speakerNotes, imagePrompt}]`,
      config: { responseMimeType: "application/json" }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) { return null; }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("TTS Error", error);
        return null;
    }
}

export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
    try {
        const ai = getAI();
        // Uses 3-pro for high quality image generation and size support
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { imageSize: size }
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error", error);
        return null;
    }
}

export const chatWithMaya = async (message: string, history: any[] = []) => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
         systemInstruction: "You are Maya, a helpful and efficient AI assistant for managing schedules and tasks.",
         tools: [{ googleSearch: {} }] 
      }
    });
    const result = await chat.sendMessage({ message });
    
    let text = result.text;
    
    // Extract grounding sources if available
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web?.uri)
            .filter((uri: string) => uri)
            .join('\n');
            
        if (sources) {
            text += `\n\nSources:\n${sources}`;
        }
    }
    
    return text;
  } catch (error) {
    console.error("Chat Error", error);
    return "Desculpe, estou tendo dificuldades para me conectar agora.";
  }
}