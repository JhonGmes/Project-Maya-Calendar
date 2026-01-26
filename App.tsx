
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarGrid } from './components/CalendarGrid';
import { TaskView } from './components/TaskView';
import { RoutineView } from './components/RoutineView';
import { WeeklyView } from './components/WeeklyView'; 
import { Login } from './components/Login';
import { MayaModal } from './components/MayaModal';
import { EventModal } from './components/EventModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import { ViewMode, CalendarEvent } from './types';
import { Menu, Plus, Sparkles, Loader2 } from 'lucide-react';

// Wrapper component to use the context
const AppContent = () => {
  const { user, loading: authLoading, signOut, isLocalMode } = useAuth();
  const { 
    screen, setScreen, 
    isMayaOpen, setMayaOpen,
    isMobileMenuOpen, setMobileMenuOpen,
    tasks, events, profile,
    addTask, updateTask, addEvent, updateProfile,
    toasts, addToast
  } = useApp();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Router Logic
  if (authLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-custom-cream dark:bg-[#000510] text-custom-soil dark:text-white">
              <Loader2 className="animate-spin" size={40} />
          </div>
      );
  }

  if (!user && !isLocalMode) {
      return <Login />;
  }

  // Handle Logic for Modal Triggers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventModalOpen(true);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleAIAction = async (action: string, data: any) => {
    if (action === 'create_event' && data) {
        await addEvent({ 
            title: data.title, 
            start: data.startTime ? new Date(data.startTime) : new Date(), 
            end: data.endTime ? new Date(data.endTime) : new Date(),
            category: data.category,
            description: 'Via IA'
        });
    }
    if (action === 'create_task' && data) await addTask(data.title);
    if (action === 'change_screen' && data) setScreen(data as ViewMode);
  };

  const renderView = () => {
    switch (screen) {
      case 'day':
        return <Dashboard 
                  events={events} 
                  tasks={tasks} 
                  onEventClick={handleEventClick} 
                  onAddTask={addTask} 
                  onToggleTask={(id) => { const t = tasks.find(x => x.id === id); if(t) updateTask({...t, completed: !t.completed}); }} 
                  onConvertTaskToEvent={() => {}} 
               />;
      case 'month':
        return <CalendarGrid 
                  events={events} 
                  onDateClick={handleDateClick} 
                  onEventClick={handleEventClick} 
               />;
      case 'tasks':
        return <TaskView 
                  tasks={tasks} 
                  onAddTask={addTask} 
                  onToggleTask={(id) => { const t = tasks.find(x => x.id === id); if(t) updateTask({...t, completed: !t.completed}); }} 
                  onConvertTaskToEvent={() => {}} 
               />;
      case 'routine':
        return <RoutineView events={events} onAddRoutine={() => setEventModalOpen(true)} />;
      case 'week': 
        return <WeeklyView 
                  tasks={tasks}
                  onToggleTask={(id) => { const t = tasks.find(x => x.id === id); if(t) updateTask({...t, completed: !t.completed}); }} 
               />;
      default:
        return <Dashboard events={events} tasks={tasks} onEventClick={handleEventClick} onAddTask={addTask} onToggleTask={() => {}} onConvertTaskToEvent={() => {}} />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-custom-cream dark:bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-mesh-light dark:bg-mesh-dark opacity-40 pointer-events-none"></div>
      
      <ToastContainer toasts={toasts} onRemove={() => {}} />

      <Sidebar 
        currentView={screen as ViewMode} 
        onChangeView={(v) => setScreen(v)} 
        onLogout={signOut} 
        onOpenSettings={handleOpenSettings}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col relative h-full overflow-hidden z-10 md:py-4 md:pr-4">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setMobileMenuOpen(true)}><Menu className="text-gray-600 dark:text-white" /></button>
          <span className="font-serif font-bold text-lg dark:text-white">Maya</span><div className="w-6" />
        </div>

        {/* View Container */}
        <div className="flex-1 overflow-hidden relative bg-white/60 dark:bg-zinc-900/60 md:rounded-[2rem] shadow-sm border border-white/40 dark:border-white/5 backdrop-blur-xl">
            {renderView()}
        </div>

        {/* FABs */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex flex-col gap-3 md:gap-4">
          <button onClick={() => setMayaOpen(true)} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-90"><Sparkles size={20} className="md:w-6 md:h-6" /></button>
          <button onClick={() => { setSelectedEvent(null); setEventModalOpen(true); }} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-custom-soil text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-90"><Plus size={24} className="md:w-7 md:h-7" /></button>
        </div>
      </main>

      {/* Modals */}
      <MayaModal isOpen={isMayaOpen} onClose={() => setMayaOpen(false)} onAction={handleAIAction} allTasks={tasks} allEvents={events} />
      
      <EventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setEventModalOpen(false)} 
        onSave={async (e) => { await addEvent(e); setEventModalOpen(false); }} 
        initialData={selectedEvent} 
        initialDate={selectedDate}
        existingEvents={events}
        userProfile={profile}
      />
      
      {profile && <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} profile={profile} onSaveProfile={updateProfile} />}
    </div>
  );
};

// Main Entry Point
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
