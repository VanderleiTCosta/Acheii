import db from './config/db'; // Seu pool de conexão MySQL

export const getStoreContext = async (query: string) => {
    try {
        // Busca simples por similaridade de texto nos produtos ativos
        const [products]: any = await db.execute(`
            SELECT name, vehicle, price, stock, condition_type 
            FROM products 
            WHERE status = 'active' 
            AND (name LIKE ? OR vehicle LIKE ?)
            LIMIT 5
        `, [`%${query}%`, `%${query}%`]);

        if (products.length === 0) return "Não foram encontrados produtos específicos no estoque para esta busca.";

        // Transforma os dados em texto legível para a IA
        const context = products.map((p: any) => 
            `Produto: ${p.name}, Veículo: ${p.vehicle}, Preço: R$ ${p.price}, Estoque: ${p.stock}, Estado: ${p.condition_type === 'new' ? 'Novo' : 'Usado'}`
        ).join('\n');

        return `Contexto de Estoque Atualizado:\n${context}`;
    } catch (error) {
        console.error("Erro no RAG Engine:", error);
        return "Erro ao recuperar dados do estoque.";
    }
};