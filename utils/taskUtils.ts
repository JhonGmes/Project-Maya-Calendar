
import { Task } from '../types';

export function calculatePriority(task: Task): 'high' | 'medium' | 'low' {
  if (!task.dueDate) return task.priority || 'medium';
  
  const now = Date.now();
  const deadline = new Date(task.dueDate).getTime();
  const diffHours = (deadline - now) / 1000 / 60 / 60;

  if (diffHours <= 24) return 'high';
  if (diffHours <= 72) return 'medium';
  return 'low';
}

export function sortTasksByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Tasks without deadline go to the bottom
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    const timeA = new Date(a.dueDate).getTime();
    const timeB = new Date(b.dueDate).getTime();
    return timeA - timeB;
  });
}
