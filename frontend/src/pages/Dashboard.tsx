import React, { useState, useEffect, useCallback } from 'react';
import { Box, AlertTriangle, MessageSquare, TrendingUp, Loader2, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

// Interfaces robustas para tipagem estática (Zero ESLint Errors)
interface Metrics {
    active: number;
    stockAlert: number;
    chatRequests: number;
    conversion: string;
}

interface RejectedProduct {
    id_produto: string; // Sincronizado com UUID do banco
    nome_peca: string;
    status: string;
    motivo_bloqueio: string; // Lendo do novo campo dedicado
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend: string;
    danger?: boolean;
}

const Dashboard = () => {
    const [metrics, setMetrics] = useState<Metrics>({
        active: 0,
        stockAlert: 0,
        chatRequests: 0,
        conversion: "0%"
    });
    const [rejectedItems, setRejectedItems] = useState<RejectedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('@Acheii:user') || '{"id": "", "name": "Lojista"}');

    const fetchDashboardData = useCallback(async () => {
        if (!user.id) return;
        try {
            setLoading(true);
            // Chamadas em paralelo para performance máxima
            const [metricsRes, productsRes] = await Promise.all([
                axios.get(`http://localhost:3001/api/store/metrics/${user.id}`),
                axios.get(`http://localhost:3001/api/store/products/${user.id}`)
            ]);

            setMetrics(metricsRes.data);
            
            // Filtra itens com status 'rejected' para exibir no topo
            const rejected = productsRes.data.filter((p: RejectedProduct) => p.status === 'rejected');
            setRejectedItems(rejected);
        } catch (error) {
            console.error("Erro ao carregar ecossistema:", error);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
            <Sidebar role="user" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Painel de Performance</h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Lojista: {user.name}</p>
                    </div>
                    <div className="bg-brand-dark text-brand-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg">
                        <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                        Otto AI: Sistema Ativo
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sincronizando sua Loja...</p>
                    </div>
                ) : (
                    <>
                        {/* ALERTAS DE BLOQUEIO - Utilizando o novo campo 'motivo_bloqueio' */}
                        {rejectedItems.length > 0 && (
                            <div className="mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                {rejectedItems.map(item => (
                                    <div key={item.id_produto} className="bg-white border-2 border-red-50 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm hover:border-red-100 transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-red-50 text-red-500 p-4 rounded-2xl group-hover:scale-105 transition-transform">
                                                <AlertCircle size={28} />
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase text-sm text-brand-dark leading-none mb-2">Item Bloqueado: {item.nome_peca}</h4>
                                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50/50 px-2 py-1 rounded w-fit mb-2">Ação Administrativa</p>
                                                <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-xl">
                                                    Motivo: <span className="text-brand-dark">"{item.motivo_bloqueio || 'Verifique as especificações técnicas da peça e tente novamente.'}"</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/estoque')}
                                            className="flex items-center gap-2 bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-600 active:scale-95 transition-all"
                                        >
                                            Corrigir Item <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Grid de Métricas Principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <MetricCard icon={<Box className="text-blue-500"/>} label="Peças Ativas" value={metrics.active} trend="+12%" />
                            <MetricCard icon={<AlertTriangle className="text-red-500"/>} label="Estoque Baixo" value={metrics.stockAlert} trend="Alerta" danger />
                            <MetricCard icon={<MessageSquare className="text-emerald-500"/>} label="Leads Chat" value={metrics.chatRequests} trend="+8" />
                            <MetricCard icon={<TrendingUp className="text-purple-500"/>} label="Conversão" value={metrics.conversion} trend="+2.4%" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Gráfico/Placeholder de Performance */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-80 relative overflow-hidden group">
                                <div className="bg-slate-50 p-8 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp size={48} className="text-slate-200" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-brand-dark">Análise Otto AI</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Dados em tempo real do Marketplace</p>
                                <div className="absolute top-0 right-0 p-8">
                                    <Clock className="text-slate-100 w-32 h-32 -mr-10 -mt-10 opacity-50" />
                                </div>
                            </div>

                            {/* Card de Chamada para Ação IA */}
                            <div className="bg-brand-dark p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/20">
                                        <MessageSquare className="text-brand-dark" size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 leading-tight">Otto AI Automação</h2>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Sua loja responde clientes 24h por dia buscando o melhor preço automaticamente.</p>
                                    <button className="w-full bg-brand-primary text-brand-dark py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl">Configurar Chat</button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-all duration-700"></div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

// Subcomponente de Métricas com Design Premium
const MetricCard = ({ icon, label, value, trend, danger = false }: MetricCardProps) => (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-all group cursor-default">
        <div className="flex justify-between items-start">
            <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-brand-primary/10 transition-colors duration-300">{icon}</div>
            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${danger ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{trend}</span>
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-4xl font-black tracking-tighter text-brand-dark leading-none">{value}</h3>
        </div>
    </div>
);

export default Dashboard;