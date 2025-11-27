import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp } from "lucide-react";

export default function AdminAnalytics() {
  const { data: stats = null, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/system-stats"],
  });

  const { data: completionRate = null, isLoading: completionLoading } = useQuery({
    queryKey: ["/api/analytics/completion-rate"],
  });

  const { data: specialtyStats = [], isLoading: specialtyLoading } = useQuery({
    queryKey: ["/api/analytics/statistics-by-specialty"],
  });

  const { data: companyStats = [], isLoading: companyLoading } = useQuery({
    queryKey: ["/api/analytics/statistics-by-company"],
  });

  const isLoading = statsLoading || completionLoading || specialtyLoading || companyLoading;

  const handleExport = (type: string) => {
    console.log(`Exporting ${type}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">Analytics Avancées</h1>
        <p className="text-muted-foreground" data-testid="text-analytics-subtitle">Analyse complète des performances</p>
      </div>

      <Tabs defaultValue="overview" data-testid="tabs-analytics">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="specialty">Par Spécialité</TabsTrigger>
          <TabsTrigger value="company">Par Entreprise</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card data-testid="card-completion-overview">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux de Complétion</CardTitle>
              </CardHeader>
              <CardContent>
                {completionLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="text-completion-percent">
                      {Math.round(completionRate?.completionRate || 0)}%
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid="text-completion-desc">
                      {completionRate?.completedProposals || 0}/{completionRate?.totalProposals || 0} propositions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-defense-overview">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux Soutenances</CardTitle>
              </CardHeader>
              <CardContent>
                {completionLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="text-defense-percent">
                      {Math.round(completionRate?.defenseRate || 0)}%
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid="text-defense-desc">
                      {completionRate?.defensesCompleted || 0} soutenances complétées
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-user-overview">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="text-user-count">
                      {stats?.totalUsers || 0}
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-breakdown">
                      {stats?.studentCount || 0} étudiants
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-system-overview">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Aperçu Système</CardTitle>
                <CardDescription>Statistiques globales du système</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleExport("system")} data-testid="button-export-system">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div data-testid="section-stats">
                      <h4 className="font-semibold mb-2">Propositions</h4>
                      <div className="space-y-1 text-sm">
                        <p data-testid="text-proposals-total">Total: {stats?.totalProposals || 0}</p>
                        <p data-testid="text-proposals-validated">Validées: {stats?.proposalsValidated || 0}</p>
                        <p data-testid="text-proposals-pending">En attente: {stats?.proposalsSubmitted || 0}</p>
                      </div>
                    </div>
                    <div data-testid="section-defenses">
                      <h4 className="font-semibold mb-2">Soutenances</h4>
                      <div className="space-y-1 text-sm">
                        <p data-testid="text-defenses-total">Total: {stats?.totalDefenses || 0}</p>
                        <p data-testid="text-defenses-completed">Complétées: {stats?.defensesCompleted || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specialty Tab */}
        <TabsContent value="specialty" className="space-y-6">
          <Card data-testid="card-specialty-stats">
            <CardHeader>
              <CardTitle>Statistiques par Spécialité</CardTitle>
              <CardDescription>Performance par filière</CardDescription>
            </CardHeader>
            <CardContent>
              {specialtyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  {Array.isArray(specialtyStats) && specialtyStats.length > 0 ? (
                    specialtyStats.map((spec: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4" data-testid={`card-specialty-${idx}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold" data-testid={`text-specialty-name-${idx}`}>{spec.specialtyName}</h4>
                          <span className="text-xs text-muted-foreground" data-testid={`text-specialty-rate-${idx}`}>
                            {Math.round(spec.completionRate)}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p data-testid={`text-specialty-total-${idx}`}>Propositions: {spec.totalProposals}</p>
                          <p data-testid={`text-specialty-avg-score-${idx}`}>Note moyenne: {spec.averageScore.toFixed(1)}/20</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground" data-testid="text-no-specialty-data">Aucune donnée disponible</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card data-testid="card-company-stats">
            <CardHeader>
              <CardTitle>Statistiques par Entreprise</CardTitle>
              <CardDescription>Performance par partenaire</CardDescription>
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  {Array.isArray(companyStats) && companyStats.length > 0 ? (
                    companyStats.map((comp: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4" data-testid={`card-company-${idx}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold" data-testid={`text-company-name-${idx}`}>{comp.companyName}</h4>
                          <span className="text-xs text-muted-foreground" data-testid={`text-company-rate-${idx}`}>
                            {Math.round(comp.completionRate)}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p data-testid={`text-company-total-${idx}`}>Projets: {comp.totalProposals}</p>
                          <p data-testid={`text-company-avg-score-${idx}`}>Note moyenne: {comp.averageScore.toFixed(1)}/20</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground" data-testid="text-no-company-data">Aucune donnée disponible</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
