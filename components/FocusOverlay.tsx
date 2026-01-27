
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
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-fade-in">
            
            {/* Background Ambient Glow - Subtle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-2xl px-6 text-center space-y-12">
                
                {/* Header - Minimalist */}
                <div className="flex items-center justify-center gap-2 opacity-50">
                    <Target size={16} />
                    <span className="uppercase tracking-[0.3em] text-xs font-medium">Modo Foco</span>
                </div>

                {/* Main Task Display - Clear Hierarchy */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-white/90">
                        {activeTask.title}
                    </h1>
                    <p className="text-white/40 text-sm">
                        Vamos focar só nisso agora.
                    </p>
                </div>

                {/* Timer Circle - Clean */}
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                        <circle 
                            cx="128" cy="128" r="120" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 120} 
                            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                            className="text-purple-400/80 transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-6xl font-mono font-medium tracking-tighter text-white/90">
                            {formatTime(elapsed)}
                        </span>
                    </div>
                </div>

                {/* Controls - Non-invasive */}
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => endFocusSession(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all backdrop-blur-md border border-white/5"
                    >
                        <CheckCircle size={18} /> Concluir
                    </button>
                    
                    <button 
                        onClick={() => endFocusSession(false)}
                        className="flex items-center gap-2 px-6 py-3 text-white/40 hover:text-white transition-colors text-sm"
                    >
                        Pausar / Sair
                    </button>
                </div>

            </div>
        </div>
    );
};
