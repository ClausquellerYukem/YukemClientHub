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
import { Search, Edit, Eye, Trash2, FileText } from "lucide-react";

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
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerateInvoice?: (id: string) => void;
  isGeneratingInvoice?: boolean;
}

export function ClientsTable({ clients, onEdit, onView, onDelete, onGenerateInvoice, isGeneratingInvoice }: ClientsTableProps) {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(search.toLowerCase()) ||
    client.contactName.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Empresa</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Contato</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Email</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Plano</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Valor Mensal</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="hover-elevate" data-testid={`row-client-${client.id}`}>
                <TableCell className="font-medium" data-testid={`text-company-${client.id}`}>
                  {client.companyName}
                </TableCell>
                <TableCell data-testid={`text-contact-${client.id}`}>{client.contactName}</TableCell>
                <TableCell className="text-muted-foreground" data-testid={`text-email-${client.id}`}>
                  {client.email}
                </TableCell>
                <TableCell data-testid={`text-plan-${client.id}`}>{client.plan}</TableCell>
                <TableCell data-testid={`text-value-${client.id}`}>
                  R$ {client.monthlyValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
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
    </div>
  );
}
