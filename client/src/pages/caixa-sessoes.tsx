import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { type FilterGroup, type FieldDef } from "@/components/filter-builder";
import { FilterCard } from "@/components/filter-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ColumnsDialog } from "@/components/columns-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { useGridPreferences } from "@/hooks/useGridPreferences";
import { CashSessionsTable } from "@/components/cash-sessions-table";
import { CashSessionOpenForm } from "@/components/cash-session-open-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
 

type CashBase = { id: string; description: string };
type CashSession = {
  id: string;
  baseId: string;
  openedAt: string;
  closedAt?: string;
  closed: boolean;
};

export default function CaixaSessoes() {
  const { toast } = useToast();
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [viewing, setViewing] = useState<CashSession | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const { data: basesResponse } = useQuery<{ items: CashBase[]; total: number; page: number; pageSize: number }>({ queryKey: ["/api/cash/bases"] });
  const bases: CashBase[] = (basesResponse && (basesResponse as any).items) ? (basesResponse as any).items : [];
  const uid = () => Math.random().toString(36).slice(2) + Date.now();
  const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });
  const [baseFilter, setBaseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [movementFilter, setMovementFilter] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<string>("openedAt");
  const [orderDir, setOrderDir] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openedFrom, setOpenedFrom] = useState<string>("");
  const [openedTo, setOpenedTo] = useState<string>("");
  const [closedFrom, setClosedFrom] = useState<string>("");
  const [closedTo, setClosedTo] = useState<string>("");
  const defaultColumnsOrder = ["base","movementIndicator","openedAt","closedAt","status"];
  const { visibleColumns, setVisibleColumns, columnsOrder, setColumnsOrder, sortBy, setSortBy, sortDir, setSortDir, filtersTree, setFiltersTree } = useGridPreferences("cash_sessions", { visibleColumns: { base: true, movementIndicator: true, openedAt: true, closedAt: true, status: true }, columnsOrder: defaultColumnsOrder, sortBy: "openedAt", sortDir: "desc", initialTree: makeGroup('AND') });
  const [initialApplied, setInitialApplied] = useState(false);

  const { data, isLoading } = useQuery<{ items: CashSession[]; total: number; page: number; pageSize: number}>({
    queryKey: ["/api/cash/sessions", { baseId: baseFilter, status: statusFilter, movement: movementFilter, orderBy, orderDir, openedFrom, openedTo, closedFrom, closedTo, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (baseFilter && baseFilter !== 'all') params.set("baseId", baseFilter);
      if (statusFilter && statusFilter !== 'all') params.set("status", statusFilter);
      if (movementFilter && movementFilter !== 'all') params.set("movement", movementFilter);
      if (orderBy) params.set("orderBy", orderBy);
      if (orderDir) params.set("orderDir", orderDir);
      if (openedFrom) params.set("openedFrom", openedFrom);
      if (openedTo) params.set("openedTo", openedTo);
      if (closedFrom) params.set("closedFrom", closedFrom);
      if (closedTo) params.set("closedTo", closedTo);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/cash/sessions?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      return json;
    }
  });
  const sessoes = data?.items || [];
  const [columnsDialog, setColumnsDialog] = useState(false);
  

  const sessionFieldDefs: FieldDef[] = [
    { key: 'baseId', label: 'Base', type: 'enum', enumValues: [{ value: 'all', label: 'Todas' }, ...bases.map(b => ({ value: b.id, label: b.description }))], operators: ['equals'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: [{ value: 'all', label: 'Todas' }, { value: 'open', label: 'Abertas' }, { value: 'closed', label: 'Fechadas' }], operators: ['equals'] },
    { key: 'movementIndicator', label: 'Movimento', type: 'enum', enumValues: [{ value: 'all', label: 'Todos' }, { value: 'E', label: 'Entrada' }, { value: 'S', label: 'Saída' }], operators: ['equals'] },
    { key: 'openedAt', label: 'Aberta em', type: 'date', operators: ['equals','between'] },
    { key: 'closedAt', label: 'Fechada em', type: 'date', operators: ['equals','between'] },
  ];

  const applyFromTree = (t?: FilterGroup) => {
    const flatten = (node: FilterGroup): any[] => {
      const out: any[] = [];
      for (const ch of node.children) {
        if ((ch as any).type === 'cond') out.push(ch);
        else out.push(...flatten(ch as any));
      }
      return out;
    };
    const conds = flatten(t || filtersTree);
    const findVal = (key: string) => {
      const c = conds.find((c: any) => c.field === key && c.op === 'equals');
      return c ? c.value : undefined;
    };
    const ofrom = conds.find((c: any) => c.field === 'openedAt' && c.op === 'between')?.value;
    const oto = conds.find((c: any) => c.field === 'openedAt' && c.op === 'between')?.value2;
    const cfrom = conds.find((c: any) => c.field === 'closedAt' && c.op === 'between')?.value;
    const cto = conds.find((c: any) => c.field === 'closedAt' && c.op === 'between')?.value2;
    const base = findVal('baseId');
    const stat = findVal('status');
    const mov = findVal('movementIndicator');
    setBaseFilter(base ?? 'all');
    setStatusFilter(stat ?? 'all');
    setMovementFilter(mov ?? 'all');
    setOpenedFrom(ofrom || '');
    setOpenedTo(oto || '');
    setClosedFrom(cfrom || '');
    setClosedTo(cto || '');
    setPage(1);
  };

  useEffect(() => {
    if (!initialApplied && (filtersTree.children || []).length > 0) {
      applyFromTree(filtersTree);
      setInitialApplied(true);
    }
  }, [filtersTree]);

  const openMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/cash/sessions/open", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/sessions"] });
      toast({ title: "Sessão aberta" });
      setShowOpenForm(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao abrir sessão", variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/cash/sessions/${id}/close`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash/sessions"] });
      setClosingId(null);
      toast({ title: "Sessão fechada" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao fechar sessão", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Sessões de Caixa</h1>
          <p className="text-muted-foreground mt-1">Abertura e fechamento de sessões</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
          <Button onClick={() => setShowOpenForm(true)} data-testid="button-open-session">Abrir Sessão</Button>
        </div>
      </div>
      <FilterCard
        tree={filtersTree}
        onChange={(t) => { setFiltersTree(t); }}
        fields={sessionFieldDefs}
        onClear={() => { setFiltersTree(makeGroup('AND')); }}
        onApply={(t) => applyFromTree(t)}
      />
      

          <Card>
        <CardHeader>
          <CardTitle>Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Carregando sessões...</p>
            </div>
          ) : (
            <CashSessionsTable
              sessions={sessoes}
              bases={bases}
              columnsOrder={columnsOrder}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); }}
              onView={(id) => setViewing(sessoes.find(s => s.id === id) || null)}
              onClose={(id) => setClosingId(id)}
            />
          )}
        </CardContent>
          </Card>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
          </PaginationItem>
          {Array.from({ length: Math.max(1, Math.ceil((data?.total || sessoes.length) / pageSize)) }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink href="#" isActive={page === (idx + 1)} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil((data?.total || sessoes.length) / pageSize)); setPage(Math.min(totalPages, page + 1)); }} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={columnsDialog} onOpenChange={setColumnsDialog}>
        <ColumnsDialog
          defaultOrder={defaultColumnsOrder}
          visible={visibleColumns}
          setVisible={(v) => setVisibleColumns(v)}
          order={columnsOrder}
          setOrder={(o) => setColumnsOrder(o)}
          labelFor={(col) => col === "base" ? "Base" : col === "movementIndicator" ? "Movimento" : col === "openedAt" ? "Aberta em" : col === "closedAt" ? "Fechada em" : col === "status" ? "Status" : col}
          onSave={() => { setColumnsDialog(false); toast({ title: "Preferências salvas" }); }}
        />
      </Dialog>

      <Dialog open={showOpenForm} onOpenChange={setShowOpenForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Abrir Sessão</DialogTitle>
          </DialogHeader>
          <CashSessionOpenForm bases={bases} onSubmit={(data) => openMutation.mutate(data)} onCancel={() => setShowOpenForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Sessão</DialogTitle>
            <DialogDescription>Informações da sessão de caixa</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2">
              <p><strong>Base:</strong> {bases.find((b) => b.id === viewing.baseId)?.description || viewing.baseId}</p>
              <p><strong>Aberta em:</strong> {new Date(viewing.openedAt).toLocaleString("pt-BR")}</p>
              <p><strong>Fechada em:</strong> {viewing.closedAt ? new Date(viewing.closedAt).toLocaleString("pt-BR") : '-'}</p>
              <p><strong>Status:</strong> {viewing.closed ? 'Fechada' : 'Aberta'}</p>
          </div>)}
          <DialogFooter>
            <Button onClick={() => setViewing(null)} data-testid="button-close-view">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!closingId} onOpenChange={(open) => !open && setClosingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Sessão</AlertDialogTitle>
            <AlertDialogDescription>Confirma o fechamento desta sessão de caixa?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-close">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => closingId && closeMutation.mutate(closingId)} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-confirm-close">Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
