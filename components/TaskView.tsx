
import React, { useMemo } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { suggestNextTask } from '../utils/iaSuggestions';
import { calculatePriority } from '../utils/taskUtils';

interface TaskViewProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onConvertTaskToEvent: (task: Task) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ tasks, onAddTask, onToggleTask }) => {
  const [newTaskTitle, setNewTaskTitle] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const aiSuggestion = useMemo(() => suggestNextTask(tasks), [tasks]);

  return (
    <div className="h-full p-6 md:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
         <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white">Minhas Tarefas</h2>
      </div>

      {/* AI Suggestion Banner */}
      {tasks.length > 0 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl flex items-start gap-3 animate-slide-up">
              <Sparkles className="text-purple-500 mt-1 flex-shrink-0" size={20} />
              <div>
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">Sugestão da Maya</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{aiSuggestion}</p>
              </div>
          </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8 relative">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          className="w-full p-4 pl-6 pr-12 rounded-2xl bg-white dark:bg-white/5 border border-transparent focus:border-custom-caramel outline-none shadow-sm dark:text-white"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-custom-soil text-white rounded-xl hover:bg-custom-caramel transition-colors">
            <Plus size={20} />
        </button>
      </form>

      <div className="space-y-3">
        {tasks.map((task) => {
           // Ensure priority is calculated for display
           const priority = calculatePriority(task);
           return (
            <div key={task.id} className="group flex items-center gap-4 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-white/5 hover:shadow-lg transition-all animate-slide-up">
                <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                >
                    {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div className="flex-1">
                    <span className={`font-medium text-lg block ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {task.title}
                    </span>
                    {task.dueDate && (
                        <span className="text-xs text-gray-400">
                            Prazo: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {priority === 'high' && !task.completed && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle size={10} /> Alta
                        </span>
                    )}
                    {priority === 'medium' && !task.completed && (
                         <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs rounded-md font-bold uppercase tracking-wider">
                            Média
                         </span>
                    )}
                </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <p>Nenhuma tarefa pendente. Aproveite o dia!</p>
            </div>
        )}
      </div>
    </div>
  );
};
