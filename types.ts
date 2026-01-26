
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

export interface TimeSuggestion {
  start: string;
  end: string;
  reason: string;
  confidence: number;
}

export interface IAMessage {
  id: string;
  sender: "user" | "maya";
  text: string;
  type?: 'text' | 'image' | 'audio';
  content?: string;
}

export interface PendingAction {
  action: any; // IAAction
  question: string;
  data?: any;
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

// Phase 26
export interface QuarterlyGoal {
    id: string;
    title: string;
    achieved: boolean;
    quarter: string;
}
