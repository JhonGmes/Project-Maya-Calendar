
import { Task, QuarterlyGoal, IAHistoryItem } from '../types';
import { calculateScore } from './productivityScore';

export function generateQuarterGoals(tasks: Task[], history: IAHistoryItem[]): QuarterlyGoal[] {
  const goals: QuarterlyGoal[] = [];
  const currentQuarter = `Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`;
  const currentScore = calculateScore(tasks, history);

  // 1. Meta de Produtividade (Se score baixo)
  if (currentScore < 60) {
      goals.push({
          id: 'auto-score',
          title: "Aumentar consistência diária",
          achieved: false,
          quarter: currentQuarter,
          metric: "productivityScore",
          targetValue: "> 70"
      });
  } else {
      goals.push({
          id: 'auto-score-maintain',
          title: "Manter nível de Alta Performance",
          achieved: false,
          quarter: currentQuarter,
          metric: "productivityScore",
          targetValue: "> 85"
      });
  }

  // 2. Meta de Organização (Se muitos adiamentos)
  const recentReschedules = history.filter(h => h.action.type === 'RESCHEDULE_TASK').length;
  if (recentReschedules > 5) {
      goals.push({
          id: 'auto-reschedule',
          title: "Reduzir remarcações de tarefas",
          achieved: false,
          quarter: currentQuarter,
          metric: "reschedules",
          targetValue: "-30%"
      });
  }

  // 3. Meta de Projetos (Baseada em palavras-chave das tarefas existentes)
  // Fallback to keyword extraction logic
  const themes: Record<string, number> = {};
  const stopWords = ['a', 'o', 'e', 'de', 'do', 'da', 'com', 'para', 'fazer', 'criar', 'reunião', 'enviar'];

  tasks.forEach(task => {
    const words = task.title.toLowerCase().split(' ');
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            themes[word] = (themes[word] || 0) + 1;
        }
    });
  });

  const topTheme = Object.entries(themes)
    .sort(([, a], [, b]) => b - a)[0];

  if (topTheme) {
      goals.push({
          id: `auto-theme-${topTheme[0]}`,
          title: `Concluir projeto principal: "${topTheme[0].charAt(0).toUpperCase() + topTheme[0].slice(1)}"`,
          achieved: false,
          quarter: currentQuarter
      });
  } else {
      // Fallback genérico
      goals.push({
          id: 'auto-generic',
          title: "Zerar pendências antigas",
          achieved: false,
          quarter: currentQuarter
      });
  }

  return goals;
}
