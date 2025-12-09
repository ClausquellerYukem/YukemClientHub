import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cashSessionFormSchema = z.object({
  baseId: z.string().min(1, "Base é obrigatória"),
  movementIndicator: z.string().optional(),
});

type CashSessionFormValues = z.infer<typeof cashSessionFormSchema>;

type CashBase = { id: string; description: string };

interface CashSessionOpenFormProps {
  bases: CashBase[];
  onSubmit: (data: CashSessionFormValues) => void;
  onCancel: () => void;
}

export function CashSessionOpenForm({ bases, onSubmit, onCancel }: CashSessionOpenFormProps) {
  const form = useForm<CashSessionFormValues>({
    resolver: zodResolver(cashSessionFormSchema),
    defaultValues: { baseId: "", movementIndicator: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="baseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-base">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bases.map((b) => (
                      <SelectItem key={b.id} value={b.id} data-testid={`option-base-${b.id}`}>{b.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="movementIndicator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Movimento</FormLabel>
                <FormControl>
                  <Input placeholder="E ou S" {...field} data-testid="input-movement" />
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
            Abrir Sessão
          </Button>
        </div>
      </form>
    </Form>
  );
}
