import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MENTION_COLORS: { [key: string]: string } = {
  "Excellent": "bg-green-100 text-green-800",
  "Très Bien": "bg-blue-100 text-blue-800",
  "Bien": "bg-cyan-100 text-cyan-800",
  "Assez Bien": "bg-yellow-100 text-yellow-800",
  "Passable": "bg-orange-100 text-orange-800",
  "Non admis": "bg-red-100 text-red-800",
};

export default function DefenseResultsPage() {
  const { defenseId } = useParams();

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/defenses", defenseId, "results"],
    enabled: !!defenseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-lg font-medium">Résultats non trouvés</p>
      </div>
    );
  }

  const { defense, evaluations, juryMembers } = results;
  const isMention = (mention: string) => Object.keys(MENTION_COLORS).includes(mention);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-results-title">
          Résultats de la soutenance
        </h1>
        <p className="text-muted-foreground">Consulter les scores et l'évaluation finale</p>
      </div>

      {defense.status === "completed" ? (
        <>
          {/* FINAL SCORE CARD */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-4xl text-primary">
                {defense.finalScore}/20
              </CardTitle>
              <CardDescription className="text-center">
                <Badge className={`text-lg px-4 py-2 mt-2 ${MENTION_COLORS[defense.mention] || ""}`}>
                  {defense.mention}
                </Badge>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* COMPONENT SCORES */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary mb-2">{defense.reportScore}/20</p>
                <Progress value={(defense.reportScore / 20) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Poids: 30%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Présentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary mb-2">{defense.presentationScore}/20</p>
                <Progress value={(defense.presentationScore / 20) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Poids: 40%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary mb-2">{defense.companyScore}/20</p>
                <Progress value={(defense.companyScore / 20) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Poids: 30%</p>
              </CardContent>
            </Card>
          </div>

          {/* JURY MEMBERS & COMMENTS */}
          <Card>
            <CardHeader>
              <CardTitle>Jury et retours</CardTitle>
              <CardDescription>{juryMembers.length} membres du jury</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {juryMembers.map((member: any) => (
                  <div key={member.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    {evaluations.filter((e: any) => e.juryMemberId === member.id).map((eval: any) => (
                      <p key={eval.id} className="text-sm text-muted-foreground">
                        {eval.comments || "Pas de commentaire"}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI FEEDBACK IF AVAILABLE */}
          {evaluations.some((e: any) => e.criteriaName === "ai_feedback_summary") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Retours de synthèse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {evaluations.find((e: any) => e.criteriaName === "ai_feedback_summary")?.comments}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">La soutenance n'est pas encore complétée</p>
              <p className="text-sm text-muted-foreground mt-1">Statut: {defense.status}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
