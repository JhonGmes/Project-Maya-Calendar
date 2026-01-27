
import React, { useMemo } from 'react';
import { CalendarEvent } from '../types';
import { DayEventCard } from './DayEventCard';
import { format, eachHourOfInterval, setHours, setMinutes, isSameDay } from 'date-fns';

interface DayTimeGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  date: Date;
}

export const DayTimeGrid: React.FC<DayTimeGridProps> = ({ events, onEventClick, date }) => {
  const START_HOUR = 6;
  const END_HOUR = 23;
  const PIXELS_PER_MINUTE = 1.5; // Controls the height of the calendar
  const HOURS = eachHourOfInterval({
    start: setHours(new Date(), START_HOUR),
    end: setHours(new Date(), END_HOUR)
  });

  // Filter events for this day
  const dayEvents = useMemo(() => {
    return events.filter(e => isSameDay(new Date(e.start), date));
  }, [events, date]);

  // Handle Overlaps for Layout
  // Simple algorithm: Group by hour, then index them
  const processedEvents = useMemo(() => {
      // Calculate overlaps
      const positionedEvents = dayEvents.map(event => {
          // Find overlapping events
          const overlaps = dayEvents.filter(other => 
              other.id !== event.id && 
              new Date(event.start) < new Date(other.end) && 
              new Date(event.end) > new Date(other.start)
          );
          
          // Determine "lane"
          // Sort by ID to ensure deterministic order
          const allColliding = [event, ...overlaps].sort((a,b) => a.id.localeCompare(b.id));
          const index = allColliding.indexOf(event);
          const total = allColliding.length;

          return { event, index, total };
      });
      return positionedEvents;
  }, [dayEvents]);

  return (
    <div className="relative w-full h-full bg-white/40 dark:bg-white/5 rounded-2xl overflow-y-auto overflow-x-hidden border border-white/40 dark:border-white/5 custom-scrollbar">
      <div className="relative min-h-[1600px]"> 
        {/* Grid Lines */}
        {HOURS.map((hour) => (
          <div 
            key={hour.toString()} 
            className="absolute w-full border-t border-gray-200 dark:border-white/10 flex"
            style={{ top: (hour.getHours() - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
          >
            <span className="w-12 text-right pr-2 text-xs text-gray-400 -mt-2 bg-transparent">
              {format(hour, 'HH:mm')}
            </span>
            <div className="flex-1"></div>
          </div>
        ))}

        {/* Current Time Indicator */}
        {isSameDay(date, new Date()) && (
            <div 
                className="absolute left-12 right-0 border-t-2 border-red-400 z-10 pointer-events-none flex items-center"
                style={{ top: ((new Date().getHours() - START_HOUR) * 60 + new Date().getMinutes()) * PIXELS_PER_MINUTE }}
            >
                <div className="w-2 h-2 bg-red-400 rounded-full -ml-1"></div>
            </div>
        )}

        {/* Events */}
        <div className="absolute top-0 bottom-0 left-14 right-2">
            {processedEvents.map(({ event, index, total }) => {
                // Logic to hide if too many overlaps
                const MAX_VISIBLE = 3;
                if (index >= MAX_VISIBLE) return null;

                const widthPercent = 100 / Math.min(total, MAX_VISIBLE);
                const leftPercent = index * widthPercent;
                
                // Show "Hidden Events" pill on the last visible card if there are more
                const showHiddenIndicator = index === MAX_VISIBLE - 1 && total > MAX_VISIBLE;
                const hiddenCount = total - MAX_VISIBLE;

                return (
                    <React.Fragment key={event.id}>
                        <DayEventCard
                            event={event}
                            onClick={onEventClick}
                            pixelsPerMinute={PIXELS_PER_MINUTE}
                            startHour={START_HOUR}
                            style={{
                                width: `calc(${widthPercent}% - 4px)`,
                                left: `${leftPercent}%`,
                                zIndex: index + 1
                            }}
                        />
                        {showHiddenIndicator && (
                            <div 
                                className="absolute bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-50 animate-fade-in"
                                style={{
                                    top: (((new Date(event.start).getHours() - START_HOUR) * 60 + new Date(event.start).getMinutes()) * PIXELS_PER_MINUTE) + 5,
                                    left: `${leftPercent + widthPercent}%`, // Position to the right of the card
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                +{hiddenCount} mais
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
      </div>
    </div>
  );
};
