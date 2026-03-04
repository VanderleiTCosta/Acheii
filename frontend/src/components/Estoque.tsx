import React, { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, Filter, Edit3, Trash2, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

// Interfaces para tipagem forte
interface Product {
  id: number;
  name: string;
  vehicle: string;
  stock: number;
  price: number;
  status: "pending" | "active" | "rejected";
  validation_issue?: string;
  condition_type: string;
}

interface ProductFormData {
  name: string;
  vehicle: string;
  stock: number;
  price: number;
  condition_type: string;
}

const Estoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("@Acheii:user");
    return saved ? JSON.parse(saved) : { id: 0 };
  });

  const userId = user?.id;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    vehicle: "",
    stock: 0,
    price: 0,
    condition_type: "new",
  });

  const fetchEstoque = useCallback(async () => {
    if (!userId || userId === 0) {
        console.error("Usuário não identificado no localStorage.");
        setLoading(false); 
        return;
    }

    try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3001/api/store/products/${userId}`, {
            timeout: 5000 
        });
        setProducts(response.data);
    } catch (error) {
        console.error("Erro ao carregar estoque:", error);
    } finally {
        setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const savedUser = localStorage.getItem("@Acheii:user");
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.id !== user.id) setUser(parsed);
    }
    fetchEstoque();
  }, [fetchEstoque, user.id]);

  // Função para abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", vehicle: "", stock: 0, price: 0, condition_type: "new" });
    setIsModalOpen(true);
  };

  // Função para abrir modal de edição
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      vehicle: product.vehicle,
      stock: product.stock,
      price: product.price,
      condition_type: product.condition_type || "new",
    });
    setIsModalOpen(true);
  };

  // Função para Deletar Peça
  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta peça?")) {
      try {
        await axios.delete(`http://localhost:3001/api/store/products/${id}`);
        fetchEstoque();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        alert("Erro ao excluir produto.");
      }
    }
  };

  // Função Unificada para Salvar (Create ou Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`http://localhost:3001/api/store/products/${editingProduct.id}`, formData);
        alert("Produto atualizado com sucesso!");
      } else {
        await axios.post("http://localhost:3001/api/store/products", {
          ...formData,
          user_id: userId,
        });
        alert("Produto enviado para validação!");
      }
      setIsModalOpen(false);
      fetchEstoque(); 
    } catch (error) {
      console.error("Erro ao salvar produto:", error);  
      alert("Erro ao salvar produto.");
    }
  };

  // Filtro de busca em tempo real
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
      <Sidebar role="user" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Meu Estoque</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Gerencie suas peças e acompanhe a validação do Otto</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-brand-primary text-brand-dark px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-primary/20 flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Cadastrar Peça
          </button>
        </header>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold text-sm"
              placeholder="Buscar por nome ou veículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white p-4 rounded-2xl border border-slate-100 text-slate-400 hover:text-brand-dark transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-5 px-8">Peça / Veículo</th>
                    <th className="py-5 px-4 text-center">Qtd</th>
                    <th className="py-5 px-4">Preço</th>
                    <th className="py-5 px-4">Status</th>
                    <th className="py-5 px-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                        {userId === 0 ? "Faça login para ver seu estoque" : `Nenhum produto encontrado`}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 px-8 text-brand-dark font-bold">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Package size={20} /></div>
                            <div>
                              <p className="uppercase text-sm leading-tight">{p.name}</p>
                              <p className="text-[10px] text-slate-400 tracking-tighter uppercase">{p.vehicle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center font-bold text-slate-600">{p.stock}</td>
                        <td className="py-6 px-4 font-black">R$ {Number(p.price).toFixed(2)}</td>
                        <td className="py-6 px-4"><StatusBadge status={p.status} issue={p.validation_issue} /></td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2 text-slate-300">
                            <button onClick={() => handleOpenEditModal(p)} className="p-2 hover:bg-slate-100 hover:text-brand-dark rounded-lg transition-all"><Edit3 size={18} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"><Trash2 size={18} /></button>
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

      {/* Modal Unificado (Cadastro e Edição) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-brand-dark transition-colors"><X /></button>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{editingProduct ? "Editar Peça" : "Cadastrar Peça"}</h2>
            <p className="text-slate-400 text-xs font-medium mb-8 uppercase tracking-widest">{editingProduct ? "Altere os campos necessários" : "Mande os dados para a IA Otto processar"}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={formData.name} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Nome da Peça" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input required value={formData.vehicle} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Veículo (Ex: Fiat Siena 2012)" onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" value={formData.stock} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Estoque" onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                <input required type="number" step="0.01" value={formData.price} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Preço" onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
              </div>
              <button type="submit" className="w-full py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl mt-4 active:scale-95">
                {editingProduct ? "Salvar Alterações" : "Enviar para Validação"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status, issue }: { status: string; issue?: string }) => {
  if (status === "active") return (
      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase border border-emerald-100 flex items-center gap-1.5 w-fit">
        <CheckCircle2 size={12} /> Ativo
      </span>
  );
  if (status === "pending") return (
      <div className="flex flex-col gap-1">
        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase border border-amber-100 flex items-center gap-1.5 w-fit">
          <Loader2 size={12} className="animate-spin" /> Pendente
        </span>
        {issue && issue !== "OK" && <span className="text-[8px] text-amber-700 font-bold ml-1 italic">*{issue}</span>}
      </div>
    );
  return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase border border-red-100 flex items-center gap-1.5 w-fit"><AlertCircle size={12} /> Rejeitado</span>;
};

export default Estoque;