
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, CalendarEvent, UserProfile, ViewMode, PendingActionState, IAMessage, Notification, ScoreHistory, Team, PersonalityType, AgentSuggestion, IAAction, IAHistoryItem, FocusSession, UserRole, ScoreBreakdown, SystemDecision, ProductivityScore, WorkflowTemplate, Workflow, WorkflowLog } from "../types";
import { StorageService } from "../services/storage";
import { supabase } from "../services/supabaseClient";
import { calculatePriority, sortTasksByDeadline } from "../utils/taskUtils";
import { ToastMessage } from "../components/Toast";
import { calculateProductivityScore, calculateScoreBreakdown } from "../utils/productivityScore";
import { getDailyFocus } from "../utils/dailyFocus";
import { detectPersonality } from "../utils/personalityEngine"; 
import { generateWeeklyReport } from "../utils/weeklyReport"; 
import { useAuth } from "./AuthContext";
import { getNextTaskSuggestion } from "../utils/taskAnalyzer";
import { generateReorganizationPlan } from "../utils/weekReorganizer"; 
import { IAActionEngine } from "../utils/decisionEngine";
import { generateDailySummary } from "../utils/dailySummary";
import { isToday, getHours } from "date-fns";
import { WorkflowEngine } from "../utils/workflowEngine";

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
  addWorkflow: (title: string, steps: string[]) => Promise<void>; 
  saveWorkflowAsTemplate: (workflow: Workflow) => Promise<void>; 
  createWorkflowFromTemplate: (template: WorkflowTemplate) => Promise<void>; 
  advanceWorkflow: (task: Task, stepId: string) => Promise<void>; // New: Logged Workflow Advance
  templates: WorkflowTemplate[]; 
  workflowLogs: WorkflowLog[]; // New: Exposed for analytics
  updateTask: (task: Task) => Promise<void>;
  events: CalendarEvent[];
  addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  
  // Profile
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Teams
  teams: Team[];
  currentTeam: Team | null;
  userRole: UserRole;
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
  
  // System Decision Engine
  systemDecision: SystemDecision;

  // Productivity
  productivityScore: number;
  scoreBreakdown: ScoreBreakdown;
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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  
  // Score State
  const [productivityScore, setProductivityScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({ focusPoints: 0, taskPoints: 0, consistencyBonus: 0, penalties: 0, total: 0, streakDays: 0 });
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  
  const [dailyFocus, setDailyFocus] = useState<Task | null>(null);

  // Teams State
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
  const [systemDecision, setSystemDecision] = useState<SystemDecision>({ type: 'NONE' });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // --- 1. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTasks, loadedEvents, loadedProfile, loadedHistory, loadedTeams, loadedNotifs, loadedTemplates, loadedLogs] = await Promise.all([
            StorageService.getTasks(),
            StorageService.getEvents(),
            StorageService.getProfile(),
            StorageService.getHistory(),
            StorageService.getTeams(),
            StorageService.getNotifications(),
            StorageService.getTemplates(),
            StorageService.getWorkflowLogs()
        ]);
        setAllTasks(loadedTasks);
        setEvents(loadedEvents);
        setProfile(loadedProfile);
        setScoreHistory(loadedHistory);
        setTeams(loadedTeams);
        setNotifications(loadedNotifs);
        setTemplates(loadedTemplates);
        setWorkflowLogs(loadedLogs);
        
        const personalTasks = loadedTasks.filter(t => !t.teamId);
        setTasks(sortTasksByDeadline(personalTasks));

        const storedHistory = localStorage.getItem('maya_ia_history');
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            setIaHistory(parsedHistory);
            const scoreDates = loadedHistory.map(h => new Date(h.createdAt));
            const fullScore = calculateProductivityScore(personalTasks, parsedHistory, scoreDates);
            setProductivityScore(fullScore.score);
            setScoreBreakdown(fullScore.breakdown);
        }

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

  // --- 2. IA ACTION ENGINE LOOP ---
  useEffect(() => {
      if (tasks.length === 0) return;

      const scoreDates = scoreHistory.map(h => new Date(h.createdAt));
      const focusDoneToday = iaHistory.some(h => 
          h.action.type === 'END_FOCUS' && isToday(new Date(h.timestamp))
      );
      
      let dailySummary = null;
      if (getHours(new Date()) >= 17) {
           dailySummary = generateDailySummary(tasks, iaHistory, scoreDates);
      }
      
      const nextTask = tasks.filter(t => !t.completed).sort((a,b) => calculatePriority(a) === 'high' ? -1 : 1)[0];

      // Run Decision Engine
      const decision = IAActionEngine.decide({
          hasActiveFocus: focusSession.isActive,
          focusDoneToday,
          pendingTasks: tasks.filter(t => !t.completed),
          nextTask,
          dailySummary,
          scoreBreakdown
      });

      setSystemDecision(decision);

      if (decision.type === 'SUGGEST_NEXT_STEP') {
          const recentSuggestion = iaHistory.slice(-5).find(h => 
              h.action.type === 'NO_ACTION' && 
              Date.now() - new Date(h.timestamp).getTime() < 10 * 60 * 1000
          );
          
          if (!recentSuggestion && !agentSuggestion) {
               setAgentSuggestion({
                   id: `next-step-${decision.payload.step.id}`,
                   type: 'workflow_step',
                   message: `Próximo passo no fluxo "${decision.payload.workflowTitle}": \n👉 ${decision.payload.step.title}.`,
                   actionLabel: 'Executar Agora',
                   actionData: {
                       type: "COMPLETE_STEP",
                       payload: {
                           taskId: tasks.find(t => t.workflow?.id === decision.payload.workflowId)?.id!,
                           stepId: decision.payload.step.id,
                           workflowId: decision.payload.workflowId
                       }
                   }
               });
          }
      }

  }, [tasks, iaHistory, focusSession, scoreBreakdown]);

  // Switch Team Logic
  const switchTeam = async (teamId: string | null) => {
      const selected = teams.find(t => t.id === teamId) || null;
      setCurrentTeam(selected);
      
      if (selected) {
         setUserRole(selected.ownerId === user?.id ? 'manager' : 'member');
      } else {
         setUserRole('member');
      }

      const filtered = teamId 
        ? allTasks.filter(t => t.teamId === teamId)
        : allTasks.filter(t => !t.teamId);
      
      setTasks(sortTasksByDeadline(filtered));
      setDailyFocus(getDailyFocus(filtered));
      
      addToast({ 
          id: Date.now().toString(), 
          title: "Mudança de Contexto", 
          message: selected ? `Equipe: ${selected.name}` : "Modo Pessoal", 
          type: "info" 
      });
  };

  // --- Persist History ---
  useEffect(() => {
      if (iaHistory.length > 0) {
          localStorage.setItem('maya_ia_history', JSON.stringify(iaHistory.slice(-50))); 
          
          const scoreDates = scoreHistory.map(h => new Date(h.createdAt));
          const fullScore = calculateProductivityScore(tasks, iaHistory, scoreDates);
          setProductivityScore(fullScore.score);
          setScoreBreakdown(fullScore.breakdown);
      }
  }, [iaHistory, tasks]);

  useEffect(() => {
      StorageService.saveFocusSession(focusSession);
  }, [focusSession]);


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
          teamId: currentTeam?.id
      };
      newTask.priority = calculatePriority(newTask);
      const saved = await StorageService.saveTask(newTask);
      setAllTasks(prev => [...prev, saved]);
      setTasks(prev => sortTasksByDeadline([...prev, saved]));
      addToast({ id: Date.now().toString(), title: "Sucesso", message: "Tarefa criada.", type: "success" });
  };

  const addWorkflow = async (title: string, steps: string[]) => {
    if (!user && !isLocalMode) return;
    const stepsData = steps.map(s => ({ title: s }));
    const workflow = WorkflowEngine.createTemplate(title, stepsData);
    workflow.ownerId = user?.id; // Assign owner

    const newTask: Task = {
        id: StorageService.generateId(),
        title: title,
        completed: false,
        priority: 'medium',
        dueDate: new Date(),
        workflow: workflow, 
        teamId: currentTeam?.id
    };
    
    const saved = await StorageService.saveTask(newTask);
    setAllTasks(prev => [...prev, saved]);
    setTasks(prev => sortTasksByDeadline([...prev, saved]));
    
    addToast({ id: Date.now().toString(), title: "Fluxo Criado", message: "Novo processo iniciado.", type: "success" });
  };

  // Safe Workflow Advance with Logging
  const advanceWorkflow = async (task: Task, stepId: string) => {
      if (!task.workflow) return;

      // 1. Logic Update
      const updatedWorkflow = WorkflowEngine.completeStep(task.workflow, stepId);
      
      const updatedTask = {
          ...task,
          workflow: updatedWorkflow,
          completed: updatedWorkflow.status === 'completed'
      };

      // 2. Database Update
      await updateTask(updatedTask);

      // 3. Audit Log (Side Effect)
      const logEntry: WorkflowLog = {
          id: StorageService.generateId(),
          workflowId: updatedWorkflow.id,
          stepId: stepId,
          taskId: task.id,
          userId: user?.id || 'local-user',
          action: 'completed',
          timestamp: new Date().toISOString()
      };
      
      await StorageService.saveWorkflowLog(logEntry);
      setWorkflowLogs(prev => [logEntry, ...prev]);
  };

  const saveWorkflowAsTemplate = async (workflow: Workflow) => {
     const template: WorkflowTemplate = {
         id: StorageService.generateId(),
         title: workflow.title,
         steps: workflow.steps.map(s => ({ title: s.title, order: s.order }))
     };
     await StorageService.saveTemplate(template);
     setTemplates(prev => [...prev, template]);
     addToast({ id: Date.now().toString(), title: "Template Salvo", message: "Fluxo salvo para reuso.", type: "success" });
  };

  const createWorkflowFromTemplate = async (template: WorkflowTemplate) => {
      await addWorkflow(template.title, template.steps.sort((a,b) => a.order - b.order).map(s => s.title));
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
      setIaHistory(prev => [
          ...prev, 
          { timestamp: new Date().toISOString(), action: { type: "START_FOCUS", payload: { taskId, duration } }, source: "user" }
      ]);
      addToast({ id: Date.now().toString(), title: "Modo Foco Ativado", message: "Boa concentração!", type: "info" });
      setMayaOpen(false); 
  };

  const endFocusSession = async (completed: boolean) => {
      if (focusSession.taskId && completed) {
          const task = tasks.find(t => t.id === focusSession.taskId);
          if (task) {
              await updateTask({ ...task, completed: true });
          }
      }
      setIaHistory(prev => [
          ...prev, 
          { timestamp: new Date().toISOString(), action: { type: "END_FOCUS", payload: { completed } }, source: "user" }
      ]);
      setFocusSession({ isActive: false, taskId: null, startTime: null, plannedDuration: 25 });
  };

  const executeIAAction = async (action: IAAction, source: "user" | "ai" = "ai") => {
    if (action.type !== 'NEGOTIATE_DEADLINE' && action.type !== 'ASK_CONFIRMATION' && action.type !== 'SHOW_SUMMARY') {
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
             for (const id of ids) {
                 const t = tasks.find(x => x.id === id);
                 if (t) await updateTask({ ...t, dueDate: new Date(newDate) });
             }
             break;
        case "REORGANIZE_WEEK":
            const changes = action.payload.changes;
            if (changes) {
                for (const change of changes) {
                    const task = tasks.find(t => t.id === change.taskId);
                    if (task) await updateTask({ ...task, dueDate: new Date(change.to) });
                }
                addToast({ id: Date.now().toString(), title: "Reorganizado", message: "Semana ajustada com sucesso.", type: "success" });
            }
            break;
        case "COMPLETE_STEP": // AI Automation
             const { taskId: tId, stepId } = action.payload;
             const targetTask = tasks.find(t => t.id === tId);
             if (targetTask) {
                 await advanceWorkflow(targetTask, stepId);
                 addToast({ id: Date.now().toString(), title: "Etapa Concluída", message: "Avanço registrado via IA.", type: "success" });
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
             setPendingAction({ originalAction: action.payload.action, question: action.payload.message });
             break;
        case "NEGOTIATE_DEADLINE":
             setPendingAction({ originalAction: action, question: "Negociação de Prazo" });
             break;
        case "SHOW_SUMMARY":
             addMessage({ 
                 id: Date.now().toString(), 
                 sender: 'maya', 
                 text: `📊 **Resumo do Dia**\nScore: ${action.payload.score}\n\n${action.payload.message}`
             });
             setMayaOpen(true);
             break;
        case "REPLY":
             addMessage({ id: Date.now().toString(), sender: 'maya', text: action.payload.message });
             break;
        default: break;
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
        addWorkflow,
        saveWorkflowAsTemplate,
        createWorkflowFromTemplate,
        advanceWorkflow,
        templates,
        workflowLogs,
        events, addEvent,
        iaStatus, setIaStatus,
        messages, addMessage,
        pendingAction, setPendingAction,
        executeIAAction,
        iaHistory,
        agentSuggestion, setAgentSuggestion,
        productivityScore, scoreBreakdown, scoreHistory, dailyFocus,
        notifications, unreadNotifications: notifications.filter(n => !n.read).length,
        markNotificationAsRead,
        clearAllNotifications,
        teams, currentTeam, switchTeam, userRole, 
        personality,
        generateReport,
        isSupabaseConnected,
        focusSession, endFocusSession,
        systemDecision 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  return useContext(AppContext);
}
