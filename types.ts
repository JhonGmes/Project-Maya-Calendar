
export type EventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
export type EventCategory = 'routine' | 'work' | 'meeting' | 'personal' | 'health';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: EventColor;
  category: EventCategory;
  completed: boolean;
  isAllDay: boolean;
  description?: string;
  location?: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: TaskPriority;
  description?: string;
  teamId?: string; 
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role?: string;
  bio?: string;
  workingHours: {
    start: string;
    end: string;
  };
  theme: 'light' | 'dark';
  notifications: boolean;
  defaultReminder: number;
}

// Phase 27: Company
export interface Company {
    id: string;
    name: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  companyId?: string; // Phase 27
}

export interface AppSettings {
  showWeekends: boolean;
  startHour: number;
  endHour: number;
}

export type ViewMode = 'day' | 'week' | 'month' | 'tasks' | 'routine';

export interface IAMessage {
  id: string;
  sender: "user" | "maya";
  text: string;
  type?: 'text' | 'image' | 'audio';
  content?: string;
}

// Phase 28: Suggestions
export interface TimeSuggestion {
    start: string;
    end: string;
    reason: string;
}

// --- FASE 2: IA COMO AGENTE DO SISTEMA ---

// Definição estrita das ações que a IA pode solicitar
export type IAAction =
  | {
      type: "CREATE_TASK";
      payload: {
        title: string;
        priority?: TaskPriority;
        dueDate?: string; // ISO String
      };
    }
  | {
      type: "CREATE_EVENT";
      payload: {
        title: string;
        start: string; // ISO String
        end?: string; // ISO String
        category?: EventCategory;
        location?: string;
      };
    }
  | {
      type: "RESCHEDULE_TASK";
      payload: {
        taskId?: string;
        taskIds?: string[];
        newDate: string; // ISO String
      };
    }
  | {
      type: "CHANGE_SCREEN";
      payload: ViewMode;
    }
  | {
      type: "ASK_CONFIRMATION";
      payload: {
        message: string;
        action: IAAction; // Ação aninhada a ser executada após confirmação
      };
    }
  | {
      type: "REPLY";
      payload: {
        message: string;
      };
    }
  | {
      type: "NO_ACTION";
    };

// Estrutura da resposta da IA vinda do Engine
export interface IAResponse {
  message: string;
  actions: IAAction[];
}

// Estado de ação pendente para UI de confirmação
export interface PendingActionState {
  originalAction: IAAction; // Ação completa (ex: CREATE_TASK)
  question: string;         // A pergunta feita pela IA
}

// Phase 18
export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Phase 19
export interface ScoreHistory {
  id: string;
  score: number;
  createdAt: Date;
}

// Phase 22
export type PersonalityType = "disciplinado" | "sobrecarregado" | "neutro";

export interface AgentSuggestion {
    id: string;
    type: 'optimization' | 'warning' | 'pattern';
    message: string;
    actionLabel: string;
    actionData: IAAction;
}

// Phase 26
export interface QuarterlyGoal {
    id: string;
    title: string;
    achieved: boolean;
    quarter: string;
}
