import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanySelector } from "@/components/company-selector";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Financial from "@/pages/financial";
import Licenses from "@/pages/licenses";
import Profile from "@/pages/profile";
import BoletoConfig from "@/pages/boleto-config";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import Users from "@/pages/users";
import PermissoesPage from "@/pages/admin/permissoes";
import EmpresasPage from "@/pages/admin/empresas";

// Router with authentication - Reference: blueprint:javascript_log_in_with_replit
function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/clientes" component={Clients} />
          <Route path="/financeiro" component={Financial} />
          <Route path="/licencas" component={Licenses} />
          <Route path="/configuracoes" component={BoletoConfig} />
          <Route path="/perfil" component={Profile} />
          <Route path="/admin/usuarios" component={Users} />
          <Route path="/admin/permissoes" component={PermissoesPage} />
          <Route path="/admin/empresas" component={EmpresasPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthLayout style={style} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Layout with authentication-aware UI - Reference: blueprint:javascript_log_in_with_replit
function AuthLayout({ style }: { style: Record<string, string> }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Invalidate auth cache on mount to ensure fresh data after login redirect
  useEffect(() => {
    // Only invalidate if we might have just logged in (no cached auth data yet)
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users (no sidebar)
  if (!isAuthenticated) {
    return <Router isAuthenticated={false} />;
  }

  // Show app with sidebar for authenticated users
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <CompanySelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router isAuthenticated={true} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
