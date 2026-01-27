
import { AppState } from "../types/appState";
import { AppAction } from "../types/actions";

import { createEvent } from "../useCases/createEvent";
import { moveEvent } from "../useCases/moveEvent";
import { resizeEvent } from "../useCases/resizeEvent";
import { deleteEvent } from "../useCases/deleteEvent";
import { bulkUpdateEvents } from "../useCases/bulkUpdateEvents";

export function IAActionEngine(
  state: AppState,
  action: AppAction
): AppState {
  switch (action.type) {
    case "CREATE_EVENT":
      return createEvent(state, action.payload);

    case "MOVE_EVENT":
      return moveEvent(state, action.payload);

    case "RESIZE_EVENT":
      return resizeEvent(state, action.payload);

    case "DELETE_EVENT":
      return deleteEvent(state, action.payload);

    case "SET_EVENTS":
      return {
          ...state,
          events: action.payload
      };

    case "APPLY_BULK_UPDATE":
      return bulkUpdateEvents(state, action.payload);

    case "SET_SUGGESTION":
      return {
          ...state,
          agentSuggestion: action.payload
      };

    default:
      return state;
  }
}
