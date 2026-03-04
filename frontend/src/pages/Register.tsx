import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, Building2, Layers, Briefcase, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', 
        condition_type: 'both', sector: 'injection'
    });
    const [showPassword, setShowPassword] = useState(false); // Estado para visibilidade da senha
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3001/api/register-public', formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 6000);
        } catch (err: unknown) {
            console.error("Erro no registro:", err);
            alert("Erro ao solicitar cadastro. Verifique se o e-mail já está em uso.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-center">
                <div className="max-w-md animate-in fade-in zoom-in duration-500 px-4">
                    <div className="bg-brand-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="text-brand-primary w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Solicitação Enviada!</h2>
                    <p className="text-brand-neutral mt-4 font-medium leading-relaxed">
                        Nossa equipe analisará sua loja. Você receberá um e-mail assim que seu acesso for liberado para o painel.
                    </p>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="mt-8 w-full bg-brand-primary text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

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
                        Junte-se à maior rede de autopeças inteligente. Cadastre sua loja agora.
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: Form (Otimizado Mobile com estilo de card) */}
            <div className="w-full lg:w-7/12 flex flex-col items-center bg-white lg:bg-surface-light min-h-screen overflow-y-auto pt-6 pb-12 px-4 sm:px-12">
                
                {/* Header de Navegação Mobile */}
                <div className="w-full max-w-2xl flex items-center justify-between mb-2">
                    <button 
                        onClick={() => navigate('/login')}
                        className="p-2 -ml-2 text-brand-dark hover:bg-brand-primary/10 rounded-full transition-colors active:scale-90"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="lg:hidden bg-brand-dark px-3 py-1.5 rounded-lg shadow-lg">
                        <img src="/imagens/logo.png" alt="Logo" className="h-auto w-16" />
                    </div>
                    <div className="w-8 lg:hidden"></div>
                </div>

                <div className="max-w-xl w-full">
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Nova Loja</h2>
                        <p className="text-text-light font-bold text-xs uppercase tracking-widest mt-2 flex items-center justify-center lg:justify-start gap-2">
                            <ShieldCheck size={14} className="text-brand-primary" />
                            Ambiente de Pré-Cadastro Seguro
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-text-dark uppercase tracking-widest ml-1">Nome da Empresa</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-brand-primary transition-all" />
                                    <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold transition-all text-sm" placeholder="Ex: Peças do Vale" onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-text-dark uppercase tracking-widest ml-1">E-mail Comercial</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-brand-primary transition-all" />
                                    <input type="email" required className="w-full pl-12 pr-4 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold transition-all text-sm" placeholder="loja@email.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-text-dark uppercase tracking-widest ml-1">Estado das Peças</label>
                                <div className="relative group">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light pointer-events-none group-focus-within:text-brand-primary transition-all" />
                                    <select className="w-full pl-12 pr-4 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary/40 font-bold text-brand-dark text-sm appearance-none transition-all" onChange={e => setFormData({...formData, condition_type: e.target.value})}>
                                        <option value="both">Novas e Usadas</option>
                                        <option value="new">Apenas Novas</option>
                                        <option value="used">Apenas Usadas</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-text-dark uppercase tracking-widest ml-1">Ramo Principal</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light pointer-events-none group-focus-within:text-brand-primary transition-all" />
                                    <select className="w-full pl-12 pr-4 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary/40 font-bold text-brand-dark text-sm appearance-none transition-all" onChange={e => setFormData({...formData, sector: e.target.value})}>
                                        <option value="injection">Injeção Eletrônica</option>
                                        <option value="electrical">Elétrica</option>
                                        <option value="gnv">GNV</option>
                                        <option value="air_conditioning">Ar Condicionado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-dark uppercase tracking-widest ml-1">Crie sua Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-brand-primary transition-all" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 lg:bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 transition-all font-bold text-sm" 
                                    placeholder="••••••••" 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                />
                                {/* Botão de visibilidade de senha adicionado */}
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-brand-dark transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={20} className="text-brand-primary" /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full bg-brand-primary hover:bg-brand-mid text-brand-dark font-black py-4 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" /> : "Solicitar Participação"}
                            </button>
                        </div>

                        <div className="text-center pt-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-text-light font-bold text-[10px] uppercase tracking-[0.15em] mb-4 text-center">
                                    Já faz parte da nossa rede?
                                </p>
                                <button 
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-white border-2 border-brand-dark text-brand-dark font-black py-3 rounded-xl hover:bg-brand-dark hover:text-white transition-all uppercase tracking-widest text-[11px] active:scale-95 shadow-sm"
                                >
                                    Ir para o Login
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;