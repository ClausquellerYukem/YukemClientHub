import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { FilterBuilder, type FilterGroup, type FieldDef } from "@/components/filter-builder";
import { FilterCard } from "@/components/filter-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ColumnsDialog } from "@/components/columns-dialog";
import { useGridPreferences } from "@/hooks/useGridPreferences";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

const typeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

type TypeFormValues = z.infer<typeof typeFormSchema>;

type CashAccountType = { id: string; name: string; description?: string };

export default function CaixaTipos() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CashAccountType | null>(null);
  const [q, setQ] = useState("");
  const uid = () => Math.random().toString(36).slice(2) + Date.now();
  const makeGroup = (logical: 'AND' | 'OR' = 'AND'): FilterGroup => ({ id: uid(), type: 'group', logical, children: [] });
  

  const defaultColumnsOrder = ["name","description"];
  const { visibleColumns, setVisibleColumns, columnsOrder, setColumnsOrder, filtersTree, setFiltersTree } = useGridPreferences("cash_account_types", { visibleColumns: { name: true, description: true }, columnsOrder: defaultColumnsOrder, initialTree: makeGroup('AND') });
  const [columnsDialog, setColumnsDialog] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [initialApplied, setInitialApplied] = useState(false);
  const { data, isLoading } = useQuery<{ items: CashAccountType[]; total: number; page: number; pageSize: number}>({
    queryKey: ["/api/cash/account-types", { q, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/cash/account-types?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      return json;
    }
  });
  const tipos = data?.items || [];

  const createMutation = useMutation({
    mutationFn: async (payload: TypeFormValues) => apiRequest("POST", "/api/cash/account-types", payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cash/account-types"] }); setShowForm(false); toast({ title: "Tipo criado" }); },
    onError: () => toast({ title: "Erro", description: "Falha ao criar tipo", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TypeFormValues> }) => apiRequest("PATCH", `/api/cash/account-types/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cash/account-types"] }); setEditing(null); toast({ title: "Tipo atualizado" }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar tipo", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/cash/account-types/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cash/account-types"] }); toast({ title: "Tipo removido" }); },
    onError: () => toast({ title: "Erro", description: "Falha ao remover tipo", variant: "destructive" }),
  });

  const FormTipo = ({ initialData, onClose }: { initialData?: CashAccountType; onClose: () => void }) => {
    const form = useForm<TypeFormValues>({
      resolver: zodResolver(typeFormSchema),
      defaultValues: initialData ? { name: initialData.name, description: initialData.description || "" } : { name: "", description: "" },
    });
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => initialData ? updateMutation.mutate({ id: initialData.id, data: values }) : createMutation.mutate(values))} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input placeholder="Ex: Receitas" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Input placeholder="Detalhes do tipo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Form>
    );
  };

  const typeFieldDefs: FieldDef[] = [
    { key: 'name', label: 'Nome', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
    { key: 'description', label: 'Descrição', type: 'string', operators: ['contains','equals','startsWith','endsWith','in'] },
  ];

  const applyFromTree = (t?: FilterGroup) => {
    const flatten = (node: FilterGroup): any[] => {
      const out: any[] = [];
      for (const ch of node.children) {
        if ((ch as any).type === 'cond') out.push(ch);
        else out.push(...flatten(ch as any));
      }
      return out;
    };
    const conds = flatten(t || filtersTree);
    const qval = conds.find((c: any) => c.field === 'name' && c.op !== 'in')?.value
      || conds.find((c: any) => c.field === 'description' && c.op !== 'in')?.value
      || '';
    setQ(String(qval));
    setPage(1);
  };

  useEffect(() => {
    if (!initialApplied && (filtersTree.children || []).length > 0) {
      applyFromTree(filtersTree);
      setInitialApplied(true);
    }
  }, [filtersTree]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando tipos...</p></div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Tipos de Conta de Caixa</h1>
          <p className="text-muted-foreground mt-1">Cadastre e gerencie categorias de contas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setColumnsDialog(true)} data-testid="button-columns">Colunas</Button>
          <Button onClick={() => setShowForm(true)} data-testid="button-add-type">Novo Tipo</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <FilterCard
              tree={filtersTree}
              onChange={(t) => { setFiltersTree(t); }}
              fields={typeFieldDefs}
              onAddFilter={() => { const ft = { ...filtersTree, children: [...filtersTree.children, { id: uid(), type: 'cond', field: 'name', op: 'contains', value: '' }] }; setFiltersTree(ft); }}
              onAddGroup={() => { const ft = { ...filtersTree, children: [...filtersTree.children, makeGroup('AND')] }; setFiltersTree(ft); }}
              onClear={() => { setFiltersTree(makeGroup('AND')); }}
              onApply={(t) => applyFromTree(t)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {(columnsOrder || ["name","description"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                  <TableHead key={col}>{col === "name" ? "Nome" : col === "description" ? "Descrição" : col}</TableHead>
                ))}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((t) => (
                <TableRow key={t.id}>
                  {(columnsOrder || ["name","description"]).filter((c) => visibleColumns ? visibleColumns[c] !== false : true).map((col) => (
                    <TableCell key={col}>{col === "name" ? t.name : col === "description" ? (t.description || '-') : (t as any)[col]}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditing(t)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(t.id)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
              </PaginationItem>
              {Array.from({ length: Math.max(1, Math.ceil((data?.total || tipos.length) / pageSize)) }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink href="#" isActive={page === (idx + 1)} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil((data?.total || tipos.length) / pageSize)); setPage(Math.min(totalPages, page + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>

      <Dialog open={columnsDialog} onOpenChange={setColumnsDialog}>
        <ColumnsDialog
          defaultOrder={defaultColumnsOrder}
          visible={visibleColumns}
          setVisible={(v) => setVisibleColumns(v)}
          order={columnsOrder}
          setOrder={(o) => setColumnsOrder(o)}
          labelFor={(col) => col === "name" ? "Nome" : col === "description" ? "Descrição" : col}
          onSave={() => { setColumnsDialog(false); toast({ title: "Preferências salvas" }); }}
        />
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Novo Tipo</DialogTitle></DialogHeader>
          <FormTipo onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar Tipo</DialogTitle></DialogHeader>
          {editing && (<FormTipo initialData={editing} onClose={() => setEditing(null)} />)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
