import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Download } from "lucide-react";
import { format } from "date-fns";

export default function AdminAuditLogs() {
  const [filters, setFilters] = useState({
    userId: "",
    resourceType: "",
    action: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });

  const { data: logsData = { logs: [], total: 0 }, isLoading } = useQuery({
    queryKey: ["/api/audit-logs", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.resourceType) params.append("resourceType", filters.resourceType);
      if (filters.action) params.append("action", filters.action);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      params.append("limit", "50");
      params.append("offset", String((filters.page - 1) * 50));
      return apiRequest("GET", `/api/audit-logs?${params.toString()}`);
    },
  });

  const handleExport = async (format: "json" | "csv") => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.resourceType) params.append("resourceType", filters.resourceType);
      if (filters.action) params.append("action", filters.action);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      params.append("format", format);
      
      const response = await apiRequest("GET", `/api/audit-logs/export?${params.toString()}`);
      const blob = new Blob([response], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs.${format}`;
      a.click();
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const logs = logsData.logs || [];
  const total = logsData.total || 0;
  const pageCount = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-audit-logs-title">Journaux d'Audit</h1>
        <p className="text-muted-foreground" data-testid="text-audit-logs-subtitle">Suivi des actions système</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="resourceType">Type de Ressource</Label>
              <Select value={filters.resourceType} onValueChange={(val) => setFilters({ ...filters, resourceType: val, page: 1 })}>
                <SelectTrigger id="resourceType" data-testid="select-resource-type">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="pfe_proposal">Proposition PFE</SelectItem>
                  <SelectItem value="defense">Soutenance</SelectItem>
                  <SelectItem value="report">Rapport</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action} onValueChange={(val) => setFilters({ ...filters, action: val, page: 1 })}>
                <SelectTrigger id="action" data-testid="select-action">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="create">Créer</SelectItem>
                  <SelectItem value="update">Modifier</SelectItem>
                  <SelectItem value="delete">Supprimer</SelectItem>
                  <SelectItem value="approve">Approuver</SelectItem>
                  <SelectItem value="reject">Rejeter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">Du</Label>
              <Input id="dateFrom" type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })} data-testid="input-date-from" />
            </div>
            <div>
              <Label htmlFor="dateTo">Au</Label>
              <Input id="dateTo" type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })} data-testid="input-date-to" />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={() => handleExport("csv")} className="flex-1" data-testid="button-export-csv">
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("json")} className="flex-1" data-testid="button-export-json">
                <Download className="w-4 h-4 mr-1" /> JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun log trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-audit-logs">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Date/Heure</th>
                    <th className="text-left py-3 px-4">Utilisateur</th>
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">Ressource</th>
                    <th className="text-left py-3 px-4">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50" data-testid={`row-audit-log-${log.id}`}>
                      <td className="py-3 px-4 text-xs">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}</td>
                      <td className="py-3 px-4">{log.userId || "Système"}</td>
                      <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{log.action}</span></td>
                      <td className="py-3 px-4">{log.resourceType}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{log.resourceId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pageCount > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })} disabled={filters.page === 1} data-testid="button-prev-page">
                Précédent
              </Button>
              <span className="flex items-center px-4 text-sm">Page {filters.page} / {pageCount}</span>
              <Button variant="outline" onClick={() => setFilters({ ...filters, page: Math.min(pageCount, filters.page + 1) })} disabled={filters.page === pageCount} data-testid="button-next-page">
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
