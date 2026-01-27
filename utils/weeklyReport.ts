
import { Task, ScoreHistory, IAHistoryItem } from '../types';
import { detectBurnout } from './burnoutDetector';
import { calculateScore } from './productivityScore';

export function generateWeeklyReport(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): string {
  
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  
  const currentScore = calculateScore(tasks, iaHistory);
  const burnout = detectBurnout(tasks, iaHistory, currentScore);

  let suggestions = "";
  if (burnout.level === 'high') {
      suggestions = "⚠️ **Risco de Burnout Detectado**: Sua carga está muito alta e os adiamentos frequentes indicam sobrecarga. Sugiro tirar a manhã de folga ou usar a função de reorganizar semana.";
  } else if (currentScore > 80) {
      suggestions = "🏆 **Excelente Desempenho**: Você está " + (completed > pending ? "dominando suas tarefas." : "muito consistente.") + " Continue assim!";
  } else {
      suggestions = "💡 **Dica**: Tente concluir as tarefas mais difíceis pela manhã para aumentar seu score.";
  }

  return `
📊 **Relatório Semanal Maya**

**Produtividade:**
🏆 Score Atual: ${currentScore} / 100
✅ Tarefas Concluídas: ${completed}
⏳ Pendências Ativas: ${pending}

**Saúde & Ritmo:**
${burnout.level === 'high' ? '🔴 Nível de Carga: Crítico' : burnout.level === 'medium' ? '🟡 Nível de Carga: Moderado' : '🟢 Nível de Carga: Saudável'}
${burnout.signals.length > 0 ? `*Sinais: ${burnout.signals.join(', ')}*` : ''}

**Análise da IA:**
${suggestions}
`;
}
