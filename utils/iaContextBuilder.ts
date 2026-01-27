
import { Task, CalendarEvent, IAHistoryItem, Team, UserRole } from "../types";
import { format } from "date-fns";

/**
 * Constrói o contexto JSON que será injetado no prompt da IA.
 * Isso permite que a Maya "veja" o estado atual do usuário e do time.
 */
export function buildIAContext(
    tasks: Task[], 
    events: CalendarEvent[], 
    history: IAHistoryItem[] = [],
    team?: Team | null,
    role?: UserRole
) {
  const now = new Date();
  
  // Filtrar apenas tarefas relevantes (pendentes ou concluídas recentemente)
  const relevantTasks = tasks.filter(t => !t.completed || (t.dueDate && new Date(t.dueDate) > new Date(now.getTime() - 86400000)));

  // Filtrar eventos dos próximos 7 dias
  const upcomingEvents = events.filter(e => 
      new Date(e.start) >= now && 
      new Date(e.start) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  const contextData: any = {
    // FIX: Send local time string instead of UTC ISO to avoid timezone confusion (e.g. 17:00 UTC vs 14:00 BRT)
    currentDate: format(now, "yyyy-MM-dd'T'HH:mm:ss"), 
    contextMode: team ? 'TEAM_MODE' : 'PERSONAL_MODE',
    userRole: role || 'member',
    userState: {
        pendingTasksCount: tasks.filter(t => !t.completed).length,
        overdueTasksCount: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && !t.completed).length,
    },
    tasks: relevantTasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      priority: t.priority,
      completed: t.completed,
      assignee: t.assigneeId ? "assigned" : "unassigned" 
    })),
    events: upcomingEvents.map(e => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        category: e.category
    })),
    recentHistory: history.slice(-5).map(h => ({
        actionType: h.action.type,
        timestamp: h.timestamp
    }))
  };

  if (team) {
      contextData.teamInfo = {
          name: team.name,
          membersCount: team.members?.length || 1
      };
  }

  return JSON.stringify(contextData, null, 2);
}
