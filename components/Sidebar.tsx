
import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types';
import { Calendar, CheckSquare, List, Sun, Settings, LogOut, LayoutDashboard, X, Bell, Wifi, WifiOff, Cloud, Database, BarChart2, Users, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, onOpenSettings, isOpenMobile, setIsOpenMobile }) => {
  const { unreadNotifications, isSupabaseConnected, setNotificationsOpen, teams, currentTeam, switchTeam } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const menuItems = [
    { id: 'day', label: 'Hoje', icon: LayoutDashboard },
    { id: 'week', label: 'Semana', icon: List }, 
    { id: 'month', label: 'Mês', icon: Calendar },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'routine', label: 'Rotina', icon: Sun },
    { id: 'analytics', label: 'Gráficos', icon: BarChart2 }, // Phase 6
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpenMobile(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border-r border-white/20 dark:border-white/5 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col justify-between
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-2xl font-serif font-bold text-custom-soil dark:text-white leading-none">Maya<span className="text-custom-caramel">.AI</span></h1>
                <p className="text-xs font-mono text-gray-400 mt-1">{format(currentTime, 'HH:mm:ss')}</p>
            </div>
            <button onClick={() => setIsOpenMobile(false)} className="md:hidden text-gray-500">
              <X size={24} />
            </button>
          </div>

          {/* Phase 7: Team Switcher */}
          <div className="mb-6">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">Contexto</p>
              <div className="space-y-1">
                  <button 
                    onClick={() => switchTeam(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!currentTeam ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                      <Users size={16} /> Pessoal
                  </button>
                  {teams.map(team => (
                      <button 
                        key={team.id}
                        onClick={() => switchTeam(team.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${currentTeam?.id === team.id ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                          <Briefcase size={16} /> {team.name}
                      </button>
                  ))}
              </div>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onChangeView(item.id as ViewMode); setIsOpenMobile(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${currentView === item.id 
                    ? 'bg-custom-soil text-white shadow-lg shadow-custom-soil/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-custom-soil dark:hover:text-white'}
                `}
              >
                <item.icon size={20} className={`${currentView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-custom-soil dark:group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-2">
             {/* Notifications Trigger (Phase 18) */}
             <button 
              onClick={() => { setNotificationsOpen(true); setIsOpenMobile(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors relative"
            >
              <Bell size={20} />
              <span>Notificações</span>
              {unreadNotifications > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {unreadNotifications}
                  </span>
              )}
            </button>

            <button 
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
          </div>
        </div>

        {/* Status Footer */}
        <div className="p-4 bg-gray-50/50 dark:bg-black/20 border-t border-gray-200 dark:border-white/5">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status da Rede</p>
                    <p className={`text-xs font-medium flex items-center gap-1 ${isSupabaseConnected ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {isSupabaseConnected ? (
                            <><Cloud size={10} /> Conectado (Supabase)</>
                        ) : (
                            <><WifiOff size={10} /> Modo Local</>
                        )}
                    </p>
                </div>
                {isSupabaseConnected && <Database size={14} className="text-gray-300 dark:text-gray-600" />}
            </div>
        </div>
      </aside>
    </>
  );
};
