
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, Moon, Sun, Bell, User, FileText, Key, Eye, EyeOff, CheckCircle, LogOut, CreditCard, Zap, ShieldCheck, Save, Camera, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getPlanName, PLAN_CONFIG } from '../utils/plans';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSaveProfile }) => {
  const { generateReport, currentTeam, aiUsage, iaHistory } = useApp();
  const { signOut } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [isValidFormat, setIsValidFormat] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'audit'>('general');

  // Local state for profile editing
  const [editForm, setEditForm] = useState({
      name: '',
      phone: '',
      avatarUrl: ''
  });

  useEffect(() => {
      if (profile) {
          setEditForm({
              name: profile.name || '',
              phone: profile.phone || '',
              avatarUrl: profile.avatarUrl || ''
          });
      }
  }, [profile]);

  useEffect(() => {
      const storedKey = localStorage.getItem('maya_api_key');
      if (storedKey) {
          setApiKey(storedKey);
          setIsValidFormat(storedKey.startsWith('AIza'));
      }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      setApiKey(val);
      if (val.length > 0 && !val.startsWith('AIza')) {
          setIsValidFormat(false);
      } else {
          setIsValidFormat(true);
      }
  };

  const handleSaveKey = () => {
      if (apiKey.trim()) {
          localStorage.setItem('maya_api_key', apiKey.trim());
          setKeySaved(true);
          setTimeout(() => setKeySaved(false), 2000);
      } else {
          localStorage.removeItem('maya_api_key');
      }
  };

  const handleSaveProfile = () => {
      onSaveProfile({
          name: editForm.name,
          phone: editForm.phone,
          avatarUrl: editForm.avatarUrl
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-2xl font-serif font-bold dark:text-white">Configurações</h2>
            <button onClick={onClose}><X className="dark:text-white" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-gray-100 dark:border-white/5">
            <button 
                onClick={() => setActiveTab('general')}
                className={`py-4 text-sm font-medium transition-colors relative ${activeTab === 'general' ? 'text-custom-soil dark:text-white' : 'text-gray-400'}`}
            >
                Geral
                {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-custom-soil dark:bg-white rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('audit')}
                className={`py-4 text-sm font-medium transition-colors relative ${activeTab === 'audit' ? 'text-custom-soil dark:text-white' : 'text-gray-400'}`}
            >
                Auditoria & Logs
                {activeTab === 'audit' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-custom-soil dark:bg-white rounded-t-full"></span>}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-black/20">
            {activeTab === 'general' ? (
                <div className="space-y-6">
                    {/* User Profile Editing */}
                    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 rounded-2xl p-5">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <User size={18} /> Perfil do Usuário
                        </h3>
                        
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-700 shadow-md relative group">
                                    {editForm.avatarUrl ? (
                                        <img src={editForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="w-full">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">URL da Foto</label>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1.5">
                                        <Camera size={14} className="text-gray-400" />
                                        <input 
                                            type="text"
                                            value={editForm.avatarUrl}
                                            onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                                            placeholder="https://..."
                                            className="bg-transparent w-full text-xs outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Inputs Section */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Nome Completo</label>
                                    <input 
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-custom-caramel dark:text-white transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                            <Mail size={12} /> Email (Login)
                                        </label>
                                        <input 
                                            type="text"
                                            value={profile.email}
                                            disabled
                                            className="w-full bg-gray-100 dark:bg-white/5 border border-transparent rounded-xl px-4 py-2.5 outline-none text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                            <Phone size={12} /> Telefone
                                        </label>
                                        <input 
                                            type="text"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-custom-caramel dark:text-white transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveProfile}
                                    className="w-full md:w-auto px-6 py-2 bg-custom-soil text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-custom-caramel transition-colors shadow-sm ml-auto"
                                >
                                    <Save size={16} /> Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plan & Usage */}
                    <div className="p-4 bg-gradient-to-r from-gray-100 to-white dark:from-white/5 dark:to-white/10 rounded-2xl border border-gray-200 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-custom-soil dark:text-white">
                                <CreditCard size={16} />
                                <h4 className="text-sm font-bold uppercase tracking-wider">Plano Atual</h4>
                            </div>
                            <span className="px-3 py-1 bg-custom-soil text-white text-xs font-bold rounded-full">
                                {getPlanName(profile.plan)}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Sugestões de IA (Hoje)</span>
                                <span>{aiUsage?.aiSuggestionsToday || 0} / {PLAN_CONFIG[profile.plan].aiSuggestionsPerDay}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-black/30 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, ((aiUsage?.aiSuggestionsToday || 0) / PLAN_CONFIG[profile.plan].aiSuggestionsPerDay) * 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {profile.plan === 'FREE' && (
                            <button 
                                onClick={() => onSaveProfile({ plan: 'PRO' })} 
                                className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Zap size={14} /> Fazer Upgrade para PRO
                            </button>
                        )}
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-1">
                            <Key size={16} />
                            <h4 className="text-sm font-bold">Chave de API (Google Gemini)</h4>
                        </div>
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <input 
                                    type={showKey ? "text" : "password"} 
                                    value={apiKey}
                                    onChange={handleApiKeyChange}
                                    placeholder="AIza..."
                                    className={`w-full pl-3 pr-10 py-2 rounded-lg text-sm bg-white dark:bg-black/30 border focus:ring-2 outline-none dark:text-white ${!isValidFormat && apiKey ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-custom-caramel'}`}
                                />
                                <button 
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-custom-caramel"
                                >
                                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <button 
                                onClick={handleSaveKey}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${keySaved ? 'bg-green-500 text-white' : 'bg-custom-soil text-white hover:bg-custom-caramel'}`}
                            >
                                {keySaved ? <CheckCircle size={14} /> : 'Salvar'}
                            </button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Aparência</h4>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => onSaveProfile({ theme: 'light' })}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${profile.theme === 'light' ? 'border-custom-caramel bg-custom-cream text-custom-soil' : 'border-gray-200 dark:border-white/10 opacity-60 dark:text-gray-400'}`}
                            >
                                <Sun size={18} /> Light
                            </button>
                            <button 
                                onClick={() => onSaveProfile({ theme: 'dark' })}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${profile.theme === 'dark' ? 'border-purple-500 bg-zinc-800 text-white' : 'border-gray-200 dark:border-white/10 opacity-60 dark:text-gray-400'}`}
                            >
                                <Moon size={18} /> Dark
                            </button>
                        </div>
                    </div>

                    {/* Notifications Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-gray-500" />
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

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button 
                            onClick={() => { generateReport(); onClose(); }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium text-sm"
                        >
                            <FileText size={18} />
                            Gerar Relatório Semanal (IA)
                        </button>

                        <button 
                            onClick={() => { onClose(); signOut(); }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium text-sm"
                        >
                            <LogOut size={18} />
                            Sair da Conta
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <ShieldCheck size={20} className="text-green-500" /> Registro de Auditoria
                        </h3>
                        <span className="text-xs text-gray-400">Últimas 50 ações</span>
                    </div>
                    
                    <div className="space-y-3">
                        {iaHistory.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">Nenhuma ação registrada ainda.</p>
                        ) : (
                            [...iaHistory].reverse().map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex items-start gap-3">
                                    <div className={`mt-1 p-1.5 rounded-full ${item.source === 'ai' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {item.source === 'ai' ? <Zap size={12} /> : <User size={12} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                                {item.action.type.replace('_', ' ')}
                                            </p>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {format(new Date(item.timestamp), 'dd/MM HH:mm', { locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-sm dark:text-gray-300">
                                            {item.source === 'ai' ? 'Sugestão da IA' : 'Executado pelo Usuário'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {activeTab === 'general' && (
            <div className="p-4 border-t border-gray-100 dark:border-white/5 text-center bg-white dark:bg-zinc-900">
                <p className="text-xs text-gray-400">Maya Calendar AI v1.2.0 • {profile.plan}</p>
            </div>
        )}

      </div>
    </div>
  );
};
