import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { X, Mail, Bell } from "lucide-react";

export default function NotificationsPage() {
  const userId = "current-user"; // In production, get from auth context

  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: [`/api/users/${userId}/notifications`],
  });

  const { data: preferences = null, isLoading: preferencesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/notification-preferences`],
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [`/api/users/${userId}/notifications/unread/count`],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, "PATCH"),
    onSuccess: () => refetchNotifications(),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}`, "DELETE"),
    onSuccess: () => refetchNotifications(),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: any) =>
      apiRequest(`/api/users/${userId}/notification-preferences`, "PATCH", prefs),
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handlePreferenceChange = (key: string, value: any) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: value,
    });
  };

  const getNotificationIcon = (type: string) => {
    return type.includes("email") ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-notifications-title">Notifications</h1>
        <p className="text-muted-foreground" data-testid="text-notifications-subtitle">Gérez vos notifications et préférences</p>
      </div>

      <Tabs defaultValue="notifications" data-testid="tabs-notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground" data-testid="text-notification-count">
              {unreadCount} non lues
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => apiRequest(`/api/users/${userId}/notifications/read-all`, "PATCH")}
              data-testid="button-mark-all-read"
            >
              Marquer tout comme lu
            </Button>
          </div>

          {notificationsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${!notification.isRead ? "border-primary" : ""}`}
                  data-testid={`card-notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold" data-testid={`text-notification-title-${notification.id}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <Badge variant="default" data-testid={`badge-unread-${notification.id}`}>
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notification-message-${notification.id}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2" data-testid={`text-notification-date-${notification.id}`}>
                            {new Date(notification.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            Lire
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card data-testid="card-no-notifications">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="text-no-notifications">Aucune notification pour le moment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card data-testid="card-notification-preferences">
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
              <CardDescription>Contrôlez comment vous recevez les notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferencesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : preferences ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Notifications Email</h4>

                    <div className="flex items-center justify-between" data-testid="pref-proposal-submitted">
                      <Label htmlFor="proposal-submitted" className="flex flex-col cursor-pointer">
                        <span>Proposition soumise</span>
                        <span className="text-xs text-muted-foreground">Recevoir une notification quand une proposition est soumise</span>
                      </Label>
                      <Switch
                        id="proposal-submitted"
                        checked={preferences.emailOnProposalSubmitted}
                        onCheckedChange={(checked) => handlePreferenceChange("emailOnProposalSubmitted", checked)}
                        data-testid="switch-proposal-submitted"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-testid="pref-proposal-validated">
                      <Label htmlFor="proposal-validated" className="flex flex-col cursor-pointer">
                        <span>Proposition validée</span>
                        <span className="text-xs text-muted-foreground">Recevoir une notification quand une proposition est validée</span>
                      </Label>
                      <Switch
                        id="proposal-validated"
                        checked={preferences.emailOnProposalValidated}
                        onCheckedChange={(checked) => handlePreferenceChange("emailOnProposalValidated", checked)}
                        data-testid="switch-proposal-validated"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-testid="pref-defense-scheduled">
                      <Label htmlFor="defense-scheduled" className="flex flex-col cursor-pointer">
                        <span>Soutenance programmée</span>
                        <span className="text-xs text-muted-foreground">Recevoir une notification quand une soutenance est programmée</span>
                      </Label>
                      <Switch
                        id="defense-scheduled"
                        checked={preferences.emailOnDefenseScheduled}
                        onCheckedChange={(checked) => handlePreferenceChange("emailOnDefenseScheduled", checked)}
                        data-testid="switch-defense-scheduled"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold">Fréquence des Résumés</h4>
                    <div className="space-y-2" data-testid="section-digest-frequency">
                      <Label htmlFor="digest-frequency">Recevoir un résumé:</Label>
                      <select
                        id="digest-frequency"
                        value={preferences.emailDigestFrequency || "daily"}
                        onChange={(e) => handlePreferenceChange("emailDigestFrequency", e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        data-testid="select-digest-frequency"
                      >
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="never">Jamais</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="text-no-preferences">Aucune préférence disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
