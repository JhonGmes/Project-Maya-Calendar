
import { AppState } from "../types/appState";
import { CalendarEvent } from "../types";
import { hasConflict } from "../domain/hasConflict";

export function createEvent(
  state: AppState,
  event: CalendarEvent
): AppState {
  const conflict = hasConflict(state.events, { start: event.start, end: event.end }, event.id);

  if (conflict) {
    // If conflict detected, ignore the action (State remains unchanged)
    // The UI should have warned the user beforehand via useEventConflict
    return state;
  }

  return {
    ...state,
    events: [...state.events, event],
  };
}
