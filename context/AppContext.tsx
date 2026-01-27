
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, CalendarEvent, UserProfile, ViewMode, PendingActionState, IAMessage, Notification, ScoreHistory, Team, PersonalityType, AgentSuggestion, IAAction } from "../types";
import { StorageService } from "../services/storage";
import { supabase } from "../services/supabaseClient";
import { calculatePriority, sortTasksByDeadline } from "../utils/taskUtils";
import { ToastMessage } from "../components/Toast";
import { calculateScore } from "../utils/productivityScore";
import { getUrgentTasks } from "../utils/deadlineWatcher";
import { reorganizeWeek } from "../utils/weekReorganizer";
import { getDailyFocus } from "../utils/dailyFocus";
import { detectPersonality } from "../utils/personalityEngine"; 
import { generateWeeklyReport } from "../utils/weeklyReport"; 
import { detectBurnout } from "../utils/burnoutDetector";
import { useAuth } from "./AuthContext";
import { observeState } from "../utils/agentObserver";

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
  tasks: Task[];
  addTask: (title: string, dueDate?: Date) => Promise<void>; 
  updateTask: (task: Task) => Promise<void>;
  events: CalendarEvent[];
  addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  
  // Profile
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Teams
  teams: Team[];
  currentTeam: Team | null;
  switchTeam: (teamId: string | null) => Promise<void>;

  // AI State
  iaStatus: IAStatus;
  setIaStatus: (status: IAStatus) => void;
  messages: IAMessage[];
  addMessage: (message: IAMessage) => void;
  pendingAction: PendingActionState | null;
  setPendingAction: (action: PendingActionState | null) => void;
  executeIAAction: (action: IAAction) => Promise<void>; // O Dispatcher Central
  agentSuggestion: AgentSuggestion | null;
  setAgentSuggestion: (suggestion: AgentSuggestion | null) => void;
  personality: PersonalityType;
  
  // Productivity
  productivityScore: number;
  scoreHistory: ScoreHistory[];
  dailyFocus: Task | null;

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [productivityScore, setProductivityScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [dailyFocus, setDailyFocus] = useState<Task | null>(null);

  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // AI State
  const [iaStatus, setIaStatus] = useState<IAStatus>("idle");
  const [messages, setMessages] = useState<IAMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null); 
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);
  const [hasCheckedReorg, setHasCheckedReorg] = useState(false);
  const [personality, setPersonality] = useState<PersonalityType>("neutro");
  const [hasCheckedBurnout, setHasCheckedBurnout] = useState(false);

  // Diagnostics
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // ... (Connection Check and Data Loading logic remains same)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTasks, loadedEvents, loadedProfile, loadedHistory, loadedTeams, loadedNotifs] = await Promise.all([
            StorageService.getTasks(),
            StorageService.getEvents(),
            StorageService.getProfile(),
            StorageService.getHistory(),
            StorageService.getTeams(),
            StorageService.getNotifications()
        ]);
        setTasks(loadedTasks);
        setEvents(loadedEvents);
        setProfile(loadedProfile);
        setScoreHistory(loadedHistory);
        setTeams(loadedTeams);
        setNotifications(loadedNotifs);
        
        if (loadedProfile.theme === 'dark') document.documentElement.classList.add('dark');
        
        setDailyFocus(getDailyFocus(loadedTasks));
        setProductivityScore(calculateScore(loadedTasks));
        setPersonality(detectPersonality(loadedTasks));

      } catch (err) {
        console.error("Failed to load initial data", err);
        setIsSupabaseConnected(false);
      }
    };

    if (user || isLocalMode) {
        loadData();
    }
  }, [user, isLocalMode]);

  // Observer Loop
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Check Agent Suggestions
    const suggestion = observeState(tasks);
    if (suggestion && !agentSuggestion) {
        setAgentSuggestion(suggestion);
    }
  }, [tasks]); // Run when tasks change

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

  const switchTeam = async (teamId: string | null) => {
      const selected = teams.find(t => t.id === teamId) || null;
      setCurrentTeam(selected);
      addToast({ id: Date.now().toString(), title: "Mudança de Contexto", message: selected ? `Equipe: ${selected.name}` : "Modo Pessoal", type: "info" });
      
      // Reload tasks for context
      const newTasks = await StorageService.getTasks(teamId || undefined);
      setTasks(newTasks);
  };

  const addTask = async (title: string, dueDate?: Date) => {
      if (!user && !isLocalMode) return;
      const newTask: Task = {
          id: StorageService.generateId(),
          title,
          completed: false,
          priority: 'medium', 
          dueDate: dueDate || new Date(),
          teamId: currentTeam?.id
      };
      newTask.priority = calculatePriority(newTask);
      
      await StorageService.saveTask(newTask);
      setTasks(prev => sortTasksByDeadline([...prev, newTask]));
      addToast({ id: Date.now().toString(), title: "Sucesso", message: "Tarefa criada.", type: "success" });
  };

  const updateTask = async (task: Task) => {
      const updated = await StorageService.saveTask(task);
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
      const report = generateWeeklyReport(tasks, scoreHistory);
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

  // --- CORE DISPATCHER FOR AI ACTIONS ---
  // A IA "pede", o App "executa".
  const executeIAAction = async (action: IAAction) => {
    console.log("🤖 Executing AI Action:", action);
    
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

        case "CHANGE_SCREEN":
             setScreen(action.payload);
             break;

        case "ASK_CONFIRMATION":
             // Não executa nada, apenas coloca em estado de espera na UI
             setPendingAction({
                 originalAction: action.payload.action,
                 question: action.payload.message
             });
             break;
        
        case "REPLY":
             addMessage({ id: Date.now().toString(), sender: 'maya', text: action.payload.message });
             break;

        case "NO_ACTION":
        default:
             // Do nothing
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
        agentSuggestion, setAgentSuggestion,
        productivityScore, scoreHistory, dailyFocus,
        notifications, unreadNotifications: notifications.filter(n => !n.read).length,
        markNotificationAsRead,
        clearAllNotifications,
        teams, currentTeam, switchTeam, 
        personality,
        generateReport,
        isSupabaseConnected
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  return useContext(AppContext);
}
