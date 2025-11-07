import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { Users, Key, CreditCard, TrendingUp, DollarSign, AlertCircle, Wallet } from "lucide-react";

interface DashboardStats {
  totalClients: number;
  totalClientsTrend: { value: string; isPositive: boolean } | null;
  activeLicenses: number;
  activeLicensesTrend: { value: string; isPositive: boolean } | null;
  monthlyRevenue: number;
  monthlyRevenueTrend: { value: string; isPositive: boolean } | null;
  conversionRate: number;
  conversionRateTrend: { value: string; isPositive: boolean } | null;
  totalRevenue: number;
  totalRevenueTrend: { value: string; isPositive: boolean } | null;
  paidInvoicesCount: number;
  paidInvoicesTrend: { value: string; isPositive: boolean } | null;
  pendingInvoicesCount: number;
  pendingInvoicesTrend: { value: string; isPositive: boolean } | null;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface RepasseStats {
  totalRepasse: number;
  companyValue: number;
  excessLicenseRevenue: number;
  description: string;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: revenueData = [], isLoading: isLoadingRevenue, isError: isErrorRevenue } = useQuery<MonthlyRevenue[]>({
    queryKey: ["/api/stats/monthly-revenue"],
  });

  const { data: repasseStats, isLoading: isLoadingRepasse } = useQuery<RepasseStats>({
    queryKey: ["/api/stats/repasse"],
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

  if (isLoading || !stats || isLoadingRevenue || isLoadingRepasse) {
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
      trend: stats.totalClientsTrend,
      testId: "stat-total-clients",
    },
    {
      title: "Licenças Ativas",
      value: stats.activeLicenses.toString(),
      icon: Key,
      trend: stats.activeLicensesTrend,
      testId: "stat-active-licenses",
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}K`,
      icon: CreditCard,
      trend: stats.monthlyRevenueTrend,
      testId: "stat-monthly-revenue",
    },
    {
      title: "Repasse Total",
      value: `R$ ${((repasseStats?.totalRepasse || 0) / 1000).toFixed(1)}K`,
      icon: Wallet,
      trend: null,
      description: repasseStats?.description || "Valor da empresa + licenças excedentes",
      testId: "stat-total-repasse",
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: stats.conversionRateTrend,
      testId: "stat-conversion-rate",
    },
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
