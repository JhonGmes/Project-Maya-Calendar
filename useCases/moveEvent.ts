
import { AppState } from "../types/appState";
import { hasConflict } from "../domain/hasConflict";
import { findNextFreeSlot } from "../domain/findNextFreeSlot";
import { format } from "date-fns";

export function moveEvent(
  state: AppState,
  payload: {
    eventId: string;
    newStart: Date;
    newEnd: Date;
  }
): AppState {
  const conflict = hasConflict(
    state.events,
    {
      start: payload.newStart,
      end: payload.newEnd,
    },
    payload.eventId
  );

  if (conflict) {
    // 1. Calculate duration
    const duration = payload.newEnd.getTime() - payload.newStart.getTime();
    
    // 2. Find next free slot
    const freeSlot = findNextFreeSlot(state.events, payload.newStart, duration, payload.eventId);
    const timeStr = format(freeSlot.start, "HH:mm");

    // 3. Return state with Suggestion (instead of silent block)
    return {
        ...state,
        agentSuggestion: {
            id: `conflict-${Date.now()}`,
            type: 'warning',
            message: `Conflito detectado. O horário está ocupado. Posso mover para ${timeStr}?`,
            actionLabel: `Mover para ${timeStr}`,
            actionData: {
                type: "UPDATE_EVENT",
                payload: {
                    eventId: payload.eventId,
                    start: freeSlot.start.toISOString(),
                    end: freeSlot.end.toISOString()
                }
            }
        }
    };
  }

  const events = state.events.map(event =>
    event.id === payload.eventId
      ? {
          ...event,
          start: payload.newStart,
          end: payload.newEnd,
        }
      : event
  );

  return {
    ...state,
    events,
    agentSuggestion: null // Clear any previous suggestion on success
  };
}
