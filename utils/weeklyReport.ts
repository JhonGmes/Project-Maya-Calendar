import { Task, ScoreHistory, IAHistoryItem, WeeklyReportData } from '../types';
import { calculateBurnoutRisk } from './burnoutDetector';
import { calculateScore } from './productivityScore';
import { subDays } from 'date-fns';

export function generateWeeklyReportData(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): WeeklyReportData {
  
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const recentHistory = iaHistory.filter(h => new Date(h.timestamp) > oneWeekAgo);
  
  // 1. Metrics Calculation
  const currentScore = calculateScore(tasks, iaHistory);
  const burnout = calculateBurnoutRisk(tasks, iaHistory, currentScore);
  
  const conflictsResolved = recentHistory.filter(h => 
      h.action.type === 'REORGANIZE_WEEK' || h.action.type === 'UPDATE_EVENT' // Assuming UPDATE_EVENT often resolves conflict
  ).length;

  const focusSessions = recentHistory.filter(h => h.action.type === 'END_FOCUS' && h.action.payload.completed);
  const totalFocusMinutes = focusSessions.length * 25;
  const avgFocus = focusSessions.length > 0 ? 25 : 0; // Simplified assumption: standard 25m sessions

  // 2. Highlights Generation
  const highlights: string[] = [];
  if (conflictsResolved > 0) {
      highlights.push(`Você resolveu ${conflictsResolved} conflitos de agenda`);
  }
  if (totalFocusMinutes > 0) {
      highlights.push(`Manteve foco total de ${Math.round(totalFocusMinutes/60)} horas`);
  }
  if (currentScore > 80) {
      highlights.push("Manteve alta performance (Score > 80)");
  }

  // 3. Suggestions Generation based on Burnout
  const suggestions: string[] = [];
  if (burnout.level === 'high') {
      suggestions.push("Reduzir tarefas após 18h");
      suggestions.push("Agrupar reuniões em blocos");
  } else if (burnout.level === 'medium') {
      suggestions.push("Começar a semana com blocos maiores de foco");
      suggestions.push("Evitar multitarefa em horários de pico");
  } else {
      suggestions.push("Manter o ritmo atual, você está bem!");
  }

  return {
      userId: 'current-user', // Should come from context usually
      week: new Date().toISOString(),
      score: currentScore,
      productivityScore: currentScore, // Legacy compat
      burnoutRisk: {
          week: new Date().toISOString(),
          level: burnout.level === 'low' ? 'LOW' : burnout.level === 'medium' ? 'MEDIUM' : 'HIGH',
          signals: burnout.signals
      },
      highlights,
      suggestions,
      // Legacy fields
      totalCompletedSteps: tasks.filter(t => t.completed).length,
      burnoutAlerts: burnout.level === 'high' ? 1 : 0,
      summary: `Esta semana seu score foi ${currentScore}. ${burnout.reason}`
  };
}

// Text generator wrapper for legacy compatibility
export function generateWeeklyReport(
    tasks: Task[], 
    scoreHistory: ScoreHistory[], 
    iaHistory: IAHistoryItem[] = []
): string {
    const report = generateWeeklyReportData(tasks, scoreHistory, iaHistory);
    
    // Formatting as requested
    return `
Seu resumo da semana com a Maya

Esta semana seu score foi ${report.score}.
${report.burnoutRisk.level === 'HIGH' ? '⚠️ Risco alto de burnout.' : 'Você avançou bem.'}

Pontos fortes
${report.highlights.map(h => `• ${h}`).join('\n')}

Sugestão principal
${report.suggestions[0] || "Continue assim!"}
`;
}