
import { Task } from '../types';

export interface UserPatterns {
  preferredTaskHour: number;
}

export function analyzePatterns(tasks: Task[]): UserPatterns {
  const completedTasks = tasks.filter(t => t.dueDate);
  
  if (completedTasks.length === 0) {
    return { preferredTaskHour: 9 }; // Default 9 AM
  }

  const hours = completedTasks.map(t => new Date(t.dueDate!).getHours());
  
  // Calculate average hour
  const totalHours = hours.reduce((acc, curr) => acc + curr, 0);
  const avgHour = Math.round(totalHours / hours.length);

  return {
    preferredTaskHour: avgHour
  };
}
