import React, { useState, useEffect, useCallback } from 'react';
import { 
    Loader2, AlertCircle, CheckCircle, XCircle, 
    Search, Store, Package, X, Trash2, Eye, Info, Hash, Image as ImageIcon, CarFront, Calendar, Layers
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
    categoria: string; // Adicionado para curadoria
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

    const confirmBlockAction = async () => {
        if (!rejectReason) return alert("Informe o motivo do bloqueio.");
        if (!selectedProduct) return;

        try {
            await axios.patch(`http://localhost:3001/api/admin/validate-product/${selectedProduct.id}`, { 
                status: 'rejected', 
                issue: rejectReason 
            });

            setActiveProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            setStats(prev => ({ ...prev, rejectedToday: prev.rejectedToday + 1 }));
            
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
        p.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo_interno && p.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-brand-primary mx-auto mb-4" size={48} />
                    <p className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Acheii Admin: Sincronizando Ecossistema...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-brand-dark">Curadoria Marketplace</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest leading-none">Gestão global Acheii Pro</p>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-dark text-brand-primary px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div> Admin Mode Ativo
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatusCard icon={<Store className="text-brand-primary"/>} value={stores.length} label="Lojas Pendentes" />
                    <StatusCard icon={<Package className="text-blue-500"/>} value={activeProducts.length} label="Total Peças Ativas" />
                    <StatusCard icon={<CheckCircle className="text-emerald-500"/>} value={stats.approvedToday} label="Aprovados (Geral)" />
                    <StatusCard icon={<XCircle className="text-red-500"/>} value={stats.rejectedToday} label="Bloqueios (Geral)" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[700px]">
                        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Store className="text-brand-primary" size={20}/> Validação de Lojas</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {stores.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                                    <Store size={40} className="mb-2 text-slate-300"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sem solicitações</p>
                                </div>
                            ) : (
                                stores.map(store => (
                                    <div key={store.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-left duration-300 hover:border-brand-primary/30 transition-all group">
                                        <p className="font-bold text-sm uppercase leading-tight group-hover:text-brand-dark">{store.name}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase mb-4 mt-1">Setor: {store.sector}</p>
                                        <button onClick={() => handleApproveStore(store.id)} className="w-full py-3 bg-brand-dark text-brand-primary text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Aprovar Credencial</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[700px] flex flex-col relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">Monitoramento de Estoque</h2>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold font-sans focus:ring-2 focus:ring-brand-primary/20 transition-all" 
                                    placeholder="Buscar por nome, loja ou SKU..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10 border-b border-slate-50">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="pb-4 px-4">Produto / Lojista</th>
                                        <th className="pb-4 px-4">Categoria</th>
                                        <th className="pb-4 px-4 text-right">Preço</th>
                                        <th className="pb-4 px-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredActive.map(p => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                                        {p.fotos ? <img src={p.fotos} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={14} className="text-slate-300"/>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <p className="font-bold text-xs uppercase text-brand-dark leading-none truncate max-w-[150px]">{p.name}</p>
                                                            {p.codigo_interno && (
                                                                <span className="bg-slate-100 text-slate-500 text-[7px] px-1 py-0.5 rounded font-black border border-slate-200">#{p.codigo_interno}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase truncate">Loja: {p.store_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{p.categoria || 'Peça'}</span>
                                            </td>
                                            <td className="py-5 px-4 text-right font-black text-xs text-brand-dark">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.price || 0))}
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => setSelectedProduct(p)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-brand-dark hover:text-brand-primary transition-all active:scale-90"><Eye size={14}/></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-300 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"><Trash2 size={14}/></button>
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
                <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans text-brand-dark animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] p-12 shadow-2xl relative flex flex-col md:flex-row gap-12 animate-in zoom-in duration-300">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark transition-colors"><X size={32}/></button>
                        
                        <div className="w-full md:w-5/12">
                            <div className="aspect-square bg-slate-100 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl relative">
                                {selectedProduct.fotos ? (
                                    <img src={selectedProduct.fotos} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <ImageIcon size={80} className="text-slate-200" />
                                )}
                                <div className="absolute top-4 left-4 bg-brand-dark/90 backdrop-blur px-3 py-1.5 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary italic flex items-center gap-1.5"><Eye size={10}/> Preview do Admin</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-7/12 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full w-fit ${selectedProduct.condition_type === 'nova' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 border' : 'bg-amber-50 text-amber-600 border-amber-100 border'}`}>
                                    {selectedProduct.condition_type}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <Layers size={10} className="text-brand-primary"/> {selectedProduct.categoria || 'Geral'}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <Hash size={10}/> SKU: {selectedProduct.codigo_interno || 'N/A'}
                                </span>
                            </div>

                            <h2 className="text-5xl font-black uppercase tracking-tighter leading-tight mb-2 text-brand-dark">{selectedProduct.name}</h2>
                            <p className="text-slate-400 font-bold uppercase text-xs mb-8 flex items-center gap-2">
                                <Store size={14} className="text-brand-primary"/> Lojista Responsável: <span className="text-brand-dark underline underline-offset-4">{selectedProduct.store_name}</span>
                            </p>
                            
                            <p className="text-brand-primary font-black text-4xl mb-10 tracking-tighter">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedProduct.price))}
                            </p>

                            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><CarFront size={20}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Aplicação Veicular</p>
                                        <p className="font-black uppercase text-sm">{selectedProduct.vehicle} {selectedProduct.modelo_veiculo}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><Calendar size={20}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Range de Anos</p>
                                        <p className="font-black uppercase text-sm">{selectedProduct.ano_inicio} — {selectedProduct.ano_fim}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-10 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-widest">
                                    <Info size={14} className="text-brand-primary"/> Especificações Técnicas
                                </p>
                                <p className="font-bold text-slate-600 text-sm leading-relaxed italic">
                                    "{selectedProduct.aplicacao_veiculo || 'O lojista não detalhou aplicações específicas.'}"
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="flex-1 py-5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 border border-red-100 flex items-center justify-center gap-2">
                                    <Trash2 size={16}/> Banir Produto
                                </button>
                                <button onClick={() => setIsRejectModalOpen(true)} className="flex-1 py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                                    <XCircle size={16}/> Aplicar Bloqueio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Bloqueio (Motivo) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md flex items-center justify-center z-[1000] p-4 font-sans text-brand-dark animate-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative text-center">
                        <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-brand-dark transition-colors"><X size={24} /></button>
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                            <AlertCircle size={32} className="text-red-500"/>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-brand-dark">Motivo do Bloqueio</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-8 tracking-widest italic leading-relaxed px-4">Explique ao lojista por que a peça "{selectedProduct?.name}" foi retirada do ar.</p>
                        <textarea 
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} 
                            placeholder="Ex: Foto de baixa qualidade ou aplicação incompatível..." 
                            className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-sm font-bold focus:border-brand-primary outline-none transition-all resize-none mb-8 font-sans" 
                        />
                        <button onClick={confirmBlockAction} className="w-full py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Bloquear Agora</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusCard = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all group animate-in fade-in duration-500">
        <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-brand-primary/10 transition-colors shrink-0">{icon}</div>
        <div className="min-w-0">
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">{value}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none truncate">{label}</p>
        </div>
    </div>
);

export default DashboardAdmin;