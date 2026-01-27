
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, CalendarEvent, UserProfile, ViewMode, PendingActionState, IAMessage, Notification, ScoreHistory, Team, PersonalityType, AgentSuggestion, IAAction, IAHistoryItem, FocusSession, UserRole } from "../types";
import { StorageService } from "../services/storage";
import { supabase } from "../services/supabaseClient";
import { calculatePriority, sortTasksByDeadline } from "../utils/taskUtils";
import { ToastMessage } from "../components/Toast";
import { calculateScore } from "../utils/productivityScore";
import { getUrgentTasks } from "../utils/deadlineWatcher";
import { getDailyFocus } from "../utils/dailyFocus";
import { detectPersonality } from "../utils/personalityEngine"; 
import { generateWeeklyReport } from "../utils/weeklyReport"; 
import { useAuth } from "./AuthContext";
import { observeState } from "../utils/agentObserver";
import { getNextTaskSuggestion } from "../utils/taskAnalyzer";
import { generateReorganizationPlan } from "../utils/weekReorganizer"; 

type Screen = ViewMode | "login" | "settings";

type IAStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "waiting_user";

export interface AppContextData {
  // Navigation & UI
  screen: Screen;
  setScreen: (screen: Screen) => void;
  isMayaOpen: boolean;
  setMayaOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  addToast: (toast: ToastMessage) => void;

  // Data
  tasks: Task[]; // Now filtered by current Team
  addTask: (title: string, dueDate?: Date) => Promise<void>; 
  updateTask: (task: Task) => Promise<void>;
  events: CalendarEvent[];
  addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  
  // Profile
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Teams (Phase 7)
  teams: Team[];
  currentTeam: Team | null;
  userRole: UserRole; // Current role in the active context
  switchTeam: (teamId: string | null) => Promise<void>;

  // AI State
  iaStatus: IAStatus;
  setIaStatus: (status: IAStatus) => void;
  messages: IAMessage[];
  addMessage: (message: IAMessage) => void;
  pendingAction: PendingActionState | null;
  setPendingAction: (action: PendingActionState | null) => void;
  executeIAAction: (action: IAAction, source?: "user" | "ai") => Promise<void>; 
  iaHistory: IAHistoryItem[];
  agentSuggestion: AgentSuggestion | null;
  setAgentSuggestion: (suggestion: AgentSuggestion | null) => void;
  personality: PersonalityType;
  
  // Productivity
  productivityScore: number;
  scoreHistory: ScoreHistory[];
  dailyFocus: Task | null;
  focusSession: FocusSession;
  endFocusSession: (completed: boolean) => void;

  // Notifications
  notifications: Notification[];
  unreadNotifications: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  generateReport: () => void;
  
  // Diagnostics
  isSupabaseConnected: boolean;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLocalMode } = useAuth();

  // UI State
  const [screen, setScreen] = useState<Screen>("day");
  const [isMayaOpen, setMayaOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Raw store of all tasks
  const [tasks, setTasks] = useState<Task[]>([]); // Filtered for view
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [productivityScore, setProductivityScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [dailyFocus, setDailyFocus] = useState<Task | null>(null);

  // Teams State (Phase 7)
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('member');

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // AI State
  const [iaStatus, setIaStatus] = useState<IAStatus>("idle");
  const [messages, setMessages] = useState<IAMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null); 
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);
  const [iaHistory, setIaHistory] = useState<IAHistoryItem[]>([]);
  const [personality, setPersonality] = useState<PersonalityType>("neutro");
  const [focusSession, setFocusSession] = useState<FocusSession>({ isActive: false, taskId: null, startTime: null, plannedDuration: 25 });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // --- 1. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTasks, loadedEvents, loadedProfile, loadedHistory, loadedTeams, loadedNotifs] = await Promise.all([
            StorageService.getTasks(), // Fetches ALL user tasks initially
            StorageService.getEvents(),
            StorageService.getProfile(),
            StorageService.getHistory(),
            StorageService.getTeams(),
            StorageService.getNotifications()
        ]);
        setAllTasks(loadedTasks);
        setEvents(loadedEvents);
        setProfile(loadedProfile);
        setScoreHistory(loadedHistory);
        setTeams(loadedTeams);
        setNotifications(loadedNotifs);
        
        // Default to personal view (no team selected)
        const personalTasks = loadedTasks.filter(t => !t.teamId);
        setTasks(sortTasksByDeadline(personalTasks));

        // Load AI History
        const storedHistory = localStorage.getItem('maya_ia_history');
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            setIaHistory(parsedHistory);
            const initialScore = calculateScore(personalTasks, parsedHistory);
            setProductivityScore(initialScore);
        } else {
            setProductivityScore(calculateScore(personalTasks, []));
        }

        // Load Focus Session
        const storedSession = StorageService.getFocusSession();
        setFocusSession(storedSession);
        
        if (loadedProfile.theme === 'dark') document.documentElement.classList.add('dark');
        
        setDailyFocus(getDailyFocus(personalTasks));
        setPersonality(detectPersonality(personalTasks));
        
      } catch (err) {
        console.error("Failed to load initial data", err);
        setIsSupabaseConnected(false);
      }
    };

    if (user || isLocalMode) {
        loadData();
    }
  }, [user, isLocalMode]);

  // --- 2. Switch Team Logic (Phase 7) ---
  const switchTeam = async (teamId: string | null) => {
      // 1. Update State
      const selected = teams.find(t => t.id === teamId) || null;
      setCurrentTeam(selected);
      
      // 2. Determine Role (Mocked logic for now, usually comes from Team Member table)
      if (selected) {
         // In a real app, check 'teams_members' table. 
         // For demo, if ownerId matches user.id, they are admin/manager.
         setUserRole(selected.ownerId === user?.id ? 'manager' : 'member');
      } else {
         setUserRole('member'); // Personal mode default
      }

      // 3. Filter Tasks
      const filtered = teamId 
        ? allTasks.filter(t => t.teamId === teamId)
        : allTasks.filter(t => !t.teamId);
      
      setTasks(sortTasksByDeadline(filtered));

      // 4. Reset Context Dependent items
      setDailyFocus(getDailyFocus(filtered));
      setPersonality(detectPersonality(filtered));
      setProductivityScore(calculateScore(filtered, iaHistory));
      
      addToast({ 
          id: Date.now().toString(), 
          title: "Mudança de Contexto", 
          message: selected ? `Equipe: ${selected.name} (${selected.ownerId === user?.id ? 'Gestor' : 'Membro'})` : "Modo Pessoal", 
          type: "info" 
      });
  };

  // --- 3. Persist AI History & Update Score ---
  useEffect(() => {
      if (iaHistory.length > 0) {
          localStorage.setItem('maya_ia_history', JSON.stringify(iaHistory.slice(-50))); 
          setProductivityScore(calculateScore(tasks, iaHistory));
      }
  }, [iaHistory, tasks]);

  useEffect(() => {
      StorageService.saveFocusSession(focusSession);
  }, [focusSession]);

  // --- 4. Observer & Suggestion Loop ---
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const existingSuggestion = observeState(tasks, iaHistory, productivityScore, focusSession);
    
    if (existingSuggestion && existingSuggestion.id === 'burnout_alert' && existingSuggestion.actionData.type === 'ASK_CONFIRMATION') {
        const plan = generateReorganizationPlan(tasks);
        if (existingSuggestion.actionData.payload.action.type === 'REORGANIZE_WEEK') {
             existingSuggestion.actionData.payload.action.payload = plan;
        }
    }

    const proactiveSuggestion = getNextTaskSuggestion(tasks);

    if (existingSuggestion) {
        if (existingSuggestion.type === 'focus_coach') {
             setAgentSuggestion(existingSuggestion);
        } else if (!agentSuggestion) {
             setAgentSuggestion(existingSuggestion);
        }
    } else if (proactiveSuggestion && !agentSuggestion && !focusSession.isActive) {
        setAgentSuggestion(proactiveSuggestion);
    }
  }, [tasks, iaHistory, productivityScore, focusSession]); 

  // --- ACTIONS ---

  const addToast = (toast: ToastMessage) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 5000);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
      if (!profile) return;
      const updated = await StorageService.updateProfile(data);
      setProfile(updated);
      if (updated.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  const addTask = async (title: string, dueDate?: Date) => {
      if (!user && !isLocalMode) return;
      const newTask: Task = {
          id: StorageService.generateId(),
          title,
          completed: false,
          priority: 'medium', 
          dueDate: dueDate || new Date(),
          teamId: currentTeam?.id // Assign to current team context
      };
      newTask.priority = calculatePriority(newTask);
      
      const saved = await StorageService.saveTask(newTask);
      
      // Update global store and filtered view
      setAllTasks(prev => [...prev, saved]);
      setTasks(prev => sortTasksByDeadline([...prev, saved]));
      
      addToast({ id: Date.now().toString(), title: "Sucesso", message: "Tarefa criada.", type: "success" });
  };

  const updateTask = async (task: Task) => {
      const updated = await StorageService.saveTask(task);
      setAllTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setTasks(prev => {
          const filtered = prev.filter(t => t.id !== task.id);
          return sortTasksByDeadline([...filtered, updated]);
      });
  };

  const addEvent = async (eventData: Partial<CalendarEvent>) => {
      if (!user && !isLocalMode) return;
      const newEvent: CalendarEvent = {
          id: eventData.id || StorageService.generateId(),
          title: eventData.title || "Novo Evento",
          start: eventData.start || new Date(),
          end: eventData.end || new Date(),
          color: eventData.color || 'blue',
          category: eventData.category || 'work',
          completed: false,
          isAllDay: eventData.isAllDay || false,
          description: eventData.description,
          location: eventData.location
      };
      await StorageService.saveEvent(newEvent);
      setEvents(prev => [...prev, newEvent]);
      addToast({ id: Date.now().toString(), title: "Sucesso", message: "Evento agendado.", type: "success" });
  };

  const addMessage = (message: IAMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const generateReport = () => {
      const report = generateWeeklyReport(tasks, scoreHistory, iaHistory);
      StorageService.saveNotification("Relatório Semanal Disponível");
      addMessage({ id: Date.now().toString(), sender: 'maya', text: report });
      setMayaOpen(true);
  };
  
  const markNotificationAsRead = async (id: string) => {
      await StorageService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = async () => {
      await StorageService.clearNotifications();
      setNotifications([]);
  };

  const startFocusSession = (taskId: string, duration: number = 25) => {
      setFocusSession({
          isActive: true,
          taskId,
          startTime: new Date().toISOString(),
          plannedDuration: duration
      });
      addToast({ id: Date.now().toString(), title: "Modo Foco Ativado", message: "Boa concentração!", type: "info" });
      setMayaOpen(false); // Close modal to show focus overlay
  };

  const endFocusSession = async (completed: boolean) => {
      if (focusSession.taskId && completed) {
          const task = tasks.find(t => t.id === focusSession.taskId);
          if (task) {
              await updateTask({ ...task, completed: true });
              setIaHistory(prev => [...prev, { timestamp: new Date().toISOString(), action: { type: "END_FOCUS", payload: { completed: true } }, source: "user" }]);
          }
      }
      setFocusSession({ isActive: false, taskId: null, startTime: null, plannedDuration: 25 });
  };

  // --- CORE DISPATCHER FOR AI ACTIONS ---
  const executeIAAction = async (action: IAAction, source: "user" | "ai" = "ai") => {
    console.log(`🤖 Executing Action [${source}]:`, action);
    
    if (action.type !== 'NEGOTIATE_DEADLINE' && action.type !== 'ASK_CONFIRMATION') {
        setIaHistory(prev => [
            ...prev, 
            { timestamp: new Date().toISOString(), action, source }
        ]);
    }

    switch (action.type) {
        case "CREATE_TASK":
            await addTask(action.payload.title, action.payload.dueDate ? new Date(action.payload.dueDate) : undefined);
            break;

        case "CREATE_EVENT":
            await addEvent({
                title: action.payload.title,
                start: new Date(action.payload.start),
                end: action.payload.end ? new Date(action.payload.end) : new Date(new Date(action.payload.start).getTime() + 3600000),
                category: action.payload.category || 'work',
                location: action.payload.location
            });
            break;

        case "RESCHEDULE_TASK":
             const { taskId, taskIds, newDate } = action.payload;
             const ids = taskIds || (taskId ? [taskId] : []);
             let count = 0;
             for (const id of ids) {
                 const t = tasks.find(x => x.id === id);
                 if (t) {
                     await updateTask({ ...t, dueDate: new Date(newDate) });
                     count++;
                 }
             }
             if (count > 0) {
                 addToast({ id: Date.now().toString(), title: "Reagendado", message: `${count} tarefa(s) atualizada(s) para ${new Date(newDate).toLocaleString()}`, type: "info" });
             }
             break;
        
        case "REORGANIZE_WEEK":
            const changes = action.payload.changes;
            let changesCount = 0;
            if (changes) {
                for (const change of changes) {
                    const task = tasks.find(t => t.id === change.taskId);
                    if (task) {
                        await updateTask({ ...task, dueDate: new Date(change.to) });
                        changesCount++;
                    }
                }
            }
            if (changesCount > 0) {
                addToast({ 
                    id: Date.now().toString(), 
                    title: "Semana Reorganizada", 
                    message: `${changesCount} tarefas redistribuídas para equilibrar sua carga.`, 
                    type: "success" 
                });
            }
            break;

        case "CHANGE_SCREEN":
             setScreen(action.payload);
             break;

        case "START_FOCUS":
             startFocusSession(action.payload.taskId, action.payload.duration);
             break;

        case "END_FOCUS":
             endFocusSession(action.payload.completed);
             break;

        case "ASK_CONFIRMATION":
             setPendingAction({
                 originalAction: action.payload.action,
                 question: action.payload.message
             });
             break;
        
        case "NEGOTIATE_DEADLINE":
             setPendingAction({
                 originalAction: action,
                 question: "Negociação de Prazo" 
             });
             break;

        case "REPLY":
             addMessage({ id: Date.now().toString(), sender: 'maya', text: action.payload.message });
             break;

        case "NO_ACTION":
        default:
             break;
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen, setScreen,
        isMayaOpen, setMayaOpen,
        isMobileMenuOpen, setMobileMenuOpen,
        isNotificationsOpen, setNotificationsOpen,
        toasts, addToast,
        profile, updateProfile,
        tasks, addTask, updateTask,
        events, addEvent,
        iaStatus, setIaStatus,
        messages, addMessage,
        pendingAction, setPendingAction,
        executeIAAction,
        iaHistory,
        agentSuggestion, setAgentSuggestion,
        productivityScore, scoreHistory, dailyFocus,
        notifications, unreadNotifications: notifications.filter(n => !n.read).length,
        markNotificationAsRead,
        clearAllNotifications,
        teams, currentTeam, switchTeam, userRole, // Phase 7
        personality,
        generateReport,
        isSupabaseConnected,
        focusSession, endFocusSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  return useContext(AppContext);
}
