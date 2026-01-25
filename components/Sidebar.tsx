import React from 'react';
import { ViewMode } from '../types';
import { Calendar, CheckSquare, List, Sun, Settings, LogOut, LayoutDashboard, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, onOpenSettings, isOpenMobile, setIsOpenMobile }) => {
  const menuItems = [
    { id: 'day', label: 'Hoje', icon: LayoutDashboard },
    { id: 'week', label: 'Semana', icon: List }, // Simplified as list for now
    { id: 'month', label: 'Mês', icon: Calendar },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'routine', label: 'Rotina', icon: Sun },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpenMobile(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border-r border-white/20 dark:border-white/5 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-serif font-bold text-custom-soil dark:text-white">Maya<span className="text-custom-caramel">.AI</span></h1>
            <button onClick={() => setIsOpenMobile(false)} className="md:hidden text-gray-500">
              <X size={24} />
            </button>
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
            <button 
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};