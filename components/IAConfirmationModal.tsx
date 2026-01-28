
import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Check, X, CalendarClock, Brain, List, ArrowRight, Layers, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const IAConfirmationModal: React.FC = () => {
  const { pendingAction, setPendingAction, executeIAAction } = useApp();

  if (!pendingAction) return null;

  const handleConfirm = async () => {
    // Executa a ação original que estava pendente
    await executeIAAction(pendingAction.originalAction, "ai");
    setPendingAction(null);
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  const getIcon = () => {
      const type = pendingAction.originalAction.type;
      if (type === 'RESCHEDULE_TASK') return <CalendarClock size={32} className="text-orange-500" />;
      if (type === 'REORGANIZE_WEEK') return <List size={32} className="text-blue-500" />;
      if (type === 'PROPOSE_WORKFLOW') return <Layers size={32} className="text-purple-600" />;
      if (type === 'CREATE_TASK' || type === 'CREATE_EVENT') return <Check size={32} className="text-green-500" />;
      return <Brain size={32} className="text-purple-500" />;
  };

  // Render logic for complex Reorganization preview
  const renderReorganizationPreview = () => {
      if (pendingAction.originalAction.type !== 'REORGANIZE_WEEK') return null;
      
      const changes = pendingAction.originalAction.payload.changes;

      return (
          <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl mb-6 text-left max-h-48 overflow-y-auto border border-gray-100 dark:border-white/5 custom-scrollbar">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plano de Mudanças ({changes.length})</h4>
              <div className="space-y-2">
                  {changes.map((change: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                          <span className="font-medium truncate max-w-[40%] dark:text-gray-300">{change.taskTitle}</span>
                          <div className="flex items-center gap-2 text-gray-400">
                              <span className="line-through">{format(new Date(change.from), 'dd/MM')}</span>
                              <ArrowRight size={10} />
                              <span className="text-green-600 dark:text-green-400 font-bold">{format(new Date(change.to), 'dd/MM')}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  // New: Render logic for Workflow Proposal preview
  const renderWorkflowPreview = () => {
      if (pendingAction.originalAction.type !== 'PROPOSE_WORKFLOW') return null;
      
      const { title, steps } = pendingAction.originalAction.payload;

      return (
          <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl mb-6 text-left max-h-60 overflow-y-auto border border-gray-100 dark:border-white/5 custom-scrollbar">
              <div className="flex items-center gap-2 mb-3">
                  <LayoutList size={14} className="text-purple-500" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estrutura do Fluxo: <span className="text-purple-600 dark:text-purple-400">{title}</span></h4>
              </div>
              
              <div className="space-y-2">
                  {steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-xs bg-white dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-200 mt-0.5">{step}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden animate-slide-up">
        
        {/* Header Visual */}
        <div className="bg-gray-50 dark:bg-white/5 p-6 flex flex-col items-center justify-center border-b border-gray-100 dark:border-white/5">
            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-lg mb-4">
                {getIcon()}
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
                Confirmação Necessária
            </h3>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Use specific preview or fallback to question text */}
          {!renderReorganizationPreview() && !renderWorkflowPreview() && (
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                {pendingAction.question}
              </p>
          )}

          {renderReorganizationPreview()}
          {renderWorkflowPreview()}

          <div className="flex gap-3">
            <button 
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
                <X size={18} /> Cancelar
            </button>
            <button 
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-custom-soil text-white font-bold hover:bg-custom-caramel transition-colors shadow-lg flex items-center justify-center gap-2"
            >
                <Check size={18} /> Confirmar
            </button>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 dark:bg-black/20 text-center border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Maya Intelligence System</p>
        </div>
      </div>
    </div>
  );
};
