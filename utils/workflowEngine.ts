
import { Workflow, WorkflowStep } from "../types";

export const WorkflowEngine = {
  /**
   * Completa uma etapa e desbloqueia a próxima.
   * Retorna o objeto Workflow atualizado.
   */
  completeStep(workflow: Workflow, stepId: string): Workflow {
    // 1. Atualizar a etapa clicada para concluída
    const updatedSteps = workflow.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, status: 'completed' as const };
      }
      return step;
    });

    // 2. Encontrar a etapa concluída para determinar a ordem
    const completedStep = workflow.steps.find(s => s.id === stepId);
    if (!completedStep) return workflow;

    // 3. Desbloquear a próxima etapa imediata (se houver)
    const nextStepIndex = updatedSteps.findIndex(s => s.order === completedStep.order + 1);
    
    if (nextStepIndex !== -1) {
      // Só desbloqueia se estiver bloqueada
      if (updatedSteps[nextStepIndex].status === 'locked') {
          updatedSteps[nextStepIndex] = {
            ...updatedSteps[nextStepIndex],
            status: 'available' as const
          };
      }
    }

    // 4. Verificar conclusão global do fluxo
    const allCompleted = updatedSteps.every(s => s.status === 'completed');
    
    // Calcula progresso atualizado
    const completedCount = updatedSteps.filter(s => s.status === 'completed').length;

    return {
      ...workflow,
      steps: updatedSteps,
      completedSteps: completedCount,
      status: allCompleted ? 'completed' : 'in_progress'
    };
  },

  /**
   * Helper para criar um template de Workflow
   */
  createTemplate(title: string, stepsData: { title: string, action?: any }[]): Workflow {
    const steps: WorkflowStep[] = stepsData.map((s, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      title: s.title,
      order: idx + 1,
      status: idx === 0 ? 'available' : 'locked', // Primeira etapa sempre liberada
      action: s.action || { type: 'NONE' }
    }));

    return {
      id: `wf-${Date.now()}`,
      title,
      steps,
      status: 'pending',
      createdAt: new Date().toISOString(),
      totalSteps: steps.length,
      completedSteps: 0
    };
  }
};
