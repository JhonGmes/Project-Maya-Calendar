
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
  assigneeId?: string; // Phase 7
  estimatedTime?: number; // Estimated time in hours (default 1)
}

// Phase 7: Roles
export type UserRole = 'admin' | 'manager' | 'member';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role?: string; // Legacy string, prefer using UserRole logic in App
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
  members?: TeamMember[];
}

export interface TeamMember {
    userId: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
}

export interface AppSettings {
  showWeekends: boolean;
  startHour: number;
  endHour: number;
}

// Phase 6: Analytics
export type ViewMode = 'day' | 'week' | 'month' | 'tasks' | 'routine' | 'analytics';

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

// Phase 4: Focus Session
export interface FocusSession {
    isActive: boolean;
    taskId: string | null;
    startTime: string | null; // ISO String
    plannedDuration: number; // minutes
}

// Phase 6: Weekly Stats
export interface WeeklyStats {
  weekLabel: string; // "Semana 12" or "10/05 - 17/05"
  productivityScore: number;
  completedTasks: number;
  postponedTasks: number;
  burnoutLevel: "low" | "medium" | "high";
}

// --- FASE 2 & 3: IA COMO AGENTE DO SISTEMA ---

// Definição da mudança individual em uma reorganização
export interface TaskChange {
    taskId: string;
    taskTitle: string;
    from: string; // ISO String
    to: string;   // ISO String
}

// Phase 5: Negotiation Option
export interface NegotiationOption {
    label: string;
    action: IAAction;
    style?: 'primary' | 'secondary' | 'outline';
}

// Definição estrita das ações que a IA pode solicitar
export type IAAction =
  | {
      type: "CREATE_TASK";
      payload: {
        title: string;
        priority?: TaskPriority;
        dueDate?: string; // ISO String
        assigneeId?: string; // Phase 7
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
      type: "REORGANIZE_WEEK";
      payload: {
          changes: TaskChange[];
          reason: string;
      };
    }
  | {
      type: "CHANGE_SCREEN";
      payload: ViewMode;
    }
  | {
      type: "START_FOCUS";
      payload: {
          taskId: string;
          duration?: number;
      };
    }
  | {
      type: "END_FOCUS";
      payload: {
          completed: boolean;
      };
    }
  | {
      type: "ASK_CONFIRMATION";
      payload: {
        message: string;
        action: IAAction; // Ação aninhada a ser executada após confirmação
      };
    }
  | {
      type: "NEGOTIATE_DEADLINE";
      payload: {
          taskTitle: string;
          reason: string;
          options: NegotiationOption[];
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

// Phase 3: Histórico de Ações
export interface IAHistoryItem {
  timestamp: string;
  action: IAAction;
  source: "user" | "ai";
}

export interface BurnoutAnalysis {
    level: "high" | "medium" | "low";
    signals: string[];
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
    type: 'optimization' | 'warning' | 'pattern' | 'focus_coach';
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
    metric?: string; // New field for smart goals
    targetValue?: string; // New field for smart goals
}
