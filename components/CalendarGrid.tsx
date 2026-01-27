
import React, { useState } from 'react';
import { CalendarEvent, Task } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle, Sun, Clock, AlertCircle } from 'lucide-react';

interface CalendarGridProps {
  events: CalendarEvent[];
  tasks: Task[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick?: (task: Task) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, tasks, onDateClick, onEventClick, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Helper to determine task color
  const getTaskColorClass = (task: Task) => {
      if (task.completed) return 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 line-through';
      if (task.priority === 'high') return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30';
      return 'bg-white border-gray-200 text-gray-700 dark:bg-zinc-800 dark:border-white/10 dark:text-gray-300';
  };

  const getEventColorClass = (event: CalendarEvent) => {
      const colors: Record<string, string> = {
          blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
          green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
          red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
          yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
          purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
          orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
      };
      // Special handling for Routine category overrides color if needed, or stick to event color
      if (event.category === 'routine') return 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30';
      
      return colors[event.color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden bg-custom-cream dark:bg-black/40">
      <header className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button 
                onClick={goToToday}
                className="hidden md:flex text-xs font-bold items-center gap-1 px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
                <CalendarIcon size={12} /> Hoje
            </button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-white/5 rounded-full p-1 border border-gray-200 dark:border-white/10 shadow-sm">
            <button 
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
            >
                <ChevronLeft size={18} />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10"></div>
            <button 
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
            >
                <ChevronRight size={18} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-7 mb-2 flex-shrink-0">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-5 gap-px bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-inner">
        {calendarDays.map((day, idx) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
          const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
          
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          
          // Combine items
          const combinedItems = [
              ...dayEvents.map(e => ({ type: 'event', data: e })),
              ...dayTasks.map(t => ({ type: 'task', data: t }))
          ];

          // Sort by time roughly (events have start, tasks have dueDate)
          // Note: dueDate usually has a time component if set by AI, otherwise it might be 00:00 or 09:00 default
          
          const maxVisible = 4; // Adjust based on cell height
          const remaining = combinedItems.length - maxVisible;

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onDateClick(day)}
              className={`
                relative p-1 md:p-2 bg-white dark:bg-[#0c0c0e] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex flex-col
                ${!isCurrentMonth ? 'opacity-30 bg-gray-50/50 dark:bg-black/40' : ''}
              `}
            >
              <div className="flex justify-center md:justify-between items-start mb-1">
                <span className={`
                    text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full
                    ${isTodayDate ? 'bg-custom-caramel text-white shadow-md' : 'text-gray-700 dark:text-gray-400'}
                `}>
                    {format(day, 'd')}
                </span>
                {/* Mobile Dot Indicator */}
                <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {combinedItems.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    ))}
                </div>
              </div>

              {/* Desktop Content */}
              <div className="hidden md:flex flex-col gap-1 flex-1 overflow-hidden">
                {combinedItems.slice(0, maxVisible).map((item: any) => {
                    if (item.type === 'event') {
                        const event = item.data as CalendarEvent;
                        return (
                            <div 
                                key={`evt-${event.id}`}
                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                className={`
                                    truncate px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity
                                    ${getEventColorClass(event)}
                                `}
                            >
                                {event.category === 'routine' ? <Sun size={8} /> : <div className={`w-1.5 h-1.5 rounded-full ${event.color === 'blue' ? 'bg-blue-500' : event.color === 'green' ? 'bg-green-500' : event.color === 'red' ? 'bg-red-500' : 'bg-gray-500'}`}></div>}
                                <span className="truncate">{event.title}</span>
                            </div>
                        );
                    } else {
                        const task = item.data as Task;
                        return (
                            <div 
                                key={`task-${task.id}`}
                                onClick={(e) => { e.stopPropagation(); if(onTaskClick) onTaskClick(task); }}
                                className={`
                                    truncate px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity
                                    ${getTaskColorClass(task)}
                                `}
                            >
                                {task.completed ? <CheckCircle2 size={8} /> : (task.priority === 'high' ? <AlertCircle size={8} /> : <Circle size={8} />)}
                                <span className="truncate">{task.title}</span>
                            </div>
                        );
                    }
                })}
                
                {remaining > 0 && (
                    <div className="text-[9px] text-gray-400 pl-1 font-medium">
                        + {remaining} itens
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
