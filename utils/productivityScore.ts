
import { Task, IAHistoryItem } from '../types';
import { isSameWeek, parseISO } from 'date-fns';

export function calculateScore(tasks: Task[], history: IAHistoryItem[] = []): number {
  let score = 0;
  const now = new Date();

  // 1. Base Score: Conclusão de Tarefas
  tasks.forEach(task => {
    if (!task.completed) return;

    // Base points for completion
    score += 10;

    // Bonus for completing before deadline
    if (task.dueDate) {
        if (new Date(task.dueDate) > now) {
            score += 5; // On time bonus
        } else {
            score -= 2; // Late penalty (suave)
        }
    }

    // Bonus for high priority
    if (task.priority === 'high') score += 5;
  });

  // 2. Penalidade por Adiamento (Rescheduling) - Últimos 7 dias
  const recentReschedules = history.filter(h => {
      const isReschedule = h.action.type === 'RESCHEDULE_TASK';
      const isRecent = isSameWeek(new Date(h.timestamp), now);
      return isReschedule && isRecent;
  });

  // Cada adiamento custa 3 pontos
  score -= (recentReschedules.length * 3);

  // 3. Bonus de Consistência (Histórico de ações da IA aceitas)
  const acceptedSuggestions = history.filter(h => 
      h.source === 'user' && // Usuário confirmou
      h.action.type !== 'NO_ACTION' &&
      isSameWeek(new Date(h.timestamp), now)
  );
  score += (acceptedSuggestions.length * 2);

  // Ensure score stays within 0-100 logic (normalized dynamically based on tasks count if needed, but keeping absolute for now with a cap)
  // To make it look like a 0-100 "health" metric, we might need a different algorithm, 
  // but for a "XP" style score, capping at 0 is enough.
  // Let's cap at 100 for the UI visualization to make sense as a "Health Bar".
  
  // Logic adjustment: If user has 0 tasks completed, score is 0.
  // If user has tasks, we try to normalize slightly.
  
  return Math.max(0, Math.min(100, score));
}

export function getScoreLevel(score: number): string {
    if (score < 30) return 'Precisa de Foco';
    if (score < 60) return 'Em Progresso';
    if (score < 85) return 'Produtivo';
    return 'Alta Performance';
}
