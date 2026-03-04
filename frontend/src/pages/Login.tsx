import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:3001/api/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('@Acheii:token', token);
            localStorage.setItem('@Acheii:user', JSON.stringify(user));

            if (user.role === 'admin') {
                navigate('/dashboard-admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Erro ao conectar com o servidor.');
            } else {
                setError('Ocorreu um erro inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white lg:bg-surface-light font-sans">
            
            {/* LADO ESQUERDO: Branding (Desktop Only) */}
            <div className="hidden lg:flex lg:w-5/12 bg-brand-dark flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 text-center max-w-sm">
                    <img 
                        src="/imagens/logo.png" 
                        alt="Logo Acheii" 
                        className="w-48 h-auto mx-auto mb-8 drop-shadow-[0_0_20px_rgba(6,220,139,0.2)]" 
                    />
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
                        Ache<span className="text-brand-primary">II</span>
                    </h1>
                    <p className="text-brand-neutral text-lg font-medium leading-relaxed">
                        Acesse a inteligência logística da sua loja em poucos cliques.
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: Formulário (Otimizado Mobile) */}
            <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 min-h-screen">
                
                {/* Header Mobile */}
                <div className="lg:hidden mb-12 flex flex-col items-center">
                    <div className="bg-brand-dark p-4 rounded-2xl shadow-xl mb-4">
                        <img 
                            src="/imagens/logo.png" 
                            alt="Logo Acheii" 
                            className="w-16 h-auto" 
                        />
                    </div>
                    <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Ache<span className="text-brand-primary">II</span></h2>
                </div>

                <div className="max-w-md w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">Login</h3>
                        <p className="text-text-light font-bold text-xs uppercase tracking-widest mt-2 flex items-center justify-center lg:justify-start gap-2">
                            <ShieldCheck size={14} className="text-brand-primary" />
                            Ambiente Restrito e Seguro
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-pulse text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dark uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-brand-primary transition-all" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-brand-dark font-bold text-sm"
                                    placeholder="usuario@acheii.com.br"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dark uppercase tracking-[0.2em] ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-brand-primary transition-all" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-brand-dark font-bold text-sm"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-brand-dark transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-primary hover:bg-brand-mid text-brand-dark font-black py-4 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Acessar Painel
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divisor Visual e CTA para Registro */}
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center lg:text-left">
                            <p className="text-text-light font-bold text-[10px] uppercase tracking-[0.15em] mb-4">
                                É novo por aqui? Registre sua loja
                            </p>
                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full bg-white border-2 border-brand-dark text-brand-dark font-black py-3 rounded-xl hover:bg-brand-dark hover:text-white transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 group active:scale-95 shadow-sm"
                            >
                                <Building2 size={16} />
                                Solicitar Parceria
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <a href="#" className="text-[10px] font-black text-slate-400 hover:text-brand-primary transition-colors uppercase tracking-[0.2em]">
                            Problemas com o acesso? Suporte Técnico
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;