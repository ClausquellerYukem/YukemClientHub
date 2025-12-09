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
  users,
  clients,
  licenses,
  invoices,
  boletoConfig,
  roles,
  roleAssignments,
  rolePermissions,
  companies,
  userCompanies,
  cashAccounts,
  cashBases,
  cashSessions,
  paymentMethods,
  cashAccountTypes,
  type CashAccount,
  type InsertCashAccount,
  type CashAccountType,
  type InsertCashAccountType,
  type CashBase,
  type InsertCashBase,
  type CashSession,
  type InsertCashSession,
  type PaymentMethod,
  type InsertPaymentMethod,
  userGridPreferences,
  type UserGridPreference,
  type InsertUserGridPreference,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, inArray, lt, gt, lte, gte, sql, ilike, asc, desc } from "drizzle-orm";

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

  getAllCashAccounts(companyId?: string): Promise<CashAccount[]>;
  createCashAccount(account: InsertCashAccount): Promise<CashAccount>;
  updateCashAccount(id: string, updates: Partial<InsertCashAccount>, companyId?: string): Promise<CashAccount | undefined>;
  deleteCashAccount(id: string, companyId?: string): Promise<boolean>;
  listCashAccounts(options: { companyId?: string; q?: string; movement?: string; inactive?: boolean; category?: number; accountType?: number; orderBy?: 'description' | 'category' | 'accountCashType'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashAccount[]; total: number; page: number; pageSize: number }>;

  getAllCashAccountTypes(): Promise<CashAccountType[]>;
  listCashAccountTypes(options: { q?: string; orderBy?: 'name'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashAccountType[]; total: number; page: number; pageSize: number }>;
  createCashAccountType(type: InsertCashAccountType): Promise<CashAccountType>;
  updateCashAccountType(id: string, updates: Partial<InsertCashAccountType>): Promise<CashAccountType | undefined>;
  deleteCashAccountType(id: string): Promise<boolean>;

  getAllCashBases(companyId?: string): Promise<CashBase[]>;
  createCashBase(base: InsertCashBase): Promise<CashBase>;
  updateCashBase(id: string, updates: Partial<InsertCashBase>, companyId?: string): Promise<CashBase | undefined>;
  deleteCashBase(id: string, companyId?: string): Promise<boolean>;
  listCashBases(options: { companyId?: string; q?: string; active?: boolean; orderBy?: 'description' | 'active'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashBase[]; total: number; page: number; pageSize: number }>;

  getCashSessions(companyId?: string, baseId?: string): Promise<CashSession[]>;
  listCashSessions(options: { companyId?: string; baseId?: string; status?: 'open' | 'closed'; movement?: string; openedFrom?: Date; openedTo?: Date; closedFrom?: Date; closedTo?: Date; orderBy?: 'openedAt' | 'closedAt'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashSession[]; total: number; page: number; pageSize: number }>;
  openCashSession(session: InsertCashSession): Promise<CashSession>;
  closeCashSession(id: string, updates: Partial<InsertCashSession>, companyId?: string): Promise<CashSession | undefined>;

  executeQuery(query: string, params?: any[]): Promise<{ rows: any[]; fields: { name: string }[] }>;

  getUserGridPreference(userId: string, resource: string): Promise<UserGridPreference | undefined>;
  upsertUserGridPreference(pref: InsertUserGridPreference): Promise<UserGridPreference>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.email) {
      throw new Error('Email is required for user upsert');
    }

    let existingUser: User | undefined;
    if (userData.id) {
      existingUser = await this.getUser(userData.id);
    }
    if (!existingUser) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      existingUser = userByEmail;
    }

    let user: User;
    if (existingUser) {
      const adminEmailSuffixes = ['@yukem.com', '@yukem.com.br'];
      const masterEmailEnv = (process.env.MASTER_USER_EMAIL || '').toLowerCase();
      const emailLower = userData.email.toLowerCase();
      const isAdminEmail = adminEmailSuffixes.some(sfx => emailLower.endsWith(sfx)) || (masterEmailEnv && emailLower === masterEmailEnv);
      const roleToUpdate = isAdminEmail ? 'admin' : existingUser.role;
      const [updated] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: roleToUpdate,
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      user = updated;
    } else {
      const adminEmailSuffixes = ['@yukem.com', '@yukem.com.br'];
      const masterEmailEnv = (process.env.MASTER_USER_EMAIL || '').toLowerCase();
      const emailLower = userData.email.toLowerCase();
      const isAdminEmail = adminEmailSuffixes.some(sfx => emailLower.endsWith(sfx)) || (masterEmailEnv && emailLower === masterEmailEnv);
      const [created] = await db
        .insert(users)
        .values({
          id: userData.id ?? crypto.randomUUID(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: new Date(),
        })
        .returning();
      user = created;
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getClient(id: string, companyId?: string): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (companyId) conditions.push(eq(clients.companyId, companyId));
    const [client] = await db.select().from(clients).where(and(...conditions));
    return client;
  }

  async getAllClients(companyId?: string): Promise<Client[]> {
    if (companyId) {
      return await db.select().from(clients).where(eq(clients.companyId, companyId));
    }
    return await db.select().from(clients);
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>, companyId?: string): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (companyId) conditions.push(eq(clients.companyId, companyId));
    const [client] = await db.update(clients).set(clientData).where(and(...conditions)).returning();
    return client;
  }

  async deleteClient(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(clients.id, id)];
    if (companyId) conditions.push(eq(clients.companyId, companyId));
    const result = await db.delete(clients).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async getLicense(id: string, companyId?: string): Promise<License | undefined> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) conditions.push(eq(licenses.companyId, companyId));
    const [license] = await db.select().from(licenses).where(and(...conditions));
    return license;
  }

  async getLicensesByClientId(clientId: string): Promise<License[]> {
    return await db.select().from(licenses).where(eq(licenses.clientId, clientId));
  }

  async getAllLicenses(companyId?: string): Promise<License[]> {
    if (companyId) return await db.select().from(licenses).where(eq(licenses.companyId, companyId));
    return await db.select().from(licenses);
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(licenseData).returning();
    return license;
  }

  async updateLicense(id: string, licenseData: Partial<InsertLicense>, companyId?: string): Promise<License | undefined> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) conditions.push(eq(licenses.companyId, companyId));
    const [license] = await db.update(licenses).set(licenseData).where(and(...conditions)).returning();
    return license;
  }

  async deleteLicense(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) conditions.push(eq(licenses.companyId, companyId));
    const result = await db.delete(licenses).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async blockClientLicenses(clientId: string): Promise<number> {
    const result = await db.update(licenses).set({ isActive: false }).where(eq(licenses.clientId, clientId)).returning();
    return result.length;
  }

  async unblockClientLicenses(clientId: string): Promise<number> {
    const result = await db.update(licenses).set({ isActive: true }).where(eq(licenses.clientId, clientId)).returning();
    return result.length;
  }

  async checkAndBlockOverdueLicenses(companyId?: string): Promise<{ blocked: number; unblocked: number }> {
    const now = new Date();
    let blocked = 0;
    let unblocked = 0;
    const allInvoices = await this.getAllInvoices(companyId);
    const allClients = await this.getAllClients(companyId);
    const clientsWithOverdueInvoices = new Set<string>();
    const clientsWithoutOverdueInvoices = new Set<string>();
    for (const client of allClients) {
      const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
      const hasOverdue = clientInvoices.some(inv => inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < now);
      if (hasOverdue) clientsWithOverdueInvoices.add(client.id);
      else clientsWithoutOverdueInvoices.add(client.id);
    }
    for (const clientId of Array.from(clientsWithOverdueInvoices)) {
      blocked += await this.blockClientLicenses(clientId);
    }
    for (const clientId of Array.from(clientsWithoutOverdueInvoices)) {
      unblocked += await this.unblockClientLicenses(clientId);
    }
    return { blocked, unblocked };
  }

  async getInvoice(id: string, companyId?: string): Promise<Invoice | undefined> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) conditions.push(eq(invoices.companyId, companyId));
    const [invoice] = await db.select().from(invoices).where(and(...conditions));
    return invoice;
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  }

  async getAllInvoices(companyId?: string): Promise<Invoice[]> {
    if (companyId) return await db.select().from(invoices).where(eq(invoices.companyId, companyId));
    return await db.select().from(invoices);
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>, companyId?: string): Promise<Invoice | undefined> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) conditions.push(eq(invoices.companyId, companyId));
    const [invoice] = await db.update(invoices).set(invoiceData).where(and(...conditions)).returning();
    return invoice;
  }

  async deleteInvoice(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) conditions.push(eq(invoices.companyId, companyId));
    const result = await db.delete(invoices).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async updateInvoiceBoletoData(id: string, companyId: string, boletoData: {
    boletoParcelaId: string;
    boletoQrcodeId: string | null;
    boletoQrcode: string | null;
    boletoQrcodeBase64: string | null;
    boletoUrl: string | null;
    boletoGeneratedAt: Date;
  }): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({
        parcelaId: boletoData.boletoParcelaId,
        qrcodeId: boletoData.boletoQrcodeId,
        qrcode: boletoData.boletoQrcode,
        qrcodeBase64: boletoData.boletoQrcodeBase64,
        url: boletoData.boletoUrl,
        generatedAt: boletoData.boletoGeneratedAt,
      } as any)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning();
    return invoice;
  }

  async getBoletoConfig(companyId?: string): Promise<BoletoConfig | undefined> {
    const conditions = companyId ? [eq(boletoConfig.companyId, companyId)] : [];
    const [config] = await db.select().from(boletoConfig).where(and(...conditions));
    return config;
  }

  async saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig> {
    const [saved] = await db.insert(boletoConfig).values(config).returning();
    return saved;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return role;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const assignments = await db
      .select({ role: roles })
      .from(roleAssignments)
      .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
      .where(eq(roleAssignments.userId, userId));
    return assignments.map(a => a.role);
  }

  async assignRole(assignment: InsertRoleAssignment): Promise<RoleAssignment> {
    const [created] = await db.insert(roleAssignments).values(assignment).returning();
    return created;
  }

  async removeRoleAssignment(userId: string, roleId: string): Promise<boolean> {
    const result = await db
      .delete(roleAssignments)
      .where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.roleId, roleId)))
      .returning();
    return result.length > 0;
  }

  async getAllUsersWithRoles(): Promise<Array<User & { roles: Role[]; companies: Company[] }>> {
    const allUsers = await this.getAllUsers();
    const results: Array<User & { roles: Role[]; companies: Company[] }> = [];
    for (const u of allUsers) {
      const userRoles = await this.getUserRoles(u.id);
      const companiesForUser = await this.getUserCompanies(u.id);
      results.push({ ...u, roles: userRoles, companies: companiesForUser });
    }
    return results;
  }

  async getPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async getAllPermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const [created] = await db.insert(rolePermissions).values(permission).returning();
    return created;
  }

  async updateRolePermission(id: string, updates: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    const [updated] = await db.update(rolePermissions).set(updates).where(eq(rolePermissions.id, id)).returning();
    return updated;
  }

  async getUserPermissions(userId: string): Promise<Map<Resource, Set<Action>>> {
    const rolesForUser = await db
      .select({ roleId: roleAssignments.roleId })
      .from(roleAssignments)
      .where(eq(roleAssignments.userId, userId));
    const roleIds = rolesForUser.map(r => r.roleId);
    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));
    const map = new Map<Resource, Set<Action>>();
    for (const p of permissions) {
      const actions = new Set<Action>();
      if (p.canCreate) actions.add('create');
      if (p.canRead) actions.add('read');
      if (p.canUpdate) actions.add('update');
      if (p.canDelete) actions.add('delete');
      map.set(p.resource as Resource, actions);
    }
    return map;
  }

  async checkUserPermission(userId: string, resource: Resource, action: Action): Promise<boolean> {
    const rolesForUser = await db
      .select({ roleId: roleAssignments.roleId })
      .from(roleAssignments)
      .where(eq(roleAssignments.userId, userId));
    const roleIds = rolesForUser.map(r => r.roleId);
    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));
    for (const p of permissions) {
      if (p.resource === resource) {
        if (action === 'create' && p.canCreate) return true;
        if (action === 'read' && p.canRead) return true;
        if (action === 'update' && p.canUpdate) return true;
        if (action === 'delete' && p.canDelete) return true;
      }
    }
    return false;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id)).returning();
    return result.length > 0;
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const rows = await db
      .select({ company: companies })
      .from(userCompanies)
      .innerJoin(companies, eq(userCompanies.companyId, companies.id))
      .where(eq(userCompanies.userId, userId));
    return rows.map(r => r.company);
  }

  async assignUserToCompany(assignment: InsertUserCompany): Promise<UserCompany> {
    const [created] = await db.insert(userCompanies).values(assignment).returning();
    return created;
  }

  async removeUserFromCompany(userId: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(userCompanies)
      .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)))
      .returning();
    return result.length > 0;
  }

  async setActiveCompany(userId: string, companyId: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ activeCompanyId: companyId }).where(eq(users.id, userId)).returning();
    return user;
  }

  async getAllCashAccounts(companyId?: string): Promise<CashAccount[]> {
    const conditions = companyId ? [eq(cashAccounts.companyId, companyId)] : [];
    return await db.select().from(cashAccounts).where(and(...conditions));
  }

  async listCashAccounts(options: { companyId?: string; q?: string; movement?: string; inactive?: boolean; category?: number; accountType?: number; orderBy?: 'description' | 'category' | 'accountCashType'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number; filters?: { field: string; op: string; value?: any; value2?: any }[]; logical?: 'AND' | 'OR'; filtersTree?: any }): Promise<{ items: CashAccount[]; total: number; page: number; pageSize: number }> {
    const { companyId, q, movement, inactive, category, accountType, orderBy, orderDir = 'asc', page = 1, pageSize = 10, filters, logical = 'AND', filtersTree } = options || {} as any;
    const conditions: any[] = [];
    if (companyId) conditions.push(eq(cashAccounts.companyId, companyId));
    if (q) conditions.push(ilike(cashAccounts.description, `%${q}%`));
    if (movement) conditions.push(eq(cashAccounts.movementIndicator, movement));
    if (inactive !== undefined) conditions.push(eq(cashAccounts.inactive, !!inactive));
    if (category !== undefined) conditions.push(eq(cashAccounts.category, category));
    if (accountType !== undefined) conditions.push(eq(cashAccounts.accountCashType, accountType));

    if (filters?.length && !filtersTree) {
      const fieldMap: Record<string, any> = {
        description: cashAccounts.description,
        movementIndicator: cashAccounts.movementIndicator,
        inactive: cashAccounts.inactive,
        category: cashAccounts.category,
        accountCashType: cashAccounts.accountCashType,
        typeId: (cashAccounts as any).typeId,
        id: cashAccounts.id,
        createdAt: cashAccounts.createdAt,
        updatedAt: cashAccounts.updatedAt,
      };
      const dynConds: any[] = [];
      for (const f of filters) {
        const col = fieldMap[f.field];
        if (!col) continue;
        const op = (f.op || '').toLowerCase();
        const v = f.value;
        const v2 = f.value2;
        if (op === 'equals') dynConds.push(eq(col, v));
        else if (op === 'contains' && typeof v === 'string') dynConds.push(ilike(col, `%${v}%`));
        else if (op === 'startswith' && typeof v === 'string') dynConds.push(ilike(col, `${v}%`));
        else if (op === 'endswith' && typeof v === 'string') dynConds.push(ilike(col, `%${v}`));
        else if (op === 'in' && Array.isArray(v)) dynConds.push(inArray(col, v));
        else if (op === 'gt') dynConds.push(gt(col as any, v));
        else if (op === 'lt') dynConds.push(lt(col as any, v));
        else if (op === 'gte') dynConds.push(gte(col as any, v));
        else if (op === 'lte') dynConds.push(lte(col as any, v));
        else if (op === 'between' && v != null && v2 != null) dynConds.push(and(gte(col as any, v), lte(col as any, v2)));
      }
      if (dynConds.length) {
        conditions.push(logical === 'OR' ? or(...dynConds) : and(...dynConds));
      }
    }

    if (filtersTree && filtersTree.type === 'group') {
      const fieldMap: Record<string, any> = {
        id: cashAccounts.id,
        description: cashAccounts.description,
        movementIndicator: cashAccounts.movementIndicator,
        inactive: cashAccounts.inactive,
        category: cashAccounts.category,
        accountCashType: cashAccounts.accountCashType,
        typeId: (cashAccounts as any).typeId,
        createdAt: cashAccounts.createdAt,
        updatedAt: cashAccounts.updatedAt,
      };
      const buildCond = (node: any): any => {
        if (!node) return undefined;
        if (node.type === 'cond') {
          const col = fieldMap[node.field];
          if (!col) return undefined;
          const op = String(node.op || '').toLowerCase();
          const v = node.value;
          const v2 = node.value2;
          if (op === 'equals') return eq(col, v);
          if (op === 'contains' && typeof v === 'string') return ilike(col, `%${v}%`);
          if (op === 'startswith' && typeof v === 'string') return ilike(col, `${v}%`);
          if (op === 'endswith' && typeof v === 'string') return ilike(col, `%${v}`);
          if (op === 'in') {
            const arr = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
            return arr.length ? inArray(col, arr) : undefined;
          }
          if (op === 'gt') return gt(col as any, v);
          if (op === 'lt') return lt(col as any, v);
          if (op === 'gte') return gte(col as any, v);
          if (op === 'lte') return lte(col as any, v);
          if (op === 'between' && v != null && v2 != null) return and(gte(col as any, v), lte(col as any, v2));
          return undefined;
        }
        if (node.type === 'group') {
          const parts = (node.children || []).map((c: any) => buildCond(c)).filter(Boolean);
          if (!parts.length) return undefined;
          return (String(node.logical) === 'OR') ? or(...parts) : and(...parts);
        }
        return undefined;
      };
      const expr = buildCond(filtersTree);
      if (expr) conditions.push(expr);
    }
    const offset = Math.max((page - 1) * pageSize, 0);
    const orderExpr = orderBy === 'description' ? (orderDir === 'asc' ? asc(cashAccounts.description) : desc(cashAccounts.description))
      : orderBy === 'category' ? (orderDir === 'asc' ? asc(cashAccounts.category) : desc(cashAccounts.category))
      : orderBy === 'accountCashType' ? (orderDir === 'asc' ? asc(cashAccounts.accountCashType) : desc(cashAccounts.accountCashType))
      : asc(cashAccounts.description);
    const whereExpr = conditions.length ? and(...conditions) : undefined;
    const items = await db.select().from(cashAccounts).where(whereExpr as any).orderBy(orderExpr).limit(pageSize).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cashAccounts).where(whereExpr as any);
    return { items, total: Number(count), page, pageSize };
  }

  async createCashAccount(account: InsertCashAccount): Promise<CashAccount> {
    const [created] = await db.insert(cashAccounts).values(account).returning();
    return created;
  }

  async updateCashAccount(id: string, updates: Partial<InsertCashAccount>, companyId?: string): Promise<CashAccount | undefined> {
    const conditions = [eq(cashAccounts.id, id)];
    if (companyId) conditions.push(eq(cashAccounts.companyId, companyId));
    const [updated] = await db.update(cashAccounts).set(updates).where(and(...conditions)).returning();
    return updated;
  }

  async deleteCashAccount(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(cashAccounts.id, id)];
    if (companyId) conditions.push(eq(cashAccounts.companyId, companyId));
    const result = await db.delete(cashAccounts).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async getAllCashAccountTypes(): Promise<CashAccountType[]> {
    return await db.select().from(cashAccountTypes);
  }

  async listCashAccountTypes(options: { q?: string; orderBy?: 'name'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashAccountType[]; total: number; page: number; pageSize: number }> {
    const { q, orderBy = 'name', orderDir = 'asc', page = 1, pageSize = 10 } = options || {} as any;
    const conditions: any[] = [];
    if (q) conditions.push(or(
      ilike(cashAccountTypes.name, `%${q}%`),
      ilike((cashAccountTypes as any).description, `%${q}%`)
    ));
    const offset = Math.max((page - 1) * pageSize, 0);
    const orderExpr = orderBy === 'name' ? (orderDir === 'asc' ? asc(cashAccountTypes.name) : desc(cashAccountTypes.name)) : asc(cashAccountTypes.name);
    const items = await db.select().from(cashAccountTypes).where(and(...conditions)).orderBy(orderExpr).limit(pageSize).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cashAccountTypes).where(and(...conditions));
    return { items, total: Number(count), page, pageSize };
  }

  async createCashAccountType(type: InsertCashAccountType): Promise<CashAccountType> {
    const [created] = await db.insert(cashAccountTypes).values(type).returning();
    return created;
  }

  async updateCashAccountType(id: string, updates: Partial<InsertCashAccountType>): Promise<CashAccountType | undefined> {
    const [updated] = await db.update(cashAccountTypes).set(updates).where(eq(cashAccountTypes.id, id)).returning();
    return updated;
  }

  async deleteCashAccountType(id: string): Promise<boolean> {
    const result = await db.delete(cashAccountTypes).where(eq(cashAccountTypes.id, id)).returning();
    return result.length > 0;
  }

  async getAllCashBases(companyId?: string): Promise<CashBase[]> {
    const conditions = companyId ? [eq(cashBases.companyId, companyId)] : [];
    return await db.select().from(cashBases).where(and(...conditions));
  }

  async createCashBase(base: InsertCashBase): Promise<CashBase> {
    const [created] = await db.insert(cashBases).values(base).returning();
    return created;
  }

  async updateCashBase(id: string, updates: Partial<InsertCashBase>, companyId?: string): Promise<CashBase | undefined> {
    const conditions = [eq(cashBases.id, id)];
    if (companyId) conditions.push(eq(cashBases.companyId, companyId));
    const [updated] = await db.update(cashBases).set(updates).where(and(...conditions)).returning();
    return updated;
  }

  async deleteCashBase(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(cashBases.id, id)];
    if (companyId) conditions.push(eq(cashBases.companyId, companyId));
    const result = await db.delete(cashBases).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async listCashBases(options: { companyId?: string; q?: string; active?: boolean; orderBy?: 'description' | 'active'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashBase[]; total: number; page: number; pageSize: number }> {
    const { companyId, q, active, orderBy, orderDir = 'asc', page = 1, pageSize = 10 } = options || {} as any;
    const conditions: any[] = [];
    if (companyId) conditions.push(eq(cashBases.companyId, companyId));
    if (q) conditions.push(ilike(cashBases.description, `%${q}%`));
    if (active !== undefined) conditions.push(eq(cashBases.active, !!active));
    const offset = Math.max((page - 1) * pageSize, 0);
    const orderExpr = orderBy === 'description' ? (orderDir === 'asc' ? asc(cashBases.description) : desc(cashBases.description))
      : orderBy === 'active' ? (orderDir === 'asc' ? asc(cashBases.active) : desc(cashBases.active))
      : asc(cashBases.description);
    const items = await db.select().from(cashBases).where(and(...conditions)).orderBy(orderExpr).limit(pageSize).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cashBases).where(and(...conditions));
    return { items, total: Number(count), page, pageSize };
  }

  async getCashSessions(companyId?: string, baseId?: string): Promise<CashSession[]> {
    const conditions = [] as any[];
    if (companyId) conditions.push(eq(cashSessions.companyId, companyId));
    if (baseId) conditions.push(eq(cashSessions.baseId, baseId));
    return await db.select().from(cashSessions).where(and(...conditions));
  }

  async listCashSessions(options: { companyId?: string; baseId?: string; status?: 'open' | 'closed'; movement?: string; openedFrom?: Date; openedTo?: Date; closedFrom?: Date; closedTo?: Date; orderBy?: 'openedAt' | 'closedAt'; orderDir?: 'asc' | 'desc'; page?: number; pageSize?: number }): Promise<{ items: CashSession[]; total: number; page: number; pageSize: number }> {
    const { companyId, baseId, status, movement, openedFrom, openedTo, closedFrom, closedTo, orderBy, orderDir = 'desc', page = 1, pageSize = 10 } = options || {} as any;
    const conditions: any[] = [];
    if (companyId) conditions.push(eq(cashSessions.companyId, companyId));
    if (baseId) conditions.push(eq(cashSessions.baseId, baseId));
    if (status) conditions.push(eq(cashSessions.closed, status === 'closed'));
    if (movement) conditions.push(eq(cashSessions.movementIndicator, movement));
    if (openedFrom) conditions.push(sql`"opened_at" >= ${openedFrom}`);
    if (openedTo) conditions.push(sql`"opened_at" <= ${openedTo}`);
    if (closedFrom) conditions.push(sql`"closed_at" >= ${closedFrom}`);
    if (closedTo) conditions.push(sql`"closed_at" <= ${closedTo}`);
    const offset = Math.max((page - 1) * pageSize, 0);
    const orderExpr = orderBy === 'openedAt' ? (orderDir === 'asc' ? asc(cashSessions.openedAt) : desc(cashSessions.openedAt))
      : orderBy === 'closedAt' ? (orderDir === 'asc' ? asc(cashSessions.closedAt) : desc(cashSessions.closedAt))
      : desc(cashSessions.openedAt);
    const items = await db.select().from(cashSessions).where(and(...conditions)).orderBy(orderExpr).limit(pageSize).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(cashSessions).where(and(...conditions));
    return { items, total: Number(count), page, pageSize };
  }

  async openCashSession(session: InsertCashSession): Promise<CashSession> {
    const [created] = await db.insert(cashSessions).values(session).returning();
    return created;
  }

  async closeCashSession(id: string, updates: Partial<InsertCashSession>, companyId?: string): Promise<CashSession | undefined> {
    const conditions = [eq(cashSessions.id, id)];
    if (companyId) conditions.push(eq(cashSessions.companyId, companyId));
    const [updated] = await db.update(cashSessions).set({ ...updates, closed: true, closedAt: new Date() as any }).where(and(...conditions)).returning();
    return updated;
  }

  async executeQuery(query: string, params: any[] = []): Promise<{ rows: any[]; fields: { name: string }[] }> {
    const result = await pool.query(query, params);
    const fields = result.fields ? result.fields.map(f => ({ name: f.name })) : [];
    const rows = result.rows || [];
    return { rows, fields };
  }

  async getUserGridPreference(userId: string, resource: string): Promise<UserGridPreference | undefined> {
    const [pref] = await db.select().from(userGridPreferences).where(and(eq(userGridPreferences.userId, userId), eq(userGridPreferences.resource, resource)));
    return pref;
  }

  async upsertUserGridPreference(pref: InsertUserGridPreference): Promise<UserGridPreference> {
    const existing = await this.getUserGridPreference(pref.userId, pref.resource);
    if (existing) {
      const [updated] = await db.update(userGridPreferences).set({ columns: pref.columns, updatedAt: new Date() as any }).where(and(eq(userGridPreferences.userId, pref.userId), eq(userGridPreferences.resource, pref.resource))).returning();
      return updated;
    }
    const [created] = await db.insert(userGridPreferences).values(pref).returning();
    return created;
  }
}

export const storage: IStorage = new DatabaseStorage();
