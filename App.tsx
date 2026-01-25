import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarGrid } from './components/CalendarGrid';
import { MayaModal } from './components/MayaModal';
import { EventModal } from './components/EventModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskView } from './components/TaskView';
import { RoutineView } from './components/RoutineView';
import { Login } from './components/Login';
import { ToastContainer, ToastMessage } from './components/Toast';
import { StorageService } from './services/storage';
import { supabase } from './services/supabaseClient'; 
import { CalendarEvent, Task, ViewMode, UserProfile } from './types';
import { Menu, Plus, Sparkles } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('day');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [isMayaOpen, setMayaOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (StorageService.isLocalMode()) { setIsAuthenticated(true); return; }
    if (!supabase) return;
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) setIsAuthenticated(true);
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (StorageService.isLocalMode()) return;
      if (event === 'SIGNED_OUT') { setIsAuthenticated(false); setEvents([]); setTasks([]); setProfile(null); } 
      else if (session) setIsAuthenticated(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      try {
        setEvents(await StorageService.getEvents());
        setTasks(await StorageService.getTasks());
        const p = await StorageService.getProfile();
        setProfile(p);
        if (p.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch (err) {}
    };
    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !profile?.notifications) return;
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach(event => {
        if (event.completed) return;
        const diff = differenceInMinutes(event.start, now);
        if (diff > 0 && diff <= 15) {
            const toastId = `notify-${event.id}-${Math.floor(diff/5)}`; 
            if (!toasts.find(t => t.id === toastId)) {
                addToast({ id: toastId, title: 'Evento Próximo', message: `${event.title} em ${diff} min.`, type: 'info' });
            }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [events, isAuthenticated, profile, toasts]);

  const addToast = (toast: ToastMessage) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 5000);
  };

  const handleAddTask = async (title: string) => {
      const newTask = { id: StorageService.generateId(), title, completed: false, priority: 'medium', dueDate: new Date() } as Task;
      await StorageService.saveTask(newTask);
      setTasks(prev => [...prev, newTask]);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
      const newEvent = { ...eventData, id: eventData.id || StorageService.generateId(), start: eventData.start || new Date(), end: eventData.end || new Date(), color: eventData.color || 'blue', category: eventData.category || 'work' } as CalendarEvent;
      await StorageService.saveEvent(newEvent);
      setEvents(await StorageService.getEvents());
      setEventModalOpen(false);
      setSelectedEvent(null);
  };

  const handleAIAction = async (action: string, data: any) => {
    if (action === 'create_event' && data) {
        const start = data.startTime ? new Date(data.startTime) : new Date();
        const end = data.endTime ? new Date(data.endTime) : new Date(start.getTime() + 3600000);
        await handleSaveEvent({ title: data.title, start, end, category: data.category, description: 'Via IA' });
    }
    if (action === 'create_task' && data) await handleAddTask(data.title);
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-custom-cream dark:bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-mesh-light dark:bg-mesh-dark opacity-40 pointer-events-none"></div>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={() => setIsAuthenticated(false)} onOpenSettings={() => setSettingsOpen(true)} isOpenMobile={isOpenMobile} setIsOpenMobile={setIsOpenMobile} />
      <main className="flex-1 flex flex-col relative h-full overflow-hidden z-10 md:py-4 md:pr-4">
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setIsOpenMobile(true)}><Menu className="text-gray-600 dark:text-white" /></button>
          <span className="font-serif font-bold text-lg dark:text-white">Maya</span><div className="w-6" />
        </div>
        <div className="flex-1 overflow-hidden relative bg-white/60 dark:bg-zinc-900/60 md:rounded-[2rem] shadow-sm border border-white/40 dark:border-white/5 backdrop-blur-xl">
          {currentView === 'day' && <Dashboard events={events} tasks={tasks} onEventClick={(e) => { setSelectedEvent(e); setEventModalOpen(true); }} onAddTask={handleAddTask} onToggleTask={() => {}} onConvertTaskToEvent={() => {}} />}
          {currentView === 'month' && <CalendarGrid events={events} onDateClick={(d) => { setSelectedDate(d); setEventModalOpen(true); }} onEventClick={(e) => { setSelectedEvent(e); setEventModalOpen(true); }} />}
          {currentView === 'tasks' && <TaskView tasks={tasks} onAddTask={handleAddTask} onToggleTask={() => {}} onConvertTaskToEvent={() => {}} />}
          {currentView === 'routine' && <RoutineView events={events} onAddRoutine={() => setEventModalOpen(true)} />}
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col gap-4">
          <button onClick={() => setMayaOpen(true)} className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"><Sparkles size={24} /></button>
          <button onClick={() => { setSelectedEvent(null); setEventModalOpen(true); }} className="w-14 h-14 rounded-full bg-custom-soil text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"><Plus size={28} /></button>
        </div>
      </main>
      <MayaModal isOpen={isMayaOpen} onClose={() => setMayaOpen(false)} onAction={handleAIAction} allTasks={tasks} allEvents={events} />
      <EventModal isOpen={isEventModalOpen} onClose={() => setEventModalOpen(false)} onSave={handleSaveEvent} initialData={selectedEvent} initialDate={selectedDate} />
      {profile && <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} profile={profile} onSaveProfile={() => {}} />}
    </div>
  );
};
export default App;