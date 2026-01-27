
import { Task, IAHistoryItem, ScoreBreakdown, ProductivityScore } from '../types';
import { isSameDay, differenceInMinutes } from 'date-fns';

// Constants
const POINTS_FOCUS_SESSION_SHORT = 10; // < 30 min
const POINTS_FOCUS_SESSION_LONG = 25;  // >= 30 min
const POINTS_TASK_SIMPLE = 5;
const POINTS_TASK_MEDIUM = 10;
const POINTS_TASK_COMPLEX = 20; // High Priority
const POINTS_CONSISTENCY_3_DAYS = 10;
const POINTS_CONSISTENCY_5_DAYS = 20;
const PENALTY_OVERLOAD = 10;
const PENALTY_RESCHEDULE = 3;

/**
 * Calculates the explainable score based on the 4 pillars.
 */
export function calculateScoreBreakdown(
    tasks: Task[], 
    history: IAHistoryItem[], 
    scoreHistoryDates: Date[] 
): ScoreBreakdown {
  
  const now = new Date();
  let focusPoints = 0;
  let taskPoints = 0;
  let penalties = 0;
  
  // 1. FOCUS POINTS (Motor Ligado)
  let focusMinutesToday = 0;
  const todayHistory = history.filter(h => isSameDay(new Date(h.timestamp), now));
  
  for (let i = 0; i < todayHistory.length; i++) {
      if (todayHistory[i].action.type === 'END_FOCUS') {
          const end = new Date(todayHistory[i].timestamp);
          const startItem = history.slice(0, i).reverse().find(h => 
              h.action.type === 'START_FOCUS' && 
              differenceInMinutes(end, new Date(h.timestamp)) < 240
          );

          if (startItem) {
              const minutes = differenceInMinutes(end, new Date(startItem.timestamp));
              focusMinutesToday += minutes;
              
              if (minutes >= 25) {
                   focusPoints += (minutes >= 50 ? POINTS_FOCUS_SESSION_LONG : POINTS_FOCUS_SESSION_SHORT);
              } else if (minutes > 5) {
                   focusPoints += 5; // Mini session
              }
          }
      }
  }

  // 2. TASK EXECUTION (Caminho Percorrido)
  // Approximate logic: tasks completed that have due date today OR were completed recently (if we had completedAt)
  // Using dueDate as proxy for "planned for today"
  const completedToday = tasks.filter(t => t.completed && t.dueDate && isSameDay(new Date(t.dueDate), now));
  
  completedToday.forEach(task => {
      if (task.priority === 'high') taskPoints += POINTS_TASK_COMPLEX;
      else if (task.priority === 'medium') taskPoints += POINTS_TASK_MEDIUM;
      else taskPoints += POINTS_TASK_SIMPLE;
  });

  // 3. CONSISTENCY (Streak)
  const streak = calculateStreak(scoreHistoryDates);
  let consistencyBonus = 0;
  if (streak >= 3) consistencyBonus = POINTS_CONSISTENCY_3_DAYS;
  if (streak >= 5) consistencyBonus = POINTS_CONSISTENCY_5_DAYS;
  if (taskPoints > 0 || focusPoints > 0) consistencyBonus += 5; // Day active bonus

  // 4. PENALTIES (Saúde)
  if (completedToday.length > 8 && focusMinutesToday > 300) {
      penalties += PENALTY_OVERLOAD;
  }
  
  const reschedulesToday = todayHistory.filter(h => h.action.type === 'RESCHEDULE_TASK').length;
  penalties += (reschedulesToday * PENALTY_RESCHEDULE);

  return {
      focusPoints,
      taskPoints,
      consistencyBonus,
      penalties,
      streakDays: streak,
      total: Math.max(0, focusPoints + taskPoints + consistencyBonus - penalties)
  };
}

export function calculateProductivityScore(
    tasks: Task[], 
    history: IAHistoryItem[], 
    scoreHistoryDates: Date[] 
): ProductivityScore {
    const breakdown = calculateScoreBreakdown(tasks, history, scoreHistoryDates);
    
    // Estimate focus minutes again for the top-level object
    const now = new Date();
    const todayHistory = history.filter(h => isSameDay(new Date(h.timestamp), now));
    let focusMinutes = 0;
    
    // Simplified calc for display
    for (let i = 0; i < todayHistory.length; i++) {
      if (todayHistory[i].action.type === 'END_FOCUS') {
          focusMinutes += 25; // Estimate or calc precisely if possible
      }
    }

    const tasksCompleted = tasks.filter(t => t.completed && t.dueDate && isSameDay(new Date(t.dueDate), now)).length;

    return {
        date: new Date().toISOString(),
        score: breakdown.total,
        focusMinutes,
        tasksCompleted,
        breakdown
    };
}

// Helper: Calculate Streak
function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    
    const uniqueDates = Array.from(new Set(dates.map(d => d.toDateString())))
                             .map(s => new Date(s))
                             .sort((a,b) => b.getTime() - a.getTime()); // Descending
    
    let streak = 0;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (!isSameDay(uniqueDates[0], today) && !isSameDay(uniqueDates[0], yesterday)) {
        return 0;
    }

    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diffDays = Math.round((uniqueDates[i].getTime() - uniqueDates[i+1].getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else break;
    }
    return streak + 1;
}

export function calculateScore(tasks: Task[], history: IAHistoryItem[] = []): number {
    const dates = history.map(h => new Date(h.timestamp));
    return calculateScoreBreakdown(tasks, history, dates).total;
}

export function getScoreLevel(score: number): string {
    if (score < 30) return 'Dia Fraco';
    if (score < 60) return 'Dia Ok';
    if (score < 90) return 'Dia Forte';
    return 'Excepcional';
}
