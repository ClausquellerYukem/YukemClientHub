import { ClientsTable } from "../clients-table";

export default function ClientsTableExample() {
  const mockClients = [
    {
      id: "1",
      companyName: "Tech Solutions Ltda",
      contactName: "João Silva",
      email: "joao@techsolutions.com",
      plan: "Enterprise",
      status: "active" as const,
      monthlyValue: 2500.00,
    },
    {
      id: "2",
      companyName: "Comercial Santos",
      contactName: "Maria Santos",
      email: "maria@santos.com.br",
      plan: "Professional",
      status: "active" as const,
      monthlyValue: 1200.00,
    },
    {
      id: "3",
      companyName: "Indústria Moderna",
      contactName: "Carlos Oliveira",
      email: "carlos@moderna.com",
      plan: "Basic",
      status: "trial" as const,
      monthlyValue: 500.00,
    },
  ];

  return (
    <div className="p-6">
      <ClientsTable
        clients={mockClients}
        onView={(id) => console.log("View client:", id)}
        onEdit={(id) => console.log("Edit client:", id)}
        onDelete={(id) => console.log("Delete client:", id)}
      />
    </div>
  );
}
