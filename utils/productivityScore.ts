
import { Task, IAHistoryItem, ScoreBreakdown, ProductivityScore } from '../types';
import { isSameDay, differenceInMinutes } from 'date-fns';

// Constants
const POINTS_FOCUS_SESSION = 10;
const POINTS_TASK = 5;
const POINTS_IA_ACCEPTANCE = 20; // Max points for good AI usage
const POINTS_CONSISTENCY = 10;
const PENALTY_OVERLOAD = 10;

/**
 * Calculates the explainable score based on the 3 pillars:
 * 1. Execution (Tasks)
 * 2. Focus (Deep Work)
 * 3. AI Collaboration (Acceptance Rate)
 */
export function calculateScoreBreakdown(
    tasks: Task[], 
    history: IAHistoryItem[], 
    scoreHistoryDates: Date[] 
): ScoreBreakdown {
  
  const now = new Date();
  let focusPoints = 0;
  let taskPoints = 0;
  let iaBonus = 0;
  let penalties = 0;
  let consistencyBonus = 0;
  
  // 1. FOCUS POINTS (Sessões de Foco)
  let focusSessionsCount = 0;
  const todayHistory = history.filter(h => isSameDay(new Date(h.timestamp), now));
  
  todayHistory.forEach(h => {
      if (h.action.type === 'END_FOCUS') {
          // Assuming successful focus session if recorded
          focusSessionsCount++;
          focusPoints += POINTS_FOCUS_SESSION;
      }
  });

  // 2. TASK EXECUTION (Tarefas completas hoje)
  const completedToday = tasks.filter(t => t.completed && t.dueDate && isSameDay(new Date(t.dueDate), now));
  taskPoints = completedToday.length * POINTS_TASK;

  // 3. AI ACCEPTANCE RATE (Colaboração)
  // IA Actions suggested by AI vs Actions confirmed/executed by User
  // Heuristic: We look at history where source='ai'. 
  // Ideally we match suggestions to confirmations. 
  // Simplified: If user executed actions that match AI types (e.g. create task, start focus) via AI prompts.
  const aiSuggestions = history.filter(h => h.source === 'ai' && isSameDay(new Date(h.timestamp), now));
  const aiExecutions = history.filter(h => h.source === 'ai' && isSameDay(new Date(h.timestamp), now) && h.action.type !== 'REPLY' && h.action.type !== 'NO_ACTION');
  
  const iaTotal = aiSuggestions.length;
  const iaAccepted = aiExecutions.length; // Approximate "accepted" as executed actions sourced from AI
  
  const iaAcceptanceRate = iaTotal > 0 ? (iaAccepted / iaTotal) : 0;
  iaBonus = Math.round(iaAcceptanceRate * POINTS_IA_ACCEPTANCE);

  // 4. CONSISTENCY
  const streak = calculateStreak(scoreHistoryDates);
  if (streak >= 3) consistencyBonus = POINTS_CONSISTENCY;

  // Total
  const total = Math.min(100, Math.max(0, focusPoints + taskPoints + iaBonus + consistencyBonus - penalties));

  return {
      focusPoints,
      taskPoints,
      consistencyBonus,
      iaBonus,
      penalties,
      streakDays: streak,
      total,
      
      // Explanation Data
      completedTasksCount: completedToday.length,
      focusSessionsCount,
      iaAcceptanceRate
  };
}

export function calculateProductivityScore(
    tasks: Task[], 
    history: IAHistoryItem[], 
    scoreHistoryDates: Date[] 
): ProductivityScore {
    const breakdown = calculateScoreBreakdown(tasks, history, scoreHistoryDates);
    const now = new Date();

    return {
        date: now.toISOString(),
        score: breakdown.total,
        focusMinutes: breakdown.focusSessionsCount * 25, // Estimate
        tasksCompleted: breakdown.completedTasksCount,
        breakdown
    };
}

export function calculateScore(tasks: Task[], history: IAHistoryItem[], scoreHistoryDates: Date[] = []): number {
    const breakdown = calculateScoreBreakdown(tasks, history, scoreHistoryDates);
    return breakdown.total;
}

export function getScoreLevel(score: number): string {
    if (score >= 90) return "Elite";
    if (score >= 80) return "Alta Performance";
    if (score >= 60) return "Consistente";
    if (score >= 40) return "Em Desenvolvimento";
    return "Baixa";
}

function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(dates.map(d => d.toDateString()))).map(s => new Date(s)).sort((a,b) => b.getTime() - a.getTime());
    let streak = 0;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (!isSameDay(uniqueDates[0], today) && !isSameDay(uniqueDates[0], yesterday)) return 0;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diffDays = Math.round((uniqueDates[i].getTime() - uniqueDates[i+1].getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else break;
    }
    return streak + 1;
}
