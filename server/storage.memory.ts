import {
  type Client,
  type InsertClient,
  type License,
  type InsertLicense,
  type Invoice,
  type InsertInvoice,
  type User,
  type UpsertUser,
  type BoletoConfig,
  type InsertBoletoConfig,
  type Role,
  type InsertRole,
  type RoleAssignment,
  type InsertRoleAssignment,
  type RolePermission,
  type InsertRolePermission,
  type Company,
  type InsertCompany,
  type UserCompany,
  type InsertUserCompany,
  type Resource,
  type Action,
  type CashAccountType,
  type InsertCashAccountType,
  type CashBase,
  type InsertCashBase,
  type CashAccount,
  type InsertCashAccount,
  type CashSession,
  type InsertCashSession,
  type UserGridPreference,
  type InsertUserGridPreference,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined>;

  getClient(id: string, companyId?: string): Promise<Client | undefined>;
  getAllClients(companyId?: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>, companyId?: string): Promise<Client | undefined>;
  deleteClient(id: string, companyId?: string): Promise<boolean>;

  getLicense(id: string, companyId?: string): Promise<License | undefined>;
  getLicensesByClientId(clientId: string): Promise<License[]>;
  getAllLicenses(companyId?: string): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, license: Partial<InsertLicense>, companyId?: string): Promise<License | undefined>;
  deleteLicense(id: string, companyId?: string): Promise<boolean>;
  blockClientLicenses(clientId: string): Promise<number>;
  unblockClientLicenses(clientId: string): Promise<number>;
  checkAndBlockOverdueLicenses(companyId?: string): Promise<{ blocked: number; unblocked: number }>;

  getInvoice(id: string, companyId?: string): Promise<Invoice | undefined>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  getAllInvoices(companyId?: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>, companyId?: string): Promise<Invoice | undefined>;
  deleteInvoice(id: string, companyId?: string): Promise<boolean>;
  updateInvoiceBoletoData(id: string, companyId: string, boletoData: {
    boletoParcelaId: string;
    boletoQrcodeId: string | null;
    boletoQrcode: string | null;
    boletoQrcodeBase64: string | null;
    boletoUrl: string | null;
    boletoGeneratedAt: Date;
  }): Promise<Invoice | undefined>;

  getBoletoConfig(companyId?: string): Promise<BoletoConfig | undefined>;
  saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig>;

  getAllRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  getUserRoles(userId: string): Promise<Role[]>;
  assignRole(assignment: InsertRoleAssignment): Promise<RoleAssignment>;
  removeRoleAssignment(userId: string, roleId: string): Promise<boolean>;
  getAllUsersWithRoles(): Promise<Array<User & { roles: Role[]; companies: Company[] }>>;

  getPermissionsByRole(roleId: string): Promise<RolePermission[]>;
  getAllPermissions(): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: string, updates: Partial<InsertRolePermission>): Promise<RolePermission | undefined>;
  getUserPermissions(userId: string): Promise<Map<Resource, Set<Action>>>;
  checkUserPermission(userId: string, resource: Resource, action: Action): Promise<boolean>;

  getAllCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  getUserCompanies(userId: string): Promise<Company[]>;
  assignUserToCompany(assignment: InsertUserCompany): Promise<UserCompany>;
  removeUserFromCompany(userId: string, companyId: string): Promise<boolean>;
  setActiveCompany(userId: string, companyId: string): Promise<User | undefined>;

  getAllCashAccountTypes(): Promise<CashAccountType[]>;
  createCashAccountType(type: InsertCashAccountType): Promise<CashAccountType>;
  listCashAccountTypes(options: { q?: string; orderBy?: 'name'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashAccountType[]; total: number; page: number; pageSize: number }>;
  updateCashAccountType(id: string, updates: Partial<InsertCashAccountType>): Promise<CashAccountType | undefined>;
  deleteCashAccountType(id: string): Promise<boolean>;
  
  getAllCashBases(companyId?: string): Promise<CashBase[]>;
  createCashBase(base: InsertCashBase): Promise<CashBase>;
  listCashBases(options: { companyId?: string; q?: string; active?: boolean; orderBy?: 'description' | 'active'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashBase[]; total: number; page: number; pageSize: number }>;
  updateCashBase(id: string, updates: Partial<InsertCashBase>, companyId?: string): Promise<CashBase | undefined>;
  deleteCashBase(id: string, companyId?: string): Promise<boolean>;
  
  getAllCashAccounts(companyId?: string): Promise<CashAccount[]>;
  createCashAccount(account: InsertCashAccount): Promise<CashAccount>;
  listCashAccounts(options: { companyId?: string; q?: string; movement?: string; inactive?: boolean; category?: number; accountType?: number; orderBy?: 'description' | 'category' | 'accountCashType'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number; filtersTree?: any }): Promise<{ items: CashAccount[]; total: number; page: number; pageSize: number }>;
  
  getCashSessions(companyId?: string, baseId?: string): Promise<CashSession[]>;
  openCashSession(session: InsertCashSession): Promise<CashSession>;
  listCashSessions(options: { companyId?: string; baseId?: string; status?: 'open' | 'closed'; movement?: string; orderBy?: 'openedAt' | 'closedAt'; orderDir?: 'asc' | 'desc'; openedFrom?: Date; openedTo?: Date; closedFrom?: Date; closedTo?: Date; page?: number; pageSize?: number }): Promise<{ items: CashSession[]; total: number; page: number; pageSize: number }>;
  closeCashSession(id: string, updates?: any, companyId?: string): Promise<CashSession | undefined>;
  
  executeQuery(query: string, params?: any[]): Promise<{ rows: any[]; fields: { name: string }[] }>;

  getUserGridPreference(userId: string, resource: string): Promise<UserGridPreference | undefined>;
  upsertUserGridPreference(pref: InsertUserGridPreference): Promise<UserGridPreference>;
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private clients: Client[] = [];
  private licenses: License[] = [];
  private invoices: Invoice[] = [];
  private roles: Role[] = [];
  private rolePermissions: RolePermission[] = [];
  private roleAssignments: RoleAssignment[] = [];
  private companies: Company[] = [];
  private userCompanies: UserCompany[] = [];
  private boletoConfig?: BoletoConfig;
  private cashAccountTypes: CashAccountType[] = [];
  private cashBases: CashBase[] = [];
  private cashAccounts: CashAccount[] = [];
  private cashSessions: CashSession[] = [];
  private userGridPrefs: UserGridPreference[] = [] as any;

  constructor() {
    const adminRole: Role = { id: crypto.randomUUID(), name: "Administrador", description: "Acesso total ao sistema", isSystem: true } as any;
    const managerRole: Role = { id: crypto.randomUUID(), name: "Gerente", description: "Gerenciamento de clientes e licenças", isSystem: false } as any;
    const userRole: Role = { id: crypto.randomUUID(), name: "Usuário", description: "Visualização de dados", isSystem: false } as any;
    this.roles.push(adminRole, managerRole, userRole);
    const resources: Resource[] = ["clients", "licenses", "invoices", "boleto_config", "companies"] as any;
    for (const r of resources) {
      this.rolePermissions.push({ id: crypto.randomUUID(), roleId: adminRole.id, resource: r as any, canCreate: true, canRead: true, canUpdate: true, canDelete: true } as any);
      this.rolePermissions.push({ id: crypto.randomUUID(), roleId: managerRole.id, resource: r as any, canCreate: true, canRead: true, canUpdate: true, canDelete: false } as any);
      this.rolePermissions.push({ id: crypto.randomUUID(), roleId: userRole.id, resource: r as any, canCreate: false, canRead: true, canUpdate: false, canDelete: false } as any);
    }
    const company: Company = { id: crypto.randomUUID(), name: "Tech Solutions Ltda", status: "active" } as any;
    const company2: Company = { id: crypto.randomUUID(), name: "Comercial Santos", status: "active" } as any;
    this.companies.push(company, company2);
    const u: User = { id: crypto.randomUUID(), email: "dev@yukem.com.br", firstName: "Dev", lastName: "Master", profileImageUrl: null, role: "admin", activeCompanyId: company.id, createdAt: new Date() } as any;
    this.users.push(u);
    this.roleAssignments.push({ id: crypto.randomUUID(), userId: u.id, roleId: adminRole.id } as any);
    this.userCompanies.push({ id: crypto.randomUUID(), userId: u.id, companyId: company.id } as any);
    const c1: Client = { id: crypto.randomUUID(), companyId: company.id, companyName: "Tech Solutions Ltda", contactName: "João Silva", email: "joao@techsolutions.com", phone: "(11) 98765-4321", cnpj: "12.345.678/0001-90", plan: "Enterprise", monthlyValue: "2500.00", status: "active", createdAt: new Date() } as any;
    const c2: Client = { id: crypto.randomUUID(), companyId: company2.id, companyName: "Comercial Santos", contactName: "Maria Santos", email: "maria@santos.com.br", phone: "(21) 97654-3210", cnpj: "23.456.789/0001-01", plan: "Professional", monthlyValue: "1200.00", status: "active", createdAt: new Date() } as any;
    this.clients.push(c1, c2);
    const l1: License = { id: crypto.randomUUID(), companyId: company.id, clientId: c1.id, licenseKey: "YUKEM-2024-TECH-XYZ123", isActive: true, activatedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 86400000) } as any;
    const l2: License = { id: crypto.randomUUID(), companyId: company2.id, clientId: c2.id, licenseKey: "YUKEM-2024-SANTOS-ABC456", isActive: true, activatedAt: new Date(), expiresAt: new Date(Date.now() + 60 * 86400000) } as any;
    this.licenses.push(l1, l2);
    const i1: Invoice = { id: crypto.randomUUID(), companyId: company.id, clientId: c1.id, amount: "2500.00", dueDate: new Date(Date.now() + 10 * 86400000), status: "paid", createdAt: new Date() } as any;
    const i2: Invoice = { id: crypto.randomUUID(), companyId: company2.id, clientId: c2.id, amount: "1200.00", dueDate: new Date(Date.now() + 20 * 86400000), status: "pending", createdAt: new Date() } as any;
    this.invoices.push(i1, i2);

    const t1: CashAccountType = { id: crypto.randomUUID(), name: "Receita", description: "Entradas", createdAt: new Date() } as any;
    const t2: CashAccountType = { id: crypto.randomUUID(), name: "Despesa", description: "Saídas", createdAt: new Date() } as any;
    this.cashAccountTypes.push(t1, t2);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const byEmail = userData.email ? await this.getUserByEmail(userData.email) : undefined;
    const byId = userData.id ? await this.getUser(userData.id) : undefined;
    const existing = byEmail || byId;
    if (existing) {
      const isYukemEmail = (userData.email?.endsWith('@yukem.com') || userData.email?.endsWith('@yukem.com.br')) ?? false;
      existing.firstName = userData.firstName ?? existing.firstName;
      existing.lastName = userData.lastName ?? existing.lastName;
      existing.profileImageUrl = userData.profileImageUrl ?? existing.profileImageUrl;
      if (isYukemEmail) (existing as any).role = 'admin';
      return existing;
    }
    const isYukemEmail = (userData.email?.endsWith('@yukem.com') || userData.email?.endsWith('@yukem.com.br')) ?? false;
    const user: User = {
      id: userData.id ?? crypto.randomUUID(),
      email: userData.email!,
      firstName: userData.firstName ?? '',
      lastName: userData.lastName ?? '',
      profileImageUrl: userData.profileImageUrl ?? null,
      role: isYukemEmail ? 'admin' : ('user' as any),
      activeCompanyId: this.companies[0]?.id,
      createdAt: new Date(),
    } as any;
    this.users.push(user);
    const defaultRole = this.roles.find(r => r.name === 'Usuário');
    if (!isYukemEmail && defaultRole) {
      const assignment: RoleAssignment = { id: crypto.randomUUID(), userId: user.id, roleId: defaultRole.id } as any;
      this.roleAssignments.push(assignment);
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const u = await this.getUser(id);
    if (!u) return undefined;
    Object.assign(u, updates);
    return u;
  }

  async getClient(id: string, companyId?: string): Promise<Client | undefined> {
    return this.clients.find(c => c.id === id && (!companyId || c.companyId === companyId));
  }

  async getAllClients(companyId?: string): Promise<Client[]> {
    return companyId ? this.clients.filter(c => c.companyId === companyId) : this.clients;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const c: Client = { id: crypto.randomUUID(), createdAt: new Date(), ...clientData } as any;
    this.clients.push(c);
    return c;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>, companyId?: string): Promise<Client | undefined> {
    const c = await this.getClient(id, companyId);
    if (!c) return undefined;
    Object.assign(c, clientData);
    return c;
  }

  async deleteClient(id: string, companyId?: string): Promise<boolean> {
    const before = this.clients.length;
    this.clients = this.clients.filter(c => !(c.id === id && (!companyId || c.companyId === companyId)));
    return this.clients.length < before;
  }

  async getLicense(id: string, companyId?: string): Promise<License | undefined> {
    return this.licenses.find(l => l.id === id && (!companyId || l.companyId === companyId));
  }

  async getLicensesByClientId(clientId: string): Promise<License[]> {
    return this.licenses.filter(l => l.clientId === clientId);
  }

  async getAllLicenses(companyId?: string): Promise<License[]> {
    return companyId ? this.licenses.filter(l => l.companyId === companyId) : this.licenses;
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const l: License = { id: crypto.randomUUID(), activatedAt: new Date(), ...licenseData } as any;
    this.licenses.push(l);
    return l;
  }

  async updateLicense(id: string, licenseData: Partial<InsertLicense>, companyId?: string): Promise<License | undefined> {
    const l = await this.getLicense(id, companyId);
    if (!l) return undefined;
    Object.assign(l, licenseData);
    return l;
  }

  async deleteLicense(id: string, companyId?: string): Promise<boolean> {
    const before = this.licenses.length;
    this.licenses = this.licenses.filter(l => !(l.id === id && (!companyId || l.companyId === companyId)));
    return this.licenses.length < before;
  }

  async blockClientLicenses(clientId: string): Promise<number> {
    const affected = this.licenses.filter(l => l.clientId === clientId);
    for (const l of affected) l.isActive = false as any;
    return affected.length;
  }

  async unblockClientLicenses(clientId: string): Promise<number> {
    const affected = this.licenses.filter(l => l.clientId === clientId);
    for (const l of affected) l.isActive = true as any;
    return affected.length;
  }

  async checkAndBlockOverdueLicenses(companyId?: string): Promise<{ blocked: number; unblocked: number }> {
    const now = new Date();
    let blocked = 0;
    let unblocked = 0;
    const clients = await this.getAllClients(companyId);
    for (const c of clients) {
      const invs = this.invoices.filter(i => i.clientId === c.id);
      const hasOverdue = invs.some(inv => inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < now);
      if (hasOverdue) blocked += await this.blockClientLicenses(c.id);
      else unblocked += await this.unblockClientLicenses(c.id);
    }
    return { blocked, unblocked };
  }

  async getInvoice(id: string, companyId?: string): Promise<Invoice | undefined> {
    return this.invoices.find(i => i.id === id && (!companyId || i.companyId === companyId));
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return this.invoices.filter(i => i.clientId === clientId);
  }

  async getAllInvoices(companyId?: string): Promise<Invoice[]> {
    return companyId ? this.invoices.filter(i => i.companyId === companyId) : this.invoices;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const i: Invoice = { id: crypto.randomUUID(), createdAt: new Date(), ...invoiceData } as any;
    this.invoices.push(i);
    return i;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>, companyId?: string): Promise<Invoice | undefined> {
    const i = await this.getInvoice(id, companyId);
    if (!i) return undefined;
    Object.assign(i, invoiceData);
    return i;
  }

  async deleteInvoice(id: string, companyId?: string): Promise<boolean> {
    const before = this.invoices.length;
    this.invoices = this.invoices.filter(i => !(i.id === id && (!companyId || i.companyId === companyId)));
    return this.invoices.length < before;
  }

  async updateInvoiceBoletoData(id: string, companyId: string, boletoData: {
    boletoParcelaId: string;
    boletoQrcodeId: string | null;
    boletoQrcode: string | null;
    boletoQrcodeBase64: string | null;
    boletoUrl: string | null;
    boletoGeneratedAt: Date;
  }): Promise<Invoice | undefined> {
    const i = await this.getInvoice(id, companyId);
    if (!i) return undefined;
    (i as any).parcelaId = boletoData.boletoParcelaId;
    (i as any).qrcodeId = boletoData.boletoQrcodeId;
    (i as any).qrcode = boletoData.boletoQrcode;
    (i as any).qrcodeBase64 = boletoData.boletoQrcodeBase64;
    (i as any).url = boletoData.boletoUrl;
    (i as any).generatedAt = boletoData.boletoGeneratedAt;
    return i;
  }

  async getBoletoConfig(companyId?: string): Promise<BoletoConfig | undefined> {
    return this.boletoConfig && (!companyId || (this.boletoConfig as any).companyId === companyId) ? this.boletoConfig : undefined;
  }

  async saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig> {
    this.boletoConfig = { id: crypto.randomUUID(), ...(config as any) } as any;
    return this.boletoConfig;
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roles;
  }

  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.find(r => r.id === id);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const r: Role = { id: crypto.randomUUID(), ...insertRole } as any;
    this.roles.push(r);
    return r;
  }

  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const r = await this.getRole(id);
    if (!r) return undefined;
    Object.assign(r, updates);
    return r;
  }

  async deleteRole(id: string): Promise<boolean> {
    const before = this.roles.length;
    this.roles = this.roles.filter(r => r.id !== id);
    return this.roles.length < before;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = this.roleAssignments.filter(a => a.userId === userId).map(a => a.roleId);
    return this.roles.filter(r => roleIds.includes(r.id));
  }

  async assignRole(assignment: InsertRoleAssignment): Promise<RoleAssignment> {
    const ra: RoleAssignment = { id: crypto.randomUUID(), ...assignment } as any;
    this.roleAssignments.push(ra);
    return ra;
  }

  async removeRoleAssignment(userId: string, roleId: string): Promise<boolean> {
    const before = this.roleAssignments.length;
    this.roleAssignments = this.roleAssignments.filter(a => !(a.userId === userId && a.roleId === roleId));
    return this.roleAssignments.length < before;
  }

  async getAllUsersWithRoles(): Promise<Array<User & { roles: Role[]; companies: Company[] }>> {
    return Promise.all(this.users.map(async u => ({ ...u, roles: await this.getUserRoles(u.id), companies: await this.getUserCompanies(u.id) })));
  }

  async getPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return this.rolePermissions.filter(p => p.roleId === roleId);
  }

  async getAllPermissions(): Promise<RolePermission[]> {
    return this.rolePermissions;
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const p: RolePermission = { id: crypto.randomUUID(), ...permission } as any;
    this.rolePermissions.push(p);
    return p;
  }

  async updateRolePermission(id: string, updates: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    const p = this.rolePermissions.find(x => x.id === id);
    if (!p) return undefined;
    Object.assign(p, updates);
    return p;
  }

  async getUserPermissions(userId: string): Promise<Map<Resource, Set<Action>>> {
    const map = new Map<Resource, Set<Action>>();
    const roles = await this.getUserRoles(userId);
    const perms = this.rolePermissions.filter(p => roles.find(r => r.id === p.roleId));
    for (const p of perms) {
      const actions = new Set<Action>();
      if (p.canCreate) actions.add('create');
      if (p.canRead) actions.add('read');
      if (p.canUpdate) actions.add('update');
      if (p.canDelete) actions.add('delete');
      map.set(p.resource as any, actions);
    }
    return map;
  }

  async checkUserPermission(userId: string, resource: Resource, action: Action): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    const actions = perms.get(resource as any);
    if (!actions) return false;
    return actions.has(action);
  }

  async getAllCompanies(): Promise<Company[]> {
    return this.companies;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.find(c => c.id === id);
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const c: Company = { id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...companyData } as any;
    this.companies.push(c);
    return c;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const c = await this.getCompany(id);
    if (!c) return undefined;
    Object.assign(c, updates);
    (c as any).updatedAt = new Date();
    return c;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const before = this.companies.length;
    this.companies = this.companies.filter(c => c.id !== id);
    return this.companies.length < before;
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const companyIds = this.userCompanies.filter(uc => uc.userId === userId).map(uc => uc.companyId);
    return this.companies.filter(c => companyIds.includes(c.id));
  }

  async assignUserToCompany(assignment: InsertUserCompany): Promise<UserCompany> {
    const uc: UserCompany = { id: crypto.randomUUID(), ...assignment } as any;
    this.userCompanies.push(uc);
    return uc;
  }

  async removeUserFromCompany(userId: string, companyId: string): Promise<boolean> {
    const before = this.userCompanies.length;
    this.userCompanies = this.userCompanies.filter(uc => !(uc.userId === userId && uc.companyId === companyId));
    return this.userCompanies.length < before;
  }

  async setActiveCompany(userId: string, companyId: string): Promise<User | undefined> {
    const u = await this.getUser(userId);
    if (!u) return undefined;
    (u as any).activeCompanyId = companyId;
    return u;
  }

  async getAllCashAccountTypes(): Promise<CashAccountType[]> {
    return this.cashAccountTypes;
  }

  async createCashAccountType(type: InsertCashAccountType): Promise<CashAccountType> {
    const t: CashAccountType = { id: crypto.randomUUID(), createdAt: new Date(), ...type } as any;
    this.cashAccountTypes.push(t);
    return t;
  }

  async listCashAccountTypes(options: { q?: string; orderBy?: 'name'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashAccountType[]; total: number; page: number; pageSize: number }> {
    const { q, orderBy = 'name', orderDir = 'asc', page = 1, pageSize = 10 } = options || {} as any;
    let items = [...this.cashAccountTypes];
    if (q) {
      const ql = String(q).toLowerCase();
      items = items.filter(t => (t.name || '').toLowerCase().includes(ql) || (t.description || '').toLowerCase().includes(ql));
    }
    items.sort((a, b) => {
      const av = (a.name || '').toLowerCase(); const bv = (b.name || '').toLowerCase();
      const diff = av.localeCompare(bv);
      return orderDir === 'asc' ? diff : -diff;
    });
    const total = items.length;
    const offset = Math.max((page - 1) * pageSize, 0);
    return { items: items.slice(offset, offset + pageSize), total, page, pageSize };
  }

  async updateCashAccountType(id: string, updates: Partial<InsertCashAccountType>): Promise<CashAccountType | undefined> {
    const t = this.cashAccountTypes.find(x => x.id === id);
    if (!t) return undefined;
    Object.assign(t, updates);
    (t as any).updatedAt = new Date();
    return t;
  }

  async deleteCashAccountType(id: string): Promise<boolean> {
    const before = this.cashAccountTypes.length;
    this.cashAccountTypes = this.cashAccountTypes.filter(x => x.id !== id);
    return this.cashAccountTypes.length < before;
  }

  async getAllCashBases(companyId?: string): Promise<CashBase[]> {
    return companyId ? this.cashBases.filter(b => b.companyId === companyId) : this.cashBases;
  }

  async createCashBase(base: InsertCashBase): Promise<CashBase> {
    const b: CashBase = { id: crypto.randomUUID(), createdAt: new Date(), ...base } as any;
    this.cashBases.push(b);
    return b;
  }

  async listCashBases(options: { companyId?: string; q?: string; active?: boolean; orderBy?: 'description' | 'active'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashBase[]; total: number; page: number; pageSize: number }> {
    const { companyId, q, active, orderBy = 'description', orderDir = 'asc', page = 1, pageSize = 10 } = options || {} as any;
    let items = [...this.cashBases].filter(b => (!companyId || b.companyId === companyId));
    if (q) items = items.filter(b => (b.description || '').toLowerCase().includes(String(q).toLowerCase()));
    if (active !== undefined) items = items.filter(b => !!b.active === !!active);
    items.sort((a, b) => {
      const av = orderBy === 'active' ? (!!a.active ? 1 : 0) : String(a.description || '').toLowerCase();
      const bv = orderBy === 'active' ? (!!b.active ? 1 : 0) : String(b.description || '').toLowerCase();
      const diff = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return orderDir === 'asc' ? diff : -diff;
    });
    const total = items.length;
    const offset = Math.max((page - 1) * pageSize, 0);
    return { items: items.slice(offset, offset + pageSize), total, page, pageSize };
  }

  async updateCashBase(id: string, updates: Partial<InsertCashBase>, companyId?: string): Promise<CashBase | undefined> {
    const b = this.cashBases.find(x => x.id === id && (!companyId || x.companyId === companyId));
    if (!b) return undefined;
    Object.assign(b, updates);
    (b as any).updatedAt = new Date();
    return b;
  }

  async deleteCashBase(id: string, companyId?: string): Promise<boolean> {
    const before = this.cashBases.length;
    this.cashBases = this.cashBases.filter(x => !(x.id === id && (!companyId || x.companyId === companyId)));
    return this.cashBases.length < before;
  }

  async getAllCashAccounts(companyId?: string): Promise<CashAccount[]> {
    return companyId ? this.cashAccounts.filter(a => a.companyId === companyId) : this.cashAccounts;
  }

  async createCashAccount(account: InsertCashAccount): Promise<CashAccount> {
    const a: CashAccount = { id: crypto.randomUUID(), createdAt: new Date(), ...account } as any;
    this.cashAccounts.push(a);
    return a;
  }

  async listCashAccounts(options: { companyId?: string; q?: string; movement?: string; inactive?: boolean; category?: number; accountType?: number; orderBy?: 'description' | 'category' | 'accountCashType'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number; filtersTree?: any }): Promise<{ items: CashAccount[]; total: number; page: number; pageSize: number }> {
    const { companyId, q, movement, inactive, category, accountType, orderBy = 'description', orderDir = 'asc', page = 1, pageSize = 10, filtersTree } = options || {} as any;
    const evalCond = (item: any, cond: any): boolean => {
      const v = item[cond.field];
      const op = String(cond.op || '').toLowerCase();
      if (cond.field === 'category' || cond.field === 'accountCashType') {
        const num = Number(v); const a = Number(cond.value); const b = Number(cond.value2);
        if (op === 'equals') return num === a;
        if (op === 'gt') return num > a;
        if (op === 'lt') return num < a;
        if (op === 'between') return !isNaN(a) && !isNaN(b) ? (num >= a && num <= b) : false;
        return true;
      }
      if (cond.field === 'inactive') return op === 'equals' ? (!!v === !!cond.value) : true;
      if (cond.field === 'movementIndicator') {
        if (op === 'equals') return String(v) === String(cond.value);
        if (op === 'in') return Array.isArray(cond.value) ? cond.value.includes(String(v)) : String(v) === String(cond.value);
        return true;
      }
      if (cond.field === 'typeId') {
        if (op === 'equals') return String(v || '') === String(cond.value || '');
        if (op === 'in') return Array.isArray(cond.value) ? cond.value.includes(String(v || '')) : String(v || '') === String(cond.value || '');
        return true;
      }
      if (cond.field === 'id' || cond.field === 'description') {
        const sv = String(v || '').toLowerCase(); const qv = String(cond.value || '').toLowerCase();
        if (op === 'equals') return sv === qv;
        if (op === 'contains') return sv.includes(qv);
        if (op === 'startswith') return sv.startsWith(qv);
        if (op === 'endswith') return sv.endsWith(qv);
        if (op === 'in') {
          const arr = Array.isArray(cond.value) ? cond.value.map((x: string) => String(x).toLowerCase()) : String(cond.value || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
          return arr.includes(sv);
        }
        return true;
      }
      if (cond.field === 'createdAt' || cond.field === 'updatedAt') {
        const d = v ? new Date(v) : undefined;
        if (!d) return false;
        if (op === 'equals') return String(cond.value || '') ? (d.toISOString().slice(0,10) === String(cond.value)) : true;
        if (op === 'between') {
          const a = cond.value ? new Date(String(cond.value)) : undefined;
          const b = cond.value2 ? new Date(String(cond.value2)) : undefined;
          if (!a || !b) return false;
          const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
          const db = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59);
          return d >= da && d <= db;
        }
        return true;
      }
      return true;
    };
    const matchesTree = (item: any, node: any): boolean => {
      if (!node) return true;
      if (node.type === 'cond') return evalCond(item, node);
      if (node.type === 'group') {
        const children = (node.children || []) as any[];
        if (!children.length) return true;
        const results = children.map(ch => matchesTree(item, ch));
        return String(node.logical) === 'OR' ? results.some(Boolean) : results.every(Boolean);
      }
      return true;
    };
    let items = [...this.cashAccounts].filter(a => (!companyId || a.companyId === companyId));
    if (q) items = items.filter(a => (a.description || '').toLowerCase().includes(String(q).toLowerCase()));
    if (movement) items = items.filter(a => String(a.movementIndicator || '') === String(movement));
    if (inactive !== undefined) items = items.filter(a => !!a.inactive === !!inactive);
    if (category !== undefined) items = items.filter(a => Number(a.category) === Number(category));
    if (accountType !== undefined) items = items.filter(a => Number(a.accountCashType) === Number(accountType));
    if (filtersTree) items = items.filter(a => matchesTree(a, filtersTree));
    items.sort((a, b) => {
      const av = orderBy === 'category' ? Number(a.category || 0) : orderBy === 'accountCashType' ? Number(a.accountCashType || 0) : String(a.description || '').toLowerCase();
      const bv = orderBy === 'category' ? Number(b.category || 0) : orderBy === 'accountCashType' ? Number(b.accountCashType || 0) : String(b.description || '').toLowerCase();
      const diff = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return orderDir === 'asc' ? diff : -diff;
    });
    const total = items.length;
    const offset = Math.max((page - 1) * pageSize, 0);
    return { items: items.slice(offset, offset + pageSize), total, page, pageSize };
  }

  async getCashSessions(companyId?: string, baseId?: string): Promise<CashSession[]> {
    return this.cashSessions.filter(s => (!companyId || s.companyId === companyId) && (!baseId || s.baseId === baseId));
  }

  async openCashSession(session: InsertCashSession): Promise<CashSession> {
    const s: CashSession = { id: crypto.randomUUID(), openedAt: new Date() as any, ...session } as any;
    this.cashSessions.push(s);
    return s;
  }

  async listCashSessions(options: { companyId?: string; baseId?: string; status?: 'open' | 'closed'; movement?: string; orderBy?: 'openedAt' | 'closedAt'; orderDir?: 'asc' | 'desc'; openedFrom?: Date; openedTo?: Date; closedFrom?: Date; closedTo?: Date; page?: number; pageSize?: number }): Promise<{ items: CashSession[]; total: number; page: number; pageSize: number }> {
    const { companyId, baseId, status, movement, orderBy = 'openedAt', orderDir = 'desc', openedFrom, openedTo, closedFrom, closedTo, page = 1, pageSize = 10 } = options || {} as any;
    let items = [...this.cashSessions].filter(s => (!companyId || s.companyId === companyId) && (!baseId || s.baseId === baseId));
    if (status) items = items.filter(s => (status === 'open' ? !s.closed : !!s.closed));
    if (movement) items = items.filter(s => String(s.movementIndicator || '') === String(movement));
    if (openedFrom) items = items.filter(s => s.openedAt && new Date(s.openedAt) >= openedFrom);
    if (openedTo) items = items.filter(s => s.openedAt && new Date(s.openedAt) <= openedTo);
    if (closedFrom) items = items.filter(s => s.closedAt && new Date(s.closedAt as any) >= closedFrom);
    if (closedTo) items = items.filter(s => s.closedAt && new Date(s.closedAt as any) <= closedTo);
    items.sort((a, b) => {
      const av = orderBy === 'closedAt' ? (a.closedAt ? new Date(a.closedAt as any).getTime() : 0) : (a.openedAt ? new Date(a.openedAt as any).getTime() : 0);
      const bv = orderBy === 'closedAt' ? (b.closedAt ? new Date(b.closedAt as any).getTime() : 0) : (b.openedAt ? new Date(b.openedAt as any).getTime() : 0);
      const diff = av - bv;
      return orderDir === 'asc' ? diff : -diff;
    });
    const total = items.length;
    const offset = Math.max((page - 1) * pageSize, 0);
    return { items: items.slice(offset, offset + pageSize), total, page, pageSize };
  }

  async closeCashSession(id: string, updates?: any, companyId?: string): Promise<CashSession | undefined> {
    const s = this.cashSessions.find(x => x.id === id && (!companyId || x.companyId === companyId));
    if (!s) return undefined;
    (s as any).closed = true;
    (s as any).closedAt = new Date();
    if (updates) Object.assign(s, updates);
    return s;
  }

  async executeQuery(query: string, params: any[] = []): Promise<{ rows: any[]; fields: { name: string }[] }> {
    return { rows: [], fields: [] };
  }

  async getUserGridPreference(userId: string, resource: string): Promise<UserGridPreference | undefined> {
    return this.userGridPrefs.find(p => p.userId === userId && p.resource === resource);
  }

  async upsertUserGridPreference(pref: InsertUserGridPreference): Promise<UserGridPreference> {
    const existing = await this.getUserGridPreference(pref.userId, pref.resource);
    if (existing) {
      (existing as any).columns = pref.columns as any;
      (existing as any).updatedAt = new Date() as any;
      return existing as any;
    }
    const created: UserGridPreference = {
      id: crypto.randomUUID(),
      userId: pref.userId,
      resource: pref.resource,
      columns: pref.columns as any,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    } as any;
    this.userGridPrefs.push(created);
    return created;
  }

  async executeQuery(query: string, _params: any[] = []): Promise<{ rows: any[]; fields: { name: string }[] }> {
    return { rows: [], fields: [] };
  }
}

export const storage: IStorage = new MemoryStorage();

