import OpenAI from "openai";
import db from "./config/db"; // Seu pool de conexão MySQL

const openai = new OpenAI();

export const getStoreContext = async (query: string) => {
  try {
    // Busca por similaridade nos campos nome_peca e modelo_veiculo
    const [rows]: any = await db.execute(
      `
      SELECT 
        nome_peca, 
        modelo_veiculo, 
        preco, 
        quantidade, 
        marca_veiculo,
        ano_inicio,
        ano_fim
      FROM produtos 
      WHERE status = 'active' 
      AND (nome_peca LIKE ? OR modelo_veiculo LIKE ? OR aplicacao_veiculo LIKE ?)
      LIMIT 5
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`],
    );

    if (rows.length === 0)
      return "Não foram encontrados produtos específicos no estoque para esta busca.";

    // Formata os dados para o WhatsApp
    const context = rows
      .map(
        (p: any) =>
          `📦 *${p.nome_peca}*\n🚗 Veículo: ${p.marca_veiculo} ${p.modelo_veiculo} (${p.ano_inicio}-${p.ano_fim})\n💰 Preço: R$ ${p.preco}\n🔢 Estoque: ${p.quantidade} un`,
      )
      .join("\n\n");

    return `Encontrei estas opções no estoque:\n\n${context}`;
  } catch (error) {
    console.error("Erro no RAG Engine:", error);
    return "Erro ao recuperar dados do estoque.";
  }
};

export const processCartLogic = async (user_query: string, from: string) => {
  const analysis = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você gerencia um carrinho de autopeças. 
            Analise se o usuário quer: 
            1. "ADD": Adicionar item (ex: "coloca no carrinho", "quero esse").
            2. "VIEW": Ver o carrinho (ex: "o que tem no meu carrinho?").
            3. "CHECKOUT": Finalizar compra.
            Retorne JSON: {"action": "ADD|VIEW|CHECKOUT|NONE", "product_ref": "ID ou nome"}`,
      },
      { role: "user", content: user_query },
    ],
    response_format: { type: "json_object" },
  });

  const intent = JSON.parse(analysis.choices[0].message.content || "{}");

  // Aqui você usaria uma tabela 'carrinhos' no MySQL para persistir os itens do número 'from'
  //
  return intent;
};
