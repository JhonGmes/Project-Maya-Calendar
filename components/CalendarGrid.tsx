import React from 'react';
import { CalendarEvent } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarGridProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onDateClick, onEventClick }) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <header className="flex justify-between items-end mb-6">
        <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </header>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-1 md:gap-2">
        {calendarDays.map((day, idx) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onDateClick(day)}
              className={`
                relative p-2 rounded-xl border border-transparent transition-all cursor-pointer group
                ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-white/5 opacity-40' : 'bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-md'}
                ${isToday(day) ? 'ring-2 ring-custom-caramel ring-offset-2 dark:ring-offset-black' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday(day) ? 'bg-custom-soil text-white' : 'text-gray-700 dark:text-gray-300'}
                `}>
                    {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && <span className="text-[10px] text-gray-400 font-mono hidden md:inline">{dayEvents.length}</span>}
              </div>

              <div className="space-y-1 overflow-hidden max-h-[80px]">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`
                        text-[10px] truncate px-1.5 py-0.5 rounded-md border-l-2 cursor-pointer hover:brightness-95 transition-filter
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
                {dayEvents.length > 3 && (
                    <div className="text-[10px] text-center text-gray-400">+ {dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};