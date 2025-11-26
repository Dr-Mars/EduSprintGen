import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const JURY_ROLES = ["president", "rapporteur", "examiner"];

export default function JuryManagementPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { data: defenses = [], isLoading: defensesLoading } = useQuery({
    queryKey: ["/api/defenses"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: currentJury, isLoading: juryLoading, refetch: refetchJury } = useQuery({
    queryKey: ["/api/defenses", selectedDefense, "jury"],
    enabled: !!selectedDefense,
  });

  const { data: validation, isLoading: validationLoading } = useQuery({
    queryKey: ["/api/defenses", selectedDefense, "jury/validate"],
    enabled: !!selectedDefense,
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/defenses/${selectedDefense}/jury`, {
        userId: selectedUser,
        role: selectedRole,
      });
    },
    onSuccess: () => {
      refetchJury();
      queryClient.invalidateQueries({ queryKey: ["/api/defenses", selectedDefense, "jury/validate"] });
      setOpen(false);
      setSelectedUser("");
      setSelectedRole("");
      toast({ title: "Membre ajouté", description: "Le jury a été mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le membre",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/jury-members/${memberId}`);
    },
    onSuccess: () => {
      refetchJury();
      queryClient.invalidateQueries({ queryKey: ["/api/defenses", selectedDefense, "jury/validate"] });
      toast({ title: "Membre supprimé" });
    },
  });

  if (defensesLoading || usersLoading || juryLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-jury-title">
          Gestion du jury
        </h1>
        <p className="text-muted-foreground">Composer et valider les jurys de soutenance</p>
      </div>

      {/* SELECT DEFENSE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner une soutenance</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDefense} onValueChange={setSelectedDefense}>
            <SelectTrigger data-testid="select-defense-jury">
              <SelectValue placeholder="Choisir une soutenance..." />
            </SelectTrigger>
            <SelectContent>
              {defenses.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.pfeProposal?.title} - {new Date(d.scheduledAt).toLocaleDateString("fr-FR")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDefense && (
        <>
          {/* VALIDATION STATUS */}
          {validation && (
            <Card className={validation.isValid ? "border-green-300" : "border-orange-300"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {validation.isValid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Jury valide
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Jury incomplet
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {validation.missingRoles?.map((role: string) => (
                  <p key={role} className="text-muted-foreground">
                    Manque: <strong>{role}</strong>
                  </p>
                ))}
                {validation.conflictWarnings?.map((warning: string, idx: number) => (
                  <p key={idx} className="text-orange-600">
                    ⚠️ {warning}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* JURY MEMBERS LIST */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Membres du jury</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-jury">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un membre du jury</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Personne</label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rôle</label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {JURY_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role === "president" && "Président"}
                              {role === "rapporteur" && "Rapporteur"}
                              {role === "examiner" && "Examinateur"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => addMemberMutation.mutate()}
                      disabled={!selectedUser || !selectedRole || addMemberMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-add"
                    >
                      {addMemberMutation.isPending ? "En cours..." : "Ajouter"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentJury?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun membre</p>
                ) : (
                  currentJury?.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`item-jury-${member.id}`}
                    >
                      <div>
                        <p className="font-medium">
                          {member.user?.firstName} {member.user?.lastName}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {member.role}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        data-testid={`button-remove-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
