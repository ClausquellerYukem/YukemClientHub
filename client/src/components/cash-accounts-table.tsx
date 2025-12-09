import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit, Eye, Trash2 } from "lucide-react";

type CashAccount = {
  id: string;
  description: string;
  movementIndicator?: string;
  inactive?: boolean;
  category?: number;
  accountCashType?: number;
  parentAccountId?: string | null;
  sequence?: string | null;
};

interface CashAccountsTableProps {
  accounts: CashAccount[];
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
}

export function CashAccountsTable({ accounts, columnsOrder, visibleColumns, onEdit, onView, onDelete, sortBy: sortByProp, sortDir: sortDirProp, onSortChange }: CashAccountsTableProps) {
  const [search, setSearch] = useState("");
  const [sortByState, setSortByState] = useState<string>("description");
  const [sortDirState, setSortDirState] = useState<"asc" | "desc">("asc");

  const filtered = accounts.filter((acc) =>
    acc.description.toLowerCase().includes(search.toLowerCase()) ||
    (acc.movementIndicator || "").toLowerCase().includes(search.toLowerCase())
  );

  const cmpSeq = (a?: string | null, b?: string | null) => {
    const sa = String(a || "");
    const sb = String(b || "");
    if (!sa && !sb) return 0; if (!sa) return -1; if (!sb) return 1;
    const pa = sa.split('.').filter(Boolean).map((x) => parseInt(x));
    const pb = sb.split('.').filter(Boolean).map((x) => parseInt(x));
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
      const va = pa[i] ?? -1; const vb = pb[i] ?? -1;
      if (va !== vb) return va - vb;
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {(columnsOrder || ["description","movementIndicator","category","accountCashType","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                <TableHead key={col} onClick={() => {
                  const currentSortBy = sortByProp ?? sortByState;
                  const currentSortDir = sortDirProp ?? sortDirState;
                  if (currentSortBy === col) { const nextDir = currentSortDir === "asc" ? "desc" : "asc"; if (onSortChange) onSortChange(col, nextDir); else setSortDirState(nextDir); }
                  else { if (onSortChange) onSortChange(col, "asc"); else { setSortByState(col); setSortDirState("asc"); } }
                }} className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none">
                  {col === "description" ? "Descrição" : col === "movementIndicator" ? "Movimento" : col === "category" ? "Categoria" : col === "accountCashType" ? "Tipo" : col === "status" ? "Status" : col} {(sortByProp ?? sortByState) === col ? ((sortDirProp ?? sortDirState) === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...filtered].sort((a: any, b: any) => {
              const currentSortBy = sortByProp ?? sortByState;
              const currentSortDir = sortDirProp ?? sortDirState;
              if (currentSortBy === 'description' && a.sequence || b.sequence) {
                const diff = cmpSeq(a.sequence, b.sequence);
                return currentSortDir === 'asc' ? diff : -diff;
              }
              const av = currentSortBy === 'status' ? (!a.inactive ? 1 : 0) : a[currentSortBy];
              const bv = currentSortBy === 'status' ? (!b.inactive ? 1 : 0) : b[currentSortBy];
              if (av == null && bv == null) return 0;
              if (av == null) return currentSortDir === 'asc' ? -1 : 1;
              if (bv == null) return currentSortDir === 'asc' ? 1 : -1;
              if (typeof av === 'string' && typeof bv === 'string') return currentSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
              if (typeof av === 'number' && typeof bv === 'number') return currentSortDir === 'asc' ? av - bv : bv - av;
              const as = String(av); const bs = String(bv);
              return currentSortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
            }).map((acc) => (
              <TableRow key={acc.id} className="hover-elevate" data-testid={`row-account-${acc.id}`}>
                {(columnsOrder || ["description","movementIndicator","category","accountCashType","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                  <TableCell key={col}>
                    {col === "description" ? (
                      <span>
                        {acc.sequence ? `${acc.sequence} ` : ''}
                        <span style={{ paddingLeft: `${Math.max(0, (String(acc.sequence || '').split('.').filter(Boolean).length - 1)) * 16}px` }}>{acc.description}</span>
                      </span>
                    )
                      : col === "movementIndicator" ? (acc.movementIndicator || "-")
                      : col === "category" ? (acc.category ?? '-')
                      : col === "accountCashType" ? (acc.accountCashType ?? '-')
                      : col === "status" ? (acc.inactive ? "Inativa" : "Ativa")
                      : (acc as any)[col]}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(acc.id)} data-testid={`button-view-${acc.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(acc.id)} data-testid={`button-edit-${acc.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(acc.id)} data-testid={`button-delete-${acc.id}`}>
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
