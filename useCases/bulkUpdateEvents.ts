
import { AppState } from "../types/appState";
import { CalendarEvent } from "../types";

export function bulkUpdateEvents(
  state: AppState,
  newEvents: CalendarEvent[]
): AppState {
  // Create a map for faster lookup of existing events if needed, 
  // but here we are replacing/merging the state based on IDs.
  
  // Strategy: Replace events in the state with the provided newEvents if IDs match,
  // or add them if they are new (though reorganize usually just updates).
  
  // For a pure reorganize, we might want to replace the entire list or just the modified ones.
  // Assuming 'newEvents' contains the *entire* set of events for the period or just the modified ones.
  // To be safe and simple: We iterate state events and update them if they exist in payload.
  
  const payloadMap = new Map(newEvents.map(e => [e.id, e]));
  
  const updatedEvents = state.events.map(event => {
      const update = payloadMap.get(event.id);
      return update ? update : event;
  });

  return {
    ...state,
    events: updatedEvents,
    agentSuggestion: null // Clear suggestion after application
  };
}
