import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format, addMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, AlertCircle, User } from "lucide-react";

interface StudentPFE {
  id: string;
  studentId: string;
  studentName: string;
  proposalTitle: string;
  proposalType: string;
  startDate: string;
  expectedEndDate: string;
  status: string;
  progressPercentage: number;
  milestones: {
    proposalApproved: boolean;
    proposalApprovedDate?: string;
    midtermSubmitted: boolean;
    midtermDate?: string;
    finalSubmitted: boolean;
    finalDate?: string;
    defenseScheduled: boolean;
    defenseDate?: string;
  };
}

export default function PFEDurationTimeline() {
  const { data: studentPFEs = [], isLoading } = useQuery<StudentPFE[], any, StudentPFE[]>({
    queryKey: ["/api/teacher/pfe-timeline"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/teacher/pfe-timeline");
      return Array.isArray(response) ? response : [];
    },
  });

  const getMilestoneStatus = (milestone: boolean | undefined) => {
    return milestone ? "completed" : "pending";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case "at_risk":
        return <Badge className="bg-red-100 text-red-800">À risque</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-pfe-timeline-title">
          Chronologie PFE - Suivi Étudiants
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-pfe-timeline-subtitle">
          Suivez la progression des PFE de vos étudiants (6 mois)
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (studentPFEs as StudentPFE[]).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Aucun étudiant assigné pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(studentPFEs as StudentPFE[]).map((pfe: StudentPFE) => {
            const startDate = new Date(pfe.startDate);
            const endDate = new Date(pfe.expectedEndDate);
            const today = new Date();
            const totalDays = differenceInDays(endDate, startDate);
            const elapsedDays = Math.max(0, differenceInDays(today, startDate));
            const remainingDays = Math.max(0, differenceInDays(endDate, today));
            const actualProgress = Math.min(100, (elapsedDays / totalDays) * 100);

            return (
              <Card key={pfe.id} className="hover-elevate" data-testid={`card-pfe-${pfe.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{pfe.studentName}</CardTitle>
                        {getStatusBadge(pfe.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{pfe.proposalTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">Type: {pfe.proposalType}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Duration info */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs font-medium">Début</p>
                      <p className="font-medium" data-testid={`text-start-date-${pfe.id}`}>
                        {format(startDate, "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs font-medium">Fin Prévue</p>
                      <p className="font-medium" data-testid={`text-end-date-${pfe.id}`}>
                        {format(endDate, "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs font-medium">Jours Restants</p>
                      <p className={`font-medium ${remainingDays < 30 ? "text-red-600" : ""}`} data-testid={`text-remaining-${pfe.id}`}>
                        {remainingDays} jours
                      </p>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progression Temporelle</span>
                      <span className="text-sm font-medium" data-testid={`text-progress-${pfe.id}`}>
                        {Math.round(actualProgress)}%
                      </span>
                    </div>
                    <Progress value={actualProgress} className="h-2" data-testid={`progress-${pfe.id}`} />
                  </div>

                  {/* Milestones */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Étapes Clés</p>
                    <div className="space-y-2">
                      {/* Proposal milestone */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`milestone-proposal-${pfe.id}`}>
                        <div className="flex items-center gap-2">
                          {pfe.milestones.proposalApproved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Proposition Validée</p>
                            {pfe.milestones.proposalApprovedDate && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pfe.milestones.proposalApprovedDate), "dd/MM/yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={pfe.milestones.proposalApproved ? "default" : "outline"}>
                          {getMilestoneStatus(pfe.milestones.proposalApproved)}
                        </Badge>
                      </div>

                      {/* Midterm milestone */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`milestone-midterm-${pfe.id}`}>
                        <div className="flex items-center gap-2">
                          {pfe.milestones.midtermSubmitted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : actualProgress >= 33 ? (
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Rapport Intermédiaire (Mois 3)</p>
                            {pfe.milestones.midtermDate && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pfe.milestones.midtermDate), "dd/MM/yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={pfe.milestones.midtermSubmitted ? "default" : "outline"}>
                          {getMilestoneStatus(pfe.milestones.midtermSubmitted)}
                        </Badge>
                      </div>

                      {/* Final milestone */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`milestone-final-${pfe.id}`}>
                        <div className="flex items-center gap-2">
                          {pfe.milestones.finalSubmitted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : actualProgress >= 75 ? (
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Rapport Final (Mois 5-6)</p>
                            {pfe.milestones.finalDate && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pfe.milestones.finalDate), "dd/MM/yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={pfe.milestones.finalSubmitted ? "default" : "outline"}>
                          {getMilestoneStatus(pfe.milestones.finalSubmitted)}
                        </Badge>
                      </div>

                      {/* Defense milestone */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`milestone-defense-${pfe.id}`}>
                        <div className="flex items-center gap-2">
                          {pfe.milestones.defenseScheduled ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : remainingDays < 30 ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Soutenance Programmée</p>
                            {pfe.milestones.defenseDate && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pfe.milestones.defenseDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={pfe.milestones.defenseScheduled ? "default" : "outline"}>
                          {getMilestoneStatus(pfe.milestones.defenseScheduled)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* At-risk warning */}
                  {(remainingDays < 30 || !pfe.milestones.midtermSubmitted && actualProgress >= 33) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900">Attention requise</p>
                          <p className="text-xs text-red-800 mt-1">
                            {remainingDays < 30
                              ? `Moins d'un mois restant - La soutenance doit être programmée.`
                              : `Le rapport intermédiaire n'a pas été soumis au moment attendu.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-details-${pfe.id}`}>
                      Voir détails
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-message-${pfe.id}`}>
                      Envoyer message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
