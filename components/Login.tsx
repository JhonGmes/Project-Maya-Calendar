
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, ArrowRight, Cpu, 
  Video, Calendar, CheckCircle2, MapPin, Clock, Bell, Search,
  AlertTriangle, LogIn, UserPlus
} from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp, setLocalMode } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  // Lista de ícones para a órbita (Apenas os componentes visuais agora)
  const orbitIcons = [
    { Icon: Calendar },
    { Icon: CheckCircle2 },
    { Icon: MapPin },
    { Icon: Clock },
    { Icon: Bell },
    { Icon: Search },
    { Icon: Mail },
    { Icon: Video },
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNetworkError(false);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError("Conta criada! Tente entrar.");
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('Network')) {
        setNetworkError(true);
        setError("Erro de conexão com o servidor.");
      } else {
        setError(err.message || 'Credenciais inválidas.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#000510] text-white relative overflow-hidden font-sans">
        
        {/* Background Grid/Circuit Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full h-full flex flex-col md:flex-row relative z-10 max-w-[1600px] mx-auto">
            
            {/* PAINEL ESQUERDO: Login */}
            <div className="w-full md:w-[40%] flex flex-col justify-center px-12 lg:px-20 py-12 z-20">
                
                <div className="flex items-center gap-2 mb-12 opacity-50">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-cyan-500">SYSTEM V2.0</span>
                </div>

                <div className="mb-10">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-1 tracking-tight">Maya Calendar<span className="text-cyan-400">.AI</span></h1>
                    <p className="text-gray-500 text-sm font-medium">Acessar Sistema</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center gap-3 animate-fade-in text-red-200">
                        <AlertTriangle size={16} />
                        <p className="text-xs">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6 max-w-sm">
                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-bold text-cyan-600/80 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-600"></div>
                            IDENTITY (EMAIL)
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#010816] border border-white/5 rounded-lg py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/30 transition-all text-sm text-gray-300 placeholder:text-gray-800"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-bold text-cyan-600/80 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-600"></div>
                            ACCESS KEY (SENHA)
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#010816] border border-white/5 rounded-lg py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/30 transition-all text-sm text-gray-300 placeholder:text-gray-800"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold tracking-wider mb-2">
                        <input type="checkbox" className="rounded-sm bg-black border-white/10 text-cyan-600 focus:ring-cyan-600 w-3 h-3" />
                        <label className="uppercase">LEMBRAR MEU EMAIL</label>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-3.5 bg-black border border-cyan-500/30 hover:border-cyan-500/60 text-white rounded-lg font-bold flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(8,145,178,0.05)]"
                    >
                        {loading ? 'SINCRONIZANDO...' : 'ENTRAR NO SISTEMA'}
                        <ArrowRight size={14} className="text-cyan-400" />
                    </button>

                    <button 
                        type="button"
                        onClick={() => setLocalMode(true)}
                        className="w-full py-3 bg-transparent border border-white/5 text-gray-700 hover:text-gray-400 rounded-lg text-[9px] font-bold transition-all uppercase tracking-[0.2em]"
                    >
                        ENTRAR OFFLINE (MODO LOCAL)
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] pt-4">
                        <p className="text-gray-600">Não possui acesso?</p>
                        <button 
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-cyan-600 font-bold hover:text-cyan-400 transition-colors"
                        >
                            {isSignUp ? 'Fazer Login' : 'Criar uma conta'}
                        </button>
                    </div>
                </form>
                
                <div className="mt-auto opacity-10 pt-10">
                    <p className="text-[9px] font-mono tracking-[0.5em] uppercase">SECURE CONNECTION</p>
                </div>
            </div>

            {/* PAINEL DIREITO: Órbita e Agente (LIMPO) */}
            <div className="hidden md:flex flex-1 items-center justify-center relative">
                
                {/* Sistema Orbital */}
                <div className="relative w-[460px] h-[460px] flex items-center justify-center">
                    
                    {/* Anéis de Órbita */}
                    <div className="absolute inset-0 border border-cyan-500/5 rounded-full"></div>
                    <div className="absolute inset-16 border border-white/5 rounded-full"></div>
                    <div className="absolute inset-32 border border-cyan-500/5 rounded-full"></div>
                    
                    {/* Imagem Central (Maya) */}
                    <div className="relative z-20 w-[240px] h-[360px] drop-shadow-[0_0_60px_rgba(8,145,178,0.2)]">
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI"
                            className="w-full h-full object-contain"
                        />
                        {/* Brilho no Cérebro */}
                        <div className="absolute top-[42%] left-[45%] w-14 h-14 bg-cyan-400/10 rounded-full blur-2xl animate-pulse"></div>
                    </div>

                    {/* Ícones Orbitais puros (Sem labels conforme solicitado) */}
                    <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '60s' }}>
                        {orbitIcons.map(({ Icon }, idx) => {
                            const angle = idx * (360 / orbitIcons.length);
                            const radius = 210; // Raio da órbita
                            
                            return (
                                <div 
                                    key={idx}
                                    className="absolute left-1/2 top-1/2"
                                    style={{ 
                                        transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)` 
                                    }}
                                >
                                    {/* Box do Ícone Minimalista */}
                                    <div className="p-2 bg-black/80 border border-cyan-500/40 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-500 animate-float" style={{ animationDelay: `${idx * 0.3}s` }}>
                                        <Icon size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spinSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spinSlow 60s linear infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            .animate-float {
                animation: float 4s ease-in-out infinite;
            }
        ` }} />
    </div>
  );
};
