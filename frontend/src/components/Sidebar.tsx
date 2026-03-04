import { ShieldCheck, Users, BarChart3,FileText, LogOut, CheckCircle, LayoutDashboard, Monitor, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    role: 'admin' | 'user';
}

const Sidebar = ({ role }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    // Estilos base fiéis ao design
    const btnBase = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm mt-1";
    const btnActive = "bg-brand-primary text-brand-dark shadow-lg shadow-brand-primary/20";
    const btnInactive = "text-slate-400 hover:text-white hover:bg-white/5";

    return (
        <aside className="w-64 bg-brand-dark text-white flex flex-col p-6 shadow-2xl min-h-screen sticky top-0">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="bg-brand-primary p-2 rounded-lg">
                    <ShieldCheck size={20} className="text-brand-dark" />
                </div>
                <span className="font-black text-xl uppercase tracking-tighter">
                    Acheii <span className="text-brand-primary">{role === 'admin' ? 'Admin' : 'Lojista'}</span>
                </span>
            </div>

            <nav className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">
                    {role === 'admin' ? 'Painel Admin' : 'Ferramentas'}
                </p>
                
                {role === 'admin' ? (
                    <>
                        <button onClick={() => navigate('/dashboard-admin')} className={`${btnBase} ${isActive('/dashboard-admin') ? btnActive : btnInactive}`}>
                            <BarChart3 size={18} /> Dashboard Global
                        </button>
                        <button onClick={() => navigate('/gestao-lojas')} className={`${btnBase} ${isActive('/gestao-lojas') ? btnActive : btnInactive}`}>
                            <Users size={18} /> Gestão de Lojas
                        </button>
                        <button onClick={() => navigate('/validacao-produtos')} className={`${btnBase} ${isActive('/validacao-produtos') ? btnActive : btnInactive}`}>
                            <CheckCircle size={18} /> Validação de Produtos
                        </button>
                        <button onClick={() => navigate('/monitoramento-ia')} className={`${btnBase} ${isActive('/monitoramento-ia') ? btnActive : btnInactive}`}>
                            <Monitor size={18} /> Monitoramento IA
                        </button>
                        <button onClick={() => navigate('/relatorios-financeiro')} className={`${btnBase} ${isActive('/relatorios-financeiro') ? btnActive : btnInactive}`}>
                            <FileText size={18} /> Relatórios Financeiros
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate('/dashboard')} className={`${btnBase} ${isActive('/dashboard') ? btnActive : btnInactive}`}>
                            <LayoutDashboard size={18} /> Dashboard da Loja
                        </button>
                        <button onClick={() => navigate('/estoque')} className={`${btnBase} ${isActive('/estoque') ? btnActive : btnInactive}`}>
                            <Package size={18} /> Gerenciar Estoque
                        </button>
                    </>
                )}
            </nav>

            <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl font-bold transition-all">
                <LogOut size={18} /> Sair do Sistema
            </button>
        </aside>
    );
};

export default Sidebar;