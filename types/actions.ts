
import { CalendarEvent, AgentSuggestion } from '../types';

export type AppAction =
  | {
      type: "CREATE_EVENT";
      payload: CalendarEvent;
    }
  | {
      type: "MOVE_EVENT";
      payload: {
        eventId: string;
        newStart: Date;
        newEnd: Date;
      };
    }
  | {
      type: "RESIZE_EVENT";
      payload: {
        eventId: string;
        newEnd: Date;
      };
    }
  | {
      type: "DELETE_EVENT";
      payload: {
        eventId: string;
      };
    }
  | {
      type: "SET_EVENTS";
      payload: CalendarEvent[];
    }
  | {
      type: "APPLY_BULK_UPDATE";
      payload: CalendarEvent[];
    }
  | {
      type: "SET_SUGGESTION";
      payload: AgentSuggestion | null;
    };
