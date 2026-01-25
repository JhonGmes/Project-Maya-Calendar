import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Plus, AlertCircle } from 'lucide-react';

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

  return (
    <div className="h-full p-8 overflow-y-auto">
      <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white mb-6">Minhas Tarefas</h2>
      
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
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-4 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-white/5 hover:shadow-lg transition-all animate-slide-up">
            <button 
                onClick={() => onToggleTask(task.id)}
                className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
            >
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <span className={`flex-1 font-medium text-lg ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {task.title}
            </span>
            {task.priority === 'high' && <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-md font-bold uppercase tracking-wider">Alta</span>}
          </div>
        ))}
      </div>
    </div>
  );
};