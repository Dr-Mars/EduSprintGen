import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Copy, LogOut, Maximize2, PhoneOff } from "lucide-react";

export default function VideoconferenceRoom() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: [`/api/videoconferences/${sessionId}`],
    queryFn: () => apiRequest("GET", `/api/videoconferences/${sessionId}`),
  });

  const handleCopyCode = () => {
    if (session?.roomCode) {
      navigator.clipboard.writeText(session.roomCode);
      toast({ title: "Copié", description: "Code de salle copié" });
    }
  };

  const handleLeave = () => {
    window.history.back();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-room-title">Salle: {session?.roomCode}</h1>
          <p className="text-sm text-gray-400">Statut: {session?.status}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyCode} data-testid="button-copy-code">
            <Copy className="w-4 h-4 mr-1" /> Code
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLeave} data-testid="button-leave">
            <PhoneOff className="w-4 h-4 mr-1" /> Quitter
          </Button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-full h-full bg-gray-800 flex items-center justify-center"
          data-testid="video-container"
        >
          <div className="text-center text-white">
            <Maximize2 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-xl">Zone de vidéoconférence</p>
            <p className="text-sm text-gray-400 mt-2">Intégration WebRTC requise</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 text-white p-4 flex justify-center gap-4">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          onClick={() => setIsMuted(!isMuted)}
          data-testid="button-mute"
        >
          🎤 {isMuted ? "Non-Muet" : "Muet"}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          onClick={() => setIsVideoOff(!isVideoOff)}
          data-testid="button-video"
        >
          📹 {isVideoOff ? "Vidéo On" : "Vidéo Off"}
        </Button>
        <Button variant="outline" data-testid="button-share">
          📤 Partager
        </Button>
      </div>
    </div>
  );
}
