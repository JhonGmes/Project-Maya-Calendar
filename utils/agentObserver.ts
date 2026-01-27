
import { Task, AgentSuggestion, IAHistoryItem, FocusSession, UserProfile, CalendarEvent } from '../types';
import { isPast, isToday, addDays, setHours, setMinutes, differenceInMinutes, getHours } from 'date-fns';
import { detectBurnout } from './burnoutDetector';
import { generateDailySummary } from './dailySummary';

/**
 * Este é o "cérebro passivo" da Maya.
 * Ele roda sempre que o estado muda e decide se precisa intervir.
 */
export function observeState(
    tasks: Task[], 
    events: CalendarEvent[], // Added events to context
    history: IAHistoryItem[] = [], 
    currentScore: number = 50,
    focusSession?: FocusSession,
    scoreHistoryDates: Date[] = [],
    profile?: UserProfile | null
): AgentSuggestion | null {
    
    // --- 0. NEGOCIAÇÃO DE AGENDA (Prioridade Crítica) ---
    // Verifica se o dia de hoje tem > 8h planejadas
    const todayEvents = events.filter(e => isToday(new Date(e.start)));
    const totalMinutes = todayEvents.reduce((acc, e) => acc + differenceInMinutes(new Date(e.end), new Date(e.start)), 0);
    
    // Se carga > 9h (540 min), ativa negociação
    if (totalMinutes > 540) {
        // Evita sugerir se já sugeriu hoje (simulado)
        const hasNegotiated = history.some(h => 
            h.action.type === 'REORGANIZE_WEEK' && isToday(new Date(h.timestamp))
        );

        if (!hasNegotiated) {
            return {
                id: 'negotiate_overload_day',
                type: 'warning',
                message: `Seu dia está com ${Math.round(totalMinutes/60)}h de carga. Isso é insustentável. Posso negociar sua agenda?`,
                actionLabel: 'Negociar',
                actionData: {
                    type: "NEGOTIATE_DEADLINE", // Reusing generic negotiation type
                    payload: {
                        taskTitle: "Agenda do Dia",
                        reason: "Carga horária excede o limite saudável de 8h.",
                        options: [
                            {
                                label: "Mover últimas reuniões para amanhã",
                                style: 'primary',
                                action: {
                                    type: "REORGANIZE_WEEK",
                                    payload: { changes: [], reason: "Mover excedente do dia" } // Backend resolves logic
                                }
                            },
                            {
                                label: "Manter, mas alertar sobre foco",
                                style: 'secondary',
                                action: { type: "NO_ACTION" }
                            }
                        ]
                    }
                }
            };
        }
    }

    // --- 0. ONBOARDING & WELCOME (Alta Prioridade) ---
    if (profile && (!profile.onboardingStage || profile.onboardingStage === 'new')) {
        // Welcome Logic
        if (events.length === 0 && tasks.length === 0) {
            return {
                id: 'onboarding_welcome',
                type: 'onboarding',
                message: `Olá, ${profile.name.split(' ')[0]}! Bem-vindo à Maya. Estou aqui para organizar seu tempo. Que tal começarmos criando seu primeiro evento?`,
                actionLabel: 'Criar Evento',
                actionData: {
                    type: "CREATE_EVENT",
                    payload: {
                        title: "Planejamento Inicial",
                        start: new Date().toISOString(), // Agora
                        category: "routine"
                    }
                }
            };
        } else if (events.length > 0) {
            // Advance onboarding
            return {
                id: 'onboarding_first_done',
                type: 'onboarding',
                message: "Ótimo começo! Notei que você já tem eventos. Posso analisar sua rotina e sugerir melhorias?",
                actionLabel: "Analisar Agora",
                actionData: {
                    type: "UPDATE_PROFILE", // Trick to update onboarding stage
                    payload: { data: { onboardingStage: 'first_event_created' } }
                }
            };
        }
    }

    // --- BEHAVIORAL ONBOARDING (Dicas contextuais) ---
    // Exemplo: Eventos muito longos (> 4 horas)
    const veryLongEvents = events.filter(e => {
        const duration = differenceInMinutes(new Date(e.end), new Date(e.start));
        return duration > 240 && isToday(new Date(e.start));
    });

    if (veryLongEvents.length > 0) {
        const longEvent = veryLongEvents[0];
        
        if (Math.random() > 0.7) { 
            return {
                id: `tip_long_event_${longEvent.id}`,
                type: 'optimization',
                message: `O evento "${longEvent.title}" é bem longo (+4h). Que tal quebrar em blocos com pausas para manter o foco?`,
                actionLabel: 'Entendido',
                actionData: { type: "NO_ACTION" }
            };
        }
    }

    // --- 1. Coaching de Foco (Prioridade Alta se ativo) ---
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
        return null;
    }

    // --- 2. DAILY SUMMARY TRIGGER (Final do dia, após 17h) ---
    const currentHour = getHours(new Date());
    if (currentHour >= 17) {
        const hasShownSummary = history.some(h => 
            h.action.type === 'SHOW_SUMMARY' && 
            isToday(new Date(h.timestamp))
        );

        if (!hasShownSummary) {
             const summary = generateDailySummary(tasks, history, scoreHistoryDates);
             // Only show if there was some activity (score > 0)
             if (summary.score > 0) {
                 return {
                     id: 'daily_summary_trigger',
                     type: 'daily_summary',
                     message: "Seu dia produtivo está chegando ao fim. Quer ver o resumo do seu desempenho?",
                     actionLabel: "Ver Resumo",
                     actionData: {
                         type: "SHOW_SUMMARY",
                         payload: summary
                     }
                 };
             }
        }
    }

    // --- 3. Verificação de BURNOUT ---
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

    return null;
}
