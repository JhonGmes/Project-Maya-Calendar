
import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarGridProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onDateClick, onEventClick }) => {
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

  return (
    <div className="h-full flex flex-col p-3 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-3xl font-serif font-bold text-custom-soil dark:text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button 
                onClick={goToToday}
                className="hidden md:flex text-xs items-center gap-1 px-3 py-1 bg-custom-soil/10 dark:bg-white/10 rounded-full text-custom-soil dark:text-white hover:bg-custom-soil/20 transition-colors"
            >
                <CalendarIcon size={12} /> Hoje
            </button>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
                title="Mês anterior"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
                title="Próximo mês"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider py-1 md:py-2">
            {day.substr(0, 3)}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-0.5 md:gap-2 overflow-y-auto">
        {calendarDays.map((day, idx) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onDateClick(day)}
              className={`
                relative p-1 md:p-2 rounded-lg md:rounded-xl border border-transparent transition-all cursor-pointer group flex flex-col min-h-[80px]
                ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-white/5 opacity-40' : 'bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-md'}
                ${isToday(day) ? 'ring-1 md:ring-2 ring-custom-caramel ring-offset-1 md:ring-offset-2 dark:ring-offset-black' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`
                    text-xs md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full
                    ${isToday(day) ? 'bg-custom-soil text-white' : 'text-gray-700 dark:text-gray-300'}
                `}>
                    {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && <span className="text-[9px] text-gray-400 font-mono hidden md:inline">{dayEvents.length}</span>}
              </div>

              <div className="space-y-0.5 md:space-y-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`
                        truncate rounded-sm md:rounded-md cursor-pointer hover:brightness-95 transition-filter
                        hidden md:block px-1.5 py-0.5 text-[10px] border-l-2
                        ${event.color === 'blue' ? 'bg-blue-100/80 border-blue-500 text-blue-900' : ''}
                        ${event.color === 'green' ? 'bg-green-100/80 border-green-500 text-green-900' : ''}
                        ${event.color === 'red' ? 'bg-red-100/80 border-red-500 text-red-900' : ''}
                        ${event.color === 'yellow' ? 'bg-yellow-100/80 border-yellow-500 text-yellow-900' : ''}
                        ${!['blue','green','red','yellow'].includes(event.color) ? 'bg-gray-100 border-gray-500 text-gray-900' : ''}
                    `}
                  >
                    {event.title}
                  </div>
                ))}
                
                {/* Mobile View: Dots only for events */}
                <div className="md:hidden flex flex-wrap gap-0.5 mt-1 justify-center">
                    {dayEvents.map(event => (
                        <div 
                            key={event.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                                event.color === 'blue' ? 'bg-blue-500' : 
                                event.color === 'red' ? 'bg-red-500' :
                                event.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                        />
                    ))}
                </div>

                {dayEvents.length > 3 && (
                    <div className="hidden md:block text-[9px] text-center text-gray-400">+ {dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
