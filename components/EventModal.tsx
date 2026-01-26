
import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, EventColor, TimeSuggestion, UserProfile } from '../types';
import { X, Calendar as CalIcon, Clock, MapPin, AlignLeft, Sparkles, Check } from 'lucide-react';
import { format } from 'date-fns';
import { suggestOptimalTimes } from '../services/geminiService';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  initialData: CalendarEvent | null;
  initialDate: Date;
  existingEvents?: CalendarEvent[];
  userProfile?: UserProfile | null;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, initialData, initialDate, existingEvents = [], userProfile }) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    start: initialDate,
    end: new Date(initialDate.getTime() + 60 * 60 * 1000),
    color: 'blue',
    category: 'work',
    description: '',
    location: ''
  });

  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    setSuggestions([]); // Clear suggestions on open
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        start: initialDate,
        end: new Date(initialDate.getTime() + 60 * 60 * 1000),
        color: 'blue',
        category: 'work',
        description: '',
        location: ''
      });
    }
  }, [initialData, initialDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleGetSuggestions = async () => {
    if (!formData.title) return;
    setLoadingSuggestions(true);
    setSuggestions([]);
    
    // Default duration: 60 mins or based on current selection
    const duration = formData.start && formData.end 
        ? (new Date(formData.end).getTime() - new Date(formData.start).getTime()) / 60000 
        : 60;

    const workingHours = userProfile?.workingHours || { start: '09:00', end: '18:00' };

    const results = await suggestOptimalTimes(
        existingEvents,
        formData.title || "Untitled Event",
        formData.start || new Date(),
        workingHours,
        duration
    );
    
    setSuggestions(results);
    setLoadingSuggestions(false);
  };

  const applySuggestion = (suggestion: TimeSuggestion) => {
      setFormData({
          ...formData,
          start: new Date(suggestion.start),
          end: new Date(suggestion.end)
      });
      setSuggestions([]); // Clear after selection
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 relative z-10 animate-slide-up border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold dark:text-white">{initialData ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Título do Evento"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xl font-medium border-b-2 border-gray-200 dark:border-gray-700 focus:border-custom-caramel bg-transparent py-2 outline-none dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* AI Suggestion Button */}
          {!initialData && (
             <div className="flex flex-col gap-2">
                <button 
                    type="button"
                    onClick={handleGetSuggestions}
                    disabled={loadingSuggestions || !formData.title}
                    className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 w-fit transition-colors disabled:opacity-50"
                >
                    <Sparkles size={14} />
                    {loadingSuggestions ? 'Analisando agenda...' : 'Sugerir melhor horário (IA)'}
                </button>
                
                {suggestions.length > 0 && (
                    <div className="space-y-2 mt-1 animate-slide-up">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Sugestões da Maya</p>
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => applySuggestion(s)}
                                className="w-full text-left p-2.5 bg-gradient-to-r from-purple-50 to-white dark:from-zinc-800 dark:to-zinc-800/50 border border-purple-100 dark:border-white/10 rounded-xl hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-mono text-sm font-bold text-purple-900 dark:text-purple-200">
                                        {format(new Date(s.start), 'HH:mm')} - {format(new Date(s.end), 'HH:mm')}
                                    </span>
                                    <span className="text-[10px] bg-white dark:bg-black/20 px-2 py-0.5 rounded-full text-gray-500 border border-gray-100 dark:border-white/5 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        Selecionar
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.reason}</p>
                            </button>
                        ))}
                    </div>
                )}
             </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Início</label>
              <input
                type="datetime-local"
                required
                value={formData.start ? format(formData.start, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={e => setFormData({ ...formData, start: new Date(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-sm dark:text-white border border-transparent focus:border-custom-caramel outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Fim</label>
              <input
                type="datetime-local"
                required
                value={formData.end ? format(formData.end, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={e => setFormData({ ...formData, end: new Date(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-sm dark:text-white border border-transparent focus:border-custom-caramel outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 py-2">
            {['blue', 'green', 'red', 'yellow', 'purple', 'orange'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, color: c as EventColor })}
                className={`w-6 h-6 rounded-full border-2 ${formData.color === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c === 'yellow' ? '#facc15' : c === 'orange' ? '#fb923c' : c === 'purple' ? '#a855f7' : c === 'green' ? '#4ade80' : c === 'red' ? '#f87171' : '#60a5fa' }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
             <MapPin size={18} className="text-gray-400" />
             <input 
                type="text" 
                placeholder="Adicionar Local"
                value={formData.location || ''}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="bg-transparent w-full text-sm outline-none dark:text-white"
             />
          </div>

          <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
             <AlignLeft size={18} className="text-gray-400 mt-1" />
             <textarea 
                placeholder="Adicionar descrição..."
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="bg-transparent w-full text-sm outline-none dark:text-white resize-none h-20"
             />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-custom-soil text-white rounded-xl font-medium hover:bg-custom-caramel transition-colors shadow-lg mt-4"
          >
            Salvar Evento
          </button>
        </form>
      </div>
    </div>
  );
};
