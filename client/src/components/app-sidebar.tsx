import { LayoutDashboard, Users, CreditCard, Key, UserCircle, Settings, Shield, UserCog, Building2, BarChart3, Wallet, Boxes, CalendarCheck2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import yukemLogo from "@assets/yukem completa sem fundo_1762452903411.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Financeiro",
    url: "/contas-a-receber",
    icon: CreditCard,
    children: [
      { title: "Contas à receber", url: "/contas-a-receber", icon: CreditCard },
      { title: "Categoria de Lançamentos", url: "/caixa/contas", icon: Wallet },
      { title: "Cadastro de Caixas", url: "/caixa/bases", icon: Boxes },
      { title: "Tipos de Categoria de Lançamento", url: "/caixa/tipos", icon: Wallet },
      { title: "Caixa Sessões", url: "/caixa/sessoes", icon: CalendarCheck2 },
    ],
  },
  {
    title: "Licenças",
    url: "/licencas",
    icon: Key,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

const adminMenuItems = [
  {
    title: "Usuários",
    url: "/admin/usuarios",
    icon: UserCog,
  },
  {
    title: "Permissões",
    url: "/admin/permissoes",
    icon: Shield,
  },
  {
    title: "Empresas",
    url: "/admin/empresas",
    icon: Building2,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-center">
          <img 
            src={yukemLogo} 
            alt="Yukem" 
            className="h-12 w-auto"
            data-testid="img-logo-sidebar"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.children && (
                    <SidebarMenuSub>
                      {item.children.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={location === sub.url}>
                            <Link href={sub.url}>
                              <sub.icon className="h-4 w-4" />
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-admin-${item.title.toLowerCase()}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/perfil"} data-testid="link-perfil">
              <Link href="/perfil">
                <UserCircle className="h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
