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

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/user/companies"],
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

  if (isLoading || !companies || companies.length === 0) {
    return null;
  }

  if (companies.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{companies[0].name}</span>
      </div>
    );
  }

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
