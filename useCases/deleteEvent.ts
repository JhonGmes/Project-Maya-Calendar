
import { AppState } from "../types/appState";

export function deleteEvent(
  state: AppState,
  payload: { eventId: string }
): AppState {
  return {
    ...state,
    events: state.events.filter(e => e.id !== payload.eventId),
  };
}
