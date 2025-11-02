import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { Users, Key, CreditCard, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeLicenses: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  //todo: remove mock functionality - replace with real revenue data from API
  const revenueData = [
    { month: "Jan", revenue: 12500 },
    { month: "Fev", revenue: 15800 },
    { month: "Mar", revenue: 14200 },
    { month: "Abr", revenue: 18900 },
    { month: "Mai", revenue: 21300 },
    { month: "Jun", revenue: 19700 },
  ];

  if (isLoading || !stats) {
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

      <RevenueChart data={revenueData} />
    </div>
  );
}
