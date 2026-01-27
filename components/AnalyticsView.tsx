
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateWeeklyStats, getProductiveHours } from '../utils/analytics';
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Activity, BarChart2 } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
    const { tasks, scoreHistory, iaHistory, productivityScore } = useApp();

    const stats = useMemo(() => calculateWeeklyStats(tasks, scoreHistory, iaHistory), [tasks, scoreHistory, iaHistory]);
    const productiveHours = useMemo(() => getProductiveHours(tasks), [tasks]);

    // Simple helper to calculate max for chart scaling
    const maxTasks = Math.max(...stats.map(s => Math.max(s.completedTasks, s.postponedTasks)), 5);

    return (
        <div className="h-full p-6 md:p-10 overflow-y-auto animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white mb-2">Analytics & Evolução</h2>
                <p className="text-gray-500 dark:text-gray-400">Acompanhe seu desempenho, hábitos e equilíbrio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* KPI Cards */}
                <div className="bg-white/60 dark:bg-white/5 p-6 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                            <Activity size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Score Atual</h4>
                    </div>
                    <p className="text-3xl font-bold text-custom-soil dark:text-white">{productivityScore}</p>
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> Manter acima de 80</p>
                </div>

                <div className="bg-white/60 dark:bg-white/5 p-6 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Taxa de Conclusão</h4>
                    </div>
                    <p className="text-3xl font-bold text-custom-soil dark:text-white">
                        {Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100)}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total de tarefas</p>
                </div>

                <div className="bg-white/60 dark:bg-white/5 p-6 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600">
                            <AlertTriangle size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Adiamentos (Semana)</h4>
                    </div>
                    <p className="text-3xl font-bold text-custom-soil dark:text-white">
                        {stats[stats.length - 1]?.postponedTasks || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Reagendamentos via IA</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Chart: Weekly Evolution (Tasks vs Postponed) */}
                <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/40 dark:border-white/5">
                    <h3 className="font-bold text-lg mb-6 dark:text-white flex items-center gap-2">
                        <BarChart2 size={18} /> Execução vs. Adiamentos
                    </h3>
                    
                    <div className="h-48 flex items-end gap-4 justify-between px-2">
                        {stats.map((week, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="w-full max-w-[40px] flex items-end gap-1 h-32 relative">
                                    {/* Completed Bar */}
                                    <div 
                                        className="flex-1 bg-custom-soil dark:bg-custom-caramel rounded-t-sm transition-all group-hover:opacity-80"
                                        style={{ height: `${(week.completedTasks / maxTasks) * 100}%` }}
                                        title={`Concluídas: ${week.completedTasks}`}
                                    ></div>
                                    {/* Postponed Bar */}
                                    <div 
                                        className="flex-1 bg-red-300 dark:bg-red-500/50 rounded-t-sm transition-all group-hover:opacity-80"
                                        style={{ height: `${(week.postponedTasks / maxTasks) * 100}%` }}
                                        title={`Adiada: ${week.postponedTasks}`}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">{week.weekLabel}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-custom-soil dark:bg-custom-caramel rounded-full"></span> Concluídas</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-300 dark:bg-red-500/50 rounded-full"></span> Adiadas</div>
                    </div>
                </div>

                {/* 2. Chart: Productive Hours */}
                <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/40 dark:border-white/5">
                    <h3 className="font-bold text-lg mb-6 dark:text-white flex items-center gap-2">
                        <Clock size={18} /> Horários de Pico
                    </h3>
                    <div className="h-48 flex items-end gap-1">
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const data = productiveHours.find(p => p.hour === hour);
                            const count = data?.count || 0;
                            const max = Math.max(...productiveHours.map(p => p.count), 1);
                            const height = (count / max) * 100;
                            
                            return (
                                <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div 
                                        className={`w-full rounded-t-sm transition-all ${count > 0 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-white/10'}`}
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    ></div>
                                    {hour % 3 === 0 && <span className="text-[9px] text-gray-400">{hour}h</span>}
                                </div>
                            );
                        })}
                    </div>
                     <p className="text-xs text-gray-400 mt-4 text-center">Baseado nas tarefas concluídas</p>
                </div>
            </div>
            
            {/* 3. Burnout Risk History */}
             <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20">
                <h3 className="font-bold text-lg mb-4 text-red-800 dark:text-red-200 flex items-center gap-2">
                    <AlertTriangle size={18} /> Histórico de Risco de Burnout
                </h3>
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    {stats.map((week, idx) => (
                        <div key={idx} className="flex-1 min-w-[100px] p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-red-100 dark:border-white/5">
                             <p className="text-[10px] text-gray-500 mb-1">{week.weekLabel}</p>
                             <div className={`text-sm font-bold uppercase ${
                                 week.burnoutLevel === 'high' ? 'text-red-600' : week.burnoutLevel === 'medium' ? 'text-orange-500' : 'text-green-500'
                             }`}>
                                 {week.burnoutLevel === 'high' ? 'Alto' : week.burnoutLevel === 'medium' ? 'Médio' : 'Baixo'}
                             </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
