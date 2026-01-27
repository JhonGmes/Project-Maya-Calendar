
import React, { useMemo } from 'react';
import { CalendarEvent, UserProfile, PersonalityType } from '../types';
import { format, differenceInMinutes, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Battery, BatteryCharging, BatteryWarning, Briefcase, Zap } from 'lucide-react';

interface DayHeaderProps {
    date: Date;
    events: CalendarEvent[];
    profile: UserProfile | null;
    personality: PersonalityType;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ date, events, profile, personality }) => {
    // Calculate Day Load
    const loadStats = useMemo(() => {
        const dayEvents = events.filter(e => 
            new Date(e.start).toDateString() === date.toDateString() && 
            e.category !== 'personal' // Filter out personal for "Work Load" calculation? Optional.
        );

        const totalMinutes = dayEvents.reduce((acc, curr) => {
            return acc + differenceInMinutes(new Date(curr.end), new Date(curr.start));
        }, 0);

        const hours = Math.round(totalMinutes / 60 * 10) / 10;
        // Assume 8h work day for calculation
        const capacity = 8; 
        const percentage = Math.min((hours / capacity) * 100, 100);
        
        let status: 'light' | 'balanced' | 'heavy' | 'overload' = 'balanced';
        if (hours < 4) status = 'light';
        else if (hours <= 7) status = 'balanced';
        else if (hours <= 9) status = 'heavy';
        else status = 'overload';

        return { hours, percentage, status, count: dayEvents.length };
    }, [events, date]);

    const getStatusColor = () => {
        switch(loadStats.status) {
            case 'light': return 'bg-green-400';
            case 'balanced': return 'bg-blue-400';
            case 'heavy': return 'bg-orange-400';
            case 'overload': return 'bg-red-500';
        }
    };

    const getStatusMessage = () => {
        if (personality === 'disciplinado') return `${loadStats.hours}h planejadas.`;
        if (personality === 'sobrecarregado' && loadStats.status === 'overload') return 'Sobrecarga! Vamos aliviar?';
        
        switch(loadStats.status) {
            case 'light': return 'Dia leve.';
            case 'balanced': return 'Dia equilibrado.';
            case 'heavy': return 'Dia cheio.';
            case 'overload': return 'Carga crítica.';
        }
    };

    return (
        <div className="flex flex-col gap-3 mb-4 bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/40 dark:border-white/5 backdrop-blur-sm transition-all">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-serif font-bold text-custom-soil dark:text-white capitalize leading-none">
                        {isToday(date) ? 'Hoje' : format(date, 'EEEE', { locale: ptBR })}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        {format(date, "d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        {loadStats.status === 'overload' ? <BatteryWarning size={16} className="text-red-500 animate-pulse" /> : 
                         loadStats.status === 'light' ? <BatteryCharging size={16} className="text-green-500" /> :
                         <Battery size={16} className="text-gray-400" />}
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                            loadStats.status === 'overload' ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                            {getStatusMessage()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Load Bar */}
            <div className="relative h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${getStatusColor()}`}
                    style={{ width: `${loadStats.percentage}%` }}
                ></div>
                {/* 8h Marker */}
                <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-black/20 dark:bg-white/20 z-10" title="Limite 8h"></div>
            </div>
            
            {/* Stats Footer - Adaptive based on Personality */}
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>{loadStats.count} eventos</span>
                <span>{loadStats.hours}h / 8h</span>
            </div>
        </div>
    );
};
