
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, Moon, Sun, Bell, User, FileText, Key, Eye, EyeOff, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSaveProfile }) => {
  const { generateReport, currentTeam } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
      const storedKey = localStorage.getItem('maya_api_key');
      if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveKey = () => {
      if (apiKey.trim()) {
          localStorage.setItem('maya_api_key', apiKey.trim());
          setKeySaved(true);
          setTimeout(() => setKeySaved(false), 2000);
      } else {
          localStorage.removeItem('maya_api_key');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 relative z-10 animate-slide-up overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold dark:text-white">Configurações</h2>
            <button onClick={onClose}><X className="dark:text-white" /></button>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-white/5 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400" />}
                </div>
                <div>
                    <h3 className="font-semibold dark:text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <p className="text-xs text-custom-caramel mt-1 font-bold uppercase">{currentTeam ? `Equipe: ${currentTeam.name}` : "Modo Pessoal"}</p>
                </div>
            </div>

            {/* API Key Section */}
            <div className="space-y-2 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 mb-2">
                    <Key size={16} />
                    <h4 className="text-sm font-bold uppercase tracking-wider">Configuração de IA</h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Cole sua Google Gemini API Key aqui para habilitar a inteligência da Maya.
                </p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type={showKey ? "text" : "password"} 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Cole sua chave AIza..."
                            className="w-full pl-3 pr-10 py-2 rounded-lg text-sm bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                        />
                        <button 
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
                        >
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                    <button 
                        onClick={handleSaveKey}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${keySaved ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    >
                        {keySaved ? 'Salvo!' : 'Salvar'}
                    </button>
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline inline-block mt-1">
                    Não tem uma chave? Gere aqui.
                </a>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Aparência</h4>
                <div className="flex gap-4">
                    <button 
                        onClick={() => onSaveProfile({ theme: 'light' })}
                        className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${profile.theme === 'light' ? 'border-custom-caramel bg-custom-cream' : 'border-gray-200 dark:border-white/10 opacity-60'}`}
                    >
                        <Sun size={24} className="text-orange-500" />
                        <span className="text-sm font-medium">Light</span>
                    </button>
                    <button 
                        onClick={() => onSaveProfile({ theme: 'dark' })}
                        className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${profile.theme === 'dark' ? 'border-purple-500 bg-zinc-800 text-white' : 'border-gray-200 dark:border-white/10 opacity-60'}`}
                    >
                        <Moon size={24} className="text-purple-400" />
                        <span className="text-sm font-medium">Dark</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Preferências</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Bell size={20} className="text-gray-500" />
                        <span className="text-sm font-medium dark:text-white">Notificações</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={profile.notifications} 
                            onChange={(e) => onSaveProfile({ notifications: e.target.checked })}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-custom-soil"></div>
                    </label>
                </div>
            </div>

            {/* Weekly Report Trigger */}
             <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
                <button 
                    onClick={() => { generateReport(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium text-sm"
                >
                    <FileText size={18} />
                    Gerar Relatório Semanal (IA)
                </button>
            </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">Maya Calendar AI v1.1.0</p>
        </div>

      </div>
    </div>
  );
};
