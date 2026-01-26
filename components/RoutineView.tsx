
import React from 'react';
import { CalendarEvent } from '../types';
import { Sun, Coffee, BookOpen, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface RoutineViewProps {
  events: CalendarEvent[];
  onAddRoutine: () => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({ events, onAddRoutine }) => {
  // Filter events that are categorized as 'routine'
  const routines = events
    .filter(e => e.category === 'routine')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="h-full p-8 flex flex-col items-center justify-start text-center overflow-y-auto">
      <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-white/5 flex items-center justify-center mb-6 animate-float mt-10">
        <Sun size={40} className="text-orange-500" />
      </div>
      <h2 className="text-3xl font-serif font-bold text-custom-soil dark:text-white mb-2">Rotina Diária</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Seus rituais e hábitos diários registrados.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
         {routines.length > 0 ? (
             routines.map(routine => (
                <div key={routine.id} className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/80 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-white/5 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Clock size={20} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-bold dark:text-white text-lg">{routine.title}</h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {format(new Date(routine.start), 'HH:mm')} - {format(new Date(routine.end), 'HH:mm')}
                            {routine.location && <span className="ml-2 opacity-70">• {routine.location}</span>}
                        </p>
                    </div>
                </div>
             ))
         ) : (
             <div className="col-span-full p-8 text-gray-400 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                 <p>Nenhuma rotina cadastrada ainda.</p>
                 <p className="text-xs mt-2">Peça para a Maya: "Crie uma rotina de leitura às 20h"</p>
             </div>
         )}
      </div>

      <button onClick={onAddRoutine} className="mt-8 text-custom-caramel hover:underline underline-offset-4 flex items-center gap-2">
        <Calendar size={16} /> + Adicionar nova rotina manualmente
      </button>
    </div>
  );
};
