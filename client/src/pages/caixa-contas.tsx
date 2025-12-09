import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CashAccountsTable } from "@/components/cash-accounts-table";
import { CashAccountForm } from "@/components/cash-account-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterBuilder, type FilterGroup, type FieldDef } from "@/components/filter-builder";
import { FilterCard } from "@/components/filter-card";
import { useGridPreferences } from "@/hooks/useGridPreferences";
import { ColumnsDialog } from "@/components/columns-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

type CashAccount = {
  id: string;
  description: string;
  movementIndicator?: string;
  inactive?: boolean;
};

export default function CaixaContas() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CashAccount | null>(null);
  const [viewing, setViewing] = useState<CashAccount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [movement, setMovement] = useState<string>('all');
  const [inactive, setInactive] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [accountType, setAccountType] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<string>("description");
  const [orderDir, setOrderDir] = useState<string>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const uid = () => Math.random().toString(36).slice(2) + Date.now();
  type FilterCond = { id: string; type: 'cond'; field: string; op: string; value?: any; value2?: any };
  const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });

  const defaultColumnsOrder = ["description","movementIndicator","category","accountCashType","status"];
  const { visibleColumns, setVisibleColumns, columnsOrder, setColumnsOrder, sortBy, setSortBy, sortDir, setSortDir, filtersTree, setFiltersTree } = useGridPreferences("cash_accounts", { visibleColumns: { description: true, movementIndicator: true, category: true, accountCashType: true, status: true }, columnsOrder: defaultColumnsOrder, sortBy: "description", sortDir: "asc", initialTree: makeGroup('AND') });
  const [appliedTree, setAppliedTree] = useState<FilterGroup>(makeGroup('AND'));
  const [initialApplied, setInitialApplied] = useState(false);

  const { data, isLoading, isFetching } = useQuery<{ items: CashAccount[]; total: number; page: number; pageSize: number}>({
    queryKey: ["/api/cash/accounts", { q, movement, inactive, category, accountType, orderBy, orderDir, page, pageSize, appliedTree: JSON.stringify(appliedTree) }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (movement && movement !== 'all') params.set("movement", movement);
      if (inactive && inactive !== 'all') params.set("inactive", inactive);
      if (category && category !== 'all') params.set("category", category);
      if (accountType && accountType !== 'all') params.set("accountType", accountType);
      if (orderBy) params.set("orderBy", orderBy);
      if (orderDir) params.set("orderDir", orderDir);
      if (appliedTree && (appliedTree.children || []).length) params.set("filtersTree", JSON.stringify(appliedTree));
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/cash/accounts?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      return json;
    },
    refetchOnWindowFocus: false,
  });
  const contas = data?.items || [];
  const [columnsDialog, setColumnsDialog] = useState(false);

  const { data: typesList } = useQuery<{ items: any[]; total: number; page: number; pageSize: number}>({
    queryKey: ["/api/cash/account-types", { q: "" }],
    queryFn: async () => {
      const res = await fetch(`/api/cash/account-types`, { credentials: "include" });
      return await res.json();
    }
  });

  const typeEnumValues = ((typesList && (typesList as any).items) ? (typesList as any).items : []).map((t: any) => ({ value: t.id, label: t.name }));

  const cashFieldDefs: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'id', operators: ['equals','in'] },
    { key: 'description', label: 'Descrição', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'movementIndicator', label: 'Movimento', type: 'enum', enumValues: [{ value: 'E', label: 'Entrada' }, { value: 'S', label: 'Saída' }], operators: ['equals','in'] },
    { key: 'inactive', label: 'Status', type: 'boolean', operators: ['equals'] },
    { key: 'category', label: 'Categoria', type: 'number', operators: ['equals','gt','lt','between'] },
    { key: 'accountCashType', label: 'Tipo (código)', type: 'number', operators: ['equals','gt','lt','between'] },
    { key: 'typeId', label: 'Tipo', type: 'enum', enumValues: typeEnumValues, operators: ['equals','in'] },
    { key: 'createdAt', label: 'Criado em', type: 'date', operators: ['equals','between'] },
    { key: 'updatedAt', label: 'Atualizado em', type: 'date', operators: ['equals','between'] },
  ];

  useEffect(() => {
    if (!initialApplied && (filtersTree.children || []).length > 0) {
      setAppliedTree(filtersTree);
      setPage(1);
      setInitialApplied(true);
    }
  }, [filtersTree]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/cash/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/accounts"] });
      setShowForm(false);
      toast({ title: "Conta criada" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar conta", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/cash/accounts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/accounts"] });
      setEditing(null);
      toast({ title: "Conta atualizada" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar conta", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cash/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/accounts"] });
      toast({ title: "Conta removida" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao remover conta", variant: "destructive" });
    },
  });

  const showInitialLoading = isLoading && !(data && data.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Categoria de Lançamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie contas para lançamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
          <Button onClick={() => setShowForm(true)} data-testid="button-add-account">Nova Conta</Button>
        </div>
      </div>

      

      <FilterCard
        tree={filtersTree}
        onChange={(t) => { setFiltersTree(t); }}
        fields={cashFieldDefs}
        onAddFilter={() => { const ft = { ...filtersTree } as any; ft.children.push({ id: uid(), type: 'cond', field: 'description', op: 'contains', value: '' }); setFiltersTree(ft); }}
        onAddGroup={() => { const ft = { ...filtersTree, children: [...filtersTree.children, makeGroup('AND')] }; setFiltersTree(ft); }}
        onClear={() => { const empty = makeGroup('AND'); setFiltersTree(empty); }}
        onApply={(t) => { setAppliedTree(t); setPage(1); }}
      />

      {showInitialLoading && (
        <div className="flex items-center justify-center h-24">
          <p className="text-muted-foreground">Carregando contas de caixa...</p>
        </div>
      )}
      <CashAccountsTable
        accounts={contas}
        columnsOrder={columnsOrder}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); }}
        onView={(id) => setViewing(contas.find(c => c.id === id) || null)}
        onEdit={(id) => setEditing(contas.find(c => c.id === id) || null)}
        onDelete={(id) => setDeletingId(id)}
      />
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
          </PaginationItem>
          {Array.from({ length: Math.max(1, Math.ceil((data?.total || contas.length) / pageSize)) }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink href="#" isActive={page === (idx + 1)} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil((data?.total || contas.length) / pageSize)); setPage(Math.min(totalPages, page + 1)); }} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {isFetching && (
        <div className="flex items-center justify-end">
          <p className="text-muted-foreground text-xs">Atualizando…</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
          </DialogHeader>
          <CashAccountForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          {editing && (
            <CashAccountForm
              initialData={editing}
              onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
            <DialogDescription>Informações da conta de caixa</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2">
              <p><strong>Descrição:</strong> {viewing.description}</p>
              <p><strong>Movimento:</strong> {viewing.movementIndicator || '-'}</p>
              <p><strong>Status:</strong> {viewing.inactive ? 'Inativa' : 'Ativa'}</p>
          </div>)}
          <DialogFooter>
            <Button onClick={() => setViewing(null)} data-testid="button-close-view">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>Confirma a exclusão desta conta de caixa?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={columnsDialog} onOpenChange={setColumnsDialog}>
        <ColumnsDialog
          defaultOrder={defaultColumnsOrder}
          visible={visibleColumns}
          setVisible={(v) => setVisibleColumns(v)}
          order={columnsOrder}
          setOrder={(o) => setColumnsOrder(o)}
          labelFor={(col) => col === "description" ? "Descrição" : col === "movementIndicator" ? "Movimento" : col === "category" ? "Categoria" : col === "accountCashType" ? "Tipo" : col === "status" ? "Status" : col}
          onSave={() => { setColumnsDialog(false); toast({ title: "Preferências salvas" }); }}
        />
      </Dialog>
    </div>
  );
}
