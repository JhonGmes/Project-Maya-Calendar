
import { Task, AgentSuggestion, IAHistoryItem, FocusSession } from '../types';
import { isPast, isToday, addDays, setHours, setMinutes, differenceInMinutes } from 'date-fns';
import { detectBurnout } from './burnoutDetector';

/**
 * Este é o "cérebro passivo" da Maya.
 * Ele roda sempre que o estado muda e decide se precisa intervir.
 */
export function observeState(
    tasks: Task[], 
    history: IAHistoryItem[] = [], 
    currentScore: number = 50,
    focusSession?: FocusSession
): AgentSuggestion | null {
    
    // 0. Coaching de Foco (Prioridade Máxima se ativo)
    if (focusSession && focusSession.isActive && focusSession.startTime) {
        const elapsed = differenceInMinutes(new Date(), new Date(focusSession.startTime));
        const planned = focusSession.plannedDuration || 25;

        // Suggest break if overtime
        if (elapsed > planned) {
             return {
                id: 'focus_break',
                type: 'focus_coach',
                message: `Você está focado há ${elapsed} min (Plano: ${planned} min). Quer fazer uma pausa para manter a performance?`,
                actionLabel: 'Pausar Foco',
                actionData: {
                    type: "END_FOCUS",
                    payload: { completed: false }
                }
             };
        }
        
        // Encouragement at 50%
        if (elapsed > 10 && elapsed < 15 && planned >= 25) {
             // Returning null here to avoid spamming the user with modals, 
             // but ideally this would update a "Coach Message" inside the Focus Overlay 
             // without a blocking modal. For now, we only interrupt for breaks.
             return null; 
        }
        
        // Don't generate other suggestions while focusing
        return null;
    }

    // 1. Verificação de BURNOUT
    const burnout = detectBurnout(tasks, history, currentScore);
    
    if (burnout.level === 'high') {
        return {
            id: 'burnout_alert',
            type: 'warning',
            message: `Detectei sinais de sobrecarga alta (${burnout.signals[0]}). Posso reorganizar sua semana para aliviar o peso?`,
            actionLabel: 'Aliviar Carga',
            actionData: {
                type: "ASK_CONFIRMATION",
                payload: {
                    message: "Deseja que eu redistribua suas tarefas para os próximos dias visando reduzir o estresse?",
                    action: {
                        type: "REORGANIZE_WEEK",
                        payload: {
                            changes: [], // O backend/utils irá preencher isso
                            reason: "Prevenção de Burnout detectada pelo sistema."
                        }
                    }
                }
            }
        };
    }

    const pendingTasks = tasks.filter(t => !t.completed);
    const overdueTasks = pendingTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    
    // 2. Detecção de Atrasos Críticos
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
                            newDate: setMinutes(setHours(addDays(new Date(), 1), 9), 0).toISOString()
                        }
                    }
                }
            }
        };
    }

    // 3. Análise de Padrão: Horário de Pico
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
                message: `Notei que você é mais produtivo por volta das ${hour}h. Quer agendar tarefas sem prazo para esse horário?`,
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

    return null;
}
