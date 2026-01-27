
import { Task, IAHistoryItem, BurnoutAnalysis } from '../types';
import { isSameWeek } from 'date-fns';

export function detectBurnout(
    tasks: Task[], 
    history: IAHistoryItem[], 
    productivityScore: number
): BurnoutAnalysis {
  let risk = 0;
  const signals: string[] = [];
  const now = new Date();

  // 1. Sinal: Volume de tarefas pendentes excessivo
  const pendingCount = tasks.filter(t => !t.completed).length;
  if (pendingCount > 15) {
      risk += 2;
      signals.push("Volume de tarefas pendentes muito alto (>15).");
  } else if (pendingCount > 10) {
      risk += 1;
      signals.push("Carga de trabalho elevada.");
  }

  // 2. Sinal: Adiamentos repetitivos (Procrastinação forçada ou falta de tempo)
  const weeklyReschedules = history.filter(h => 
      h.action.type === 'RESCHEDULE_TASK' && 
      isSameWeek(new Date(h.timestamp), now)
  ).length;

  if (weeklyReschedules > 8) {
      risk += 3; // Alto risco
      signals.push("Muitas tarefas sendo adiadas repetidamente.");
  } else if (weeklyReschedules > 5) {
      risk += 1;
      signals.push("Número considerável de remarcações nesta semana.");
  }

  // 3. Sinal: Queda brusca de produtividade (Score baixo)
  if (productivityScore < 30 && tasks.length > 5) {
      risk += 2;
      signals.push("Produtividade abaixo do normal para o volume de tarefas.");
  }

  // 4. Sinal: Tarefas atrasadas (Overdue)
  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && !t.completed).length;
  if (overdueCount > 5) {
      risk += 2;
      signals.push("Acúmulo de tarefas atrasadas.");
  }

  // Classificação final
  let level: "low" | "medium" | "high" = "low";
  if (risk >= 5) level = "high";
  else if (risk >= 3) level = "medium";

  return {
      level,
      signals
  };
}
