import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
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
      <Route path="/admin" component={() => <UsersManagement />} />
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
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
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
