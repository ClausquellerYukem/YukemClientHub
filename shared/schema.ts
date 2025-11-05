import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, index, unique, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Companies table - Multi-tenant support
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  logoUrl: varchar("logo_url"),
  status: varchar("status").notNull().default("active"), // 'active', 'inactive'
  
  // Dados para Nota Fiscal e Contrato
  cnpj: varchar("cnpj"),
  stateRegistration: varchar("state_registration"), // Inscrição Estadual
  cityRegistration: varchar("city_registration"), // Inscrição Municipal
  
  // Endereço completo
  addressStreet: varchar("address_street"), // Logradouro
  addressNumber: varchar("address_number"),
  addressComplement: varchar("address_complement"),
  addressDistrict: varchar("address_district"), // Bairro
  addressCity: varchar("address_city"),
  addressState: varchar("address_state"),
  addressZipCode: varchar("address_zip_code"), // CEP
  
  // Configurações financeiras
  monthlyValue: decimal("monthly_value", { precision: 10, scale: 2 }), // Valor mensal cobrado
  revenueSharePercentage: decimal("revenue_share_percentage", { precision: 5, scale: 2 }), // % de repasse (ex: 40.00)
  freeLicenseQuota: decimal("free_license_quota", { precision: 10, scale: 0 }).default("0"), // Quantidade de licenças gratuitas
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User storage table - Required for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"),
  activeCompanyId: varchar("active_company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Company association table - Multi-tenant support
export const userCompanies = pgTable("user_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCompany: unique().on(table.userId, table.companyId),
}));

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  cnpj: text("cnpj").notNull(),
  plan: text("plan").notNull(),
  monthlyValue: decimal("monthly_value", { precision: 10, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull().default(10), // Dia de vencimento (1-31)
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  licenseKey: text("license_key").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boletoConfig = pgTable("boleto_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  appToken: text("app_token").notNull(),
  accessToken: text("access_token").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RBAC System Tables
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roleAssignments = pgTable("role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  resource: varchar("resource").notNull(), // 'clients', 'licenses', 'invoices', 'boleto_config'
  canCreate: boolean("can_create").notNull().default(false),
  canRead: boolean("can_read").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDay: z.number().int().min(1).max(31),
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  activatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertBoletoConfigSchema = createInsertSchema(boletoConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertBoletoConfig = z.infer<typeof insertBoletoConfigSchema>;
export type BoletoConfig = typeof boletoConfig.$inferSelect;

// User types - Required for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Company schemas and types - Multi-tenant support
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCompanySchema = createInsertSchema(userCompanies).omit({
  id: true,
  createdAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertUserCompany = z.infer<typeof insertUserCompanySchema>;
export type UserCompany = typeof userCompanies.$inferSelect;

// RBAC schemas and types
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertRoleAssignmentSchema = createInsertSchema(roleAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export type InsertRoleAssignment = z.infer<typeof insertRoleAssignmentSchema>;
export type RoleAssignment = typeof roleAssignments.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Permission resource types
export const resourceSchema = z.enum(['clients', 'licenses', 'invoices', 'boleto_config', 'companies']);
export type Resource = z.infer<typeof resourceSchema>;

// Permission action types
export const actionSchema = z.enum(['create', 'read', 'update', 'delete']);
export type Action = z.infer<typeof actionSchema>;
