import { storage } from "./storage";

export async function seedRolesAndPermissions() {
  console.log("Initializing roles and permissions...");

  const existingRoles = await storage.getAllRoles();
  
  if (existingRoles.length > 0) {
    console.log("Roles already exist, skipping role initialization");
    return;
  }

  const resources = ["clients", "licenses", "invoices", "boleto_config"];

  const adminRole = await storage.createRole({
    name: "Administrador",
    description: "Acesso total ao sistema",
    isSystem: true,
  });

  const managerRole = await storage.createRole({
    name: "Gerente",
    description: "Gerenciamento de clientes e licenças",
    isSystem: false,
  });

  const userRole = await storage.createRole({
    name: "Usuário",
    description: "Visualização de dados",
    isSystem: false,
  });

  for (const resource of resources) {
    await storage.createRolePermission({
      roleId: adminRole.id,
      resource,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    });

    await storage.createRolePermission({
      roleId: managerRole.id,
      resource,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    });

    await storage.createRolePermission({
      roleId: userRole.id,
      resource,
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
    });
  }

  console.log("Roles and permissions initialized successfully!");
}

export async function seedInitialData() {
  const existingClients = await storage.getAllClients();
  
  if (existingClients.length > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }

  console.log("Seeding initial data...");

  const client1 = await storage.createClient({
    companyName: "Tech Solutions Ltda",
    contactName: "João Silva",
    email: "joao@techsolutions.com",
    phone: "(11) 98765-4321",
    cnpj: "12.345.678/0001-90",
    plan: "Enterprise",
    monthlyValue: "2500.00",
    status: "active",
  });

  const client2 = await storage.createClient({
    companyName: "Comercial Santos",
    contactName: "Maria Santos",
    email: "maria@santos.com.br",
    phone: "(21) 97654-3210",
    cnpj: "23.456.789/0001-01",
    plan: "Professional",
    monthlyValue: "1200.00",
    status: "active",
  });

  const client3 = await storage.createClient({
    companyName: "Indústria Moderna",
    contactName: "Carlos Oliveira",
    email: "carlos@moderna.com",
    phone: "(31) 96543-2109",
    cnpj: "34.567.890/0001-12",
    plan: "Basic",
    monthlyValue: "500.00",
    status: "trial",
  });

  const client4 = await storage.createClient({
    companyName: "Distribuidora ABC",
    contactName: "Ana Costa",
    email: "ana@abc.com.br",
    phone: "(41) 95432-1098",
    cnpj: "45.678.901/0001-23",
    plan: "Professional",
    monthlyValue: "1500.00",
    status: "active",
  });

  const client5 = await storage.createClient({
    companyName: "Logística Express",
    contactName: "Pedro Alves",
    email: "pedro@logistica.com",
    phone: "(51) 94321-0987",
    cnpj: "56.789.012/0001-34",
    plan: "Enterprise",
    monthlyValue: "3000.00",
    status: "inactive",
  });

  await storage.createLicense({
    clientId: client1.id,
    licenseKey: "YUKEM-2024-TECH-XYZ123",
    isActive: true,
    expiresAt: new Date("2025-01-15"),
  });

  await storage.createLicense({
    clientId: client2.id,
    licenseKey: "YUKEM-2024-SANTOS-ABC456",
    isActive: true,
    expiresAt: new Date("2025-03-20"),
  });

  await storage.createLicense({
    clientId: client3.id,
    licenseKey: "YUKEM-2024-TRIAL-DEF789",
    isActive: false,
    expiresAt: new Date("2024-12-01"),
  });

  await storage.createLicense({
    clientId: client4.id,
    licenseKey: "YUKEM-2024-DIST-GHI012",
    isActive: true,
    expiresAt: new Date("2025-02-10"),
  });

  await storage.createLicense({
    clientId: client5.id,
    licenseKey: "YUKEM-2024-LOG-JKL345",
    isActive: false,
    expiresAt: new Date("2024-10-05"),
  });

  await storage.createInvoice({
    clientId: client1.id,
    amount: "2500.00",
    dueDate: new Date("2024-12-15"),
    paidAt: new Date("2024-12-10"),
    status: "paid",
  });

  await storage.createInvoice({
    clientId: client2.id,
    amount: "1200.00",
    dueDate: new Date("2024-12-20"),
    status: "pending",
  });

  await storage.createInvoice({
    clientId: client3.id,
    amount: "500.00",
    dueDate: new Date("2024-11-30"),
    status: "overdue",
  });

  await storage.createInvoice({
    clientId: client4.id,
    amount: "1500.00",
    dueDate: new Date("2024-12-18"),
    paidAt: new Date("2024-12-12"),
    status: "paid",
  });

  await storage.createInvoice({
    clientId: client5.id,
    amount: "3000.00",
    dueDate: new Date("2024-12-25"),
    status: "pending",
  });

  console.log("Initial data seeded successfully!");
}
