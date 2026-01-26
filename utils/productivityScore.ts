
import { Task } from '../types';

export function calculateScore(tasks: Task[]): number {
  let score = 0;
  const now = new Date();

  tasks.forEach(task => {
    if (!task.completed) return;

    // Base points for completion
    score += 10;

    // Bonus for completing before deadline
    if (task.dueDate) {
        if (new Date(task.dueDate) > now) {
            score += 5; // On time
        } else {
            score -= 5; // Late
        }
    }
  });

  // Ensure score doesn't go below 0 for morale
  return Math.max(0, score);
}

export function getScoreLevel(score: number): string {
    if (score < 50) return 'Iniciante';
    if (score < 100) return 'Focado';
    if (score < 200) return 'Produtivo';
    if (score < 500) return 'Mestre do Tempo';
    return 'Lendário';
}
