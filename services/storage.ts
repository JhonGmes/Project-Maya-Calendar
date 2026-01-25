import { CalendarEvent, Task, UserProfile } from '../types';
import { supabase } from './supabaseClient';

const LOCAL_STORAGE_KEYS = {
  EVENTS: 'maya_events',
  TASKS: 'maya_tasks',
  PROFILE: 'maya_profile',
  LOCAL_MODE: 'maya_local_mode'
};

const defaultProfile: UserProfile = {
  id: 'user-local',
  name: 'Convidado Local',
  email: 'local@maya.app',
  theme: 'light',
  workingHours: { start: '09:00', end: '18:00' },
  notifications: true,
  defaultReminder: 15,
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const mapSupabaseEvent = (e: any): CalendarEvent => ({
  id: e.id,
  title: e.title,
  start: new Date(e.start_time),
  end: new Date(e.end_time),
  color: e.color as any,
  category: e.category as any,
  completed: e.completed,
  isAllDay: e.is_all_day,
  description: e.description,
  location: e.location
});

const mapSupabaseTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  completed: t.completed,
  dueDate: t.due_date ? new Date(t.due_date) : undefined,
  priority: t.priority as any,
  description: t.description
});

let isLocalMode = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.LOCAL_MODE) === 'true' : false;

export const StorageService = {
  setLocalMode: (enable: boolean) => {
    isLocalMode = enable;
    if (enable) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LOCAL_MODE, 'true');
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOCAL_MODE);
    }
  },
  
  isLocalMode: () => isLocalMode,

  getEvents: async (): Promise<CalendarEvent[]> => {
    if (!isLocalMode && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.from('events').select('*').eq('user_id', user.id);
          if (!error && data) return data.map(mapSupabaseEvent);
        }
      } catch (err) { console.warn("Supabase unavailable, falling back to local.", err); }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data).map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) : [];
  },

  saveEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    if (!isLocalMode && supabase) {
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
           const eventId = (event.id && event.id.length > 20) ? event.id : generateId();
           const payload = {
             id: eventId, user_id: user.id, title: event.title, start_time: event.start.toISOString(),
             end_time: event.end.toISOString(), color: event.color, category: event.category,
             completed: event.completed, is_all_day: event.isAllDay, description: event.description, location: event.location
           };
           const { data, error } = await supabase.from('events').upsert(payload).select();
           if (!error && data) return mapSupabaseEvent(data[0]);
           if (error) throw error;
         }
       } catch (err) { throw err; }
    }
    const events = await StorageService.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    const eventToSave = { ...event, id: event.id || generateId() };
    const newEvents = index >= 0 ? [...events.slice(0, index), eventToSave, ...events.slice(index + 1)] : [...events, eventToSave];
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(newEvents));
    return eventToSave;
  },

  deleteEvent: async (id: string) => {
    if (!isLocalMode && supabase) {
       try { await supabase.from('events').delete().eq('id', id); } catch (err) { console.warn("Error deleting", err); }
    }
    const events = await StorageService.getEvents();
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(events.filter(e => e.id !== id)));
  },

  getTasks: async (): Promise<Task[]> => {
    if (!isLocalMode && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id);
          if (!error && data) return data.map(mapSupabaseTask);
        }
      } catch (err) { console.warn("Supabase unavailable", err); }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data).map((t: any) => ({ ...t, dueDate: t.dueDate ? new Date(t.dueDate) : undefined })) : [];
  },

  saveTask: async (task: Task): Promise<Task> => {
    if (!isLocalMode && supabase) {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const taskId = (task.id && task.id.length > 20) ? task.id : generateId();
         const payload = {
           id: taskId, user_id: user.id, title: task.title, completed: task.completed,
           priority: task.priority, due_date: task.dueDate ? task.dueDate.toISOString() : null, description: task.description
         };
         const { data, error } = await supabase.from('tasks').upsert(payload).select();
         if (error) throw error;
         return mapSupabaseTask(data[0]);
       }
    }
    const tasks = await StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    const taskToSave = { ...task, id: task.id || generateId() };
    const newTasks = index >= 0 ? [...tasks.slice(0, index), taskToSave, ...tasks.slice(index + 1)] : [...tasks, taskToSave];
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
    return taskToSave;
  },

  getProfile: async (): Promise<UserProfile> => {
    if (!isLocalMode && supabase) {
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
           const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
           if (data) return {
               id: data.id, name: data.name || user.email?.split('@')[0], email: data.email || user.email,
               avatarUrl: data.avatar_url, phone: data.phone, role: data.role, bio: data.bio,
               theme: data.theme, workingHours: data.working_hours, notifications: data.notifications, defaultReminder: 15
             };
         }
       } catch (err) { console.warn("Supabase profile error", err); }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : defaultProfile;
  },

  updateProfile: async (profile: Partial<UserProfile>) => {
    if (!isLocalMode && supabase) {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const payload = {
           name: profile.name, theme: profile.theme, working_hours: profile.workingHours,
           notifications: profile.notifications, avatar_url: profile.avatarUrl, phone: profile.phone, role: profile.role, bio: profile.bio
         };
         const { data, error } = await supabase.from('profiles').update(payload).eq('id', user.id).select();
         if (!error) return { ...profile, ...data[0] } as UserProfile;
       }
    }
    const current = await StorageService.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  },
  
  generateId
};