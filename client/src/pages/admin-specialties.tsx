import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

export default function AdminSpecialties() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", department: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ["/api/specialties"],
    queryFn: () => apiRequest("GET", "/api/specialties"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/specialties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Succès", description: "Spécialité créée" });
      setFormData({ name: "", code: "", department: "" });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/specialties/${editingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Succès", description: "Spécialité mise à jour" });
      setFormData({ name: "", code: "", department: "" });
      setEditingId(null);
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/specialties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Succès", description: "Spécialité supprimée" });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast({ title: "Erreur", description: "Tous les champs requis", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-specialties-title">Spécialités</h1>
          <p className="text-muted-foreground" data-testid="text-specialties-subtitle">Gérez les spécialités de PFE</p>
        </div>
        <Button onClick={() => { setFormData({ name: "", code: "", department: "" }); setEditingId(null); setIsDialogOpen(true); }} data-testid="button-add-specialty">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Spécialités</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : specialties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune spécialité</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-specialties">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Département</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {specialties.map((spec: any) => (
                    <tr key={spec.id} className="border-b hover:bg-muted/50" data-testid={`row-specialty-${spec.id}`}>
                      <td className="py-3 px-4">{spec.name}</td>
                      <td className="py-3 px-4">{spec.code}</td>
                      <td className="py-3 px-4">{spec.department || "-"}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => { setFormData({ name: spec.name, code: spec.code, department: spec.department || "" }); setEditingId(spec.id); setIsDialogOpen(true); }} data-testid={`button-edit-specialty-${spec.id}`}>
                          Modifier
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(spec.id)} data-testid={`button-delete-specialty-${spec.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-specialty-form">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Ajouter"} Spécialité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="input-specialty-name" />
            </div>
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} data-testid="input-specialty-code" />
            </div>
            <div>
              <Label htmlFor="department">Département</Label>
              <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} data-testid="input-specialty-department" />
            </div>
            <Button onClick={handleSubmit} className="w-full" data-testid="button-submit-specialty">
              {editingId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
