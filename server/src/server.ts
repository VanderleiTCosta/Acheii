import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./config/db";
import { authorize } from "./middlewares/auth";
import { RowDataPacket } from "mysql2";
import { getStoreContext } from './ragEngine';

// Importação segura para gerar UUIDs
const { v4: uuidv4 } = require("uuid"); 

const app = express();
app.use(cors());

// --- CONFIGURAÇÃO DE LIMITE DE PAYLOAD (Resolve Erro 413) ---
// Definido para 50mb para suportar imagens em Base64 vindas do Estoque.tsx
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- LOGIN HÍBRIDO (ADM em USERS + LOJISTA em LOJAS) ---
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [adminRows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        let userData = adminRows[0];
        let role = 'admin';

        if (!userData) {
            const [lojaRows]: any = await db.execute("SELECT * FROM lojas WHERE email = ?", [email]);
            userData = lojaRows[0];
            role = 'user';
        }

        if (!userData || !(await bcrypt.compare(password, userData.password))) {
            return res.status(401).json({ message: "Credenciais incorretas" });
        }

        if (role === 'user' && userData.status === 'inativo') {
            return res.status(403).json({ message: "Sua conta aguarda aprovação administrativa." });
        }

        const id = role === 'admin' ? userData.id : userData.id_loja;
        const name = role === 'admin' ? userData.name : userData.nome_fantasia;
        const token = jwt.sign({ id, role }, process.env.JWT_SECRET || "chave_acheii", { expiresIn: "24h" });

        res.json({ token, user: { id, name, role } });
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

app.post("/api/register-public", async (req, res) => {
  const { 
    name, email, password, whatsapp, cnpj, 
    razao_social, endereco, cidade, estado,
    latitude, longitude 
  } = req.body;
  
  const id_loja = uuidv4();

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO lojas 
      (id_loja, nome_fantasia, razao_social, CNPJ, whatsapp, endereco, cidade, estado, latitude, longitude, email, password, status, plano) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inativo', 'basico')`,
      [
        id_loja, name, razao_social || name, cnpj, whatsapp, 
        endereco || null, cidade || null, estado || null,
        latitude || 0.000000, longitude || 0.000000, 
        email, hashedPassword
      ]
    );

    res.status(201).json({ message: "Solicitação enviada com sucesso! Aguarde aprovação." });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "E-mail ou CNPJ já cadastrado." });
    }
    res.status(500).json({ message: "Erro interno ao processar cadastro." });
  }
});

// --- ROTAS ADMINISTRATIVAS ---

app.get("/api/admin/pending-stores", async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id_loja as id, nome_fantasia as name, CNPJ as sector FROM lojas WHERE status = "inativo"'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar lojas pendentes" });
    }
});

app.get("/api/admin/active-stores", async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id_loja as id, nome_fantasia as name, email, whatsapp, status, plano FROM lojas'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar lojas" });
    }
});

app.get('/api/admin/validation-stats', async (req, res) => {
    try {
        const [approved] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM PRODUTOS WHERE status = "active"');
        res.json({ approvedToday: approved[0].total, rejectedToday: 0 });
    } catch (error) {
        res.status(500).json({ message: "Erro ao carregar estatísticas" });
    }
});

app.get('/api/admin/active-products', async (req, res) => {
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
        res.status(500).json({ message: "Erro ao buscar produtos" });
    }
});

app.patch("/api/admin/validate-product/:id", async (req, res) => {
    const { id } = req.params;
    const { status, issue } = req.body;

    try {
        // Agora salvamos no campo específico 'motivo_bloqueio'
        await db.execute(
            "UPDATE PRODUTOS SET status = ?, motivo_bloqueio = ? WHERE id_produto = ?",
            [status, issue || null, id]
        );
        res.json({ message: "Produto bloqueado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// --- ROTAS DE LOJISTA (ESTOQUE) ---

app.get("/api/store/products/:userId", async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM PRODUTOS WHERE id_loja = ?", [req.params.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao carregar estoque" });
    }
});

// FIX FINAL: Ordem sincronizada e tratamento de fotos LONGTEXT/Base64
app.post("/api/store/products", async (req, res) => {
  const { 
    user_id, nome_peca, fabricante, categoria, 
    codigo_interno, aplicacao_veiculo, marca_veiculo, 
    modelo_veiculo, ano_inicio, ano_fim, quantidade, 
    preco, fotos, condicao 
  } = req.body;

  const id_produto = uuidv4(); 

  try {
    // Sanitização para Base64: se for string curta ou inválida, vai como NULL
    const fotoData = fotos && fotos.length > 15 ? fotos : null;

    await db.execute(
      `INSERT INTO PRODUTOS 
      (id_produto, id_loja, nome_peca, fabricante, categoria, codigo_interno, aplicacao_veiculo, marca_veiculo, modelo_veiculo, ano_inicio, ano_fim, quantidade, preco, fotos, status, condicao) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        id_produto, user_id, nome_peca, fabricante, categoria, 
        codigo_interno || null, aplicacao_veiculo || null, 
        marca_veiculo, modelo_veiculo, Number(ano_inicio), Number(ano_fim), 
        Number(quantidade), Number(preco), fotoData, condicao || 'nova'
      ]
    );
    res.status(201).json({ message: "Produto cadastrado!" });
  } catch (error) {
    console.error("ERRO NO POST:", error);
    res.status(500).json({ error: "Erro ao inserir produto. Verifique se a coluna fotos é LONGTEXT." });
  }
});

app.put("/api/store/products/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    nome_peca, fabricante, categoria, codigo_interno, 
    aplicacao_veiculo, marca_veiculo, modelo_veiculo, 
    ano_inicio, ano_fim, quantidade, preco, fotos, condicao 
  } = req.body;

  try {
    const fotoData = fotos && fotos.length > 15 ? fotos : null;

    const query = `
      UPDATE PRODUTOS SET 
        nome_peca = ?, fabricante = ?, categoria = ?, codigo_interno = ?, 
        aplicacao_veiculo = ?, marca_veiculo = ?, modelo_veiculo = ?, 
        ano_inicio = ?, ano_fim = ?, quantidade = ?, preco = ?, 
        fotos = ?, condicao = ?
      WHERE id_produto = ?`;

    await db.execute(query, [
      nome_peca, fabricante, categoria, codigo_interno || null, 
      aplicacao_veiculo || null, marca_veiculo, modelo_veiculo, 
      Number(ano_inicio), Number(ano_fim), Number(quantidade), 
      Number(preco), fotoData, condicao || 'nova', id
    ]);

    res.json({ message: "Produto atualizado!" });
  } catch (error) {
    console.error("ERRO NO UPDATE:", error);
    res.status(500).json({ error: "Erro ao atualizar no banco de dados." });
  }
});

app.delete("/api/store/products/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM PRODUTOS WHERE id_produto = ?", [req.params.id]);
        res.json({ message: "Produto removido!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar" });
    }
});

app.get("/api/store/metrics/:userId", async (req, res) => {
  try {
    const [active]: any = await db.execute(
      'SELECT COUNT(*) as total FROM PRODUTOS WHERE id_loja = ? AND status = "active"', 
      [req.params.userId]
    );
    const [outOfStock]: any = await db.execute(
      'SELECT COUNT(*) as total FROM PRODUTOS WHERE id_loja = ? AND quantidade = 0', 
      [req.params.userId]
    );
    
    res.json({ 
      active: active[0].total, 
      stockAlert: outOfStock[0].total, 
      chatRequests: 0, 
      conversion: "0%" 
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar métricas." });
  }
});

app.listen(3001, () => console.log("Acheii Pro 3.6 - Servidor Otimizado para Imagens (Base64)"));