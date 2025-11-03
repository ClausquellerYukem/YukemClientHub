import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock } from "lucide-react";
import type { Role, RolePermission } from "@shared/schema";

const RESOURCES = [
  { key: "clients", label: "Clientes" },
  { key: "licenses", label: "Licenças" },
  { key: "invoices", label: "Faturas" },
  { key: "boleto_config", label: "Config. Boleto" },
];

const ACTIONS = [
  { key: "canCreate", label: "Criar", shortLabel: "C" },
  { key: "canRead", label: "Ler", shortLabel: "L" },
  { key: "canUpdate", label: "Editar", shortLabel: "E" },
  { key: "canDelete", label: "Excluir", shortLabel: "X" },
];

export default function PermissoesPage() {
  const { toast } = useToast();

  const { data: roles, isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: permissions, isLoading: loadingPermissions } = useQuery<RolePermission[]>({
    queryKey: ["/api/permissions"],
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      permissionId,
      updates,
    }: {
      permissionId: string;
      updates: Partial<RolePermission>;
    }) => {
      return apiRequest("PUT", `/api/permissions/${permissionId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "Sucesso",
        description: "Permissão atualizada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao atualizar permissão",
        variant: "destructive",
      });
    },
  });

  const handleTogglePermission = (
    roleId: string,
    resource: string,
    action: string,
    currentValue: boolean
  ) => {
    const permission = permissions?.find(
      (p) => p.roleId === roleId && p.resource === resource
    );

    if (permission) {
      updatePermissionMutation.mutate({
        permissionId: permission.id,
        updates: { [action]: !currentValue },
      });
    }
  };

  const getPermissionValue = (roleId: string, resource: string, action: string): boolean => {
    const permission = permissions?.find(
      (p) => p.roleId === roleId && p.resource === resource
    );
    return permission ? (permission as any)[action] || false : false;
  };

  if (loadingRoles || loadingPermissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando permissões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Configuração de Permissões
        </h1>
        <p className="text-muted-foreground mt-1">
          Defina quais operações cada role pode executar em cada recurso
        </p>
      </div>

      {roles?.map((role) => (
        <Card key={role.id} data-testid={`card-role-permissions-${role.name}`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="capitalize">{role.name}</CardTitle>
              {role.isSystem && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <CardDescription>{role.description || "Sem descrição"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  {ACTIONS.map((action) => (
                    <TableHead key={action.key} className="text-center">
                      {action.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {RESOURCES.map((resource) => (
                  <TableRow key={resource.key} data-testid={`row-resource-${resource.key}`}>
                    <TableCell className="font-medium">{resource.label}</TableCell>
                    {ACTIONS.map((action) => {
                      const isChecked = getPermissionValue(role.id, resource.key, action.key);
                      return (
                        <TableCell key={action.key} className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleTogglePermission(role.id, resource.key, action.key, isChecked)
                            }
                            disabled={updatePermissionMutation.isPending}
                            data-testid={`checkbox-${role.name}-${resource.key}-${action.key}`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
