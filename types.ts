
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
