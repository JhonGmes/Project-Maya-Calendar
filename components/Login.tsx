import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storage';
import { Lock, Mail, WifiOff, ArrowRight, Camera, Calendar, MapPin, CheckCircle, Clock, Search, MessageSquare, Bell, Shield, Cpu } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      StorageService.setLocalMode(false);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = () => {
    StorageService.setLocalMode(true);
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000510] text-white relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        
        {/* Background Ambient Effects (Mimicking the AI HUD reference) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#000510] to-[#000510]"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{
                    backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                 }}>
            </div>
        </div>

        {/* Main Container */}
        <div className="w-full h-screen flex overflow-hidden relative z-10">
            
            {/* Left Panel - Login Form */}
            <div className="w-full lg:w-[40%] relative z-20 flex flex-col justify-center px-8 md:px-24 bg-[#000510]/90 backdrop-blur-xl border-r border-cyan-900/20 shadow-[10px_0_50px_rgba(0,0,0,0.5)]">
                
                {/* Decor: Tech Elements */}
                <div className="absolute top-12 left-12 flex items-center gap-3 opacity-70">
                    <Shield className="w-6 h-6 text-cyan-500" />
                    <div className="h-4 w-[1px] bg-cyan-800"></div>
                    <div className="text-[10px] font-mono text-cyan-500 tracking-[0.2em] uppercase">Secure Access v3.1</div>
                </div>

                <div className="mb-10 mt-16 relative">
                   <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-blue-600 to-transparent opacity-50"></div>
                   <h1 className="text-5xl font-bold mb-2 tracking-tight text-white font-sans">Maya<span className="text-cyan-400">.AI</span></h1>
                   <h2 className="text-lg text-cyan-200/60 font-medium tracking-wide">Assistente de Produtividade Inteligente</h2>
                </div>

                {error && <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-200 text-sm rounded-lg backdrop-blur-sm flex items-center gap-2"><Lock size={14} /> {error}</div>}

                <form onSubmit={handleSupabaseLogin} className="space-y-6 max-w-md w-full relative z-20">
                    
                    {/* Identity Input */}
                    <div className="space-y-2 group">
                         <label className="text-[10px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors shadow-[0_0_8px_cyan]"></span> Identity Link
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-cyan-900 group-focus-within:text-cyan-400 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#050a14] border border-cyan-900/30 text-cyan-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-[#081020] focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-cyan-900/50 font-mono text-sm shadow-inner"
                                placeholder="usuario@sistema.ai"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Access Key Input */}
                    <div className="space-y-2 group">
                         <label className="text-[10px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors shadow-[0_0_8px_cyan]"></span> Security Key
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-cyan-900 group-focus-within:text-cyan-400 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#050a14] border border-cyan-900/30 text-cyan-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-[#081020] focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-cyan-900/50 font-mono text-sm shadow-inner"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 text-cyan-100 font-medium rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 flex items-center justify-center gap-3 group mt-4 relative overflow-hidden"
                    >
                        <span className="relative z-10 font-mono uppercase tracking-[0.15em] text-xs">Iniciar Sessão</span>
                        <div className="absolute inset-0 bg-cyan-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <ArrowRight className="relative z-10 w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {/* Offline Button */}
                     <button 
                        type="button"
                        onClick={handleOfflineLogin}
                        className="w-full py-3 bg-transparent border border-dashed border-gray-800 text-gray-500 rounded-xl hover:text-cyan-400 hover:border-cyan-800 transition-all flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest"
                    >
                        <WifiOff className="w-3 h-3" /> Modo Local (Offline)
                    </button>
                </form>

                 <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end opacity-40">
                    <div className="flex flex-col gap-1">
                        <div className="w-16 h-[2px] bg-cyan-800"></div>
                        <div className="text-[8px] font-mono text-cyan-600">SYS.RDY</div>
                    </div>
                    <Cpu className="text-cyan-800 w-6 h-6 animate-pulse" />
                </div>
            </div>

            {/* Right Panel - New Avatar & Orbit Animation */}
            <div className="hidden lg:flex w-[60%] relative bg-[#000510] items-center justify-center overflow-hidden">
                
                {/* Tech Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.05]"></div>
                </div>

                {/* Orbiting System */}
                <div className="relative w-[600px] h-[600px] flex items-center justify-center z-10">
                    
                    {/* Central Image - Maya Avatar */}
                    <div className="absolute z-20 w-[400px] h-[400px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-2xl"></div>
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI Avatar"
                            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] relative z-20"
                        />
                    </div>

                    {/* Orbit Ring 1 (Icons) */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin-slow">
                        {/* Define positions on the circle for icons. Icons counter-rotate to stay upright. */}
                        
                        {/* Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <Calendar size={20} />
                            </div>
                        </div>

                        {/* Right */}
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <MessageSquare size={20} />
                            </div>
                        </div>

                        {/* Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                            <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <CheckCircle size={20} />
                            </div>
                        </div>

                        {/* Left */}
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <Search size={20} />
                            </div>
                        </div>

                        {/* Diagonals (approximate positions for circle) */}
                        <div className="absolute top-[14.6%] right-[14.6%]">
                             <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <Camera size={20} />
                             </div>
                        </div>
                        <div className="absolute bottom-[14.6%] left-[14.6%]">
                             <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <Clock size={20} />
                             </div>
                        </div>
                        <div className="absolute top-[14.6%] left-[14.6%]">
                             <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <Bell size={20} />
                             </div>
                        </div>
                         <div className="absolute bottom-[14.6%] right-[14.6%]">
                             <div className="p-3 bg-[#000510] border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_cyan] animate-spin-reverse-slow">
                                <MapPin size={20} />
                             </div>
                        </div>
                    </div>

                    {/* Orbit Ring 2 (Decorative Lines) */}
                    <div className="absolute inset-10 rounded-full border border-dashed border-cyan-500/20 animate-spin-reverse-slow duration-[120s]"></div>
                    
                    {/* Orbit Ring 3 (Outer Glow) */}
                    <div className="absolute -inset-10 rounded-full border border-cyan-500/5 animate-pulse"></div>

                </div>
            </div>
        </div>
    </div>
  );
};