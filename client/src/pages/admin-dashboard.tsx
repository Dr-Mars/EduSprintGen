import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, FileText, CheckCircle, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats = null, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/system-stats"],
  });

  const { data: completionRate = null, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/analytics/completion-rate"],
  });

  const { data: averageScores = null, isLoading: scoresLoading } = useQuery({
    queryKey: ["/api/analytics/average-scores"],
  });

  const { data: topPerformers = [], isLoading: performersLoading } = useQuery({
    queryKey: ["/api/analytics/top-performers"],
  });

  const isLoading = statsLoading || completionLoading || scoresLoading || performersLoading;

  const chartsData = [
    {
      name: "Rapport",
      value: averageScores?.averageReportScore || 0,
    },
    {
      name: "Présentation",
      value: averageScores?.averagePresentationScore || 0,
    },
    {
      name: "Entreprise",
      value: averageScores?.averageCompanyScore || 0,
    },
  ];

  const performersData = topPerformers.slice(0, 5).map((p: any) => ({
    name: p.studentName || "Anonyme",
    score: p.finalScore || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-dashboard-title">Tableau de bord Administrateur</h1>
        <p className="text-muted-foreground" data-testid="text-admin-dashboard-subtitle">Bienvenue sur le tableau de bord de gestion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.studentCount || 0} étudiants</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-proposals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propositions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-proposals">{stats?.totalProposals || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.proposalsValidated || 0} validées</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Complétion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {completionLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold" data-testid="text-completion-rate">{Math.round(completionRate?.completionRate || 0)}%</div>
                <p className="text-xs text-muted-foreground">Taux de complétion</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-average-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold" data-testid="text-average-score">{(averageScores?.averageFinalScore || 0).toFixed(1)}/20</div>
                <p className="text-xs text-muted-foreground">Note finale moyenne</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-score-distribution">
          <CardHeader>
            <CardTitle>Distribution des Scores</CardTitle>
            <CardDescription>Moyenne par composante</CardDescription>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(342, 85%, 53%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-performers">
          <CardHeader>
            <CardTitle>Meilleurs Étudiants</CardTitle>
            <CardDescription>Top 5 performances</CardDescription>
          </CardHeader>
          <CardContent>
            {performersLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(342, 85%, 53%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>Dernières actions système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0" data-testid={`row-activity-${i}`}>
                <div className="space-y-1">
                  <p className="text-sm font-medium" data-testid={`text-activity-type-${i}`}>Activité système</p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-activity-time-${i}`}>Il y a quelques minutes</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
