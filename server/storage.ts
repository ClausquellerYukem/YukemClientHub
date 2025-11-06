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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  // Reference: blueprint:javascript_log_in_with_replit
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  
  // License blocking operations (automatic payment control)
  blockClientLicenses(clientId: string): Promise<number>;
  unblockClientLicenses(clientId: string): Promise<number>;
  checkAndBlockOverdueLicenses(companyId?: string): Promise<{ blocked: number; unblocked: number }>;

  getInvoice(id: string, companyId?: string): Promise<Invoice | undefined>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  getAllInvoices(companyId?: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>, companyId?: string): Promise<Invoice | undefined>;
  deleteInvoice(id: string, companyId?: string): Promise<boolean>;

  getBoletoConfig(companyId?: string): Promise<BoletoConfig | undefined>;
  saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig>;

  // Role operations
  getAllRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  // Role assignment operations
  getUserRoles(userId: string): Promise<Role[]>;
  assignRole(assignment: InsertRoleAssignment): Promise<RoleAssignment>;
  removeRoleAssignment(userId: string, roleId: string): Promise<boolean>;
  getAllUsersWithRoles(): Promise<Array<User & { roles: Role[]; companies: Company[] }>>;

  // Permission operations
  getPermissionsByRole(roleId: string): Promise<RolePermission[]>;
  getAllPermissions(): Promise<RolePermission[]>;
  updateRolePermission(id: string, updates: Partial<InsertRolePermission>): Promise<RolePermission | undefined>;
  getUserPermissions(userId: string): Promise<Map<Resource, Set<Action>>>;
  checkUserPermission(userId: string, resource: Resource, action: Action): Promise<boolean>;

  // Company operations - Multi-tenant support
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // User-Company operations
  getUserCompanies(userId: string): Promise<Company[]>;
  assignUserToCompany(assignment: InsertUserCompany): Promise<UserCompany>;
  removeUserFromCompany(userId: string, companyId: string): Promise<boolean>;
  
  // Active company operations
  setActiveCompany(userId: string, companyId: string): Promise<User | undefined>;
}

// Migrated from MemStorage to DatabaseStorage - Reference: blueprint:javascript_database
export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth
  // Reference: blueprint:javascript_log_in_with_replit
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
    // Email is required for upsert
    if (!userData.email) {
      throw new Error('Email is required for user upsert');
    }
    
    console.log('[storage.upsertUser] Starting upsert for email:', userData.email, 'OAuth ID:', userData.id);
    
    // Check if user exists by OAuth ID first (from claims.sub)
    let existingUser: User | undefined;
    if (userData.id) {
      existingUser = await this.getUser(userData.id);
      console.log('[storage.upsertUser] Found by OAuth ID?', existingUser ? 'YES' : 'NO');
    }
    
    // If not found by ID, try by email
    if (!existingUser) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      existingUser = userByEmail;
      console.log('[storage.upsertUser] Found by email?', existingUser ? 'YES' : 'NO');
    }
    
    let user: User;
    
    if (existingUser) {
      // Update existing user - KEEP existing ID (don't change PKs!)
      const isYukemEmail = userData.email.endsWith('@yukem.com');
      const roleToUpdate = isYukemEmail ? 'admin' : existingUser.role;
      
      console.log('[storage.upsertUser] Updating existing user ID:', existingUser.id);
      
      const [updated] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: roleToUpdate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      
      if (!updated) {
        console.error('[storage.upsertUser] Failed to update user, returning existing');
        user = existingUser;
      } else {
        user = updated;
        console.log('[storage.upsertUser] User updated successfully, DB ID:', user.id);
      }
    } else {
      // Insert new user with OAuth ID
      const isYukemEmail = userData.email.endsWith('@yukem.com');
      const roleToAssign = isYukemEmail ? 'admin' : (userData.role || 'user');
      
      console.log('[storage.upsertUser] Creating new user with OAuth ID:', userData.id);
      
      const [inserted] = await db
        .insert(users)
        .values({
          id: userData.id, // Use OAuth ID for new users
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: roleToAssign,
        })
        .returning();
      
      if (!inserted) {
        throw new Error('Failed to insert user into database');
      }
      
      user = inserted;
      console.log('[storage.upsertUser] User created successfully, DB ID:', user.id);
    }
    
    // Auto-assign role based on users.role field if user has no role assignments
    const existingRoles = await this.getUserRoles(user.id);
    if (existingRoles.length === 0) {
      // Find the role that matches the user's role field
      const [matchingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, user.role))
        .limit(1);
      
      if (matchingRole) {
        await this.assignRole({
          userId: user.id,
          roleId: matchingRole.id,
        });
      }
    }
    
    return user;
  }

  async getClient(id: string, companyId?: string): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (companyId) {
      conditions.push(eq(clients.companyId, companyId));
    }
    const [client] = await db.select().from(clients).where(and(...conditions));
    return client;
  }

  async getAllClients(companyId?: string): Promise<Client[]> {
    if (companyId) {
      return await db.select().from(clients).where(eq(clients.companyId, companyId));
    }
    return await db.select().from(clients);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>, companyId?: string): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (companyId) {
      conditions.push(eq(clients.companyId, companyId));
    }
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return client;
  }

  async deleteClient(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(clients.id, id)];
    if (companyId) {
      conditions.push(eq(clients.companyId, companyId));
    }
    const result = await db.delete(clients).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async getLicense(id: string, companyId?: string): Promise<License | undefined> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) {
      conditions.push(eq(licenses.companyId, companyId));
    }
    const [license] = await db.select().from(licenses).where(and(...conditions));
    return license;
  }

  async getLicensesByClientId(clientId: string): Promise<License[]> {
    return await db.select().from(licenses).where(eq(licenses.clientId, clientId));
  }

  async getAllLicenses(companyId?: string): Promise<License[]> {
    if (companyId) {
      return await db.select().from(licenses).where(eq(licenses.companyId, companyId));
    }
    return await db.select().from(licenses);
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(insertLicense).returning();
    return license;
  }

  async updateLicense(id: string, updates: Partial<InsertLicense>, companyId?: string): Promise<License | undefined> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) {
      conditions.push(eq(licenses.companyId, companyId));
    }
    const [license] = await db
      .update(licenses)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return license;
  }

  async deleteLicense(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(licenses.id, id)];
    if (companyId) {
      conditions.push(eq(licenses.companyId, companyId));
    }
    const result = await db.delete(licenses).where(and(...conditions)).returning();
    return result.length > 0;
  }

  // License blocking operations - Automatic payment control
  async blockClientLicenses(clientId: string): Promise<number> {
    const result = await db
      .update(licenses)
      .set({ isActive: false })
      .where(eq(licenses.clientId, clientId))
      .returning();
    return result.length;
  }

  async unblockClientLicenses(clientId: string): Promise<number> {
    const result = await db
      .update(licenses)
      .set({ isActive: true })
      .where(eq(licenses.clientId, clientId))
      .returning();
    return result.length;
  }

  async checkAndBlockOverdueLicenses(companyId?: string): Promise<{ blocked: number; unblocked: number }> {
    const now = new Date();
    let blocked = 0;
    let unblocked = 0;

    // Get all invoices (filtered by company if provided)
    const allInvoices = await this.getAllInvoices(companyId);
    
    // Get all clients (filtered by company if provided)
    const allClients = await this.getAllClients(companyId);

    // Group clients by payment status
    const clientsWithOverdueInvoices = new Set<string>();
    const clientsWithoutOverdueInvoices = new Set<string>();

    // Check each client's invoices
    for (const client of allClients) {
      const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
      
      // Check if client has any overdue unpaid invoices
      const hasOverdue = clientInvoices.some(
        inv => inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < now
      );

      if (hasOverdue) {
        clientsWithOverdueInvoices.add(client.id);
      } else {
        clientsWithoutOverdueInvoices.add(client.id);
      }
    }

    // Block licenses for clients with overdue invoices
    for (const clientId of Array.from(clientsWithOverdueInvoices)) {
      blocked += await this.blockClientLicenses(clientId);
    }

    // Unblock licenses for clients without overdue invoices
    for (const clientId of Array.from(clientsWithoutOverdueInvoices)) {
      unblocked += await this.unblockClientLicenses(clientId);
    }

    return { blocked, unblocked };
  }

  async getInvoice(id: string, companyId?: string): Promise<Invoice | undefined> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) {
      conditions.push(eq(invoices.companyId, companyId));
    }
    const [invoice] = await db.select().from(invoices).where(and(...conditions));
    return invoice;
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  }

  async getAllInvoices(companyId?: string): Promise<Invoice[]> {
    if (companyId) {
      return await db.select().from(invoices).where(eq(invoices.companyId, companyId));
    }
    return await db.select().from(invoices);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>, companyId?: string): Promise<Invoice | undefined> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) {
      conditions.push(eq(invoices.companyId, companyId));
    }
    const [invoice] = await db
      .update(invoices)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string, companyId?: string): Promise<boolean> {
    const conditions = [eq(invoices.id, id)];
    if (companyId) {
      conditions.push(eq(invoices.companyId, companyId));
    }
    const result = await db.delete(invoices).where(and(...conditions)).returning();
    return result.length > 0;
  }

  async getBoletoConfig(companyId?: string): Promise<BoletoConfig | undefined> {
    if (!companyId) {
      throw new Error('companyId is required to fetch boleto config');
    }
    const [config] = await db.select().from(boletoConfig).where(eq(boletoConfig.companyId, companyId)).limit(1);
    return config;
  }

  async saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig> {
    if (!config.companyId) {
      throw new Error('companyId is required to save boleto config');
    }
    
    const [existingRecord] = await db.select().from(boletoConfig).where(eq(boletoConfig.companyId, config.companyId)).limit(1);
    
    if (existingRecord) {
      const [updated] = await db
        .update(boletoConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(boletoConfig.id, existingRecord.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(boletoConfig).values(config).returning();
      return created;
    }
  }

  // Role operations
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
    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  // Role assignment operations
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
      .where(
        and(
          eq(roleAssignments.userId, userId),
          eq(roleAssignments.roleId, roleId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getAllUsersWithRoles(): Promise<Array<User & { roles: Role[]; companies: Company[] }>> {
    const allUsers = await db.select().from(users);
    const usersWithRolesAndCompanies = await Promise.all(
      allUsers.map(async (user) => {
        const userRoles = await this.getUserRoles(user.id);
        const userCompanies = await this.getUserCompanies(user.id);
        return { ...user, roles: userRoles, companies: userCompanies };
      })
    );
    return usersWithRolesAndCompanies;
  }

  // Permission operations
  async getPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  }

  async getAllPermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async updateRolePermission(id: string, updates: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    const [permission] = await db
      .update(rolePermissions)
      .set(updates)
      .where(eq(rolePermissions.id, id))
      .returning();
    return permission;
  }

  async getUserPermissions(userId: string): Promise<Map<Resource, Set<Action>>> {
    const userRoles = await this.getUserRoles(userId);
    const roleIds = userRoles.map(r => r.id);
    
    if (roleIds.length === 0) {
      return new Map();
    }

    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionMap = new Map<Resource, Set<Action>>();
    
    for (const perm of permissions) {
      const resource = perm.resource as Resource;
      if (!permissionMap.has(resource)) {
        permissionMap.set(resource, new Set());
      }
      const actions = permissionMap.get(resource)!;
      
      if (perm.canCreate) actions.add('create');
      if (perm.canRead) actions.add('read');
      if (perm.canUpdate) actions.add('update');
      if (perm.canDelete) actions.add('delete');
    }
    
    return permissionMap;
  }

  async checkUserPermission(userId: string, resource: Resource, action: Action): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const resourcePermissions = permissions.get(resource);
    return resourcePermissions ? resourcePermissions.has(action) : false;
  }

  // Company operations - Multi-tenant support
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

  // User-Company operations
  async getUserCompanies(userId: string): Promise<Company[]> {
    const userCompanyRecords = await db
      .select({ companyId: userCompanies.companyId })
      .from(userCompanies)
      .where(eq(userCompanies.userId, userId));

    if (userCompanyRecords.length === 0) {
      return [];
    }

    const companyIds = userCompanyRecords.map(uc => uc.companyId);
    return await db.select().from(companies).where(inArray(companies.id, companyIds));
  }

  async assignUserToCompany(assignment: InsertUserCompany): Promise<UserCompany> {
    const [userCompany] = await db.insert(userCompanies).values(assignment).returning();
    return userCompany;
  }

  async removeUserFromCompany(userId: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(userCompanies)
      .where(
        and(
          eq(userCompanies.userId, userId),
          eq(userCompanies.companyId, companyId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async setActiveCompany(userId: string, companyId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ activeCompanyId: companyId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
