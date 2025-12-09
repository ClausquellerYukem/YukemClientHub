import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CashSession = {
  id: string;
  baseId: string;
  openedAt: string;
  closedAt?: string;
  closed: boolean;
  movementIndicator?: string;
};

type CashBase = { id: string; description: string };

interface CashSessionsTableProps {
  sessions: CashSession[];
  bases: CashBase[];
  columnsOrder?: string[];
  visibleColumns?: Record<string, boolean>;
  onView?: (id: string) => void;
  onClose?: (id: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortDir: "asc" | "desc") => void;
}

export function CashSessionsTable({ sessions, bases, columnsOrder, visibleColumns, onView, onClose, sortBy: sortByProp, sortDir: sortDirProp, onSortChange }: CashSessionsTableProps) {
  const [search, setSearch] = useState("");
  const [sortByState, setSortByState] = useState<string>("openedAt");
  const [sortDirState, setSortDirState] = useState<"asc" | "desc">("desc");

  const filtered = sessions.filter((s) => {
    const baseName = bases.find((b) => b.id === s.baseId)?.description || s.baseId;
    return baseName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
       <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {(columnsOrder || ["base","movementIndicator","openedAt","closedAt","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                <TableHead key={col} onClick={() => {
                  const currentSortBy = sortByProp ?? sortByState;
                  const currentSortDir = sortDirProp ?? sortDirState;
                  if (currentSortBy === col) { const nextDir = currentSortDir === 'asc' ? 'desc' : 'asc'; if (onSortChange) onSortChange(col, nextDir); else setSortDirState(nextDir); }
                  else { if (onSortChange) onSortChange(col, 'asc'); else { setSortByState(col); setSortDirState('asc'); } }
                }} className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none">
                  {col === "base" ? "Base" : col === "movementIndicator" ? "Movimento" : col === "openedAt" ? "Aberta em" : col === "closedAt" ? "Fechada em" : col === "status" ? "Status" : col} {(sortByProp ?? sortByState) === col ? ((sortDirProp ?? sortDirState) === 'asc' ? '▲' : '▼') : ''}
                </TableHead>
              ))}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...filtered].sort((a: any, b: any) => {
              const currentSortBy = sortByProp ?? sortByState;
              const currentSortDir = sortDirProp ?? sortDirState;
              const mapBase = (sid: string) => bases.find((bb) => bb.id === sid)?.description || sid;
              const av = currentSortBy === 'base' ? mapBase(a.baseId)
                : currentSortBy === 'status' ? (a.closed ? 1 : 0)
                : currentSortBy === 'openedAt' ? new Date(a.openedAt).getTime()
                : currentSortBy === 'closedAt' ? (a.closedAt ? new Date(a.closedAt).getTime() : -Infinity)
                : (a as any)[currentSortBy];
              const bv = currentSortBy === 'base' ? mapBase(b.baseId)
                : currentSortBy === 'status' ? (b.closed ? 1 : 0)
                : currentSortBy === 'openedAt' ? new Date(b.openedAt).getTime()
                : currentSortBy === 'closedAt' ? (b.closedAt ? new Date(b.closedAt).getTime() : -Infinity)
                : (b as any)[currentSortBy];
              if (av == null && bv == null) return 0;
              if (av == null) return currentSortDir === 'asc' ? -1 : 1;
              if (bv == null) return currentSortDir === 'asc' ? 1 : -1;
              if (typeof av === 'string' && typeof bv === 'string') return currentSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
              if (typeof av === 'number' && typeof bv === 'number') return currentSortDir === 'asc' ? av - bv : bv - av;
              const as = String(av); const bs = String(bv);
              return currentSortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
            }).map((s) => (
              <TableRow key={s.id} className="hover-elevate" data-testid={`row-session-${s.id}`}>
                {(columnsOrder || ["base","movementIndicator","openedAt","closedAt","status"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                  <TableCell key={col}>
                    {col === "base" ? (bases.find((b) => b.id === s.baseId)?.description || s.baseId)
                      : col === "movementIndicator" ? (s.movementIndicator ? (<Badge variant={s.movementIndicator === 'S' ? 'destructive' : 'default'}>{s.movementIndicator === 'S' ? 'Saída' : 'Entrada'}</Badge>) : '-')
                      : col === "openedAt" ? new Date(s.openedAt).toLocaleString("pt-BR")
                      : col === "closedAt" ? (s.closedAt ? new Date(s.closedAt).toLocaleString("pt-BR") : '-')
                      : col === "status" ? (s.closed ? "Fechada" : "Aberta")
                      : (s as any)[col]}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView?.(s.id)} data-testid={`button-view-${s.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!s.closed && (
                      <Button variant="ghost" size="icon" onClick={() => onClose?.(s.id)} data-testid={`button-close-${s.id}`}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
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
