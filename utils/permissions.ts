
import { UserRole } from '../types';

export const Permissions = {
  /**
   * Checks if the user can modify workflows (templates, steps, assignments).
   * Admins and Managers can edit; Members can only execute.
   */
  canEditWorkflow: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager';
  },

  /**
   * Checks if user can manage the team (add members, change roles).
   */
  canManageTeam: (role: UserRole): boolean => {
    return role === 'admin';
  },

  /**
   * Checks if user can see analytics for the whole team.
   */
  canViewTeamAnalytics: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager';
  },

  /**
   * Generates a context-aware prompt injection for the AI based on role.
   */
  getRoleContextPrompt: (role: UserRole): string => {
    if (role === 'admin') return "User is an ADMIN. You can suggest strategic changes, workflow restructuring, and team-wide optimizations.";
    if (role === 'manager') return "User is a MANAGER. You can suggest assigning tasks, checking team bottlenecks, and redistributing workload.";
    return "User is a MEMBER. Focus on their individual execution, personal productivity, and clearing their specific queue.";
  }
};
