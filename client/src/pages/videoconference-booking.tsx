import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Video, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function VideoconferenceBooking() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [defenseId, setDefenseId] = useState("");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/videoconferences"],
    queryFn: () => apiRequest("GET", "/api/videoconferences"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/videoconferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videoconferences"] });
      toast({ title: "Succès", description: "Vidéoconférence créée" });
      setDefenseId("");
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/videoconferences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videoconferences"] });
      toast({ title: "Succès", description: "Vidéoconférence supprimée" });
    },
  });

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Copié", description: "Lien copié au presse-papiers" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-videoconf-title">Vidéoconférences</h1>
          <p className="text-muted-foreground" data-testid="text-videoconf-subtitle">Gérez les sessions de soutenance en ligne</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-videoconf">
          <Video className="w-4 h-4 mr-2" /> Nouvelle Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions de Vidéoconférence</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune session vidéoconférence</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session: any) => (
                <Card key={session.id} className="p-4" data-testid={`card-videoconf-${session.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="font-medium">Code: {session.roomCode}</span>
                        <span className={`text-xs px-2 py-1 rounded ${session.status === "ongoing" ? "bg-green-100 text-green-800" : session.status === "completed" ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}`}>
                          {session.status}
                        </span>
                      </div>
                      {session.meetingLink && (
                        <p className="text-sm text-muted-foreground mb-2 break-all">{session.meetingLink}</p>
                      )}
                      {session.startedAt && (
                        <p className="text-xs text-muted-foreground">
                          Démarrée: {format(new Date(session.startedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {session.meetingLink && (
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(session.meetingLink)} data-testid={`button-copy-link-${session.id}`}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(session.id)} data-testid={`button-delete-videoconf-${session.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-create-videoconf">
          <DialogHeader>
            <DialogTitle>Créer une Vidéoconférence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="defenseId">ID Soutenance *</Label>
              <Input
                id="defenseId"
                placeholder="UUID de la soutenance"
                value={defenseId}
                onChange={(e) => setDefenseId(e.target.value)}
                data-testid="input-defense-id"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ defenseId })}
              className="w-full"
              data-testid="button-submit-videoconf"
            >
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
