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
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  // Reference: blueprint:javascript_log_in_with_replit
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getClient(id: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  getLicense(id: string): Promise<License | undefined>;
  getLicensesByClientId(clientId: string): Promise<License[]>;
  getAllLicenses(): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, license: Partial<InsertLicense>): Promise<License | undefined>;
  deleteLicense(id: string): Promise<boolean>;

  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  getAllInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;

  getBoletoConfig(): Promise<BoletoConfig | undefined>;
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
  getAllUsersWithRoles(): Promise<Array<User & { roles: Role[] }>>;

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

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Automatically set admin role for @yukem.com emails (for testing/demo)
    const isYukemEmail = userData.email?.endsWith('@yukem.com');
    const roleToAssign = isYukemEmail ? 'admin' : (userData.role || 'user');
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: roleToAssign,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          role: roleToAssign,
          updatedAt: new Date(),
        },
      })
      .returning();
    
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

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  async getLicense(id: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async getLicensesByClientId(clientId: string): Promise<License[]> {
    return await db.select().from(licenses).where(eq(licenses.clientId, clientId));
  }

  async getAllLicenses(): Promise<License[]> {
    return await db.select().from(licenses);
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(insertLicense).returning();
    return license;
  }

  async updateLicense(id: string, updates: Partial<InsertLicense>): Promise<License | undefined> {
    const [license] = await db
      .update(licenses)
      .set(updates)
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  async deleteLicense(id: string): Promise<boolean> {
    const result = await db.delete(licenses).where(eq(licenses.id, id)).returning();
    return result.length > 0;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  async getBoletoConfig(): Promise<BoletoConfig | undefined> {
    const configs = await db.select().from(boletoConfig).limit(1);
    return configs[0];
  }

  async saveBoletoConfig(config: InsertBoletoConfig): Promise<BoletoConfig> {
    const existing = await this.getBoletoConfig();
    
    if (existing) {
      const [updated] = await db
        .update(boletoConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(boletoConfig.id, existing.id))
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

  async getAllUsersWithRoles(): Promise<Array<User & { roles: Role[] }>> {
    const allUsers = await db.select().from(users);
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRoles = await this.getUserRoles(user.id);
        return { ...user, roles: userRoles };
      })
    );
    return usersWithRoles;
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
