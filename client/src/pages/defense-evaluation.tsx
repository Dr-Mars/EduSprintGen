import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CRITERIA = {
  report: [
    { name: "content_quality", label: "Qualité du contenu", max: 8 },
    { name: "technical_depth", label: "Profondeur technique", max: 8 },
    { name: "plagiarism_penalty", label: "Plagiat", max: 4 },
  ],
  presentation: [
    { name: "clarity", label: "Clarté", max: 6 },
    { name: "technical_knowledge", label: "Connaissance technique", max: 7 },
    { name: "qa_handling", label: "Gestion Q&A", max: 7 },
  ],
  company: [
    { name: "professional_competency", label: "Compétence professionnelle", max: 10 },
    { name: "project_contribution", label: "Contribution projet", max: 10 },
  ],
};

export default function DefenseEvaluationPage() {
  const { defenseId } = useParams();
  const { toast } = useToast();
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: defense, isLoading: defenseLoading } = useQuery({
    queryKey: ["/api/defenses", defenseId],
    enabled: !!defenseId,
  });

  const { data: juryMembers, isLoading: juryLoading } = useQuery({
    queryKey: ["/api/defenses", defenseId, "jury"],
    enabled: !!defenseId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const evaluations = [];
      for (const [criteriaName, score] of Object.entries(scores)) {
        evaluations.push({
          criteriaName,
          score,
          comments: comments[criteriaName] || "",
        });
      }

      const myJury = juryMembers?.find((j: any) => j.userId === currentUser?.id);
      await apiRequest("POST", "/api/evaluations", {
        defenseId,
        juryMemberId: myJury?.id,
        evaluations,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defenses", defenseId] });
      toast({ title: "Évaluations soumises", description: "Vos notes ont été enregistrées" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de soumettre",
        variant: "destructive",
      });
    },
  });

  if (defenseLoading || juryLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const calculateComponent = (categoryName: string) => {
    const criteria = CRITERIA[categoryName as keyof typeof CRITERIA] || [];
    let total = 0;
    let max = 0;
    for (const crit of criteria) {
      total += scores[crit.name] || 0;
      max += crit.max;
    }
    return (total / max) * 20;
  };

  const reportScore = calculateComponent("report");
  const presentationScore = calculateComponent("presentation");
  const companyScore = calculateComponent("company");
  const finalScore = (
    reportScore * 0.3 +
    presentationScore * 0.4 +
    companyScore * 0.3
  );

  const allScoresEntered = Object.keys(CRITERIA).every(category => {
    const criteria = CRITERIA[category as keyof typeof CRITERIA];
    return criteria.every(c => scores[c.name] !== undefined && scores[c.name] > 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-evaluation-title">
          Formulaire d'évaluation
        </h1>
        <p className="text-muted-foreground">Saisissez vos notes pour la soutenance</p>
      </div>

      {/* EVALUATION FORM */}
      <div className="space-y-6">
        {Object.entries(CRITERIA).map(([category, criteria]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">
                {category === "report" && "Évaluation du rapport"}
                {category === "presentation" && "Évaluation de la présentation"}
                {category === "company" && "Évaluation entreprise"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criteria.map((crit) => (
                <div key={crit.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{crit.label}</Label>
                    <span className="text-sm font-medium">
                      {scores[crit.name] || 0}/{crit.max}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={crit.max}
                    step={0.5}
                    value={[scores[crit.name] || 0]}
                    onValueChange={(val) => setScores({ ...scores, [crit.name]: val[0] })}
                    data-testid={`slider-${crit.name}`}
                  />
                  <Textarea
                    placeholder="Commentaires..."
                    value={comments[crit.name] || ""}
                    onChange={(e) => setComments({ ...comments, [crit.name]: e.target.value })}
                    className="text-sm"
                    data-testid={`textarea-${crit.name}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SCORE PREVIEW */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Aperçu des scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Rapport</p>
              <p className="text-2xl font-bold text-primary">{reportScore.toFixed(1)}/20</p>
              <p className="text-xs text-muted-foreground">Poids: 30%</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Présentation</p>
              <p className="text-2xl font-bold text-primary">{presentationScore.toFixed(1)}/20</p>
              <p className="text-xs text-muted-foreground">Poids: 40%</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Entreprise</p>
              <p className="text-2xl font-bold text-primary">{companyScore.toFixed(1)}/20</p>
              <p className="text-xs text-muted-foreground">Poids: 30%</p>
            </div>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary">
            <p className="text-sm text-muted-foreground mb-1">Note finale</p>
            <p className="text-4xl font-bold text-primary">{finalScore.toFixed(2)}/20</p>
          </div>
        </CardContent>
      </Card>

      {/* SUBMIT BUTTON */}
      <Button
        onClick={() => submitMutation.mutate()}
        disabled={!allScoresEntered || submitMutation.isPending}
        className="w-full"
        size="lg"
        data-testid="button-submit-evaluation"
      >
        {submitMutation.isPending ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
            Soumission en cours...
          </>
        ) : (
          "Soumettre l'évaluation"
        )}
      </Button>
    </div>
  );
}
