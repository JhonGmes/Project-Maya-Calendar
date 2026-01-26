import React, { useMemo } from 'react';
import { Task } from '../types';
import { groupTasksByWeek } from '../utils/weeklyView';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle } from 'lucide-react';

interface WeeklyViewProps {
    tasks: Task[];
    onToggleTask: (taskId: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ tasks, onToggleTask }) => {
    const weeklyGroups = useMemo(() => groupTasksByWeek(tasks), [tasks]);
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });

    return (
        <div className="h-full p-6 md:p-8 overflow-y-auto">
            <header className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white">Visão Semanal</h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {format(start, "d 'de' MMMM", { locale: ptBR })} - {format(end, "d 'de' MMMM", { locale: ptBR })}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(weeklyGroups).map(([dayName, dayTasks]) => {
                    const tasksForDay = dayTasks as Task[];
                    return (
                        <div key={dayName} className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-white/40 dark:border-white/5">
                            <h3 className="font-bold text-custom-soil dark:text-custom-tan mb-3 flex justify-between items-center">
                                {dayName}
                                <span className="text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500">{tasksForDay.length}</span>
                            </h3>
                            
                            <div className="space-y-2">
                                {tasksForDay.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">Sem tarefas.</p>
                                ) : (
                                    tasksForDay.map(task => (
                                        <div key={task.id} className="flex items-start gap-2 p-2 bg-white/60 dark:bg-black/20 rounded-lg group hover:shadow-sm transition-all">
                                            <button 
                                                onClick={() => onToggleTask(task.id)} 
                                                className={`mt-0.5 ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-custom-caramel'}`}
                                            >
                                                {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`text-sm leading-tight ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {task.title}
                                                </p>
                                                {task.priority === 'high' && !task.completed && (
                                                    <span className="text-[10px] text-red-500 font-bold block mt-0.5">PRIORIDADE</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};