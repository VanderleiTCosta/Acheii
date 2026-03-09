import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  X,
  Image as ImageIcon,
  Info,
  CarFront,
  Upload,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  MinusCircle,
  Hash, // Ícone para o SKU
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ImportadorEstoque from "../components/ImportadorEstoque";
import axios, { AxiosError } from "axios";

// CATEGORIAS PROFISSIONAIS: Mantidas para organização sênior
const CATEGORIAS_AUTOPECAS = [
  "Mecânica",
  "Lataria / Carroceria",
  "Elétrica",
  "Suspensão e Direção",
  "Freios",
  "Arrefecimento",
  "Iluminação",
  "Acabamento Interno",
  "Pneus e Rodas",
  "Transmissão",
  "Acessórios"
];

interface Product {
  id_produto: string;
  id_loja: string;
  nome_peca: string;
  fabricante: string;
  categoria: string;
  codigo_interno?: string;
  aplicacao_veiculo?: string;
  marca_veiculo: string;
  modelo_veiculo: string;
  ano_inicio: number;
  ano_fim: number;
  quantidade: number;
  preco: number;
  fotos?: string;
  condicao: string;
  motivo_bloqueio?: string;
  status: string;
}

const Estoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showImportador, setShowImportador] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user] = useState(() => {
    const saved = localStorage.getItem("@Acheii:user");
    return saved ? JSON.parse(saved) : { id: "" };
  });

  const userId = user?.id;

  const initialFormState = {
    nome_peca: "",
    fabricante: "",
    categoria: "", 
    codigo_interno: "",
    aplicacao_veiculo: "",
    marca_veiculo: "",
    modelo_veiculo: "",
    ano_inicio: "" as string | number,
    ano_fim: "" as string | number,
    quantidade: "" as string | number,
    preco: "" as string | number,
    fotos: "",
    condicao: "nova",
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchEstoque = useCallback(async () => {
    if (!userId) return setLoading(false);
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/api/store/products/${userId}`,
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  const handleQuickStockUpdate = async (
    id: string,
    current: number,
    delta: number,
  ) => {
    const newStock = Math.max(0, current + delta);
    try {
      await axios.patch(
        `http://localhost:3001/api/store/products/stock/${id}`,
        { quantity: newStock },
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id_produto === id ? { ...p, quantidade: newStock } : p,
        ),
      );
    } catch (error) {
      console.error("Erro ao atualizar estoque rápido:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Imagem muito grande! Máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, fotos: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nome_peca: product.nome_peca || "",
      fabricante: product.fabricante || "",
      categoria: product.categoria || "",
      codigo_interno: product.codigo_interno ?? "",
      aplicacao_veiculo: product.aplicacao_veiculo ?? "",
      marca_veiculo: product.marca_veiculo || "",
      modelo_veiculo: product.modelo_veiculo || "",
      ano_inicio: product.ano_inicio || "",
      ano_fim: product.ano_fim || "",
      quantidade: product.quantidade,
      preco: product.preco,
      fotos: product.fotos ?? "",
      condicao: product.condicao || "nova",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria) return alert("Por favor, selecione uma categoria.");

    try {
      const payload = {
        ...formData,
        user_id: userId,
        ano_inicio: Number(formData.ano_inicio) || 0,
        ano_fim: Number(formData.ano_fim) || 0,
        quantidade: Number(formData.quantidade) || 0,
        preco: Number(formData.preco) || 0,
      };

      if (editingProduct) {
        await axios.put(
          `http://localhost:3001/api/store/products/${editingProduct.id_produto}`,
          payload,
        );
      } else {
        await axios.post("http://localhost:3001/api/store/products", payload);
      }

      setIsModalOpen(false);
      fetchEstoque();
      alert("Operação realizada com sucesso!");
    } catch (error: unknown) {
      const err = error as AxiosError;
      if (err.response?.status === 413) {
        alert("Erro 413: A imagem é muito grande.");
      } else {
        alert("Erro ao salvar produto no servidor.");
      }
    }
  };

  // BUSCA: Agora filtra também pelo Código Interno (SKU)
  const filteredProducts = products.filter(
    (p) =>
      p.nome_peca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modelo_veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_interno && p.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-brand-dark">
      <Sidebar role="user" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-brand-dark">
              Meu Inventário
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-wider">
              Gestão central de estoque Acheii Pro
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportador(!showImportador)}
              className="bg-white text-brand-dark border border-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet size={16} className="text-emerald-500" />
              {showImportador ? "Fechar Importador" : "Importar Planilha"}
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-brand-primary text-brand-dark px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all"
            >
              <Plus size={18} /> Nova Peça
            </button>
          </div>
        </header>

        {showImportador && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <ImportadorEstoque
              userId={userId || ""}
              onComplete={fetchEstoque}
              onClose={() => setShowImportador(false)}
            />
          </div>
        )}

        <div className="relative mb-8">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold text-sm"
            placeholder="Buscar por peça, SKU, marca ou veículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-5 px-8">Foto / Produto</th>
                    <th className="py-5 px-4 text-center">Condição</th>
                    <th className="py-5 px-4 text-center">Estoque Atual</th>
                    <th className="py-5 px-4">Preço</th>
                    <th className="py-5 px-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((p) => (
                    <tr
                      key={p.id_produto}
                      className="group hover:bg-slate-50/50 transition-colors font-bold"
                    >
                      <td className="py-6 px-8 uppercase text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {p.fotos ? (
                              <img
                                src={p.fotos}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <ImageIcon className="text-slate-300" size={24} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="leading-none text-brand-dark">{p.nome_peca}</p>
                                {/* EXIBIÇÃO SKU NA TABELA */}
                                {p.codigo_interno && (
                                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black border border-slate-200 flex items-center gap-1 shadow-sm">
                                        <Hash size={8}/>{p.codigo_interno}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-black">
                              {p.marca_veiculo} • {p.modelo_veiculo}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`text-[9px] px-2 py-1 rounded-md uppercase border font-black ${p.condicao === "nova" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}
                          >
                            {p.condicao}
                          </span>
                          {p.status === "rejected" && (
                            <span className="text-[7px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse shadow-sm shadow-red-200">
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-6 px-4 text-center">
                        <div
                          className={`inline-flex items-center gap-3 p-2 rounded-xl border ${p.quantidade < 5 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}
                        >
                          <button
                            onClick={() =>
                              handleQuickStockUpdate(
                                p.id_produto,
                                p.quantidade,
                                -1,
                              )
                            }
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <MinusCircle size={18} />
                          </button>
                          <span
                            className={`text-sm font-black w-6 ${p.quantidade < 5 ? "text-red-600" : "text-slate-700"}`}
                          >
                            {p.quantidade}
                          </span>
                          <button
                            onClick={() =>
                              handleQuickStockUpdate(
                                p.id_produto,
                                p.quantidade,
                                1,
                              )
                            }
                            className="text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <PlusCircle size={18} />
                          </button>
                        </div>
                        {p.quantidade < 5 && (
                          <p className="text-[7px] font-black text-red-400 uppercase mt-1">
                            Reposição!
                          </p>
                        )}
                      </td>

                      <td className="py-6 px-4 font-black text-brand-dark">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(p.preco)}
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-brand-dark rounded-lg transition-all"
                          >
                            <Info size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-brand-primary rounded-lg transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Excluir item?")) {
                                await axios.delete(
                                  `http://localhost:3001/api/store/products/${p.id_produto}`,
                                );
                                fetchEstoque();
                              }
                            }}
                            className="p-2 bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row gap-10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-brand-dark transition-colors"
            >
              <X size={24} />
            </button>
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-4 self-start">
                Imagem da Peça
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
              >
                {formData.fotos ? (
                  <img
                    src={formData.fotos}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <>
                    <Upload className="text-slate-300 mb-2" size={40} />
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center px-4">
                      Clique para selecionar
                    </span>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
              <h2 className="text-2xl font-black uppercase mb-6 tracking-tighter">
                {editingProduct ? "Editar Produto" : "Novo Cadastro"}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                    Descrição do Produto
                  </label>
                  <input
                    required
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ex: Bomba de Óleo"
                    value={formData.nome_peca}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_peca: e.target.value })
                    }
                  />
                </div>
                
                {/* CAMPO SKU NO CADASTRO */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                    Código Interno / SKU
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ex: SKU-9901"
                    value={formData.codigo_interno}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codigo_interno: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                    Fabricante
                  </label>
                  <input
                    required
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ex: Bosch"
                    value={formData.fabricante}
                    onChange={(e) =>
                      setFormData({ ...formData, fabricante: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                    Categoria da Peça
                  </label>
                  <select
                    required
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none appearance-none focus:ring-2 focus:ring-brand-primary/20"
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                  >
                    <option value="" disabled>Selecione...</option>
                    {CATEGORIAS_AUTOPECAS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Condição</label>
                  <select
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none"
                    value={formData.condicao}
                    onChange={(e) =>
                      setFormData({ ...formData, condicao: e.target.value })
                    }
                  >
                    <option value="nova">Nova</option>
                    <option value="usada">Usada</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Marca Veículo</label>
                        <input required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="Fiat" value={formData.marca_veiculo} onChange={(e) => setFormData({ ...formData, marca_veiculo: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Modelo</label>
                        <input required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="Siena" value={formData.modelo_veiculo} onChange={(e) => setFormData({ ...formData, modelo_veiculo: e.target.value })} />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ano Inicial</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="2012" value={formData.ano_inicio} onChange={(e) => setFormData({ ...formData, ano_inicio: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ano Final</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="2020" value={formData.ano_fim} onChange={(e) => setFormData({ ...formData, ano_fim: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Estoque</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="Qtd" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Preço (R$)</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm" placeholder="0.00" value={formData.preco} onChange={(e) => setFormData({ ...formData, preco: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Detalhes de Aplicação</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm h-16 resize-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: Lado Direito, Motor 1.4 Fire, Câmbio Manual..."
                  value={formData.aplicacao_veiculo}
                  onChange={(e) =>
                    setFormData({ ...formData, aplicacao_veiculo: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-brand-dark text-brand-primary rounded-2xl font-black uppercase mt-4 hover:bg-black shadow-xl active:scale-95 transition-all"
              >
                {editingProduct ? "Confirmar Alterações" : "Adicionar ao Catálogo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans text-brand-dark">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] p-12 shadow-2xl relative flex flex-col md:flex-row gap-12 animate-in zoom-in duration-300">
            <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark transition-colors">
              <X size={32} />
            </button>
            <div className="w-full md:w-5/12">
              <div className="aspect-square bg-slate-100 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl relative">
                {selectedProduct.fotos ? (
                  <img src={selectedProduct.fotos} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ImageIcon size={80} className="text-slate-200" />
                )}
              </div>
            </div>
            <div className="w-full md:w-7/12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full w-fit ${selectedProduct.condicao === "nova" ? "bg-emerald-50 text-emerald-600 border-emerald-100 border" : "bg-amber-50 text-amber-600 border-amber-100 border"}`}>Peça {selectedProduct.condicao}</span>
                <span className="text-[10px] text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-full tracking-widest font-black">
                  REF: {selectedProduct.codigo_interno || "S/ SKU"}
                </span>
              </div>

              <h2 className="text-5xl font-black uppercase leading-tight mb-4 tracking-tighter">{selectedProduct.nome_peca}</h2>
              <p className="text-brand-primary font-black text-4xl mb-8">R$ {Number(selectedProduct.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

              {selectedProduct.status === "rejected" && (
                <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 mb-8 animate-in slide-in-from-top duration-500">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Notificação Administrativa
                  </p>
                  <p className="font-bold text-red-700 text-sm italic">"{selectedProduct.motivo_bloqueio || "Verifique as fotos e detalhes técnicos."}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 border-t pt-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><CarFront size={20} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Veículo Compatível</p><p className="font-black uppercase text-sm">{selectedProduct.marca_veiculo} {selectedProduct.modelo_veiculo}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-brand-primary"><Calendar size={20} /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Intervalo de Anos</p><p className="font-black uppercase text-sm">{selectedProduct.ano_inicio} a {selectedProduct.ano_fim}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mt-8 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-widest"><Info size={14} /> Detalhes de Aplicação</p>
                <p className="font-bold text-slate-600 text-sm leading-relaxed">{selectedProduct.aplicacao_veiculo || "Nenhuma aplicação detalhada cadastrada."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estoque;