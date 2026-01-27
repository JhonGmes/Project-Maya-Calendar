
import { IAContext, SystemDecision } from "../types";

/**
 * IAActionEngine
 * O cérebro determinístico do sistema.
 * Não depende de API externa. Analisa o estado e decide o que a UI deve mostrar.
 */
export const IAActionEngine = {
  decide(context: IAContext): SystemDecision {
    
    // 1. Prioridade Absoluta: Resumo do Dia (Final do dia)
    // Se o resumo existir no contexto (gerado pelo observer) e não tiver sido visto, mostrar.
    if (context.dailySummary) {
      // Regra de negócio: Só mostrar se score > 0 ou tiver completado algo
      if (context.dailySummary.score > 0 || context.dailySummary.tasksCompleted > 0) {
          return {
            type: 'SHOW_DAILY_SUMMARY',
            payload: context.dailySummary
          };
      }
    }

    // 2. Proatividade de Workflow (Novo)
    // Se existe um workflow em progresso, sugerir o próximo passo.
    const activeWorkflowTask = context.pendingTasks.find(t => 
        t.workflow && 
        t.workflow.status === 'in_progress'
    );

    if (activeWorkflowTask && activeWorkflowTask.workflow) {
        const nextStep = activeWorkflowTask.workflow.steps.find(s => s.status === 'available');
        
        // Só sugere se tiver um passo disponível e não estivermos em modo foco
        if (nextStep && !context.hasActiveFocus) {
             return {
                 type: 'SUGGEST_NEXT_STEP',
                 payload: {
                     workflowId: activeWorkflowTask.workflow.id,
                     workflowTitle: activeWorkflowTask.workflow.title,
                     step: nextStep
                 }
             };
        }
    }

    // 3. Sugestão de Foco (Motor Ligado)
    // Se não está focado agora E tem tarefas pendentes E não focou muito hoje (opcional)
    if (!context.hasActiveFocus && context.nextTask) {
        
        // Calcular ganho estimado
        const estimatedMinutes = 25;
        const potentialPoints = 15; // 10 pts task + 5 pts focus bonus

        return {
            type: 'SUGGEST_FOCUS',
            payload: {
                taskId: context.nextTask.id,
                title: context.nextTask.title,
                estimatedMinutes: estimatedMinutes,
                expectedScoreGain: potentialPoints
            }
        };
    }

    // Default: Nenhuma ação proativa necessária
    return { type: 'NONE' };
  }
};
