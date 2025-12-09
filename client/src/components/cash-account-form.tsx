import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cashAccountFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  movementIndicator: z.enum(['E','S']).optional(),
  inactive: z.boolean().optional(),
  typeId: z.string().optional(),
  parentAccountId: z.string().optional().nullable(),
  sequence: z.string().optional(),
});

type CashAccountFormValues = z.infer<typeof cashAccountFormSchema>;

interface CashAccountFormProps {
  onSubmit: (data: CashAccountFormValues) => void;
  onCancel: () => void;
  initialData?: any;
}

export function CashAccountForm({ onSubmit, onCancel, initialData }: CashAccountFormProps) {
  const { data: accountsData } = useQuery({
    queryKey: ["/api/cash/accounts", { page: 1, pageSize: 1000 }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", pageSize: "1000" });
      const res = await fetch(`/api/cash/accounts?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      return json?.items || [];
    }
  });
  const { data: typesData } = useQuery({
    queryKey: ["/api/cash/account-types"],
    queryFn: async () => {
      const res = await fetch(`/api/cash/account-types`, { credentials: "include" });
      const json = await res.json();
      return json?.items || [];
    }
  });
  const form = useForm<CashAccountFormValues>({
    resolver: zodResolver(cashAccountFormSchema),
    defaultValues: initialData ? {
      description: initialData.description || "",
      movementIndicator: initialData.movementIndicator || undefined,
      inactive: !!initialData.inactive,
      typeId: initialData.typeId || undefined,
      parentAccountId: initialData.parentAccountId || null,
      sequence: initialData.sequence || "",
    } : {
      description: "",
      movementIndicator: undefined,
      inactive: false,
      typeId: undefined,
      parentAccountId: null,
      sequence: "",
    },
  });

  const computeNextSequence = (parentId?: string | null) => {
    const list = Array.isArray(accountsData) ? accountsData : [];
    const byId: Record<string, any> = {};
    for (const a of list) byId[a.id] = a;
    if (parentId) {
      const parent = byId[parentId];
      const prefix = (parent?.sequence || "").trim();
      const siblings = list.filter((a: any) => a.parentAccountId === parentId);
      let max = 0;
      for (const s of siblings) {
        const seq = String(s.sequence || "");
        const parts = seq.split('.').filter(Boolean);
        const last = parts.length ? parseInt(parts[parts.length - 1]) : 0;
        if (!isNaN(last)) max = Math.max(max, last);
      }
      const next = max + 1;
      return prefix ? `${prefix}.${next}` : `${next}`;
    } else {
      const roots = list.filter((a: any) => !a.parentAccountId);
      let max = 0;
      for (const r of roots) {
        const seq = String(r.sequence || "");
        const first = seq.split('.').filter(Boolean)[0];
        const n = first ? parseInt(first) : 0;
        if (!isNaN(n)) max = Math.max(max, n);
      }
      return String(max + 1);
    }
  };

  const ROOT_VALUE = "__root__";
  const parentOptions = [{ id: ROOT_VALUE, label: "(Conta raiz)" }, ...(Array.isArray(accountsData) ? accountsData.map((a: any) => ({ id: a.id, label: `${a.sequence ? a.sequence + ' ' : ''}${a.description}` })) : [])];

  const handleSubmit = (vals: CashAccountFormValues) => {
    const list = Array.isArray(accountsData) ? accountsData : [];
    const siblings = list.filter((a: any) => (a.parentAccountId || null) === (vals.parentAccountId || null));
    const siblingSeqs = new Set<string>((siblings.map((s: any) => String(s.sequence || '')).filter(Boolean)) as any);
    const seq = String(vals.sequence || '').trim();
    const parent = list.find((a: any) => a.id === vals.parentAccountId);
    const parentSeq = String(parent?.sequence || '');
    const seqRegex = /^\d+(?:\.\d+)*$/;
    if (!seqRegex.test(seq)) {
      form.setError('sequence', { type: 'manual', message: 'Sequência inválida. Use números com pontos (ex: 1.2.1).' });
      return;
    }
    if (parent && parentSeq && !seq.startsWith(parentSeq + '.')) {
      form.setError('sequence', { type: 'manual', message: `Sequência deve começar com ${parentSeq}.` });
      return;
    }
    if (siblingSeqs.has(seq) && (!initialData || initialData.sequence !== seq)) {
      form.setError('sequence', { type: 'manual', message: 'Já existe uma conta irmã com esta sequência.' });
      return;
    }
    onSubmit(vals);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parentAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta Mãe</FormLabel>
                <Select onValueChange={(v) => {
                  const normalized = v === ROOT_VALUE ? null : v;
                  field.onChange(normalized);
                  const nextSeq = computeNextSequence(normalized as any);
                  form.setValue('sequence', nextSeq, { shouldValidate: true, shouldDirty: true });
                }} defaultValue={field.value != null ? field.value : ROOT_VALUE}>
                  <FormControl>
                    <SelectTrigger data-testid="select-parent">
                      <SelectValue placeholder="Selecione a conta mãe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id || 'root'} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="typeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Conta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(typesData || []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Caixa Principal" {...field} data-testid="input-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="movementIndicator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indicador de Movimento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-movement">
                      <SelectValue placeholder="Selecione o movimento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="S">Saída</SelectItem>
                    <SelectItem value="E">Entrada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sequence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sequência (plano de contas)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 1.2.1" {...field} data-testid="input-sequence" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inactive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Inativa?</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-inactive" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancelar
          </Button>
          <Button type="submit" data-testid="button-submit">
            Salvar Conta
          </Button>
        </div>
      </form>
    </Form>
  );
}
