import React from 'react';
import { CalendarEvent, Task } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, Circle, AlertCircle, Plus, Sparkles } from 'lucide-react';

interface DashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onConvertTaskToEvent: (task: Task) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ events, tasks, onEventClick, onAddTask }) => {
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

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 scrollbar-hide">
      <header className="mb-8">
        <h2 className="text-4xl font-serif font-bold text-custom-soil dark:text-white mb-2 animate-slide-up">
          {getGreeting()}, <span className="opacity-60">Usuário</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 animate-slide-up" style={{animationDelay: '0.1s'}}>
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

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

        {/* Right Column: Quick Tasks & AI Suggestions */}
        <div className="space-y-8">
            {/* Quick Tasks */}
            <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium dark:text-gray-200">Tarefas Prioritárias</h3>
                    <button onClick={() => onAddTask("Nova Tarefa")} className="p-1 hover:bg-black/5 rounded-full"><Plus size={18} /></button>
                </div>
                <ul className="space-y-3">
                    {pendingTasks.map((task) => (
                        <li key={task.id} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-xl hover:bg-white/60 transition-colors group">
                            <button className="text-gray-400 hover:text-green-500 transition-colors">
                                <Circle size={18} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{task.title}</span>
                            {task.priority === 'high' && <AlertCircle size={14} className="text-red-500" />}
                        </li>
                    ))}
                    {pendingTasks.length === 0 && <li className="text-sm text-gray-400 text-center py-4">Tudo limpo!</li>}
                </ul>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-br from-custom-soil to-zinc-800 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-custom-tan">
                        <Sparkles size={18} />
                        <span className="text-xs font-bold tracking-widest uppercase">Maya Insight</span>
                    </div>
                    <p className="text-lg font-serif italic opacity-90 mb-4">
                        "Seu período da tarde está livre. Que tal adiantar o projeto de Design?"
                    </p>
                    <button className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10">
                        VER SUGESTÕES
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};