import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, index, unique, integer } from "drizzle-orm/pg-core";
const __enableDbIndexes = typeof process !== 'undefined' && !!(process.env && process.env.ENABLE_DB_INDEXES === 'true');
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
  (table) => [__enableDbIndexes ? index("IDX_session_expire").on(table.expire) : undefined].filter(Boolean) as any,
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
  
  // Boleto data from external API
  boletoParcelaId: text("boleto_parcela_id"),
  boletoQrcodeId: text("boleto_qrcode_id"),
  boletoQrcode: text("boleto_qrcode"),
  boletoQrcodeBase64: text("boleto_qrcode_base64"),
  boletoUrl: text("boleto_url"),
  boletoGeneratedAt: timestamp("boleto_generated_at"),
  
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
export const resourceSchema = z.enum(['clients', 'licenses', 'invoices', 'boleto_config', 'companies', 'cash_accounts', 'cash_bases', 'cash_sessions', 'payment_methods']);
export type Resource = z.infer<typeof resourceSchema>;

// Permission action types
export const actionSchema = z.enum(['create', 'read', 'update', 'delete']);
export type Action = z.infer<typeof actionSchema>;

export const cashAccountTypes = pgTable("cash_account_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cashAccounts = pgTable("cash_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  typeId: varchar("type_id").references(() => cashAccountTypes.id, { onDelete: 'set null' }),
  description: varchar("description").notNull(),
  movementIndicator: varchar("movement_indicator"),
  showInCashLaunch: boolean("show_in_cash_launch").default(false),
  duplicateInReport: boolean("duplicate_in_report").default(false),
  showInReport: boolean("show_in_report").default(false),
  inactive: boolean("inactive").default(false),
  groupInReport: boolean("group_in_report").default(false),
  budgeted: boolean("budgeted").default(false),
  category: integer("category").default(0),
  sequence: varchar("sequence", { length: 10 }),
  showInDer: boolean("show_in_der").default(false),
  budgetValue: decimal("budget_value", { precision: 18, scale: 6 }).default("0"),
  parentAccountId: varchar("parent_account_id").references(() => cashAccounts.id),
  total: decimal("total", { precision: 18, scale: 6 }).default("0"),
  externalCode: varchar("external_code", { length: 20 }),
  contraPartida: varchar("contra_partida", { length: 20 }),
  accountCashType: integer("account_cash_type").default(0),
  exportToAccounting: boolean("export_to_accounting").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cashAccountsDescriptionIdx = __enableDbIndexes ? index("idx_cash_accounts_description").on(cashAccounts.description) : undefined as any;
export const cashAccountsCategoryIdx = __enableDbIndexes ? index("idx_cash_accounts_category").on(cashAccounts.category) : undefined as any;
export const cashAccountsTypeIdx = __enableDbIndexes ? index("idx_cash_accounts_type").on(cashAccounts.accountCashType) : undefined as any;

export const insertCashAccountTypeSchema = createInsertSchema(cashAccountTypes).omit({ id: true, createdAt: true });

export const cashBases = pgTable("cash_bases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  internalCode: integer("internal_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: varchar("description", { length: 100 }).notNull(),
  visibleToUser: boolean("visible_to_user").notNull().default(false),
  boxType: integer("box_type").notNull().default(0),
  balance: decimal("balance", { precision: 18, scale: 6 }).notNull().default("0"),
  active: boolean("active").notNull().default(false),
  usePos: integer("use_pos").default(0),
  exportToAccounting: boolean("export_to_accounting").default(false),
});

export const cashBasesDescriptionIdx = __enableDbIndexes ? index("idx_cash_bases_description").on(cashBases.description) : undefined as any;
export const cashBasesActiveIdx = __enableDbIndexes ? index("idx_cash_bases_active").on(cashBases.active) : undefined as any;

export const cashSessions = pgTable("cash_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  baseId: varchar("base_id").notNull().references(() => cashBases.id, { onDelete: 'cascade' }),
  openedByUserId: varchar("opened_by_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  closedByUserId: varchar("closed_by_user_id").references(() => users.id, { onDelete: 'set null' }),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  movementIndicator: varchar("movement_indicator", { length: 1 }),
  balance: decimal("balance", { precision: 18, scale: 6 }).default("0"),
  closed: boolean("closed").default(false),
});

export const cashSessionsBaseIdx = __enableDbIndexes ? index("idx_cash_sessions_base").on(cashSessions.baseId) : undefined as any;
export const cashSessionsClosedIdx = __enableDbIndexes ? index("idx_cash_sessions_closed").on(cashSessions.closed) : undefined as any;
export const cashSessionsOpenedAtIdx = __enableDbIndexes ? index("idx_cash_sessions_opened_at").on(cashSessions.openedAt) : undefined as any;
export const cashSessionsClosedAtIdx = __enableDbIndexes ? index("idx_cash_sessions_closed_at").on(cashSessions.closedAt) : undefined as any;

export const userGridPreferences = pgTable("user_grid_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  resource: varchar("resource").notNull(),
  columns: jsonb("columns").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  uniqUserResource: unique("uniq_user_resource").on(t.userId, t.resource),
}));

export const insertUserGridPrefSchema = z.object({
  userId: z.string(),
  resource: z.string(),
  columns: z.object({ visible: z.record(z.boolean()), order: z.array(z.string()) }),
});

export type UserGridPreference = typeof userGridPreferences.$inferSelect;
export type InsertUserGridPreference = z.infer<typeof insertUserGridPrefSchema>;

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  methodTypeId: varchar("method_type_id"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
  description: varchar("description", { length: 60 }).notNull(),
  code: varchar("code", { length: 3 }),
  allowsChange: boolean("allows_change").default(false),
  generateInstallments: boolean("generate_installments").default(false),
  installmentsQty: integer("installments_qty").default(0),
  daysInterval: integer("days_interval").default(0),
  firstDueDays: integer("first_due_days").default(0),
  baseAmount: decimal("base_amount", { precision: 18, scale: 6 }).default("0"),
  status: boolean("status").default(false),
  issuesBoleto: boolean("issues_boleto").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCashAccountSchema = createInsertSchema(cashAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCashBaseSchema = createInsertSchema(cashBases).omit({ id: true, createdAt: true });
export const insertCashSessionSchema = createInsertSchema(cashSessions).omit({ id: true, openedAt: true, closedAt: true });
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true, createdDate: true, updatedAt: true });

export type CashAccount = typeof cashAccounts.$inferSelect;
export type CashAccountType = typeof cashAccountTypes.$inferSelect;
export type InsertCashAccount = z.infer<typeof insertCashAccountSchema>;
export type InsertCashAccountType = z.infer<typeof insertCashAccountTypeSchema>;
export type CashBase = typeof cashBases.$inferSelect;
export type InsertCashBase = z.infer<typeof insertCashBaseSchema>;
export type CashSession = typeof cashSessions.$inferSelect;
export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
