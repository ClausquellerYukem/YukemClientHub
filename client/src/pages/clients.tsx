import { useState, useEffect } from "react";
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
import { FilterCard } from "@/components/filter-card";
import type { FilterGroup, FieldDef, FilterCond } from "@/components/filter-builder";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultColumnsOrder = ["companyName","contactName","email","plan","monthlyValue","status"];
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({ companyName: true, contactName: true, email: true, plan: true, monthlyValue: true, status: true });
  const [columnsOrder, setColumnsOrder] = useState<string[]>(defaultColumnsOrder);
  const [columnsDialog, setColumnsDialog] = useState(false);
  const [sortBy, setSortBy] = useState<string>("companyName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filtersTree, setFiltersTree] = useState<FilterGroup>({ id: String(Date.now()), type: 'group', logical: 'AND', children: [] } as any);
  const [appliedTree, setAppliedTree] = useState<FilterGroup>({ id: String(Date.now()), type: 'group', logical: 'AND', children: [] } as any);
  const [initialApplied, setInitialApplied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  

  const { data: pref } = useQuery<any>({
    queryKey: ["/api/preferences/grid", { resource: "clients" }],
    queryFn: async () => {
      const res = await fetch(`/api/preferences/grid?resource=clients`, { credentials: "include" });
      return await res.json();
    }
  });

  const savePrefMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest("PUT", "/api/preferences/grid", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences/grid", { resource: "clients" }] });
      setColumnsDialog(false);
      toast({ title: "Preferências salvas" });
    }
  });

  useEffect(() => {
    if (pref?.columns) {
      setVisibleColumns(pref.columns.visible || visibleColumns);
      setColumnsOrder(pref.columns.order?.length ? pref.columns.order : defaultColumnsOrder);
    }
    if (pref?.sort) {
      setSortBy(pref.sort.by || sortBy);
      setSortDir(pref.sort.dir || sortDir);
    }
  }, [pref]);

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
    createdAt: client.createdAt?.toString(),
  }));

  const clientFieldDefs: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'id', operators: ['equals','in'] },
    { key: 'companyName', label: 'Empresa', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'contactName', label: 'Contato', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'email', label: 'Email', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'plan', label: 'Plano', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: [{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }, { value: 'trial', label: 'Trial' }], operators: ['equals','in'] },
    { key: 'monthlyValue', label: 'Valor Mensal', type: 'number', operators: ['equals','gt','lt','between'] },
    { key: 'createdAt', label: 'Criado em', type: 'date', operators: ['equals','between'] },
  ];

  const evalCond = (item: any, cond: FilterCond) => {
    const v = item[cond.field];
    const op = String(cond.op || '').toLowerCase();
    if (cond.field === 'monthlyValue') {
      const num = Number(v); const a = Number(cond.value); const b = Number(cond.value2);
      if (op === 'equals') return num === a;
      if (op === 'gt') return num > a;
      if (op === 'lt') return num < a;
      if (op === 'between') return !isNaN(a) && !isNaN(b) ? (num >= a && num <= b) : false;
      return true;
    }
    if (cond.field === 'status') {
      if (op === 'equals') return String(v) === String(cond.value);
      if (op === 'in') return Array.isArray(cond.value) ? cond.value.includes(String(v)) : String(v) === String(cond.value);
      return true;
    }
    if (cond.field === 'id') {
      if (op === 'equals') return String(v) === String(cond.value);
      if (op === 'in') {
        const arr = Array.isArray(cond.value) ? cond.value : String(cond.value || '').split(',').map(s => s.trim()).filter(Boolean);
        return arr.includes(String(v));
      }
      return true;
    }
    if (cond.field === 'companyName' || cond.field === 'contactName' || cond.field === 'email' || cond.field === 'plan') {
      const sv = String(v || '').toLowerCase(); const q = String(cond.value || '').toLowerCase();
      if (op === 'equals') return sv === q;
      if (op === 'contains') return sv.includes(q);
      if (op === 'startswith') return sv.startsWith(q);
      if (op === 'endswith') return sv.endsWith(q);
      if (op === 'in') {
        const arr = Array.isArray(cond.value) ? cond.value.map((x: string) => x.toLowerCase()) : String(cond.value || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        return arr.includes(sv);
      }
      return true;
    }
    if (cond.field === 'createdAt') {
      const d = v ? new Date(v) : undefined;
      if (!d) return false;
      if (op === 'equals') return String(cond.value || '') ? (d.toISOString().slice(0,10) === String(cond.value)) : true;
      if (op === 'between') {
        const a = cond.value ? new Date(String(cond.value)) : undefined;
        const b = cond.value2 ? new Date(String(cond.value2)) : undefined;
        if (!a || !b) return false;
        const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
        const db = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59);
        return d >= da && d <= db;
      }
      return true;
    }
    return true;
  };

  const matchesTree = (item: any, node: any): boolean => {
    if (!node) return true;
    if (node.type === 'cond') return evalCond(item, node as FilterCond);
    if (node.type === 'group') {
      const children = (node.children || []) as any[];
      if (!children.length) return true;
      const results = children.map(ch => matchesTree(item, ch));
      return String(node.logical) === 'OR' ? results.some(Boolean) : results.every(Boolean);
    }
    return true;
  };

  const filteredClientsByTree = formattedClients.filter(c => matchesTree(c, appliedTree));

  useEffect(() => {
    if (!initialApplied && (filtersTree.children || []).length > 0) {
      setAppliedTree(filtersTree);
      setPage(1);
      setInitialApplied(true);
    }
  }, [filtersTree]);

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
          <Button onClick={() => setShowForm(true)} data-testid="button-add-client">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
          </Button>
        </div>
      </div>

      <FilterCard
        tree={filtersTree}
        onChange={(t) => { setFiltersTree(t); }}
        fields={clientFieldDefs}
        onAddFilter={() => { const ft = { ...filtersTree } as any; ft.children.push({ id: String(Math.random()), type: 'cond', field: 'companyName', op: 'contains', value: '' }); setFiltersTree(ft); }}
        onAddGroup={() => { const ft = { ...filtersTree, children: [...filtersTree.children, { id: String(Math.random()), type: 'group', logical: 'AND', children: [] }] }; setFiltersTree(ft); }}
        onClear={() => { const empty = { id: String(Date.now()), type: 'group', logical: 'AND', children: [] } as any; setFiltersTree(empty); }}
        onApply={(t) => { setAppliedTree(t); setPage(1); }}
      />

      <ClientsTable
        clients={filteredClientsByTree}
        columnsOrder={columnsOrder}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); savePrefMutation.mutate({ resource: "clients", columns: { visible: visibleColumns, order: columnsOrder, filtersTree: filtersTree }, sort: { by, dir } }); }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerateInvoice={handleGenerateInvoice}
        isGeneratingInvoice={generateInvoiceMutation.isPending}
        onGenerateLicense={handleGenerateLicense}
        isGeneratingLicense={generateLicenseMutation.isPending}
        page={page}
        pageSize={pageSize}
        onPageChange={(next) => setPage(next)}
      />

      <Dialog open={columnsDialog} onOpenChange={setColumnsDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Colunas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {defaultColumnsOrder.map((col, idx) => (
              <div key={col} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={visibleColumns[col] !== false} onCheckedChange={(v) => setVisibleColumns({ ...visibleColumns, [col]: !!v })} />
                  <span>{col === "companyName" ? "Empresa" : col === "contactName" ? "Contato" : col === "email" ? "Email" : col === "plan" ? "Plano" : col === "monthlyValue" ? "Valor Mensal" : col === "status" ? "Status" : col}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    if (idx <= 0) return;
                    const order = [...columnsOrder];
                    const i = order.indexOf(col);
                    [order[i - 1], order[i]] = [order[i], order[i - 1]];
                    setColumnsOrder(order);
                  }}>Subir</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const order = [...columnsOrder];
                    const i = order.indexOf(col);
                    if (i >= order.length - 1) return;
                    [order[i + 1], order[i]] = [order[i], order[i + 1]];
                    setColumnsOrder(order);
                  }}>Descer</Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => savePrefMutation.mutate({ resource: "clients", columns: { visible: visibleColumns, order: columnsOrder }, sort: { by: sortBy, dir: sortDir } })} data-testid="button-save-columns">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
