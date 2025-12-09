import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FilterGroup } from "@/components/filter-builder";

type Defaults = {
  visibleColumns: Record<string, boolean>;
  columnsOrder: string[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  initialTree?: FilterGroup;
};

export function useGridPreferences(resource: string, defaults: Defaults) {
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(defaults.visibleColumns);
  const [columnsOrder, setColumnsOrder] = useState<string[]>(defaults.columnsOrder);
  const [sortBy, setSortBy] = useState<string>(defaults.sortBy || "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaults.sortDir || "asc");
  const [filtersTree, setFiltersTree] = useState<FilterGroup>(defaults.initialTree || ({ id: String(Date.now()), type: 'group', logical: 'AND', children: [] } as any));

  const { data: pref } = useQuery<any>({
    queryKey: ["/api/preferences/grid", { resource }],
    queryFn: async () => {
      const res = await fetch(`/api/preferences/grid?resource=${resource}`, { credentials: "include" });
      return await res.json();
    }
  });

  const savePrefMutation = useMutation({
    mutationFn: async (payload: any) => apiRequest("PUT", "/api/preferences/grid", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences/grid", { resource }] });
    }
  });

  useEffect(() => {
    if (!pref) return;
    if (pref.columns) {
      setVisibleColumns(pref.columns.visible || visibleColumns);
      setColumnsOrder(pref.columns.order?.length ? pref.columns.order : defaults.columnsOrder);
      if (pref.columns.filtersTree) setFiltersTree(pref.columns.filtersTree);
    }
    if (pref.sort) {
      setSortBy(pref.sort.by || sortBy);
      setSortDir(pref.sort.dir || sortDir);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref]);

  useEffect(() => {
    const t = setTimeout(() => {
      savePrefMutation.mutate({ resource, columns: { visible: visibleColumns, order: columnsOrder, filtersTree }, sort: sortBy ? { by: sortBy, dir: sortDir } : undefined });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, columnsOrder, filtersTree, sortBy, sortDir]);

  return {
    visibleColumns,
    setVisibleColumns,
    columnsOrder,
    setColumnsOrder,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    filtersTree,
    setFiltersTree,
  };
}

