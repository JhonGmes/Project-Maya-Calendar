
import { Task, ScoreHistory, IAHistoryItem, WeeklyReportData } from '../types';
import { detectBurnout } from './burnoutDetector';
import { calculateScore } from './productivityScore';
import { subDays } from 'date-fns';

export function generateWeeklyReportData(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): WeeklyReportData {
  
  // Basic Metrics
  const completedSteps = tasks.reduce((acc, t) => {
      return acc + (t.workflow ? t.workflow.steps.filter(s => s.status === 'completed').length : (t.completed ? 1 : 0));
  }, 0);

  const currentScore = calculateScore(tasks, iaHistory);
  const burnout = detectBurnout(tasks, iaHistory, currentScore);
  const burnoutAlerts = burnout.level === 'high' ? 1 : 0;

  // Analysis for Highlights & Suggestions
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const recentHistory = iaHistory.filter(h => new Date(h.timestamp) > oneWeekAgo);
  
  const conflictsResolved = recentHistory.filter(h => h.action.type === 'REORGANIZE_WEEK').length;
  const focusMinutes = recentHistory.filter(h => h.action.type === 'END_FOCUS' && h.action.payload.completed).length * 25;
  const avgFocus = Math.round(focusMinutes / 7); // Daily avg

  const highlights: string[] = [];
  if (conflictsResolved > 0) highlights.push(`Você reorganizou sua agenda ${conflictsResolved} vezes para otimizar o tempo.`);
  if (focusMinutes > 120) highlights.push(`Manteve um total de ${Math.round(focusMinutes/60)} horas de foco profundo.`);
  if (completedSteps > 5) highlights.push(`Avançou em ${completedSteps} etapas importantes de projetos.`);
  if (currentScore > 80) highlights.push("Manteve consistência de Alta Performance (Score > 80).");

  if (highlights.length === 0) highlights.push("Semana de manutenção. O foco foi em tarefas rotineiras.");

  const suggestions: string[] = [];
  if (burnout.level === 'high') {
      suggestions.push("Prioridade máxima: Reduza a carga horária na próxima semana.");
      suggestions.push("Tente delegar ou adiar tarefas não críticas de segunda-feira.");
  } else if (burnout.level === 'medium') {
      suggestions.push("Agrupe suas reuniões em blocos para evitar interrupções.");
      suggestions.push("Evite agendar tarefas complexas após as 18h.");
  } else {
      suggestions.push("Continue com blocos de foco de 25-50 minutos.");
      suggestions.push("Que tal desafiar-se com um projeto mais complexo na próxima semana?");
  }

  // Summary Text
  let summary = "";
  if (burnout.level === 'high') {
      summary = `Carga crítica detectada. Seu score foi ${currentScore}, mas o custo operacional está alto. ${burnout.signals[0]}`;
  } else if (currentScore > 80) {
      summary = `Semana de elite! Score ${currentScore}. Você equilibrou perfeitamente execução e foco.`;
  } else {
      summary = `Semana com score ${currentScore}. ${highlights[0]}`;
  }

  return {
      week: new Date().toISOString(),
      totalCompletedSteps: completedSteps,
      productivityScore: currentScore,
      burnoutAlerts,
      summary,
      highlights,
      suggestions
  };
}

// Text generator wrapper for legacy compatibility
export function generateWeeklyReport(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): string {
    const report = generateWeeklyReportData(tasks, scoreHistory, iaHistory);
    return `
📊 **Relatório Semanal Maya**

**Resumo:**
${report.summary}

**Destaques:**
${report.highlights.map(h => `• ${h}`).join('\n')}

**Sugestões:**
${report.suggestions.map(s => `👉 ${s}`).join('\n')}

**Métricas:**
🏆 Score: ${report.productivityScore}
✅ Entregas: ${report.totalCompletedSteps}
${report.burnoutAlerts > 0 ? `🔴 Alerta de Sobrecarga` : '🟢 Saúde Operacional: Estável'}
`;
}
