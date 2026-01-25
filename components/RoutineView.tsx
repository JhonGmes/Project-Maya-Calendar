import React from 'react';
import { CalendarEvent } from '../types';
import { Sun, Coffee, BookOpen } from 'lucide-react';

interface RoutineViewProps {
  events: CalendarEvent[];
  onAddRoutine: () => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({ events, onAddRoutine }) => {
  return (
    <div className="h-full p-8 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-white/5 flex items-center justify-center mb-6 animate-float">
        <Sun size={40} className="text-orange-500" />
      </div>
      <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white mb-2">Rotina Diária</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Organize seus hábitos e rituais diários. A consistência é a chave para a produtividade.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
         <div className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/80 transition-colors">
            <Coffee className="text-custom-soil dark:text-custom-tan" />
            <div className="text-left">
                <h4 className="font-bold dark:text-white">Ritual Matinal</h4>
                <p className="text-xs text-gray-400">07:00 - 08:00</p>
            </div>
         </div>
         <div className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/80 transition-colors">
            <BookOpen className="text-custom-soil dark:text-custom-tan" />
            <div className="text-left">
                <h4 className="font-bold dark:text-white">Estudos / Leitura</h4>
                <p className="text-xs text-gray-400">20:00 - 21:00</p>
            </div>
         </div>
      </div>

      <button onClick={onAddRoutine} className="mt-8 text-custom-caramel hover:underline underline-offset-4">
        + Adicionar nova rotina
      </button>
    </div>
  );
};