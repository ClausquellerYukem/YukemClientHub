import { useQuery, useMutation } from "@tanstack/react-query";
import { InvoicesTable } from "@/components/invoices-table";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Client } from "@shared/schema";

export default function Financial() {
  const { toast } = useToast();

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const paidInvoices = invoices.filter(i => i.status === "paid");
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const stats = [
    {
      title: "Receita Total",
      value: `R$ ${(totalRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      trend: { value: "23%", isPositive: true },
      testId: "stat-total-revenue",
    },
    {
      title: "Faturas Pagas",
      value: paidInvoices.length.toString(),
      icon: TrendingUp,
      trend: { value: "15%", isPositive: true },
      testId: "stat-paid-invoices",
    },
    {
      title: "Pendentes",
      value: pendingInvoices.length.toString(),
      icon: AlertCircle,
      trend: { value: "5%", isPositive: false },
      testId: "stat-pending-invoices",
    },
  ];

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
      return apiRequest("POST", `/api/boleto/print/${invoiceId}`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Boleto gerado",
        description: "O boleto foi gerado com sucesso.",
      });
      console.log("Boleto data:", data);
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "Não foi possível gerar o boleto.";
      toast({
        title: "Erro ao gerar boleto",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePrintBoleto = (invoiceId: string) => {
    printBoletoMutation.mutate(invoiceId);
  };

  if (loadingInvoices) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
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
