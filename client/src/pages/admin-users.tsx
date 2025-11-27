import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Edit, Power, Download } from "lucide-react";

export default function AdminUsers() {
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  const [searchTerm, setSearchTerm] = useState("");

  const toggleUserMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/users/${data.userId}/toggle-active`, "PATCH", { isActive: data.isActive }),
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/users/${data.userId}/role`, "PATCH", { role: data.role }),
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const handleToggleUser = (userId: string, isActive: boolean) => {
    toggleUserMutation.mutate({ userId, isActive: !isActive });
  };

  const handleUpdateRole = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleExport = () => {
    console.log("Exporting users...");
  };

  const filteredUsers = users.filter((user: any) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: "default",
      academic_supervisor: "secondary",
      company_supervisor: "secondary",
      coordinator: "outline",
      manager: "outline",
      administrator: "destructive",
    };
    return colors[role] || "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-users-title">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground" data-testid="text-users-subtitle">Gérez les utilisateurs du système</p>
      </div>

      <Card data-testid="card-user-search">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Liste des Utilisateurs</CardTitle>
            <CardDescription>Total: {users.length} utilisateurs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-users">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Rechercher par email, nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-users"
          />

          {usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-users">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2" data-testid="header-email">Email</th>
                    <th className="text-left p-2" data-testid="header-name">Nom</th>
                    <th className="text-left p-2" data-testid="header-role">Rôle</th>
                    <th className="text-left p-2" data-testid="header-status">Statut</th>
                    <th className="text-left p-2" data-testid="header-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any, idx: number) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`row-user-${idx}`}>
                      <td className="p-2" data-testid={`cell-email-${idx}`}>{user.email}</td>
                      <td className="p-2" data-testid={`cell-name-${idx}`}>
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="p-2" data-testid={`cell-role-${idx}`}>
                        <Badge variant={getRoleColor(user.role) as any} data-testid={`badge-role-${idx}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2" data-testid={`cell-status-${idx}`}>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${idx}`}
                        >
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-2 space-x-2" data-testid={`cell-actions-${idx}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUser(user.id, user.isActive)}
                          data-testid={`button-toggle-user-${idx}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8" data-testid="section-no-users">
              <p className="text-muted-foreground" data-testid="text-no-users">Aucun utilisateur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-user-statistics">
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>Répartition des utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4" data-testid="section-user-stats">
            {["student", "academic_supervisor", "coordinator"].map((role) => (
              <div key={role} className="text-center" data-testid={`stat-${role}`}>
                <div className="text-2xl font-bold" data-testid={`text-count-${role}`}>
                  {users.filter((u: any) => u.role === role).length}
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`text-label-${role}`}>
                  {role === "student" ? "Étudiants" : role === "academic_supervisor" ? "Superviseurs" : "Coordinateurs"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
