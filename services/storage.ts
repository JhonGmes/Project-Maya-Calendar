
import { CalendarEvent, Task, UserProfile, IAMessage, Notification, ScoreHistory, Team, QuarterlyGoal } from '../types';
import { supabase } from './supabaseClient';

const LOCAL_STORAGE_KEYS = {
  EVENTS: 'maya_events',
  TASKS: 'maya_tasks',
  PROFILE: 'maya_profile',
  LOCAL_MODE: 'maya_local_mode',
  CHAT_HISTORY: 'maya_chat_history',
  NOTIFICATIONS: 'maya_notifications',
  HISTORY: 'maya_score_history',
  TEAMS: 'maya_teams',
  GOALS: 'maya_quarter_goals' // Phase 26
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
  description: t.description,
  teamId: t.team_id // Phase 23
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

  // Updated for Phase 23: Handle Teams
  getTasks: async (teamId?: string): Promise<Task[]> => {
    if (!isLocalMode && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });
          
          if (teamId) {
             query = query.eq('team_id', teamId);
          } else {
             query = query.eq('user_id', user.id).is('team_id', null);
          }

          const { data, error } = await query;
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
           id: taskId, 
           user_id: user.id, 
           title: task.title, 
           completed: task.completed,
           priority: task.priority, 
           due_date: task.dueDate ? task.dueDate.toISOString() : null, 
           description: task.description,
           team_id: task.teamId || null // Phase 23
         };
         const { data, error } = await supabase.from('tasks').upsert(payload).select();
         if (error) throw error;
         return mapSupabaseTask(data[0]);
       }
    }
    // Local mode ignores teams for simplicity in this demo
    const tasks = await StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    const taskToSave = { ...task, id: task.id || generateId() };
    const newTasks = index >= 0 ? [...tasks.slice(0, index), taskToSave, ...tasks.slice(index + 1)] : [...tasks, taskToSave];
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
    return taskToSave;
  },

  // Phase 23: Get Teams
  getTeams: async (): Promise<Team[]> => {
     if (!isLocalMode && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           // Fetch teams user belongs to
           const { data } = await supabase.from('teams').select('*'); // RLS filters this
           if (data) return data.map(t => ({ id: t.id, name: t.name, ownerId: t.owner_id }));
        }
     }
     return []; // No teams in local mode
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

  getChatHistory: (): IAMessage[] => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(LOCAL_STORAGE_KEYS.CHAT_HISTORY);
        return data ? JSON.parse(data) : [{ id: '1', sender: 'maya', text: 'Olá! Sou a Maya. Como posso ajudar?' }];
    }
    return [];
  },

  saveChatHistory: (messages: IAMessage[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages.slice(-50)));
    }
  },

  getNotifications: async (): Promise<Notification[]> => {
    if (!isLocalMode && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
            if (data) return data.map(n => ({ id: n.id, message: n.message, read: n.read, createdAt: new Date(n.created_at) }));
        }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })) : [];
  },

  saveNotification: async (msg: string): Promise<void> => {
     const newNotif = { id: generateId(), message: msg, read: false, createdAt: new Date() };
     if (!isLocalMode && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('notifications').insert({ user_id: user.id, message: msg, read: false });
        }
     }
     
     const current = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
     const parsed = current ? JSON.parse(current) : [];
     const updated = [newNotif, ...parsed].slice(0, 50);
     localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  getHistory: async (): Promise<ScoreHistory[]> => {
    if (!isLocalMode && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('productivity_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
            if (data) return data.map(h => ({ id: h.id, score: h.score, createdAt: new Date(h.created_at) }));
        }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data).map((h: any) => ({ ...h, createdAt: new Date(h.createdAt) })) : [];
  },

  saveDailyScore: async (score: number): Promise<void> => {
      const history = await StorageService.getHistory();
      const today = new Date().toDateString();
      const hasToday = history.some(h => new Date(h.createdAt).toDateString() === today);
      
      if (!hasToday) {
         if (!isLocalMode && supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('productivity_history').insert({ user_id: user.id, score });
         }
         
         const newEntry = { id: generateId(), score, createdAt: new Date() };
         const updated = [...history, newEntry];
         localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      }
  },

  // Phase 26: Quarterly Goals
  saveQuarterlyGoal: async (title: string): Promise<void> => {
      if (!isLocalMode && supabase) {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
             const quarter = `Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`;
             await supabase.from('quarterly_goals').insert({ 
                 user_id: user.id, 
                 title, 
                 quarter,
                 achieved: false 
             });
         }
      }
      // Simple local fallback (not full implementation for brevity)
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.GOALS);
      const goals = data ? JSON.parse(data) : [];
      goals.push({ id: generateId(), title, achieved: false, quarter: 'Current' });
      localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },
  
  generateId
};
