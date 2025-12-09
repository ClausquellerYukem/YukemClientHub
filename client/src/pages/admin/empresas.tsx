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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Pencil, Trash2, FileText, MapPin, DollarSign } from "lucide-react";
import type { Company } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const companyFormSchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  cityRegistration: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZipCode: z.string().optional(),
  monthlyValue: z.string().optional(),
  revenueSharePercentage: z.string().optional(),
  freeLicenseQuota: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

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
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      stateRegistration: "",
      cityRegistration: "",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressDistrict: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
      monthlyValue: "",
      revenueSharePercentage: "",
      freeLicenseQuota: "0",
    },
  });

  const editForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
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
    editForm.reset({
      name: company.name,
      cnpj: company.cnpj || "",
      stateRegistration: company.stateRegistration || "",
      cityRegistration: company.cityRegistration || "",
      addressStreet: company.addressStreet || "",
      addressNumber: company.addressNumber || "",
      addressComplement: company.addressComplement || "",
      addressDistrict: company.addressDistrict || "",
      addressCity: company.addressCity || "",
      addressState: company.addressState || "",
      addressZipCode: company.addressZipCode || "",
      monthlyValue: company.monthlyValue || "",
      revenueSharePercentage: company.revenueSharePercentage || "",
      freeLicenseQuota: company.freeLicenseQuota || "0",
    });
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
            Cadastro completo para geração de nota fiscal e contrato
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-company">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha os dados completos para geração de nota fiscal e contrato
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <Tabs defaultValue="cadastrais" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cadastrais" data-testid="tab-cadastrais">
                    <FileText className="h-4 w-4 mr-2" />
                    Dados Cadastrais
                  </TabsTrigger>
                  <TabsTrigger value="endereco" data-testid="tab-endereco">
                    <MapPin className="h-4 w-4 mr-2" />
                    Endereço
                  </TabsTrigger>
                  <TabsTrigger value="financeiro" data-testid="tab-financeiro">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Financeiro
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cadastrais" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nome da Empresa *</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="create-cnpj">CNPJ</Label>
                    <Input
                      id="create-cnpj"
                      data-testid="input-cnpj"
                      {...createForm.register("cnpj")}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-state-reg">Inscrição Estadual</Label>
                      <Input
                        id="create-state-reg"
                        data-testid="input-state-registration"
                        {...createForm.register("stateRegistration")}
                        placeholder="000.000.000.000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-city-reg">Inscrição Municipal</Label>
                      <Input
                        id="create-city-reg"
                        data-testid="input-city-registration"
                        {...createForm.register("cityRegistration")}
                        placeholder="000000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="create-street">Logradouro</Label>
                      <Input
                        id="create-street"
                        data-testid="input-address-street"
                        {...createForm.register("addressStreet")}
                        placeholder="Rua, Avenida, etc"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-number">Número</Label>
                      <Input
                        id="create-number"
                        data-testid="input-address-number"
                        {...createForm.register("addressNumber")}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-complement">Complemento</Label>
                    <Input
                      id="create-complement"
                      data-testid="input-address-complement"
                      {...createForm.register("addressComplement")}
                      placeholder="Sala, Andar, etc"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-district">Bairro</Label>
                      <Input
                        id="create-district"
                        data-testid="input-address-district"
                        {...createForm.register("addressDistrict")}
                        placeholder="Centro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-city">Cidade</Label>
                      <Input
                        id="create-city"
                        data-testid="input-address-city"
                        {...createForm.register("addressCity")}
                        placeholder="São Paulo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-state">Estado</Label>
                      <Input
                        id="create-state"
                        data-testid="input-address-state"
                        {...createForm.register("addressState")}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-zipcode">CEP</Label>
                      <Input
                        id="create-zipcode"
                        data-testid="input-address-zipcode"
                        {...createForm.register("addressZipCode")}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financeiro" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-monthly-value">Valor Mensal (R$)</Label>
                    <Input
                      id="create-monthly-value"
                      data-testid="input-monthly-value"
                      {...createForm.register("monthlyValue")}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
                    <p className="text-sm text-muted-foreground">
                      Valor mensal cobrado pela empresa
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-revenue-share">Percentual de Repasse (%)</Label>
                    <Input
                      id="create-revenue-share"
                      data-testid="input-revenue-share"
                      {...createForm.register("revenueSharePercentage")}
                      placeholder="40.00"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentual aplicado sobre a mensalidade do cliente (ex: 40%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-free-quota">Licenças Gratuitas</Label>
                    <Input
                      id="create-free-quota"
                      data-testid="input-free-license-quota"
                      {...createForm.register("freeLicenseQuota")}
                      placeholder="10"
                      type="number"
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground">
                      Quantidade de licenças gratuitas. Após esse limite, será cobrado o percentual de repasse sobre a mensalidade do cliente.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <h4 className="font-medium text-sm">Exemplo de Cálculo:</h4>
                    <p className="text-sm text-muted-foreground">
                      • Licenças gratuitas: 10<br />
                      • Cliente cobra R$ 100/mês<br />
                      • Percentual de repasse: 40%<br />
                      • Licenças 1-10: R$ 0 (gratuitas)<br />
                      • Licença 11+: R$ 40 cada (40% de R$ 100)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

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
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Licenças Grátis</TableHead>
                <TableHead>Repasse</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies && companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj || "-"}</TableCell>
                    <TableCell>{company.addressCity || "-"}</TableCell>
                    <TableCell>{company.freeLicenseQuota || "0"}</TableCell>
                    <TableCell>{company.revenueSharePercentage ? `${company.revenueSharePercentage}%` : "-"}</TableCell>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <Tabs defaultValue="cadastrais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cadastrais">
                  <FileText className="h-4 w-4 mr-2" />
                  Dados Cadastrais
                </TabsTrigger>
                <TabsTrigger value="endereco">
                  <MapPin className="h-4 w-4 mr-2" />
                  Endereço
                </TabsTrigger>
                <TabsTrigger value="financeiro">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financeiro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cadastrais" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome da Empresa *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input
                    id="edit-cnpj"
                    data-testid="input-edit-cnpj"
                    {...editForm.register("cnpj")}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-state-reg">Inscrição Estadual</Label>
                    <Input
                      id="edit-state-reg"
                      {...editForm.register("stateRegistration")}
                      placeholder="000.000.000.000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-city-reg">Inscrição Municipal</Label>
                    <Input
                      id="edit-city-reg"
                      {...editForm.register("cityRegistration")}
                      placeholder="000000"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-street">Logradouro</Label>
                    <Input
                      id="edit-street"
                      {...editForm.register("addressStreet")}
                      placeholder="Rua, Avenida, etc"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-number">Número</Label>
                    <Input
                      id="edit-number"
                      {...editForm.register("addressNumber")}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    {...editForm.register("addressComplement")}
                    placeholder="Sala, Andar, etc"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-district">Bairro</Label>
                    <Input
                      id="edit-district"
                      {...editForm.register("addressDistrict")}
                      placeholder="Centro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-city">Cidade</Label>
                    <Input
                      id="edit-city"
                      {...editForm.register("addressCity")}
                      placeholder="São Paulo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">Estado</Label>
                    <Input
                      id="edit-state"
                      {...editForm.register("addressState")}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-zipcode">CEP</Label>
                    <Input
                      id="edit-zipcode"
                      {...editForm.register("addressZipCode")}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-monthly-value">Valor Mensal (R$)</Label>
                  <Input
                    id="edit-monthly-value"
                    {...editForm.register("monthlyValue")}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    Valor mensal cobrado pela empresa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-revenue-share">Percentual de Repasse (%)</Label>
                  <Input
                    id="edit-revenue-share"
                    {...editForm.register("revenueSharePercentage")}
                    placeholder="40.00"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">
                    Percentual aplicado sobre a mensalidade do cliente (ex: 40%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-free-quota">Licenças Gratuitas</Label>
                  <Input
                    id="edit-free-quota"
                    {...editForm.register("freeLicenseQuota")}
                    placeholder="10"
                    type="number"
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Quantidade de licenças gratuitas. Após esse limite, será cobrado o percentual de repasse.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

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
