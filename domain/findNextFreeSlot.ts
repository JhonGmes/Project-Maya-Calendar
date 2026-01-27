
import { CalendarEvent } from "../types";
import { hasConflict } from "./hasConflict";

export function findNextFreeSlot(
  events: CalendarEvent[],
  start: Date,
  durationMs: number,
  ignoreEventId?: string
): { start: Date; end: Date } {
  let cursor = new Date(start);
  
  // Safety limit: check up to 24 hours ahead
  const limit = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  while (cursor < limit) {
    const end = new Date(cursor.getTime() + durationMs);
    
    // Check purely for overlap with existing events
    if (!hasConflict(events, { start: cursor, end }, ignoreEventId)) {
      return { start: cursor, end };
    }

    // Advance 15 minutes
    cursor = new Date(cursor.getTime() + 15 * 60000);
  }
  
  // Fallback: return original if no slot found (UI will handle conflict)
  return { start, end: new Date(start.getTime() + durationMs) };
}
