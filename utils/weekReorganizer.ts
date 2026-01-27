
import { Task, TaskChange } from '../types';
import { addDays } from 'date-fns';

/**
 * Gera um plano de reorganização movendo tarefas de dias cheios para o dia seguinte.
 * Retorna uma lista de "Mudanças" (Diff) para aprovação do usuário.
 */
export function generateReorganizationPlan(tasks: Task[]): { changes: TaskChange[], reason: string } {
  const changes: TaskChange[] = [];
  const MAX_TASKS_PER_DAY = 5; // Regra simples para demonstração

  // Agrupar tarefas por dia
  const tasksByDay: Record<string, Task[]> = {};
  
  // Ordenar por data
  const sortedTasks = [...tasks]
      .filter(t => !t.completed && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  sortedTasks.forEach(task => {
      const day = new Date(task.dueDate!).toISOString().split('T')[0];
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(task);
  });

  // Iterar e mover excedentes
  const days = Object.keys(tasksByDay).sort();
  
  for (const day of days) {
      const dailyTasks = tasksByDay[day];
      
      // Se tem mais tarefas que o limite, move as de menor prioridade/últimas para o próximo dia útil
      if (dailyTasks.length > MAX_TASKS_PER_DAY) {
          const tasksToMove = dailyTasks.slice(MAX_TASKS_PER_DAY);
          
          tasksToMove.forEach(task => {
              const currentDueDate = new Date(task.dueDate!);
              const nextDay = addDays(currentDueDate, 1);
              // Pula fim de semana simples (Sábado -> Segunda, Domingo -> Segunda)
              if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
              if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
              
              nextDay.setHours(9, 0, 0, 0);

              changes.push({
                  taskId: task.id,
                  taskTitle: task.title,
                  from: currentDueDate.toISOString(),
                  to: nextDay.toISOString()
              });
          });
      }
  }

  return {
      changes,
      reason: changes.length > 0 
        ? `Detectei sobrecarga em alguns dias (> ${MAX_TASKS_PER_DAY} tarefas). Sugiro mover ${changes.length} tarefas para equilibrar sua semana.` 
        : "Sua semana parece equilibrada."
  };
}

export function applyReorganization(payload: { changes: TaskChange[], reason: string }): { taskId: string, newDate: Date }[] {
    if (!payload || !payload.changes) return [];
    return payload.changes.map(change => ({
        taskId: change.taskId,
        newDate: new Date(change.to)
    }));
}
