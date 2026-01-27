
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

// --- TASK FLOW / WORKFLOW TYPES ---

export type WorkflowStepStatus = 'locked' | 'available' | 'completed';

export type WorkflowActionType = 
  | { type: 'SEND_EMAIL'; payload: { to: string; template: string } }
  | { type: 'NOTIFY_SECTOR'; payload: { sector: string; message: string } }
  | { type: 'NONE' };

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: WorkflowStepStatus;
  action?: WorkflowActionType;
  assignedTo?: {
      id: string;
      name: string;
      avatarUrl?: string;
  };
  responsible?: string; // User ID
}

export interface IAActionHistory {
  id: string;
  actionType: string;
  confirmed: boolean;
  timestamp: string;
  details?: string;
}

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  steps: WorkflowStep[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  totalSteps: number;
  completedSteps: number;
  ownerId?: string; 
  iaHistory?: IAActionHistory[]; 
}

export interface WorkflowTemplate {
    id: string;
    title: string;
    steps: {
        title: string;
        order: number;
        defaultResponsible?: string;
    }[];
}

export interface WorkflowLog {
  id: string;
  workflowId: string;
  stepId: string;
  userId: string; 
  taskId: string; 
  action: 'started' | 'completed';
  timestamp: string;
  metadata?: any;
}

export type WorkflowMetrics = {
  totalSteps: number;
  completedSteps: number;
  completionRate: number;
}

export type UserMetrics = {
  userId: string;
  completedSteps: number;
  workflowsInvolved: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: TaskPriority;
  description?: string;
  teamId?: string;
  assigneeId?: string; 
  estimatedTime?: number; 
  workflow?: Workflow; 
}

export type UserRole = 'admin' | 'manager' | 'member';

// --- SAAS & PLANS ---
export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';

export interface PlanLimits {
    maxWorkflows: number;
    aiSuggestionsPerDay: number;
    canViewTeamAnalytics: boolean;
}

export interface UserUsage {
    workflowsCount: number;
    aiSuggestionsToday: number;
    lastUsageReset: string; // ISO Date
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
  plan: PlanType; // New
}

export interface Company {
    id: string;
    name: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  companyId?: string; 
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

export type ViewMode = 'day' | 'week' | 'month' | 'tasks' | 'routine' | 'analytics';

export interface IAMessage {
  id: string;
  sender: "user" | "maya";
  text: string;
  type?: 'text' | 'image' | 'audio' | 'video';
  content?: string;
}

export interface TimeSuggestion {
    start: string;
    end: string;
    reason: string;
}

export interface FocusSession {
    isActive: boolean;
    taskId: string | null;
    startTime: string | null; 
    plannedDuration: number; 
    completedAt?: string; 
    elapsedMinutes?: number;
}

export interface WeeklyStats {
  weekLabel: string;
  productivityScore: number;
  completedTasks: number;
  postponedTasks: number;
  burnoutLevel: "low" | "medium" | "high";
}

// --- REPORTING ---
export interface WeeklyReportData {
  week: string;
  totalCompletedSteps: number;
  productivityScore: number;
  burnoutAlerts: number;
  summary: string;
  highlights: string[];
  suggestions: string[];
}

// --- SCORE SYSTEM ---
export interface ScoreBreakdown {
  focusPoints: number;      
  taskPoints: number;       
  consistencyBonus: number; 
  iaBonus: number;          
  penalties: number;        
  total: number;
  streakDays: number;
  completedTasksCount: number;
  focusSessionsCount: number;
  iaAcceptanceRate: number; 
}

export interface ProductivityScore {
  date: string;
  focusMinutes: number;
  tasksCompleted: number;
  score: number;
  breakdown: ScoreBreakdown;
}

export interface DailySummary {
  date: string;
  focusSessions: number;
  focusMinutes: number;
  tasksCompleted: number;
  score: number;
  breakdown: ScoreBreakdown;
  message: string;
  suggestionForTomorrow: string;
}

export interface FocusSuggestion {
  taskId: string;
  title: string;
  estimatedMinutes: number;
  expectedScoreGain: number;
}

export type SystemDecision =
  | { type: 'SUGGEST_FOCUS'; payload: FocusSuggestion }
  | { type: 'SHOW_DAILY_SUMMARY'; payload: DailySummary }
  | { type: 'EXPLAIN_SCORE' }
  | { type: 'SUGGEST_NEXT_STEP'; payload: { workflowId: string; workflowTitle: string; step: WorkflowStep } }
  | { type: 'BURNOUT_ALERT'; payload: { riskLevel: 'medium' | 'high'; message: string } } 
  | { type: 'NONE' };

export interface IAContext {
  hasActiveFocus: boolean;
  focusDoneToday: boolean;
  pendingTasks: Task[];
  nextTask?: Task;
  dailySummary?: DailySummary | null;
  scoreBreakdown: ScoreBreakdown;
  planUsage?: { plan: PlanType, used: number, limit: number }; // Injected for AI
}

export interface TaskChange {
    taskId: string;
    taskTitle: string;
    from: string; 
    to: string;   
}

export interface NegotiationOption {
    label: string;
    action: IAAction;
    style?: 'primary' | 'secondary' | 'outline';
}

export type IAAction =
  | {
      type: "CREATE_TASK";
      payload: {
        title: string;
        priority?: TaskPriority;
        dueDate?: string; 
        assigneeId?: string;
      };
    }
  | {
      type: "CREATE_EVENT";
      payload: {
        title: string;
        start: string; 
        end?: string; 
        category?: EventCategory;
        location?: string;
      };
    }
  | {
      type: "UPDATE_EVENT";
      payload: {
        eventId: string;
        start: string;
        end: string;
      };
    }
  | {
      type: "RESCHEDULE_TASK";
      payload: {
        taskId?: string;
        taskIds?: string[];
        newDate: string; 
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
        action: IAAction; 
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
      type: "SHOW_SUMMARY"; 
      payload: DailySummary;
    }
  | {
      type: "COMPLETE_STEP";
      payload: {
          taskId: string;
          stepId: string;
          workflowId: string;
      };
    }
  | {
      type: "PROPOSE_WORKFLOW"; 
      payload: {
          title: string;
          steps: string[];
          description?: string;
      };
    }
  | {
      type: "SEND_REPORT"; // New: Report Action
      payload: WeeklyReportData;
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

export interface IAResponse {
  message: string;
  actions: IAAction[];
}

export interface PendingActionState {
  originalAction: IAAction; 
  question: string;         
}

export interface IAHistoryItem {
  timestamp: string;
  action: IAAction;
  source: "user" | "ai";
}

export interface BurnoutAnalysis {
    level: "high" | "medium" | "low";
    signals: string[];
    workloadScore: number;
    reason?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface ScoreHistory {
  id: string;
  score: number;
  createdAt: Date;
}

export type PersonalityType = "disciplinado" | "sobrecarregado" | "neutro";

export interface AgentSuggestion {
    id: string;
    type: 'optimization' | 'warning' | 'pattern' | 'focus_coach' | 'daily_summary' | 'workflow_step';
    message: string;
    actionLabel: string;
    actionData: IAAction;
}

export interface QuarterlyGoal {
    id: string;
    title: string;
    achieved: boolean;
    quarter: string;
    metric?: string; 
    targetValue?: string;
}
