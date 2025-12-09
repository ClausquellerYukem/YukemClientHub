import express from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../replitAuth";

async function getCompanyIdForUser(req: any): Promise<string | undefined | null> {
  const userId = req.user.dbUserId || req.user.email || req.user.claims?.sub;
  let user = await storage.getUser(userId);
  if (!user && req.user.claims?.email) user = await storage.getUserByEmail(req.user.claims.email);
  if (!user) throw new Error('User not found');
  if (user.activeCompanyId) return user.activeCompanyId;
  if (user.role === 'admin') return undefined;
  return null;
}

export const reportsRouter = express.Router();

reportsRouter.post("/predefined/:reportId", isAuthenticated, async (req, res) => {
  try {
    const { reportId } = req.params as any;
    const { filters } = req.body || {};
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa selecionada" });
    const predefinedReports: Record<string, { name: string; query: string; description: string }> = {
      'monthly-revenue-by-client': {
        name: 'Faturamento Mensal por Cliente',
        description: 'Receita mensal detalhada de cada cliente',
        query: `
          SELECT 
            c.company_name as "Cliente",
            c.plan as "Plano",
            c.monthly_value as "Valor Mensal",
            c.status as "Status",
            COUNT(DISTINCT l.id) as "Licenças Ativas",
            TO_CHAR(c.created_at, 'DD/MM/YYYY') as "Data Cadastro"
          FROM clients c
          LEFT JOIN licenses l ON l.client_id = c.id AND l.is_active = true
          WHERE c.company_id = $1
          GROUP BY c.id, c.company_name, c.plan, c.monthly_value, c.status, c.created_at
          ORDER BY c.company_name
        `
      },
      'licenses-expiring-soon': {
        name: 'Licenças Vencendo (Próximos 30 Dias)',
        description: 'Licenças que expiram nos próximos 30 dias',
        query: `
          SELECT 
            c.company_name as "Cliente",
            l.license_key as "Chave da Licença",
            TO_CHAR(l.expires_at, 'DD/MM/YYYY') as "Data Expiração",
            CASE 
              WHEN l.is_active THEN 'Ativa'
              ELSE 'Inativa'
            END as "Status",
            EXTRACT(DAY FROM (l.expires_at - NOW())) as "Dias Restantes"
          FROM licenses l
          JOIN clients c ON c.id = l.client_id
          WHERE l.company_id = $1
          AND l.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
          ORDER BY l.expires_at
        `
      },
      'payment-history': {
        name: 'Histórico de Pagamentos',
        description: 'Histórico completo de faturas pagas',
        query: `
          SELECT 
            c.company_name as "Cliente",
            i.amount as "Valor",
            TO_CHAR(i.due_date, 'DD/MM/YYYY') as "Vencimento",
            TO_CHAR(i.paid_at, 'DD/MM/YYYY') as "Data Pagamento",
            i.status as "Status",
            CASE 
              WHEN i.paid_at IS NULL THEN null
              WHEN i.paid_at <= i.due_date THEN 'No Prazo'
              ELSE 'Atrasado'
            END as "Situação"
          FROM invoices i
          JOIN clients c ON c.id = i.client_id
          WHERE i.company_id = $1
          AND i.status = 'paid'
          ORDER BY i.paid_at DESC
        `
      },
      'pending-invoices': {
        name: 'Faturas Pendentes',
        description: 'Todas as faturas aguardando pagamento',
        query: `
          SELECT 
            c.company_name as "Cliente",
            c.email as "Email",
            c.phone as "Telefone",
            i.amount as "Valor",
            TO_CHAR(i.due_date, 'DD/MM/YYYY') as "Vencimento",
            EXTRACT(DAY FROM (NOW() - i.due_date)) as "Dias Atraso",
            CASE 
              WHEN NOW() > i.due_date THEN 'Vencida'
              ELSE 'A Vencer'
            END as "Situação"
          FROM invoices i
          JOIN clients c ON c.id = i.client_id
          WHERE i.company_id = $1
          AND i.status = 'pending'
          ORDER BY i.due_date
        `
      },
      'sales-performance': {
        name: 'Performance de Vendas',
        description: 'Resumo de vendas e receitas por período',
        query: `
          SELECT 
            TO_CHAR(DATE_TRUNC('month', i.created_at), 'MM/YYYY') as "Mês",
            COUNT(DISTINCT i.client_id) as "Clientes Ativos",
            COUNT(i.id) as "Total Faturas",
            SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) as "Faturas Pagas",
            SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as "Faturas Pendentes",
            SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as "Receita Realizada",
            SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END) as "Receita Pendente"
          FROM invoices i
          WHERE i.company_id = $1
          GROUP BY DATE_TRUNC('month', i.created_at)
          ORDER BY DATE_TRUNC('month', i.created_at) DESC
          LIMIT 12
        `
      }
    };
    const report = predefinedReports[reportId];
    if (!report) return res.status(404).json({ error: "Relatório não encontrado" });
    const result = await storage.executeQuery(report.query, [companyId]);
    const response = { reportName: report.name, description: report.description, columns: (result.fields || []).map(f => f.name), rows: result.rows || [], rowCount: (result.rows || []).length } as any;
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Erro ao executar relatório" });
  }
});

reportsRouter.post("/query-builder", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { table, columns, filters, orderBy, limit } = req.body || {};
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa selecionada" });
    const allowedTables: Record<string, string> = { 'clients': 'clients', 'licenses': 'licenses', 'invoices': 'invoices', 'companies': 'companies' };
    if (!allowedTables[table]) return res.status(400).json({ error: "Tabela não permitida" });
    const tableColumns: Record<string, string[]> = {
      'clients': ['id', 'company_id', 'company_name', 'contact_name', 'email', 'phone', 'cnpj', 'plan', 'monthly_value', 'due_day', 'status', 'created_at'],
      'licenses': ['id', 'company_id', 'client_id', 'license_key', 'is_active', 'activated_at', 'expires_at'],
      'invoices': ['id', 'company_id', 'client_id', 'amount', 'due_date', 'paid_at', 'status', 'created_at', 'parcela_id', 'qrcode_id', 'qrcode', 'qrcode_base64', 'url', 'generated_at'],
      'companies': ['id', 'name', 'logo_url', 'status', 'cnpj', 'state_registration', 'city_registration', 'address_street', 'address_number', 'address_complement', 'address_district', 'address_city', 'address_state', 'address_zip_code', 'monthly_value', 'revenue_share_percentage', 'free_license_quota', 'created_at', 'updated_at']
    };
    const validColumns = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!columns.every((col: string) => validColumns.test(col))) return res.status(400).json({ error: "Nomes de colunas inválidos" });
    const availableColumns = tableColumns[table];
    const invalidColumns = columns.filter((col: string) => !availableColumns.includes(col));
    if (invalidColumns.length > 0) return res.status(400).json({ error: `Colunas não encontradas na tabela '${table}': ${invalidColumns.join(', ')}. Colunas disponíveis: ${availableColumns.join(', ')}` });
    const selectedColumns = columns.join(', ');
    let query = `SELECT ${selectedColumns} FROM ${table} WHERE company_id = $1`;
    const params: any[] = [companyId];
    let paramIndex = 2;
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        if (!validColumns.test(filter.column)) return res.status(400).json({ error: "Nome de coluna inválido no filtro" });
        if (!availableColumns.includes(filter.column)) return res.status(400).json({ error: `Coluna '${filter.column}' não encontrada na tabela '${table}'. Colunas disponíveis: ${availableColumns.join(', ')}` });
        const operators: Record<string, string> = { 'equals': '=', 'not_equals': '!=', 'greater': '>', 'less': '<', 'like': 'LIKE', 'in': 'IN' };
        const operator = operators[filter.operator];
        if (!operator) return res.status(400).json({ error: "Operador inválido" });
        query += ` AND ${filter.column} ${operator} $${paramIndex}`;
        params.push(filter.value);
        paramIndex++;
      }
    }
    if (orderBy) {
      if (!validColumns.test(orderBy)) return res.status(400).json({ error: "Nome de coluna inválido em ORDER BY" });
      if (!availableColumns.includes(orderBy)) return res.status(400).json({ error: `Coluna '${orderBy}' não encontrada na tabela '${table}'. Colunas disponíveis: ${availableColumns.join(', ')}` });
      query += ` ORDER BY ${orderBy}`;
    }
    const maxLimit = 1000;
    const queryLimit = Math.min(limit || 100, maxLimit);
    query += ` LIMIT ${queryLimit}`;
    const result = await storage.executeQuery(query, params);
    res.json({ columns: (result.fields || []).map(f => f.name), rows: result.rows || [], rowCount: (result.rows || []).length });
  } catch (error) {
    res.status(500).json({ error: "Erro ao executar consulta" });
  }
});

reportsRouter.post("/custom-sql", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { sql } = req.body || {};
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa selecionada" });
    if (!sql || typeof sql !== 'string') return res.status(400).json({ error: "SQL inválido" });
    const sqlUpper = sql.toUpperCase().trim();
    if (!sqlUpper.startsWith('SELECT')) return res.status(403).json({ error: "Apenas consultas SELECT são permitidas" });
    const dangerousKeywords = ['DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'REPLACE', 'GRANT', 'REVOKE', 'EXECUTE', 'EXEC', 'CALL', 'PROCEDURE', 'FUNCTION'];
    for (const keyword of dangerousKeywords) if (sqlUpper.includes(keyword)) return res.status(403).json({ error: `Operação não permitida: ${keyword}. Apenas consultas SELECT são permitidas.` });
    const maxQueryLength = 5000;
    if (sql.length > maxQueryLength) return res.status(400).json({ error: "Consulta muito longa" });
    const timeoutMs = 30000;
    const queryWithTimeout = `SET statement_timeout = ${timeoutMs}; ${sql}`;
    const result = await storage.executeQuery(queryWithTimeout, []);
    res.json({ columns: (result.fields || []).map(f => f.name), rows: result.rows || [], rowCount: (result.rows || []).length });
  } catch (error: any) {
    if (error.message?.includes('syntax error')) return res.status(400).json({ error: "Erro de sintaxe SQL" });
    if (error.message?.includes('timeout')) return res.status(408).json({ error: "Consulta excedeu tempo limite de 30 segundos" });
    res.status(500).json({ error: "Erro ao executar consulta SQL" });
  }
});

reportsRouter.get("/schema", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const schema = {
      tables: [
        { name: 'companies', description: 'Empresas cadastradas no sistema', columns: [
          { name: 'id', type: 'varchar', description: 'ID único da empresa' },
          { name: 'name', type: 'varchar', description: 'Nome da empresa' },
          { name: 'cnpj', type: 'varchar', description: 'CNPJ' },
          { name: 'monthly_value', type: 'decimal', description: 'Valor mensal da empresa' },
          { name: 'revenue_share_percentage', type: 'decimal', description: '% de repasse' },
          { name: 'free_license_quota', type: 'decimal', description: 'Cota de licenças gratuitas' },
          { name: 'status', type: 'varchar', description: 'Status (active/inactive)' },
          { name: 'created_at', type: 'timestamp', description: 'Data de criação' }
        ]},
        { name: 'clients', description: 'Clientes (ERP) de cada empresa', columns: [
          { name: 'id', type: 'varchar', description: 'ID único do cliente' },
          { name: 'company_id', type: 'varchar', description: 'ID da empresa (white label)' },
          { name: 'company_name', type: 'text', description: 'Nome do cliente' },
          { name: 'contact_name', type: 'text', description: 'Nome do contato' },
          { name: 'email', type: 'text', description: 'Email' },
          { name: 'phone', type: 'text', description: 'Telefone' },
          { name: 'cnpj', type: 'text', description: 'CNPJ' },
          { name: 'plan', type: 'text', description: 'Plano contratado' },
          { name: 'monthly_value', type: 'decimal', description: 'Valor mensal' },
          { name: 'due_day', type: 'integer', description: 'Dia de vencimento (1-31)' },
          { name: 'status', type: 'text', description: 'Status (active/inactive)' },
          { name: 'created_at', type: 'timestamp', description: 'Data de cadastro' }
        ]},
        { name: 'licenses', description: 'Licenças de software dos clientes', columns: [
          { name: 'id', type: 'varchar', description: 'ID único da licença' },
          { name: 'company_id', type: 'varchar', description: 'ID da empresa' },
          { name: 'client_id', type: 'varchar', description: 'ID do cliente' },
          { name: 'license_key', type: 'text', description: 'Chave da licença' },
          { name: 'is_active', type: 'boolean', description: 'Licença ativa?' },
          { name: 'activated_at', type: 'timestamp', description: 'Data de ativação' },
          { name: 'expires_at', type: 'timestamp', description: 'Data de expiração' }
        ]},
        { name: 'invoices', description: 'Faturas geradas para os clientes', columns: [
          { name: 'id', type: 'varchar', description: 'ID único da fatura' },
          { name: 'company_id', type: 'varchar', description: 'ID da empresa' },
          { name: 'client_id', type: 'varchar', description: 'ID do cliente' },
          { name: 'amount', type: 'decimal', description: 'Valor da fatura' },
          { name: 'due_date', type: 'timestamp', description: 'Data de vencimento' },
          { name: 'paid_at', type: 'timestamp', description: 'Data de pagamento' },
          { name: 'status', type: 'text', description: 'Status (pending/paid/overdue)' },
          { name: 'created_at', type: 'timestamp', description: 'Data de criação' }
        ]},
        { name: 'users', description: 'Usuários do sistema', columns: [
          { name: 'id', type: 'varchar', description: 'ID único do usuário' },
          { name: 'email', type: 'varchar', description: 'Email' },
          { name: 'first_name', type: 'varchar', description: 'Nome' },
          { name: 'last_name', type: 'varchar', description: 'Sobrenome' },
          { name: 'role', type: 'varchar', description: 'Papel (admin/user)' },
          { name: 'active_company_id', type: 'varchar', description: 'Empresa ativa' },
          { name: 'created_at', type: 'timestamp', description: 'Data de criação' }
        ]}
      ],
      examples: [
        { title: 'Clientes ativos com licenças', sql: "SELECT c.company_name, COUNT(l.id) as total_licenses FROM clients c LEFT JOIN licenses l ON l.client_id = c.id WHERE c.company_id = 'YOUR_COMPANY_ID' GROUP BY c.id" },
        { title: 'Receita total por mês', sql: "SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount) as revenue FROM invoices WHERE company_id = 'YOUR_COMPANY_ID' AND status = 'paid' GROUP BY month" }
      ]
    } as any;
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar estrutura do banco" });
  }
});

