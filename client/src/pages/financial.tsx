import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { InvoicesTable } from "@/components/invoices-table";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingUp, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FilterCard } from "@/components/filter-card";
import { ColumnsDialog } from "@/components/columns-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import type { FilterGroup, FieldDef, FilterCond } from "@/components/filter-builder";
import { useGridPreferences } from "@/hooks/useGridPreferences";
import type { Invoice, Client } from "@shared/schema";

interface FinancialStats {
  totalRevenue: number;
  totalRevenueTrend: { value: string; isPositive: boolean } | null;
  paidInvoicesCount: number;
  paidInvoicesTrend: { value: string; isPositive: boolean } | null;
  pendingInvoicesCount: number;
  pendingInvoicesTrend: { value: string; isPositive: boolean } | null;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  upcomingInvoicesCount: number;
}

export default function Financial() {
  const { toast } = useToast();

  const uid = () => Math.random().toString(36).slice(2) + Date.now();
  const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });

  const defaultColumnsOrder = ["id","clientName","amount","dueDate","paidAt","status"];
  const { visibleColumns, setVisibleColumns, columnsOrder, setColumnsOrder, sortBy, setSortBy, sortDir, setSortDir, filtersTree, setFiltersTree } = useGridPreferences("invoices", { visibleColumns: { id: true, clientName: true, amount: true, dueDate: true, paidAt: true, status: true }, columnsOrder: defaultColumnsOrder, sortBy: "dueDate", sortDir: "asc", initialTree: makeGroup('AND') });
  const [columnsDialog, setColumnsDialog] = useState(false);
  const [appliedFiltersTree, setAppliedFiltersTree] = useState<FilterGroup>(makeGroup('AND'));
  const [initialApplied, setInitialApplied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<FinancialStats>({
    queryKey: ["/api/stats/financial"],
  });

  const statsCards = stats ? [
    {
      title: "Receita do Mês",
      value: `R$ ${(stats.totalRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      trend: stats.totalRevenueTrend,
      testId: "stat-total-revenue",
    },
    {
      title: "Faturas Pagas (Mês)",
      value: stats.paidInvoicesCount.toString(),
      icon: TrendingUp,
      trend: stats.paidInvoicesTrend,
      testId: "stat-paid-invoices",
    },
    {
      title: "Pendentes (Mês)",
      value: stats.pendingInvoicesCount.toString(),
      icon: AlertCircle,
      trend: stats.pendingInvoicesTrend,
      testId: "stat-pending-invoices",
    },
    {
      title: "Parcelas em Atraso",
      value: stats.overdueInvoicesCount.toString(),
      icon: AlertTriangle,
      trend: null,
      description: `R$ ${(stats.overdueInvoicesAmount / 1000).toFixed(1)}K em atraso`,
      testId: "stat-overdue-invoices",
    },
    {
      title: "Parcelas a Vencer",
      value: stats.upcomingInvoicesCount.toString(),
      icon: AlertCircle,
      trend: null,
      testId: "stat-upcoming-invoices",
    },
  ] : [];

  const clientMap = new Map(clients.map(c => [c.id, c.companyName]));

  const formattedInvoices = invoices.map(invoice => ({
    id: invoice.id,
    clientName: clientMap.get(invoice.clientId) || "Cliente não encontrado",
    amount: parseFloat(invoice.amount),
    dueDate: invoice.dueDate.toString(),
    paidAt: invoice.paidAt?.toString(),
    status: invoice.status as "paid" | "pending" | "overdue",
  }));

  const invoiceFieldDefs: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'id', operators: ['equals','in'] },
    { key: 'clientName', label: 'Cliente', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'amount', label: 'Valor', type: 'number', operators: ['equals','gt','lt','between'] },
    { key: 'status', label: 'Status', type: 'enum', enumValues: [{ value: 'paid', label: 'Pago' }, { value: 'pending', label: 'Pendente' }, { value: 'overdue', label: 'Vencido' }], operators: ['equals','in'] },
    { key: 'dueDate', label: 'Vencimento', type: 'date', operators: ['equals','between'] },
    { key: 'paidAt', label: 'Pago em', type: 'date', operators: ['equals','between'] },
  ];

  const evalCond = (item: any, cond: FilterCond) => {
    const v = item[cond.field];
    const op = String(cond.op || '').toLowerCase();
    if (cond.field === 'amount') {
      const num = Number(v);
      const a = Number(cond.value);
      const b = Number(cond.value2);
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
    if (cond.field === 'clientName') {
      const sv = String(v || '').toLowerCase();
      const q = String(cond.value || '').toLowerCase();
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
    if (cond.field === 'dueDate' || cond.field === 'paidAt') {
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

  const filteredByTree = formattedInvoices.filter(inv => matchesTree(inv, appliedFiltersTree));

  useEffect(() => {
    if (!initialApplied && (filtersTree.children || []).length > 0) {
      setAppliedFiltersTree(filtersTree);
      setPage(1);
      setInitialApplied(true);
    }
  }, [filtersTree]);

  const printBoletoMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest("POST", `/api/invoices/${invoiceId}/generate-boleto`, {});
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Boleto gerado com sucesso",
          description: "O boleto foi aberto em uma nova aba para impressão.",
        });
      } else {
        toast({
          title: "Boleto gerado",
          description: "Os dados do boleto foram salvos, mas nenhuma URL foi fornecida pela API.",
        });
        console.log("Boleto data:", data);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "Não foi possível gerar o boleto.";
      const errorDetails = error?.details;
      toast({
        title: "Erro ao gerar boleto",
        description: errorDetails || errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePrintBoleto = (invoiceId: string) => {
    printBoletoMutation.mutate(invoiceId);
  };

  if (loadingInvoices || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando financeiro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contas à Receber</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contas a receber, faturas e receitas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <FilterCard
        title="Filtros"
        tree={filtersTree}
        onChange={(t) => { setFiltersTree(t); }}
        fields={invoiceFieldDefs}
        onAddFilter={() => { const ft = { ...filtersTree } as any; ft.children.push({ id: uid(), type: 'cond', field: 'clientName', op: 'contains', value: '' }); setFiltersTree(ft); }}
        onAddGroup={() => { const ft = { ...filtersTree, children: [...filtersTree.children, makeGroup('AND')] }; setFiltersTree(ft); }}
        onClear={() => { const empty = makeGroup('AND'); setFiltersTree(empty); }}
        onApply={(t) => { setAppliedFiltersTree(t); setPage(1); }}
      />

      <InvoicesTable
        invoices={[...filteredByTree].sort((a: any, b: any) => {
          const by = sortBy || 'dueDate';
          const dir = sortDir || 'asc';
          const av = a[by];
          const bv = b[by];
          const cmp = () => {
            if (by === 'amount') return (av ?? 0) - (bv ?? 0);
            if (by === 'status') return String(av).localeCompare(String(bv));
            if (by === 'clientName') return String(av || '').localeCompare(String(bv || ''));
            if (by === 'id') return String(av || '').localeCompare(String(bv || ''));
            const ad = av ? new Date(av).getTime() : 0;
            const bd = bv ? new Date(bv).getTime() : 0;
            return ad - bd;
          };
          const diff = cmp();
          return dir === 'asc' ? diff : -diff;
        }).slice((Math.min(page, Math.max(1, Math.ceil(filteredByTree.length / pageSize))) - 1) * pageSize, (Math.min(page, Math.max(1, Math.ceil(filteredByTree.length / pageSize))) - 1) * pageSize + pageSize)}
        onView={(id) => console.log("View invoice:", id)}
        onPrintBoleto={handlePrintBoleto}
        columnsOrder={columnsOrder}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); }}
      />

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil(filteredByTree.length / pageSize)); setPage(Math.max(1, Math.min(page, totalPages) - 1)); }} />
          </PaginationItem>
          {Array.from({ length: Math.max(1, Math.ceil(filteredByTree.length / pageSize)) }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink href="#" isActive={Math.min(page, Math.max(1, Math.ceil(filteredByTree.length / pageSize))) === (idx + 1)} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil(filteredByTree.length / pageSize)); setPage(Math.min(totalPages, Math.min(page, totalPages) + 1)); }} />
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
          labelFor={(col) => col === "id" ? "ID" : col === "clientName" ? "Cliente" : col === "amount" ? "Valor" : col === "dueDate" ? "Vencimento" : col === "paidAt" ? "Pago em" : col === "status" ? "Status" : col}
          onSave={() => { setColumnsDialog(false); }}
        />
      </Dialog>
    </div>
  );
}
