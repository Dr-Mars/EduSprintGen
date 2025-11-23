import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, Eye, CheckCircle, XCircle, MessageSquare, Filter } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

export default function ProposalsList() {
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["/api/proposals"],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredProposals = (proposals as any[]).filter((proposal) => {
    const studentName = `${proposal.student?.firstName || ""} ${proposal.student?.lastName || ""}`;
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
    const matchesType = typeFilter === "all" || proposal.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      academic: "Académique",
      company: "Entreprise",
      research: "Recherche",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-proposals-title">
          Propositions PFE
        </h1>
        <p className="text-muted-foreground">
          Gérez et validez les propositions de projets de fin d'études
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtres et recherche</span>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par titre ou étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="submitted">Soumis</SelectItem>
                <SelectItem value="to_modify">À modifier</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="academic">Académique</SelectItem>
                <SelectItem value="company">Entreprise</SelectItem>
                <SelectItem value="research">Recherche</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredProposals.length} proposition{filteredProposals.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredProposals.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Encadrant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id} data-testid={`proposal-row-${proposal.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={proposal.student.photoUrl} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                              {proposal.student.firstName.charAt(0)}{proposal.student.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {proposal.student.firstName} {proposal.student.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm max-w-xs truncate">{proposal.title}</p>
                        {proposal.submittedAt && (
                          <p className="text-xs text-muted-foreground">
                            Soumis le {new Date(proposal.submittedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getTypeLabel(proposal.type)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{proposal.specialty}</span>
                      </TableCell>
                      <TableCell>
                        {proposal.academicSupervisor ? (
                          <span className="text-sm">
                            {proposal.academicSupervisor.firstName} {proposal.academicSupervisor.lastName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Non affecté</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={proposal.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/proposals/${proposal.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${proposal.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {proposal.status === "submitted" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onValidate?.(proposal.id)}
                                data-testid={`button-validate-${proposal.id}`}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReject?.(proposal.id, "")}
                                data-testid={`button-reject-${proposal.id}`}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune proposition trouvée</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Les propositions PFE apparaîtront ici"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
