import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storage';
import { Lock, Mail, WifiOff, ArrowRight, Camera, Calendar, MapPin, CheckCircle, Clock, Search, MessageSquare, Bell } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] text-white relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        
        {/* Main Container */}
        <div className="w-full h-screen flex overflow-hidden relative">
            
            {/* Left Panel */}
            <div className="w-full lg:w-[45%] relative z-20 flex flex-col justify-center px-8 md:px-24 bg-[#050810] border-r border-white/5 shadow-2xl">
                
                {/* Decor: Top Left Lines */}
                <div className="absolute top-12 left-12 flex flex-col gap-2 opacity-50">
                    <div className="w-8 h-8 border border-cyan-800 rounded bg-cyan-950/20 flex items-center justify-center">
                       <div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-700 tracking-[0.2em] uppercase">System V2.0</div>
                </div>

                <div className="mb-10 mt-16">
                   <h1 className="text-5xl font-bold mb-4 tracking-tight text-white font-sans">Maya Calendar<span className="text-cyan-400">.AI</span></h1>
                   <h2 className="text-lg font-bold text-gray-200">Acessar Sistema</h2>
                </div>

                {error && <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-200 text-sm rounded-lg backdrop-blur-sm">{error}</div>}

                <form onSubmit={handleSupabaseLogin} className="space-y-6 max-w-md w-full">
                    
                    {/* Identity Input */}
                    <div className="space-y-2 group">
                         <label className="text-[10px] font-bold text-cyan-600 group-focus-within:text-cyan-400 tracking-widest uppercase flex items-center gap-2 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors"></span> Identity (Email)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-600 group-focus-within:text-cyan-400 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#0a0e17] border border-gray-800 text-gray-200 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/40 focus:bg-[#0f1420] focus:ring-1 focus:ring-cyan-500/10 transition-all placeholder:text-gray-700 font-mono text-sm"
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
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors"></span> Access Key (Senha)
                         </label>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-600 group-focus-within:text-cyan-400 transition-colors" />
                             </div>
                             <input 
                                className="w-full bg-[#0a0e17] border border-gray-800 text-gray-200 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500/40 focus:bg-[#0f1420] focus:ring-1 focus:ring-cyan-500/10 transition-all placeholder:text-gray-700 font-mono text-sm"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center pt-1">
                        <label className="flex items-center cursor-pointer group">
                             <input type="checkbox" className="w-4 h-4 bg-[#0a0e17] border-gray-800 rounded checked:bg-cyan-600 checked:border-cyan-600 focus:ring-0 focus:ring-offset-0 transition-all appearance-none border cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45" />
                             <span className="ml-3 text-[10px] text-gray-500 font-mono tracking-wider uppercase group-hover:text-gray-400 transition-colors">Lembrar meu email</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#0f1522] border border-cyan-900/30 text-white font-medium rounded-xl hover:bg-cyan-950/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 flex items-center justify-center gap-3 group mt-4 relative overflow-hidden"
                    >
                        <span className="relative z-10 font-mono uppercase tracking-[0.15em] text-xs">Entrar no Sistema</span>
                        <ArrowRight className="relative z-10 w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    {/* Offline Button */}
                     <button 
                        type="button"
                        onClick={handleOfflineLogin}
                        className="w-full py-3.5 bg-transparent border border-dashed border-gray-800 text-gray-600 rounded-xl hover:text-gray-400 hover:border-gray-600 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest"
                    >
                        <WifiOff className="w-3 h-3" /> Entrar Offline (Modo Local)
                    </button>
                </form>

                <div className="mt-12 flex items-center justify-start gap-4 text-sm relative">
                     <div className="absolute -top-6 left-0 w-8 h-[1px] bg-gray-800"></div>
                     <span className="text-gray-600 text-xs">Não possui acesso?</span>
                     <button className="text-cyan-500 hover:text-cyan-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors">
                        Criar uma conta <ArrowRight className="w-3 h-3" />
                     </button>
                </div>
                
                {/* Decorative bottom */}
                <div className="absolute bottom-12 left-12 flex items-center gap-4 opacity-30">
                     <div className="h-[2px] w-12 bg-cyan-900"></div>
                     <div className="text-[9px] font-mono text-cyan-900 tracking-widest">SECURE CONNECTION</div>
                     <div className="h-[2px] w-12 bg-cyan-900"></div>
                </div>
            </div>

            {/* Right Panel - Illustration */}
            <div className="hidden lg:block w-[55%] relative bg-[#02040a] overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 z-0 opacity-20" 
                     style={{
                        backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: 'perspective(1000px) rotateX(20deg) scale(1.5) translateY(-100px)'
                     }}
                ></div>

                {/* Radar/Circle Elements */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                     <div className="w-[800px] h-[800px] border border-cyan-500/10 rounded-full animate-spin-slow"></div>
                     <div className="absolute w-[600px] h-[600px] border border-dashed border-cyan-500/10 rounded-full animate-spin-reverse-slow"></div>
                     <div className="absolute w-[400px] h-[400px] border border-cyan-500/5 rounded-full"></div>
                </div>

                {/* Character Image */}
                <div className="absolute inset-0 flex items-end justify-center z-10 pointer-events-none">
                     <img 
                        src="https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1000&auto=format&fit=crop"
                        className="h-[85%] w-auto object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.15)] grayscale-[20%] contrast-125 brightness-90"
                        alt="Maya Agent"
                        style={{ maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-transparent z-20"></div>
                </div>
                
                {/* Floating Icons - positioned around the center */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-[25%] right-[25%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '1s'}}>
                        <Calendar size={20} />
                    </div>
                    <div className="absolute top-[45%] left-[25%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '2s'}}>
                        <MessageSquare size={20} />
                    </div>
                    <div className="absolute bottom-[30%] right-[30%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '3s'}}>
                        <MapPin size={20} />
                    </div>
                     <div className="absolute top-[30%] left-[35%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '0s'}}>
                        <Camera size={20} />
                    </div>
                    <div className="absolute bottom-[20%] left-[30%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '1.5s'}}>
                        <Search size={20} />
                    </div>
                    <div className="absolute top-[50%] right-[20%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '2.5s'}}>
                        <CheckCircle size={20} />
                    </div>
                     <div className="absolute bottom-[15%] right-[40%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '0.5s'}}>
                        <Clock size={20} />
                    </div>
                    <div className="absolute top-[20%] left-[20%] p-3 bg-[#0a0e17]/80 backdrop-blur border border-cyan-500/30 rounded-xl text-cyan-400 animate-float" style={{animationDelay: '3.5s'}}>
                        <Bell size={20} />
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};