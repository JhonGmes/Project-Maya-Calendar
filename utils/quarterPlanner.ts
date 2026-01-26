
import { Task, QuarterlyGoal } from '../types';

export function generateQuarterGoals(tasks: Task[]): { title: string }[] {
  const themes: Record<string, number> = {};
  const stopWords = ['a', 'o', 'e', 'de', 'do', 'da', 'com', 'para', 'fazer', 'criar'];

  tasks.forEach(task => {
    // Basic Keyword Extraction
    const words = task.title.toLowerCase().split(' ');
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            themes[word] = (themes[word] || 0) + 1;
        }
    });
  });

  // Sort by frequency and take top 3
  const topThemes = Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  return topThemes.map(t => ({
    title: `Avançar projetos relacionados a "${t.charAt(0).toUpperCase() + t.slice(1)}"`
  }));
}
