
import { CalendarEvent, Task, UserProfile, IAMessage, Notification, ScoreHistory, Team, QuarterlyGoal, FocusSession, WorkflowTemplate, WorkflowLog, UserUsage } from '../types';
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
  GOALS: 'maya_quarter_goals',
  FOCUS_SESSION: 'maya_focus_session',
  WORKFLOW_TEMPLATES: 'maya_workflow_templates',
  WORKFLOW_LOGS: 'maya_workflow_logs',
  AI_USAGE: 'maya_ai_usage' // New
};

const defaultProfile: UserProfile = {
  id: 'user-local',
  name: 'Convidado Local',
  email: 'local@maya.app',
  theme: 'light',
  workingHours: { start: '09:00', end: '18:00' },
  notifications: true,
  defaultReminder: 15,
  plan: 'FREE' // Default plan
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
  teamId: t.team_id,
  workflow: t.workflow_data // Assuming JSONB column for workflow
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
    let savedToCloud = false;
    
    // Tenta salvar no Supabase primeiro
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
           
           if (error) {
               console.warn("Supabase Save Error (Event):", error);
               // Não lança erro, deixa cair para o Local Storage como backup
           } else if (data) {
               savedToCloud = true;
               return mapSupabaseEvent(data[0]);
           }
         }
       } catch (err) { 
           console.warn("Network Error (Event), using local fallback.", err);
       }
    }

    // Fallback Local Storage (Sempre executa se o cloud falhar ou estiver desativado)
    const events = await StorageService.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    const eventToSave = { ...event, id: event.id || generateId() };
    
    // Se salvou na nuvem, não duplica, mas mantem o cache local atualizado
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
       try {
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
            team_id: task.teamId || null,
            workflow_data: task.workflow || null // Save workflow JSONB
            };
            const { data, error } = await supabase.from('tasks').upsert(payload).select();
            if (!error && data) return mapSupabaseTask(data[0]);
        }
       } catch (err) {
           console.warn("Task save error, using local fallback", err);
       }
    }
    // Local mode fallback
    const tasks = await StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    const taskToSave = { ...task, id: task.id || generateId() };
    const newTasks = index >= 0 ? [...tasks.slice(0, index), taskToSave, ...tasks.slice(index + 1)] : [...tasks, taskToSave];
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
    return taskToSave;
  },

  // Templates Persistence
  getTemplates: async (): Promise<WorkflowTemplate[]> => {
      // Local Only for now as we haven't created a table for it yet in Supabase
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKFLOW_TEMPLATES);
      return data ? JSON.parse(data) : [];
  },

  saveTemplate: async (template: WorkflowTemplate): Promise<WorkflowTemplate> => {
      const templates = await StorageService.getTemplates();
      const newTemplates = [...templates, template];
      localStorage.setItem(LOCAL_STORAGE_KEYS.WORKFLOW_TEMPLATES, JSON.stringify(newTemplates));
      return template;
  },

  // --- WORKFLOW LOGS (NEW) ---
  saveWorkflowLog: async (log: WorkflowLog): Promise<void> => {
      if (!isLocalMode && supabase) {
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  await supabase.from('workflow_logs').insert({
                      id: log.id || generateId(),
                      workflow_id: log.workflowId,
                      step_id: log.stepId,
                      user_id: user.id,
                      task_id: log.taskId,
                      action: log.action,
                      metadata: log.metadata,
                      created_at: log.timestamp
                  });
              }
          } catch(e) {
              console.error("Failed to save workflow log to Supabase", e);
          }
      }
      
      // Local Backup
      const current = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKFLOW_LOGS);
      const parsed = current ? JSON.parse(current) : [];
      const updated = [log, ...parsed].slice(0, 100); // Keep last 100 locally
      localStorage.setItem(LOCAL_STORAGE_KEYS.WORKFLOW_LOGS, JSON.stringify(updated));
  },

  getWorkflowLogs: async (): Promise<WorkflowLog[]> => {
      if (!isLocalMode && supabase) {
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const { data } = await supabase.from('workflow_logs').select('*').order('created_at', { ascending: false });
                  if (data) return data.map(l => ({
                      id: l.id,
                      workflowId: l.workflow_id,
                      stepId: l.step_id,
                      userId: l.user_id,
                      taskId: l.task_id,
                      action: l.action,
                      metadata: l.metadata,
                      timestamp: l.created_at
                  }));
              }
          } catch (e) {}
      }
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKFLOW_LOGS);
      return data ? JSON.parse(data) : [];
  },

  // Phase 23: Get Teams
  getTeams: async (): Promise<Team[]> => {
     if (!isLocalMode && supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
            // Fetch teams user belongs to
            const { data } = await supabase.from('teams').select('*'); // RLS filters this
            if (data) return data.map(t => ({ id: t.id, name: t.name, ownerId: t.owner_id }));
            }
        } catch (e) { return []; }
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
               theme: data.theme, workingHours: data.working_hours, notifications: data.notifications, 
               defaultReminder: 15, plan: data.plan || 'FREE'
             };
         }
       } catch (err) { console.warn("Supabase profile error", err); }
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : defaultProfile;
  },

  updateProfile: async (profile: Partial<UserProfile>) => {
    if (!isLocalMode && supabase) {
       try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Construct payload manually to map camelCase to snake_case and avoid sending undefined
            const payload: any = {};
            if (profile.name !== undefined) payload.name = profile.name;
            if (profile.theme !== undefined) payload.theme = profile.theme;
            if (profile.workingHours !== undefined) payload.working_hours = profile.workingHours;
            if (profile.notifications !== undefined) payload.notifications = profile.notifications;
            if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
            if (profile.phone !== undefined) payload.phone = profile.phone;
            if (profile.role !== undefined) payload.role = profile.role;
            if (profile.bio !== undefined) payload.bio = profile.bio;
            if (profile.plan !== undefined) payload.plan = profile.plan;
            // Also sync email if available in user object just in case it's null in profile
            if (user.email) payload.email = user.email;

            const { data, error } = await supabase.from('profiles').update(payload).eq('id', user.id).select();
            
            if (!error && data && data.length > 0) {
                const d = data[0];
                return {
                    id: d.id,
                    name: d.name,
                    email: d.email || user.email,
                    avatarUrl: d.avatar_url,
                    phone: d.phone,
                    role: d.role,
                    bio: d.bio,
                    theme: d.theme,
                    workingHours: d.working_hours,
                    notifications: d.notifications,
                    defaultReminder: 15,
                    plan: d.plan || 'FREE'
                } as UserProfile;
            }
        }
       } catch (e) { console.warn("Profile update error", e); }
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
                if (data) return data.map(n => ({ id: n.id, message: n.message, read: n.read, createdAt: new Date(n.created_at) }));
            }
        } catch (e) {}
    }
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })) : [];
  },

  saveNotification: async (msg: string): Promise<void> => {
     const newNotif = { id: generateId(), message: msg, read: false, createdAt: new Date() };
     if (!isLocalMode && supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) {
                await supabase.from('notifications').insert({ user_id: user.id, message: msg, read: false });
            }
        } catch (e) {}
     }
     
     const current = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
     const parsed = current ? JSON.parse(current) : [];
     const updated = [newNotif, ...parsed].slice(0, 50);
     localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
      // Supabase
      if (!isLocalMode && supabase) {
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
              }
          } catch (e) { console.error("Error marking read", e); }
      }

      // Local
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
          const notifications = JSON.parse(data);
          const updated = notifications.map((n: any) => n.id === id ? { ...n, read: true } : n);
          localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      }
  },

  clearNotifications: async (): Promise<void> => {
      // Supabase
      if (!isLocalMode && supabase) {
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  await supabase.from('notifications').delete().eq('user_id', user.id);
              }
          } catch (e) { console.error("Error clearing notifications", e); }
      }

      // Local
      localStorage.removeItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
  },

  getHistory: async (): Promise<ScoreHistory[]> => {
    if (!isLocalMode && supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('productivity_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
                if (data) return data.map(h => ({ id: h.id, score: h.score, createdAt: new Date(h.created_at) }));
            }
        } catch(e) {}
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
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) await supabase.from('productivity_history').insert({ user_id: user.id, score });
            } catch (e) {}
         }
         
         const newEntry = { id: generateId(), score, createdAt: new Date() };
         const updated = [...history, newEntry];
         localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      }
  },

  saveQuarterlyGoal: async (title: string): Promise<void> => {
      if (!isLocalMode && supabase) {
         try {
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
         } catch(e) {}
      }
      // Simple local fallback (not full implementation for brevity)
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.GOALS);
      const goals = data ? JSON.parse(data) : [];
      goals.push({ id: generateId(), title, achieved: false, quarter: 'Current' });
      localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },
  
  getFocusSession: (): FocusSession => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.FOCUS_SESSION);
      return data ? JSON.parse(data) : { isActive: false, taskId: null, startTime: null, plannedDuration: 25 };
  },

  saveFocusSession: (session: FocusSession) => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.FOCUS_SESSION, JSON.stringify(session));
  },

  // Usage Tracking
  getUsage: (): UserUsage => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_USAGE);
      return data ? JSON.parse(data) : { workflowsCount: 0, aiSuggestionsToday: 0, lastUsageReset: new Date().toISOString() };
  },

  saveUsage: (usage: UserUsage) => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AI_USAGE, JSON.stringify(usage));
  },
  
  generateId
};
