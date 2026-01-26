
import { Task, PersonalityType } from '../types';

export function detectPersonality(tasks: Task[]): PersonalityType {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;

  if (completed > pending && completed > 0) return "disciplinado";
  if (pending > completed + 3) return "sobrecarregado"; // More lenient threshold

  return "neutro";
}

export function adaptTone(message: string, personality: PersonalityType): string {
  if (personality === "disciplinado") {
    return `🚀 Excelente ritmo! ${message}`;
  }

  if (personality === "sobrecarregado") {
    return `🧘 Vamos com calma. ${message}`;
  }

  return message;
}
