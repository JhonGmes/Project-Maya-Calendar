
import { Task, AgentSuggestion } from '../types';
import { isPast, isToday, addDays, setHours, setMinutes } from 'date-fns';

/**
 * Este é o "cérebro passivo" da Maya.
 * Ele roda sempre que o estado muda e decide se precisa intervir.
 */
export function observeState(tasks: Task[]): AgentSuggestion | null {
    const pendingTasks = tasks.filter(t => !t.completed);
    const overdueTasks = pendingTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    
    // 1. Detecção de Atrasos Críticos
    if (overdueTasks.length >= 3) {
        return {
            id: 'overdue_batch',
            type: 'warning',
            message: `Você tem ${overdueTasks.length} tarefas atrasadas. Quer que eu mova todas para amanhã de manhã?`,
            actionLabel: 'Reagendar Atrasadas',
            actionData: {
                type: "ASK_CONFIRMATION",
                payload: {
                    message: `Confirma mover ${overdueTasks.length} tarefas para amanhã às 09:00?`,
                    action: {
                        type: "RESCHEDULE_TASK",
                        payload: {
                            taskIds: overdueTasks.map(t => t.id),
                            newDate: setMinutes(setHours(addDays(new Date(), 1), 9), 0).toISOString() // Amanhã 09:00
                        }
                    }
                }
            }
        };
    }

    // 2. Análise de Padrão: Horário de Pico (Estatística Simples)
    // Se o usuário tem muitas tarefas "Sem horário" e costuma completar tarefas às 14h
    const completedTasks = tasks.filter(t => t.completed && t.dueDate);
    if (completedTasks.length > 5 && pendingTasks.filter(t => !t.dueDate).length > 2) {
        const hourCounts: Record<number, number> = {};
        completedTasks.forEach(t => {
            const h = new Date(t.dueDate!).getHours();
            hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        
        const bestHourEntry = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0];
        if (bestHourEntry) {
            const hour = parseInt(bestHourEntry[0]);
            return {
                id: 'pattern_scheduler',
                type: 'pattern',
                message: `Notei que você é mais produtivo por volta das ${hour}h. Quer agendar suas tarefas sem prazo para esse horário amanhã?`,
                actionLabel: `Agendar para ${hour}h`,
                actionData: {
                    type: "ASK_CONFIRMATION",
                    payload: {
                        message: `Posso definir o prazo dessas tarefas para amanhã às ${hour}:00?`,
                        action: {
                            type: "RESCHEDULE_TASK",
                            payload: {
                                taskIds: pendingTasks.filter(t => !t.dueDate).map(t => t.id),
                                newDate: setMinutes(setHours(addDays(new Date(), 1), hour), 0).toISOString()
                            }
                        }
                    }
                }
            };
        }
    }

    // 3. Otimização de Foco
    const highPriority = pendingTasks.filter(t => t.priority === 'high');
    if (highPriority.length > 0 && highPriority.length <= 2) {
        // Se tem poucas tarefas urgentes, sugere "Modo Foco" nelas
        return {
            id: 'focus_mode',
            type: 'optimization',
            message: `Foco total em "${highPriority[0].title}". Quer que eu esconda as outras tarefas por enquanto? (Simulação)`,
            actionLabel: 'Focar Agora',
            actionData: {
                type: "REPLY",
                payload: {
                    message: 'Ótimo! Imagine que as outras tarefas sumiram. Mãos à obra!'
                }
            }
        };
    }

    return null;
}
