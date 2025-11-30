import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

export default function AdminPfeTypes() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: pfeTypes = [], isLoading } = useQuery({
    queryKey: ["/api/pfe-types"],
    queryFn: () => apiRequest("GET", "/api/pfe-types"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pfe-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pfe-types"] });
      toast({ title: "Succès", description: "Type de PFE créé" });
      setFormData({ name: "", description: "" });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/pfe-types/${editingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pfe-types"] });
      toast({ title: "Succès", description: "Type de PFE mis à jour" });
      setFormData({ name: "", description: "" });
      setEditingId(null);
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pfe-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pfe-types"] });
      toast({ title: "Succès", description: "Type de PFE supprimé" });
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-pfe-types-title">Types de PFE</h1>
          <p className="text-muted-foreground" data-testid="text-pfe-types-subtitle">Gérez les types de PFE disponibles</p>
        </div>
        <Button onClick={() => { setFormData({ name: "", description: "" }); setEditingId(null); setIsDialogOpen(true); }} data-testid="button-add-pfe-type">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pfeTypes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun type de PFE</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-pfe-types">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pfeTypes.map((type: any) => (
                    <tr key={type.id} className="border-b hover:bg-muted/50" data-testid={`row-pfe-type-${type.id}`}>
                      <td className="py-3 px-4 font-medium">{type.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{type.description || "-"}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => { setFormData({ name: type.name, description: type.description || "" }); setEditingId(type.id); setIsDialogOpen(true); }} data-testid={`button-edit-pfe-type-${type.id}`}>
                          Modifier
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(type.id)} data-testid={`button-delete-pfe-type-${type.id}`}>
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
        <DialogContent data-testid="dialog-pfe-type-form">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Ajouter"} Type de PFE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="input-pfe-type-name" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="textarea-pfe-type-description" />
            </div>
            <Button onClick={handleSubmit} className="w-full" data-testid="button-submit-pfe-type">
              {editingId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
