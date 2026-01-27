
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CalendarEvent, PersonalityType } from '../types';
import { format, differenceInMinutes } from 'date-fns';
import { useThrottle } from '../hooks/useThrottle';
import { useApp } from '../context/AppContext';
import { Clock, AlertTriangle, Zap, MoreHorizontal } from 'lucide-react';

interface DayEventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  pixelsPerMinute: number;
  startHour: number;
  style?: React.CSSProperties;
  isPast?: boolean;
  isNext?: boolean;
  personality?: PersonalityType;
}

export const DayEventCard: React.FC<DayEventCardProps> = ({ event, onClick, pixelsPerMinute, startHour, style, isPast, isNext, personality = 'neutro' }) => {
  const { executeIAAction } = useApp();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const dragStartY = useRef(0);
  const initialTop = useRef(0);

  const staticTop = useMemo(() => {
    const start = new Date(event.start);
    return ((start.getHours() - startHour) * 60 + start.getMinutes()) * pixelsPerMinute;
  }, [event.start, startHour, pixelsPerMinute]);

  const height = useMemo(() => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    return Math.max(durationMinutes * pixelsPerMinute, 24);
  }, [event.start, event.end, pixelsPerMinute]);

  const durationMinutes = useMemo(() => {
      return differenceInMinutes(new Date(event.end), new Date(event.start));
  }, [event.start, event.end]);

  const durationText = useMemo(() => {
      const hours = Math.floor(durationMinutes / 60);
      const remainingMins = durationMinutes % 60;
      if (hours > 0) return `${hours}h${remainingMins > 0 ? ` ${remainingMins}m` : ''}`;
      return `${durationMinutes}m`;
  }, [durationMinutes]);

  // Quick Action for Overloaded Personality
  const handleShorten = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newEnd = new Date(new Date(event.end).getTime() - 15 * 60000);
      if (newEnd > new Date(event.start)) {
          executeIAAction({
              type: "UPDATE_EVENT",
              payload: {
                  eventId: event.id,
                  start: new Date(event.start).toISOString(),
                  end: newEnd.toISOString()
              }
          }, "user");
      }
  };

  const throttledMove = useThrottle((currentY: number) => {
      setDragOffsetY(currentY - dragStartY.current);
  }, 16); 

  const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault(); 
      setIsDragging(true);
      dragStartY.current = e.clientY;
      initialTop.current = staticTop;
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          throttledMove(e.clientY);
      };

      const handleMouseUp = () => {
          if (!isDragging) return;
          setIsDragging(false);
          const pixelDelta = dragOffsetY;
          if (Math.abs(pixelDelta) > 10) {
              const minutesDelta = Math.round((pixelDelta / pixelsPerMinute) / 15) * 15; 
              if (minutesDelta !== 0) {
                  const newStart = new Date(new Date(event.start).getTime() + minutesDelta * 60000);
                  const newEnd = new Date(new Date(event.end).getTime() + minutesDelta * 60000);
                  executeIAAction({
                      type: "UPDATE_EVENT",
                      payload: {
                          eventId: event.id,
                          start: newStart.toISOString(),
                          end: newEnd.toISOString()
                      }
                  }, "user");
              }
          }
          setDragOffsetY(0);
      };

      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, dragOffsetY, pixelsPerMinute, event, executeIAAction, throttledMove]);

  const colorStyles = {
    blue: 'bg-blue-100/90 border-blue-500 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100',
    green: 'bg-green-100/90 border-green-500 text-green-900 dark:bg-green-900/50 dark:text-green-100',
    red: 'bg-red-100/90 border-red-500 text-red-900 dark:bg-red-900/50 dark:text-red-100',
    yellow: 'bg-yellow-100/90 border-yellow-500 text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-100',
    purple: 'bg-purple-100/90 border-purple-500 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100',
    orange: 'bg-orange-100/90 border-orange-500 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100',
  };

  const renderTop = staticTop + dragOffsetY;

  // --- ADAPTIVE RENDERING LOGIC ---
  
  // Executor: Minimalist
  const isExecutor = personality === 'disciplinado';
  const isOverloaded = personality === 'sobrecarregado';

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => { 
          if(Math.abs(dragOffsetY) < 5) { 
              e.stopPropagation(); 
              onClick(event); 
          }
      }}
      className={`
        absolute left-0 right-2 rounded-lg cursor-pointer shadow-sm transition-all ease-in-out will-change-transform group overflow-hidden
        ${colorStyles[event.color] || colorStyles.blue}
        ${isExecutor ? 'border-l-2' : 'border-l-4'} 
        ${isDragging ? 'z-50 opacity-90 cursor-grabbing scale-[1.02] shadow-xl' : 'cursor-grab'}
        ${isPast && !isDragging ? 'opacity-50 grayscale-[0.3] hover:opacity-100 hover:grayscale-0' : ''}
        ${isNext && !isDragging ? 'ring-2 ring-purple-400 ring-offset-1 dark:ring-offset-black shadow-lg shadow-purple-500/20' : ''}
        hover:brightness-95 hover:z-20 hover:shadow-md
      `}
      style={{
        top: `${renderTop}px`,
        height: `${height}px`,
        transition: isDragging ? 'none' : 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s',
        ...style
      }}
    >
      <div className="flex flex-col h-full overflow-hidden pointer-events-none select-none relative p-1.5">
        
        {/* Header Line */}
        <div className="flex justify-between items-start gap-1">
            <span className={`font-bold leading-tight truncate flex-1 ${isExecutor ? 'text-[10px]' : 'text-xs'}`}>
                {event.title}
            </span>
            
            {/* Context Icons */}
            <div className="flex items-center gap-1">
                {isNext && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse flex-shrink-0"></span>}
                {isOverloaded && durationMinutes > 60 && (
                    <AlertTriangle size={10} className="text-red-500" />
                )}
            </div>
        </div>
        
        {/* Time / Details */}
        {height > 35 && (
            <div className={`flex items-center gap-1 opacity-80 font-mono mt-0.5 ${isExecutor ? 'text-[9px]' : 'text-[10px]'}`}>
                <Clock size={8} />
                <span>{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</span>
            </div>
        )}

        {/* Action Overlay (Only for Overloaded Profile on Hover) */}
        {isOverloaded && !isDragging && (
            <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <button 
                    onClick={handleShorten}
                    className="p-1 bg-white/50 hover:bg-white text-gray-700 rounded-full shadow-sm text-[8px] font-bold flex items-center gap-1 backdrop-blur-sm"
                    title="Encurtar em 15m"
                >
                    <Zap size={10} /> -15m
                </button>
            </div>
        )}

        {/* Simple Hover Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm transition-opacity delay-300 pointer-events-none">
            {durationText}
        </div>

        {isDragging && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] text-[10px] font-bold text-custom-soil">
                {format(new Date(new Date(event.start).getTime() + dragOffsetY * (60000 / pixelsPerMinute)), 'HH:mm')}
            </span>
        )}
      </div>
    </div>
  );
};
