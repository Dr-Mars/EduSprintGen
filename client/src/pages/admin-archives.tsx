import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Download, Trash2, RotateCcw } from "lucide-react";

export default function AdminArchives() {
  const { data: archives = [], isLoading: archivesLoading, refetch: refetchArchives } = useQuery({
    queryKey: ["/api/archives"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const deleteArchiveMutation = useMutation({
    mutationFn: (archiveId: string) =>
      apiRequest(`/api/archives/${archiveId}`, "DELETE"),
    onSuccess: () => {
      refetchArchives();
      queryClient.invalidateQueries({ queryKey: ["/api/archives"] });
    },
  });

  const restoreArchiveMutation = useMutation({
    mutationFn: (archiveId: string) =>
      apiRequest(`/api/archives/${archiveId}/restore`, "POST"),
    onSuccess: () => {
      refetchArchives();
    },
  });

  const handleDelete = (archiveId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette archive?")) {
      deleteArchiveMutation.mutate(archiveId);
    }
  };

  const handleRestore = (archiveId: string) => {
    restoreArchiveMutation.mutate(archiveId);
  };

  const handleExport = () => {
    console.log("Exporting archives...");
  };

  const filteredArchives = archives.filter((archive: any) => {
    const matchesSearch = archive.recordId?.includes(searchTerm) || archive.id?.includes(searchTerm);
    const matchesType = !filterType || archive.recordType === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pfe_proposal: "default",
      defense: "secondary",
      report: "outline",
      evaluation: "outline",
    };
    return colors[type] || "default";
  };

  const archiveTypes = Array.from(new Set(archives.map((a: any) => a.recordType)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-archives-title">Archives</h1>
        <p className="text-muted-foreground" data-testid="text-archives-subtitle">Gérez les archives du système</p>
      </div>

      <Card data-testid="card-archive-filters">
        <CardHeader>
          <CardTitle>Liste des Archives</CardTitle>
          <CardDescription>Total: {archives.length} archives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row" data-testid="section-filters">
            <Input
              placeholder="Rechercher par ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="input-search-archives"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
              data-testid="select-archive-type"
            >
              <option value="">Tous les types</option>
              {archiveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleExport} data-testid="button-export-archives">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>

          {archivesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredArchives.length > 0 ? (
            <div className="space-y-2" data-testid="list-archives">
              {filteredArchives.map((archive: any, idx: number) => (
                <Card key={archive.id} className="hover:shadow-md transition-shadow" data-testid={`card-archive-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeColor(archive.recordType) as any} data-testid={`badge-type-${idx}`}>
                            {archive.recordType}
                          </Badge>
                          <span className="text-xs text-muted-foreground" data-testid={`text-archive-id-${idx}`}>
                            ID: {archive.recordId}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-archived-by-${idx}`}>
                          Archivé par: {archive.archivedBy}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-archived-date-${idx}`}>
                          {new Date(archive.archivedAt).toLocaleDateString("fr-FR")} {new Date(archive.archivedAt).toLocaleTimeString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex gap-2" data-testid={`section-actions-${idx}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(archive.id)}
                          data-testid={`button-restore-archive-${idx}`}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(archive.id)}
                          data-testid={`button-delete-archive-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="section-no-archives">
              <p className="text-muted-foreground" data-testid="text-no-archives">Aucune archive trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-archive-statistics">
        <CardHeader>
          <CardTitle>Statistiques des Archives</CardTitle>
          <CardDescription>Distribution par type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="section-archive-stats">
            {archiveTypes.map((type) => {
              const count = archives.filter((a: any) => a.recordType === type).length;
              return (
                <div key={type} className="flex items-center justify-between" data-testid={`stat-${type}`}>
                  <span className="text-sm" data-testid={`text-type-label-${type}`}>{type}</span>
                  <Badge variant="secondary" data-testid={`badge-count-${type}`}>{count}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
