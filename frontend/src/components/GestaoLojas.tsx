import { useState, useEffect } from 'react';
import { Loader2, Ban, CheckCircle} from 'lucide-react';
import Sidebar from './Sidebar';

import axios from 'axios';

interface StoreData {
    id: number;
    name: string;
    email: string;
    sector: string;
    status: 'active' | 'blocked';
}

const GestaoLojas = () => {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStores = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/admin/active-stores');
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao carregar lojas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStores(); }, []);

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        try {
            await axios.patch(`http://localhost:3001/api/admin/store-status/${id}`, { status: newStatus });
            setStores(stores.map(s => s.id === id ? { ...s, status: newStatus as 'active' | 'blocked' } : s));
        } catch (error) {
            console.error("Erro ao alterar status", error);
            alert("Erro ao alterar status.");
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* SIDEBAR */}
            <Sidebar role="admin" />

            {/* CONTEÚDO */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark tracking-tighter uppercase">Gestão de Lojas</h1>
                        <p className="text-slate-500 font-medium text-sm">Administre as lojas parceiras da rede Acheii</p>
                    </div>
                </header>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50 text-left">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Loja</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Ramo</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Status</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Controle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stores.map((store) => (
                                        <tr key={store.id} className="group">
                                            <td className="py-5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-brand-dark">{store.name}</span>
                                                    <span className="text-[10px] text-slate-400">{store.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 font-bold text-xs text-slate-600 uppercase tracking-tight">{store.sector}</td>
                                            <td className="py-5 px-4">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${store.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {store.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <button 
                                                    onClick={() => toggleStatus(store.id, store.status)}
                                                    className={`p-2 rounded-xl transition-all ${store.status === 'active' ? 'text-red-400 hover:bg-red-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                                                    title={store.status === 'active' ? 'Bloquear Loja' : 'Ativar Loja'}
                                                >
                                                    {store.status === 'active' ? <Ban size={20} /> : <CheckCircle size={20} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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