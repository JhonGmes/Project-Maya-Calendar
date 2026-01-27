
import { Task } from '../types';

/**
 * Detecta dias onde a carga de trabalho estimada excede 8 horas.
 * Assume 1 hora por tarefa se 'estimatedTime' não estiver definido.
 */
export function detectWeeklyOverload(tasks: Task[]): { date: string, hours: number }[] {
  const perDay: Record<string, number> = {};

  tasks.forEach(task => {
    if (!task.dueDate || task.completed) return;

    // Formato YYYY-MM-DD para agrupamento
    const day = new Date(task.dueDate).toISOString().split("T")[0];
    const hours = task.estimatedTime || 1; // Default 1h
    
    perDay[day] = (perDay[day] || 0) + hours;
  });

  // Retorna dias com mais de 8 horas de carga
  return Object.entries(perDay)
    .filter(([_, hours]) => hours > 8)
    .map(([date, hours]) => ({ date, hours }));
}
