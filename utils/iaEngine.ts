

import { Task, CalendarEvent, IAHistoryItem } from '../types';
import { analyzePatterns } from './userPatterns';
import { generateWeeklyPlan, formatWeeklyPlan } from './weeklyPlanner';
import { generateReorganizationPlan } from './weekReorganizer';
import { checkDeadlineViability } from './deadlineNegotiator'; // Phase 5
import { generateQuarterGoals } from './quarterPlanner';

export type IAIntent =
  | "criar_tarefa"
  | "listar_tarefas"
  | "mudar_tela"
  | "conversar"
  | "criar_evento"
  | "planejar_semana"
  | "reorganizar_semana"
  | "definir_metas"
  | "iniciar_foco"
  | "parar_foco";

export interface IAAction {
  action: "ADD_TASK" | "ADD_EVENT" | "CHANGE_SCREEN" | "REPLY" | "REORGANIZE_WEEK" | "NEGOTIATE_DEADLINE" | "SAVE_GOALS" | "RESCHEDULE_TASK" | "START_FOCUS" | "END_FOCUS" | "UNKNOWN";
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
  if (lower.includes("planejar semana") || lower.includes("plano semanal")) return "planejar_semana";
  if (lower.includes("reorganizar") || (lower.includes("atraso") && lower.includes("ajudar"))) return "reorganizar_semana";
  if (lower.includes("meta") || lower.includes("trimestre") || lower.includes("objetivos")) return "definir_metas";
  return "conversar";
}

export function processIAInput(text: string, context: { tasks: Task[], events: CalendarEvent[], history?: IAHistoryItem[] }): IAAction {
  const intent = detectIntent(text);
  
  switch (intent) {
    case "iniciar_foco":
        // Find highest priority pending task
        const pending = context.tasks.filter(t => !t.completed).sort((a,b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            return 0;
        });
        const focusTask = pending[0];
        
        if (!focusTask) {
            return {
                action: "REPLY",
                payload: "Você não tem tarefas pendentes para focar agora!"
            };
        }

        return {
            action: "START_FOCUS",
            needsConfirmation: true,
            question: `Quer entrar no Modo Foco para a tarefa "${focusTask.title}"?`,
            payload: {
                taskId: focusTask.id,
                duration: 25
            }
        };

    case "parar_foco":
        return {
            action: "END_FOCUS",
            payload: { completed: false }
        };

    case "criar_tarefa":
      const taskTitle = text.replace(/(criar|nova|adicionar) tarefa/gi, '').trim();
      
      // Determine suggested date based on patterns
      const patterns = analyzePatterns(context.tasks);
      const suggestedDate = new Date();
      suggestedDate.setHours(patterns.preferredTaskHour, 0, 0, 0);
      
      // Logic: If past preferred hour, move to tomorrow
      if (new Date().getHours() >= patterns.preferredTaskHour) {
          suggestedDate.setDate(suggestedDate.getDate() + 1); 
      }

      // Phase 5: Check for Negotiation Trigger
      const negotiationAction = checkDeadlineViability(taskTitle, suggestedDate, context.tasks);
      
      if (negotiationAction && negotiationAction.type === 'NEGOTIATE_DEADLINE') {
          // Wrap it in the Engine's response structure
          // Note: checkDeadlineViability returns a full IAAction of type NEGOTIATE_DEADLINE
          return {
              action: "NEGOTIATE_DEADLINE", // This maps to the frontend Handler
              payload: negotiationAction.payload,
              needsConfirmation: true, // Forces UI to show modal
              question: "Preciso negociar esse prazo com você."
          };
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