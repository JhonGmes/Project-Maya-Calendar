
import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { DayEventCard } from './DayEventCard';
import { DayHeader } from './DayHeader';
import { format, eachHourOfInterval, setHours, setMinutes, isSameDay, isPast, isFuture } from 'date-fns';
import { useApp } from '../context/AppContext';

interface DayTimeGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  date: Date;
}

export const DayTimeGrid: React.FC<DayTimeGridProps> = ({ events, onEventClick, date }) => {
  const { profile, personality } = useApp(); // Get Adaptive Context
  
  const START_HOUR = 6;
  const END_HOUR = 23;
  const PIXELS_PER_MINUTE = 1.5; 
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60000); 
      return () => clearInterval(interval);
  }, []);

  const HOURS = eachHourOfInterval({
    start: setHours(new Date(), START_HOUR),
    end: setHours(new Date(), END_HOUR)
  });

  const dayEvents = useMemo(() => {
    return events.filter(e => isSameDay(new Date(e.start), date));
  }, [events, date]);

  const nextEventId = useMemo(() => {
      if (!isSameDay(date, now)) return null;
      const futureEvents = dayEvents
        .filter(e => isFuture(new Date(e.start)))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      return futureEvents.length > 0 ? futureEvents[0].id : null;
  }, [dayEvents, date, now]);

  const processedEvents = useMemo(() => {
      const positionedEvents = dayEvents.map(event => {
          const overlaps = dayEvents.filter(other => 
              other.id !== event.id && 
              new Date(event.start) < new Date(other.end) && 
              new Date(event.end) > new Date(other.start)
          );
          
          const allColliding = [event, ...overlaps].sort((a,b) => a.id.localeCompare(b.id));
          const index = allColliding.indexOf(event);
          const total = allColliding.length;

          return { event, index, total };
      });
      return positionedEvents;
  }, [dayEvents]);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = START_HOUR * 60;
  const currentTimeTop = (currentMinutes - startMinutes) * PIXELS_PER_MINUTE;

  return (
    <div className="flex flex-col h-full">
      {/* 1. Intelligent Header */}
      <div className="flex-shrink-0 mb-2">
          <DayHeader date={date} events={events} profile={profile} personality={personality} />
      </div>

      {/* 2. Scrollable Grid */}
      <div className="relative flex-1 bg-white/40 dark:bg-white/5 rounded-2xl overflow-y-auto overflow-x-hidden border border-white/40 dark:border-white/5 custom-scrollbar">
        <div className="relative min-h-[1600px]"> 
            {HOURS.map((hour) => (
            <div 
                key={hour.toString()} 
                className="absolute w-full border-t border-gray-200 dark:border-white/10 flex group"
                style={{ top: (hour.getHours() - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
            >
                <span className="w-12 text-right pr-2 text-xs text-gray-400 -mt-2 bg-transparent font-mono group-hover:text-custom-caramel transition-colors">
                {format(hour, 'HH:mm')}
                </span>
                <div className="flex-1 group-hover:bg-gray-50/50 dark:group-hover:bg-white/5 transition-colors"></div>
            </div>
            ))}

            {isSameDay(date, now) && (
                <div 
                    className="absolute left-12 right-0 z-20 pointer-events-none flex items-center transition-all duration-1000 ease-linear"
                    style={{ top: currentTimeTop }}
                >
                    <div className="w-12 text-right pr-2">
                        <span className="text-[10px] font-bold text-red-500 bg-white/80 dark:bg-black/80 px-1 rounded">
                            {format(now, 'HH:mm')}
                        </span>
                    </div>
                    <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 ring-2 ring-red-200 dark:ring-red-900 animate-pulse"></div>
                    <div className="flex-1 h-[2px] bg-red-500 opacity-50 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                </div>
            )}

            <div className="absolute top-0 bottom-0 left-14 right-2">
                {processedEvents.map(({ event, index, total }) => {
                    const MAX_VISIBLE = 3;
                    if (index >= MAX_VISIBLE) return null;

                    const widthPercent = 100 / Math.min(total, MAX_VISIBLE);
                    const leftPercent = index * widthPercent;
                    
                    const showHiddenIndicator = index === MAX_VISIBLE - 1 && total > MAX_VISIBLE;
                    const hiddenCount = total - MAX_VISIBLE;

                    const isPastEvent = isPast(new Date(event.end));
                    const isNext = event.id === nextEventId;

                    return (
                        <React.Fragment key={event.id}>
                            <DayEventCard
                                event={event}
                                onClick={onEventClick}
                                pixelsPerMinute={PIXELS_PER_MINUTE}
                                startHour={START_HOUR}
                                isPast={isPastEvent}
                                isNext={isNext}
                                personality={personality} // Adaptive UI Pass-through
                                style={{
                                    width: `calc(${widthPercent}% - 4px)`,
                                    left: `${leftPercent}%`,
                                    zIndex: isNext ? 30 : index + 10
                                }}
                            />
                            {showHiddenIndicator && (
                                <div 
                                    className="absolute bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-50 animate-fade-in"
                                    style={{
                                        top: (((new Date(event.start).getHours() - START_HOUR) * 60 + new Date(event.start).getMinutes()) * PIXELS_PER_MINUTE) + 5,
                                        left: `${leftPercent + widthPercent}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    +{hiddenCount}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
