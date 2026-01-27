
import { PlanType, PlanLimits, UserUsage } from '../types';
import { isToday } from 'date-fns';

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
    FREE: {
        maxWorkflows: 3,
        aiSuggestionsPerDay: 10,
        canViewTeamAnalytics: false
    },
    PRO: {
        maxWorkflows: 20,
        aiSuggestionsPerDay: 100,
        canViewTeamAnalytics: false
    },
    BUSINESS: {
        maxWorkflows: Infinity,
        aiSuggestionsPerDay: Infinity,
        canViewTeamAnalytics: true
    }
};

/**
 * Checks if the user can perform a specific AI interaction based on their plan.
 */
export function checkAILimit(plan: PlanType, usage: UserUsage): { allowed: boolean, remaining: number } {
    const limit = PLAN_CONFIG[plan].aiSuggestionsPerDay;
    
    // Check reset (simulated daily reset)
    const today = new Date().toISOString().split('T')[0];
    const lastUsage = new Date(usage.lastUsageReset).toISOString().split('T')[0];
    
    let currentUsage = usage.aiSuggestionsToday;
    if (today !== lastUsage) {
        currentUsage = 0;
    }

    if (limit === Infinity) return { allowed: true, remaining: 9999 };
    
    return {
        allowed: currentUsage < limit,
        remaining: limit - currentUsage
    };
}

/**
 * Checks if the user can create a new workflow.
 */
export function checkWorkflowLimit(plan: PlanType, currentWorkflowsCount: number): boolean {
    const limit = PLAN_CONFIG[plan].maxWorkflows;
    return currentWorkflowsCount < limit;
}

export function getPlanName(plan: PlanType): string {
    switch(plan) {
        case 'FREE': return 'Plano Gratuito';
        case 'PRO': return 'Maya Pro';
        case 'BUSINESS': return 'Maya Business';
        default: return 'Desconhecido';
    }
}
