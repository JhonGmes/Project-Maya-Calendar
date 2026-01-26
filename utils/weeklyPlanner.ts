
import { Task } from '../types';

export interface WeeklyPlan {
  [key: string]: Task[];
}

export function generateWeeklyPlan(tasks: Task[]): WeeklyPlan {
  const plan: WeeklyPlan = {
    'Segunda-feira': [],
    'Terça-feira': [],
    'Quarta-feira': [],
    'Quinta-feira': [],
    'Sexta-feira': [],
    'Sábado': [],
    'Domingo': []
  };

  const days = Object.keys(plan);
  let dayIndex = 0;

  // Simple round-robin distribution for demo purposes
  // A real implementation would check existing events per day
  const pendingTasks = tasks.filter(t => !t.completed).sort((a,b) => {
      // Prioritize high priority
      if(a.priority === 'high' && b.priority !== 'high') return -1;
      if(a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
  });

  pendingTasks.forEach(task => {
    plan[days[dayIndex]].push(task);
    dayIndex = (dayIndex + 1) % days.length;
  });

  return plan;
}

export function formatWeeklyPlan(plan: WeeklyPlan): string {
    let output = "**Plano Semanal Sugerido:**\n\n";
    for (const [day, tasks] of Object.entries(plan)) {
        if (tasks.length > 0) {
            output += `📅 *${day}*\n`;
            tasks.forEach(t => {
                output += `• ${t.title} (${t.priority === 'high' ? '🔥' : '🔹'})\n`;
            });
            output += '\n';
        }
    }
    return output;
}
