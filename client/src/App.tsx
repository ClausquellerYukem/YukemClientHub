import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Financial from "@/pages/financial";
import Licenses from "@/pages/licenses";
import Profile from "@/pages/profile";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

// Router with authentication - Reference: blueprint:javascript_log_in_with_replit
function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

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
          <Route path="/perfil" component={Profile} />
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

  // Show landing page for non-authenticated users (no sidebar)
  if (!isLoading && !isAuthenticated) {
    return <Router />;
  }

  // Show app with sidebar for authenticated users
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
