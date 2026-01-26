
import { Task } from '../types';
import { calculatePriority } from './taskUtils';

export function suggestNextTask(tasks: Task[]): string {
  const pendingTasks = tasks.filter(t => !t.completed);
  
  if (pendingTasks.length === 0) {
    return "Você está livre agora. Que tal planejar algo novo ou tirar um tempo para descansar?";
  }

  // Ensure sorting by deadline/priority logic is applied for the suggestion
  const sorted = [...pendingTasks].sort((a, b) => {
      // Sort by deadline (if exists) then by priority logic implied by deadline
     if (!a.dueDate) return 1;
     if (!b.dueDate) return -1;
     return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const next = sorted[0];
  const priority = calculatePriority(next);
  
  const priorityLabel = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa';
  const deadlineText = next.dueDate ? new Date(next.dueDate).toLocaleDateString() : 'sem data';

  return `Sugiro focar agora em "${next.title}". Prioridade ${priorityLabel} (Prazo: ${deadlineText}).`;
}
