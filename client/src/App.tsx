import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ProposalForm from "@/pages/proposal-form";
import ProposalsList from "@/pages/proposals-list";
import ReportsPage from "@/pages/reports";
import DefensesPage from "@/pages/defenses";
import UsersManagement from "@/pages/users-management";
import type { LoginCredentials, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch specialties for the proposal form
  const { data: specialties = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/specialties"],
    enabled: !!currentUser,
  });

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const response: any = await apiRequest("POST", "/api/auth/login", credentials);
      setCurrentUser(response.user);
      setLocation("/dashboard");
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.firstName} !`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setCurrentUser(null);
      queryClient.clear();
      setLocation("/");
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check if user is authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "20rem",
        "--sidebar-width-icon": "4rem",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-full">
        <AppSidebar user={{
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          role: currentUser.role,
          photoUrl: currentUser.photoUrl || undefined,
        }} onLogout={handleLogout} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bienvenue, {currentUser.firstName}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            <Switch>
              <Route path="/" component={() => <Dashboard user={currentUser} />} />
              <Route path="/dashboard" component={() => <Dashboard user={currentUser} />} />
              <Route path="/my-proposal" component={() => <ProposalForm specialties={specialties} />} />
              <Route path="/proposals" component={() => <ProposalsList />} />
              <Route path="/my-reports" component={() => <ReportsPage />} />
              <Route path="/defenses" component={() => <DefensesPage />} />
              <Route path="/users" component={() => <UsersManagement />} />
              <Route path="/supervisions" component={() => <Dashboard user={currentUser} />} />
              <Route path="/jury-defenses" component={() => <DefensesPage />} />
              <Route path="/assignments" component={() => <ProposalsList />} />
              <Route path="/management" component={() => <Dashboard user={currentUser} />} />
              <Route path="/admin" component={() => <UsersManagement />} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
