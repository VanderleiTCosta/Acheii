import React, { useState, useEffect, useCallback } from "react";
import {
  Box, AlertTriangle, MessageSquare, TrendingUp, Loader2, 
  AlertCircle, ArrowRight, Clock, Activity, User, Bot, Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Metrics {
  active: number;
  stockAlert: number;
  chatRequests: number;
  conversion: string;
}

interface RejectedProduct {
  id_produto: string;
  nome_peca: string;
  status: string;
  motivo_bloqueio: string;
}

interface ChatLog {
  id: number;
  user_message: string;
  bot_response: string;
  created_at: string;
}

interface TopSearch {
  term: string;
  count: number;
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
    active: 0, stockAlert: 0, chatRequests: 0, conversion: "0%",
  });
  const [rejectedItems, setRejectedItems] = useState<RejectedProduct[]>([]);
  const [recentChats, setRecentChats] = useState<ChatLog[]>([]);
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("@Acheii:user") || '{"id": "", "name": "Usuário"}');

  // FUNÇÃO MASTER OTIMIZADA: Agora recebe tudo de um único endpoint processado no servidor
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!user.id) return;
    try {
        if (!isSilent) setLoading(true);
        setIsSyncing(true);

        // Chamada única otimizada para o backend
        const res = await axios.get(`http://localhost:3001/api/store/dashboard-summary/${user.id}`);
        
        const { 
            metrics: metricsData, 
            recentChats: chatsData, 
            topSearches: searchesData, 
            rejectedProducts 
        } = res.data;

        // SOLUÇÃO DO ERRO: Usando atualização funcional para evitar dependência do ESLint
        setMetrics(prevMetrics => metricsData || prevMetrics);
        
        setRecentChats(chatsData || []);
        setTopSearches(searchesData || []);
        setRejectedItems(rejectedProducts || []);

    } catch (error) {
        console.error("Erro na carga instantânea do Dashboard:", error);
    } finally {
        setLoading(false);
        setIsSyncing(false);
    }
}, [user.id]);

  useEffect(() => {
    fetchDashboardData();
    // Polling de 10 segundos agora é seguro pois a carga é mínima
    const interval = setInterval(() => fetchDashboardData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
      <Sidebar role="user" />

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin text-brand-primary mb-4 mx-auto" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Otto AI Carregando Instantaneamente...</p>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Dashboard</h1>
                <p className="text-slate-500 font-medium text-sm mt-2 uppercase tracking-widest italic">Otto AI monitorando sua loja: {user.name}</p>
              </div>
              <div className="text-right hidden md:block">
                <div className={`flex items-center gap-2 font-bold text-xs transition-colors ${isSyncing ? 'text-brand-primary' : 'text-emerald-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-brand-primary animate-spin' : 'bg-emerald-500 animate-ping'}`} />
                  {isSyncing ? 'Sincronizando...' : 'Online e Sincronizado'}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <MetricCard icon={<Box size={20} />} label="Itens Ativos" value={metrics.active} trend="+12%" />
              <MetricCard icon={<AlertTriangle size={20} />} label="Stock Baixo" value={metrics.stockAlert} trend="Ação" danger={metrics.stockAlert > 0} />
              <MetricCard icon={<MessageSquare size={20} />} label="Conversas Otto" value={metrics.chatRequests} trend="Live" />
              <MetricCard icon={<TrendingUp size={20} />} label="Conversão" value={metrics.conversion} trend="+5.4%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* FEED EM TEMPO REAL */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-[450px] relative overflow-hidden group">
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-brand-dark flex items-center gap-2">
                      <Activity size={20} className="text-brand-primary" /> Atividade em Tempo Real
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logs de interação do WhatsApp</p>
                  </div>
                  <button onClick={() => navigate("/monitoramento-ia")} className="text-[10px] font-black uppercase text-brand-primary bg-brand-primary/10 px-5 py-2 rounded-full hover:bg-brand-primary hover:text-brand-dark transition-all shadow-sm">
                    Monitoramento Full
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10 custom-scrollbar">
                  {recentChats.map((chat) => (
                    <div key={chat.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-brand-primary/30 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400"><User size={14} /></div>
                          <span className="text-[11px] font-black text-slate-500 uppercase italic truncate max-w-[200px]">"{chat.user_message}"</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1">
                          <Clock size={10} /> {new Date(chat.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 bg-brand-dark p-5 rounded-[2rem] shadow-xl border border-white/5">
                        <Bot size={18} className="text-brand-primary shrink-0 mt-1" />
                        <p className="text-[12px] text-brand-primary font-bold leading-relaxed">{chat.bot_response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MAIS PROCURADOS */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-[450px]">
                <div className="mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-brand-dark flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" /> Mais Procurados
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">O que os clientes querem comprar</p>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {topSearches.map((search, index) => (
                    <div key={index} className="flex justify-between items-center p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-brand-dark transition-all duration-500">
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-black ${index === 0 ? "text-brand-primary" : "text-slate-300"} group-hover:text-brand-primary`}>#{index + 1}</span>
                        <span className="text-xs font-black uppercase text-slate-600 group-hover:text-white truncate max-w-[140px]">{search.term}</span>
                      </div>
                      <div className="bg-white px-4 py-1.5 rounded-full shadow-sm group-hover:bg-brand-primary">
                        <span className="text-[10px] font-black text-brand-dark uppercase">{search.count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alertas Críticos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {rejectedItems.length > 0 && (
                  <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
                      <h2 className="text-xl font-black uppercase tracking-tighter text-brand-dark">Ações Necessárias</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rejectedItems.map((item) => (
                        <div key={item.id_produto} className="bg-white p-7 rounded-[2.5rem] border-l-8 border-red-500 border shadow-sm flex justify-between items-center group hover:-translate-y-1 transition-all">
                          <div className="max-w-[80%]">
                            <h4 className="font-bold text-sm uppercase text-brand-dark truncate">{item.nome_peca}</h4>
                            <p className="text-[11px] text-red-500 font-bold mt-2 italic">"{item.motivo_bloqueio}"</p>
                          </div>
                          <button onClick={() => navigate("/estoque")} className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-brand-dark group-hover:text-brand-primary transition-all shadow-sm">
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="bg-brand-dark p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-brand-primary/20 group-hover:rotate-12 transition-transform duration-500">
                    <MessageSquare className="text-brand-dark" size={28} />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">Atendimento<br />Automático</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">Otto AI processou <span className="text-brand-primary font-black">{metrics.chatRequests}</span> leads hoje.</p>
                  <button onClick={() => navigate("/monitoramento-ia")} className="w-full bg-brand-primary text-brand-dark py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                    Analisar Conversas <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Subcomponente de Métrica Premium
const MetricCard = ({ icon, label, value, trend, danger = false }: MetricCardProps) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-8 hover:shadow-xl transition-all duration-500 group relative overflow-hidden text-left">
    <div className="flex justify-between items-start relative z-10">
      <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-brand-primary group-hover:text-brand-dark transition-all text-slate-400">{icon}</div>
      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${danger ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>{trend}</span>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h3 className="text-4xl font-black text-brand-dark tracking-tighter">{value}</h3>
    </div>
  </div>
);

export default Dashboard;