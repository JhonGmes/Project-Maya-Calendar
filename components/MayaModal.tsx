import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Image as ImageIcon, Volume2, Upload, Edit, Trash2 } from 'lucide-react';
import { parseSmartCommand, generateImage, generateSpeech, chatWithMaya, editImage } from '../services/geminiService';
import { CalendarEvent, Task } from '../types';

interface MayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data: any) => void;
  allTasks: Task[];
  allEvents: CalendarEvent[];
}

interface Message {
  id: string;
  sender: 'user' | 'maya';
  text: string;
  type: 'text' | 'image' | 'audio';
  content?: string; // URL for image/audio
}

export const MayaModal: React.FC<MayaModalProps> = ({ isOpen, onClose, onAction, allTasks, allEvents }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'maya', text: 'Olá! Sou a Maya. Posso agendar eventos, criar tarefas, gerar imagens ou editar imagens que você enviar. Como posso ajudar?', type: 'text' }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setSelectedImage(base64);
              addMessage('user', 'Imagem carregada para edição', 'image', base64);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    const userMsg = input;
    
    if (userMsg.trim()) {
        addMessage('user', userMsg);
    }
    
    setInput('');
    setLoading(true);

    try {
        const lower = userMsg.toLowerCase();

        // Image Editing Flow (Nano Banana)
        if (selectedImage) {
             const editPrompt = userMsg || "Descreva esta imagem";
             const editedImage = await editImage(selectedImage, editPrompt);
             
             if (editedImage) {
                 addMessage('maya', `Aqui está o resultado da edição: "${editPrompt}"`, 'image', editedImage);
                 setSelectedImage(null); // Clear context after edit
             } else {
                 addMessage('maya', 'Não consegui editar a imagem. Tente um prompt diferente.');
             }
        }
        // Image Generation Flow
        else if (lower.startsWith('gerar imagem') || lower.startsWith('crie uma imagem')) {
            const prompt = userMsg.replace(/gerar imagem|crie uma imagem/i, '').trim();
            const imageUrl = await generateImage(prompt, "1K");
            if (imageUrl) {
                addMessage('maya', `Aqui está a imagem que você pediu: "${prompt}"`, 'image', imageUrl);
            } else {
                addMessage('maya', 'Desculpe, não consegui gerar a imagem.');
            }
        } 
        // TTS Flow
        else if (lower.startsWith('fale') || lower.startsWith('diga')) {
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
                 addMessage('maya', `Falando: "${textToSpeak}"`, 'audio', url);
                 new Audio(url).play();
             } else {
                 addMessage('maya', 'Desculpe, não consegui gerar o áudio.');
             }
        }
        // General Chat & Commands
        else {
             const command = await parseSmartCommand(userMsg);
             if (command && command.action !== 'unknown') {
                 onAction(command.action, command.action === 'create_task' ? command.taskData : command.eventData);
                 addMessage('maya', `Comando reconhecido: ${command.action}. Executando...`);
             } else {
                 const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
                 const response = await chatWithMaya(userMsg, history);
                 addMessage('maya', response || "Não entendi, pode repetir?");
             }
        }

    } catch (e) {
        addMessage('maya', 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
        setLoading(false);
    }
  };

  const addMessage = (sender: 'user' | 'maya', text: string, type: 'text' | 'image' | 'audio' = 'text', content?: string) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, type, content }]);
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
                    <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online</p>
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
                        {msg.type === 'text' && <p>{msg.text}</p>}
                        {msg.type === 'image' && msg.content && (
                            <div className="space-y-2">
                                <p className="opacity-80 text-xs mb-1">{msg.text}</p>
                                <img src={msg.content} alt="Generated" className="rounded-lg w-full h-auto border border-white/10" />
                                {msg.sender === 'user' && selectedImage === msg.content && (
                                     <div className="bg-black/50 text-white text-xs p-1 rounded text-center mt-1">Imagem selecionada para edição</div>
                                )}
                                {msg.sender === 'maya' && (
                                     <button 
                                        onClick={() => { setSelectedImage(msg.content!); addMessage('user', 'Editando esta imagem...', 'image', msg.content); }}
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
            {loading && (
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
                        placeholder={selectedImage ? "Digite como editar (ex: Filtro retrô)..." : "Mensagem, comando ou 'Gerar imagem'..."}
                        className="w-full bg-gray-100 dark:bg-black/50 border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-custom-caramel/50 dark:text-white"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedImage) || loading}
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