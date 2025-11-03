import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Company } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";

type CompanyFormData = z.infer<typeof insertCompanySchema>;

export default function EmpresasPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const createForm = useForm<CompanyFormData>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
    },
  });

  const editForm = useForm<CompanyFormData>({
    resolver: zodResolver(insertCompanySchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao criar empresa",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompanyFormData> }) => {
      return apiRequest("PATCH", `/api/companies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });
      setEditingCompany(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao atualizar empresa",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa deletada com sucesso",
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.error || "Falha ao deletar empresa",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: CompanyFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: CompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    }
  };

  const handleDelete = () => {
    if (companyToDelete) {
      deleteMutation.mutate(companyToDelete.id);
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    editForm.reset({ name: company.name });
  };

  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Gerenciamento de Empresas
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie empresas no sistema multi-tenant
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-company">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
              <DialogDescription>
                Adicione uma nova empresa ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome da Empresa</Label>
                <Input
                  id="create-name"
                  data-testid="input-company-name"
                  {...createForm.register("name")}
                  placeholder="Ex: Acme Corporation"
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Empresa"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="card-companies-list">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Empresas Cadastradas</CardTitle>
          </div>
          <CardDescription>
            Lista de todas as empresas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies && companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(company)}
                          data-testid={`button-edit-${company.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(company)}
                          data-testid={`button-delete-${company.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Empresa</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-company-name"
                {...editForm.register("name")}
                placeholder="Ex: Acme Corporation"
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCompany(null)}
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a empresa "{companyToDelete?.name}"?
              Esta ação não pode ser desfeita e todos os dados associados a esta empresa
              também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover-elevate"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
