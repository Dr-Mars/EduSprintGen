import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import DefenseSchedulingPage from "@/pages/defense-scheduling";
import JuryManagementPage from "@/pages/jury-management";
import DefenseEvaluationPage from "@/pages/defense-evaluation";
import DefenseResultsPage from "@/pages/defense-results";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAnalytics from "@/pages/admin-analytics";
import NotificationsPage from "@/pages/notifications";
import AdminSettings from "@/pages/admin-settings";
import AdminUsers from "@/pages/admin-users";
import AdminArchives from "@/pages/admin-archives";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import { useQuery } from "@tanstack/react-query";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route path="/dashboard" component={() => <Dashboard />} />
      <Route path="/my-proposal" component={() => <ProposalForm specialties={[]} />} />
      <Route path="/proposals" component={() => <ProposalsList />} />
      <Route path="/my-reports" component={() => <ReportsPage />} />
      <Route path="/defenses" component={() => <DefensesPage />} />
      <Route path="/defense-scheduling" component={() => <DefenseSchedulingPage />} />
      <Route path="/jury-management" component={() => <JuryManagementPage />} />
      <Route path="/defense-evaluation/:defenseId" component={() => <DefenseEvaluationPage />} />
      <Route path="/defense-results/:defenseId" component={() => <DefenseResultsPage />} />
      <Route path="/users" component={() => <UsersManagement />} />
      <Route path="/supervisions" component={() => <Dashboard />} />
      <Route path="/jury-defenses" component={() => <DefensesPage />} />
      <Route path="/assignments" component={() => <ProposalsList />} />
      <Route path="/management" component={() => <Dashboard />} />
      <Route path="/admin" component={() => <AdminDashboard />} />
      <Route path="/admin-dashboard" component={() => <AdminDashboard />} />
      <Route path="/admin-analytics" component={() => <AdminAnalytics />} />
      <Route path="/notifications" component={() => <NotificationsPage />} />
      <Route path="/admin-settings" component={() => <AdminSettings />} />
      <Route path="/admin-users" component={() => <AdminUsers />} />
      <Route path="/admin-archives" component={() => <AdminArchives />} />
      <Route path="/forgot-password" component={() => <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" component={() => <ResetPasswordPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        setUser(response);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      setUser(response);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed - session cleared", error);
    }
  };

  if (isAuthenticated === null) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginPage onLogin={handleLogin} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar user={user} onLogout={handleLogout} />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
