import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Building2, UserCircle, Mail, X, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Company, Role } from "@shared/schema";

type UserWithDetails = User & { 
  companies: Company[];
  roles: Role[];
};

export default function Users() {
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithDetails[]>({
    queryKey: ["/api/users"],
  });
  
  console.log("[Users Page] Users data:", users);
  console.log("[Users Page] Users length:", users?.length);
  if (users && users.length > 0) {
    console.log("[Users Page] First user companies:", users[0].companies);
  }

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: allRoles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const assignCompanyMutation = useMutation({
    mutationFn: async (data: { userId: string; companyId: string }) => {
      return apiRequest("POST", "/api/user/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCompanyDialog(false);
      setSelectedUserId(null);
      setSelectedCompanyId("");
      toast({
        title: "Associação criada",
        description: "Usuário associado à empresa com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível associar o usuário à empresa.",
        variant: "destructive",
      });
    },
  });

  const removeCompanyMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId: string }) => {
      return apiRequest("DELETE", `/api/user/companies/${userId}/${companyId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Associação removida",
        description: "Usuário desassociado da empresa.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a associação.",
        variant: "destructive",
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return apiRequest("POST", `/api/users/${userId}/roles`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowRoleDialog(false);
      setSelectedUserId(null);
      setSelectedRoleId("");
      toast({
        title: "Role atribuído",
        description: "Role atribuído ao usuário com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atribuir o role.",
        variant: "destructive",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return apiRequest("DELETE", `/api/users/${userId}/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role removido",
        description: "Role removido do usuário.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o role.",
        variant: "destructive",
      });
    },
  });

  const handleOpenCompanyDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedCompanyId("");
    setShowCompanyDialog(true);
  };

  const handleOpenRoleDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedRoleId("");
    setShowRoleDialog(true);
  };

  const handleAssignCompany = () => {
    if (!selectedUserId || !selectedCompanyId) {
      toast({
        title: "Erro",
        description: "Selecione uma empresa.",
        variant: "destructive",
      });
      return;
    }

    assignCompanyMutation.mutate({
      userId: selectedUserId,
      companyId: selectedCompanyId,
    });
  };

  const handleAssignRole = () => {
    if (!selectedUserId || !selectedRoleId) {
      toast({
        title: "Erro",
        description: "Selecione um role.",
        variant: "destructive",
      });
      return;
    }

    assignRoleMutation.mutate({
      userId: selectedUserId,
      roleId: selectedRoleId,
    });
  };

  const handleRemoveCompany = (userId: string, companyId: string) => {
    removeCompanyMutation.mutate({ userId, companyId });
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    removeRoleMutation.mutate({ userId, roleId });
  };

  const getAvailableCompanies = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.companies) return companies;
    
    const userCompanyIds = user.companies.map(c => c.id);
    return companies.filter(c => !userCompanyIds.includes(c.id));
  };

  const getAvailableRoles = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.roles) return allRoles;
    
    const userRoleIds = user.roles.map(r => r.id);
    return allRoles.filter(r => !userRoleIds.includes(r.id));
  };

  if (usersLoading || companiesLoading || rolesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-users">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, empresas e permissões
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {user.firstName} {user.lastName}
                      <Badge variant="outline" data-testid={`badge-user-role-${user.id}`}>
                        {user.role}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRoleDialog(user.id)}
                    data-testid={`button-assign-role-${user.id}`}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Roles
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenCompanyDialog(user.id)}
                    data-testid={`button-assign-company-${user.id}`}
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Empresas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Companies Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Empresas Associadas:
                </div>
                {!user.companies || user.companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-6" data-testid={`text-no-companies-${user.id}`}>
                    Nenhuma empresa associada
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {user.companies.map((company) => (
                      <Badge
                        key={company.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                        data-testid={`badge-company-${user.id}-${company.id}`}
                      >
                        {company.name}
                        <button
                          onClick={() => handleRemoveCompany(user.id, company.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          data-testid={`button-remove-company-${user.id}-${company.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Roles/Permissões:
                </div>
                {!user.roles || user.roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-6" data-testid={`text-no-roles-${user.id}`}>
                    Nenhum role atribuído
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {user.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant="outline"
                        className="flex items-center gap-1"
                        data-testid={`badge-role-${user.id}-${role.id}`}
                      >
                        {role.name}
                        <button
                          onClick={() => handleRemoveRole(user.id, role.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          data-testid={`button-remove-role-${user.id}-${role.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent data-testid="dialog-assign-company">
          <DialogHeader>
            <DialogTitle>Associar Usuário à Empresa</DialogTitle>
            <DialogDescription>
              Selecione uma empresa para associar ao usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger data-testid="select-company">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUserId && getAvailableCompanies(selectedUserId).map((company) => (
                    <SelectItem
                      key={company.id}
                      value={company.id}
                      data-testid={`select-option-company-${company.id}`}
                    >
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompanyDialog(false)}
              data-testid="button-cancel-assign-company"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignCompany}
              disabled={assignCompanyMutation.isPending || !selectedCompanyId}
              data-testid="button-confirm-assign-company"
            >
              {assignCompanyMutation.isPending ? "Associando..." : "Associar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent data-testid="dialog-assign-role">
          <DialogHeader>
            <DialogTitle>Atribuir Role ao Usuário</DialogTitle>
            <DialogDescription>
              Selecione um role para atribuir ao usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Selecione um role" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUserId && getAvailableRoles(selectedUserId).map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      data-testid={`select-option-role-${role.id}`}
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              data-testid="button-cancel-assign-role"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending || !selectedRoleId}
              data-testid="button-confirm-assign-role"
            >
              {assignRoleMutation.isPending ? "Atribuindo..." : "Atribuir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
