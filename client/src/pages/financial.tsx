import { InvoicesTable } from "@/components/invoices-table";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export default function Financial() {
  //todo: remove mock functionality
  const stats = [
    {
      title: "Receita Total",
      value: "R$ 324.5K",
      icon: DollarSign,
      trend: { value: "23%", isPositive: true },
      testId: "stat-total-revenue",
    },
    {
      title: "Faturas Pagas",
      value: "218",
      icon: TrendingUp,
      trend: { value: "15%", isPositive: true },
      testId: "stat-paid-invoices",
    },
    {
      title: "Pendentes",
      value: "30",
      icon: AlertCircle,
      trend: { value: "5%", isPositive: false },
      testId: "stat-pending-invoices",
    },
  ];

  const mockInvoices = [
    {
      id: "001",
      clientName: "Tech Solutions Ltda",
      amount: 2500.00,
      dueDate: "2024-12-15",
      paidAt: "2024-12-10",
      status: "paid" as const,
    },
    {
      id: "002",
      clientName: "Comercial Santos",
      amount: 1200.00,
      dueDate: "2024-12-20",
      status: "pending" as const,
    },
    {
      id: "003",
      clientName: "Indústria Moderna",
      amount: 500.00,
      dueDate: "2024-11-30",
      status: "overdue" as const,
    },
    {
      id: "004",
      clientName: "Distribuidora ABC",
      amount: 1500.00,
      dueDate: "2024-12-18",
      paidAt: "2024-12-12",
      status: "paid" as const,
    },
    {
      id: "005",
      clientName: "Logística Express",
      amount: 3000.00,
      dueDate: "2024-12-25",
      status: "pending" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie faturas e acompanhe receitas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <InvoicesTable
        invoices={mockInvoices}
        onView={(id) => console.log("View invoice:", id)}
      />
    </div>
  );
}
