import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: "paid" | "pending" | "overdue";
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onView?: (id: string) => void;
  onPrintBoleto?: (id: string) => void;
}

export function InvoicesTable({ invoices, onView, onPrintBoleto }: InvoicesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      paid: { label: "Pago", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      pending: { label: "Pendente", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
      overdue: { label: "Vencido", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className} data-testid={`badge-status-${status}`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Cliente</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Valor</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Vencimento</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Data Pagamento</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover-elevate" data-testid={`row-invoice-${invoice.id}`}>
                <TableCell className="font-medium font-mono text-xs" data-testid={`text-id-${invoice.id}`}>
                  #{invoice.id}
                </TableCell>
                <TableCell data-testid={`text-client-${invoice.id}`}>{invoice.clientName}</TableCell>
                <TableCell className="font-medium" data-testid={`text-amount-${invoice.id}`}>
                  R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell data-testid={`text-due-date-${invoice.id}`}>
                  {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-muted-foreground" data-testid={`text-paid-at-${invoice.id}`}>
                  {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("pt-BR") : "-"}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(invoice.id)}
                      data-testid={`button-view-${invoice.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPrintBoleto?.(invoice.id)}
                      data-testid={`button-print-boleto-${invoice.id}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
