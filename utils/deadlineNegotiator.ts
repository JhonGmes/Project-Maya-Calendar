
import { Task } from '../types';
import { addDays } from 'date-fns';

export function proposeNewDeadline(tasks: Task[]): Date | null {
  const pending = tasks.filter(t => !t.completed);

  // If user has more than 5 pending tasks, suggest pushing to tomorrow
  const overload = pending.length > 5;

  if (!overload) return null;

  const current = new Date();
  // Suggest +1 day from now
  const proposed = addDays(current, 1);
  proposed.setHours(9, 0, 0, 0);

  return proposed;
}
