import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, TrendingUp, Users } from "lucide-react";
import yukemLogo from "@assets/yukem completa sem fundo_1762452903411.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function doLogin() {
    if (!email || !password) {
      if (!email) setEmailError("Informe seu e-mail");
      if (!password) setPasswordError("Informe sua senha");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let message = "Falha ao autenticar";
        try {
          const txt = await res.text();
          const parsed = txt ? JSON.parse(txt) : null;
          if (parsed?.message) message = parsed.message;
        } catch {}
        setEmailError("Email ou senha inválidos");
        setPasswordError("Email ou senha inválidos");
        toast({ title: "Credenciais inválidas", description: message, variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      location.href = "/";
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Não foi possível fazer login", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

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
              <div className="flex items-center gap-2">
                <div className="w-56">
                  <Input placeholder="email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }} />
                  {emailError && (<p className="text-xs text-destructive mt-1" data-testid="error-email">{emailError}</p>)}
                </div>
                <div className="w-40">
                  <Input type="password" placeholder="senha" value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }} />
                  {passwordError && (<p className="text-xs text-destructive mt-1" data-testid="error-password">{passwordError}</p>)}
                </div>
                <Button disabled={loading} onClick={doLogin} data-testid="button-login">{loading ? "Entrando..." : "Login"}</Button>
              </div>
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
              <div className="pt-4" />
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
              <div />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
