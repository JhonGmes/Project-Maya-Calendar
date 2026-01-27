
import React, { useState } from 'react';
import { Plus, X, ArrowRight, Layers, LayoutTemplate, Copy } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CreateWorkflowProps {
  onCreate: (title: string, steps: string[]) => void;
  onCancel: () => void;
}

export const CreateWorkflow: React.FC<CreateWorkflowProps> = ({ onCreate, onCancel }) => {
  const { templates } = useApp();
  const [activeTab, setActiveTab] = useState<'scratch' | 'template'>('scratch');
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<string[]>(['', '']);

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const loadTemplate = (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
          setTitle(template.title);
          setSteps(template.steps.sort((a,b) => a.order - b.order).map(s => s.title));
          setActiveTab('scratch'); // Switch to editor view
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSteps = steps.filter(s => s.trim() !== '');
    if (title.trim() && validSteps.length > 0) {
      onCreate(title, validSteps);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-purple-200 dark:border-purple-900/30 shadow-lg mb-6 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
          <Layers size={20} className="text-purple-500" />
          Novo Fluxo de Trabalho
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={20} />
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-1">
          <button 
            onClick={() => setActiveTab('scratch')}
            className={`pb-2 text-sm font-bold transition-all ${activeTab === 'scratch' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Criar do Zero
          </button>
          <button 
            onClick={() => setActiveTab('template')}
            className={`pb-2 text-sm font-bold transition-all ${activeTab === 'template' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Usar Template ({templates.length})
          </button>
      </div>

      {activeTab === 'template' ? (
          <div className="space-y-3 min-h-[200px]">
              {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                      <LayoutTemplate size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum template salvo ainda.</p>
                      <p className="text-xs">Salve fluxos existentes como template para reutilizar.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map(t => (
                          <button 
                            key={t.id}
                            onClick={() => loadTemplate(t.id)}
                            className="text-left p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-purple-200 dark:hover:border-purple-500/50 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-zinc-700 transition-all group"
                          >
                              <h4 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-1 group-hover:text-purple-500">{t.title}</h4>
                              <p className="text-xs text-gray-400">{t.steps.length} etapas</p>
                          </button>
                      ))}
                  </div>
              )}
          </div>
      ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título do Processo</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Processo de Contratação"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 focus:border-purple-500 outline-none dark:text-white placeholder:text-gray-400"
                autoFocus
            />
            </div>

            <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase">Checklist de Etapas</label>
            {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 animate-fade-in">
                <span className="text-xs font-mono text-gray-400 w-4">{index + 1}.</span>
                <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Etapa ${index + 1}`}
                    className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm focus:border-purple-500 outline-none dark:text-white placeholder:text-gray-500"
                />
                {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)} className="text-gray-300 hover:text-red-400">
                    <X size={16} />
                    </button>
                )}
                </div>
            ))}
            <button
                type="button"
                onClick={addStep}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-2"
            >
                <Plus size={14} /> Adicionar Etapa
            </button>
            </div>

            <div className="flex justify-end gap-3">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={!title.trim() || steps.every(s => !s.trim())}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
                Criar Fluxo <ArrowRight size={16} />
            </button>
            </div>
        </form>
      )}
    </div>
  );
};
