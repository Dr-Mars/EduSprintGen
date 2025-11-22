import { StatCard } from "@/components/stat-card";
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  user?: {
    firstName: string;
    role: string;
  };
  stats?: {
    totalProposals?: number;
    pendingProposals?: number;
    validatedProposals?: number;
    upcomingDefenses?: number;
    mySupervisions?: number;
    totalStudents?: number;
  };
  recentActivity?: Array<{
    id: string;
    title: string;
    type: string;
    status: "draft" | "submitted" | "validated" | "rejected";
    date: string;
  }>;
  isLoading?: boolean;
}

export default function Dashboard({ user, stats = {}, recentActivity = [], isLoading }: DashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const renderStatsByRole = () => {
    if (!user) return null;

    switch (user.role) {
      case "student":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Ma proposition"
              value={stats.totalProposals || 0}
              icon={FileText}
              description="Proposition en cours"
            />
            <StatCard
              title="Rapports déposés"
              value={stats.validatedProposals || 0}
              icon={CheckCircle}
              description="Rapports soumis"
            />
            <StatCard
              title="Soutenance"
              value={stats.upcomingDefenses ? "Planifiée" : "À venir"}
              icon={Calendar}
              description="Prochaine échéance"
            />
            <StatCard
              title="Statut"
              value={stats.pendingProposals ? "En cours" : "Complété"}
              icon={Clock}
              description="État du PFE"
            />
          </div>
        );

      case "academic_supervisor":
      case "company_supervisor":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Encadrements"
              value={stats.mySupervisions || 0}
              icon={Users}
              description="PFE supervisés"
            />
            <StatCard
              title="En attente"
              value={stats.pendingProposals || 0}
              icon={Clock}
              description="Nécessitant attention"
            />
            <StatCard
              title="Soutenances"
              value={stats.upcomingDefenses || 0}
              icon={Calendar}
              description="À venir"
            />
            <StatCard
              title="Validés"
              value={stats.validatedProposals || 0}
              icon={CheckCircle}
              description="PFE terminés"
            />
          </div>
        );

      case "coordinator":
      case "manager":
      case "administrator":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total PFE"
              value={stats.totalProposals || 0}
              icon={FileText}
              description="Propositions actives"
            />
            <StatCard
              title="En attente validation"
              value={stats.pendingProposals || 0}
              icon={AlertCircle}
              description="Nécessitant action"
            />
            <StatCard
              title="Validés"
              value={stats.validatedProposals || 0}
              icon={CheckCircle}
              description="PFE approuvés"
            />
            <StatCard
              title="Soutenances"
              value={stats.upcomingDefenses || 0}
              icon={Calendar}
              description="Planifiées"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
          {getGreeting()}, {user?.firstName || "Utilisateur"} 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité sur la plateforme
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        renderStatsByRole()
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières actions et mises à jour</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.type} • {activity.date}</p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès directs aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.role === "student" && (
              <>
                <Link href="/my-proposal">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-my-proposal">
                    <FileText className="w-4 h-4 mr-2" />
                    Voir ma proposition PFE
                  </Button>
                </Link>
                <Link href="/my-reports">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-my-reports">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Déposer un rapport
                  </Button>
                </Link>
              </>
            )}
            {(user?.role === "coordinator" || user?.role === "manager" || user?.role === "administrator") && (
              <>
                <Link href="/proposals">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-proposals">
                    <FileText className="w-4 h-4 mr-2" />
                    Gérer les propositions
                  </Button>
                </Link>
                <Link href="/defenses">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-defenses">
                    <Calendar className="w-4 h-4 mr-2" />
                    Planifier une soutenance
                  </Button>
                </Link>
              </>
            )}
            {(user?.role === "academic_supervisor" || user?.role === "company_supervisor") && (
              <>
                <Link href="/supervisions">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-supervisions">
                    <Users className="w-4 h-4 mr-2" />
                    Mes encadrements
                  </Button>
                </Link>
                <Link href="/jury-defenses">
                  <Button className="w-full justify-start" variant="outline" data-testid="button-jury-defenses">
                    <Calendar className="w-4 h-4 mr-2" />
                    Mes soutenances jury
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
