import express from "express";
import { storage } from "../storage";
import { insertBoletoConfigSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, requirePermission, getUserFromSession } from "../replitAuth";

async function getCompanyIdForUser(req: any): Promise<string | undefined | null> {
  const userId = req.user.dbUserId || req.user.email || req.user.claims?.sub;
  let user = await storage.getUser(userId);
  if (!user && req.user.claims?.email) {
    user = await storage.getUserByEmail(req.user.claims.email);
  }
  if (!user) {
    throw new Error('User not found');
  }
  if (user.activeCompanyId) return user.activeCompanyId;
  if (user.role === 'admin') return undefined;
  return null;
}

export const boletoRouter = express.Router();

boletoRouter.post("/invoices/:id/generate", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const invoiceId = req.params.id;
    if (!companyId) return res.status(400).json({ error: "Por favor, selecione uma empresa ativa" });
    const invoice = await storage.getInvoice(invoiceId, companyId as any);
    if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });
    const config = await storage.getBoletoConfig(companyId as any);
    if (!config) return res.status(400).json({ error: "Configuração de boleto não encontrada. Configure primeiro na aba Configurações." });
    const boletoApiUrl = "https://api.yukem.com.br/v1/geraboletoapi";
    const response = await fetch(boletoApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'app_token': config.appToken, 'access_token': config.accessToken }, body: JSON.stringify({ id: invoiceId }) });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Erro ao gerar boleto", details: errorText });
    }
    const boletoData = await response.json();
    if (!boletoData.data || !boletoData.data.ParcelaId) return res.status(500).json({ error: "Resposta inválida da API de boletos", details: "A API não retornou os dados esperados" });
    await storage.updateInvoiceBoletoData(invoiceId, companyId as any, { boletoParcelaId: boletoData.data.ParcelaId, boletoQrcodeId: boletoData.data.qrcodeId || null, boletoQrcode: boletoData.data.qrcode || null, boletoQrcodeBase64: boletoData.data.qrcodeBase64 || null, boletoUrl: boletoData.data.url || null, boletoGeneratedAt: new Date() });
    res.json(boletoData.data);
  } catch (error) {
    res.status(500).json({ error: "Falha ao gerar boleto" });
  }
});

boletoRouter.get("/config", isAuthenticated, requirePermission('boleto_config', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Por favor, selecione uma empresa ativa" });
    const config = await storage.getBoletoConfig(companyId as any);
    if (!config) return res.json(null);
    const maskedConfig = { ...config, appToken: config.appToken ? `${config.appToken.substring(0, 4)}${"*".repeat(Math.max(0, config.appToken.length - 8))}${config.appToken.substring(Math.max(0, config.appToken.length - 4))}` : "", accessToken: config.accessToken ? `${config.accessToken.substring(0, 4)}${"*".repeat(Math.max(0, config.accessToken.length - 8))}${config.accessToken.substring(Math.max(0, config.accessToken.length - 4))}` : "" } as any;
    res.json(maskedConfig);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boleto configuration" });
  }
});

boletoRouter.post("/config", isAuthenticated, requirePermission('boleto_config', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Por favor, selecione uma empresa ativa" });
    const dataToValidate = { ...req.body, companyId };
    const validatedData = insertBoletoConfigSchema.parse(dataToValidate);
    const config = await storage.saveBoletoConfig(validatedData);
    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to save boleto configuration" });
  }
});

boletoRouter.get("/print/:id", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const sessionUser = req.user as any;
    const user = await getUserFromSession(sessionUser);
    const isAdmin = user?.role === 'admin';
    let companyId: string | undefined;
    if (isAdmin) {
      companyId = req.query.companyId as string;
      if (!companyId) return res.status(400).json({ error: "Admins must specify ?companyId=xxx" });
    } else {
      companyId = await getCompanyIdForUser(req) as any;
    }
    const config = await storage.getBoletoConfig(companyId as any);
    if (!config) return res.status(400).json({ error: "Configuração de boleto não encontrada. Configure primeiro." });
    const invoiceId = req.params.id;
    const boletoApiUrl = `http://51.222.16.165:3010/v1/boleto/${invoiceId}`;
    const response = await fetch(boletoApiUrl, { method: 'GET', headers: { 'app_token': config.appToken, 'access_token': config.accessToken } });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Erro ao gerar boleto", details: errorText });
    }
    const boletoData = await response.json();
    if (!boletoData || (!boletoData.url && !boletoData.pdf && !boletoData.link && !boletoData.base64 && !boletoData.pdfBase64)) return res.status(500).json({ error: "Resposta inválida da API de boletos", details: "A API não retornou um link ou arquivo válido para o boleto" });
    res.json(boletoData);
  } catch (error) {
    res.status(500).json({ error: "Falha ao conectar com a API de boletos" });
  }
});

