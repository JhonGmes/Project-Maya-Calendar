
import React, { useMemo } from 'react';
import { CalendarEvent } from '../types';
import { format } from 'date-fns';

interface DayEventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  pixelsPerMinute: number;
  startHour: number;
  style?: React.CSSProperties;
}

export const DayEventCard: React.FC<DayEventCardProps> = ({ event, onClick, pixelsPerMinute, startHour, style }) => {
  
  const { top, height } = useMemo(() => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    // Calculate minutes from the start of the view (e.g., 00:00 or startHour)
    const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    return {
      top: startMinutes * pixelsPerMinute,
      height: Math.max(durationMinutes * pixelsPerMinute, 24) // Minimum height
    };
  }, [event.start, event.end, pixelsPerMinute, startHour]);

  const colorStyles = {
    blue: 'bg-blue-100/90 border-blue-500 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100',
    green: 'bg-green-100/90 border-green-500 text-green-900 dark:bg-green-900/50 dark:text-green-100',
    red: 'bg-red-100/90 border-red-500 text-red-900 dark:bg-red-900/50 dark:text-red-100',
    yellow: 'bg-yellow-100/90 border-yellow-500 text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-100',
    purple: 'bg-purple-100/90 border-purple-500 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100',
    orange: 'bg-orange-100/90 border-orange-500 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100',
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`absolute left-0 right-2 rounded-lg border-l-4 p-2 cursor-pointer shadow-sm hover:shadow-md hover:brightness-95 hover:z-20 transition-all duration-300 ease-in-out will-change-transform ${colorStyles[event.color] || colorStyles.blue}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        ...style
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <span className="text-xs font-bold truncate leading-tight">{event.title}</span>
        {height > 40 && (
            <span className="text-[10px] opacity-80 font-mono mt-0.5">
            {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
            </span>
        )}
      </div>
    </div>
  );
};
