import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Shield, TrendingUp, Users } from "lucide-react";
import yukemLogo from "@assets/yukem completa sem fundo_1762452903411.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        
        <div className="relative">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <img 
                src={yukemLogo} 
                alt="Yukem" 
                className="h-10 w-auto"
                data-testid="img-logo-header"
              />
              <Button asChild data-testid="button-login">
                <a href="/api/login">Login</a>
              </Button>
            </div>
          </header>

          <section className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">
                Plataforma de Gestão de Clientes
                <span className="block text-primary mt-2">Simples e Eficiente</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Gerencie clientes, licenças e faturamento em um só lugar. 
                Controle total sobre o seu negócio com uma interface intuitiva e moderna.
              </p>
              <div className="pt-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">
                    Começar Agora
                  </a>
                </Button>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Gestão de Clientes</h3>
                <p className="text-muted-foreground">
                  Cadastre e gerencie seus clientes com informações completas e organizadas.
                </p>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Controle de Licenças</h3>
                <p className="text-muted-foreground">
                  Ative e desative licenças com facilidade, mantendo controle total sobre os acessos.
                </p>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Gestão Financeira</h3>
                <p className="text-muted-foreground">
                  Acompanhe faturas, pagamentos e receitas em tempo real com dashboards intuitivos.
                </p>
              </Card>
            </div>
          </section>

          <section className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Pronto para começar?</h2>
              <p className="text-xl text-muted-foreground">
                Faça login para acessar a plataforma e gerenciar seus clientes.
              </p>
              <Button size="lg" asChild data-testid="button-login-footer">
                <a href="/api/login">
                  Fazer Login
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
