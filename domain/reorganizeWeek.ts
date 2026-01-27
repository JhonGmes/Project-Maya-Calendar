
import { CalendarEvent } from "../types";
import { snapToMinutes } from "../utils/snapToMinutes";
import { findNextFreeSlot } from "./findNextFreeSlot";

export function reorganizeWeek(events: CalendarEvent[]): CalendarEvent[] {
  // 1. Sort by start time to process sequentially
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const result: CalendarEvent[] = [];

  for (const event of sorted) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = end.getTime() - start.getTime();

    // 2. Find the next free slot considering events already placed in 'result'
    // We snap the start time to ensure grid alignment
    const snappedStart = snapToMinutes(start);
    
    const slot = findNextFreeSlot(
      result, // Check conflicts against events we've already reorganized
      snappedStart,
      duration,
      event.id
    );

    result.push({
      ...event,
      start: slot.start,
      end: slot.end,
    });
  }

  return result;
}
