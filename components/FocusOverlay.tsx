
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Pause, Play, Brain, Sparkles, Target } from 'lucide-react';

export const FocusOverlay: React.FC = () => {
    const { focusSession, tasks, endFocusSession } = useApp();
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    // Find task details
    const activeTask = tasks.find(t => t.id === focusSession.taskId);

    useEffect(() => {
        if (!focusSession.isActive || !focusSession.startTime) return;

        const interval = setInterval(() => {
            if (!isPaused) {
                const start = new Date(focusSession.startTime!).getTime();
                const now = new Date().getTime();
                // We calculate elapsed in seconds for the UI update
                setElapsed(Math.floor((now - start) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [focusSession, isPaused]);

    if (!focusSession.isActive || !activeTask) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const plannedSeconds = (focusSession.plannedDuration || 25) * 60;
    const progress = Math.min((elapsed / plannedSeconds) * 100, 100);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-fade-in">
            
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-2xl px-6 text-center space-y-12">
                
                {/* Header */}
                <div className="flex items-center justify-center gap-2 opacity-70">
                    <Target size={20} className="text-purple-400" />
                    <span className="uppercase tracking-[0.2em] text-sm font-bold">Modo Foco Ativo</span>
                </div>

                {/* Main Task Display */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
                        {activeTask.title}
                    </h1>
                    {activeTask.priority === 'high' && (
                         <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold uppercase tracking-wider border border-red-500/30">
                            Alta Prioridade
                         </span>
                    )}
                </div>

                {/* Timer Circle */}
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                        <circle 
                            cx="128" cy="128" r="120" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 120} 
                            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                            className="text-purple-500 transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-6xl font-mono font-bold tracking-tighter">
                            {formatTime(elapsed)}
                        </span>
                        <span className="text-sm text-gray-400 mt-2">
                            Meta: {focusSession.plannedDuration} min
                        </span>
                    </div>
                </div>

                {/* AI Coach Message Placeholder (can be dynamic later) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 max-w-md mx-auto">
                    <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
                        <Brain size={20} />
                    </div>
                    <p className="text-sm text-gray-300 text-left">
                        {progress < 50 ? "Começando com força total. Evite distrações agora." : "Você passou da metade. Mantenha o ritmo!"}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-6 justify-center">
                    <button 
                        onClick={() => endFocusSession(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-900/50"
                    >
                        <CheckCircle size={20} /> Concluir Tarefa
                    </button>
                    
                    <button 
                        onClick={() => endFocusSession(false)}
                        className="flex items-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl font-bold transition-all border border-gray-700"
                    >
                        <X size={20} /> Parar / Pausar
                    </button>
                </div>

            </div>
        </div>
    );
};
