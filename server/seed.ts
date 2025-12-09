import { storage } from "./storage"
import { type InsertCompany, type InsertClient, type InsertLicense, type InsertInvoice, type InsertCashAccountType, type InsertCashBase, type InsertCashAccount, type InsertCashSession, type Company, type CashAccountType, type CashBase, type CashAccount, type Client, type Invoice, type License } from "@shared/schema"

export async function run() {
  const masterEmail = process.env.MASTER_USER_EMAIL || "dev@yukem.com.br"
  const user = await storage.upsertUser({ email: masterEmail, firstName: "Dev", lastName: "Seed" })

  const makeCompany = (name: string): InsertCompany => ({
    name,
    logoUrl: null as any,
    status: "active",
    cnpj: "00.000.000/0000-00",
    stateRegistration: null as any,
    cityRegistration: null as any,
    addressStreet: "Rua das Flores",
    addressNumber: "100",
    addressComplement: null as any,
    addressDistrict: "Centro",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZipCode: "01000-000",
    monthlyValue: "2000.00" as any,
    revenueSharePercentage: "40.00" as any,
    freeLicenseQuota: "0" as any,
  })

  const allCompanies = await storage.getAllCompanies()
  const companyA = allCompanies.find((c: Company) => c.name === "Empresa Demo A") || await storage.createCompany(makeCompany("Empresa Demo A"))
  const companyB = allCompanies.find((c: Company) => c.name === "Empresa Demo B") || await storage.createCompany(makeCompany("Empresa Demo B"))

  await storage.assignUserToCompany({ userId: user.id, companyId: companyA.id })
  await storage.assignUserToCompany({ userId: user.id, companyId: companyB.id })
  await storage.setActiveCompany(user.id, companyA.id)

  const existingTypes = await storage.getAllCashAccountTypes()
  const tipoReceita: InsertCashAccountType = { name: "Receita", description: "Entradas" }
  const tipoDespesa: InsertCashAccountType = { name: "Despesa", description: "Saídas" }
  const tRec = existingTypes.find((t: CashAccountType) => t.name === "Receita") || await storage.createCashAccountType(tipoReceita)
  const tDes = existingTypes.find((t: CashAccountType) => t.name === "Despesa") || await storage.createCashAccountType(tipoDespesa)

  const makeBase = (companyId: string, description: string): InsertCashBase => ({
    companyId,
    userId: user.id,
    internalCode: null as any,
    description,
    visibleToUser: true,
    boxType: 0,
    balance: "0" as any,
    active: true,
    usePos: 0,
    exportToAccounting: false,
  })

  const basesAExisting = await storage.getAllCashBases(companyA.id)
  const basesBExisting = await storage.getAllCashBases(companyB.id)
  const baseA1 = basesAExisting.find((b: CashBase) => b.description === "Caixa Principal") || await storage.createCashBase(makeBase(companyA.id, "Caixa Principal"))
  const baseA2 = basesAExisting.find((b: CashBase) => b.description === "Banco") || await storage.createCashBase(makeBase(companyA.id, "Banco"))
  const baseB1 = basesBExisting.find((b: CashBase) => b.description === "Caixa") || await storage.createCashBase(makeBase(companyB.id, "Caixa"))
  const baseB2 = basesBExisting.find((b: CashBase) => b.description === "Banco") || await storage.createCashBase(makeBase(companyB.id, "Banco"))

  const makeAccount = (companyId: string, description: string, movement: "E" | "S", typeId?: string): InsertCashAccount => ({
    companyId,
    typeId,
    description,
    movementIndicator: movement,
    showInCashLaunch: true,
    duplicateInReport: false,
    showInReport: true,
    inactive: false,
    groupInReport: false,
    budgeted: false,
    category: movement === "E" ? 1 : 2,
    sequence: null as any,
    showInDer: false,
    budgetValue: "0" as any,
    parentAccountId: null as any,
    total: "0" as any,
    externalCode: null as any,
    contraPartida: null as any,
    accountCashType: 0,
    exportToAccounting: false,
  })

  const accountsAExisting = await storage.getAllCashAccounts(companyA.id)
  const accountsBExisting = await storage.getAllCashAccounts(companyB.id)
  const ensureAccount = async (companyId: string, description: string, movement: "E" | "S", typeId?: string, existing: CashAccount[]) => {
    const found = existing.find((a: CashAccount) => a.description === description && a.movementIndicator === movement)
    if (found) return found
    return await storage.createCashAccount(makeAccount(companyId, description, movement, typeId))
  }
  await ensureAccount(companyA.id, "Vendas", "E", tRec.id, accountsAExisting)
  await ensureAccount(companyA.id, "Serviços", "E", tRec.id, accountsAExisting)
  await ensureAccount(companyA.id, "Impostos", "S", tDes.id, accountsAExisting)
  await ensureAccount(companyA.id, "Salários", "S", tDes.id, accountsAExisting)
  await ensureAccount(companyA.id, "Diversos", "S", tDes.id, accountsAExisting)

  await ensureAccount(companyB.id, "Vendas", "E", tRec.id, accountsBExisting)
  await ensureAccount(companyB.id, "Serviços", "E", tRec.id, accountsBExisting)
  await ensureAccount(companyB.id, "Impostos", "S", tDes.id, accountsBExisting)
  await ensureAccount(companyB.id, "Salários", "S", tDes.id, accountsBExisting)
  await ensureAccount(companyB.id, "Diversos", "S", tDes.id, accountsBExisting)

  const makeClient = (companyId: string, companyName: string, contactName: string, plan: string, monthly: string, dueDay: number): InsertClient => ({
    companyId,
    companyName,
    contactName,
    email: `${contactName.split(" ")[0].toLowerCase()}@${companyName.split(" ")[0].toLowerCase()}.com`,
    phone: "(11) 90000-0000",
    cnpj: "11.111.111/0001-11",
    plan,
    monthlyValue: monthly as any,
    dueDay,
    status: "active",
  })

  const clientsAExisting = await storage.getAllClients(companyA.id)
  const clientsBExisting = await storage.getAllClients(companyB.id)
  const ensureClient = async (companyId: string, companyName: string, contactName: string, plan: string, monthly: string, dueDay: number, existing: Client[]) => {
    const found = existing.find((c: Client) => c.companyName === companyName)
    if (found) return found
    return await storage.createClient(makeClient(companyId, companyName, contactName, plan, monthly, dueDay))
  }
  const cA1 = await ensureClient(companyA.id, "Alpha Tech", "João Silva", "Enterprise", "2500.00", 10, clientsAExisting)
  const cA2 = await ensureClient(companyA.id, "Beta Comercial", "Maria Santos", "Professional", "1200.00", 15, clientsAExisting)
  const cA3 = await ensureClient(companyA.id, "Gama Indústria", "Carlos Oliveira", "Basic", "500.00", 20, clientsAExisting)
  const cA4 = await ensureClient(companyA.id, "Delta Distribuidora", "Ana Costa", "Professional", "1500.00", 25, clientsAExisting)

  const cB1 = await ensureClient(companyB.id, "Omega Logística", "Pedro Alves", "Enterprise", "3000.00", 10, clientsBExisting)
  const cB2 = await ensureClient(companyB.id, "Sigma Serviços", "Paula Souza", "Professional", "1100.00", 15, clientsBExisting)
  const cB3 = await ensureClient(companyB.id, "Rho Sistemas", "Rafael Lima", "Basic", "600.00", 20, clientsBExisting)
  const cB4 = await ensureClient(companyB.id, "Tau Market", "Tânia Reis", "Professional", "1300.00", 25, clientsBExisting)

  const addLicense = async (companyId: string, clientId: string, key: string, days: number, active: boolean) => {
    const payload: InsertLicense = { companyId, clientId, licenseKey: key, isActive: active, expiresAt: new Date(Date.now() + days * 86400000) }
    await storage.createLicense(payload)
  }

  const existingLicensesA = await storage.getAllLicenses(companyA.id)
  const existingLicensesB = await storage.getAllLicenses(companyB.id)
  const ensureLicense = async (companyId: string, clientId: string, key: string, days: number, active: boolean, existing: License[]) => {
    const found = existing.find((l: License) => l.licenseKey === key)
    if (found) return found
    const payload: InsertLicense = { companyId, clientId, licenseKey: key, isActive: active, expiresAt: new Date(Date.now() + days * 86400000) }
    return await storage.createLicense(payload)
  }
  await ensureLicense(companyA.id, cA1.id, "YUKEM-A1-001", 200, true, existingLicensesA)
  await ensureLicense(companyA.id, cA2.id, "YUKEM-A2-001", 120, true, existingLicensesA)
  await ensureLicense(companyA.id, cA3.id, "YUKEM-A3-001", 30, false, existingLicensesA)
  await ensureLicense(companyA.id, cA4.id, "YUKEM-A4-001", 90, true, existingLicensesA)

  await ensureLicense(companyB.id, cB1.id, "YUKEM-B1-001", 220, true, existingLicensesB)
  await ensureLicense(companyB.id, cB2.id, "YUKEM-B2-001", 150, true, existingLicensesB)
  await ensureLicense(companyB.id, cB3.id, "YUKEM-B3-001", 45, false, existingLicensesB)
  await ensureLicense(companyB.id, cB4.id, "YUKEM-B4-001", 80, true, existingLicensesB)

  const addInvoice = async (companyId: string, clientId: string, amount: string, dueOffsetDays: number, status: "paid" | "pending" | "overdue") => {
    const due = new Date(Date.now() + dueOffsetDays * 86400000)
    const payload: InsertInvoice = { companyId, clientId, amount: amount as any, dueDate: due, status }
    if (status === "paid") (payload as any).paidAt = new Date()
    await storage.createInvoice(payload)
  }

  const existingInvoicesA = await storage.getAllInvoices(companyA.id)
  const existingInvoicesB = await storage.getAllInvoices(companyB.id)
  const ensureInvoice = async (companyId: string, clientId: string, amount: string, dueOffsetDays: number, status: "paid" | "pending" | "overdue", existing: Invoice[]) => {
    const due = new Date(Date.now() + dueOffsetDays * 86400000)
    const dup = existing.find((i: Invoice) => i.clientId === clientId && String(i.amount) === String(amount) && i.status === status)
    if (dup) return dup
    const payload: InsertInvoice = { companyId, clientId, amount: amount as any, dueDate: due, status }
    if (status === "paid") (payload as any).paidAt = new Date()
    return await storage.createInvoice(payload)
  }
  await ensureInvoice(companyA.id, cA1.id, "2500.00", 15, "paid", existingInvoicesA)
  await ensureInvoice(companyA.id, cA2.id, "1200.00", 10, "pending", existingInvoicesA)
  await ensureInvoice(companyA.id, cA3.id, "500.00", -5, "overdue", existingInvoicesA)
  await ensureInvoice(companyA.id, cA4.id, "1500.00", 20, "paid", existingInvoicesA)

  await ensureInvoice(companyB.id, cB1.id, "3000.00", 12, "pending", existingInvoicesB)
  await ensureInvoice(companyB.id, cB2.id, "1100.00", -3, "overdue", existingInvoicesB)
  await ensureInvoice(companyB.id, cB3.id, "600.00", 7, "pending", existingInvoicesB)
  await ensureInvoice(companyB.id, cB4.id, "1300.00", 18, "paid", existingInvoicesB)

  const openSession = async (companyId: string, baseId: string, movement: "E" | "S") => {
    const payload: InsertCashSession = { companyId, baseId, openedByUserId: user.id, movementIndicator: movement, balance: "0" as any, closed: false }
    await storage.openCashSession(payload)
  }

  const existingSessionsA1 = await storage.getCashSessions(companyA.id, baseA1.id)
  const existingSessionsA2 = await storage.getCashSessions(companyA.id, baseA2.id)
  const existingSessionsB1 = await storage.getCashSessions(companyB.id, baseB1.id)
  const existingSessionsB2 = await storage.getCashSessions(companyB.id, baseB2.id)
  if (!existingSessionsA1.length) await openSession(companyA.id, baseA1.id, "E")
  if (!existingSessionsA2.length) await openSession(companyA.id, baseA2.id, "S")
  if (!existingSessionsB1.length) await openSession(companyB.id, baseB1.id, "E")
  if (!existingSessionsB2.length) await openSession(companyB.id, baseB2.id, "S")

  const companies = await storage.getAllCompanies()
  const clientsA = await storage.getAllClients(companyA.id)
  const clientsB = await storage.getAllClients(companyB.id)
  const licensesA = await storage.getAllLicenses(companyA.id)
  const licensesB = await storage.getAllLicenses(companyB.id)
  const invoicesA = await storage.getAllInvoices(companyA.id)
  const invoicesB = await storage.getAllInvoices(companyB.id)
  const basesA = await storage.getAllCashBases(companyA.id)
  const basesB = await storage.getAllCashBases(companyB.id)
  const accountsA = await storage.getAllCashAccounts(companyA.id)
  const accountsB = await storage.getAllCashAccounts(companyB.id)

  console.log(JSON.stringify({
    companies: companies.length,
    clients: clientsA.length + clientsB.length,
    licenses: licensesA.length + licensesB.length,
    invoices: invoicesA.length + invoicesB.length,
    bases: basesA.length + basesB.length,
    accounts: accountsA.length + accountsB.length,
  }))
}
