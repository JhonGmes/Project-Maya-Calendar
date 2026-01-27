
import { CalendarEvent } from "../types";

export function hasConflict(
  events: CalendarEvent[],
  candidate: {
    start: Date;
    end: Date;
  },
  ignoreEventId?: string
): boolean {
  return events.some(event => {
    if (event.id === ignoreEventId) return false;

    // Ensure we are working with timestamps for accurate comparison
    const candidateStart = new Date(candidate.start).getTime();
    const candidateEnd = new Date(candidate.end).getTime();
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();

    // Overlap condition: Start A < End B && End A > Start B
    return candidateStart < eventEnd && candidateEnd > eventStart;
  });
}
