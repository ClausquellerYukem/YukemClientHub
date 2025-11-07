import { useQuery, useMutation } from "@tanstack/react-query";
import { InvoicesTable } from "@/components/invoices-table";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingUp, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
}

export default function Financial() {
  const { toast } = useToast();

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
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie faturas e acompanhe receitas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <InvoicesTable
        invoices={formattedInvoices}
        onView={(id) => console.log("View invoice:", id)}
        onPrintBoleto={handlePrintBoleto}
      />
    </div>
  );
}
