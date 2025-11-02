import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Mail, User as UserIcon } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-profile-title">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <Card data-testid="card-profile">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Dados da sua conta conectada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20" data-testid="avatar-user">
              <AvatarImage 
                src={user.profileImageUrl || undefined} 
                alt={user.firstName || user.email || "User"} 
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold" data-testid="text-user-name">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Usuário"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Membro desde {new Date(user.createdAt || Date.now()).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nome</p>
                <p className="text-sm text-muted-foreground" data-testid="text-full-name">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user.email || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-actions">
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
          <CardDescription>
            Gerencie sua sessão e acesso à plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
