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
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { Search, Edit, Eye, Trash2, FileText, Key } from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  plan: string;
  status: "active" | "inactive" | "trial";
  monthlyValue: number;
}

interface ClientsTableProps {
  clients: Client[];
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerateInvoice?: (id: string) => void;
  isGeneratingInvoice?: boolean;
  onGenerateLicense?: (id: string) => void;
  isGeneratingLicense?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (next: number) => void;
}

export function ClientsTable({ clients, columnsOrder, visibleColumns, onEdit, onView, onDelete, onGenerateInvoice, isGeneratingInvoice, onGenerateLicense, isGeneratingLicense, sortBy: sortByProp, sortDir: sortDirProp, onSortChange, page = 1, pageSize = 10, onPageChange }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const [sortByState, setSortByState] = useState<string>("companyName");
  const [sortDirState, setSortDirState] = useState<"asc" | "desc">("asc");

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(search.toLowerCase()) ||
    client.contactName.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

  const currentSortBy = sortByProp ?? sortByState;
  const currentSortDir = sortDirProp ?? sortDirState;
  const sortedClients = [...filteredClients].sort((a: any, b: any) => {
    const av = a[currentSortBy];
    const bv = b[currentSortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return currentSortDir === "asc" ? -1 : 1;
    if (bv == null) return currentSortDir === "asc" ? 1 : -1;
    if (typeof av === "string" && typeof bv === "string") {
      return currentSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === "number" && typeof bv === "number") {
      return currentSortDir === "asc" ? av - bv : bv - av;
    }
    const as = String(av);
    const bs = String(bv);
    return currentSortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
  });

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedClients = sortedClients.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);

  const order = columnsOrder || ["companyName","contactName","email","plan","monthlyValue","status"];
  const visible = visibleColumns || { companyName: true, contactName: true, email: true, plan: true, monthlyValue: true, status: true };
  const headerLabel = (col: string) => (
    col === "companyName" ? "Empresa" : col === "contactName" ? "Contato" : col === "email" ? "Email" : col === "plan" ? "Plano" : col === "monthlyValue" ? "Valor Mensal" : col === "status" ? "Status" : col
  );
  const handleSort = (col: string) => {
    if (currentSortBy === col) {
      const nextDir = currentSortDir === "asc" ? "desc" : "asc";
      if (onSortChange) onSortChange(col, nextDir); else setSortDirState(nextDir);
    } else {
      if (onSortChange) onSortChange(col, "asc"); else { setSortByState(col); setSortDirState("asc"); }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      inactive: { label: "Inativo", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      trial: { label: "Trial", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    };

    const variant = variants[status] || variants.active;
    return (
      <Badge className={variant.className} data-testid={`badge-status-${status}`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {order.filter((c) => visible[c] !== false).map((col) => (
                <TableHead key={col} onClick={() => handleSort(col)} className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none">
                  {headerLabel(col)} {currentSortBy === col ? (currentSortDir === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedClients.map((client) => (
              <TableRow key={client.id} className="hover-elevate" data-testid={`row-client-${client.id}`}>
                {order.filter((c) => visible[c] !== false).map((col) => (
                  <TableCell key={col}>
                    {col === "companyName" ? client.companyName
                      : col === "contactName" ? client.contactName
                      : col === "email" ? client.email
                      : col === "plan" ? client.plan
                      : col === "monthlyValue" ? `R$ ${client.monthlyValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : col === "status" ? getStatusBadge(client.status)
                      : (client as any)[col]}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(client.id)}
                      data-testid={`button-view-${client.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(client.id)}
                      data-testid={`button-edit-${client.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onGenerateInvoice?.(client.id)}
                      data-testid={`button-generate-invoice-${client.id}`}
                      title="Gerar Fatura"
                      disabled={isGeneratingInvoice}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onGenerateLicense?.(client.id)}
                      data-testid={`button-generate-license-${client.id}`}
                      title="Gerar Licença"
                      disabled={isGeneratingLicense}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete?.(client.id)}
                      data-testid={`button-delete-${client.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); onPageChange?.(Math.max(1, currentPage - 1)); }} />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink href="#" isActive={currentPage === (idx + 1)} onClick={(e) => { e.preventDefault(); onPageChange?.(idx + 1); }}>
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); onPageChange?.(Math.min(totalPages, currentPage + 1)); }} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
