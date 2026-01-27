
import { AppState } from "../types/appState";
import { hasConflict } from "../domain/hasConflict";

export function resizeEvent(
  state: AppState,
  payload: {
    eventId: string;
    newEnd: Date;
  }
): AppState {
  const event = state.events.find(e => e.id === payload.eventId);
  if (!event) return state;

  const conflict = hasConflict(
    state.events,
    {
      start: event.start,
      end: payload.newEnd,
    },
    payload.eventId
  );

  if (conflict) {
     return {
        ...state,
        agentSuggestion: {
            id: `conflict-resize-${Date.now()}`,
            type: 'warning',
            message: `Não é possível estender o evento pois conflita com o próximo.`,
            actionLabel: 'Manter Original',
            actionData: {
                type: "NO_ACTION"
            }
        }
    };
  }

  const events = state.events.map(e =>
    e.id === payload.eventId
      ? { ...e, end: payload.newEnd }
      : e
  );

  return {
    ...state,
    events,
    agentSuggestion: null
  };
}
