import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
}

export default function FixUser() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: companies = [], isLoading: loadingCompanies } = useQuery<Company[]>({
    queryKey: ['/api/admin/all-companies'],
  });

  const makeAdminMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/fix-user-data', { action: 'make-admin' });
    },
    onSuccess: () => {
      toast({
        title: "✅ Sucesso!",
        description: "Você agora é administrador",
      });
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao promover usuário",
        variant: "destructive",
      });
    },
  });

  const assignCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiRequest('POST', '/api/admin/fix-user-data', { action: 'assign-company', companyId });
    },
    onSuccess: () => {
      toast({
        title: "✅ Sucesso!",
        description: "Você foi associado à empresa",
      });
      setStep(3);
    },
    onError: (error: any) => {
      // Se já está associado, pula para o próximo passo
      if (error.message?.includes('already assigned')) {
        toast({
          title: "Aviso",
          description: "Você já está associado a esta empresa",
        });
        setStep(3);
      } else {
        toast({
          title: "Erro",
          description: error.message || "Falha ao associar empresa",
          variant: "destructive",
        });
      }
    },
  });

  const setActiveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiRequest('POST', '/api/admin/fix-user-data', { action: 'set-active-company', companyId });
    },
    onSuccess: () => {
      toast({
        title: "✅ Tudo Pronto!",
        description: "Seus dados foram corrigidos. Recarregue a página.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao definir empresa ativa",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔧 Corrigir Dados do Usuário</CardTitle>
          <CardDescription>
            Siga os passos abaixo para corrigir suas permissões e empresas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Passo 1: Tornar Admin */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold">
                  1
                </div>
              )}
              <h3 className="font-semibold">Tornar Administrador</h3>
            </div>
            {step === 1 && (
              <Button
                onClick={() => makeAdminMutation.mutate()}
                disabled={makeAdminMutation.isPending}
                className="w-full"
                data-testid="button-make-admin"
              >
                {makeAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tornar Admin
              </Button>
            )}
          </div>

          {/* Passo 2: Selecionar e Associar Empresa */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {step > 2 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : step === 2 ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold">
                  2
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center text-xs font-bold text-muted-foreground">
                  2
                </div>
              )}
              <h3 className={`font-semibold ${step < 2 ? 'text-muted-foreground' : ''}`}>
                Associar à Empresa
              </h3>
            </div>
            {step === 2 && (
              <div className="space-y-3">
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : companies.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma empresa encontrada. Crie uma empresa primeiro.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger data-testid="select-company">
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => assignCompanyMutation.mutate(selectedCompanyId)}
                      disabled={!selectedCompanyId || assignCompanyMutation.isPending}
                      className="w-full"
                      data-testid="button-assign-company"
                    >
                      {assignCompanyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Associar à Empresa
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Passo 3: Definir Empresa Ativa */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {step === 3 ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold">
                  3
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center text-xs font-bold text-muted-foreground">
                  3
                </div>
              )}
              <h3 className={`font-semibold ${step < 3 ? 'text-muted-foreground' : ''}`}>
                Definir Empresa Ativa
              </h3>
            </div>
            {step === 3 && (
              <Button
                onClick={() => setActiveCompanyMutation.mutate(selectedCompanyId)}
                disabled={setActiveCompanyMutation.isPending}
                className="w-full"
                data-testid="button-set-active-company"
              >
                {setActiveCompanyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Definir como Empresa Ativa
              </Button>
            )}
          </div>

          {step === 3 && setActiveCompanyMutation.isSuccess && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Tudo pronto! Redirecionando para o dashboard...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
