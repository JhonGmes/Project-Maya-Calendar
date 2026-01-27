
import React, { useState } from 'react';
import { CalendarEvent, Task } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, Circle, AlertCircle, Plus, Sparkles, Trophy, Target, WifiOff, CloudCheck, Flame, Zap, Brain, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getScoreLevel } from '../utils/productivityScore';
import { ProductivityChart } from './ProductivityChart';

interface DashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onConvertTaskToEvent: (task: Task) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ events, tasks, onEventClick, onAddTask, onToggleTask }) => {
  const { productivityScore, scoreBreakdown, scoreHistory, systemDecision, setMayaOpen, isSupabaseConnected, isAuthenticated, executeIAAction } = useApp();
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  const today = new Date();
  const todayEvents = events.filter(e => 
    new Date(e.start).toDateString() === today.toDateString()
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 5);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleFocusSuggestion = () => {
      if (systemDecision.type === 'SUGGEST_FOCUS') {
          executeIAAction({
              type: "START_FOCUS",
              payload: {
                  taskId: systemDecision.payload.taskId,
                  duration: systemDecision.payload.estimatedMinutes
              }
          }, "user");
      }
  };
  
  const handleViewSummary = () => {
      if (systemDecision.type === 'SHOW_DAILY_SUMMARY') {
          executeIAAction({
              type: "SHOW_SUMMARY",
              payload: systemDecision.payload
          }, "ai");
      }
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 scrollbar-hide">
      
      {/* Connection Warning Banner */}
      {!isSupabaseConnected && isAuthenticated && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <WifiOff className="text-red-500" size={20} />
            <div>
                <h4 className="text-sm font-bold text-red-500">Supabase Desconectado</h4>
                <p className="text-xs text-red-400">Não foi possível conectar ao banco de dados. Dados podem não ser salvos.</p>
            </div>
        </div>
      )}

      {/* Daily Summary Banner (Triggered by Engine) */}
      {systemDecision.type === 'SHOW_DAILY_SUMMARY' && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg animate-slide-up flex justify-between items-center cursor-pointer" onClick={handleViewSummary}>
              <div>
                  <h3 className="font-serif font-bold text-xl mb-1">Dia finalizado?</h3>
                  <p className="opacity-90 text-sm">{systemDecision.payload.message}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                  <ArrowRight size={20} />
              </div>
          </div>
      )}

      <header className="mb-8 flex justify-between items-end relative">
        <div>
            <h2 className="text-4xl font-serif font-bold text-custom-soil dark:text-white mb-2 animate-slide-up">
            {getGreeting()}, <span className="opacity-60">Usuário</span>
            </h2>
            <div className="flex items-center gap-2 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <p className="text-gray-500 dark:text-gray-400">
                {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                {isSupabaseConnected && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold flex items-center gap-1">
                        <CloudCheck size={10} /> Online
                    </span>
                )}
            </div>
        </div>
        
        {/* Score Card 2.0 (Explainable) */}
        <div className="hidden md:block animate-slide-up relative">
            <button 
                onClick={() => setShowScoreDetails(!showScoreDetails)}
                className="flex items-center gap-3 bg-white/60 dark:bg-white/5 backdrop-blur px-4 py-2 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm hover:bg-white/80 transition-all cursor-pointer"
            >
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-400">
                    <Trophy size={20} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Produtividade</p>
                    <div className="flex items-baseline justify-end gap-1">
                        <span className="text-xl font-bold text-custom-soil dark:text-white">{productivityScore}</span>
                        <span className="text-xs text-gray-400 font-medium">pts</span>
                    </div>
                </div>
            </button>

            {/* Score Breakdown Popover */}
            {showScoreDetails && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 p-4 z-50 animate-fade-in">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                        <Target size={14} /> Detalhamento do Score
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1"><Brain size={10} /> Foco Ativo</span>
                            <span className="font-bold text-green-600">+{scoreBreakdown.focusPoints}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1"><CheckCircle2 size={10} /> Tarefas</span>
                            <span className="font-bold text-green-600">+{scoreBreakdown.taskPoints}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1"><Flame size={10} /> Consistência</span>
                            <span className="font-bold text-orange-500">+{scoreBreakdown.consistencyBonus}</span>
                        </div>
                         <div className="flex justify-between text-xs pt-2 border-t border-gray-100 dark:border-white/5">
                            <span className="text-gray-500 flex items-center gap-1"><AlertCircle size={10} /> Penalidades</span>
                            <span className="font-bold text-red-500">-{scoreBreakdown.penalties}</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/5 text-center">
                         <p className="text-[10px] text-gray-400">Sequência atual: {scoreBreakdown.streakDays} dias</p>
                    </div>
                </div>
            )}
        </div>
      </header>

      {/* SMART FOCUS CARD (Controlled by Engine) */}
      {systemDecision.type === 'SUGGEST_FOCUS' && (
          <div className="mb-8 p-1 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-slide-up">
             <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                         <Target size={24} />
                     </div>
                     <div>
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Modo Foco Sugerido</h3>
                            <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-bold flex items-center gap-1">
                                <Clock size={10} /> Est. {systemDecision.payload.estimatedMinutes} min
                            </span>
                         </div>
                         <p className="text-xl font-medium dark:text-white">{systemDecision.payload.title}</p>
                         <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                             <Zap size={10} className="text-yellow-500" /> Impacto no Score: <span className="text-yellow-600 font-bold">+{systemDecision.payload.expectedScoreGain} pts</span>
                         </p>
                     </div>
                 </div>
                 <button 
                    onClick={handleFocusSuggestion}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/30"
                 >
                     <Sparkles size={16} /> Focar Agora
                 </button>
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium dark:text-gray-200">Cronograma de Hoje</h3>
                <span className="text-sm text-custom-caramel font-medium bg-custom-caramel/10 px-3 py-1 rounded-full">
                    {todayEvents.length} eventos
                </span>
            </div>
            
            <div className="relative border-l-2 border-dashed border-gray-200 dark:border-gray-700 ml-4 space-y-8 pb-10">
                {todayEvents.length === 0 ? (
                    <div className="ml-8 p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                        <p className="text-gray-500">Nada agendado para hoje. Aproveite!</p>
                    </div>
                ) : (
                    todayEvents.map((event, idx) => (
                        <div key={event.id} className="relative ml-8 group animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                            <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 ${
                                event.color === 'blue' ? 'bg-blue-500' : 
                                event.color === 'red' ? 'bg-red-500' :
                                event.color === 'green' ? 'bg-green-500' : 'bg-custom-caramel'
                            }`}></div>
                            
                            <div 
                                onClick={() => onEventClick(event)}
                                className="glass-card p-5 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer border-l-4"
                                style={{ borderLeftColor: event.color === 'blue' ? '#3b82f6' : event.color === 'red' ? '#ef4444' : '#a68a64' }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{event.title}</h4>
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-black/40 px-2 py-1 rounded text-gray-500">
                                        {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                                    </span>
                                </div>
                                {event.description && <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>}
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 capitalize">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Right Column: Charts, Quick Tasks */}
        <div className="space-y-8">
            
            {/* Phase 19: History Chart */}
            <div className="glass-panel p-6 rounded-3xl">
                <h3 className="font-medium dark:text-gray-200 mb-4">Evolução Semanal</h3>
                <ProductivityChart data={scoreHistory} />
            </div>

            {/* Quick Tasks */}
            <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium dark:text-gray-200">Tarefas Prioritárias</h3>
                    <button onClick={() => onAddTask("Nova Tarefa")} className="p-1 hover:bg-black/5 rounded-full"><Plus size={18} /></button>
                </div>
                <ul className="space-y-3">
                    {pendingTasks.map((task) => (
                        <li key={task.id} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-xl hover:bg-white/60 transition-colors group">
                            <button 
                                onClick={() => onToggleTask(task.id)}
                                className="text-gray-400 hover:text-green-500 transition-colors"
                            >
                                <Circle size={18} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{task.title}</span>
                            {task.priority === 'high' && <AlertCircle size={14} className="text-red-500" />}
                        </li>
                    ))}
                    {pendingTasks.length === 0 && <li className="text-sm text-gray-400 text-center py-4">Tudo limpo!</li>}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};
