import React, { useState, useEffect, useCallback } from 'react';
import { 
    Loader2, CheckCircle, XCircle, 
    Search, Store, Package, X, Trash2, Ban, Eye, Car, DollarSign, ShieldCheck
} from 'lucide-react'; 
import axios from 'axios';
import Sidebar from '../components/Sidebar';

interface StorePending {
    id: number;
    name: string;
    sector: string;
}

interface Product {
    id: number;
    name: string;
    store_name: string;
    vehicle: string;
    price: number | string;
    stock: number;
    condition_type: string;
    status: string;
}

const DashboardAdmin = () => {
    const [stores, setStores] = useState<StorePending[]>([]);
    const [activeProducts, setActiveProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState({ approvedToday: 0, rejectedToday: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para Modais de Detalhes e Bloqueio
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
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleApproveStore = async (id: number) => {
        try {
            await axios.post(`http://localhost:3001/api/admin/approve-store/${id}`);
            setStores(prev => prev.filter(s => s.id !== id));
            alert("Loja aprovada com sucesso!");
        } catch (error) {
            alert("Erro ao aprovar loja.");
            console.error("Erro ao aprovar loja:", error);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm("Deseja excluir permanentemente este produto?")) return;
        try {
            await axios.delete(`http://localhost:3001/api/store/products/${id}`);
            setActiveProducts(prev => prev.filter(p => p.id !== id));
            setSelectedProduct(null);
            alert("Produto removido definitivamente.");
        } catch (error) { 
            alert("Erro ao excluir produto.");
            console.error("Erro ao excluir produto:", error);
        }
    };

    const handleOpenBlockModal = (product: Product) => {
        setSelectedProduct(product);
        setIsRejectModalOpen(true);
    };

    const confirmBlockAction = async () => {
        if (!rejectReason) return alert("Informe o motivo do bloqueio.");
        try {
            await axios.patch(`http://localhost:3001/api/admin/validate-product/${selectedProduct?.id}`, { 
                status: 'rejected', 
                issue: rejectReason 
            });
            setActiveProducts(prev => prev.filter(p => p.id !== selectedProduct?.id));
            setStats(prev => ({ ...prev, rejectedToday: prev.rejectedToday + 1 }));
            setIsRejectModalOpen(false);
            setSelectedProduct(null);
            setRejectReason('');
            alert("Produto bloqueado e removido do marketplace.");
        } catch (error) { 
            alert("Erro ao bloquear produto.");
            console.error("Erro ao bloquear produto:", error);
        }
    };

    const filteredActive = activeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.store_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Dashboard Global</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Gestão de ativos e parceiros Acheii</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatusCard icon={<Store className="text-brand-primary"/>} value={stores.length} label="Lojas Pendentes" />
                    <StatusCard icon={<Package className="text-blue-500"/>} value={activeProducts.length} label="Total Ativos" />
                    <StatusCard icon={<CheckCircle className="text-emerald-500"/>} value={stats.approvedToday} label="Aprovados Hoje" />
                    <StatusCard icon={<XCircle className="text-red-500"/>} value={stats.rejectedToday} label="Rejeitados Hoje" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* Novos Parceiros */}
                    <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[700px]">
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <Store className="text-brand-primary" size={20}/> Novos Parceiros
                        </h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
                            ) : stores.length === 0 ? (
                                <p className="text-slate-400 text-xs font-bold uppercase py-10 text-center italic">Nenhuma loja pendente</p>
                            ) : (
                                stores.map(store => (
                                    <div key={store.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="font-bold text-sm uppercase">{store.name}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase mb-4">{store.sector}</p>
                                        <button 
                                            onClick={() => handleApproveStore(store.id)}
                                            className="w-full py-2.5 bg-brand-dark text-brand-primary text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-lg"
                                        >
                                            Aprovar Loja
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* MARKETPLACE ATIVO COM VISUALIZAÇÃO E AÇÕES */}
                    <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[700px] flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Marketplace Ativo</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-xs font-bold font-sans" 
                                    placeholder="Buscar peça ou loja..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white z-10 border-b border-slate-50">
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="pb-4 px-4">Produto / Loja</th>
                                            <th className="pb-4 px-4 text-right">Preço</th>
                                            <th className="pb-4 px-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredActive.map(p => (
                                            <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-5 px-4">
                                                    <p className="font-bold text-sm uppercase">{p.name}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{p.store_name}</p>
                                                </td>
                                                {/* PREÇO CORRIGIDO */}
                                                <td className="py-5 px-4 text-right font-black text-sm text-brand-dark">
                                                    R$ {parseFloat(String(p.price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {/* BOTÕES SEMPRE VISÍVEIS */}
                                                        <button onClick={() => setSelectedProduct(p)} title="Ver Detalhes" className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-brand-dark hover:text-white transition-all"><Eye size={14}/></button>
                                                        <button onClick={() => handleOpenBlockModal(p)} title="Bloquear" className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><Ban size={14}/></button>
                                                        <button onClick={() => handleDeleteProduct(p.id)} title="Excluir" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL DE DETALHES UNIFICADO */}
            {selectedProduct && !isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark transition-colors"><X size={24}/></button>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-brand-primary/10 p-4 rounded-3xl text-brand-primary"><Package size={32}/></div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
                                <p className="text-slate-400 font-bold uppercase text-xs mt-1">Loja: {selectedProduct.store_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <DetailItem icon={<Car className="text-blue-500"/>} label="Veículo" value={selectedProduct.vehicle} />
                            <DetailItem icon={<DollarSign className="text-emerald-500"/>} label="Preço" value={`R$ ${parseFloat(String(selectedProduct.price || 0)).toFixed(2)}`} />
                            <DetailItem icon={<Package className="text-amber-500"/>} label="Estoque" value={`${selectedProduct.stock} un`} />
                            <DetailItem icon={<ShieldCheck className="text-purple-500"/>} label="Condição" value={selectedProduct.condition_type === 'new' ? 'Nova' : 'Usada'} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleOpenBlockModal(selectedProduct)} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all">Bloquear Peça</button>
                            <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all">Excluir Produto</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rejeição/Bloqueio Motivo */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative text-center animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-brand-dark transition-colors"><X size={24} /></button>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-brand-dark">Confirmar Bloqueio</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-6 tracking-widest">Item: {selectedProduct?.name}</p>
                        <textarea 
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} 
                            placeholder="Descreva o motivo do bloqueio para o lojista..." 
                            className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-brand-primary outline-none transition-all resize-none mb-6" 
                        />
                        <button onClick={confirmBlockAction} className="w-full py-4 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl">Confirmar Bloqueio</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-3 mb-1">{icon}<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span></div>
        <p className="font-bold text-brand-dark uppercase text-sm">{value}</p>
    </div>
);

const StatusCard = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all">
        <div className="bg-slate-50 p-4 rounded-2xl">{icon}</div>
        <div>
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">{value}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none">{label}</p>
        </div>
    </div>
);

export default DashboardAdmin;