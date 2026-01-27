
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Image as ImageIcon, Volume2, Upload, Edit, Brain, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { generateImage, generateSpeech, chatWithMaya, editImage } from '../services/geminiService';
import { parseIAResponse } from '../utils/iaActionEngine';
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

export const MayaModal: React.FC<MayaModalProps> = ({ isOpen, onClose }) => {
  const appContext = useApp();
  const { messages, addMessage, setIaStatus, iaStatus, pendingAction, setPendingAction, personality, agentSuggestion, setAgentSuggestion, executeIAAction } = appContext;

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pendingAction]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

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

  // --- NEW: Execute Pending Action ---
  const confirmAction = async () => {
      if (!pendingAction) return;
      
      setIaStatus('executing');
      try {
           // Executa a ação original armazenada no estado
           await executeIAAction(pendingAction.originalAction);
           sendAIMessage("Feito!");
      } catch (e) {
          sendAIMessage("Ocorreu um erro ao executar a ação.");
      }
      setPendingAction(null);
      setIaStatus('idle');
  };

  const cancelAction = () => {
      setPendingAction(null);
      sendAIMessage("Ação cancelada.");
  };

  // --- NEW: Accept Agent Suggestion ---
  const acceptSuggestion = async () => {
      if (!agentSuggestion) return;
      
      // Agent Suggestions are basically pre-packaged IA Actions
      // If the suggestion type implies a confirmation, we trigger the confirmation flow
      if (agentSuggestion.type === 'warning' || agentSuggestion.type === 'pattern') {
          // Wrap in ASK_CONFIRMATION logic logic visually
          // But technically executeIAAction handles ASK_CONFIRMATION types.
          // Since agentSuggestion.actionData is already an IAAction, we pass it.
          // If the suggestion action IS an ASK_CONFIRMATION, executeIAAction will handle it.
          // If it is a direct action (like CREATE_TASK), we just execute.
          
          await executeIAAction(agentSuggestion.actionData);
          setAgentSuggestion(null);
      } 
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    const userMsg = input;
    
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height immediately
    }

    if (userMsg.trim()) {
        addMessage({ id: Date.now().toString(), sender: 'user', text: userMsg, type: 'text' });
    }
    
    setIaStatus('thinking');

    try {
        const lower = userMsg.toLowerCase().trim();

        // 1. Image Editing
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

        // 2. Image Generation
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

        // 3. TTS
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

        // 4. MAIN CHAT FLOW (Chat -> Engine -> Context)
        const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
        
        // 4.1 Get Raw Response from LLM
        const rawResponse = await chatWithMaya(userMsg, history, isThinkingMode ? 'thinking' : 'fast');

        // 4.2 Parse response through the Engine
        const parsedResponse = parseIAResponse(rawResponse);

        // 4.3 Display the text message
        sendAIMessage(parsedResponse.message);

        // 4.4 Execute actions
        for (const action of parsedResponse.actions) {
            await executeIAAction(action);
        }

    } catch (e) {
        console.error("Maya Error:", e);
        sendAIMessage('Desculpe, tive um problema ao processar seu pedido. Verifique sua conexão.');
    } finally {
        setIaStatus('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
            
            {/* Agent Proactive Suggestion Banner */}
            {agentSuggestion && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/20 p-4 rounded-2xl border border-purple-200 dark:border-white/10 mb-4 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-white/10 rounded-full text-purple-600 dark:text-purple-300">
                             {agentSuggestion.type === 'warning' ? <AlertTriangle size={18} /> : <Brain size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">{agentSuggestion.message}</p>
                            <button 
                                onClick={acceptSuggestion}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-bold transition-colors shadow-sm"
                            >
                                {agentSuggestion.actionLabel} <ArrowRight size={12} />
                            </button>
                        </div>
                        <button onClick={() => setAgentSuggestion(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                </div>
            )}

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

            {/* Pending Action Confirmation UI */}
            {pendingAction && (
                <div className="flex justify-start animate-slide-up">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-bl-none shadow-lg border-l-4 border-custom-caramel">
                        <p className="font-bold text-gray-800 dark:text-white mb-3 text-sm">{pendingAction.question}</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={confirmAction}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <Check size={14} /> Confirmar
                            </button>
                            <button 
                                onClick={cancelAction}
                                className="flex-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <X size={14} /> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {iaStatus === 'thinking' && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex gap-2 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                            {isThinkingMode && <span className="text-xs text-purple-500 font-bold ml-1 animate-pulse">Pensando...</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Selected Image Preview */}
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
                    <textarea 
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={pendingAction ? "Responda Sim ou Não..." : (selectedImage ? "Digite como editar..." : "Mensagem ou comando...")}
                        rows={1}
                        className={`w-full bg-gray-100 dark:bg-black/50 border-none rounded-2xl py-3 pl-4 pr-12 focus:ring-2 dark:text-white transition-all resize-none overflow-hidden min-h-[48px] ${isThinkingMode ? 'focus:ring-purple-500/50 bg-purple-50/10' : 'focus:ring-custom-caramel/50'}`}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedImage) || iaStatus === 'thinking'}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-full transition-colors disabled:opacity-50 ${isThinkingMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-custom-soil hover:bg-custom-caramel'}`}
                    >
                        <Send size={16} />
                    </button>
                 </div>
             </div>
             
             {/* Toolbar */}
             <div className="flex justify-between items-center mt-3">
                 <div className="flex gap-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Upload size={10} /> Editar</span>
                    <span className="flex items-center gap-1"><ImageIcon size={10} /> Gerar</span>
                    <span className="flex items-center gap-1">Shift+Enter para pular linha</span>
                 </div>
                 
                 {/* Thinking Mode Toggle */}
                 <button 
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        isThinkingMode 
                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:bg-gray-200'
                    }`}
                    title="Ativar modelo Gemini 3 Pro para raciocínio complexo"
                 >
                    <Brain size={12} className={isThinkingMode ? 'animate-pulse' : ''} />
                    {isThinkingMode ? 'Modo Pensador Ativado' : 'Modo Rápido'}
                 </button>
             </div>
        </div>

      </div>
    </div>
  );
};
