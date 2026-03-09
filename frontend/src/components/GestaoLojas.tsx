import { useState, useEffect, useCallback } from 'react';
import { Loader2, Ban, CheckCircle, Smartphone, ShieldCheck, CreditCard } from 'lucide-react';
import Sidebar from './Sidebar';
import axios from 'axios';

// Interface sincronizada com o novo modelo relacional da tabela LOJAS
interface StoreData {
    id: string; // UUID (string) conforme novo banco
    name: string;
    email: string;
    whatsapp: string;
    status: 'ativo' | 'inativo';
    plano: 'basico' | 'premium';
}

const GestaoLojas = () => {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);

    // Função de carregamento memorizada com useCallback para performance sênior
    const fetchStores = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3001/api/admin/active-stores');
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao carregar lojas parceiras:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchStores(); 
    }, [fetchStores]);

    // Função para alternar entre Ativo e Inativo (Aprovação/Bloqueio)
    const toggleStatus = async (id: string, currentStatus: string) => {
        const action = currentStatus === 'ativo' ? 'bloquear' : 'ativar';
        if (!window.confirm(`Deseja realmente ${action} esta loja?`)) return;

        try {
            // Utiliza a rota de aprovação para alternar o status no banco
            await axios.post(`http://localhost:3001/api/admin/approve-store/${id}`);
            
            // Atualização otimista da UI
            setStores(prev => prev.map(s => 
                s.id === id ? { ...s, status: s.status === 'ativo' ? 'inativo' : 'ativo' } : s
            ));
            
            alert(`Loja atualizada com sucesso!`);
        } catch (error) {
            console.error("Erro ao alterar status da loja:", error);
            alert("Erro ao processar alteração de status.");
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-brand-dark">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Gestão de Parceiros</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Controle de acesso e planos das lojas Acheii</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        <ShieldCheck className="text-brand-primary" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Painel Administrativo</span>
                    </div>
                </header>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sincronizando base de dados...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Parceiro / Contato</th>
                                        <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Plano</th>
                                        <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Status</th>
                                        <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stores.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-slate-300 font-bold uppercase text-xs">Nenhum parceiro cadastrado no sistema.</td>
                                        </tr>
                                    ) : (
                                        stores.map((store) => (
                                            <tr key={store.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 px-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-sm uppercase tracking-tight leading-none">{store.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] text-slate-400 font-bold">{store.email}</span>
                                                            <div className="flex items-center gap-1 text-emerald-500 font-black text-[9px]">
                                                                <Smartphone size={10} />
                                                                {store.whatsapp}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${
                                                        store.plano === 'premium' 
                                                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        <CreditCard size={12} />
                                                        {store.plano}
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                                        store.status === 'ativo' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        {store.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => toggleStatus(store.id, store.status)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                                                                store.status === 'ativo' 
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            }`}
                                                            title={store.status === 'ativo' ? 'Bloquear Acesso' : 'Liberar Acesso'}
                                                        >
                                                            {store.status === 'ativo' ? (
                                                                <><Ban size={14} /> Bloquear</>
                                                            ) : (
                                                                <><CheckCircle size={14} /> Liberar</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GestaoLojas;