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
import { Building2 } from "lucide-react";
import type { Company } from "@shared/schema";

export function CompanySelector() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: companies, isLoading, error } = useQuery<Company[]>({
    queryKey: ["/api/user/companies"],
  });

  // Debug logging
  console.log('[CompanySelector] State:', {
    isLoading,
    hasCompanies: !!companies,
    companiesCount: companies?.length || 0,
    companies,
    activeCompanyId: user?.activeCompanyId,
    error
  });

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

  // Show "no companies" state
  if (!companies || companies.length === 0) {
    console.warn('[CompanySelector] No companies found for user');
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
