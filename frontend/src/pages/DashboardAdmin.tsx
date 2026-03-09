import React, { useState, useEffect, useCallback } from 'react';
import { 
    Loader2, CheckCircle, XCircle, 
    Search, Store, Package, X, Trash2, Eye, Info, Hash, Image as ImageIcon, CarFront, Calendar
} from 'lucide-react'; 
import axios from 'axios';
import Sidebar from '../components/Sidebar';

interface StorePending {
    id: string; 
    name: string;
    sector: string;
}

interface Product {
    id: string;
    name: string;
    store_name: string;
    vehicle: string;
    modelo_veiculo: string;
    price: number | string;
    stock: number;
    condition_type: string;
    status: string;
    fotos?: string;
    aplicacao_veiculo?: string;
    ano_inicio: number;
    ano_fim: number;
    codigo_interno?: string;
}

const DashboardAdmin = () => {
    const [stores, setStores] = useState<StorePending[]>([]);
    const [activeProducts, setActiveProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState({ approvedToday: 0, rejectedToday: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [storesRes, activeRes, statsRes] = await Promise.all([
                axios.get('http://localhost:3001/api/admin/pending-stores'),
                axios.get('http://localhost:3001/api/admin/active-products'),
                axios.get('http://localhost:3001/api/admin/validation-stats')
            ]);

            setStores(storesRes.data);
            setActiveProducts(activeRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Erro ao carregar dashboard administrativo:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleApproveStore = async (id: string) => {
        try {
            await axios.post(`http://localhost:3001/api/admin/approve-store/${id}`);
            setStores(prev => prev.filter(s => s.id !== id));
            alert("Loja aprovada com sucesso!");
        } catch (error) {
            console.error("Erro ao aprovar loja:", error);
            alert("Erro ao aprovar loja.");
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm("Deseja excluir permanentemente este produto do Marketplace?")) return;
        try {
            await axios.delete(`http://localhost:3001/api/store/products/${id}`);
            setActiveProducts(prev => prev.filter(p => p.id !== id));
            setSelectedProduct(null);
            alert("Produto removido.");
        } catch (error) { 
            console.error("Erro ao excluir produto:", error);
            alert("Erro ao excluir produto.");
        }
    };

    // FUNÇÃO DE BLOQUEIO FUNCIONAL
    const confirmBlockAction = async () => {
        if (!rejectReason) return alert("Informe o motivo do bloqueio.");
        if (!selectedProduct) return;

        try {
            // PATCH sincronizado com a rota de validação do server.ts
            await axios.patch(`http://localhost:3001/api/admin/validate-product/${selectedProduct.id}`, { 
                status: 'rejected', 
                issue: rejectReason 
            });

            // Atualização imediata do estado (UX Sênior)
            setActiveProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            setStats(prev => ({ ...prev, rejectedToday: prev.rejectedToday + 1 }));
            
            // Reset de estados
            setIsRejectModalOpen(false);
            setSelectedProduct(null);
            setRejectReason('');
            
            alert("Produto bloqueado com sucesso. O lojista receberá o motivo.");
        } catch (error) { 
            console.error("Erro ao bloquear produto:", error);
            alert("Erro ao processar o bloqueio no servidor.");
        }
    };

    const filteredActive = activeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.store_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-brand-primary mx-auto mb-4" size={48} />
                    <p className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Sincronizando Marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-brand-dark">Administração Global</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Gestão de parceiros e curadoria de estoque</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatusCard icon={<Store className="text-brand-primary"/>} value={stores.length} label="Lojas Pendentes" />
                    <StatusCard icon={<Package className="text-blue-500"/>} value={activeProducts.length} label="Peças Ativas" />
                    <StatusCard icon={<CheckCircle className="text-emerald-500"/>} value={stats.approvedToday} label="Aprovados Hoje" />
                    <StatusCard icon={<XCircle className="text-red-500"/>} value={stats.rejectedToday} label="Bloqueados Hoje" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[700px]">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Store className="text-brand-primary" size={20}/> Solicitações</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {stores.length === 0 ? (
                                <p className="text-center text-slate-400 text-[10px] font-black uppercase py-20 italic">Sem novas solicitações</p>
                            ) : (
                                stores.map(store => (
                                    <div key={store.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-left duration-300">
                                        <p className="font-bold text-sm uppercase leading-tight">{store.name}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase mb-4 mt-1">{store.sector}</p>
                                        <button onClick={() => handleApproveStore(store.id)} className="w-full py-3 bg-brand-dark text-brand-primary text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Aprovar Lojista</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[700px] flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Marketplace Ativo</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold font-sans" 
                                    placeholder="Filtrar por peça ou loja..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto text-sans">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10 border-b">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="pb-4 px-4">Peça / Lojista</th>
                                        <th className="pb-4 px-4 text-right">Preço</th>
                                        <th className="pb-4 px-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sans">
                                    {filteredActive.map(p => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-4">
                                                <p className="font-bold text-sm uppercase text-brand-dark leading-none mb-1">{p.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{p.store_name}</p>
                                            </td>
                                            <td className="py-5 px-4 text-right font-black text-sm text-brand-dark">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.price || 0))}
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex justify-end gap-2 text-sans">
                                                    <button onClick={() => setSelectedProduct(p)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-brand-dark hover:text-brand-primary transition-all"><Eye size={14}/></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL DE DETALHES - SINCRONIZADO COM ESTOQUE */}
            {selectedProduct && !isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans text-brand-dark">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] p-12 shadow-2xl relative flex flex-col md:flex-row gap-12 animate-in zoom-in duration-300">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark transition-colors"><X size={32}/></button>
                        
                        <div className="w-full md:w-5/12">
                            <div className="aspect-square bg-slate-100 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl relative">
                                {selectedProduct.fotos ? (
                                    <img src={selectedProduct.fotos} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <ImageIcon size={80} className="text-slate-200" />
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-100">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark italic">Preview Administrativo</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-7/12 flex flex-col justify-center text-sans">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full w-fit ${selectedProduct.condition_type === 'nova' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 border' : 'bg-amber-50 text-amber-600 border-amber-100 border'}`}>
                                    Peça {selectedProduct.condition_type}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <Hash size={10}/> REF: {selectedProduct.codigo_interno || 'SEM SKU'}
                                </span>
                            </div>

                            <h2 className="text-5xl font-black uppercase tracking-tighter leading-tight mb-2 text-brand-dark">{selectedProduct.name}</h2>
                            <p className="text-slate-400 font-bold uppercase text-xs mb-8 flex items-center gap-2">
                                <Store size={14} className="text-brand-primary"/> Loja: <span className="text-brand-dark">{selectedProduct.store_name}</span>
                            </p>
                            
                            <p className="text-brand-primary font-black text-4xl mb-10">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedProduct.price))}
                            </p>

                            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8 mb-8 text-sans">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><CarFront size={20}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-sans">Veículo</p>
                                        <p className="font-black uppercase text-sm">{selectedProduct.vehicle}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><Calendar size={20}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-sans">Compatibilidade</p>
                                        <p className="font-black uppercase text-sm">{selectedProduct.ano_inicio} a {selectedProduct.ano_fim}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-10 leading-relaxed text-sans">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-widest">
                                    <Info size={14} className="text-brand-primary"/> Detalhes Técnicos e Aplicação
                                </p>
                                <p className="font-bold text-slate-600 text-sm leading-relaxed">
                                    {selectedProduct.aplicacao_veiculo || 'Nenhuma aplicação técnica detalhada informada.'}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="flex-1 py-5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 border border-red-100">Excluir Permanente</button>
                                <button onClick={() => setIsRejectModalOpen(true)} className="flex-1 py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Bloquear Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Bloqueio (Motivo) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 font-sans text-brand-dark">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative text-center animate-in zoom-in duration-200">
                        <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-brand-dark transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-brand-dark">Confirmar Bloqueio</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-8 tracking-widest italic">{selectedProduct?.name}</p>
                        <textarea 
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} 
                            placeholder="Descreva o motivo para o lojista..." 
                            className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-sm font-bold focus:border-brand-primary outline-none transition-all resize-none mb-8 font-sans" 
                        />
                        <button onClick={confirmBlockAction} className="w-full py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Confirmar Bloqueio</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusCard = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all group animate-in fade-in duration-500">
        <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-brand-primary/10 transition-colors">{icon}</div>
        <div>
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">{value}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none">{label}</p>
        </div>
    </div>
);

export default DashboardAdmin;