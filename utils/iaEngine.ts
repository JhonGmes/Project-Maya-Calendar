
import { Task, CalendarEvent } from '../types';
import { analyzePatterns } from './userPatterns';
import { generateWeeklyPlan, formatWeeklyPlan } from './weeklyPlanner';
import { reorganizeWeek } from './weekReorganizer';
import { proposeNewDeadline } from './deadlineNegotiator';
import { generateQuarterGoals } from './quarterPlanner'; // Phase 26

export type IAIntent =
  | "criar_tarefa"
  | "listar_tarefas"
  | "mudar_tela"
  | "conversar"
  | "criar_evento"
  | "planejar_semana"
  | "reorganizar_semana"
  | "definir_metas"; // Phase 26

export interface IAAction {
  action: "ADD_TASK" | "ADD_EVENT" | "CHANGE_SCREEN" | "REPLY" | "REORGANIZE_WEEK" | "NEGOTIATE_DEADLINE" | "SAVE_GOALS" | "UNKNOWN";
  payload: any;
  needsConfirmation?: boolean; 
  question?: string;           
}

export function detectIntent(text: string): IAIntent {
  const lower = text.toLowerCase();
  if (lower.includes("tarefa") && (lower.includes("nova") || lower.includes("criar") || lower.includes("adicionar"))) return "criar_tarefa";
  if (lower.includes("evento") || lower.includes("reunião") || lower.includes("agendar")) return "criar_evento";
  if (lower.includes("ver tarefas") || lower.includes("minhas tarefas")) return "listar_tarefas";
  if (lower.includes("abrir") || lower.includes("ir para") || lower.includes("mostrar")) return "mudar_tela";
  if (lower.includes("planejar semana") || lower.includes("plano semanal")) return "planejar_semana";
  if (lower.includes("reorganizar") || (lower.includes("atraso") && lower.includes("ajudar"))) return "reorganizar_semana";
  if (lower.includes("meta") || lower.includes("trimestre") || lower.includes("objetivos")) return "definir_metas";
  return "conversar";
}

export function processIAInput(text: string, context: { tasks: Task[], events: CalendarEvent[] }): IAAction {
  const intent = detectIntent(text);
  
  switch (intent) {
    case "criar_tarefa":
      const taskTitle = text.replace(/(criar|nova|adicionar) tarefa/gi, '').trim();
      
      const proposedDeadline = proposeNewDeadline(context.tasks);
      if (proposedDeadline) {
          return {
              action: "NEGOTIATE_DEADLINE",
              needsConfirmation: true,
              question: `Sua agenda está bem cheia (>5 pendentes). Posso agendar "${taskTitle}" direto para amanhã (${proposedDeadline.getDate()}/${proposedDeadline.getMonth()+1}) para evitar sobrecarga?`,
              payload: {
                  title: taskTitle,
                  dueDate: proposedDeadline
              }
          };
      }

      const patterns = analyzePatterns(context.tasks);
      const suggestedDate = new Date();
      suggestedDate.setHours(patterns.preferredTaskHour, 0, 0, 0);
      if (suggestedDate < new Date()) {
          suggestedDate.setDate(suggestedDate.getDate() + 1); 
      }

      return {
        action: "ADD_TASK",
        needsConfirmation: true,
        question: `Entendido. Posso criar a tarefa "${taskTitle}" para aprox. ${patterns.preferredTaskHour}:00h?`,
        payload: {
          title: taskTitle,
          priority: "medium",
          completed: false,
          dueDate: suggestedDate
        }
      };

    case "criar_evento":
       const eventTitle = text.replace(/(agendar|novo|criar) (evento|reunião)/gi, '').trim();
       return {
          action: "ADD_EVENT",
          needsConfirmation: true, 
          question: `Quer que eu agende "${eventTitle}" para agora (duração de 1h)?`,
          payload: {
              title: eventTitle,
              category: 'work',
              start: new Date(),
              end: new Date(Date.now() + 60 * 60 * 1000)
          }
      };

    case "planejar_semana": 
       const plan = generateWeeklyPlan(context.tasks);
       const formattedPlan = formatWeeklyPlan(plan);
       return {
           action: "REPLY",
           payload: formattedPlan
       };

    case "reorganizar_semana":
        const newPlan = reorganizeWeek(context.tasks);
        return {
            action: "REORGANIZE_WEEK",
            needsConfirmation: true,
            question: "Detectei tarefas atrasadas. Posso reorganizar sua semana inteira para equilibrar a carga?",
            payload: newPlan
        };
    
    case "definir_metas":
        const goals = generateQuarterGoals(context.tasks);
        const goalsText = goals.map(g => `• ${g.title}`).join('\n');
        return {
            action: "SAVE_GOALS",
            needsConfirmation: true,
            question: `Com base nas suas tarefas recentes, sugiro estas metas para o trimestre:\n\n${goalsText}\n\nQuer que eu registre essas metas?`,
            payload: goals
        };

    case "mudar_tela":
      const lower = text.toLowerCase();
      let targetScreen = "dashboard";
      if (lower.includes("tarefa")) targetScreen = "tasks";
      if (lower.includes("calendário") || lower.includes("mês")) targetScreen = "month";
      if (lower.includes("rotina")) targetScreen = "routine";
      
      return {
        action: "CHANGE_SCREEN",
        payload: targetScreen
      };

    default:
      // Return null payload to signal fallback to LLM
      return {
        action: "REPLY",
        payload: null 
      };
  }
}
