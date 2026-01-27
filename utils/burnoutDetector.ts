
import { Task, IAHistoryItem, BurnoutAnalysis } from '../types';
import { isSameWeek, subDays, isPast, isToday } from 'date-fns';

export function calculateBurnoutRisk(
    tasks: Task[], 
    history: IAHistoryItem[], 
    productivityScore: number
): BurnoutAnalysis {
  let points = 0;
  const signals: string[] = [];
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);

  // Filter history for the last 7 days for relevant analysis
  const recentHistory = history.filter(h => new Date(h.timestamp) > oneWeekAgo);

  // 1. SIGNAL: Focus Hours
  // Calculate total focus duration from END_FOCUS actions (assuming 25m if duration not logged explicitly)
  // We can look at START_FOCUS for duration, but for simplicity, let's use completed sessions count * 25m
  const completedFocusSessions = recentHistory.filter(h => h.action.type === 'END_FOCUS' && h.action.payload.completed).length;
  const focusHours = (completedFocusSessions * 25) / 60;

  if (focusHours > 40) {
      points += 3;
      signals.push("Excesso de horas de foco (> 40h)");
  }

  // 2. SIGNAL: Interruptions (Incomplete Focus Sessions)
  const interruptedSessions = recentHistory.filter(h => h.action.type === 'END_FOCUS' && !h.action.payload.completed).length;
  
  if (interruptedSessions > 10) {
      points += 2;
      signals.push("Muitas interrupções");
  }

  // 3. SIGNAL: Overdue Tasks (Work accumulation)
  const overdueTasks = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.completed).length;
  
  if (overdueTasks > 3) {
      points += 3;
      signals.push("Tarefas atrasadas acumuladas");
  }

  // 4. SIGNAL: Score Trend
  if (productivityScore < 40) {
      points += 1;
      signals.push("Queda no score de produtividade");
  }

  // Final Classification based on Points
  let level: "low" | "medium" | "high" = "low";
  if (points >= 8) level = "high";
  else if (points >= 5) level = "medium";

  // Prioritize most critical signal for the summary
  const reason = signals.length > 0 ? signals[0] : "Ritmo sustentável.";

  return {
      level,
      signals,
      workloadScore: points,
      reason
  };
}

// Wrapper to maintain compatibility with existing imports if any
export const detectBurnout = calculateBurnoutRisk;
