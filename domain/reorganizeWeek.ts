
import { CalendarEvent, EventReorgPlan } from "../types";
import { snapToMinutes } from "../utils/snapToMinutes";
import { findNextFreeSlot } from "./findNextFreeSlot";
import { isPast, differenceInMinutes, startOfDay, addDays } from "date-fns";

export function reorganizeWeek(events: CalendarEvent[]): EventReorgPlan[] {
  const now = new Date();
  
  // 1. Filter only future events for the current/next week context
  const futureEvents = events.filter(e => 
      !e.completed && new Date(e.start).getTime() > now.getTime()
  );

  // 2. Sort by Priority (Implicit)
  // Meeting > Work > Routine > Personal
  const priorityWeight = {
      meeting: 4,
      work: 3,
      routine: 2,
      personal: 1,
      health: 3
  };

  const sorted = [...futureEvents].sort((a, b) => {
      // Primary sort: Category Importance
      const weightDiff = (priorityWeight[b.category] || 0) - (priorityWeight[a.category] || 0);
      if (weightDiff !== 0) return weightDiff;
      
      // Secondary sort: Original Start Time (preserve chronological order if priority matches)
      return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const plan: EventReorgPlan[] = [];
  const placedEvents: CalendarEvent[] = []; // Virtual state of the new calendar

  for (const event of sorted) {
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    const duration = originalEnd.getTime() - originalStart.getTime();

    // Strategy: Try to place it as close as possible to original time, but avoid overlaps
    // Use snapToMinutes to keep grid clean
    const snappedStart = snapToMinutes(originalStart);
    
    const slot = findNextFreeSlot(
      placedEvents, // Check conflicts against events ALREADY placed in the new plan
      snappedStart,
      duration,
      event.id
    );

    // Check if moved significantly (> 15 mins)
    const isMoved = Math.abs(differenceInMinutes(slot.start, originalStart)) > 15;
    
    let reason = "Mantido no horário original.";
    if (isMoved) {
        if (priorityWeight[event.category] >= 3) {
            reason = "Realocado para garantir prioridade e evitar conflitos.";
        } else {
            reason = "Movido para acomodar eventos de maior prioridade.";
        }
        
        // Add visual spacing check (buffer)
        // Simple logic: if previous event ended just now, maybe add 5 min buffer?
        // (Skipped for simplicity in this version, relying on findNextFreeSlot)
    }

    const newEvent = {
        ...event,
        start: slot.start,
        end: slot.end
    };

    placedEvents.push(newEvent);

    if (isMoved) {
        plan.push({
            originalEventId: event.id,
            title: event.title,
            oldStart: originalStart.toISOString(),
            oldEnd: originalEnd.toISOString(),
            newStart: slot.start.toISOString(),
            newEnd: slot.end.toISOString(),
            reason
        });
    }
  }

  return plan;
}
