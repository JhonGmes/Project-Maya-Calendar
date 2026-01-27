
import { WeeklyStats, Task, ScoreHistory, IAHistoryItem } from '../types';
import { startOfWeek, endOfWeek, format, isWithinInterval, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function calculateWeeklyStats(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[]
): WeeklyStats[] {
    const stats: WeeklyStats[] = [];
    const weeksToAnalyze = 4; // Last 4 weeks

    for (let i = weeksToAnalyze - 1; i >= 0; i--) {
        const now = new Date();
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 0 });

        // 1. Productivity Score (Average for the week)
        const weeklyScores = scoreHistory.filter(h => 
            isWithinInterval(new Date(h.createdAt), { start: weekStart, end: weekEnd })
        );
        const avgScore = weeklyScores.length > 0 
            ? Math.round(weeklyScores.reduce((acc, curr) => acc + curr.score, 0) / weeklyScores.length)
            : (i === 0 ? 50 : stats[stats.length-1]?.productivityScore || 50); // Fallback

        // 2. Completed Tasks
        // Note: In a real app, we'd check 'completedAt'. Here we approximate with history or current state if completed.
        // For accurate historical data, we'd need a 'completedAt' field on Task. 
        // We will infer from IAHistory END_FOCUS or NO_ACTION completions if available, or just mock slightly based on current data distribution
        const completedCount = tasks.filter(t => t.completed && t.dueDate && isWithinInterval(new Date(t.dueDate), { start: weekStart, end: weekEnd })).length;

        // 3. Postponed Tasks (from IAHistory)
        const postponedCount = iaHistory.filter(h => 
            h.action.type === 'RESCHEDULE_TASK' &&
            isWithinInterval(new Date(h.timestamp), { start: weekStart, end: weekEnd })
        ).length;

        // 4. Burnout Level (Simplified logic)
        let burnoutLevel: "low" | "medium" | "high" = "low";
        if (postponedCount > 5 || (avgScore < 40 && completedCount > 5)) burnoutLevel = "high";
        else if (postponedCount > 2) burnoutLevel = "medium";

        stats.push({
            weekLabel: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
            productivityScore: avgScore,
            completedTasks: completedCount,
            postponedTasks: postponedCount,
            burnoutLevel
        });
    }

    return stats;
}

export function getProductiveHours(tasks: Task[]): { hour: number, count: number }[] {
    const hours: Record<number, number> = {};
    
    tasks.filter(t => t.completed && t.dueDate).forEach(t => {
        const h = new Date(t.dueDate!).getHours();
        hours[h] = (hours[h] || 0) + 1;
    });

    return Object.entries(hours)
        .map(([h, c]) => ({ hour: parseInt(h), count: c }))
        .sort((a,b) => a.hour - b.hour);
}
