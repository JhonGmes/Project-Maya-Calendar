
import { Task } from '../types';

export function getUrgentTasks(tasks: Task[]): Task[] {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return tasks.filter(task => {
    if (task.completed || !task.dueDate) return false;

    const deadline = new Date(task.dueDate);
    // Task is in the future but within the next 2 hours
    return deadline > now && deadline <= inTwoHours;
  });
}
