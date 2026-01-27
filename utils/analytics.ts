
import { WeeklyStats, Task, ScoreHistory, IAHistoryItem, WorkflowLog } from '../types';
import { startOfWeek, endOfWeek, format, isWithinInterval, subWeeks, isSameDay } from 'date-fns';
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

// NEW: Real Workflow-based Score Logic
export function calculateRealProductivityScore(
    logs: WorkflowLog[], 
    workflows: Task[] // Tasks containing workflows
): number {
    
    // Filtros: Ações dos últimos 30 dias para relevância
    const now = new Date();
    const recentLogs = logs.filter(l => {
        const logDate = new Date(l.timestamp);
        return (now.getTime() - logDate.getTime()) < (30 * 24 * 60 * 60 * 1000);
    });

    if (recentLogs.length === 0) return 50; // Base score

    let score = 50;

    // 1. Etapas Concluídas (Peso 10)
    const completedSteps = recentLogs.filter(l => l.action === 'completed').length;
    score += (completedSteps * 10);

    // 2. Atrasos (Peso -5)
    // Precisamos cruzar com a data de 'completed' vs 'dueDate' da Task pai
    // Como simplificação, se a task pai estiver 'late' no momento da conclusão do step
    let lateSteps = 0;
    recentLogs.forEach(log => {
        if (log.action === 'completed') {
            const task = workflows.find(t => t.id === log.taskId);
            if (task && task.dueDate) {
                const completedAt = new Date(log.timestamp);
                const dueAt = new Date(task.dueDate);
                // Se completou depois do prazo (margem de 1h)
                if (completedAt.getTime() > dueAt.getTime() + 3600000) {
                    lateSteps++;
                }
            }
        }
    });
    score -= (lateSteps * 5);

    // 3. Workflows Finalizados (Peso 20)
    // Um workflow é finalizado quando a tarefa pai é marcada como completed
    const finishedWorkflows = workflows.filter(t => t.workflow && t.completed).length;
    score += (finishedWorkflows * 20);

    // Normalização (0-100)
    return Math.min(100, Math.max(0, score));
}
