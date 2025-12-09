import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit, Eye, Trash2 } from "lucide-react";

type CashBase = {
  id: string;
  description: string;
  balance: string;
  active: boolean;
};

interface CashBasesTableProps {
  bases: CashBase[];
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
}

export function CashBasesTable({ bases, columnsOrder, visibleColumns, onEdit, onView, onDelete, sortBy: sortByProp, sortDir: sortDirProp, onSortChange }: CashBasesTableProps) {
  const [search, setSearch] = useState("");
  const [sortByState, setSortByState] = useState<string>("description");
  const [sortDirState, setSortDirState] = useState<"asc" | "desc">("asc");

  const filtered = bases.filter((b) =>
    b.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
 
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {(columnsOrder || ["description","balance","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                <TableHead key={col} onClick={() => {
                  const currentSortBy = sortByProp ?? sortByState;
                  const currentSortDir = sortDirProp ?? sortDirState;
                  if (currentSortBy === col) { const nextDir = currentSortDir === 'asc' ? 'desc' : 'asc'; if (onSortChange) onSortChange(col, nextDir); else setSortDirState(nextDir); }
                  else { if (onSortChange) onSortChange(col, 'asc'); else { setSortByState(col); setSortDirState('asc'); } }
                }} className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none">
                  {col === "description" ? "Descrição" : col === "balance" ? "Saldo" : col === "status" ? "Status" : col} {(sortByProp ?? sortByState) === col ? ((sortDirProp ?? sortDirState) === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...filtered].sort((a: any, b: any) => {
              const currentSortBy = sortByProp ?? sortByState;
              const currentSortDir = sortDirProp ?? sortDirState;
              const av = currentSortBy === 'status' ? (a.active ? 1 : 0) : (currentSortBy === 'balance' ? parseFloat(a.balance || '0') : a[currentSortBy]);
              const bv = currentSortBy === 'status' ? (b.active ? 1 : 0) : (currentSortBy === 'balance' ? parseFloat(b.balance || '0') : b[currentSortBy]);
              if (av == null && bv == null) return 0;
              if (av == null) return currentSortDir === 'asc' ? -1 : 1;
              if (bv == null) return currentSortDir === 'asc' ? 1 : -1;
              if (typeof av === 'string' && typeof bv === 'string') return currentSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
              if (typeof av === 'number' && typeof bv === 'number') return currentSortDir === 'asc' ? av - bv : bv - av;
              const as = String(av); const bs = String(bv);
              return currentSortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
            }).map((b) => (
              <TableRow key={b.id} className="hover-elevate" data-testid={`row-base-${b.id}`}>
                {(columnsOrder || ["description","balance","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                  <TableCell key={col}>
                    {col === "description" ? b.description
                      : col === "balance" ? `R$ ${parseFloat(b.balance || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : col === "status" ? (b.active ? "Ativa" : "Inativa")
                      : (b as any)[col]}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(b.id)} data-testid={`button-view-${b.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(b.id)} data-testid={`button-edit-${b.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(b.id)} data-testid={`button-delete-${b.id}`}>
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
