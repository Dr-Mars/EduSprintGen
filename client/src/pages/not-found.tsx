import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page non trouvée</h2>
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <Button data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
}
