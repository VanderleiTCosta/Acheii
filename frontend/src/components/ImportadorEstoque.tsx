import { useState } from 'react';
import { FileSpreadsheet, Loader2, X, Download } from 'lucide-react';
import axios from 'axios';

interface ImportadorProps {
    userId: string;
    onComplete: () => void;
    onClose: () => void;
}

const ImportadorEstoque = ({ userId, onComplete, onClose }: ImportadorProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // FUNÇÃO SÊNIOR: Gera o modelo CSV dinamicamente via Blob
    const baixarModeloCSV = () => {
    // Adicionado o campo 'aplicacao_veiculo' no cabeçalho e exemplo
    const cabecalho = "nome_peca,fabricante,categoria,marca_veiculo,modelo_veiculo,ano_inicio,ano_fim,quantidade,preco,codigo_interno,aplicacao_veiculo\n";
    const exemplo = "Bomba de Oleo,Bosch,Mecânica,Fiat,Siena,2012,2018,15,250.00,SKU-9901,Motor 1.4 8V Fire - Lado Esquerdo";
    
    const blob = new Blob([cabecalho + exemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_estoque_acheii.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

    const handleFileUpload = async () => {
        if (!file) return;
        setLoading(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                // Filtra linhas vazias e remove o cabeçalho
                const rows = text.split('\n').filter(row => row.trim() !== '').slice(1);
                
                const products = rows.map(row => {
                    const columns = row.split(',');
                    return {
                        nome_peca: columns[0]?.trim(),
                        fabricante: columns[1]?.trim(),
                        categoria: columns[2]?.trim() || "Geral", // Extrai categoria da coluna 2
                        marca_veiculo: columns[3]?.trim(),
                        modelo_veiculo: columns[4]?.trim(),
                        ano_inicio: Number(columns[5]) || 0,
                        ano_fim: Number(columns[6]) || 0,
                        quantidade: Number(columns[7]) || 0,
                        preco: Number(columns[8]) || 0,
                        codigo_interno: columns[9]?.trim() || null,
                        aplicacao_veiculo: columns[10]?.trim() || null,
                        id_loja: userId,
                        status: 'active'
                    };
                });

                await axios.post('http://localhost:3001/api/store/bulk-import', { products });
                alert("Importação de catálogo concluída com sucesso!");
                onComplete();
                onClose();
            } catch (err) {
                console.error("Erro na importação:", err);
                alert("Erro ao processar o arquivo CSV. Verifique se o formato está correto.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-brand-primary/30 text-center relative animate-in fade-in zoom-in duration-300 shadow-sm group hover:border-brand-primary transition-all">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-brand-dark transition-colors">
                <X size={24}/>
            </button>
            
            <FileSpreadsheet className="mx-auto mb-4 text-brand-primary" size={56} />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Importação em Massa</h3>
            
            <button 
                onClick={baixarModeloCSV}
                className="mb-8 flex items-center gap-2 mx-auto text-[10px] font-black text-brand-primary uppercase tracking-widest hover:brightness-110 transition-all bg-brand-primary/5 px-4 py-2 rounded-full"
            >
                <Download size={14} /> Baixar Planilha Modelo (.CSV)
            </button>
            
            <p className="text-xs text-slate-400 font-bold mb-10 italic max-w-md mx-auto">
                Sincronize centenas de peças instantaneamente subindo sua planilha exportada.
            </p>
            
            <div className="flex flex-col items-center gap-5">
                <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-upload" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                
                <label 
                    htmlFor="csv-upload" 
                    className="bg-slate-50 text-brand-dark px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer border border-slate-100 hover:bg-white hover:shadow-md transition-all inline-block min-w-[300px]"
                >
                    {file ? file.name : "Selecionar Arquivo CSV"}
                </label>

                {file && (
                    <button 
                        onClick={handleFileUpload} 
                        disabled={loading}
                        className="w-full max-w-[300px] bg-brand-dark text-brand-primary py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : "Confirmar Importação"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImportadorEstoque;