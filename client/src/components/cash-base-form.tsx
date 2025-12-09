import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const cashBaseFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  balance: z.string().optional(),
  active: z.boolean().optional(),
});

type CashBaseFormValues = z.infer<typeof cashBaseFormSchema>;

interface CashBaseFormProps {
  onSubmit: (data: CashBaseFormValues) => void;
  onCancel: () => void;
  initialData?: any;
}

export function CashBaseForm({ onSubmit, onCancel, initialData }: CashBaseFormProps) {
  const form = useForm<CashBaseFormValues>({
    resolver: zodResolver(cashBaseFormSchema),
    defaultValues: initialData ? {
      description: initialData.description || "",
      balance: initialData.balance || "0",
      active: !!initialData.active,
    } : {
      description: "",
      balance: "0",
      active: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Frente de Loja" {...field} data-testid="input-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Inicial</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-balance" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Ativa?</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
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
            Salvar Base
          </Button>
        </div>
      </form>
    </Form>
  );
}
