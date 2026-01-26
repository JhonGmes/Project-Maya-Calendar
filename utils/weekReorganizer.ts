
import { Task } from '../types';
import { addDays, startOfWeek, nextMonday, setHours, setMinutes } from 'date-fns';

export interface ReorganizedPlan {
    [key: string]: Task[];
}

export function reorganizeWeek(tasks: Task[]): ReorganizedPlan {
  // Filter pending tasks and sort by priority/deadline
  const pending = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        
        // Then by deadline
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_VALUE;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_VALUE;
        return dateA - dateB;
    });

  const days = ["segunda", "terca", "quarta", "quinta", "sexta"];
  const plan: ReorganizedPlan = {
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: []
  };

  let dayIndex = 0;

  pending.forEach(task => {
    plan[days[dayIndex]].push(task);
    dayIndex = (dayIndex + 1) % days.length;
  });

  return plan;
}

// Helper to convert the abstract "segunda" keys into actual Dates starting from next Monday or Tomorrow
export function applyReorganization(plan: ReorganizedPlan): { taskId: string, newDate: Date }[] {
    const updates: { taskId: string, newDate: Date }[] = [];
    const baseDate = new Date(); // Start from today
    
    // Simple mapping: 0 = Sunday, 1 = Monday...
    // We want to map keys to dates.
    // If today is Tuesday, "segunda" might mean next Monday or yesterday (implies reschedule to future).
    // Strategy: Map "segunda" to the next available Monday, "terca" to next Tuesday, etc.
    
    const dayMap: Record<string, number> = {
        'segunda': 1, 'terca': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5
    };

    Object.entries(plan).forEach(([dayKey, tasks]) => {
        const targetDayIndex = dayMap[dayKey];
        let targetDate = new Date();
        
        // Find next occurrence of this day
        while (targetDate.getDay() !== targetDayIndex || targetDate < baseDate) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        // Set default time to 9 AM
        targetDate = setMinutes(setHours(targetDate, 9), 0);

        tasks.forEach(task => {
            updates.push({ taskId: task.id, newDate: new Date(targetDate) });
        });
    });

    return updates;
}
