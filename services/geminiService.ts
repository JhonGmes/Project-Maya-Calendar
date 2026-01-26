
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { CalendarEvent, Task, TimeSuggestion } from "../types";

// Helper to get AI instance - always creates new to ensure fresh API key usage
const getAI = () => {
  // API key must be obtained exclusively from process.env.API_KEY
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const suggestOptimalTimes = async (
  events: CalendarEvent[],
  title: string,
  referenceDate: Date,
  workingHours: { start: string; end: string } = { start: '09:00', end: '18:00' },
  durationMinutes: number = 60
): Promise<TimeSuggestion[]> => {
  try {
    const ai = getAI();
    
    // Filter events to only send relevant context (e.g., surrounding days) to save tokens/latency
    const relevantEvents = events.filter(e => {
       const diff = Math.abs(new Date(e.start).getTime() - referenceDate.getTime());
       return diff < 172800000; // within 2 days
    }).map(e => ({ start: e.start, end: e.end, title: e.title }));

    const prompt = `
      Suggest 3 optimal time slots for a ${durationMinutes}-minute event titled "${title}".
      Reference Date: ${referenceDate.toISOString()}.
      Working Hours: ${workingHours.start} to ${workingHours.end}.
      Existing Events: ${JSON.stringify(relevantEvents)}.
      
      Rules:
      1. Avoid overlaps.
      2. Prioritize working hours.
      3. Suggest times near the reference date.
      4. Provide a brief reason (e.g., "Free block in morning").
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
              start: { type: Type.STRING, description: "ISO Date string" },
              end: { type: Type.STRING, description: "ISO Date string" },
              reason: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error("Scheduling Error", error);
    return [];
  }
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
        // Enforce API key selection for gemini-3-pro-image-preview as per guidelines
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        }

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

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    try {
        const ai = getAI();
        // Uses gemini-2.5-flash-image for editing tasks as requested (Nano banana)
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
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Edit Error", error);
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
         systemInstruction: "You are Maya, a helpful and efficient AI assistant for managing schedules and tasks. If the user asks to edit an image, instruct them to upload it first.",
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
