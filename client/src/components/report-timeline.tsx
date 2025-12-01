import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReportVersion {
  id: string;
  version: number;
  type: string;
  fileName: string;
  uploadedAt?: string;
  createdAt?: string;
  fileSize?: number;
  plagiarismScore?: number;
  plagiarismAnalyzedAt?: string;
  comments?: string;
}

interface ReportTimelineProps {
  reports: ReportVersion[];
  onDownload?: (reportId: string) => void;
  onView?: (reportId: string) => void;
}

export function ReportTimeline({ reports, onDownload, onView }: ReportTimelineProps) {
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
    return dateB - dateA; // Newest first
  });

  const groupedByType = sortedReports.reduce((acc, report) => {
    if (!acc[report.type]) acc[report.type] = [];
    acc[report.type].push(report);
    return acc;
  }, {} as Record<string, ReportVersion[]>);

  const typeLabels: Record<string, string> = {
    bibliographic: "Rapport Bibliographique",
    midterm: "Rapport Intermédiaire",
    final: "Rapport Final",
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByType).map(([type, typeReports]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {typeLabels[type] || type}
            <Badge variant="outline">{typeReports.length} version(s)</Badge>
          </h3>

          {/* Timeline */}
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/20" />

            {/* Timeline items */}
            {typeReports.map((report, index) => {
              const uploadDate = new Date(report.uploadedAt || report.createdAt || Date.now());
              const isPlagiarismDetected = report.plagiarismScore && report.plagiarismScore > 20;
              const hasPlagiarismAnalysis = report.plagiarismScore !== undefined;

              return (
                <div key={report.id} className="relative" data-testid={`timeline-item-${report.id}`}>
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-3 w-5 h-5 rounded-full border-4 border-white ${
                      isPlagiarismDetected ? "bg-red-500" : hasPlagiarismAnalysis ? "bg-green-500" : "bg-blue-500"
                    }`}
                  />

                  {/* Card */}
                  <Card className="hover-elevate">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">v{report.version}</CardTitle>
                            {index === 0 && <Badge variant="default">Dernière</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(uploadDate, "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {onView && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onView(report.id)}
                              data-testid={`button-view-report-${report.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {onDownload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownload(report.id)}
                              data-testid={`button-download-report-${report.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* File info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Fichier</p>
                          <p className="font-medium truncate" data-testid={`text-filename-${report.id}`}>
                            {report.fileName}
                          </p>
                        </div>
                        {report.fileSize && (
                          <div>
                            <p className="text-muted-foreground">Taille</p>
                            <p className="font-medium" data-testid={`text-filesize-${report.id}`}>
                              {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Plagiarism info */}
                      {hasPlagiarismAnalysis && (
                        <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isPlagiarismDetected ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-sm font-medium">Analyse Plagiat</span>
                            </div>
                            <Badge variant={isPlagiarismDetected ? "destructive" : "default"}>
                              {report.plagiarismScore}%
                            </Badge>
                          </div>
                          {report.plagiarismAnalyzedAt && (
                            <p className="text-xs text-muted-foreground">
                              Analysé le {format(new Date(report.plagiarismAnalyzedAt), "dd/MM/yyyy HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      {report.comments && (
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Commentaires</p>
                          <p className="text-sm" data-testid={`text-comments-${report.id}`}>
                            {report.comments}
                          </p>
                        </div>
                      )}

                      {/* Version diff hint */}
                      {index > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Changements depuis la version précédente •{" "}
                            <a href="#" className="text-primary hover:underline">
                              Voir les différences
                            </a>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {sortedReports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Aucun rapport uploadé pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
