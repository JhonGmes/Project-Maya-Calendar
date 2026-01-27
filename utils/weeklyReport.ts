
import { Task, ScoreHistory, IAHistoryItem, WeeklyReportData } from '../types';
import { detectBurnout } from './burnoutDetector';
import { calculateScore } from './productivityScore';

// Helper to generate the text version (kept for compatibility)
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

**Métricas:**
🏆 Score: ${report.productivityScore}
✅ Etapas Concluídas: ${report.totalCompletedSteps}
${report.burnoutAlerts > 0 ? `🔴 Alertas de Burnout: ${report.burnoutAlerts}` : '🟢 Saúde Operacional: OK'}
`;
}

// New Structured Data Generator
export function generateWeeklyReportData(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): WeeklyReportData {
  
  const completed = tasks.filter(t => t.completed).length;
  // Calculate completed workflow steps specifically
  const completedSteps = tasks.reduce((acc, t) => {
      return acc + (t.workflow ? t.workflow.steps.filter(s => s.status === 'completed').length : (t.completed ? 1 : 0));
  }, 0);

  const currentScore = calculateScore(tasks, iaHistory);
  const burnout = detectBurnout(tasks, iaHistory, currentScore);
  const burnoutAlerts = burnout.level === 'high' ? 1 : 0;

  let summary = "";
  if (burnout.level === 'high') {
      summary = "Carga crítica detectada. A produtividade está alta, mas o risco de exaustão é iminente. Recomendada redistribuição imediata.";
  } else if (currentScore > 80) {
      summary = "Semana de alta performance. O time/usuário manteve consistência e foco. Excelente adesão às sugestões da IA.";
  } else if (currentScore > 50) {
      summary = "Semana estável. Algumas tarefas foram adiadas, mas o ritmo geral é sustentável.";
  } else {
      summary = "Semana desafiadora. Baixa taxa de conclusão e foco disperso. Sugiro revisão do planejamento para a próxima semana.";
  }

  return {
      week: new Date().toISOString(),
      totalCompletedSteps: completedSteps,
      productivityScore: currentScore,
      burnoutAlerts,
      summary
  };
}
