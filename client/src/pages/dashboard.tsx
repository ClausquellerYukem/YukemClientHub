import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { Users, Key, CreditCard, TrendingUp } from "lucide-react";

export default function Dashboard() {
  //todo: remove mock functionality
  const stats = [
    {
      title: "Total de Clientes",
      value: "248",
      icon: Users,
      trend: { value: "12%", isPositive: true },
      testId: "stat-total-clients",
    },
    {
      title: "Licenças Ativas",
      value: "235",
      icon: Key,
      trend: { value: "8%", isPositive: true },
      testId: "stat-active-licenses",
    },
    {
      title: "Receita Mensal",
      value: "R$ 324.5K",
      icon: CreditCard,
      trend: { value: "23%", isPositive: true },
      testId: "stat-monthly-revenue",
    },
    {
      title: "Taxa de Conversão",
      value: "94.8%",
      icon: TrendingUp,
      trend: { value: "2.4%", isPositive: true },
      testId: "stat-conversion-rate",
    },
  ];

  const revenueData = [
    { month: "Jan", revenue: 12500 },
    { month: "Fev", revenue: 15800 },
    { month: "Mar", revenue: 14200 },
    { month: "Abr", revenue: 18900 },
    { month: "Mai", revenue: 21300 },
    { month: "Jun", revenue: 19700 },
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
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <RevenueChart data={revenueData} />
    </div>
  );
}
