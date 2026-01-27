
import { Task, PriorityMediation, UserUsage, PlanType } from "../types";
import { isSameDay, addDays } from "date-fns";

/**
 * Avalia se uma tarefa deve ter a prioridade solicitada ou se deve ser mediada pela IA
 * para evitar sobrecarga do time ou conflitos.
 */
export function evaluateTaskPriority(
    taskTitle: string,
    requestedPriority: "high" | "medium" | "low",
    requesterId: string,
    teamTasks: Task[],
    dueDate?: Date
): PriorityMediation | null {
    
    // Se a prioridade não for Alta, geralmente não precisa de mediação
    if (requestedPriority !== "high") return null;

    // 1. Análise de Carga do Time para o Prazo
    const targetDate = dueDate || new Date();
    const tasksOnDate = teamTasks.filter(t => 
        t.dueDate && 
        isSameDay(new Date(t.dueDate), targetDate) && 
        !t.completed
    );

    // Se houver muitas tarefas no dia (> 5), é um gargalo
    const isBottleneck = tasksOnDate.length > 5;
    
    // Se houver muitas tarefas de ALTA prioridade no dia (> 2), é risco crítico
    const highPriorityCount = tasksOnDate.filter(t => t.priority === 'high').length;
    const isCriticalRisk = highPriorityCount >= 2;

    if (isCriticalRisk) {
        return {
            taskId: "new-task-mediation",
            requester: requesterId,
            impactedUsers: ["team-all"], // Simplificado
            suggestedPriority: "medium",
            justification: `Detectei ${highPriorityCount} tarefas de prioridade ALTA já agendadas para esta data. Adicionar mais uma pode gerar sobrecarga e atrasos em cascata. Sugiro definir como MÉDIA ou adiar o prazo.`
        };
    }

    if (isBottleneck) {
        return {
            taskId: "new-task-mediation",
            requester: requesterId,
            impactedUsers: ["team-all"],
            suggestedPriority: "medium",
            justification: "O time já possui uma carga elevada de tarefas para este dia. Uma prioridade MÉDIA garante execução sem comprometer entregas críticas existentes."
        };
    }

    // Se não houver conflito, retorna null (Aprovado)
    return null;
}
