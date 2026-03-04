import React from 'react';
import { FileText, Download, TrendingUp, DollarSign, PieChart, Wallet} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// INTERFACES DE TIPAGEM
interface FinanceCardProps {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
}

// Interface adicionada para resolver o erro do ESLint
interface CommissionRowProps {
    store: string;
    plan: 'Premium' | 'Basico';
    sales: number;
    value: string;
}

const RelatorioFinanceiro = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark tracking-tighter uppercase">Relatorios e Financeiro</h1>
                        <p className="text-slate-500 font-medium text-sm">Acompanhe a receita e projeções de crescimento</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-dark hover:bg-slate-50 transition-all">
                            <FileText size={14} /> Exportar PDF
                        </button>
                        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-dark hover:bg-slate-50 transition-all">
                            <Download size={14} /> Exportar Excel
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <FinanceCard label="Receita Total (6 meses)" value="R$ 114.700,00" sub="Crescimento de 12% vs mês anterior" icon={<DollarSign className="text-blue-500" />} />
                    <FinanceCard label="Projecao Proximos 3 Meses" value="R$ 185.000,00" sub="Baseado no histórico de adesão" icon={<TrendingUp className="text-emerald-500" />} />
                    <FinanceCard label="Ticket Medio por Loja" value="R$ 755,00/mes" sub="Calculado sobre 152 lojas ativas" icon={<Wallet className="text-amber-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-brand-primary" /> Receita por Periodo
                        </h2>
                        <div className="h-64 flex items-end justify-between px-4 gap-2">
                            {[15, 25, 30, 45, 60, 85].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-brand-primary rounded-t-xl transition-all hover:opacity-80" style={{ height: `${h}%` }}></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Mes {i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h2 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-brand-primary" /> Distribuicao de Planos
                        </h2>
                        <div className="flex flex-col items-center">
                            <div className="w-40 h-40 rounded-full border-[15px] border-brand-primary border-l-slate-100 border-b-slate-100 flex items-center justify-center mb-6">
                                <span className="text-2xl font-black text-brand-dark">152</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Premium (48)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-100 rounded-full"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Basico (104)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-8">Comissoes por Loja</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4 px-4">Loja</th>
                                    <th className="pb-4 px-4">Plano</th>
                                    <th className="pb-4 px-4 text-center">Vendas</th>
                                    <th className="pb-4 px-4 text-right">Comissao</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <CommissionRow store="Auto Pecas Silva" plan="Premium" sales={120} value="R$ 1.800,00" />
                                <CommissionRow store="Pecas Express" plan="Premium" sales={98} value="R$ 1.470,00" />
                                <CommissionRow store="MegaParts" plan="Premium" sales={87} value="R$ 1.305,00" />
                                <CommissionRow store="Pecas Center" plan="Basico" sales={65} value="R$ 975,00" />
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

const FinanceCard = ({ label, value, sub, icon }: FinanceCardProps) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="bg-slate-50 p-4 rounded-2xl">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter">{value}</h3>
            <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">{sub}</p>
        </div>
    </div>
);

// RESOLUÇÃO DO ERRO: Função agora usa CommissionRowProps em vez de 'any'
const CommissionRow = ({ store, plan, sales, value }: CommissionRowProps) => (
    <tr className="group hover:bg-slate-50 transition-colors">
        <td className="py-5 px-4 font-bold text-brand-dark text-sm">{store}</td>
        <td className="py-5 px-4">
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                plan === 'Premium' 
                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                : 'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
                {plan}
            </span>
        </td>
        <td className="py-5 px-4 text-center text-slate-500 font-bold text-sm">{sales}</td>
        <td className="py-5 px-4 text-right font-black text-brand-dark text-sm">{value}</td>
    </tr>
);

export default RelatorioFinanceiro;