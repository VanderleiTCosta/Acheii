import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./config/db";
import { authorize } from "./middlewares/auth";
import { RowDataPacket } from "mysql2";
import { getStoreContext } from './ragEngine';

const app = express();
app.use(cors());
app.use(express.json());

// ROTA DE LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Credenciais incorretas" });
    }

    // Regra: Lojistas precisam de aprovação prévia do Admin
    if (user.role !== "admin" && user.status === "pending") {
      return res.status(403).json({
        message: "Sua conta de lojista ainda está em análise técnica.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "chave_acheii",
      { expiresIn: "24h" },
    );

    // RETORNO COM ID: Essencial para o funcionamento do Estoque
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/api/register", authorize(["admin"]), async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validação extra por segurança
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Cargo inválido." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );
    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    res.status(400).json({ message: "Este e-mail já está em uso." });
  }
});

app.post("/api/register-public", async (req, res) => {
  const { name, email, password, condition_type, sector } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Note que o status é 'pending' por padrão para lojas novas
    await db.execute(
      'INSERT INTO users (name, email, password, role, status, condition_type, sector, is_approved) VALUES (?, ?, ?, "user", "pending", ?, ?, FALSE)',
      [name, email, hashedPassword, condition_type, sector],
    );

    res.status(201).json({ message: "Solicitação enviada com sucesso!" });
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .json({ message: "Erro ao cadastrar. Verifique se o e-mail já existe." });
  }
});

app.get("/api/admin/pending-stores", async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, sector, condition_type FROM users WHERE status = "pending" AND role = "user"',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar lojas." });
  }
});

// Aprovar uma loja
app.post("/api/admin/approve-store/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(
      'UPDATE users SET status = "active", is_approved = TRUE WHERE id = ?',
      [id],
    );
    res.json({ message: "Loja aprovada com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao aprovar loja." });
  }
});

// Listar todas as lojas ativas (Aprovadas)
app.get("/api/admin/active-stores", async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, sector, status FROM users WHERE role = "user" AND status != "pending"',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar lojas." });
  }
});

// Listar produtos aguardando revisão
app.get('/api/admin/pending-products', async (req, res) => {
    try {
        // Selecionamos explicitamente os campos para evitar erros de nulo
        const [rows] = await db.execute(`
            SELECT 
                p.id, 
                p.name, 
                p.vehicle, 
                p.price, 
                p.stock, 
                p.condition_type, 
                p.status, 
                u.name as store_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).json({ message: "Erro ao buscar produtos." });
    }
});


// Buscar resumo de validações do dia atual
app.get('/api/admin/validation-stats', async (req, res) => {
    try {
        // Conta aprovados hoje (status 'active' com data de hoje)
        const [approved] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM products WHERE status = "active" AND DATE(updated_at) = CURDATE()'
        );

        // Conta rejeitados hoje (status 'rejected' com data de hoje)
        const [rejected] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM products WHERE status = "rejected" AND DATE(updated_at) = CURDATE()'
        );

        res.json({
            approvedToday: approved[0].total,
            rejectedToday: rejected[0].total
        });
    } catch (error) {
        res.status(500).json({ message: "Erro ao carregar estatísticas diárias." });
    }
});

// Buscar estatísticas gerais da IA
app.get("/api/admin/ai-stats", async (req, res) => {
  try {
    // Exemplo de dados agregados para os cards superiores
    res.json({
      accuracy: "94.2%",
      avgTime: "0.8s",
      failures: 290,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar estatísticas." });
  }
});

// Buscar logs de interpretação recentes
app.get("/api/admin/ai-logs", async (req, res) => {
  try {
    const logs = [
      {
        query: "tem bomba de combustivel do siena 2012?",
        tags: ["Bomba de Combustível", "Fiat Siena", "2012"],
        results: 3,
        time: "0.8s",
      },
      {
        query: "pastilha freio civic 19",
        tags: ["Pastilha de Freio", "Honda Civic", "2019"],
        results: 5,
        time: "0.6s",
      },
    ];
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar logs." });
  }
});

// Buscar dados financeiros consolidados
app.get("/api/admin/financial-stats", async (req, res) => {
  try {
    // Exemplo de retorno baseado no seu mockup
    res.json({
      totalRevenue: "R$ 114.700,00",
      projection: "R$ 185.000,00",
      averageTicket: "R$ 755,00/mes",
      plans: { premium: 48, basic: 104 },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados financeiros." });
  }
});

// Listar comissões por loja
app.get("/api/admin/commissions", async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT u.name as store, 'Premium' as plan, 120 as sales, 'R$ 1.800,00' as commission
            FROM users u WHERE role = 'user' AND status = 'active'
        `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar comissões." });
  }
});

// Buscar métricas resumidas da loja
app.get("/api/store/metrics/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // Tipamos explicitamente como RowDataPacket[] para poder acessar o índice [0]
    const [activeProducts] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM products WHERE user_id = ? AND status = "active"',
      [userId],
    );
    const [outOfStock] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM products WHERE user_id = ? AND stock = 0",
      [userId],
    );

    res.json({
      active: activeProducts[0].total, // Resolvido: TypeScript agora reconhece a propriedade 'total'
      stockAlert: outOfStock[0].total, // Resolvido
      chatRequests: 47,
      conversion: "23.5%",
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar métricas." });
  }
});

// Listar estoque da loja específica
app.get("/api/store/products/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Buscando produtos para o usuário:", userId); // Debug no terminal do Node

  try {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE user_id = ?",
      [userId],
    );
    console.log("Produtos encontrados:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Erro no SQL:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// Cadastrar novo produto
app.post("/api/store/products", async (req, res) => {
  const { user_id, name, vehicle, condition_type, stock, price } = req.body;
  try {
    await db.execute(
      'INSERT INTO products (user_id, name, vehicle, condition_type, stock, price, status) VALUES (?, ?, ?, ?, ?, ?, "active")',
      [user_id, name, vehicle, condition_type, stock, price],
    );
    res.json({ message: "Produto publicado com sucesso no marketplace!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao cadastrar produto." });
  }
});

// DELETAR PRODUTO
app.delete("/api/store/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

// ATUALIZAR PRODUTO
app.put("/api/store/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, vehicle, stock, price, condition_type } = req.body;
  try {
    await db.execute(
      'UPDATE products SET name = ?, vehicle = ?, stock = ?, price = ?, condition_type = ?, status = "active" WHERE id = ?',
      [name, vehicle, stock, price, condition_type, id],
    );
    res.json({ message: "Produto atualizado e publicado no marketplace!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

app.get('/api/admin/active-products', async (req, res) => {
    try {
        const [rows]: any = await db.execute(`
            SELECT p.*, u.name as store_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.status = 'active'
            ORDER BY p.updated_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar produtos ativos" });
    }
});

app.post('/api/chat/otto', async (req, res) => {
    const { message } = req.body;

    try {
        // 1. RAG: Busca peças relevantes no banco de dados
        const context = await getStoreContext(message);

        // 2. Montagem do Prompt Sênior [cite: 2025-12-05]
        const systemPrompt = `Você é o Otto, assistente do marketplace Acheii. 
        Responda apenas com base neste contexto de estoque:
        ${context}
        
        Se não encontrar a peça, peça para o cliente ser mais específico ou diga que não temos no momento.`;

        // 3. Chamada para a IA (Exemplo com Gemini ou OpenAI)
        // Aqui você insere a chamada real da API. Exemplo simulado:
        const botReply = "Olá! Encontrei a peça que você precisa no nosso estoque..."; 

        // 4. Salvar log para o Monitoramento IA aparecer dados
        await db.execute(
            'INSERT INTO chat_logs (user_message, bot_response, context_used) VALUES (?, ?, ?)',
            [message, botReply, context]
        );

        res.json({ reply: botReply });
    } catch (error) {
        console.error("Erro no chat do Otto:", error);
        res.status(500).json({ message: "Erro ao processar conversa." });
    }
});

app.get('/api/admin/chat-logs', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 50');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar logs." });
    }
});

app.listen(3001, () =>
  console.log("Servidor Acheii Pro rodando na porta 3001"),
);
