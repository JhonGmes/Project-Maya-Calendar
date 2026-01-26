
import { Task } from '../types';
import { isToday, isPast } from 'date-fns';

export function getDailyFocus(tasks: Task[]): Task | null {
  // 1. Filter for incomplete tasks
  const incomplete = tasks.filter(t => !t.completed);

  // 2. Look for high priority tasks due today or overdue
  const urgent = incomplete.filter(t => {
      if (!t.dueDate) return false;
      const date = new Date(t.dueDate);
      return (isToday(date) || isPast(date)) && t.priority === 'high';
  });

  if (urgent.length > 0) return urgent[0];

  // 3. Look for any task due today
  const todayTasks = incomplete.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  if (todayTasks.length > 0) return todayTasks[0];

  // 4. Fallback to just highest priority pending
  return incomplete.sort((a,b) => {
      if(a.priority === 'high' && b.priority !== 'high') return -1;
      return 0;
  })[0] || null;
}
