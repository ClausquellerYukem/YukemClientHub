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
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  onToggle?: (id: string, isActive: boolean) => void;
  onView?: (id: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
}

export function LicensesTable({ licenses, columnsOrder, visibleColumns, onToggle, onView, sortBy: sortByProp, sortDir: sortDirProp, onSortChange }: LicensesTableProps) {
  const [search, setSearch] = useState("");
  const [sortByState, setSortByState] = useState<string>("clientName");
  const [sortDirState, setSortDirState] = useState<"asc" | "desc">("asc");

  const filteredLicenses = licenses.filter((license) =>
    license.clientName.toLowerCase().includes(search.toLowerCase()) ||
    license.licenseKey.toLowerCase().includes(search.toLowerCase())
  );

  const order = columnsOrder || ["clientName","licenseKey","activatedAt","expiresAt","status"];
  const visible = visibleColumns || { clientName: true, licenseKey: true, activatedAt: true, expiresAt: true, status: true };
  const headerLabel = (col: string) => (
    col === "clientName" ? "Cliente" : col === "licenseKey" ? "Chave de Licença" : col === "activatedAt" ? "Data Ativação" : col === "expiresAt" ? "Data Expiração" : col === "status" ? "Status" : col
  );

  const currentSortBy = sortByProp ?? sortByState;
  const currentSortDir = sortDirProp ?? sortDirState;
  const handleSortClick = (col: string) => {
    if (currentSortBy === col) {
      const nextDir = currentSortDir === "asc" ? "desc" : "asc";
      if (onSortChange) onSortChange(col, nextDir); else setSortDirState(nextDir);
    } else {
      if (onSortChange) onSortChange(col, "asc"); else { setSortByState(col); setSortDirState("asc"); }
    }
  };

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
              {order.filter((c) => visible[c] !== false).map((col) => (
                <TableHead key={col} onClick={() => handleSortClick(col)} className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none">
                  {headerLabel(col)} {currentSortBy === col ? (currentSortDir === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...filteredLicenses].sort((a: any, b: any) => {
              const av = currentSortBy === 'status' ? (a.isActive ? 1 : 0)
                : currentSortBy === 'activatedAt' ? new Date(a.activatedAt).getTime()
                : currentSortBy === 'expiresAt' ? new Date(a.expiresAt).getTime()
                : a[currentSortBy];
              const bv = currentSortBy === 'status' ? (b.isActive ? 1 : 0)
                : currentSortBy === 'activatedAt' ? new Date(b.activatedAt).getTime()
                : currentSortBy === 'expiresAt' ? new Date(b.expiresAt).getTime()
                : b[currentSortBy];
              if (av == null && bv == null) return 0;
              if (av == null) return currentSortDir === 'asc' ? -1 : 1;
              if (bv == null) return currentSortDir === 'asc' ? 1 : -1;
              if (typeof av === 'string' && typeof bv === 'string') return currentSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
              if (typeof av === 'number' && typeof bv === 'number') return currentSortDir === 'asc' ? av - bv : bv - av;
              const as = String(av); const bs = String(bv);
              return currentSortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
            }).map((license) => (
              <TableRow key={license.id} className="hover-elevate" data-testid={`row-license-${license.id}`}>
                {order.filter((c) => visible[c] !== false).map((col) => (
                  <TableCell key={col}>
                    {col === "clientName" ? license.clientName
                      : col === "licenseKey" ? (<span className="font-mono text-xs">{license.licenseKey}</span>)
                      : col === "activatedAt" ? new Date(license.activatedAt).toLocaleDateString("pt-BR")
                      : col === "expiresAt" ? new Date(license.expiresAt).toLocaleDateString("pt-BR")
                      : col === "status" ? (
                        <Badge className={license.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"} data-testid={`badge-status-${license.id}`}>
                          {license.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      )
                      : (license as any)[col]}
                  </TableCell>
                ))}
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
