import React, { useState, useEffect, useCallback } from 'react';
import { Box, AlertTriangle, MessageSquare, TrendingUp, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

// Interfaces para garantir tipagem forte e resolver o ESLint
interface Metrics {
    active: number;
    stockAlert: number;
    chatRequests: number;
    conversion: string;
}

interface RejectedProduct {
    id: number;
    name: string;
    status: string;
    validation_issue: string;
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend: string;
    danger?: boolean;
}

interface InteractionItemProps {
    name: string;
    query: string;
    status: string;
    time: string;
    warning?: boolean;
}

const Dashboard = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [rejectedItems, setRejectedItems] = useState<RejectedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('@Acheii:user') || '{"id": 0, "name": "Lojista"}');

    const fetchDashboardData = useCallback(async () => {
        if (!user.id) return;
        try {
            setLoading(true);
            // Chamadas em paralelo para performance sênior
            const [metricsRes, productsRes] = await Promise.all([
                axios.get(`http://localhost:3001/api/store/metrics/${user.id}`),
                axios.get(`http://localhost:3001/api/store/products/${user.id}`)
            ]);

            setMetrics(metricsRes.data);
            
            // Substituído 'any' por tipagem explícita no filtro
            const rejected = productsRes.data.filter((p: RejectedProduct) => p.status === 'rejected');
            setRejectedItems(rejected);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
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
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Dashboard da Loja</h1>
                        <p className="text-slate-500 font-medium mt-1">{user.name} - Visão geral do ecossistema</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Otto AI: Monitorando
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                ) : (
                    <>
                        {/* Alertas de Rejeição com Motivo Real */}
                        {rejectedItems.length > 0 && (
                            <div className="mb-8 space-y-3">
                                {rejectedItems.map(item => (
                                    <div key={item.id} className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-center justify-between group hover:border-red-200 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-red-500 text-white p-3 rounded-2xl shadow-lg shadow-red-500/20">
                                                <AlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase text-sm text-red-600">Ação Necessária: {item.name}</h4>
                                                <p className="text-red-500/80 text-xs font-bold uppercase tracking-tight">
                                                    Motivo: <span className="text-red-700">{item.validation_issue}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/estoque')}
                                            className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                        >
                                            Corrigir Agora <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <MetricCard icon={<Box className="text-blue-500"/>} label="Produtos Ativos" value={metrics?.active || 0} trend="+12" />
                            <MetricCard icon={<AlertTriangle className="text-red-500"/>} label="Sem Estoque" value={metrics?.stockAlert || 0} trend="+3" danger />
                            <MetricCard icon={<MessageSquare className="text-emerald-500"/>} label="Pedidos via Chat" value={metrics?.chatRequests || 0} trend="+8" />
                            <MetricCard icon={<TrendingUp className="text-purple-500"/>} label="Taxa Conversão" value={metrics?.conversion || "0%"} trend="+2.1%" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-80 flex flex-col justify-center items-center text-center">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <TrendingUp size={40} className="text-slate-200" />
                                </div>
                                <h3 className="font-black uppercase tracking-tighter text-slate-400">Gráfico de Performance</h3>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sincronizando com as vendas do chat...</p>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Últimas Interações</h2>
                                <div className="space-y-4">
                                    <InteractionItem name="Carlos M." query="Bomba Siena 2012" status="Respondido" time="2 min atrás" />
                                    <InteractionItem name="Ana R." query="Pastilha Civic 2019" status="Pendente" time="15 min atrás" warning />
                                    <InteractionItem name="Pedro S." query="Filtro Corolla 2020" status="Respondido" time="32 min atrás" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

// Componentes Auxiliares com Props Tipadas
const MetricCard = ({ icon, label, value, trend, danger = false }: MetricCardProps) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-all group">
        <div className="flex justify-between items-start">
            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-brand-primary/10 transition-colors">{icon}</div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${danger ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{trend}</span>
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
        </div>
    </div>
);

const InteractionItem = ({ name, query, status, time, warning }: InteractionItemProps) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-primary/20 transition-all cursor-pointer">
        <div>
            <h4 className="font-bold text-sm leading-none mb-1">{name}</h4>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{query}</p>
            <span className="text-[9px] text-slate-400 font-bold">{time}</span>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${warning ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
            {status}
        </span>
    </div>
);

export default Dashboard;