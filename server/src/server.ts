import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./config/db";
import { authorize } from "./middlewares/auth";
import { RowDataPacket } from "mysql2";
import { getStoreContext } from "./ragEngine";
import { sendWhatsAppText } from "./whatsappClient";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "YOUR_DEFAULT_VERIFY_TOKEN"; // Substitua por um token seguro em produção

// Importação segura para gerar UUIDs
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());

// --- CONFIGURAÇÃO DE LIMITE DE PAYLOAD (Resolve Erro 413) ---
// Definido para 50mb para suportar imagens em Base64 vindas do Estoque.tsx
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- LOGIN HÍBRIDO (ADM em USERS + LOJISTA em LOJAS) ---
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [adminRows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    let userData = adminRows[0];
    let role = "admin";

    if (!userData) {
      const [lojaRows]: any = await db.execute(
        "SELECT * FROM lojas WHERE email = ?",
        [email],
      );
      userData = lojaRows[0];
      role = "user";
    }

    if (!userData || !(await bcrypt.compare(password, userData.password))) {
      return res.status(401).json({ message: "Credenciais incorretas" });
    }

    if (role === "user" && userData.status === "inativo") {
      return res
        .status(403)
        .json({ message: "Sua conta aguarda aprovação administrativa." });
    }

    const id = role === "admin" ? userData.id : userData.id_loja;
    const name = role === "admin" ? userData.name : userData.nome_fantasia;
    const token = jwt.sign(
      { id, role },
      process.env.JWT_SECRET || "chave_acheii",
      { expiresIn: "24h" },
    );

    res.json({ token, user: { id, name, role } });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/api/register-public", async (req, res) => {
  const {
    name,
    email,
    password,
    whatsapp,
    cnpj,
    razao_social,
    endereco,
    cidade,
    estado,
    latitude,
    longitude,
  } = req.body;

  const id_loja = uuidv4();

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO lojas 
      (id_loja, nome_fantasia, razao_social, CNPJ, whatsapp, endereco, cidade, estado, latitude, longitude, email, password, status, plano) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inativo', 'basico')`,
      [
        id_loja,
        name,
        razao_social || name,
        cnpj,
        whatsapp,
        endereco || null,
        cidade || null,
        estado || null,
        latitude || 0.0,
        longitude || 0.0,
        email,
        hashedPassword,
      ],
    );

    res
      .status(201)
      .json({ message: "Solicitação enviada com sucesso! Aguarde aprovação." });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "E-mail ou CNPJ já cadastrado." });
    }
    res.status(500).json({ message: "Erro interno ao processar cadastro." });
  }
});

// --- ROTAS ADMINISTRATIVAS ---

app.get("/api/admin/pending-stores", async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id_loja as id, nome_fantasia as name, CNPJ as sector FROM lojas WHERE status = "inativo"',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar lojas pendentes" });
  }
});

app.get("/api/admin/active-stores", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id_loja as id, nome_fantasia as name, email, whatsapp, status, plano FROM lojas",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar lojas" });
  }
});

app.get("/api/admin/validation-stats", async (req, res) => {
  try {
    const [approved] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM PRODUTOS WHERE status = "active"',
    );
    res.json({ approvedToday: approved[0].total, rejectedToday: 0 });
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar estatísticas" });
  }
});

app.get("/api/admin/active-products", async (req, res) => {
  try {
    const [rows]: any = await db.execute(`
            SELECT 
                p.id_produto as id, 
                p.nome_peca as name, 
                l.nome_fantasia as store_name, 
                p.marca_veiculo as vehicle, 
                p.modelo_veiculo,
                p.ano_inicio,
                p.ano_fim,
                p.preco as price, 
                p.quantidade as stock, 
                p.condicao as condition_type, 
                p.fotos,
                p.categoria, -- ADICIONADO: Agora o banco envia a categoria real
                p.aplicacao_veiculo,
                p.codigo_interno,
                p.motivo_bloqueio,
                p.status 
            FROM PRODUTOS p 
            INNER JOIN lojas l ON p.id_loja = l.id_loja 
            ORDER BY p.data_atualizacao DESC
        `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar produtos para o admin:", error);
    res.status(500).json({ message: "Erro ao buscar produtos" });
  }
});

app.patch("/api/admin/validate-product/:id", async (req, res) => {
  const { id } = req.params;
  const { status, issue } = req.body;

  try {
    await db.execute(
      "UPDATE PRODUTOS SET status = ?, motivo_bloqueio = ? WHERE id_produto = ?",
      [status, issue || null, id],
    );
    res.json({ message: "Produto bloqueado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// --- ROTAS DE LOJISTA (ESTOQUE / MINI-ERP LITE) ---

// PATCH: Ajuste rápido de estoque com reativação automática
app.patch("/api/store/products/stock/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const newStock = Math.max(0, Number(quantity));

    // Ao alterar estoque, limpamos bloqueios anteriores para nova revisão
    const query = `
            UPDATE PRODUTOS 
            SET quantidade = ?, 
                status = 'active', 
                motivo_bloqueio = NULL 
            WHERE id_produto = ?`;

    const [result]: any = await db.execute(query, [newStock, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    res.json({ message: "Stock atualizado!", newStock });
  } catch (error) {
    console.error("ERRO NO STOCK PATCH:", error);
    res.status(500).json({ error: "Erro interno ao atualizar stock." });
  }
});

// POST: Importação em Massa com SKU e Categoria Dinâmica
app.post("/api/store/bulk-import", async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: "Dados inválidos para importação." });
  }

  try {
    const values = products.map((p: any) => [
      uuidv4(),
      p.id_loja,
      p.nome_peca,
      p.fabricante,
      p.categoria || "Geral",
      p.codigo_interno || null, // Sincronizado com SKU da planilha
      p.aplicacao_veiculo || null,
      p.marca_veiculo,
      p.modelo_veiculo,
      p.ano_inicio || 0,
      p.ano_fim || 0,
      p.quantidade || 0,
      p.preco || 0,
      "active",
    ]);

    const sql = `
      INSERT INTO PRODUTOS 
      (id_produto, id_loja, nome_peca, fabricante, categoria, codigo_interno, 
       aplicacao_veiculo, marca_veiculo, modelo_veiculo, ano_inicio, ano_fim, 
       quantidade, preco, status) 
      VALUES ?`;

    await db.query(sql, [values]);
    res.json({ message: `${products.length} itens importados com sucesso!` });
  } catch (error) {
    console.error("ERRO BULK IMPORT:", error);
    res.status(500).json({ error: "Erro ao processar importação em massa." });
  }
});

app.get("/api/store/products/:userId", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM PRODUTOS WHERE id_loja = ? ORDER BY data_atualizacao DESC",
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar estoque" });
  }
});

// POST: Cadastro Manual com Categoria dinâmica e UUID
app.post("/api/store/products", async (req, res) => {
  const {
    nome_peca,
    fabricante,
    categoria,
    marca_veiculo,
    modelo_veiculo,
    ano_inicio,
    ano_fim,
    quantidade,
    preco,
    fotos,
    condicao,
    user_id,
    codigo_interno,
    aplicacao_veiculo,
  } = req.body;

  try {
    const id = uuidv4();
    const query = `
      INSERT INTO PRODUTOS 
      (id_produto, id_loja, nome_peca, fabricante, categoria, codigo_interno, aplicacao_veiculo,
       marca_veiculo, modelo_veiculo, ano_inicio, ano_fim, quantidade, preco, fotos, condicao, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;

    await db.execute(query, [
      id,
      user_id,
      nome_peca,
      fabricante,
      categoria,
      codigo_interno || null,
      aplicacao_veiculo || null,
      marca_veiculo,
      modelo_veiculo,
      Number(ano_inicio),
      Number(ano_fim),
      Number(quantidade),
      Number(preco),
      fotos,
      condicao,
    ]);

    res.json({ message: "Peça adicionada com sucesso!", id_produto: id });
  } catch (error) {
    console.error("ERRO CADASTRO:", error);
    res.status(500).json({ error: "Erro ao cadastrar produto." });
  }
});

// PUT: Atualização Completa com Reset de Bloqueio
app.put("/api/store/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nome_peca,
    fabricante,
    categoria,
    codigo_interno,
    aplicacao_veiculo,
    marca_veiculo,
    modelo_veiculo,
    ano_inicio,
    ano_fim,
    quantidade,
    preco,
    fotos,
    condicao,
  } = req.body;

  try {
    const fotoData = fotos && fotos.length > 15 ? fotos : null;

    const query = `
      UPDATE PRODUTOS SET 
        nome_peca = ?, fabricante = ?, categoria = ?, codigo_interno = ?, 
        aplicacao_veiculo = ?, marca_veiculo = ?, modelo_veiculo = ?, 
        ano_inicio = ?, ano_fim = ?, quantidade = ?, preco = ?, 
        fotos = ?, condicao = ?, status = 'active', motivo_bloqueio = NULL
      WHERE id_produto = ?`;

    await db.execute(query, [
      nome_peca,
      fabricante,
      categoria,
      codigo_interno || null,
      aplicacao_veiculo || null,
      marca_veiculo,
      modelo_veiculo,
      Number(ano_inicio),
      Number(ano_fim),
      Number(quantidade),
      Number(preco),
      fotoData,
      condicao || "nova",
      id,
    ]);

    res.json({ message: "Produto atualizado e enviado para revisão!" });
  } catch (error) {
    console.error("ERRO NO UPDATE:", error);
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

app.delete("/api/store/products/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM PRODUTOS WHERE id_produto = ?", [
      req.params.id,
    ]);
    res.json({ message: "Produto removido!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

app.get("/api/store/metrics/:userId", async (req, res) => {
  try {
    const [active]: any = await db.execute(
      'SELECT COUNT(*) as total FROM PRODUTOS WHERE id_loja = ? AND status = "active"',
      [req.params.userId],
    );
    const [outOfStock]: any = await db.execute(
      "SELECT COUNT(*) as total FROM PRODUTOS WHERE id_loja = ? AND quantidade = 0",
      [req.params.userId],
    );

    res.json({
      active: active[0].total,
      stockAlert: outOfStock[0].total,
      chatRequests: 0,
      conversion: "0%",
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar métricas." });
  }
});

app.get("/api/admin/ai-logs", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 50"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao carregar logs da IA." });
    }
});

// server.ts - Rota Dashboard Sincronizada
app.get("/api/store/dashboard-summary/:storeId", async (req, res) => {
  const { storeId } = req.params;

  try {
    const [
      [productStats], // Status de produtos
      [chatStats],    // Total de leads no log
      [recentChats],  // Últimas 3 conversas
      [topSearches],  // Termos quentes
      [rejected]      // Itens rejeitados
    ]: any = await Promise.all([
      // AJUSTE: Mudei 'loja_id' para 'id_loja' (Verifique se é este o nome na sua tabela produtos)
      db.execute("SELECT COUNT(*) as active, SUM(CASE WHEN quantidade < 5 THEN 1 ELSE 0 END) as stockAlert FROM produtos WHERE id_loja = ?", [storeId]),
      
      db.execute("SELECT COUNT(*) as total FROM chat_logs"),
      
      db.execute("SELECT id, user_message, bot_response, created_at FROM chat_logs ORDER BY created_at DESC LIMIT 3"),
      
      db.execute(`
        SELECT LOWER(user_message) as term, COUNT(*) as count 
        FROM chat_logs 
        WHERE user_message NOT REGEXP 'oi|ola|bom|dia|quero|preciso'
        GROUP BY user_message 
        ORDER BY count DESC LIMIT 5
      `),

      // AJUSTE: Sincronizando com 'id_loja' também aqui
      db.execute("SELECT id_produto, nome_peca, motivo_bloqueio FROM produtos WHERE status = 'rejected' AND id_loja = ?", [storeId])
    ]);

    res.json({
      metrics: {
        active: productStats[0]?.active || 0,
        stockAlert: productStats[0]?.stockAlert || 0,
        chatRequests: chatStats[0]?.total || 0,
        conversion: "5.4%"
      },
      recentChats: recentChats || [],
      topSearches: topSearches || [],
      rejectedProducts: rejected || []
    });

  } catch (error: any) {
    console.error("❌ ERRO NO DASHBOARD SUMMARY:", error.message);
    res.status(500).json({ error: "Erro interno", message: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`Acheii Pro 3.7 - ERP Lite Online na porta ${PORT}`),
);

// --- ROTAS DO WEBHOOK DO WHATSAPP ---

// Rota para verificação do Webhook (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    }
    console.error("❌ FALHA NA VERIFICAÇÃO: Token incorreto");
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

// 2. Rota de Recebimento (POST) - Onde as mensagens chegam
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // Log sênior: Mostra no console se algo chegou da Meta
  console.log("📩 Evento recebido no Webhook:", JSON.stringify(body, null, 2));

  if (body.object === "whatsapp_business_account") {
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; 
      const user_message = message.text?.body;

      if (user_message) {
        console.log(`💬 Mensagem de ${from}: ${user_message}`);

        try {
          // 1. Obter resposta inteligente da sua IA/RAG
          const bot_response = await getStoreContext(user_message);

          // 2. Salvar log para auditoria do lojista
          await db.execute(
            "INSERT INTO chat_logs (user_message, bot_response, context_used) VALUES (?, ?, ?)",
            [user_message, bot_response, bot_response]
          );

          // 3. Responder ao cliente
          await sendWhatsAppText(from, bot_response);
          console.log(`🤖 Resposta enviada para ${from}`);
        } catch (error) {
          console.error("❌ Erro ao processar resposta automática:", error);
        }
      }
    }
    // Sempre retorne 200 imediatamente para a Meta não reenviar o evento
    return res.status(200).send("EVENT_RECEIVED");
  }
  
  return res.sendStatus(404);
});