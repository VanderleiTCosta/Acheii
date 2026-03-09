import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Building2,
  ShieldCheck,
  Phone,
  FileText,
  MapPin,
  Globe,
} from "lucide-react";
import type { AxiosError } from "axios";
import axios from "axios";

const Register = () => {
  // Estado inicial com todos os campos da tabela 'LOJAS'
  const [formData, setFormData] = useState({
    name: "", // Mapeado para nome_fantasia no backend
    razao_social: "",
    cnpj: "",
    whatsapp: "",
    email: "",
    password: "",
    endereco: "",
    cidade: "",
    estado: "",
    latitude: 0,
    longitude: 0,
    plano: "basico", // Valor padrão conforme banco
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envio sincronizado com a rota de registro público UUID
      await axios.post("http://localhost:3001/api/register-public", formData);
      setSuccess(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const msg = error.response?.data?.message || "Erro ao solicitar cadastro. Verifique os dados.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md animate-in fade-in zoom-in duration-500">
          <div className="bg-brand-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-primary/20">
            <CheckCircle2 className="text-brand-primary w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Solicitação Enviada!</h2>
          <p className="text-brand-neutral mt-4 font-medium leading-relaxed text-sm">
            Recebemos os dados da sua empresa. Nossa equipe validará as informações para ativar seu acesso ao marketplace. Fique atento ao seu e-mail.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 w-full bg-brand-primary text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-primary/20"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-light font-sans text-brand-dark">
      {/* Branding Desktop */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-dark flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-sm">
          <img src="/imagens/logo.png" alt="Logo Acheii" className="w-32 h-auto mx-auto mb-8 drop-shadow-2xl" />
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
            Ache<span className="text-brand-primary">II</span>
          </h1>
          <p className="text-brand-neutral text-lg font-medium">Conecte seu estoque à maior rede inteligente de autopeças do país.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto bg-white lg:bg-transparent">
        <div className="max-w-2xl w-full">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Nova Loja Parceira</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 lg:justify-start justify-center">
              <ShieldCheck size={14} className="text-brand-primary" /> Ambiente de Cadastro Criptografado
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="Ex: Auto Peças Silva" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="Silva Peças LTDA" onChange={e => setFormData({ ...formData, razao_social: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="00.000.000/0000-00" onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Comercial</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="(00) 00000-0000" onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Fiscal</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                <input required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="Rua, Número, Bairro" onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="Ex: São Paulo" onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado (UF)</label>
                <input required maxLength={2} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm uppercase" placeholder="SP" onChange={e => setFormData({ ...formData, estado: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input type="number" step="any" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="-23.5505" onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                  <input type="number" step="any" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="-46.6333" onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo (Login)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                <input type="email" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="contato@loja.com.br" onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Crie sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-all" />
                <input type={showPassword ? "text" : "password"} required className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm" placeholder="••••••••" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-dark transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-brand-dark font-black py-5 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Solicitar Parceria"}
            </button>

            <button type="button" onClick={() => navigate("/login")} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-dark transition-colors">
              Já possui cadastro? Fazer Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;