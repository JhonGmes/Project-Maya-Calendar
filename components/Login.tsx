import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storage';
import { Lock, Mail, WifiOff, ArrowRight, Calendar, CheckCircle, Clock, Search, MapPin, Bell, Video, Cpu, Square, CheckSquare as CheckSquareIcon } from 'lucide-react';

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#000510] text-white relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        
        {/* Background Ambient Effects (Global) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#000510] to-[#000510]"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        </div>

        {/* Main Container */}
        <div className="w-full h-[100dvh] flex overflow-hidden relative z-10">
            
            {/* Left Panel - Login Form */}
            {/* Mobile: Full width. Tablet (md): 50%. Desktop (lg): 40% */}
            <div className="w-full md:w-[50%] lg:w-[40%] relative z-20 flex flex-col justify-center px-6 sm:px-12 md:px-10 lg:px-16 xl:px-24 bg-[#000510] border-r border-cyan-900/20 shadow-[10px_0_50px_rgba(0,0,0,0.5)]">
                
                {/* Mobile-Only Ambient Background */}
                <div className="absolute inset-0 md:hidden overflow-hidden pointer-events-none">
                     <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-[60px]"></div>
                     <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-600/10 rounded-full blur-[60px]"></div>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.03]"></div>
                </div>

                {/* Header System Tag - Adjusted for Mobile */}
                <div className="absolute top-6 left-6 flex items-center gap-3 opacity-80">
                    <div className="p-1.5 border border-cyan-500/30 rounded-lg bg-cyan-950/30">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex flex-col">
                        <div className="h-[1px] w-full bg-cyan-800 mb-1"></div>
                        <div className="text-[8px] font-mono text-cyan-500 tracking-[0.3em] uppercase">SYSTEM V2.0</div>
                    </div>
                </div>

                {/* Mobile Top Avatar "Free Form" */}
                <div className="md:hidden flex justify-center mb-4 mt-12 relative animate-fade-in">
                    <div className="relative w-32 h-44 flex items-center justify-center">
                        {/* Subtle glow behind the character */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/10 blur-[40px] rounded-full"></div>
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI"
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        />
                    </div>
                </div>

                <div className="mb-6 relative text-center md:text-left">
                   <div className="absolute -left-6 top-1.5 bottom-1.5 w-1 bg-cyan-500 rounded-full hidden md:block"></div>
                   {/* Reduced Text Size */}
                   <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 tracking-tight text-white font-sans">Maya Calendar<span className="text-cyan-400">.AI</span></h1>
                   <h2 className="text-sm md:text-base text-gray-400 font-medium tracking-wide">Acessar Sistema</h2>
                </div>

                {error && <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 text-red-200 text-xs rounded-lg backdrop-blur-sm flex items-center gap-2 animate-fade-in"><Lock size={12} /> {error}</div>}

                <form onSubmit={handleSupabaseLogin} className="space-y-3.5 max-w-sm w-full relative z-20 mx-auto md:mx-0">
                    
                    {/* Identity Input */}
                    <div className="space-y-1.5 group text-left">
                         <label className="text-[9px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1 h-1 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400"></span> Identity (Email)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-cyan-900 group-focus-within:text-cyan-500 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#020610] border border-cyan-900/30 text-cyan-100 rounded-lg py-3 pl-10 pr-3 focus:outline-none focus:border-cyan-500/50 focus:bg-[#050a15] transition-all placeholder:text-cyan-900/30 font-mono text-xs md:text-sm shadow-inner shadow-black/50"
                                placeholder="seu@email.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Access Key Input */}
                    <div className="space-y-1.5 group text-left">
                         <label className="text-[9px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1 h-1 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400"></span> Access Key (Senha)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-cyan-900 group-focus-within:text-cyan-500 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#020610] border border-cyan-900/30 text-cyan-100 rounded-lg py-3 pl-10 pr-3 focus:outline-none focus:border-cyan-500/50 focus:bg-[#050a15] transition-all placeholder:text-cyan-900/30 font-mono text-xs md:text-sm shadow-inner shadow-black/50"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-center gap-2 cursor-pointer mt-1" onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe ? (
                            <CheckSquareIcon className="w-3.5 h-3.5 text-cyan-500" />
                        ) : (
                            <Square className="w-3.5 h-3.5 text-cyan-900" />
                        )}
                        <span className="text-[9px] uppercase tracking-widest text-cyan-700 font-bold">Lembrar meu email</span>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-[#020817] border border-cyan-500/50 text-white font-bold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 flex items-center justify-center gap-3 group mt-4 relative overflow-hidden active:scale-[0.98]"
                    >
                        <span className="relative z-10 font-mono uppercase tracking-[0.15em] text-[10px]">Entrar no Sistema</span>
                        <ArrowRight className="relative z-10 w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {/* Offline Button */}
                     <button 
                        type="button"
                        onClick={handleOfflineLogin}
                        className="w-full py-2.5 bg-transparent border border-dashed border-gray-800 text-gray-600 rounded-lg hover:text-cyan-600 hover:border-cyan-900 transition-all flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-widest mt-2 active:bg-gray-900/50"
                    >
                        <WifiOff className="w-3 h-3" /> Entrar Offline (Modo Local)
                    </button>

                    <div className="w-full flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-900/50">
                         <span className="text-cyan-800 text-[10px]">Não possui acesso?</span>
                         <button className="text-cyan-500 text-[10px] font-bold hover:underline flex items-center gap-1">
                            Criar uma conta <ArrowRight size={10} />
                         </button>
                    </div>
                </form>

                 <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center opacity-30">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-6 md:w-8 bg-cyan-800"></div>
                        <div className="text-[7px] md:text-[8px] font-mono text-cyan-600 uppercase tracking-[0.3em]">Secure Connection</div>
                        <div className="h-[1px] w-6 md:w-8 bg-cyan-800"></div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Avatar & Orbit Animation */}
            {/* Enabled for Tablet (md) and Desktop (lg) */}
            <div className="hidden md:flex md:w-[50%] lg:w-[60%] relative bg-[#000510] items-center justify-center overflow-hidden">
                
                {/* Tech Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[500px] lg:w-[600px] h-[400px] md:h-[500px] lg:h-[600px] bg-blue-600/5 rounded-full blur-[80px] md:blur-[100px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.02]"></div>
                    {/* Concentric Circles Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[450px] lg:w-[550px] h-[350px] md:h-[450px] lg:h-[550px] rounded-full border border-cyan-900/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[600px] lg:w-[750px] h-[500px] md:h-[600px] lg:h-[750px] rounded-full border border-cyan-900/10"></div>
                </div>

                {/* Orbiting System - Scaled based on device */}
                <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[520px] lg:h-[520px] flex items-center justify-center z-10">
                    
                    {/* Central Image - Maya Avatar */}
                    <div className="absolute z-20 w-[180px] md:w-[240px] lg:w-[300px] h-[250px] md:h-[350px] lg:h-[420px] flex items-center justify-center -translate-y-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-full blur-2xl transform scale-75"></div>
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI Avatar"
                            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] relative z-20"
                        />
                    </div>

                    {/* Orbit Ring (Icons) */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin-slow">
                        
                        {/* 1. Top - Video (Camera) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Video size={20} />
                            </div>
                        </div>

                        {/* 2. Top Right - Calendar */}
                        <div className="absolute top-[14.6%] right-[14.6%] translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Calendar size={20} />
                            </div>
                        </div>

                        {/* 3. Right - CheckCircle */}
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <CheckCircle size={20} />
                            </div>
                        </div>

                        {/* 4. Bottom Right - MapPin */}
                        <div className="absolute bottom-[14.6%] right-[14.6%] translate-x-1/2 translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <MapPin size={20} />
                            </div>
                        </div>

                        {/* 5. Bottom - Clock */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* 6. Bottom Left - Bell */}
                        <div className="absolute bottom-[14.6%] left-[14.6%] -translate-x-1/2 translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Bell size={20} />
                            </div>
                        </div>

                        {/* 7. Left - Search */}
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Search size={20} />
                            </div>
                        </div>

                        {/* 8. Top Left - Mail */}
                        <div className="absolute top-[14.6%] left-[14.6%] -translate-x-1/2 -translate-y-1/2">
                            <div className="p-3 bg-[#020610] border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-spin-reverse-slow hover:scale-110 transition-transform">
                                <Mail size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Orbit Ring 2 (Dashed) */}
                    <div className="absolute inset-12 md:inset-16 rounded-full border border-dashed border-cyan-500/20 animate-spin-reverse-slow duration-[100s]"></div>
                </div>
            </div>
        </div>
    </div>
  );
};