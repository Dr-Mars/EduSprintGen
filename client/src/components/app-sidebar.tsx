import { Home, FileText, ClipboardList, Calendar, Users, GraduationCap, Settings, LogOut, BarChart3, Bell, Archive, Lock } from "lucide-react";
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
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    photoUrl?: string;
  };
  onLogout?: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  const menuItemsByRole = {
    student: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Ma proposition PFE", url: "/my-proposal", icon: FileText },
      { title: "Mes rapports", url: "/my-reports", icon: ClipboardList },
      { title: "Ma soutenance", url: "/my-defense", icon: Calendar },
    ],
    academic_supervisor: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Mes encadrements", url: "/supervisions", icon: GraduationCap },
      { title: "Mes soutenances", url: "/jury-defenses", icon: Calendar },
    ],
    coordinator: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Propositions PFE", url: "/proposals", icon: FileText },
      { title: "Affectations", url: "/assignments", icon: Users },
      { title: "Soutenances", url: "/defenses", icon: Calendar },
    ],
    manager: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Propositions PFE", url: "/proposals", icon: FileText },
      { title: "Soutenances", url: "/defenses", icon: Calendar },
      { title: "Gestion", url: "/management", icon: Settings },
    ],
    administrator: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Propositions PFE", url: "/proposals", icon: FileText },
      { title: "Utilisateurs", url: "/users", icon: Users },
      { title: "Soutenances", url: "/defenses", icon: Calendar },
      { title: "Admin Dashboard", url: "/admin-dashboard", icon: BarChart3 },
      { title: "Analytics", url: "/admin-analytics", icon: BarChart3 },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Utilisateurs Admin", url: "/admin-users", icon: Lock },
      { title: "Paramètres", url: "/admin-settings", icon: Settings },
      { title: "Archives", url: "/admin-archives", icon: Archive },
    ],
    company_supervisor: [
      { title: "Tableau de bord", url: "/dashboard", icon: Home },
      { title: "Mes encadrements", url: "/supervisions", icon: GraduationCap },
    ],
  };

  const menuItems = user ? menuItemsByRole[user.role as keyof typeof menuItemsByRole] || menuItemsByRole.student : [];

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "U";
    const last = lastName?.charAt(0) || "S";
    return `${first}${last}`.toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: "Étudiant",
      academic_supervisor: "Encadrant académique",
      company_supervisor: "Encadrant entreprise",
      coordinator: "Coordinateur",
      manager: "Gestionnaire",
      administrator: "Administrateur",
    };
    return labels[role] || role;
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-sidebar-foreground">Plateforme PFE</span>
            <span className="text-xs text-muted-foreground">Gestion des projets</span>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-link-${item.url.replace('/', '')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <>
          <Separator />
          <SidebarFooter className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.photoUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{getRoleLabel(user.role)}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
