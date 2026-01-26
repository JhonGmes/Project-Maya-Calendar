
import { Task, ScoreHistory } from '../types';

export function generateWeeklyReport(tasks: Task[], scoreHistory: ScoreHistory[]): string {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;

  const recentHistory = scoreHistory.slice(-7);
  const avgScore = recentHistory.length > 0
    ? recentHistory.reduce((a, b) => a + b.score, 0) / recentHistory.length
    : 0;

  return `
📊 **Resumo da Semana**

✅ Concluídas: ${completed}
⏳ Pendentes: ${pending}
🏆 Pontuação Média: ${Math.round(avgScore)} pts

**Sugestão da Maya:**
${pending > 5 ? "Tente focar em concluir tarefas antigas antes de criar novas." : "Ótima consistência! Continue assim."}
`;
}
