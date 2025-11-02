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
import { Settings, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BoletoConfig, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const configSchema = z.object({
  appToken: z.string().min(1, "Token da aplicação é obrigatório").refine((val) => !val.includes('*'), {
    message: "Insira um token válido, não um valor mascarado",
  }),
  accessToken: z.string().min(1, "Token de acesso é obrigatório").refine((val) => !val.includes('*'), {
    message: "Insira um token válido, não um valor mascarado",
  }),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function BoletoConfig() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: config, isLoading } = useQuery<BoletoConfig | null>({
    queryKey: ["/api/boleto/config"],
  });

  const isAdmin = user?.role === "admin";

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      appToken: "",
      accessToken: "",
    },
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
    onError: (error: any) => {
      const errorMessage = error?.error || "Não foi possível salvar as configurações.";
      toast({
        title: "Erro",
        description: errorMessage,
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
            {config && (
              <span className="block mt-2 text-xs">
                ✓ Configuração existente: {config.appToken}
              </span>
            )}
            {config && (
              <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠ Preencha os campos abaixo apenas se desejar atualizar as credenciais
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <Alert data-testid="alert-not-admin">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Apenas administradores podem alterar as configurações de boleto. 
                Entre em contato com um administrador se precisar atualizar as credenciais.
              </AlertDescription>
            </Alert>
          )}
          
          {isAdmin && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
