
import { Task, AgentSuggestion } from "../types";
import { isPast, isToday } from "date-fns";

/**
 * Analisa a lista de tarefas e retorna uma sugestão proativa (AgentSuggestion)
 * baseada em urgência, prioridade e atrasos.
 */
export function getNextTaskSuggestion(tasks: Task[]): AgentSuggestion | null {
  const now = new Date();
  
  // 1. Verificar atrasos (Crítico)
  const overdue = tasks.filter(
    t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.completed
  );

  if (overdue.length > 0) {
    const mostOverdue = overdue.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
    return {
      id: `overdue-${mostOverdue.id}`,
      type: 'warning',
      message: `Você tem ${overdue.length} tarefas atrasadas. A mais antiga é "${mostOverdue.title}". Quer reagendar?`,
      actionLabel: 'Resolver Atraso',
      actionData: {
          type: "ASK_CONFIRMATION",
          payload: {
              message: `Deseja reagendar "${mostOverdue.title}" para hoje?`,
              action: {
                  type: "RESCHEDULE_TASK",
                  payload: {
                      taskId: mostOverdue.id,
                      newDate: new Date().toISOString()
                  }
              }
          }
      }
    };
  }

  // 2. Tarefas para hoje (Foco)
  const todayTasks = tasks.filter(
      t => t.dueDate && isToday(new Date(t.dueDate)) && !t.completed
  ).sort((a, b) => {
      // Prioridade High vem primeiro
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
  });

  if (todayTasks.length > 0) {
    const nextTask = todayTasks[0];
    return {
        id: `focus-${nextTask.id}`,
        type: 'optimization',
        message: `Sugestão de foco para agora: "${nextTask.title}" (${nextTask.priority === 'high' ? 'Alta Prioridade' : 'Hoje'}).`,
        actionLabel: 'Marcar Concluída', // Ação rápida sugerida
        actionData: {
            type: "ASK_CONFIRMATION",
            payload: {
                message: `Você já terminou "${nextTask.title}"? Posso marcar como concluída?`,
                action: {
                    type: "NO_ACTION" // Placeholder, ideal seria uma action COMPLETE_TASK
                }
            }
        }
    };
  }

  return null;
}
