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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCog, Trash2 } from "lucide-react";
import type { User, Role } from "@shared/schema";

type UserWithRoles = User & { roles: Role[] };

export default function UsuariosPage() {
  const { toast } = useToast();

  const { data: users, isLoading: loadingUsers } = useQuery<UserWithRoles[]>({
    queryKey: ["/api/users"],
  });

  const { data: allRoles, isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return apiRequest("POST", `/api/users/${userId}/roles`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Role atribuído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao atribuir role",
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
        title: "Sucesso",
        description: "Role removido com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao remover role",
        variant: "destructive",
      });
    },
  });

  const handleAssignRole = (userId: string, roleId: string) => {
    assignRoleMutation.mutate({ userId, roleId });
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    removeRoleMutation.mutate({ userId, roleId });
  };

  if (loadingUsers || loadingRoles) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Gerenciamento de Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Atribua roles e gerencie permissões de acesso dos usuários
        </p>
      </div>

      <Card data-testid="card-users-management">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Usuários e Roles</CardTitle>
          </div>
          <CardDescription>
            Lista de todos os usuários cadastrados e seus roles atribuídos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles Atribuídos</TableHead>
                <TableHead>Adicionar Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell className="font-medium">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : "Sem nome"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant={role.name === "admin" ? "default" : "secondary"}
                            className="gap-1"
                            data-testid={`badge-role-${role.name}`}
                          >
                            {role.name}
                            {!role.isSystem && (
                              <button
                                onClick={() => handleRemoveRole(user.id, role.id)}
                                className="ml-1 hover:text-destructive"
                                data-testid={`button-remove-role-${role.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhum role</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Select
                        onValueChange={(roleId) => handleAssignRole(user.id, roleId)}
                        data-testid={`select-assign-role-${user.id}`}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Selecionar role" />
                        </SelectTrigger>
                        <SelectContent>
                          {allRoles
                            ?.filter((role) => !user.roles.some((ur) => ur.id === role.id))
                            .map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id}
                                data-testid={`option-role-${role.name}`}
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
