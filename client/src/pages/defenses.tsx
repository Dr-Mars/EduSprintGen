import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/status-badge";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Defense {
  id: string;
  pfeTitle: string;
  student: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  scheduledAt: string;
  duration: number;
  room: string;
  status: "scheduled" | "completed" | "cancelled";
  juryMembers: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    role: "president" | "rapporteur" | "examiner" | "supervisor";
  }>;
  finalScore?: number;
}

interface DefensesPageProps {
  defenses?: Defense[];
  onScheduleDefense?: () => void;
  isLoading?: boolean;
}

export default function DefensesPage({ defenses = [], onScheduleDefense, isLoading }: DefensesPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      president: "Président",
      rapporteur: "Rapporteur",
      examiner: "Examinateur",
      supervisor: "Encadrant",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      president: "bg-purple-100 text-purple-800 border-purple-200",
      rapporteur: "bg-blue-100 text-blue-800 border-blue-200",
      examiner: "bg-green-100 text-green-800 border-green-200",
      supervisor: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const upcomingDefenses = defenses.filter(d => d.status === "scheduled" && new Date(d.scheduledAt) > new Date());
  const pastDefenses = defenses.filter(d => d.status === "completed" || new Date(d.scheduledAt) <= new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-defenses-title">
            Soutenances
          </h1>
          <p className="text-muted-foreground">
            Planifiez et gérez les soutenances de PFE
          </p>
        </div>
        <Button onClick={onScheduleDefense} data-testid="button-schedule-defense">
          <Plus className="w-4 h-4 mr-2" />
          Planifier une soutenance
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soutenances à venir ({upcomingDefenses.length})</CardTitle>
              <CardDescription>Prochaines soutenances planifiées</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-md space-y-3">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingDefenses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDefenses.map((defense) => {
                    const { date, time } = formatDateTime(defense.scheduledAt);
                    return (
                      <div
                        key={defense.id}
                        className="p-4 border rounded-md space-y-3 hover-elevate"
                        data-testid={`defense-item-${defense.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={defense.student.photoUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {defense.student.firstName.charAt(0)}{defense.student.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground truncate">
                                  {defense.pfeTitle}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {defense.student.firstName} {defense.student.lastName}
                                </p>
                              </div>
                              <StatusBadge status={defense.status} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="truncate">{date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{time} ({defense.duration}min)</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{defense.room}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Jury</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {defense.juryMembers.map((member) => (
                              <Badge
                                key={member.id}
                                variant="outline"
                                className={getRoleColor(member.role)}
                              >
                                {member.user.firstName} {member.user.lastName} • {getRoleLabel(member.role)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Aucune soutenance à venir</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soutenances passées ({pastDefenses.length})</CardTitle>
              <CardDescription>Historique des soutenances terminées</CardDescription>
            </CardHeader>
            <CardContent>
              {pastDefenses.length > 0 ? (
                <div className="space-y-3">
                  {pastDefenses.slice(0, 3).map((defense) => {
                    const { date, time } = formatDateTime(defense.scheduledAt);
                    return (
                      <div
                        key={defense.id}
                        className="p-3 border rounded-md flex items-center justify-between hover-elevate"
                        data-testid={`past-defense-${defense.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={defense.student.photoUrl} />
                            <AvatarFallback className="bg-muted text-sm">
                              {defense.student.firstName.charAt(0)}{defense.student.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{defense.pfeTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {defense.student.firstName} {defense.student.lastName} • {date}
                            </p>
                          </div>
                        </div>
                        {defense.finalScore && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">{defense.finalScore}/20</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Aucune soutenance passée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
