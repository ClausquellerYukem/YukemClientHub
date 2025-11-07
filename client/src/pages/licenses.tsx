import { useQuery, useMutation } from "@tanstack/react-query";
import { LicensesTable } from "@/components/licenses-table";
import { StatCard } from "@/components/stat-card";
import { Key, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { License, Client } from "@shared/schema";

interface LicenseStats {
  totalLicenses: number;
  activeLicenses: number;
  activeLicensesTrend: { value: string; isPositive: boolean } | null;
  inactiveLicenses: number;
}

export default function Licenses() {
  const { toast } = useToast();

  const { data: licenses = [], isLoading: loadingLicenses } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<LicenseStats>({
    queryKey: ["/api/stats/licenses"],
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

      <LicensesTable
        licenses={formattedLicenses}
        onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
        onView={(id) => console.log("View license:", id)}
      />
    </div>
  );
}
