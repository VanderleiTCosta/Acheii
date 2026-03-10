import { useState, useEffect } from 'react';
import { Bot, User, Loader2, Cpu, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

// Interface para garantir a tipagem sênior e evitar o erro 'Unexpected any'
interface ChatLog {
    id: number;
    user_message: string;
    bot_response: string;
    context_used: string;
    created_at: string;
}

const MonitoramentoIA = () => {
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [loading, setLoading] = useState(true);

    // FUNÇÃO SÊNIOR: Encapsulada para permitir chamadas recorrentes (Polling)
    const fetchLogs = async () => {
        try {
            // CORREÇÃO: Sincronizado com a rota do server.ts
            const res = await axios.get('http://localhost:3001/api/admin/ai-logs');
            setLogs(res.data);
        } catch (e) { 
            console.error("Erro ao buscar logs da IA no servidor:", e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchLogs();
        
        // POLLING: Atualiza os logs a cada 10 segundos para monitoramento real
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-brand-dark overflow-hidden">
            <Sidebar role="admin" />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-brand-dark">Monitoramento Otto AI</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Análise em tempo real do motor de RAG</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-100">
                        <Cpu size={14} className="animate-pulse" /> Motor RAG Ativo
                    </div>
                </header>
                
                <div className="space-y-8 max-w-6xl">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="bg-white p-24 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] italic">Nenhuma interação registrada no banco de dados</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-brand-dark text-brand-primary text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Log #{log.id}</span>
                                        <span className="text-slate-300 font-black px-2">•</span>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold uppercase">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Status: 200 OK</span>
                                </div>
                                
                                {/* Pergunta do Cliente */}
                                <div className="flex gap-5 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 h-fit border border-slate-100"><User size={24}/></div>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] flex-1 border border-slate-100 relative">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Entrada do Utilizador:</p>
                                        <p className="text-base font-bold text-slate-700 leading-relaxed italic">"{log.user_message}"</p>
                                    </div>
                                </div>

                                {/* Resposta da IA */}
                                <div className="flex gap-5">
                                    <div className="bg-brand-dark p-4 rounded-2xl text-brand-primary h-fit shadow-lg"><Bot size={24}/></div>
                                    <div className="bg-brand-dark text-white p-8 rounded-[2.5rem] flex-1 shadow-2xl shadow-brand-dark/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5"><Bot size={120} /></div>
                                        <p className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4">Resposta Otto IA:</p>
                                        <p className="text-sm font-medium leading-relaxed mb-8 relative z-10">{log.bot_response}</p>
                                        
                                        {/* Detalhes do RAG */}
                                        <div className="pt-6 border-t border-white/10 relative z-10">
                                            <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest mb-3 flex items-center gap-2">
                                                <Cpu size={12}/> Contexto Recuperado (Database RAG):
                                            </p>
                                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 shadow-inner">
                                                <p className="text-[11px] text-slate-400 italic leading-relaxed">
                                                    {log.context_used || "Nenhum contexto específico foi necessário para esta resposta."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default MonitoramentoIA;