
import { Task, QuarterlyGoal, IAHistoryItem } from '../types';
import { calculateScore } from './productivityScore';

export function generateQuarterGoals(tasks: Task[], history: IAHistoryItem[]): QuarterlyGoal[] {
  const goals: QuarterlyGoal[] = [];
  const currentQuarter = `Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`;
  const currentScore = calculateScore(tasks, history);

  // 1. Meta de Produtividade / Consistência
  if (currentScore < 60) {
      goals.push({
          id: 'auto-score-consistency',
          title: "Construir Consistência de Foco",
          description: "Aumentar a regularidade das sessões de foco para elevar o score semanal.",
          achieved: false,
          quarter: currentQuarter,
          metrics: {
              targetScore: 75,
              maxBurnoutLevel: "MEDIUM",
              metricType: "productivityScore"
          },
          progress: currentScore
      });
  } else {
      goals.push({
          id: 'auto-score-maintain',
          title: "Manter Alta Performance Sustentável",
          description: "Manter o nível de entrega sem atingir picos de burnout.",
          achieved: false,
          quarter: currentQuarter,
          metrics: {
              targetScore: 85,
              maxBurnoutLevel: "LOW",
              metricType: "productivityScore"
          },
          progress: currentScore
      });
  }

  // 2. Meta de Organização (Se muitos adiamentos)
  const recentReschedules = history.filter(h => h.action.type === 'RESCHEDULE_TASK').length;
  if (recentReschedules > 5) {
      goals.push({
          id: 'auto-reschedule',
          title: "Otimizar Planejamento Semanal",
          description: "Reduzir a necessidade de reagendamentos de última hora.",
          achieved: false,
          quarter: currentQuarter,
          metrics: {
              targetValue: "-30%",
              metricType: "reschedules"
          },
          progress: 0
      });
  }

  // 3. Meta de Projetos (Baseada em palavras-chave das tarefas existentes)
  const themes: Record<string, number> = {};
  const stopWords = ['a', 'o', 'e', 'de', 'do', 'da', 'com', 'para', 'fazer', 'criar', 'reunião', 'enviar', 'relatório', 'projeto'];

  tasks.forEach(task => {
    const words = task.title.toLowerCase().split(' ');
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            themes[word] = (themes[word] || 0) + 1;
        }
    });
  });

  const topThemeEntry = Object.entries(themes).sort(([, a], [, b]) => b - a)[0];

  if (topThemeEntry && topThemeEntry[1] > 2) {
      const themeName = topThemeEntry[0].charAt(0).toUpperCase() + topThemeEntry[0].slice(1);
      goals.push({
          id: `auto-theme-${topThemeEntry[0]}`,
          title: `Finalizar Projeto "${themeName}"`,
          description: `Concentrar esforços nas entregas relacionadas a ${themeName}.`,
          achieved: false,
          quarter: currentQuarter,
          metrics: {
              metricType: "project_completion"
          },
          progress: 0
      });
  } 

  return goals;
}
