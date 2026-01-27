
import { Task, IAAction, NegotiationOption } from '../types';
import { addDays, isSameDay, format, startOfDay } from 'date-fns';
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
    
    // Option A: Force (Keep original plan)
    const optForce: NegotiationOption = {
        label: "Manter mesmo assim",
        style: 'outline',
        action: {
            type: "CREATE_TASK",
            payload: {
                title: newTaskTitle,
                dueDate: proposedDate.toISOString(),
                priority: 'high' // If forcing, assume high priority
            }
        }
    };

    // Option B: Postpone +2 Days
    const nextDate = addDays(proposedDate, 2);
    // Skip weekend if landed on one? (Simple logic: just push)
    if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1); // Sunday -> Monday

    const optPostpone: NegotiationOption = {
        label: `Mover para ${format(nextDate, "EEEE (dd/MM)", { locale: ptBR })}`,
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

    // Option C: Split/Lighten (Mocked as "Backlog" for now)
    const optBacklog: NegotiationOption = {
        label: "Colocar no Backlog (Sem Data)",
        style: 'secondary',
        action: {
            type: "CREATE_TASK",
            payload: {
                title: newTaskTitle,
                // No due date
            }
        }
    };

    return {
        type: "NEGOTIATE_DEADLINE",
        payload: {
            taskTitle: newTaskTitle,
            reason: `Você já tem ${dayTasks.length} tarefas agendadas para ${dayName} (${formattedDate}). Adicionar mais uma pode comprometer sua execução.`,
            options: [optPostpone, optBacklog, optForce]
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
