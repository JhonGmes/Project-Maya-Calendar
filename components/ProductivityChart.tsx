
import React from 'react';
import { ScoreHistory } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
    data: ScoreHistory[];
}

export const ProductivityChart: React.FC<Props> = ({ data }) => {
    if (data.length < 2) return <div className="text-xs text-gray-400 text-center py-4">Histórico insuficiente para gráfico.</div>;

    // Dimensions
    const width = 300;
    const height = 100;
    const padding = 20;

    // Scales
    const maxScore = Math.max(...data.map(d => d.score), 100);
    const minScore = 0;
    
    // Points
    const points = data.slice(-7).map((d, index, arr) => {
        const x = padding + (index / (arr.length - 1)) * (width - padding * 2);
        const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Grid Lines */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" strokeDasharray="4" />

                {/* The Line */}
                <polyline 
                    fill="none" 
                    stroke="currentColor" 
                    className="text-custom-caramel"
                    strokeWidth="2" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {data.slice(-7).map((d, index, arr) => {
                    const x = padding + (index / (arr.length - 1)) * (width - padding * 2);
                    const y = height - padding - ((d.score - minScore) / (maxScore - minScore)) * (height - padding * 2);
                    return (
                        <circle key={index} cx={x} cy={y} r="3" className="fill-custom-soil dark:fill-white" />
                    );
                })}
            </svg>
            <div className="flex justify-between px-2 mt-2">
                {data.slice(-7).map((d, i) => (
                    <span key={i} className="text-[9px] text-gray-400">{format(new Date(d.createdAt), 'dd/MM')}</span>
                ))}
            </div>
        </div>
    );
};
