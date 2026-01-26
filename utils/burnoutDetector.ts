
import { Task, ScoreHistory } from '../types';

export function detectBurnout(tasks: Task[], scoreHistory: ScoreHistory[]): boolean {
  // 1. Check volume of pending tasks
  const pending = tasks.filter(t => !t.completed).length;

  // 2. Check score trend over last 5 entries
  // Assuming scoreHistory is sorted by date ascending
  const lastScores = scoreHistory.slice(-5).map(s => s.score);

  // Need at least 5 days of history to detect a trend drop
  if (lastScores.length < 5) return false;

  // Check if current score (end of array) is significantly lower than 5 days ago (start of array)
  // Or check for a consistent downward trend
  const startScore = lastScores[0];
  const currentScore = lastScores[lastScores.length - 1];
  
  const scoreDrop = currentScore < startScore * 0.7; // 30% drop

  // Threshold: > 10 pending tasks AND significant score drop
  if (pending > 10 && scoreDrop) {
    return true;
  }

  return false;
}
