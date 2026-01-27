
import { CalendarEvent, AgentSuggestion } from '../types';

export interface AppState {
  events: CalendarEvent[];
  agentSuggestion: AgentSuggestion | null;
  // Future: tasks: Task[];
}

export const initialState: AppState = {
  events: [],
  agentSuggestion: null
};
