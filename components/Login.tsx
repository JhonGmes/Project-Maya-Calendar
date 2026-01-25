import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storage';
import { Lock, Mail, WifiOff, ArrowRight, Camera, Calendar, MapPin, CheckCircle, Clock, Search, MessageSquare, Bell, Shield, Cpu, Square, CheckSquare as CheckSquareIcon } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

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
        
        {/* Background Ambient Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#000510] to-[#000510]"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        </div>

        {/* Main Container */}
        <div className="w-full h-screen flex overflow-hidden relative z-10">
            
            {/* Left Panel - Login Form */}
            <div className="w-full lg:w-[40%] relative z-20 flex flex-col justify-center px-8 md:px-24 bg-[#000510] border-r border-cyan-900/20 shadow-[10px_0_50px_rgba(0,0,0,0.5)]">
                
                {/* Header System Tag */}
                <div className="absolute top-12 left-12 flex items-center gap-4 opacity-80">
                    <div className="p-2 border border-cyan-500/30 rounded-lg bg-cyan-950/30">
                        <Cpu className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex flex-col">
                        <div className="h-[1px] w-full bg-cyan-800 mb-1"></div>
                        <div className="text-[10px] font-mono text-cyan-500 tracking-[0.3em] uppercase">SYSTEM V2.0</div>
                    </div>
                </div>

                <div className="mb-10 mt-12 relative">
                   <div className="absolute -left-6 top-2 bottom-2 w-1 bg-cyan-500 rounded-full"></div>
                   <h1 className="text-5xl font-bold mb-4 tracking-tight text-white font-sans">Maya Calendar<span className="text-cyan-400">.AI</span></h1>
                   <h2 className="text-xl text-white font-medium tracking-wide">Acessar Sistema</h2>
                </div>

                {error && <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-200 text-sm rounded-lg backdrop-blur-sm flex items-center gap-2 animate-fade-in"><Lock size={14} /> {error}</div>}

                <form onSubmit={handleSupabaseLogin} className="space-y-5 max-w-md w-full relative z-20">
                    
                    {/* Identity Input */}
                    <div className="space-y-2 group">
                         <label className="text-[10px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400"></span> Identity (Email)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-cyan-900 group-focus-within:text-cyan-500 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#020610] border border-cyan-900/30 text-cyan-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-[#050a15] transition-all placeholder:text-cyan-900/30 font-mono text-sm"
                                placeholder="seu@email.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Access Key Input */}
                    <div className="space-y-2 group">
                         <label className="text-[10px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400"></span> Access Key (Senha)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-cyan-900 group-focus-within:text-cyan-500 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#020610] border border-cyan-900/30 text-cyan-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-[#050a15] transition-all placeholder:text-cyan-900/30 font-mono text-sm"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe ? (
                            <CheckSquareIcon className="w-5 h-5 text-cyan-500" />
                        ) : (
                            <Square className="w-5 h-5 text-cyan-900" />
                        )}
                        <span className="text-[10px] uppercase tracking-widest text-cyan-700 font-bold">Lembrar meu email</span>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#020817] border border-cyan-500/50 text-white font-bold rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 flex items-center justify-center gap-3 group mt-6 relative overflow-hidden"
                    >
                        <span className="relative z-10 font-mono uppercase tracking-[0.15em] text-xs">Entrar no Sistema</span>
                        <ArrowRight className="relative z-10 w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {/* Offline Button */}
                     <button 
                        type="button"
                        onClick={handleOfflineLogin}
                        className="w-full py-3 bg-transparent border border-dashed border-gray-800 text-gray-600 rounded-xl hover:text-cyan-600 hover:border-cyan-900 transition-all flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest mt-2"
                    >
                        <WifiOff className="w-3 h-3" /> Entrar Offline (Modo Local)
                    </button>

                    <div className="w-full flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-900">
                         <span className="text-cyan-700 text-xs">Não possui acesso?</span>
                         <button className="text-cyan-400 text-xs font-bold hover:underline flex items-center gap-1">
                            Criar uma conta <ArrowRight size={12} />
                         </button>
                    </div>
                </form>

                 <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center opacity-30">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] w-12 bg-cyan-800"></div>
                        <div className="text-[9px] font-mono text-cyan-600 uppercase tracking-[0.3em]">Secure Connection</div>
                        <div className="h-[1px] w-12 bg-cyan-800"></div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Avatar & Orbit Animation */}
            <div className="hidden lg:flex w-[60%] relative bg-[#000510] items-center justify-center overflow-hidden">
                
                {/* Tech Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.03]"></div>
                    {/* Concentric Circles Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-cyan-900/10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-cyan-900/10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-cyan-900/5"></div>
                </div>

                {/* Orbiting System */}
                <div className="relative w-[600px] h-[600px] flex items-center justify-center z-10">
                    
                    {/* Central Image - Maya Avatar */}
                    <div className="absolute z-20 w-[450px] h-[600px] flex items-center justify-center -translate-y-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl transform scale-75"></div>
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI Avatar"
                            className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-20"
                        />
                    </div>

                    {/* Orbit Ring 1 (Icons) */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin-slow">
                        {/* Define positions on the circle for icons. Icons counter-rotate to stay upright. */}
                        
                        {/* Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <Calendar size={20} />
                            </div>
                        </div>

                        {/* Right */}
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <CheckCircle size={20} />
                            </div>
                        </div>

                        {/* Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Left */}
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <Search size={20} />
                            </div>
                        </div>

                        {/* Diagonals */}
                        <div className="absolute top-[14.6%] right-[14.6%]">
                             <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <MessageSquare size={20} />
                             </div>
                        </div>
                        <div className="absolute bottom-[14.6%] left-[14.6%]">
                             <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <Bell size={20} />
                             </div>
                        </div>
                         <div className="absolute bottom-[14.6%] right-[14.6%]">
                             <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-spin-reverse-slow">
                                <MapPin size={20} />
                             </div>
                        </div>
                    </div>

                    {/* Orbit Ring 2 (Dashed) */}
                    <div className="absolute inset-12 rounded-full border border-dashed border-cyan-500/20 animate-spin-reverse-slow duration-[100s]"></div>
                </div>
            </div>
        </div>
    </div>
  );
};