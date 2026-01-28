
import React from 'react';
import { EventReorgPlan } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Calendar, Clock, AlertCircle } from 'lucide-react';

interface WeekPreviewProps {
  plan: EventReorgPlan[];
}

export const WeekPreview: React.FC<WeekPreviewProps> = ({ plan }) => {
  if (plan.length === 0) {
      return (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-center text-sm">
              <p>Sua agenda já está otimizada! Nenhuma mudança necessária.</p>
          </div>
      );
  }

  return (
    <div className="w-full">
      <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-purple-600 dark:text-purple-400" />
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
              Sugiro <strong>{plan.length} alterações</strong> para eliminar conflitos e melhorar seu foco.
          </p>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {plan.map((item) => {
          const oldDate = new Date(item.oldStart);
          const newDate = new Date(item.newStart);
          
          const isDayChange = oldDate.getDate() !== newDate.getDate();

          return (
            <div key={item.originalEventId} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate max-w-[70%]">
                      {item.title}
                  </span>
                  {isDayChange && (
                      <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          Novo Dia
                      </span>
                  )}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-black/20 p-2 rounded-lg">
                  <div className="flex-1 text-center">
                      <div className="text-red-400 line-through opacity-70">
                          {format(oldDate, 'EEE HH:mm', { locale: ptBR })}
                      </div>
                  </div>
                  <ArrowRight size={12} className="text-gray-300" />
                  <div className="flex-1 text-center">
                      <div className="text-green-600 dark:text-green-400 font-bold">
                          {format(newDate, 'EEE HH:mm', { locale: ptBR })}
                      </div>
                  </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-2 italic border-t border-gray-100 dark:border-white/5 pt-1">
                  🤖 {item.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
