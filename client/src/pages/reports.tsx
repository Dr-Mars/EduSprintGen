import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Download, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Report {
  id: string;
  type: string;
  version: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  plagiarismScore?: number;
  comments?: string;
}

interface ReportsPageProps {
  reports?: Report[];
  onUpload?: (file: File, type: string) => Promise<void>;
  onDownload?: (id: string) => void;
  isLoading?: boolean;
}

export default function ReportsPage({ reports = [], onUpload, onDownload, isLoading }: ReportsPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !reportType) return;
    
    setIsUploading(true);
    try {
      await onUpload?.(selectedFile, reportType);
      setSelectedFile(null);
      setReportType("");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getPlagiarismStatus = (score?: number) => {
    if (!score) return null;
    if (score < 20) return { color: "text-green-600", label: "Excellent", bg: "bg-green-50" };
    if (score < 40) return { color: "text-yellow-600", label: "Acceptable", bg: "bg-yellow-50" };
    return { color: "text-red-600", label: "Attention requise", bg: "bg-red-50" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-reports-title">
          Mes rapports
        </h1>
        <p className="text-muted-foreground">
          Déposez et gérez vos rapports de PFE
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Déposer un nouveau rapport</CardTitle>
          <CardDescription>
            Uploadez votre rapport au format PDF. Chaque rapport est automatiquement analysé pour le plagiat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-type">Type de rapport</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" data-testid="select-report-type">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">Rapport mi-parcours</SelectItem>
                  <SelectItem value="final">Rapport final</SelectItem>
                  <SelectItem value="monthly">Rapport mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-md p-8 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="sr-only"
              data-testid="input-file"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {selectedFile ? selectedFile.name : "Cliquez pour sélectionner ou glissez-déposez"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF uniquement, max 50MB
              </p>
              {selectedFile && (
                <p className="text-xs text-primary mt-2">
                  Taille: {formatFileSize(selectedFile.size)}
                </p>
              )}
            </label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !reportType || isUploading}
            className="w-full"
            data-testid="button-upload"
          >
            {isUploading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Déposer le rapport
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des rapports</CardTitle>
          <CardDescription>
            Consultez et téléchargez vos rapports précédents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                  <Skeleton className="w-12 h-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => {
                const plagiarismStatus = getPlagiarismStatus(report.plagiarismScore);
                return (
                  <div
                    key={report.id}
                    className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                    data-testid={`report-item-${report.id}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{report.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Version {report.version} • {report.type} • {formatFileSize(report.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Déposé le {new Date(report.uploadedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload?.(report.id)}
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                      {report.plagiarismScore !== undefined && plagiarismStatus && (
                        <div className={`flex items-center gap-2 p-2 rounded-md ${plagiarismStatus.bg} mt-2`}>
                          {report.plagiarismScore < 40 ? (
                            <CheckCircle2 className={`w-4 h-4 ${plagiarismStatus.color}`} />
                          ) : (
                            <AlertCircle className={`w-4 h-4 ${plagiarismStatus.color}`} />
                          )}
                          <span className={`text-xs font-medium ${plagiarismStatus.color}`}>
                            Analyse plagiat: {report.plagiarismScore}% - {plagiarismStatus.label}
                          </span>
                        </div>
                      )}
                      {report.comments && (
                        <Alert className="mt-2">
                          <AlertDescription className="text-xs">
                            {report.comments}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun rapport déposé</h3>
              <p className="text-sm text-muted-foreground">
                Commencez par déposer votre premier rapport ci-dessus
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
