import { useState, useEffect } from 'react';
import { Bot, User, Loader2, Cpu } from 'lucide-react'; // Ícones ajustados
import Sidebar from '../components/Sidebar';
import axios from 'axios';

// Interface para eliminar o erro 'Unexpected any' [cite: 2025-12-05]
interface ChatLog {
    id: number;
    user_message: string;
    bot_response: string;
    context_used: string;
    created_at: string;
}

const MonitoramentoIA = () => {
    const [logs, setLogs] = useState<ChatLog[]>([]); // Tipagem aplicada
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/admin/chat-logs');
                setLogs(res.data);
            } catch (e) { 
                console.error("Erro ao buscar logs da IA:", e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-brand-dark overflow-hidden">
            <Sidebar role="admin" />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Monitoramento Otto AI</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Análise em tempo real do motor de RAG</p>
                    </div>
                    <div className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-brand-primary/20">
                        <Cpu size={14} className="animate-pulse" /> Motor RAG Ativo
                    </div>
                </header>
                
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                    ) : logs.length === 0 ? (
                        <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100">
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhuma interação registrada ainda</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[9px] font-black uppercase bg-slate-100 px-3 py-1 rounded-lg text-slate-500 tracking-widest">Sessão #{log.id}</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                                
                                <div className="flex gap-4 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 h-fit"><User size={20}/></div>
                                    <div className="bg-slate-50 p-5 rounded-[1.5rem] flex-1">
                                        <p className="text-sm font-bold leading-relaxed">"{log.user_message}"</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="bg-brand-dark p-3 rounded-2xl text-brand-primary h-fit"><Bot size={20}/></div>
                                    <div className="bg-brand-dark text-white p-6 rounded-[1.5rem] flex-1 shadow-xl shadow-brand-dark/10">
                                        <p className="text-sm font-medium leading-relaxed mb-6">{log.bot_response}</p>
                                        
                                        <div className="pt-5 border-t border-white/10">
                                            <p className="text-[9px] font-black uppercase text-brand-primary tracking-widest mb-2 flex items-center gap-2">
                                                <Cpu size={10}/> Conhecimento Recuperado do Banco:
                                            </p>
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <p className="text-[11px] text-slate-400 italic leading-snug">{log.context_used}</p>
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