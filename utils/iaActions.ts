
import { IAAction } from './iaEngine';
import { AppContextData } from '../context/AppContext';
import { ViewMode } from '../types';
import { applyReorganization } from './weekReorganizer';
import { StorageService } from '../services/storage';

export const executeIAAction = async (
  result: IAAction,
  context: AppContextData,
  onReply: (text: string) => void
) => {
  try {
      switch (result.action) {
        case "ADD_TASK":
          if (result.payload && result.payload.title) {
            await context.addTask(result.payload.title, result.payload.dueDate);
            onReply(`Tarefa "${result.payload.title}" adicionada com sucesso.`);
          } else {
            onReply("Não entendi qual tarefa devo criar.");
          }
          break;

        case "ADD_EVENT":
          if (result.payload && result.payload.title) {
            await context.addEvent({
                title: result.payload.title,
                category: result.payload.category || 'work',
                start: result.payload.start ? new Date(result.payload.start) : new Date(),
                end: result.payload.end ? new Date(result.payload.end) : new Date(Date.now() + 60 * 60 * 1000)
            });
            onReply(`Evento "${result.payload.title}" agendado.`);
          } else {
            onReply("Preciso de um título para o evento.");
          }
          break;

        case "CHANGE_SCREEN":
          if (result.payload) {
            context.setScreen(result.payload as ViewMode);
            onReply(`Navegando para ${result.payload}.`);
          }
          break;

        case "REPLY":
          if (result.payload) {
            onReply(result.payload);
          }
          break;

        case "REORGANIZE_WEEK":
          if (result.payload) {
            const updates = applyReorganization(result.payload);
            for (const update of updates) {
                const task = context.tasks.find(t => t.id === update.taskId);
                if (task) {
                    await context.updateTask({ ...task, dueDate: update.newDate });
                }
            }
            onReply("Semana reorganizada com sucesso! Verifique a tela de Tarefas.");
          }
          break;

        case "SAVE_GOALS":
           if (result.payload && Array.isArray(result.payload)) {
               for (const goal of result.payload) {
                   await StorageService.saveQuarterlyGoal(goal.title);
               }
               onReply("Metas trimestrais registradas com sucesso! Vamos focar nisso.");
           }
           break;
          
        default:
          onReply("Não sei como fazer isso ainda.");
          break;
      }
  } catch (err) {
      console.error("Action Execution Error", err);
      onReply("Tive um erro ao tentar executar essa ação.");
  }
};
