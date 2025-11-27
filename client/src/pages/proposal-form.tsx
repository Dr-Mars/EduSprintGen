import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Save, Send, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationEvents } from "@/lib/notification-events";

const proposalSchema = z.object({
  title: z.string().min(10, "Le titre doit contenir au moins 10 caractères"),
  type: z.enum(["academic", "company", "research"], { required_error: "Sélectionnez un type" }),
  specialtyId: z.string().min(1, "Sélectionnez une spécialité"),
  description: z.string().min(50, "La description doit contenir au moins 50 caractères"),
  context: z.string().min(100, "Le contexte doit contenir au moins 100 caractères"),
  problematic: z.string().min(50, "La problématique doit contenir au moins 50 caractères"),
  objectives: z.string().min(50, "Les objectifs doivent contenir au moins 50 caractères"),
  technologies: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  companySupervisorName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  initialData?: Partial<ProposalFormData>;
  onSaveDraft?: (data: ProposalFormData) => Promise<void>;
  onSubmit?: (data: ProposalFormData) => Promise<void>;
  specialties?: Array<{ id: string; name: string }>;
}

export default function ProposalForm({ initialData, onSaveDraft, onSubmit, specialties = [] }: ProposalFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      context: "",
      problematic: "",
      objectives: "",
      technologies: "",
      companyName: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      companySupervisorName: "",
      ...initialData,
    },
  });

  const steps = [
    {
      title: "Informations générales",
      description: "Titre, type et spécialité du PFE",
      fields: ["title", "type", "specialtyId", "description"] as const,
    },
    {
      title: "Description détaillée",
      description: "Contexte, problématique et objectifs",
      fields: ["context", "problematic", "objectives", "technologies"] as const,
    },
    {
      title: "Informations entreprise",
      description: "Coordonnées de l'entreprise et encadrant",
      fields: ["companyName", "companyAddress", "companyPhone", "companyEmail", "companySupervisorName", "startDate", "endDate"] as const,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const data = form.getValues();
      await onSaveDraft?.(data);
      toast({
        title: "Brouillon sauvegardé",
        description: "Votre proposition a été enregistrée en brouillon",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le brouillon",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await form.trigger(currentFields as any);
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (data: ProposalFormData) => {
    setIsSaving(true);
    try {
      await onSubmit?.(data);
      
      // Trigger notification event
      await notificationEvents.onProposalSubmitted("current-student-id", data.title, "coordinator-id");
      
      toast({
        title: "Proposition soumise",
        description: "Votre proposition a été soumise pour validation",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la proposition",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Nouvelle proposition PFE</h1>
        <p className="text-muted-foreground">
          Remplissez le formulaire en plusieurs étapes pour soumettre votre proposition
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">Étape {currentStep + 1} sur {steps.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du PFE *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Développement d'une application mobile de gestion..."
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormDescription>
                          Donnez un titre clair et descriptif à votre projet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de PFE *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="academic">Académique</SelectItem>
                            <SelectItem value="company">Entreprise</SelectItem>
                            <SelectItem value="research">Recherche</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialtyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spécialité *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder="Sélectionnez votre spécialité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem key={specialty.id} value={specialty.id}>
                                {specialty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description générale *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Décrivez brièvement votre projet..."
                            rows={4}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 50 caractères
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contexte du projet *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Présentez le contexte dans lequel s'inscrit votre PFE..."
                            rows={5}
                            data-testid="input-context"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 100 caractères - Décrivez le cadre général du projet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="problematic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problématique *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Quelle est la problématique que vous souhaitez résoudre ?"
                            rows={4}
                            data-testid="input-problematic"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 50 caractères
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objectifs *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Listez les objectifs principaux de votre PFE..."
                            rows={4}
                            data-testid="input-objectives"
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 50 caractères
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="technologies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technologies envisagées</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: React, Node.js, PostgreSQL..."
                            data-testid="input-technologies"
                          />
                        </FormControl>
                        <FormDescription>
                          Facultatif - Indiquez les technologies que vous comptez utiliser
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Ces informations sont nécessaires pour les PFE en entreprise
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: TechCorp Solutions"
                            data-testid="input-company-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse de l'entreprise</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Adresse complète"
                            data-testid="input-company-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="+212 6XX XXX XXX"
                              data-testid="input-company-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email entreprise</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contact@entreprise.com"
                              data-testid="input-company-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="companySupervisorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'encadrant entreprise</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nom et prénom"
                            data-testid="input-supervisor-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              data-testid="input-start-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      data-testid="button-previous"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    data-testid="button-save-draft"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
                <div>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      data-testid="button-next"
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-submit"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Soumettre
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
