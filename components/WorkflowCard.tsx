
import React, { useState } from 'react';
import { Task, Workflow } from '../types';
import { CheckCircle2, Lock, Circle, ChevronDown, ChevronUp, Play, Briefcase, Save, User, Bot, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface WorkflowCardProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onToggleComplete: (taskId: string) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ task, onUpdate, onToggleComplete }) => {
  const { saveWorkflowAsTemplate, advanceWorkflow } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const workflow = task.workflow!;

  const handleStepComplete = async (stepId: string) => {
    // Agora chama a função centralizada que gera Log e salva no banco
    await advanceWorkflow(task, stepId);
  };

  const progress = (workflow.completedSteps / workflow.totalSteps) * 100;

  // Get last AI interaction
  const lastHistory = workflow.iaHistory && workflow.iaHistory.length > 0 ? workflow.iaHistory[workflow.iaHistory.length - 1] : null;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl transition-all duration-300 border
      ${task.completed 
        ? 'bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/5' 
        : 'bg-white dark:bg-zinc-800 border-purple-200 dark:border-purple-900/30 shadow-sm'}
    `}>
      {/* Header Section */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${task.completed ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'}`}>
            {task.completed ? <CheckCircle2 size={20} /> : <Briefcase size={20} />}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm md:text-base ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {workflow.completedSteps}/{workflow.totalSteps} etapas
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isExpanded && !task.completed && (
                <button 
                    onClick={(e) => { e.stopPropagation(); saveWorkflowAsTemplate(workflow); }}
                    className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Salvar como Template"
                >
                    <Save size={16} />
                </button>
            )}
            <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        </div>
      </div>

      {/* Steps List (Accordion) */}
      {isExpanded && (
        <div className="bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 p-4 space-y-3">
          {workflow.steps.map((step, index) => {
            const isLast = index === workflow.steps.length - 1;
            
            return (
              <div key={step.id} className="relative flex gap-3 group">
                {/* Timeline Line */}
                {!isLast && (
                  <div className={`absolute left-[11px] top-6 bottom-[-12px] w-[2px] ${step.status === 'completed' ? 'bg-green-200 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-white/5'}`}></div>
                )}

                {/* Status Icon */}
                <div className="relative z-10 flex-shrink-0 mt-0.5">
                  {step.status === 'completed' && (
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                  {step.status === 'available' && (
                    <button 
                      onClick={() => handleStepComplete(step.id)}
                      className="w-6 h-6 rounded-full bg-white dark:bg-zinc-700 border-2 border-purple-500 text-purple-500 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                      title="Executar etapa"
                    >
                      <Play size={10} fill="currentColor" />
                    </button>
                  )}
                  {step.status === 'locked' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 text-gray-400 flex items-center justify-center">
                      <Lock size={12} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 transition-opacity ${step.status === 'locked' ? 'opacity-50' : 'opacity-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                        <p className={`text-sm font-medium ${step.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                            {step.title}
                        </p>
                        {step.status === 'available' && (
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                            Próximo passo
                            </p>
                        )}
                    </div>
                    {/* Assignee Visual Placeholder */}
                    {step.assignedTo ? (
                         <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-700 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                             <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] font-bold">
                                 {step.assignedTo.name.charAt(0)}
                             </div>
                             <span className="text-[10px] text-gray-500 dark:text-gray-300">{step.assignedTo.name}</span>
                         </div>
                    ) : (
                         // Optional: Hover to assign (Visual only for now)
                         <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500">
                             <User size={14} />
                         </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI History Footer */}
          {lastHistory && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center gap-2 text-[10px] text-gray-400">
                  <Bot size={12} className={lastHistory.confirmed ? "text-green-500" : "text-red-500"} />
                  <span>
                      Última ação da IA: <span className={lastHistory.confirmed ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                          {lastHistory.confirmed ? 'Confirmada' : 'Rejeitada'}
                      </span>
                  </span>
                  {lastHistory.confirmed ? <Check size={10} /> : <X size={10} />}
              </div>
          )}
        </div>
      )}
    </div>
  );
};
