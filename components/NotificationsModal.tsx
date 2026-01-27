
import React from 'react';
import { X, Bell, Trash2, Check, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, isNotificationsOpen } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 relative z-10 animate-slide-up overflow-hidden max-h-[80vh] flex flex-col">
        
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                    <Bell size={20} />
                </div>
                <h2 className="text-xl font-serif font-bold dark:text-white">Notificações</h2>
            </div>
            <button onClick={onClose}><X className="dark:text-white" /></button>
        </div>

        {notifications.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {notifications.map((notification) => (
                    <div 
                        key={notification.id} 
                        className={`p-4 rounded-2xl border transition-all flex items-start gap-3 group
                            ${notification.read 
                                ? 'bg-gray-50 dark:bg-white/5 border-transparent opacity-60' 
                                : 'bg-white dark:bg-zinc-800 border-purple-100 dark:border-white/10 shadow-sm'}
                        `}
                    >
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                            <p className={`text-sm ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>
                                {notification.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block capitalize">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                        </div>
                        
                        {!notification.read && (
                            <button 
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Marcar como lida"
                            >
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-50">
                <Bell size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tudo limpo por aqui.</p>
            </div>
        )}

        {notifications.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 flex justify-end flex-shrink-0">
                <button 
                    onClick={clearAllNotifications}
                    className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
                >
                    <Trash2 size={14} /> Limpar tudo
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
