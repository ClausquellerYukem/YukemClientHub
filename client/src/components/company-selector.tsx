import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Settings, AlertTriangle } from "lucide-react";
import type { Company } from "@shared/schema";

export function CompanySelector() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");

  const { data: companies, isLoading, error, dataUpdatedAt } = useQuery<Company[]>({
    queryKey: ["/api/user/companies"],
    retry: 1,
  });

  // Debug logging with full details
  console.log('[CompanySelector] State:', {
    isLoading,
    hasCompanies: !!companies,
    companiesCount: companies?.length || 0,
    companies,
    activeCompanyId: user?.activeCompanyId,
    userId: user?.id,
    userEmail: user?.email,
    error,
    errorDetails: error ? JSON.stringify(error) : null,
    dataUpdatedAt: new Date(dataUpdatedAt).toISOString(),
    timestamp: new Date().toISOString()
  });

  // Additional logging when companies changes
  if (companies !== undefined) {
    console.log('[CompanySelector] Companies data received:', {
      isArray: Array.isArray(companies),
      length: companies?.length,
      data: companies
    });
  }

  // Log errors in detail
  if (error) {
    console.error('[CompanySelector] Error fetching companies:', error);
    console.error('[CompanySelector] Error type:', typeof error);
    console.error('[CompanySelector] Error keys:', error ? Object.keys(error) : 'null');
  }

  const setActiveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiRequest("PATCH", "/api/user/active-company", { companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/monthly-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/boleto/config"] });
      toast({
        title: "Empresa alterada",
        description: "A empresa ativa foi alterada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao alterar empresa",
        variant: "destructive",
      });
    },
  });

  const initialSetupMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest("POST", "/api/admin/initial-setup", { masterPassword: password });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowSetupDialog(false);
      setMasterPassword("");
      toast({
        title: "Configuração concluída!",
        description: data.message || `Você foi associado a ${data.totalCompanies} empresa(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na configuração",
        description: error?.error || "Falha ao realizar configuração inicial",
        variant: "destructive",
      });
      setMasterPassword("");
    },
  });

  const handleSetupConfirm = () => {
    if (!masterPassword.trim()) {
      toast({
        title: "Senha necessária",
        description: "Digite a senha master para continuar",
        variant: "destructive",
      });
      return;
    }
    initialSetupMutation.mutate(masterPassword);
  };

  const handleCompanyChange = (companyId: string) => {
    setActiveCompanyMutation.mutate(companyId);
  };

  // Show loading state
  if (isLoading) {
    console.log('[CompanySelector] Showing loading state');
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground animate-pulse">
        <Building2 className="h-4 w-4" />
        <span className="w-32 h-4 bg-muted-foreground/20 rounded"></span>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error('[CompanySelector] Error loading companies:', error);
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-sm text-destructive">
        <Building2 className="h-4 w-4" />
        <span>Erro ao carregar empresas</span>
      </div>
    );
  }

  // Show "no companies" state with setup button for admins
  if (!companies || companies.length === 0) {
    console.warn('[CompanySelector] No companies found for user');
    
    // If user is admin, show setup button with confirmation dialog
    if (user?.role === 'admin') {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetupDialog(true)}
            disabled={initialSetupMutation.isPending}
            className="gap-2"
            data-testid="button-initial-setup"
          >
            <Settings className="h-4 w-4" />
            <span>
              {initialSetupMutation.isPending ? "Configurando..." : "Configuração Inicial"}
            </span>
          </Button>

          <AlertDialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Configuração Inicial
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta operação irá associar seu usuário a <strong>todas as empresas</strong> cadastradas no sistema.
                  </p>
                  <p className="text-destructive font-medium">
                    ⚠️ Esta é uma operação administrativa crítica!
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="master-password">Senha Master</Label>
                    <Input
                      id="master-password"
                      type="password"
                      placeholder="Digite a senha master"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSetupConfirm();
                        }
                      }}
                      disabled={initialSetupMutation.isPending}
                      data-testid="input-master-password"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => {
                    setMasterPassword("");
                  }}
                  disabled={initialSetupMutation.isPending}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSetupConfirm}
                  disabled={initialSetupMutation.isPending || !masterPassword.trim()}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-setup"
                >
                  {initialSetupMutation.isPending ? "Processando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
    
    // For non-admin users, just show the message
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Nenhuma empresa</span>
      </div>
    );
  }

  // Single company - just show the name
  if (companies.length === 1) {
    console.log('[CompanySelector] Single company mode:', companies[0].name);
    return (
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground"
        data-testid="text-single-company"
      >
        <Building2 className="h-4 w-4" />
        <span>{companies[0].name}</span>
      </div>
    );
  }

  // Multiple companies - show dropdown
  console.log('[CompanySelector] Multiple companies mode:', companies.length, 'companies');

  return (
    <Select
      value={user?.activeCompanyId || undefined}
      onValueChange={handleCompanyChange}
      disabled={setActiveCompanyMutation.isPending}
    >
      <SelectTrigger
        className="w-48"
        data-testid="select-company"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder="Selecione uma empresa" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem
            key={company.id}
            value={company.id}
            data-testid={`option-company-${company.id}`}
          >
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
