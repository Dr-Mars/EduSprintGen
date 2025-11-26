import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Edit2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const ROOMS = ["A101", "A102", "A103", "B201", "B202", "C301"];

export default function DefenseSchedulingPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [room, setRoom] = useState("");
  const [duration, setDuration] = useState("60");

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["/api/proposals"],
  });

  const { data: defenses = [], isLoading: defensesLoading } = useQuery({
    queryKey: ["/api/defenses"],
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/defenses", {
        pfeProposalId: selectedProposal,
        scheduledAt: new Date(scheduledAt).toISOString(),
        room,
        duration: parseInt(duration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defenses"] });
      setOpen(false);
      setSelectedProposal("");
      setScheduledAt("");
      setRoom("");
      toast({ title: "Soutenance programmée", description: "La date a été enregistrée" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de programmer",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (defenseId: string) => {
      await apiRequest("DELETE", `/api/defenses/${defenseId}`, { reason: "Annulation" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defenses"] });
      toast({ title: "Soutenance annulée" });
    },
  });

  if (proposalsLoading || defensesLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-scheduling-title">
            Planification des soutenances
          </h1>
          <p className="text-muted-foreground">Gérer le calendrier des défenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-schedule-defense">
              <Plus className="w-4 h-4 mr-2" />
              Programmer une soutenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle soutenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="proposal">Proposition PFE</Label>
                <Select value={selectedProposal} onValueChange={setSelectedProposal}>
                  <SelectTrigger data-testid="select-proposal">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="datetime">Date et heure</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  data-testid="input-datetime"
                />
              </div>
              <div>
                <Label htmlFor="room">Salle</Label>
                <Select value={room} onValueChange={setRoom}>
                  <SelectTrigger data-testid="select-room">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOMS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  data-testid="input-duration"
                />
              </div>
              <Button
                onClick={() => scheduleMutation.mutate()}
                disabled={!selectedProposal || !scheduledAt || !room || scheduleMutation.isPending}
                className="w-full"
                data-testid="button-confirm-schedule"
              >
                {scheduleMutation.isPending ? "En cours..." : "Programmer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CALENDAR/LIST VIEW */}
      <div className="grid gap-4">
        {defenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune soutenance programmée
            </CardContent>
          </Card>
        ) : (
          defenses.map((defense: any) => (
            <Card key={defense.id} data-testid={`card-defense-${defense.id}`}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{defense.pfeProposal?.title || "Sans titre"}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(defense.scheduledAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </div>
                <Badge variant={defense.status === "scheduled" ? "default" : "secondary"}>
                  {defense.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Salle:</strong> {defense.room}</p>
                  <p><strong>Durée:</strong> {defense.duration} min</p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-edit-${defense.id}`}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(defense.id)}
                      data-testid={`button-delete-${defense.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
