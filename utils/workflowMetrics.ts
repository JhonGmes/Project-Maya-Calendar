
import { Workflow, UserMetrics, WorkflowMetrics } from '../types';

export const calculateWorkflowMetrics = (workflow: Workflow): WorkflowMetrics => {
  const totalSteps = workflow.steps.length;
  const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;

  return {
    totalSteps,
    completedSteps,
    completionRate: totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)
  };
};

export const calculateUserMetrics = (workflows: Workflow[]): UserMetrics[] => {
  const map: Record<string, UserMetrics> = {};

  workflows.forEach(wf => {
    wf.steps.forEach(step => {
      // Only count steps that have a responsible user assigned
      if (!step.responsible) return;

      if (!map[step.responsible]) {
        map[step.responsible] = {
          userId: step.responsible,
          completedSteps: 0,
          workflowsInvolved: 0
        };
      }

      // Count unique workflows involved
      // This logic could be refined to only increment if not already counted for this user/workflow
      // For simplicity, we assume 'involved' means has at least one step
      
      // We need a way to track workflows involved per user to avoid duplicates
      // But for this simple metric function:
      if (step.status === 'completed') {
          map[step.responsible].completedSteps += 1;
      }
    });
  });
  
  // Correction for 'workflowsInvolved': Iterate again or use a Set
  const userWorkflowSet: Record<string, Set<string>> = {};
  workflows.forEach(wf => {
      wf.steps.forEach(step => {
          if (step.responsible) {
              if (!userWorkflowSet[step.responsible]) userWorkflowSet[step.responsible] = new Set();
              userWorkflowSet[step.responsible].add(wf.id);
          }
      });
  });

  // Apply workflow counts
  Object.keys(map).forEach(userId => {
      map[userId].workflowsInvolved = userWorkflowSet[userId].size;
  });

  return Object.values(map);
};
