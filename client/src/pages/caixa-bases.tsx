import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { FilterBuilder, type FilterGroup, type FieldDef } from "@/components/filter-builder";
import { FilterCard } from "@/components/filter-card";
import { useToast } from "@/hooks/use-toast";
import { useGridPreferences } from "@/hooks/useGridPreferences";
import { ColumnsDialog } from "@/components/columns-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CashBasesTable } from "@/components/cash-bases-table";
import { CashBaseForm } from "@/components/cash-base-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type CashBase = {
  id: string;
  description: string;
  balance: string;
  active: boolean;
};

export default function CaixaBases() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CashBase | null>(null);
  const [viewing, setViewing] = useState<CashBase | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("description");
  const [orderDir, setOrderDir] = useState<string>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const uid = () => Math.random().toString(36).slice(2) + Date.now();
  const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });

  const defaultColumnsOrder = ["description","balance","status"];
  const { visibleColumns, setVisibleColumns, columnsOrder, setColumnsOrder, sortBy, setSortBy, sortDir, setSortDir, filtersTree, setFiltersTree } = useGridPreferences("cash_bases", { visibleColumns: { description: true, balance: true, status: true }, columnsOrder: defaultColumnsOrder, sortBy: "description", sortDir: "asc", initialTree: makeGroup('AND') });

  const { data, isLoading } = useQuery<{ items: CashBase[]; total: number; page: number; pageSize: number}>({
    queryKey: ["/api/cash/bases", { q, active, orderBy, orderDir, page, pageSize, filtersTree }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (active && active !== 'all') params.set("active", active);
      if (orderBy) params.set("orderBy", orderBy);
      if (orderDir) params.set("orderDir", orderDir);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/cash/bases?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      return json;
    }
  });
  const bases = data?.items || [];
  const [columnsDialog, setColumnsDialog] = useState(false);

  

  const baseFieldDefs: FieldDef[] = [
    { key: 'description', label: 'Descrição', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'active', label: 'Status', type: 'enum', enumValues: [{ value: 'all', label: 'Todos' }, { value: 'true', label: 'Ativas' }, { value: 'false', label: 'Inativas' }], operators: ['equals'] },
  ];

  const applyFromTree = () => {
    const flatten = (node: FilterGroup): any[] => {
      const out: any[] = [];
      for (const ch of node.children) {
        if ((ch as any).type === 'cond') out.push(ch);
        else out.push(...flatten(ch as any));
      }
      return out;
    };
    const conds = flatten(filtersTree);
    const desc = conds.find((c: any) => c.field === 'description' && c.op !== 'in')?.value || '';
    const act = conds.find((c: any) => c.field === 'active' && c.op === 'equals')?.value || 'all';
    setQ(String(desc));
    setActive(String(act));
    setPage(1);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/cash/bases", {
        ...data,
        visibleToUser: true,
        boxType: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/bases"] });
      setShowForm(false);
      toast({ title: "Base criada" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar base", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/cash/bases/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/bases"] });
      setEditing(null);
      toast({ title: "Base atualizada" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar base", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cash/bases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/bases"] });
      setDeletingId(null);
      toast({ title: "Base removida" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao remover base", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando bases de caixa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Bases de Caixa</h1>
          <p className="text-muted-foreground mt-1">Gerencie bases para sessões de caixa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
          <Button onClick={() => setShowForm(true)} data-testid="button-add-base">Nova Base</Button>
        </div>
      </div>

      <FilterCard
        tree={filtersTree}
        onChange={setFiltersTree}
        fields={baseFieldDefs}
        onAddFilter={() => setFiltersTree({ ...filtersTree, children: [...filtersTree.children, { id: uid(), type: 'cond', field: 'active', op: 'equals', value: 'true' }] })}
        onAddGroup={() => setFiltersTree({ ...filtersTree, children: [...filtersTree.children, makeGroup('AND')] })}
        onClear={() => { setFiltersTree(makeGroup('AND')); }}
        onApply={applyFromTree}
      />

      <CashBasesTable
        bases={bases}
        columnsOrder={columnsOrder}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); }}
        onView={(id) => setViewing(bases.find(b => b.id === id) || null)}
        onEdit={(id) => setEditing(bases.find(b => b.id === id) || null)}
        onDelete={(id) => setDeletingId(id)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Base</DialogTitle>
          </DialogHeader>
          <CashBaseForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Base</DialogTitle>
          </DialogHeader>
          {editing && (
            <CashBaseForm
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
            <DialogTitle>Detalhes da Base</DialogTitle>
            <DialogDescription>Informações da base de caixa</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2">
              <p><strong>Descrição:</strong> {viewing.description}</p>
              <p><strong>Saldo:</strong> R$ {parseFloat(viewing.balance || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p><strong>Status:</strong> {viewing.active ? 'Ativa' : 'Inativa'}</p>
          </div>)}
          <DialogFooter>
            <Button onClick={() => setViewing(null)} data-testid="button-close-view">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Base</AlertDialogTitle>
            <AlertDialogDescription>Confirma a exclusão desta base de caixa?</AlertDialogDescription>
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
          labelFor={(col) => col === "description" ? "Descrição" : col === "balance" ? "Saldo" : col === "status" ? "Status" : col}
          onSave={() => { setColumnsDialog(false); toast({ title: "Preferências salvas" }); }}
        />
      </Dialog>
    </div>
  );
}
