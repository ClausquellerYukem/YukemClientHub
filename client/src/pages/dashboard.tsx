import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { Users, Key, CreditCard, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  totalClients: number;
  activeLicenses: number;
  monthlyRevenue: number;
  conversionRate: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: revenueData = [], isLoading: isLoadingRevenue, isError: isErrorRevenue } = useQuery<MonthlyRevenue[]>({
    queryKey: ["/api/stats/monthly-revenue"],
  });

  // Automatic license blocking - Check overdue invoices on dashboard load
  const checkOverdueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/licenses/check-overdue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to check overdue licenses");
      return response.json();
    },
  });

  // Run overdue check when dashboard loads
  useEffect(() => {
    checkOverdueMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !stats || isLoadingRevenue) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total de Clientes",
      value: stats.totalClients.toString(),
      icon: Users,
      trend: { value: "12%", isPositive: true },
      testId: "stat-total-clients",
    },
    {
      title: "Licenças Ativas",
      value: stats.activeLicenses.toString(),
      icon: Key,
      trend: { value: "8%", isPositive: true },
      testId: "stat-active-licenses",
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}K`,
      icon: CreditCard,
      trend: { value: "23%", isPositive: true },
      testId: "stat-monthly-revenue",
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: { value: "2.4%", isPositive: true },
      testId: "stat-conversion-rate",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua operação white label
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {isErrorRevenue ? (
        <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">Erro ao carregar dados de receita mensal</p>
        </div>
      ) : (
        <RevenueChart data={revenueData} />
      )}
    </div>
  );
}
