
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Image as ImageIcon, Volume2, Upload, Edit } from 'lucide-react';
import { generateImage, generateSpeech, chatWithMaya, editImage } from '../services/geminiService';
import { processIAInput } from '../utils/iaEngine';
import { executeIAAction } from '../utils/iaActions';
import { adaptTone } from '../utils/personalityEngine';
import { CalendarEvent, Task } from '../types';
import { useApp } from '../context/AppContext';

interface MayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data: any) => void;
  allTasks: Task[];
  allEvents: CalendarEvent[];
}

export const MayaModal: React.FC<MayaModalProps> = ({ isOpen, onClose, allTasks, allEvents }) => {
  const appContext = useApp();
  const { messages, addMessage, setIaStatus, iaStatus, pendingAction, setPendingAction, personality } = appContext;

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendAIMessage = (text: string, type: 'text' | 'image' | 'audio' = 'text', content?: string) => {
      const adaptedText = type === 'text' ? adaptTone(text, personality) : text;
      addMessage({ id: Date.now().toString(), sender: 'maya', text: adaptedText, type, content });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setSelectedImage(base64);
              addMessage({ id: Date.now().toString(), sender: 'user', text: 'Imagem carregada para edição', type: 'image', content: base64 });
          };
          reader.readAsDataURL(file);
      }
  };

  // Helper validation logic
  const canCreateEvent = (start: Date) => {
      if (isNaN(start.getTime())) return false;
      const now = new Date();
      // Allow 5 min tolerance for "now" events
      return start.getTime() >= (now.getTime() - 5 * 60000);
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    const userMsg = input;
    
    setInput('');
    if (userMsg.trim()) {
        addMessage({ id: Date.now().toString(), sender: 'user', text: userMsg, type: 'text' });
    }
    
    setIaStatus('thinking');

    try {
        const lower = userMsg.toLowerCase().trim();

        // 1. Pending Confirmation Actions (Negociação)
        if (pendingAction) {
            
            // Check for strict "Yes" - e.g. "Sim", "Confirmar"
            const isYes = ['sim', 'yes', 'confirmar', 'claro'].some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w));
            
            // Check for strict "No" - e.g. "Não", "Cancelar"
            const isNo = ['não', 'nao', 'no', 'cancelar'].some(w => lower === w || lower.startsWith(w + ' '));

            // Logica para confirmar evento passado
            if (pendingAction.question === 'CONFIRM_PAST_EVENT') {
                if (isYes) {
                    const data = pendingAction.data;
                    await appContext.addEvent({
                        title: data.title,
                        start: new Date(data.start),
                        end: data.end ? new Date(data.end) : new Date(new Date(data.start).getTime() + 3600000),
                        category: data.category || 'work',
                        location: data.location
                    });
                    sendAIMessage(`📅 Evento passado registrado: "${data.title}" em ${new Date(data.start).toLocaleString()}.`);
                    setPendingAction(null);
                    return;
                } else if (isNo) {
                    sendAIMessage("Entendido. Agendamento cancelado.");
                    setPendingAction(null);
                    return;
                }
                // Se não for nem Sim nem Não, deixa passar para a IA processar como novo comando
                setPendingAction(null);
            }
            else {
                // General Logic for other actions
                if (isYes) {
                    if (pendingAction.action.action === 'NEGOTIATE_DEADLINE') {
                        await appContext.addTask(pendingAction.action.payload.title, pendingAction.action.payload.dueDate);
                        sendAIMessage(`Combinado! Agendei "${pendingAction.action.payload.title}" para amanhã.`);
                    } else {
                        await executeIAAction(pendingAction.action, appContext, (text) => sendAIMessage(text));
                    }
                    setPendingAction(null);
                    return; 
                } 
                else if (isNo) {
                    sendAIMessage("Entendido. Ação cancelada.");
                    setPendingAction(null);
                    return;
                }
                // Fall through for negotiation text
                setPendingAction(null);
            }
        }

        // 2. Image Editing
        if (selectedImage) {
             const editPrompt = userMsg || "Descreva esta imagem";
             const editedImage = await editImage(selectedImage, editPrompt);
             if (editedImage) {
                 sendAIMessage(`Aqui está o resultado: "${editPrompt}"`, 'image', editedImage);
                 setSelectedImage(null); 
             } else {
                 sendAIMessage('Não consegui editar a imagem. Tente novamente.');
             }
             return;
        }

        // 3. Image Generation
        if (lower.startsWith('gerar imagem') || lower.startsWith('crie uma imagem')) {
            const prompt = userMsg.replace(/gerar imagem|crie uma imagem/i, '').trim();
            const imageUrl = await generateImage(prompt, "1K");
            if (imageUrl) {
                sendAIMessage(`Imagem gerada: "${prompt}"`, 'image', imageUrl);
            } else {
                sendAIMessage('Desculpe, não consegui gerar a imagem.');
            }
            return;
        } 

        // 4. TTS
        if (lower.startsWith('fale') || lower.startsWith('diga')) {
             const textToSpeak = userMsg.replace(/fale|diga/i, '').trim();
             const audioData = await generateSpeech(textToSpeak);
             if (audioData) {
                 const byteCharacters = atob(audioData);
                 const byteNumbers = new Array(byteCharacters.length);
                 for (let i = 0; i < byteCharacters.length; i++) {
                     byteNumbers[i] = byteCharacters.charCodeAt(i);
                 }
                 const byteArray = new Uint8Array(byteNumbers);
                 const blob = new Blob([byteArray], {type: 'audio/mp3'});
                 const url = URL.createObjectURL(blob);
                 sendAIMessage(`Falando: "${textToSpeak}"`, 'audio', url);
                 new Audio(url).play();
             } else {
                 sendAIMessage('Erro ao gerar áudio.');
             }
             return;
        }

        // 5. Intelligent Chat with Tool Calling (Gemini 3 Flash)
        const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
        const response = await chatWithMaya(userMsg, history);

        if (response.toolCall) {
            // Execute the tool requested by Gemini
            const { name, args } = response.toolCall;
            
            if (name === 'create_task') {
                let dueDate = undefined;
                // Robust date parsing
                if (args.dueDate) {
                    const parsed = new Date(args.dueDate);
                    if (!isNaN(parsed.getTime())) {
                        dueDate = parsed;
                    }
                }
                
                await appContext.addTask(args.title, dueDate);
                
                const dateStr = dueDate ? dueDate.toLocaleDateString() : 'hoje (sem prazo definido)';
                sendAIMessage(`✅ Tarefa criada: "${args.title}" para ${dateStr}.`);
            } 
            else if (name === 'create_event') {
                const start = new Date(args.start);
                
                // --- Validation: Ensure Date is Valid ---
                if (isNaN(start.getTime())) {
                     sendAIMessage("Entendi que você quer criar um evento, mas a data ficou confusa. Pode repetir o horário?");
                     return;
                }

                // --- Business Rule: Check for Past Events ---
                if (!canCreateEvent(start)) {
                    setPendingAction({
                        action: { action: 'ADD_EVENT', payload: args } as any,
                        question: 'CONFIRM_PAST_EVENT',
                        data: args
                    });
                    sendAIMessage(`⚠️ O horário solicitado (${start.toLocaleString()}) já passou. Deseja agendar mesmo assim?`);
                    return;
                }

                await appContext.addEvent({
                    title: args.title,
                    start: start,
                    end: args.end ? new Date(args.end) : new Date(start.getTime() + 3600000),
                    category: args.category || 'work',
                    location: args.location
                });
                sendAIMessage(`📅 Evento agendado: "${args.title}" em ${start.toLocaleString()}.`);
            }
            else if (name === 'create_routine') {
                // Parse Time (HH:mm) into a Date for today
                const [hours, minutes] = (args.time || "09:00").split(':').map(Number);
                const start = new Date();
                start.setHours(hours || 9, minutes || 0, 0, 0);
                
                const end = new Date(start);
                end.setMinutes(start.getMinutes() + 30); // Default 30 min duration for routine

                await appContext.addEvent({
                    title: args.title,
                    start: start,
                    end: end,
                    category: 'routine',
                    isAllDay: false
                });

                sendAIMessage(`🔄 Rotina "${args.title}" registrada para hoje às ${args.time}.`);
            }
            else {
                sendAIMessage(response.text);
            }
        } else {
            // Just a text reply
            sendAIMessage(response.text || "Não entendi, pode repetir?");
        }

    } catch (e) {
        console.error("Maya Error:", e);
        sendAIMessage('Desculpe, tive um problema ao processar seu pedido. Verifique sua conexão.');
    } finally {
        setIaStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20 h-[600px] animate-fade-in">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-bold dark:text-white">Maya AI</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online ({personality})</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={20} className="dark:text-white" /></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                        max-w-[85%] p-3 rounded-2xl text-sm
                        ${msg.sender === 'user' 
                            ? 'bg-custom-soil text-white rounded-br-none' 
                            : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}
                    `}>
                        {msg.type === 'text' && (
                            <div className="whitespace-pre-line">{msg.text}</div>
                        )}
                        {msg.type === 'image' && msg.content && (
                            <div className="space-y-2">
                                <p className="opacity-80 text-xs mb-1">{msg.text}</p>
                                <img src={msg.content} alt="Generated" className="rounded-lg w-full h-auto border border-white/10" />
                                {msg.sender === 'user' && selectedImage === msg.content && (
                                     <div className="bg-black/50 text-white text-xs p-1 rounded text-center mt-1">Imagem selecionada para edição</div>
                                )}
                                {msg.sender === 'maya' && (
                                     <button 
                                        onClick={() => { setSelectedImage(msg.content!); setInput("Edite: "); }}
                                        className="flex items-center gap-1 text-xs text-custom-caramel mt-2 hover:underline"
                                     >
                                        <Edit size={12} /> Editar esta imagem
                                     </button>
                                )}
                            </div>
                        )}
                        {msg.type === 'audio' && msg.content && (
                            <div className="flex items-center gap-2">
                                <Volume2 size={16} />
                                <audio controls src={msg.content} className="h-8 w-48" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {iaStatus === 'thinking' && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Selected Image Preview (Overlay above input) */}
        {selectedImage && (
             <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <img src={selectedImage} alt="Preview" className="w-10 h-10 rounded object-cover border border-white/20" />
                     <span className="text-xs text-gray-500">Editando imagem... (Digite o comando)</span>
                 </div>
                 <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={14} className="text-gray-400" /></button>
             </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
             <div className="relative flex items-center gap-2">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    title="Carregar imagem para edição"
                 >
                     <ImageIcon size={18} />
                 </button>
                 
                 <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={pendingAction ? "Responda Sim ou Não..." : (selectedImage ? "Digite como editar..." : "Mensagem ou comando...")}
                        className="w-full bg-gray-100 dark:bg-black/50 border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-custom-caramel/50 dark:text-white"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedImage) || iaStatus === 'thinking'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-custom-soil text-white rounded-full hover:bg-custom-caramel disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                 </div>
             </div>
             <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-400">
                 <span className="flex items-center gap-1"><Upload size={10} /> Editar Imagens</span>
                 <span className="flex items-center gap-1"><ImageIcon size={10} /> Gerar Imagens</span>
                 <span className="flex items-center gap-1"><Mic size={10} /> TTS & Comandos</span>
             </div>
        </div>

      </div>
    </div>
  );
};
