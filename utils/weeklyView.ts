
import { Task } from '../types';
import { startOfWeek, endOfWeek, isWithinInterval, addDays, format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type WeeklyTaskGroup = Record<string, Task[]>;

export function groupTasksByWeek(tasks: Task[], date: Date = new Date()): WeeklyTaskGroup {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday start
  const end = endOfWeek(date, { weekStartsOn: 0 });

  const weekGroups: WeeklyTaskGroup = {
    'Domingo': [],
    'Segunda-feira': [],
    'Terça-feira': [],
    'Quarta-feira': [],
    'Quinta-feira': [],
    'Sexta-feira': [],
    'Sábado': []
  };

  const dayMap = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];

  tasks.forEach(task => {
    if (!task.dueDate) return;
    const taskDate = new Date(task.dueDate);
    
    if (isWithinInterval(taskDate, { start, end })) {
        const dayIndex = getDay(taskDate);
        const dayName = dayMap[dayIndex];
        if (weekGroups[dayName]) {
            weekGroups[dayName].push(task);
        }
    }
  });

  return weekGroups;
}
