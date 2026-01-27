
import { Task, IAAction, NegotiationOption } from '../types';
import { addDays, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Phase 5: Negotiation Logic
export function checkDeadlineViability(
    newTaskTitle: string, 
    proposedDate: Date, 
    existingTasks: Task[]
): IAAction | null {
    
    // 1. Calculate Load for Proposed Date
    const dayTasks = existingTasks.filter(t => 
        !t.completed && 
        t.dueDate && 
        isSameDay(new Date(t.dueDate), proposedDate)
    );

    const LOAD_LIMIT = 5; // Hard limit for demo

    // If day is manageable, return null (meaning: Go ahead, no negotiation needed)
    if (dayTasks.length < LOAD_LIMIT) return null;

    // 2. Generate Options
    const dayName = format(proposedDate, "EEEE", { locale: ptBR });
    const formattedDate = format(proposedDate, "dd/MM");
    
    // Option A: Advance/Prioritize (Adiantar/Forçar)
    const optForce: NegotiationOption = {
        label: "Adiantar uma (Priorizar esta)",
        style: 'outline',
        action: {
            type: "CREATE_TASK",
            payload: {
                title: newTaskTitle,
                dueDate: proposedDate.toISOString(),
                priority: 'high'
            }
        }
    };

    // Option B: Postpone +2 Days (Estender prazo)
    const nextDate = addDays(proposedDate, 2);
    if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1); // Skip Sunday

    const optPostpone: NegotiationOption = {
        label: `Estender prazo para ${format(nextDate, "EEEE (dd/MM)", { locale: ptBR })}`,
        style: 'primary',
        action: {
            type: "CREATE_TASK",
            payload: {
                title: newTaskTitle,
                dueDate: nextDate.toISOString(),
                priority: 'medium'
            }
        }
    };

    // Option C: Redistribute (Redistribuir na semana)
    const optRedistribute: NegotiationOption = {
        label: "Redistribuir semana (Automático)",
        style: 'secondary',
        action: {
            type: "REORGANIZE_WEEK",
            payload: {
                changes: [], // Logic handled by backend/util
                reason: "Redistribuição solicitada pelo usuário durante negociação."
            }
        }
    };

    return {
        type: "NEGOTIATE_DEADLINE",
        payload: {
            taskTitle: newTaskTitle,
            reason: `Você tem ${dayTasks.length} tarefas críticas para ${dayName}. Pelo seu histórico, adicionar mais uma gera risco de sobrecarga. Como prefere lidar?`,
            options: [optForce, optPostpone, optRedistribute]
        }
    };
}

// Legacy function kept for compatibility
export function proposeNewDeadline(tasks: Task[]): Date | null {
  const pending = tasks.filter(t => !t.completed);
  const overload = pending.length > 5;
  if (!overload) return null;
  const current = new Date();
  const proposed = addDays(current, 1);
  proposed.setHours(9, 0, 0, 0);
  return proposed;
}
