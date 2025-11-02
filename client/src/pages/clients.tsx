import { useState } from "react";
import { ClientsTable } from "@/components/clients-table";
import { ClientForm } from "@/components/client-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);

  //todo: remove mock functionality
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
    {
      id: "4",
      companyName: "Distribuidora ABC",
      contactName: "Ana Costa",
      email: "ana@abc.com.br",
      plan: "Professional",
      status: "active" as const,
      monthlyValue: 1500.00,
    },
    {
      id: "5",
      companyName: "Logística Express",
      contactName: "Pedro Alves",
      email: "pedro@logistica.com",
      plan: "Enterprise",
      status: "inactive" as const,
      monthlyValue: 3000.00,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clientes e contratos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-client">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <ClientsTable
        clients={mockClients}
        onView={(id) => console.log("View client:", id)}
        onEdit={(id) => console.log("Edit client:", id)}
        onDelete={(id) => console.log("Delete client:", id)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={(data) => {
              console.log("Client created:", data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
