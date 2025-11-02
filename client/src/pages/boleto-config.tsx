import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings } from "lucide-react";
import type { BoletoConfig } from "@shared/schema";

const configSchema = z.object({
  appToken: z.string().min(1, "Token da aplicação é obrigatório"),
  accessToken: z.string().min(1, "Token de acesso é obrigatório"),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function BoletoConfig() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<BoletoConfig | null>({
    queryKey: ["/api/boleto/config"],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      appToken: config?.appToken || "",
      accessToken: config?.accessToken || "",
    },
    values: config ? {
      appToken: config.appToken,
      accessToken: config.accessToken,
    } : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      return apiRequest("POST", "/api/boleto/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boleto/config"] });
      toast({
        title: "Configuração salva",
        description: "As configurações do boleto foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Configuração de Boleto
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure as credenciais da API de geração de boletos
        </p>
      </div>

      <Card data-testid="card-boleto-config">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Credenciais da API</CardTitle>
          </div>
          <CardDescription>
            Insira os tokens fornecidos pela API de boletos para habilitar a impressão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="appToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token da Aplicação (app_token)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Insira o token da aplicação"
                        data-testid="input-app-token"
                      />
                    </FormControl>
                    <FormDescription>
                      Token fornecido pela API para autenticação da aplicação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token de Acesso (access_token)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Insira o token de acesso"
                        data-testid="input-access-token"
                      />
                    </FormControl>
                    <FormDescription>
                      Chave token fornecida pela API para acesso aos recursos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-config"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
