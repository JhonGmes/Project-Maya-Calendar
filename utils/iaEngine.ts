
import { Task, CalendarEvent, IAHistoryItem } from '../types';
import { analyzePatterns } from './userPatterns';
import { generateWeeklyPlan, formatWeeklyPlan } from './weeklyPlanner';
import { generateReorganizationPlan } from './weekReorganizer';
import { reorganizeWeek } from '../domain/reorganizeWeek'; // Import new domain logic
import { checkDeadlineViability } from './deadlineNegotiator';
import { generateQuarterGoals } from './quarterPlanner';

export type IAIntent =
  | "criar_tarefa"
  | "listar_tarefas"
  | "mudar_tela"
  | "conversar"
  | "criar_evento"
  | "planejar_semana"
  | "reorganizar_semana" // Tasks
  | "reorganizar_calendario" // Events
  | "definir_metas"
  | "iniciar_foco"
  | "parar_foco"
  | "completar_etapa";

export interface IAAction {
  action: "ADD_TASK" | "ADD_EVENT" | "CHANGE_SCREEN" | "REPLY" | "REORGANIZE_WEEK" | "REORGANIZE_CALENDAR" | "NEGOTIATE_DEADLINE" | "SAVE_GOALS" | "RESCHEDULE_TASK" | "START_FOCUS" | "END_FOCUS" | "COMPLETE_STEP" | "UNKNOWN";
  payload: any;
  needsConfirmation?: boolean; 
  question?: string;           
}

export function detectIntent(text: string): IAIntent {
  const lower = text.toLowerCase();
  if (lower.includes("focar") || lower.includes("concentrar") || lower.includes("modo foco")) return "iniciar_foco";
  if (lower.includes("parar foco") || lower.includes("descansar") || lower.includes("terminar foco")) return "parar_foco";
  
  if (lower.includes("tarefa") && (lower.includes("nova") || lower.includes("criar") || lower.includes("adicionar"))) return "criar_tarefa";
  if (lower.includes("evento") || lower.includes("reunião") || lower.includes("agendar")) return "criar_evento";
  if (lower.includes("ver tarefas") || lower.includes("minhas tarefas")) return "listar_tarefas";
  if (lower.includes("abrir") || lower.includes("ir para") || lower.includes("mostrar")) return "mudar_tela";
  
  // Distinguish between Tasks and Calendar reorganization
  if (lower.includes("reorganizar") || lower.includes("arrumar")) {
      if (lower.includes("agenda") || lower.includes("calendário") || lower.includes("horários")) return "reorganizar_calendario";
      return "reorganizar_semana"; // Default to tasks if ambiguous or explicit
  }

  if (lower.includes("planejar semana") || lower.includes("plano semanal")) return "planejar_semana";
  if (lower.includes("meta") || lower.includes("trimestre") || lower.includes("objetivos")) return "definir_metas";
  if ((lower.includes("marcar") || lower.includes("concluir") || lower.includes("já fiz")) && (lower.includes("etapa") || lower.includes("passo"))) return "completar_etapa";
  return "conversar";
}

export function processIAInput(text: string, context: { tasks: Task[], events: CalendarEvent[], history?: IAHistoryItem[] }): IAAction {
  const intent = detectIntent(text);
  
  switch (intent) {
    case "reorganizar_calendario":
        const eventPlan = reorganizeWeek(context.events);
        
        if (eventPlan.length === 0) {
            return {
                action: "REPLY",
                payload: "Sua agenda parece ótima! Não encontrei conflitos ou sobreposições para corrigir."
            };
        }

        return {
            action: "REORGANIZE_CALENDAR",
            needsConfirmation: true,
            question: "Simulação de Agenda", // Used as title in UI
            payload: {
                plan: eventPlan,
                summary: `Encontrei ${eventPlan.length} ajustes para otimizar seu tempo.`
            }
        };

    case "iniciar_foco":
        // ... (existing logic)
        const pending = context.tasks.filter(t => !t.completed).sort((a,b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            return 0;
        });
        const focusTask = pending[0];
        if (!focusTask) return { action: "REPLY", payload: "Você não tem tarefas pendentes para focar agora!" };
        return {
            action: "START_FOCUS",
            needsConfirmation: true,
            question: `Quer entrar no Modo Foco para a tarefa "${focusTask.title}"?`,
            payload: { taskId: focusTask.id, duration: 25 }
        };

    case "parar_foco":
        return { action: "END_FOCUS", payload: { completed: false } };

    case "completar_etapa":
        const workflowTask = context.tasks.find(t => t.workflow && t.workflow.status === 'in_progress');
        if (workflowTask && workflowTask.workflow) {
            const nextStep = workflowTask.workflow.steps.find(s => s.status === 'available');
            if (nextStep) {
                return {
                    action: "COMPLETE_STEP",
                    needsConfirmation: true, 
                    question: `Confirma a conclusão da etapa "${nextStep.title}" no fluxo "${workflowTask.title}"?`,
                    payload: { taskId: workflowTask.id, stepId: nextStep.id, workflowId: workflowTask.workflow.id }
                };
            }
        }
        return { action: "REPLY", payload: "Não encontrei um fluxo ativo com etapas pendentes para concluir." };

    case "criar_tarefa":
      const taskTitle = text.replace(/(criar|nova|adicionar) tarefa/gi, '').trim();
      const patterns = analyzePatterns(context.tasks);
      const suggestedDate = new Date();
      suggestedDate.setHours(patterns.preferredTaskHour, 0, 0, 0);
      if (new Date().getHours() >= patterns.preferredTaskHour) suggestedDate.setDate(suggestedDate.getDate() + 1); 

      const negotiationAction = checkDeadlineViability(taskTitle, suggestedDate, context.tasks);
      if (negotiationAction && negotiationAction.type === 'NEGOTIATE_DEADLINE') {
          return {
              action: "NEGOTIATE_DEADLINE",
              payload: negotiationAction.payload,
              needsConfirmation: true,
              question: "Preciso negociar esse prazo com você."
          };
      }
      return {
        action: "ADD_TASK",
        needsConfirmation: true,
        question: `Entendido. Posso criar a tarefa "${taskTitle}" para aprox. ${patterns.preferredTaskHour}:00h?`,
        payload: { title: taskTitle, priority: "medium", completed: false, dueDate: suggestedDate }
      };

    case "criar_evento":
       const eventTitle = text.replace(/(agendar|novo|criar) (evento|reunião)/gi, '').trim();
       return {
          action: "ADD_EVENT",
          needsConfirmation: true, 
          question: `Quer que eu agende "${eventTitle}" para agora (duração de 1h)?`,
          payload: { title: eventTitle, category: 'work', start: new Date(), end: new Date(Date.now() + 60 * 60 * 1000) }
      };

    case "planejar_semana": 
       const plan = generateWeeklyPlan(context.tasks);
       return { action: "REPLY", payload: formatWeeklyPlan(plan) };

    case "reorganizar_semana":
        const newPlan = generateReorganizationPlan(context.tasks);
        return {
            action: "REORGANIZE_WEEK",
            needsConfirmation: true,
            question: "Detectei tarefas atrasadas. Posso reorganizar sua semana inteira para equilibrar a carga?",
            payload: newPlan
        };
    
    case "definir_metas":
        const goals = generateQuarterGoals(context.tasks, context.history || []);
        const goalsText = goals.map(g => `• ${g.title}`).join('\n');
        return {
            action: "SAVE_GOALS",
            needsConfirmation: true,
            question: `Com base nas suas tarefas recentes, sugiro estas metas para o trimestre:\n\n${goalsText}\n\nQuer que eu registre essas metas?`,
            payload: goals
        };

    case "mudar_tela":
      const lowerText = text.toLowerCase();
      let targetScreen = "dashboard";
      if (lowerText.includes("tarefa")) targetScreen = "tasks";
      if (lowerText.includes("calendário") || lowerText.includes("mês")) targetScreen = "month";
      if (lowerText.includes("rotina")) targetScreen = "routine";
      return { action: "CHANGE_SCREEN", payload: targetScreen };

    default:
      return { action: "REPLY", payload: null };
  }
}
