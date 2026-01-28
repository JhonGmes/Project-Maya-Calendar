
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic, Image as ImageIcon, Volume2, Upload, Edit, Brain, AlertTriangle, Check, ArrowRight, Handshake, Video, Maximize2, Minimize2, Info, List, CalendarClock, Download, FileText } from 'lucide-react';
import { generateImage, generateSpeech, chatWithMaya, editImage, analyzeVideo } from '../services/geminiService';
import { parseIAResponse } from '../utils/iaActionEngine';
import { adaptTone } from '../utils/personalityEngine';
import { CalendarEvent, Task, NegotiationOption } from '../types';
import { useApp } from '../context/AppContext';
import { useDebounce } from '../hooks/useDebounce';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { WeekPreview } from './WeekPreview'; // Import the new component

interface MayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data: any) => void;
  allTasks: Task[];
  allEvents: CalendarEvent[];
}

export const MayaModal: React.FC<MayaModalProps> = ({ isOpen, onClose }) => {
  const appContext = useApp();
  const { messages, addMessage, setIaStatus, iaStatus, pendingAction, setPendingAction, personality, agentSuggestion, setAgentSuggestion, executeIAAction, cancelIAAction, tasks, events, iaHistory, currentTeam, userRole } = appContext;

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{data: string, mimeType: string} | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false); 
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pendingAction, isMaximized]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // --- DEBOUNCE LOGIC FOR INTENT ANALYSIS ---
  const analyzeIntent = useDebounce((text: string) => {
      // Logic placeholder
  }, 600);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInput(val);
      analyzeIntent(val);
  };

  const sendAIMessage = (text: string, type: 'text' | 'image' | 'audio' | 'video' | 'report' = 'text', content?: string) => {
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
              addMessage({ id: Date.now().toString(), sender: 'user', text: 'Imagem carregada', type: 'image', content: base64 });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 20 * 1024 * 1024) {
              alert("O vídeo deve ter menos de 20MB para análise.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              setSelectedVideo({ data: base64, mimeType: file.type });
              addMessage({ id: Date.now().toString(), sender: 'user', text: 'Vídeo carregado. O que deseja saber?', type: 'video', content: result });
          };
          reader.readAsDataURL(file);
      }
  };

  const confirmAction = async () => {
      if (!pendingAction) return;
      setIaStatus('executing');
      try {
           await executeIAAction(pendingAction.originalAction, "ai");
           sendAIMessage("✔ Feito! Ação concluída com sucesso.");
      } catch (e) {
          sendAIMessage("❌ Ocorreu um erro ao executar a ação.");
      }
      setPendingAction(null);
      setIaStatus('idle');
  };

  const cancelAction = async () => {
      await cancelIAAction();
  };

  const handleAdjust = () => {
      setPendingAction(null);
      setInput("Gostaria de ajustar o seguinte: ");
      if (textareaRef.current) textareaRef.current.focus();
  };

  const handleNegotiationOption = async (option: NegotiationOption) => {
      setIaStatus('executing');
      setPendingAction(null);
      try {
          await executeIAAction(option.action, "user");
          sendAIMessage(`Combinado! Opção "${option.label}" aplicada.`);
      } catch (e) {
          sendAIMessage("Erro ao aplicar a opção.");
      }
      setIaStatus('idle');
  };

  const acceptSuggestion = async () => {
      if (!agentSuggestion) return;
      if (agentSuggestion.type === 'warning' || agentSuggestion.type === 'pattern' || agentSuggestion.type === 'workflow_step') {
          await executeIAAction(agentSuggestion.actionData, "ai");
          setAgentSuggestion(null);
      } 
  };

  const handleDownloadPDF = async (messageId: string) => {
      const element = document.getElementById(`report-${messageId}`);
      if (!element) return;

      setDownloadingPdf(messageId);

      try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Relatorio_Maya_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      } catch (error) {
          console.error("PDF Error", error);
          alert("Erro ao gerar PDF.");
      } finally {
          setDownloadingPdf(null);
      }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage && !selectedVideo) return;
    const userMsg = input;
    
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    if (userMsg.trim()) {
        addMessage({ id: Date.now().toString(), sender: 'user', text: userMsg, type: 'text' });
    }
    
    setIaStatus('thinking');

    try {
        if (selectedVideo) {
            const analysisPrompt = userMsg || "Descreva o que acontece neste vídeo.";
            const analysis = await analyzeVideo(selectedVideo.data, selectedVideo.mimeType, analysisPrompt);
            sendAIMessage(analysis);
            setSelectedVideo(null); 
            return;
        }

        const lower = userMsg.toLowerCase().trim();
        let imageToAnalyze = null;

        if (selectedImage) {
             if (lower.startsWith('editar') || lower.startsWith('mudar') || lower.includes('trocar fundo') || lower.includes('transformar')) {
                 const editPrompt = userMsg || "Descreva esta imagem";
                 const editedImage = await editImage(selectedImage, editPrompt);
                 if (editedImage) {
                     sendAIMessage(`Aqui está o resultado: "${editPrompt}"`, 'image', editedImage);
                     setSelectedImage(null); 
                 } else {
                     sendAIMessage('Não consegui editar a imagem. Tente novamente.');
                 }
                 setIaStatus('idle');
                 return;
             }
             imageToAnalyze = selectedImage;
             setSelectedImage(null);
        }

        if (lower.startsWith('gerar imagem') || lower.startsWith('crie uma imagem')) {
            const prompt = userMsg.replace(/gerar imagem|crie uma imagem/i, '').trim();
            const imageUrl = await generateImage(prompt, "1K");
            if (imageUrl) {
                sendAIMessage(`Imagem gerada: "${prompt}"`, 'image', imageUrl);
            } else {
                sendAIMessage('Desculpe, não consegui gerar a imagem.');
            }
            setIaStatus('idle');
            return;
        } 

        if (lower.startsWith('fale') || lower.startsWith('diga')) {
             const textToSpeak = userMsg.replace(/fale|diga/i, '').trim();
             const audioData = await generateSpeech(textToSpeak);
             if (audioData) {
                 // ... audio decoding logic ...
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
             setIaStatus('idle');
             return;
        }

        // Default Chat flow
        const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
        
        const rawResponse = await chatWithMaya(
            userMsg, 
            history, 
            isThinkingMode ? 'thinking' : 'fast',
            { tasks, events, history: iaHistory, currentTeam, userRole },
            imageToAnalyze 
        );

        const parsedResponse = parseIAResponse(rawResponse);
        sendAIMessage(parsedResponse.message);

        for (const action of parsedResponse.actions) {
            await executeIAAction(action, "ai");
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

  // Render logic for different pending actions
  const renderActionContent = () => {
      if (!pendingAction) return null;
      const type = pendingAction.originalAction.type;

      if (type === 'REORGANIZE_CALENDAR') {
          return <WeekPreview plan={pendingAction.originalAction.payload.plan} />;
      }

      if (type === 'REORGANIZE_WEEK') {
          const changes = pendingAction.originalAction.payload.changes;
          return (
              <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl mb-3 text-left max-h-40 overflow-y-auto border border-gray-100 dark:border-white/5 custom-scrollbar">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Plano Sugerido ({changes.length} Mudanças)</h4>
                  <div className="space-y-1.5">
                      {changes.map((change: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] bg-white dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                              <span className="font-medium truncate max-w-[45%] dark:text-gray-300">{change.taskTitle}</span>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                  <span className="line-through opacity-70">{new Date(change.from).getDate()}/{new Date(change.from).getMonth()+1}</span>
                                  <ArrowRight size={8} />
                                  <span className="text-green-600 dark:text-green-400 font-bold">{new Date(change.to).getDate()}/{new Date(change.to).getMonth()+1}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`
          bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden relative border border-white/20 animate-fade-in transition-all duration-300
          ${isMaximized ? 'fixed inset-0 w-full h-full rounded-none' : 'w-full max-w-lg h-[500px] max-h-[85vh] rounded-3xl'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-bold dark:text-white">Maya AI</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
                        {currentTeam ? `${currentTeam.name}` : 'Pessoal'} ({personality})
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsMaximized(!isMaximized)} 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300"
                    title={isMaximized ? "Restaurar" : "Tela Cheia"}
                >
                    {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={20} className="dark:text-white" /></button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20" ref={scrollRef}>
            {/* Agent Suggestions */}
            {agentSuggestion && (
                <div className={`p-4 rounded-2xl border mb-4 animate-slide-up ${
                    agentSuggestion.type === 'warning' 
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                    : 'bg-gradient-to-r from-purple-100 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/20 border-purple-200 dark:border-white/10'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                            agentSuggestion.type === 'warning' ? 'bg-red-100 text-red-600' : 'bg-white dark:bg-white/10 text-purple-600 dark:text-purple-300'
                        }`}>
                             {agentSuggestion.type === 'warning' ? <AlertTriangle size={18} /> : <Brain size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium mb-2 ${agentSuggestion.type === 'warning' ? 'text-red-900 dark:text-red-200' : 'text-purple-900 dark:text-purple-100'}`}>
                                {agentSuggestion.message}
                            </p>
                            <button 
                                onClick={acceptSuggestion}
                                className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs rounded-lg font-bold transition-colors shadow-sm ${
                                    agentSuggestion.type === 'warning' ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            >
                                {agentSuggestion.actionLabel} <ArrowRight size={12} />
                            </button>
                        </div>
                        <button onClick={() => setAgentSuggestion(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                </div>
            )}

            {messages.map((msg) => {
                let bubbleStyle = msg.sender === 'user' 
                    ? 'bg-custom-soil text-white rounded-br-none' 
                    : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm';
                
                let icon = null;
                if (msg.sender === 'maya') {
                    if (msg.type === 'report') {
                        bubbleStyle = 'bg-white dark:bg-zinc-800 border-l-4 border-purple-500 shadow-md text-gray-800 dark:text-gray-200 rounded-lg w-full';
                        icon = <FileText size={20} className="text-purple-500 mb-2" />;
                    } else if (msg.text.includes("Risco") || msg.text.includes("Alerta")) {
                        bubbleStyle = 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100 rounded-bl-none';
                        icon = <AlertTriangle size={14} className="text-red-500 mb-1" />;
                    }
                }

                return (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${bubbleStyle}`}>
                            {icon}
                            {msg.type === 'text' && <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>}
                            {/* Report / Image / Video rendering ... */}
                            {msg.type === 'report' && (
                                <div>
                                    <div id={`report-${msg.id}`} className="bg-white dark:bg-white/5 p-4 rounded-lg mb-3">
                                        <div className="whitespace-pre-line leading-relaxed font-medium">{msg.text}</div>
                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10 flex justify-between items-center text-xs text-gray-400">
                                            <span>Maya Intelligence Report</span>
                                            <span>{format(new Date(), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadPDF(msg.id)}
                                        disabled={downloadingPdf === msg.id}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                                    >
                                        {downloadingPdf === msg.id ? "Gerando PDF..." : <><Download size={16} /> Baixar Relatório (PDF)</>}
                                    </button>
                                </div>
                            )}
                            {msg.type === 'image' && msg.content && (
                                <div className="space-y-2">
                                    <p className="opacity-80 text-xs mb-1">{msg.text}</p>
                                    <img src={msg.content} alt="Generated" className="rounded-lg w-full h-auto border border-white/10" />
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
                        </div>
                    </div>
                );
            })}

            {/* Confirmation / Preview UI */}
            {pendingAction && pendingAction.originalAction.type !== 'NEGOTIATE_DEADLINE' && (
                <div className="flex justify-start animate-slide-up w-full">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-bl-none shadow-lg border-l-4 border-custom-caramel w-full max-w-[90%]">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-custom-caramel/10 rounded-full text-custom-caramel mt-1">
                                {pendingAction.originalAction.type === 'REORGANIZE_CALENDAR' ? <CalendarClock size={18} /> : 
                                 pendingAction.originalAction.type === 'REORGANIZE_WEEK' ? <List size={18} /> : 
                                 <Brain size={18} />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">{pendingAction.question}</p>
                            </div>
                        </div>

                        {renderActionContent()}

                        <div className="flex gap-2">
                            <button 
                                onClick={confirmAction}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Check size={14} /> Aceitar
                            </button>
                            <button 
                                onClick={handleAdjust}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Edit size={14} /> Ajustar
                            </button>
                            <button 
                                onClick={cancelAction}
                                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold flex items-center justify-center transition-colors"
                            >
                                Recusar
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

        {/* Input Area ... (Same as before) */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
             <div className="relative flex items-center gap-2">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 <input type="file" ref={fileInputVideoRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                 <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"><ImageIcon size={18} /></button>
                 <button onClick={() => fileInputVideoRef.current?.click()} className="p-3 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"><Video size={18} /></button>
                 
                 <div className="relative flex-1">
                    <textarea 
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange} 
                        onKeyDown={handleKeyDown}
                        placeholder={pendingAction ? "Digite sua resposta..." : "Mensagem ou comando..."}
                        rows={1}
                        className={`w-full bg-gray-100 dark:bg-black/50 border-none rounded-2xl py-3 pl-4 pr-12 focus:ring-2 dark:text-white transition-all resize-none overflow-hidden min-h-[48px] ${isThinkingMode ? 'focus:ring-purple-500/50 bg-purple-50/10' : 'focus:ring-custom-caramel/50'}`}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedImage && !selectedVideo) || iaStatus === 'thinking'}
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
                 </div>
                 
                 <button 
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        isThinkingMode 
                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:bg-gray-200'
                    }`}
                 >
                    <Brain size={12} className={isThinkingMode ? 'animate-pulse' : ''} />
                    {isThinkingMode ? 'Modo Pensador (Pro)' : 'Modo Rápido'}
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};
