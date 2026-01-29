
import { Task, CalendarEvent } from "../types";
import { format, isSameDay, addDays } from "date-fns";

export function buildIAContext(tasks: Task[], events: CalendarEvent[]) {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  
  // A IA só precisa saber do HOJE e AMANHÃ para decidir ações rápidas
  const relevantTasks = tasks
    .filter(t => !t.completed && t.dueDate && (isSameDay(new Date(t.dueDate), now) || isSameDay(new Date(t.dueDate), tomorrow)))
    .slice(0, 10);

  const relevantEvents = events
    .filter(e => isSameDay(new Date(e.start), now) || isSameDay(new Date(e.start), tomorrow))
    .slice(0, 8);

  const contextData = {
    today: format(now, "yyyy-MM-dd"),
    tasks_urgentes: relevantTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority })),
    agenda_proxima: relevantEvents.map(e => ({ title: e.title, time: format(new Date(e.start), "HH:mm") }))
  };

  return JSON.stringify(contextData);
}
