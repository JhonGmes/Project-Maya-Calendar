import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storage';
import { Lock, Mail, WifiOff, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px] animate-pulse-slow"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="w-full max-w-5xl h-[80vh] flex shadow-2xl rounded-3xl overflow-hidden glass-panel z-10 border border-white/10 relative">
            {/* Left Side - Form */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-zinc-950/80 backdrop-blur-xl relative z-20">
                <div className="mb-10">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono mb-4">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                        SYSTEM V2.0
                    </div>
                    <h1 className="text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Maya Calendar<span className="text-blue-500">.AI</span></h1>
                    <p className="text-gray-400">Acesse sua assistente inteligente</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-200 text-sm rounded-lg">{error}</div>}

                <form onSubmit={handleSupabaseLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">Identity (Email)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-700"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">Access Key (Senha)</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Autenticando...' : (
                            <>
                                ENTRAR NO SISTEMA <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-zinc-800">
                    <button 
                        onClick={handleOfflineLogin}
                        className="w-full py-3 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <WifiOff size={16} /> ENTRAR OFFLINE (MODO LOCAL)
                    </button>
                </div>
            </div>

            {/* Right Side - Image/Illustration */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-950 to-zinc-950 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2532&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10 p-10 text-center">
                    <div className="w-64 h-64 mx-auto mb-8 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 backdrop-blur-3xl border border-white/10 flex items-center justify-center relative animate-float">
                        <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-spin-slow dashed-border"></div>
                        <span className="text-6xl">✨</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">Inteligência Pura</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">Otimize seu tempo com algoritmos avançados de agendamento e previsão.</p>
                </div>
            </div>
        </div>
    </div>
  );
};