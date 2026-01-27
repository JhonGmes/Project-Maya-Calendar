
import { Task, CalendarEvent, IAHistoryItem, PersonalityType } from '../types';
import { differenceInMinutes } from 'date-fns';

export function detectPersonality(
    tasks: Task[], 
    events?: CalendarEvent[], 
    history?: IAHistoryItem[]
): PersonalityType {
  // Safe defaults
  const safeEvents = events || [];
  const safeHistory = history || [];

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  
  // 1. Detect Overload (Sobrecarregado)
  // High rescheduling rate + Many overdue tasks + High meeting density
  const reschedules = safeHistory.filter(h => h.action.type === 'RESCHEDULE_TASK').length;
  const meetingMinutes = safeEvents
    .filter(e => e.category === 'meeting')
    .reduce((acc, curr) => acc + differenceInMinutes(new Date(curr.end), new Date(curr.start)), 0);
  
  // If > 20% tasks rescheduled OR > 6 hours of meetings/day avg (simplified)
  if (reschedules > 5 || (pending > completed + 5)) {
      return "sobrecarregado";
  }

  // 2. Detect Manager (Gestor)
  // More meetings than execution tasks, often uses 'meeting' category
  const meetingsCount = safeEvents.filter(e => e.category === 'meeting' || e.category === 'work').length;
  const executionTasks = tasks.length;
  
  if (meetingsCount > executionTasks && safeEvents.length > 0) {
      // Simple heuristic: Managers live in the calendar
      return "neutro"; // Mapping 'Manager' logic to 'neutro' for now or extending types later. 
      // For this implementation, let's treat 'neutro' as Manager-like (Balanced)
  }

  // 3. Detect Executor (Disciplinado)
  // High completion rate, low reschedule
  if (completed >= pending) {
      return "disciplinado";
  }

  return "neutro";
}

export function adaptTone(message: string, personality: PersonalityType): string {
  if (message.startsWith("Erro:") || message.startsWith("Error:")) return message;

  if (personality === "disciplinado") {
    return `⚡ ${message}`; // Direct, efficient
  }

  if (personality === "sobrecarregado") {
    return `🛡️ Notei uma sobrecarga. ${message}`; // Protective, supportive
  }

  // Neutro/Manager
  return `📊 ${message}`; // Analytical
}
