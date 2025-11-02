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
import { Switch } from "@/components/ui/switch";
import { Search, Eye } from "lucide-react";

interface License {
  id: string;
  clientName: string;
  licenseKey: string;
  isActive: boolean;
  activatedAt: string;
  expiresAt: string;
}

interface LicensesTableProps {
  licenses: License[];
  onToggle?: (id: string, isActive: boolean) => void;
  onView?: (id: string) => void;
}

export function LicensesTable({ licenses, onToggle, onView }: LicensesTableProps) {
  const [search, setSearch] = useState("");

  const filteredLicenses = licenses.filter((license) =>
    license.clientName.toLowerCase().includes(search.toLowerCase()) ||
    license.licenseKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar licenças..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-licenses"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Cliente</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Chave de Licença</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Data Ativação</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Data Expiração</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.map((license) => (
              <TableRow key={license.id} className="hover-elevate" data-testid={`row-license-${license.id}`}>
                <TableCell className="font-medium" data-testid={`text-client-${license.id}`}>
                  {license.clientName}
                </TableCell>
                <TableCell className="font-mono text-xs" data-testid={`text-key-${license.id}`}>
                  {license.licenseKey}
                </TableCell>
                <TableCell data-testid={`text-activated-${license.id}`}>
                  {new Date(license.activatedAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell data-testid={`text-expires-${license.id}`}>
                  {new Date(license.expiresAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      license.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }
                    data-testid={`badge-status-${license.id}`}
                  >
                    {license.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Switch
                      checked={license.isActive}
                      onCheckedChange={(checked) => onToggle?.(license.id, checked)}
                      data-testid={`switch-active-${license.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(license.id)}
                      data-testid={`button-view-${license.id}`}
                    >
                      <Eye className="h-4 w-4" />
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
