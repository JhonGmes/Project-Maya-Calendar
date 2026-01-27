
import { Task, IAHistoryItem, ScoreBreakdown, DailySummary } from '../types';
import { calculateScoreBreakdown, getScoreLevel } from './productivityScore';
import { isSameDay } from 'date-fns';

export function generateDailySummary(
    tasks: Task[], 
    history: IAHistoryItem[],
    scoreHistoryDates: Date[]
): DailySummary {
    const breakdown = calculateScoreBreakdown(tasks, history, scoreHistoryDates);
    const now = new Date();

    // Calculate generic stats
    const tasksCompletedToday = tasks.filter(t => t.completed && t.dueDate && isSameDay(new Date(t.dueDate), now)).length;
    
    // Calculate Focus Minutes (Simulated based on logic in productivityScore)
    // In a real app, this should be shared logic or passed in
    const todayHistory = history.filter(h => isSameDay(new Date(h.timestamp), now));
    const focusSessionsCount = todayHistory.filter(h => h.action.type === 'START_FOCUS').length;
    
    // Estimate focus minutes based on breakdown points (Reverse engineering for display)
    // 15 pts = 25m session (roughly). 
    // This is for display only.
    const estimatedFocusMinutes = focusSessionsCount * 25; 

    // Generate Message
    let message = "";
    if (breakdown.total > 90) message = "Performance excepcional! Você dominou o dia.";
    else if (breakdown.total > 60) message = "Dia sólido. Boa consistência nas entregas.";
    else if (breakdown.total > 30) message = "Bom avanço, mas podemos melhorar o foco amanhã.";
    else message = "Dia difícil? Tudo bem, amanhã é um novo começo.";

    // Simple suggestion
    const pendingTasks = tasks.filter(t => !t.completed);
    const suggestion = pendingTasks.length > 0 
        ? `Sugiro começar amanhã pela tarefa "${pendingTasks[0].title}".`
        : "Que tal planejar sua rotina matinal para amanhã?";

    return {
        date: now.toISOString(),
        score: breakdown.total,
        breakdown: breakdown,
        focusSessions: focusSessionsCount,
        focusMinutes: estimatedFocusMinutes,
        tasksCompleted: tasksCompletedToday,
        message,
        suggestionForTomorrow: suggestion
    };
}
