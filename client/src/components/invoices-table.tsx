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
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
}

export function InvoicesTable({ invoices, onView, onPrintBoleto, columnsOrder, visibleColumns, sortBy: sortByProp, sortDir: sortDirProp, onSortChange }: InvoicesTableProps) {
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

  const cols = (columnsOrder || ["id","clientName","amount","dueDate","paidAt","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true);

  const sortLabel = (col: string) => col === "id" ? "ID" : col === "clientName" ? "Cliente" : col === "amount" ? "Valor" : col === "dueDate" ? "Vencimento" : col === "paidAt" ? "Data Pagamento" : col === "status" ? "Status" : col;

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((col) => (
                <TableHead
                  key={col}
                  onClick={() => {
                    const currentSortBy = sortByProp ?? "dueDate";
                    const currentSortDir = sortDirProp ?? "asc";
                    if (currentSortBy === col) {
                      const nextDir = currentSortDir === "asc" ? "desc" : "asc";
                      onSortChange?.(col, nextDir);
                    } else {
                      onSortChange?.(col, "asc");
                    }
                  }}
                  className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none"
                >
                  {sortLabel(col)} {(sortByProp ?? "") === col ? ((sortDirProp ?? "asc") === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover-elevate" data-testid={`row-invoice-${invoice.id}`}>
                {cols.map((col) => (
                  <TableCell key={col}>
                    {col === "id" ? (
                      <span className="font-medium font-mono text-xs" data-testid={`text-id-${invoice.id}`}>#{invoice.id}</span>
                    ) : col === "clientName" ? (
                      <span data-testid={`text-client-${invoice.id}`}>{invoice.clientName}</span>
                    ) : col === "amount" ? (
                      <span className="font-medium" data-testid={`text-amount-${invoice.id}`}>R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    ) : col === "dueDate" ? (
                      <span data-testid={`text-due-date-${invoice.id}`}>{new Date(invoice.dueDate).toLocaleDateString("pt-BR")}</span>
                    ) : col === "paidAt" ? (
                      <span className="text-muted-foreground" data-testid={`text-paid-at-${invoice.id}`}>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("pt-BR") : "-"}</span>
                    ) : col === "status" ? (
                      getStatusBadge(invoice.status)
                    ) : (
                      (invoice as any)[col]
                    )}
                  </TableCell>
                ))}
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
