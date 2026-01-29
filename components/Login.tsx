
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

  // Ícones da órbita conforme imagem (8 ícones exatos)
  const orbitIcons = [
    { Icon: Video, label: 'Meetings' },
    { Icon: Calendar, label: 'Calendar' },
    { Icon: CheckCircle2, label: 'Tasks' },
    { Icon: MapPin, label: 'Location' },
    { Icon: Clock, label: 'Time' },
    { Icon: Bell, label: 'Alerts' },
    { Icon: Search, label: 'Search' },
    { Icon: Mail, label: 'Email' },
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
      console.error("Auth Error:", err);
      if (err.message?.includes('fetch') || err.message?.includes('Network')) {
        setNetworkError(true);
        setError("Erro de conexão com o servidor. Deseja entrar em Modo Offline?");
      } else {
        setError(err.message || 'Credenciais inválidas.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#000510] text-white relative overflow-hidden font-sans">
        
        {/* Camada de Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.03]"></div>
        </div>

        <div className="w-full h-full flex flex-col md:flex-row relative z-10">
            
            {/* Painel Esquerdo: Formulário */}
            <div className="w-full md:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-[#000510]/80 backdrop-blur-xl border-r border-white/5 shadow-2xl z-20">
                
                <div className="flex items-center gap-3 mb-12 opacity-60">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-cyan-500">SYSTEM v2.0</span>
                </div>

                <div className="mb-12">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-3 tracking-tight">Maya Calendar<span className="text-cyan-400">.AI</span></h1>
                    <p className="text-gray-400 font-medium">Acessar Sistema</p>
                </div>

                {error && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${networkError ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
                        <AlertTriangle size={18} className="mt-1" />
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase mb-1">{networkError ? 'Erro de Rede' : 'Atenção'}</p>
                            <p className="text-xs opacity-90">{error}</p>
                            {networkError && (
                                <button onClick={() => setLocalMode(true)} className="mt-2 text-[10px] font-bold underline text-orange-400 hover:text-orange-300">
                                    ENTRAR EM MODO LOCAL (OFFLINE)
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-7">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors"></div>
                            Identity (Email)
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyan-500 transition-colors" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-black/60 transition-all text-sm font-mono placeholder:text-gray-700"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-focus-within:bg-cyan-400 transition-colors"></div>
                            Access Key (Senha)
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyan-500 transition-colors" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-black/60 transition-all text-sm font-mono placeholder:text-gray-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
                        <input type="checkbox" className="rounded bg-black border-white/10 text-cyan-500 focus:ring-cyan-500" />
                        <label>LEMBRAR MEU EMAIL</label>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-4 bg-[#020d20] border border-cyan-500/30 hover:bg-[#041a3a] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(8,145,178,0.1)] hover:shadow-[0_0_30px_rgba(8,145,178,0.3)] disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                        {loading ? 'Acessando...' : 'Entrar no Sistema'}
                        <ArrowRight size={16} />
                    </button>

                    <button 
                        type="button"
                        onClick={() => setLocalMode(true)}
                        className="w-full py-3 bg-transparent border border-white/5 text-gray-600 hover:text-white rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest"
                    >
                        Entrar Offline (Modo Local)
                    </button>

                    <div className="flex items-center justify-center gap-4 text-xs pt-4">
                        <p className="text-gray-500">Não possui acesso?</p>
                        <button 
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-cyan-500 font-bold hover:underline flex items-center gap-1.5"
                        >
                            {isSignUp ? <><LogIn size={14} /> Fazer Login</> : <><UserPlus size={14} /> Criar uma conta</>}
                        </button>
                    </div>
                </form>

                <div className="mt-auto pt-10 text-center opacity-30">
                    <p className="text-[10px] font-mono tracking-[0.3em] uppercase">Secure Connection</p>
                </div>
            </div>

            {/* Painel Direito: Órbita e Maya (IDÊNTICO À IMAGEM) */}
            <div className="hidden md:flex flex-1 items-center justify-center relative bg-[#000510]">
                
                {/* Sistema Orbital */}
                <div className="relative w-[550px] h-[550px] flex items-center justify-center">
                    
                    {/* Anéis de Órbita (Linhas de fundo da imagem) */}
                    <div className="absolute inset-0 border border-cyan-500/5 rounded-full"></div>
                    <div className="absolute inset-10 border border-cyan-500/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-24 border border-white/5 rounded-full"></div>
                    
                    {/* Imagem Central (Maya) */}
                    <div className="relative z-20 w-[300px] h-[450px] drop-shadow-[0_0_80px_rgba(8,145,178,0.25)]">
                        <img 
                            src="https://i.postimg.cc/gkwB5X6m/Maya_avatarsf.png"
                            alt="Maya AI Agent"
                            className="w-full h-full object-contain"
                        />
                        {/* Brilho no Cérebro/Tablet */}
                        <div className="absolute top-[42%] left-[45%] w-16 h-16 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
                    </div>

                    {/* Container de Rotação (Gira todos os ícones juntos) */}
                    <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '40s' }}>
                        {orbitIcons.map(({ Icon, label }, idx) => {
                            // Distribuição em círculo: 0, 45, 90, 135, 180, 225, 270, 315 graus
                            const angle = idx * (360 / orbitIcons.length);
                            const radius = 240; // Distância do centro
                            
                            return (
                                <div 
                                    key={label}
                                    className="absolute left-1/2 top-1/2"
                                    style={{ 
                                        transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)` 
                                    }}
                                >
                                    {/* O Ícone (Design conforme imagem: card preto com borda ciana) */}
                                    <div className="relative group animate-float" style={{ animationDelay: `${idx * 0.5}s` }}>
                                        <div className="p-3 bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all duration-300">
                                            <Icon size={24} strokeWidth={1.5} />
                                        </div>
                                        
                                        {/* Label que aparece no Hover */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono text-cyan-500 tracking-widest whitespace-nowrap bg-black/90 px-2 py-1 rounded border border-cyan-500/20">
                                            {label.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Elemento Decorativo: Status à Direita */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-40">
                    <div className="w-px h-24 bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
                    <div className="p-2 border border-cyan-500/30 rounded-lg">
                        <Clock size={16} className="text-cyan-500 animate-pulse" />
                    </div>
                    <div className="w-px h-24 bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
                </div>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spinSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spinSlow 40s linear infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            .animate-float {
                animation: float 4s ease-in-out infinite;
            }
        ` }} />
    </div>
  );
};
