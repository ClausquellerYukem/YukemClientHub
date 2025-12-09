import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LicensesTable } from "@/components/licenses-table";
import { StatCard } from "@/components/stat-card";
import { Key, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { License, Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface LicenseStats {
  totalLicenses: number;
  activeLicenses: number;
  activeLicensesTrend: { value: string; isPositive: boolean } | null;
  inactiveLicenses: number;
}

export default function Licenses() {
  const { toast } = useToast();
  const defaultColumnsOrder = ["clientName","licenseKey","activatedAt","expiresAt","status"];
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({ clientName: true, licenseKey: true, activatedAt: true, expiresAt: true, status: true });
  const [columnsOrder, setColumnsOrder] = useState<string[]>(defaultColumnsOrder);
  const [columnsDialog, setColumnsDialog] = useState(false);
  const [sortBy, setSortBy] = useState<string>("clientName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: licenses = [], isLoading: loadingLicenses } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<LicenseStats>({
    queryKey: ["/api/stats/licenses"],
  });

  const { data: pref } = useQuery<any>({
    queryKey: ["/api/preferences/grid", { resource: "licenses" }],
    queryFn: async () => {
      const res = await fetch(`/api/preferences/grid?resource=licenses`, { credentials: "include" });
      return await res.json();
    }
  });

  const savePrefMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest("PUT", "/api/preferences/grid", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences/grid", { resource: "licenses" }] });
      setColumnsDialog(false);
      toast({ title: "Preferências salvas" });
    }
  });

  useState(() => {
    if (pref?.columns) {
      setVisibleColumns(pref.columns.visible || visibleColumns);
      setColumnsOrder(pref.columns.order?.length ? pref.columns.order : defaultColumnsOrder);
    }
    if (pref?.sort) {
      setSortBy(pref.sort.by || sortBy);
      setSortDir(pref.sort.dir || sortDir);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/licenses/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      toast({
        title: "Licença atualizada",
        description: "O status da licença foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a licença.",
        variant: "destructive",
      });
    },
  });

  const statsCards = stats ? [
    {
      title: "Total de Licenças",
      value: stats.totalLicenses.toString(),
      icon: Key,
      testId: "stat-total-licenses",
    },
    {
      title: "Licenças Ativas",
      value: stats.activeLicenses.toString(),
      icon: CheckCircle,
      trend: stats.activeLicensesTrend,
      testId: "stat-active-licenses",
    },
    {
      title: "Licenças Inativas",
      value: stats.inactiveLicenses.toString(),
      icon: XCircle,
      testId: "stat-inactive-licenses",
    },
  ] : [];

  const clientMap = new Map(clients.map(c => [c.id, c.companyName]));

  const formattedLicenses = licenses.map(license => ({
    id: license.id,
    clientName: clientMap.get(license.clientId) || "Cliente não encontrado",
    licenseKey: license.licenseKey,
    isActive: license.isActive,
    activatedAt: license.activatedAt.toString(),
    expiresAt: license.expiresAt.toString(),
  }));

  if (loadingLicenses || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando licenças...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Licenças</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie licenças e ativações de clientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
        </div>
      </div>

      <LicensesTable
        licenses={formattedLicenses}
        columnsOrder={columnsOrder}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); savePrefMutation.mutate({ resource: "licenses", columns: { visible: visibleColumns, order: columnsOrder }, sort: { by, dir } }); }}
        onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
        onView={(id) => console.log("View license:", id)}
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
                  <span>{col === "clientName" ? "Cliente" : col === "licenseKey" ? "Chave de Licença" : col === "activatedAt" ? "Data Ativação" : col === "expiresAt" ? "Data Expiração" : col === "status" ? "Status" : col}</span>
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
            <Button onClick={() => savePrefMutation.mutate({ resource: "licenses", columns: { visible: visibleColumns, order: columnsOrder }, sort: { by: sortBy, dir: sortDir } })} data-testid="button-save-columns">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
