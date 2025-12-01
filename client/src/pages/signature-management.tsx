import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PenTool, Download, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

export default function SignatureManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ documentId: "", documentType: "report" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ["/api/signatures"],
    queryFn: () => apiRequest("GET", "/api/signatures"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/signatures", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signatures"] });
      toast({ title: "Succès", description: "Signature enregistrée" });
      setFormData({ documentId: "", documentType: "report" });
      setIsDialogOpen(false);
      clearCanvas();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/signatures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signatures"] });
      toast({ title: "Succès", description: "Signature supprimée" });
    },
  });

  const startDrawing = () => setIsDrawing(true);
  const stopDrawing = () => setIsDrawing(false);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleSign = () => {
    if (!formData.documentId) {
      toast({ title: "Erreur", description: "ID document requis", variant: "destructive" });
      return;
    }
    if (canvasRef.current) {
      const signatureData = canvasRef.current.toDataURL("image/png");
      createMutation.mutate({
        documentId: formData.documentId,
        documentType: formData.documentType,
        signatureData,
        signatureTimestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-signature-title">Signatures Numériques</h1>
          <p className="text-muted-foreground" data-testid="text-signature-subtitle">Signez et gérez les documents</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-signature">
          <PenTool className="w-4 h-4 mr-2" /> Signer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signatures Enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : signatures.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune signature</p>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig: any) => (
                <Card key={sig.id} className="p-3" data-testid={`card-signature-${sig.id}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{sig.documentType}</p>
                      <p className="text-sm text-muted-foreground">ID: {sig.documentId}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(sig.signatureTimestamp), "dd/MM/yyyy HH:mm")}
                      </p>
                      <span className={`inline-block text-xs mt-2 px-2 py-1 rounded ${sig.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {sig.isValid ? "Valide" : "Invalide"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-download-sig-${sig.id}`}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(sig.id)} data-testid={`button-delete-sig-${sig.id}`}>
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
        <DialogContent className="max-w-2xl" data-testid="dialog-signature">
          <DialogHeader>
            <DialogTitle>Créer une Signature Numérique</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="docId">ID Document *</Label>
              <Input
                id="docId"
                placeholder="UUID du document"
                value={formData.documentId}
                onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                data-testid="input-document-id"
              />
            </div>
            <div>
              <Label htmlFor="docType">Type de Document *</Label>
              <Select value={formData.documentType} onValueChange={(val) => setFormData({ ...formData, documentType: val })}>
                <SelectTrigger id="docType" data-testid="select-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="report">Rapport</SelectItem>
                  <SelectItem value="proposal">Proposition</SelectItem>
                  <SelectItem value="defense_record">Procès-verbal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Votre Signature *</Label>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                className="border-2 border-dashed border-muted-foreground rounded cursor-crosshair bg-white"
                data-testid="canvas-signature"
              />
              <Button variant="outline" onClick={clearCanvas} className="mt-2 w-full" data-testid="button-clear">
                Effacer
              </Button>
            </div>
            <Button onClick={handleSign} className="w-full" data-testid="button-sign">
              Signer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
