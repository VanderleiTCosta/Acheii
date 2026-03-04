import React, { useState, useEffect, useCallback } from 'react';
import { 
    ShieldCheck, Loader2, CheckCircle, XCircle, Clock, 
    Eye, X, Package, Car, DollarSign 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    store_name: string;
    vehicle: string;
    price: number;
    stock: number;
    condition_type: string;
    status: string;
}

const ValidacaoProdutos = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState({ approvedToday: 0, rejectedToday: 0 });
    const [loading, setLoading] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsRes, statsRes] = await Promise.all([
                axios.get('http://localhost:3001/api/admin/pending-products'),
                axios.get('http://localhost:3001/api/admin/validation-stats')
            ]);
            setProducts(productsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Erro na carga administrativa:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async (id: number) => {
        try {
            await axios.patch(`http://localhost:3001/api/admin/validate-product/${id}`, { 
                status: 'active',
                issue: 'OK' 
            });
            setProducts(prev => prev.filter(p => p.id !== id));
            setStats(prev => ({ ...prev, approvedToday: prev.approvedToday + 1 }));
            setSelectedProduct(null);
        } catch (error) {
            alert("Erro ao aprovar produto.");
            console.error("Erro ao aprovar produto:", error);
        }
    };

    const confirmRejection = async () => {
        if (!rejectReason) return alert("Por favor, informe o motivo.");
        try {
            await axios.patch(`http://localhost:3001/api/admin/validate-product/${selectedProduct?.id}`, { 
                status: 'rejected',
                issue: rejectReason 
            });
            setProducts(prev => prev.filter(p => p.id !== selectedProduct?.id));
            setStats(prev => ({ ...prev, rejectedToday: prev.rejectedToday + 1 }));
            setIsRejectModalOpen(false);
            setSelectedProduct(null);
            setRejectReason('');
        } catch (error) {
            alert("Erro ao rejeitar produto.");
            console.error("Erro ao rejeitar produto:", error);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
            <Sidebar role="admin" />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Validação de Produtos</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">{products.length} itens aguardando análise manual</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatusCard icon={<Clock className="text-amber-500"/>} value={products.length} label="Fila de Espera" />
                    <StatusCard icon={<CheckCircle className="text-emerald-500"/>} value={stats.approvedToday} label="Aprovados Hoje" />
                    <StatusCard icon={<XCircle className="text-red-500"/>} value={stats.rejectedToday} label="Rejeitados Hoje" />
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-5 px-8">Produto / Compatibilidade</th>
                                    <th className="py-5 px-4">Loja</th>
                                    <th className="py-5 px-4">Preço</th>
                                    <th className="py-5 px-8 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {products.length === 0 ? (
                                    <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px]">Tudo limpo!</td></tr>
                                ) : (
                                    products.map((p) => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedProduct(p)}>
                                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:text-brand-primary transition-colors"><ShieldCheck size={18} /></div>
                                                    <div>
                                                        <p className="font-bold uppercase text-sm">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{p.vehicle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-xs font-black text-slate-400 uppercase">{p.store_name}</td>
                                            {/* CORREÇÃO DO NaN AQUI */}
                                            <td className="py-6 px-4 font-black text-sm text-brand-dark">
                                                R$ {Number(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-6 px-8 text-right flex justify-end gap-2">
                                                <button onClick={() => setSelectedProduct(p)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-brand-dark hover:text-white transition-all"><Eye size={18}/></button>
                                                <button onClick={() => handleApprove(p.id)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"><CheckCircle size={18}/></button>
                                                <button onClick={() => { setSelectedProduct(p); setIsRejectModalOpen(true); }} className="p-2.5 bg-red-500 text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"><XCircle size={18}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* MODAL DE DETALHES */}
            {selectedProduct && !isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark"><X size={24}/></button>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-brand-primary/10 p-4 rounded-3xl text-brand-primary"><Package size={32}/></div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
                                <p className="text-slate-400 font-bold uppercase text-xs mt-1">Loja: {selectedProduct.store_name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <DetailItem icon={<Car className="text-blue-500"/>} label="Veículo Compatível" value={selectedProduct.vehicle} />
                            <DetailItem icon={<DollarSign className="text-emerald-500"/>} label="Preço de Venda" value={`R$ ${Number(selectedProduct.price || 0).toFixed(2)}`} />
                            <DetailItem icon={<Package className="text-amber-500"/>} label="Qtd em Estoque" value={`${selectedProduct.stock} unidades`} />
                            <DetailItem icon={<ShieldCheck className="text-purple-500"/>} label="Estado da Peça" value={selectedProduct.condition_type === 'new' ? 'Nova' : 'Usada'} />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => handleApprove(selectedProduct.id)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 shadow-xl transition-all">Aprovar Peça</button>
                            <button onClick={() => setIsRejectModalOpen(true)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 shadow-xl transition-all">Rejeitar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rejeição */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative text-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Motivo da Rejeição</h2>
                        <textarea 
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Descreva o erro..."
                            className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-brand-primary outline-none transition-all resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase">Voltar</button>
                            <button onClick={confirmRejection} className="flex-1 py-4 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase tracking-widest">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-3 mb-1">
            {icon}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <p className="font-bold text-brand-dark uppercase text-sm">{value}</p>
    </div>
);

const StatusCard = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="bg-slate-50 p-4 rounded-2xl">{icon}</div>
        <div>
            <h3 className="text-3xl font-black tracking-tighter leading-none">{value}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    </div>
);

export default ValidacaoProdutos;