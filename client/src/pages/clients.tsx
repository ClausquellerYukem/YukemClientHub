import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ClientsTable } from "@/components/clients-table";
import { ClientForm } from "@/components/client-form";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Mail, Phone, CreditCard, Calendar, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditingClient(null);
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
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
      setDeletingClientId(null);
      toast({
        title: "Cliente desativado",
        description: "O cliente foi marcado como inativo.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desativar o cliente.",
        variant: "destructive",
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("POST", "/api/invoices/generate", { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Fatura gerada",
        description: "A fatura foi gerada com sucesso.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Não foi possível gerar a fatura.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const generateLicenseMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("POST", "/api/licenses/generate", { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      toast({
        title: "Licença gerada",
        description: "A licença foi gerada com sucesso.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Não foi possível gerar a licença.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleView = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setViewingClient(client);
    }
  };

  const handleEdit = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setEditingClient(client);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingClientId(id);
  };

  const handleGenerateInvoice = (id: string) => {
    generateInvoiceMutation.mutate(id);
  };

  const handleGenerateLicense = (id: string) => {
    generateLicenseMutation.mutate(id);
  };

  const confirmDelete = () => {
    if (deletingClientId) {
      deleteMutation.mutate(deletingClientId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      inactive: { label: "Inativo", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      trial: { label: "Trial", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

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
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerateInvoice={handleGenerateInvoice}
        isGeneratingInvoice={generateInvoiceMutation.isPending}
        onGenerateLicense={handleGenerateLicense}
        isGeneratingLicense={generateLicenseMutation.isPending}
      />

      {/* Diálogo de Criar Cliente */}
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

      {/* Diálogo de Editar Cliente */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm
              initialData={editingClient}
              onSubmit={(data) => updateMutation.mutate({ id: editingClient.id, data })}
              onCancel={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Visualizar Cliente */}
      <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-view-company">
                    {viewingClient.companyName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {viewingClient.cnpj}
                  </p>
                </div>
                {getStatusBadge(viewingClient.status)}
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome do Contato</p>
                    <p className="font-medium" data-testid="text-view-contact">
                      {viewingClient.contactName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium" data-testid="text-view-email">
                      {viewingClient.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium" data-testid="text-view-phone">
                      {viewingClient.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium" data-testid="text-view-plan">
                      {viewingClient.plan}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Mensal</p>
                    <p className="font-medium text-lg" data-testid="text-view-value">
                      R$ {parseFloat(viewingClient.monthlyValue).toLocaleString("pt-BR", { 
                        minimumFractionDigits: 2 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium" data-testid="text-view-date">
                      {viewingClient.createdAt && new Date(viewingClient.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingClient(null)} data-testid="button-close-view">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingClientId} onOpenChange={(open) => !open && setDeletingClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar este cliente? O cliente será marcado como inativo
              mas seus dados não serão apagados do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
