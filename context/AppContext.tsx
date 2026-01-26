
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, CalendarEvent, UserProfile, ViewMode, PendingAction, IAMessage, Notification, ScoreHistory, Team, PersonalityType } from "../types";
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
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
  personality: PersonalityType;
  
  // Productivity
  productivityScore: number;
  scoreHistory: ScoreHistory[];
  dailyFocus: Task | null;

  // Notifications
  notifications: Notification[];
  unreadNotifications: number;
  generateReport: () => void;
  
  // Diagnostics
  isSupabaseConnected: boolean;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLocalMode } = useAuth();

  // UI State
  const [screen, setScreen] = useState<Screen>("day"); // Default to day, Auth wrapper handles Login screen
  const [isMayaOpen, setMayaOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null); 
  const [hasCheckedReorg, setHasCheckedReorg] = useState(false);
  const [personality, setPersonality] = useState<PersonalityType>("neutro");
  const [hasCheckedBurnout, setHasCheckedBurnout] = useState(false);

  // Diagnostics
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // --- Connection Check ---
  useEffect(() => {
    if (isLocalMode) {
        setIsSupabaseConnected(true);
        return;
    }
    
    const checkConnection = async () => {
        if (!user) return;
        try {
            const { error } = await supabase.from("tasks").select("id").limit(1);
            if (error) {
                console.error("❌ Supabase Connection Error:", error.message);
                setIsSupabaseConnected(false);
            } else {
                setIsSupabaseConnected(true);
            }
        } catch (e) {
            console.error("❌ Supabase Connection Exception:", e);
            setIsSupabaseConnected(false);
        }
    };
    
    checkConnection();
  }, [user, isLocalMode]);

  // --- Data Loading Logic ---
  const loadData = async (teamId?: string) => {
      // Critical check: Do not run if no user is present (unless local mode)
      if (!user && !isLocalMode) return;
      
      try {
        const [loadedEvents, loadedTasks, loadedProfile, loadedNotifs, loadedHistory, loadedTeams] = await Promise.all([
            StorageService.getEvents(),
            StorageService.getTasks(teamId),
            StorageService.getProfile(),
            StorageService.getNotifications(),
            StorageService.getHistory(),
            StorageService.getTeams()
        ]);

        const history = StorageService.getChatHistory();
        setMessages(history);

        const prioritizedTasks = loadedTasks.map(t => ({
            ...t,
            priority: calculatePriority(t)
        }));

        setEvents(loadedEvents);
        setTasks(sortTasksByDeadline(prioritizedTasks));
        setProfile(loadedProfile);
        setNotifications(loadedNotifs);
        setScoreHistory(loadedHistory);
        setTeams(loadedTeams);
        
        // Apply theme preference
        if (loadedProfile.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

      } catch (err) {
          console.error("Failed to load data", err);
          addToast({ id: Date.now().toString(), title: "Erro", message: "Falha ao carregar dados. Verifique sua conexão.", type: "error" });
      }
  };

  // Trigger loadData ONLY when user changes/exists
  useEffect(() => {
    if (user || isLocalMode) {
        loadData(currentTeam?.id);
    }
  }, [user, isLocalMode, currentTeam]); 

  useEffect(() => {
    if (messages.length > 0) {
        StorageService.saveChatHistory(messages);
    }
  }, [messages]);

  // Phase 14-25: Monitoring Loop
  useEffect(() => {
      if (tasks.length === 0) return;

      // 1. Update Score & History
      const score = calculateScore(tasks);
      setProductivityScore(score);
      StorageService.saveDailyScore(score);

      // 2. Set Daily Focus
      setDailyFocus(getDailyFocus(tasks));

      // 3. Detect Personality
      setPersonality(detectPersonality(tasks));

      // 4. Check Deadlines & Notify
      const urgent = getUrgentTasks(tasks);
      if (urgent.length > 0) {
          const msg = `Atenção: ${urgent.length} tarefas vencem em breve!`;
          const hasRecent = notifications.some(n => n.message === msg && (new Date().getTime() - new Date(n.createdAt).getTime()) < 3600000); 
          if (!hasRecent) {
             StorageService.saveNotification(msg).then(async () => {
                 setNotifications(await StorageService.getNotifications());
             });
             addToast({ id: 'urgent-tasks', title: 'Prazo', message: msg, type: 'info' });
          }
      }

      // 5. Auto-Reorganization Check
      if (!hasCheckedReorg && urgent.length > 2) {
          setHasCheckedReorg(true);
          setMayaOpen(true);
          const newPlan = reorganizeWeek(tasks);
          addMessage({ 
              id: Date.now().toString(), 
              sender: 'maya', 
              text: "Notei que você tem várias tarefas acumuladas. Posso reorganizar sua semana para equilibrar a carga?" 
          });
          setPendingAction({
             action: { action: "REORGANIZE_WEEK", payload: newPlan },
             question: "Confirmar reorganização automática da semana?"
          });
      }

      // 6. Burnout Detection (Phase 25)
      if (!hasCheckedBurnout && detectBurnout(tasks, scoreHistory)) {
          setHasCheckedBurnout(true);
          setMayaOpen(true);
          addMessage({
              id: Date.now().toString(),
              sender: 'maya',
              text: "⚠️ Percebi sinais de sobrecarga (muitas pendências e queda no desempenho). Podemos reduzir o ritmo, adiar tarefas ou focar só no essencial hoje. O que prefere?"
          });
          // No automatic action, just a prompt for conversation
      }

  }, [tasks]);

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

  // Phase 24: Weekly Report
  const generateReport = () => {
      const report = generateWeeklyReport(tasks, scoreHistory);
      StorageService.saveNotification("Relatório Semanal Disponível");
      addMessage({ id: Date.now().toString(), sender: 'maya', text: report });
      setMayaOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        screen, setScreen,
        isMayaOpen, setMayaOpen,
        isMobileMenuOpen, setMobileMenuOpen,
        toasts, addToast,
        profile, updateProfile,
        tasks, addTask, updateTask,
        events, addEvent,
        iaStatus, setIaStatus,
        messages, addMessage,
        pendingAction, setPendingAction,
        productivityScore, scoreHistory, dailyFocus,
        notifications, unreadNotifications: notifications.filter(n => !n.read).length,
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
