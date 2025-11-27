import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function AdminSettings() {
  const { data: allSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: thresholds = null, isLoading: thresholdsLoading } = useQuery({
    queryKey: ["/api/settings-grading-thresholds"],
  });

  const { data: weights = null, isLoading: weightsLoading } = useQuery({
    queryKey: ["/api/settings-scoring-weights"],
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/settings-defense-rooms"],
  });

  const [newRoom, setNewRoom] = useState("");

  const updateSettingMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/settings/${data.key}`, "PATCH", { value: data.value }),
  });

  const addRoomMutation = useMutation({
    mutationFn: (room: string) =>
      apiRequest("/api/settings-defense-rooms", "PATCH", { rooms: [...rooms, room] }),
  });

  const handleAddRoom = () => {
    if (newRoom.trim()) {
      addRoomMutation.mutate(newRoom);
      setNewRoom("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-settings-title">Paramètres Système</h1>
        <p className="text-muted-foreground" data-testid="text-settings-subtitle">Gérez la configuration du système</p>
      </div>

      <Tabs defaultValue="general" data-testid="tabs-settings">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="defense">Soutenance</TabsTrigger>
          <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card data-testid="card-general-settings">
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration générale du système</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div data-testid="section-general">
                    <p className="text-sm text-muted-foreground" data-testid="text-general-info">
                      Paramètres système actifs: {allSettings?.length || 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defense Tab */}
        <TabsContent value="defense" className="space-y-6">
          <Card data-testid="card-defense-rooms">
            <CardHeader>
              <CardTitle>Salles de Soutenance</CardTitle>
              <CardDescription>Gérez les salles disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roomsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="space-y-2">
                    {Array.isArray(rooms) && rooms.length > 0 ? (
                      <div className="space-y-2" data-testid="list-defense-rooms">
                        {rooms.map((room: string, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 border rounded" data-testid={`item-room-${idx}`}>
                            <span data-testid={`text-room-name-${idx}`}>{room}</span>
                            <Button variant="ghost" size="sm" data-testid={`button-remove-room-${idx}`}>
                              Supprimer
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid="text-no-rooms">Aucune salle définie</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t" data-testid="section-add-room">
                    <Input
                      placeholder="Nouvelle salle"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      data-testid="input-new-room"
                    />
                    <Button onClick={handleAddRoom} data-testid="button-add-room">
                      Ajouter
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation" className="space-y-6">
          <Card data-testid="card-grading-thresholds">
            <CardHeader>
              <CardTitle>Seuils de Notation</CardTitle>
              <CardDescription>Définissez les seuils de mention</CardDescription>
            </CardHeader>
            <CardContent>
              {thresholdsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : thresholds ? (
                <div className="space-y-4" data-testid="section-thresholds">
                  <div>
                    <Label htmlFor="excellent">Excellent (≥)</Label>
                    <Input
                      id="excellent"
                      type="number"
                      value={thresholds.excellent}
                      readOnly
                      data-testid="input-threshold-excellent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tres-bien">Très Bien (≥)</Label>
                    <Input
                      id="tres-bien"
                      type="number"
                      value={thresholds.tresBien}
                      readOnly
                      data-testid="input-threshold-tres-bien"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bien">Bien (≥)</Label>
                    <Input
                      id="bien"
                      type="number"
                      value={thresholds.bien}
                      readOnly
                      data-testid="input-threshold-bien"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="text-no-thresholds">Aucun seuil disponible</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-scoring-weights">
            <CardHeader>
              <CardTitle>Poids de Notation</CardTitle>
              <CardDescription>Définissez les poids de chaque composante</CardDescription>
            </CardHeader>
            <CardContent>
              {weightsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : weights ? (
                <div className="space-y-4" data-testid="section-weights">
                  <div>
                    <Label htmlFor="report">Rapport</Label>
                    <Input
                      id="report"
                      type="number"
                      value={weights.report}
                      readOnly
                      data-testid="input-weight-report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="presentation">Présentation</Label>
                    <Input
                      id="presentation"
                      type="number"
                      value={weights.presentation}
                      readOnly
                      data-testid="input-weight-presentation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      type="number"
                      value={weights.company}
                      readOnly
                      data-testid="input-weight-company"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="text-no-weights">Aucun poids disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card data-testid="card-email-settings">
            <CardHeader>
              <CardTitle>Paramètres Email</CardTitle>
              <CardDescription>Configuration des notifications par email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="section-email">
                <div>
                  <Label htmlFor="email-enabled">Notifications Email Activées</Label>
                  <p className="text-sm text-muted-foreground">Oui</p>
                </div>
                <div>
                  <Label htmlFor="default-digest">Fréquence de Résumé par Défaut</Label>
                  <p className="text-sm text-muted-foreground">Quotidien</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
