import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Image as ImageIcon, Volume2 } from 'lucide-react';
import { parseSmartCommand, generateImage, generateSpeech, chatWithMaya } from '../services/geminiService';
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
    { id: '1', sender: 'maya', text: 'Olá! Sou a Maya. Posso agendar eventos, criar tarefas ou gerar imagens e falas. Como posso ajudar?', type: 'text' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    addMessage('user', userMsg);
    setLoading(true);

    try {
        // Check for specific commands first
        const lower = userMsg.toLowerCase();
        
        if (lower.startsWith('gerar imagem') || lower.startsWith('crie uma imagem')) {
            const prompt = userMsg.replace(/gerar imagem|crie uma imagem/i, '').trim();
            const imageUrl = await generateImage(prompt, "1K"); // Using 1K by default, could add UI to select
            if (imageUrl) {
                addMessage('maya', `Aqui está a imagem que você pediu: "${prompt}"`, 'image', imageUrl);
            } else {
                addMessage('maya', 'Desculpe, não consegui gerar a imagem.');
            }
        } 
        else if (lower.startsWith('fale') || lower.startsWith('diga')) {
             const textToSpeak = userMsg.replace(/fale|diga/i, '').trim();
             const audioData = await generateSpeech(textToSpeak);
             if (audioData) {
                 // Convert base64 to blob url for playback
                 const byteCharacters = atob(audioData);
                 const byteNumbers = new Array(byteCharacters.length);
                 for (let i = 0; i < byteCharacters.length; i++) {
                     byteNumbers[i] = byteCharacters.charCodeAt(i);
                 }
                 const byteArray = new Uint8Array(byteNumbers);
                 const blob = new Blob([byteArray], {type: 'audio/mp3'}); // Adjust type if needed
                 const url = URL.createObjectURL(blob);
                 addMessage('maya', `Falando: "${textToSpeak}"`, 'audio', url);
                 new Audio(url).play();
             } else {
                 addMessage('maya', 'Desculpe, não consegui gerar o áudio.');
             }
        }
        else {
             // Try smart command parsing
             const command = await parseSmartCommand(userMsg);
             if (command && command.action !== 'unknown') {
                 onAction(command.action, command.action === 'create_task' ? command.taskData : command.eventData);
                 addMessage('maya', `Comando reconhecido: ${command.action}. Executando...`);
             } else {
                 // Fallback to General Chat
                 const history = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
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
                        max-w-[80%] p-3 rounded-2xl text-sm
                        ${msg.sender === 'user' 
                            ? 'bg-custom-soil text-white rounded-br-none' 
                            : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}
                    `}>
                        {msg.type === 'text' && <p>{msg.text}</p>}
                        {msg.type === 'image' && msg.content && (
                            <div className="space-y-2">
                                <p>{msg.text}</p>
                                <img src={msg.content} alt="Generated" className="rounded-lg w-full h-auto border border-white/10" />
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

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
             <div className="relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite uma mensagem, comando ou peça uma imagem..."
                    className="w-full bg-gray-100 dark:bg-black/50 border-none rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-custom-caramel/50 dark:text-white"
                 />
                 <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-custom-soil text-white rounded-full hover:bg-custom-caramel disabled:opacity-50 transition-colors"
                 >
                     <Send size={16} />
                 </button>
             </div>
             <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
                 <span className="flex items-center gap-1"><Sparkles size={10} /> Agenda Inteligente</span>
                 <span className="flex items-center gap-1"><ImageIcon size={10} /> Gerar Imagens</span>
                 <span className="flex items-center gap-1"><Mic size={10} /> TTS & Comandos</span>
             </div>
        </div>

      </div>
    </div>
  );
};