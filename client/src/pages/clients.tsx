import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setShowForm(false);
      toast({
        title: "Cliente criado",
        description: "O cliente foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    },
  });

  const formattedClients = clients.map(client => ({
    id: client.id,
    companyName: client.companyName,
    contactName: client.contactName,
    email: client.email,
    plan: client.plan,
    status: client.status as "active" | "inactive" | "trial",
    monthlyValue: parseFloat(client.monthlyValue),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  }

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
        clients={formattedClients}
        onView={(id) => console.log("View client:", id)}
        onEdit={(id) => console.log("Edit client:", id)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
