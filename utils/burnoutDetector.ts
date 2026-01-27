
import { Task, IAHistoryItem, BurnoutAnalysis } from '../types';
import { isSameWeek, subDays } from 'date-fns';

export function detectBurnout(
    tasks: Task[], 
    history: IAHistoryItem[], 
    productivityScore: number
): BurnoutAnalysis {
  let riskScore = 0;
  const signals: string[] = [];
  const now = new Date();

  // 1. SIGNAL: Operational Overload (Pending Tasks)
  const pendingCount = tasks.filter(t => !t.completed).length;
  if (pendingCount > 15) {
      riskScore += 3;
      signals.push(`Carga de trabalho crítica: ${pendingCount} tarefas pendentes.`);
  } else if (pendingCount > 8) {
      riskScore += 1;
      signals.push("Volume de tarefas acima do ideal.");
  }

  // 2. SIGNAL: Reschedule Rate (Procrastination/Blockers)
  const last3Days = subDays(now, 3);
  const recentReschedules = history.filter(h => 
      h.action.type === 'RESCHEDULE_TASK' && 
      new Date(h.timestamp) > last3Days
  ).length;

  if (recentReschedules > 5) {
      riskScore += 2; 
      signals.push("Reagendamentos frequentes nos últimos 3 dias.");
  }

  // 3. SIGNAL: AI Rejection Rate (Resistance/Overwhelmed)
  // Look for suggestions that were NOT confirmed (implicit rejection or ignore)
  // or explicitly if we had a rejection action.
  // Approximation: High number of suggestions vs Low number of executions
  const recentSuggestions = history.filter(h => 
      h.source === 'ai' && 
      h.action.type !== 'NO_ACTION' &&
      new Date(h.timestamp) > last3Days
  );
  
  // In a real scenario we'd track "rejection" explicitly. 
  // Here we assume if score is low AND tasks are high, user is ignoring help.
  if (pendingCount > 10 && productivityScore < 40) {
      riskScore += 1;
      signals.push("Baixa adesão ao ritmo sugerido pela IA.");
  }

  // 4. SIGNAL: Concentration of Responsibility (For Teams)
  // If tasks have workflows, check if user is bottleneck
  const workflowTasks = tasks.filter(t => t.workflow && !t.completed);
  if (workflowTasks.length > 3) {
      riskScore += 1;
      signals.push("Gargalo operacional: múltiplos workflows parados em você.");
  }

  // Final Classification
  let level: "low" | "medium" | "high" = "low";
  if (riskScore >= 5) level = "high";
  else if (riskScore >= 3) level = "medium";

  return {
      level,
      signals,
      workloadScore: pendingCount,
      reason: signals.length > 0 ? signals[0] : "Carga normal."
  };
}
