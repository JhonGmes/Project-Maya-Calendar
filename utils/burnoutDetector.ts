
import { Task, IAHistoryItem, BurnoutAnalysis } from '../types';
import { isSameWeek, subDays, isPast, isToday } from 'date-fns';

export function detectBurnout(
    tasks: Task[], 
    history: IAHistoryItem[], 
    productivityScore: number
): BurnoutAnalysis {
  let riskScore = 0;
  const signals: string[] = [];
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);

  // Filter history for the last 7 days for relevant analysis
  const recentHistory = history.filter(h => new Date(h.timestamp) > oneWeekAgo);

  // 1. SIGNAL: Excessive Focus Hours (Approximate)
  // Each completed focus session is approx 25-45 mins. 
  // Risk if > 20 sessions (~10-15 hours of deep focus recorded in app is A LOT for a week)
  const focusSessions = recentHistory.filter(h => h.action.type === 'END_FOCUS' && h.action.payload.completed).length;
  if (focusSessions > 30) {
      riskScore += 3;
      signals.push("Excesso de horas de foco intenso (>15h).");
  } else if (focusSessions > 20) {
      riskScore += 1;
      signals.push("Carga de foco elevada.");
  }

  // 2. SIGNAL: Interruptions (Incomplete Focus Sessions)
  const interruptedSessions = recentHistory.filter(h => h.action.type === 'END_FOCUS' && !h.action.payload.completed).length;
  if (interruptedSessions > 10) {
      riskScore += 2;
      signals.push("Muitas interrupções em sessões de foco.");
  }

  // 3. SIGNAL: Overdue Tasks (Work accumulation)
  const overdueTasks = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.completed).length;
  if (overdueTasks > 5) {
      riskScore += 3;
      signals.push(`${overdueTasks} tarefas atrasadas acumuladas.`);
  } else if (overdueTasks > 2) {
      riskScore += 1;
      signals.push("Tarefas começando a acumular.");
  }

  // 4. SIGNAL: Reschedule Frequency (Procrastination/Blockers)
  const reschedules = recentHistory.filter(h => h.action.type === 'RESCHEDULE_TASK').length;
  if (reschedules > 5) {
      riskScore += 2;
      signals.push("Muitos reagendamentos recentes.");
  }

  // 5. SIGNAL: Score Drop
  if (productivityScore < 40 && tasks.length > 5) {
      riskScore += 1;
      signals.push("Score de produtividade em nível de alerta.");
  }

  // Final Classification based on Points
  let level: "low" | "medium" | "high" = "low";
  if (riskScore >= 8) level = "high";
  else if (riskScore >= 5) level = "medium";

  // Prioritize most critical signal for the summary
  const reason = signals.length > 0 ? signals[0] : "Ritmo sustentável.";

  return {
      level,
      signals,
      workloadScore: riskScore,
      reason
  };
}
