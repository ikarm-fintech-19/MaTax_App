import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { createUser, deleteUser } from "@/lib/admin-service";
import {
  Users,
  FileText,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  UserMinus,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  Trash2,
  Plus,
  Sparkles,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [activeTab, setActiveTab] = useState("users");

  // Create user modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", companyName: "", nif: "", role: "user" as "user" | "expert" | "admin" });

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Predefined accounts
  const PREDEFINED_ACCOUNTS = [
    { email: "demo-user@matax.dz", password: "demo1234", fullName: "Ali Bencheikh", companyName: "SARL Atlas Commerce", nif: "099916001234567", role: "user" as const },
    { email: "demo-expert@matax.dz", password: "demo1234", fullName: "Fatima Zohra", companyName: "Cabinet FZ Expertise", nif: "198512345678902", role: "expert" as const },
    { email: "demo-admin@matax.dz", password: "demo1234", fullName: "Karim Mokhtar", companyName: "MaTax Administration", nif: "198012345678903", role: "admin" as const },
  ];

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all declarations
  const { data: declarations = [], isLoading: declLoading } = useQuery({
    queryKey: ["admin-declarations"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("declarations")
        .select("*, profiles!user_id(full_name, company_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch expert-client relationships
  const { data: expertClients = [] } = useQuery({
    queryKey: ["admin-expert-clients"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("expert_clients").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: "user" | "expert" | "admin";
    }) => {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.role_updated"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Assign client to expert mutation
  const assignClientMutation = useMutation({
    mutationFn: async ({ expertId, clientId }: { expertId: string; clientId: string }) => {
      const { error } = await supabase
        .from("expert_clients")
        .insert({ expert_id: expertId, client_id: clientId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expert-clients"] });
      setAssignModalOpen(false);
      setSelectedExpert("");
      setSelectedClient("");
      toast.success(t("admin.client_assigned"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Unassign client mutation
  const unassignClientMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("expert_clients").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expert-clients"] });
      toast.success(t("admin.client_unassigned"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      return createUser(newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateModalOpen(false);
      setNewUser({ email: "", password: "", fullName: "", companyName: "", nif: "", role: "user" });
      toast.success("Compte créé avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Create predefined account mutation
  const createPredefinedMutation = useMutation({
    mutationFn: async (account: typeof PREDEFINED_ACCOUNTS[0]) => {
      return createUser(account);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`Compte ${result.email} créé`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!userToDelete) throw new Error("No user selected");
      return deleteUser({ userId: userToDelete });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      toast.success("Compte supprimé avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter users based on search and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === "" ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nif?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter declarations based on search
  const filteredDeclarations = declarations.filter((d) => {
    if (searchQuery === "") return true;
    const userProfile = d.profiles as any;
    return (
      userProfile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userProfile?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Stats
  const totalUsers = users.length;
  const totalExperts = users.filter((u) => u.role === "expert").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalRegular = users.filter((u) => u.role === "user").length;
  const totalDeclarations = declarations.length;
  const pendingDeclarations = declarations.filter((d) => d.status === "draft").length;
  const submittedDeclarations = declarations.filter((d) => d.status === "submitted").length;
  const totalRevenue = declarations.reduce((sum, d) => sum + (Number(d.total_due) || 0), 0);

  // Experts and clients for assignment modal
  const experts = users.filter((u) => u.role === "expert");
  const clients = users.filter((u) => u.role === "user");

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              <Shield size={14} /> {t("admin.title")}
            </div>
          </div>
          <h1 className="headline-text mt-2">{t("admin.dashboard")}</h1>
          <p className="text-ink-muted">{t("admin.dashboard_desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="inline-flex items-center gap-2">
            <Plus size={16} />
            Créer un compte
          </Button>
          <Button onClick={() => setAssignModalOpen(true)} className="inline-flex items-center gap-2">
            <UserPlus size={16} />
            {t("admin.assign_client")}
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{totalUsers}</div>
              <div className="text-xs text-ink-muted">{t("admin.total_users")}</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2 text-success">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{totalExperts}</div>
              <div className="text-xs text-ink-muted">{t("admin.total_experts")}</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <FileText size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{totalDeclarations}</div>
              <div className="text-xs text-ink-muted">{t("admin.total_declarations")}</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{formatCurrency(totalRevenue, "fr")}</div>
              <div className="text-xs text-ink-muted">{t("admin.total_revenue")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users size={16} />
            <span className="hidden sm:inline">{t("admin.users")}</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <UserPlus size={16} />
            <span className="hidden sm:inline">{t("admin.expert_clients")}</span>
          </TabsTrigger>
          <TabsTrigger value="declarations" className="flex items-center gap-2">
            <FileText size={16} />
            <span className="hidden sm:inline">{t("admin.recent_declarations")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                placeholder={t("admin.search_users")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("admin.filter_role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.all_roles")}</SelectItem>
                <SelectItem value="user">{t("admin.total_regular")}</SelectItem>
                <SelectItem value="expert">{t("admin.total_experts")}</SelectItem>
                <SelectItem value="admin">{t("admin.total_admins")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predefined Accounts Quick-Create */}
          <div className="surface-card rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <h3 className="label-text mb-2 flex items-center gap-2 text-primary">
              <Sparkles size={14} /> Comptes prédéfinis
            </h3>
            <p className="mb-3 text-xs text-ink-muted">Créez des comptes de démonstration en un clic :</p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => createPredefinedMutation.mutate(account)}
                  disabled={createPredefinedMutation.isPending}
                >
                  <UserRoundPlus size={14} />
                  {account.fullName} ({account.role})
                </Button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="surface-card space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : (
            <div className="surface-card overflow-hidden p-0">
              {/* Desktop Table */}
              <table className="hidden w-full text-sm md:table">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-start label-text">{t("admin.user_name")}</th>
                    <th className="px-4 py-3 text-start label-text">{t("admin.user_company")}</th>
                    <th className="px-4 py-3 text-center label-text">{t("admin.user_role")}</th>
                    <th className="px-4 py-3 text-start label-text">
                      {t("admin.user_registered")}
                    </th>
                    <th className="px-4 py-3 text-center label-text">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 20).map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {u.full_name?.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <div className="font-medium">{u.full_name ?? "—"}</div>
                            {u.id === user?.id && (
                              <div className="text-xs text-primary">{t("admin.you")}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{u.company_name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <Select
                          value={u.role ?? "user"}
                          onValueChange={(newRole) =>
                            updateRoleMutation.mutate({
                              userId: u.id,
                              newRole: newRole as "user" | "expert" | "admin",
                            })
                          }
                          disabled={u.id === user?.id}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-1">
                                <Users size={12} /> User
                              </span>
                            </SelectItem>
                            <SelectItem value="expert">
                              <span className="flex items-center gap-1 text-success">
                                <TrendingUp size={12} /> Expert
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-1 text-destructive">
                                <Shield size={12} /> Admin
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {new Date(u.created_at).toLocaleDateString("fr-DZ")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(u.id);
                                toast.success(t("admin.id_copied"));
                              }}
                            >
                              {t("admin.copy_id")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(u.id);
                                setAssignModalOpen(true);
                                setSelectedExpert(u.role === "expert" ? u.id : "");
                                setSelectedClient(u.role === "user" ? u.id : "");
                              }}
                            >
                              {t("admin.assign_client")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(u.id);
                                setDeleteConfirmOpen(true);
                              }}
                              disabled={u.id === user?.id}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="divide-y divide-border md:hidden">
                {filteredUsers.slice(0, 20).map((u) => (
                  <div key={u.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {u.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <div className="font-medium">{u.full_name ?? "—"}</div>
                          <div className="text-xs text-ink-muted">{u.company_name ?? "—"}</div>
                          {u.id === user?.id && (
                            <div className="mt-1 text-xs text-primary">{t("admin.you")}</div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(u.id);
                              toast.success(t("admin.id_copied"));
                            }}
                          >
                            {t("admin.copy_id")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Select
                        value={u.role ?? "user"}
                        onValueChange={(newRole) =>
                          updateRoleMutation.mutate({
                            userId: u.id,
                            newRole: newRole as "user" | "expert" | "admin",
                          })
                        }
                        disabled={u.id === user?.id}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-ink-muted">
                        {new Date(u.created_at).toLocaleDateString("fr-DZ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users size={32} className="mb-2 text-ink-muted" />
                  <p className="text-ink-muted">{t("admin.no_users_found")}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {expertClients.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-ink-muted">
                <UserPlus size={32} />
              </div>
              <h3 className="title-text">{t("admin.no_assignments")}</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                {t("admin.no_assignments_desc")}
              </p>
              <Button onClick={() => setAssignModalOpen(true)} className="mt-4" variant="outline">
                <UserPlus size={16} className="mr-2" />
                {t("admin.assign_client")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {expertClients.map((ec) => {
                const expert = users.find((u) => u.id === ec.expert_id);
                const client = users.find((u) => u.id === ec.client_id);
                return (
                  <div key={ec.id} className="surface-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-sm font-medium text-success">
                        {expert?.full_name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{expert?.full_name ?? "—"}</span>
                          <span className="text-ink-muted">→</span>
                          <span className="font-medium">{client?.full_name ?? "—"}</span>
                        </div>
                        <div className="text-xs text-ink-muted">
                          {expert?.company_name ?? "—"} · {client?.company_name ?? "—"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => unassignClientMutation.mutate(ec.id)}
                    >
                      <UserMinus size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Declarations Tab */}
        <TabsContent value="declarations" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder={t("admin.search_declarations")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {declLoading ? (
            <div className="surface-card space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : (
            <div className="surface-card overflow-hidden p-0">
              {/* Desktop Table */}
              <table className="hidden w-full text-sm md:table">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-start label-text">
                      {t("admin.declaration_user")}
                    </th>
                    <th className="px-4 py-3 text-start label-text">
                      {t("admin.declaration_type")}
                    </th>
                    <th className="px-4 py-3 text-start label-text">
                      {t("admin.declaration_period")}
                    </th>
                    <th className="px-4 py-3 text-end label-text">
                      {t("admin.declaration_amount")}
                    </th>
                    <th className="px-4 py-3 text-center label-text">
                      {t("admin.declaration_status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeclarations.slice(0, 10).map((d) => {
                    const userProfile = d.profiles as any;
                    return (
                      <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {userProfile?.full_name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                              <div className="font-medium">{userProfile?.full_name ?? "—"}</div>
                              <div className="text-xs text-ink-muted">
                                {userProfile?.company_name ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 uppercase">{d.type}</td>
                        <td className="px-4 py-3 text-ink-muted">{d.period_label ?? "—"}</td>
                        <td className="px-4 py-3 text-end tabular-nums">
                          {d.total_due != null ? formatCurrency(Number(d.total_due), "fr") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={d.status === "submitted" ? "default" : "secondary"}
                            className={
                              d.status === "submitted"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }
                          >
                            {d.status === "submitted" ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : (
                              <Clock size={12} className="mr-1" />
                            )}
                            {d.status === "submitted"
                              ? t("admin.declaration_submitted")
                              : t("admin.declaration_draft")}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="divide-y divide-border md:hidden">
                {filteredDeclarations.slice(0, 10).map((d) => {
                  const userProfile = d.profiles as any;
                  return (
                    <div key={d.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {userProfile?.full_name?.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <div className="font-medium">{userProfile?.full_name ?? "—"}</div>
                            <div className="text-xs text-ink-muted">
                              {userProfile?.company_name ?? "—"}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={d.status === "submitted" ? "default" : "secondary"}
                          className={
                            d.status === "submitted"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {d.status === "submitted"
                            ? t("admin.declaration_submitted")
                            : t("admin.declaration_draft")}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-ink-muted">
                            {t("admin.declaration_type")}
                          </div>
                          <div className="font-medium uppercase">{d.type}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-muted">
                            {t("admin.declaration_period")}
                          </div>
                          <div className="font-medium">{d.period_label ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-muted">
                            {t("admin.declaration_amount")}
                          </div>
                          <div className="font-medium tabular-nums">
                            {d.total_due != null ? formatCurrency(Number(d.total_due), "fr") : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDeclarations.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileText size={32} className="mb-2 text-ink-muted" />
                  <p className="text-ink-muted">{t("admin.no_declarations_found")}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.assign_client")}</DialogTitle>
            <DialogDescription>{t("admin.assign_client_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="label-text mb-1 block">{t("admin.select_expert")}</label>
              <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.select_expert_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {experts.map((expert) => (
                    <SelectItem key={expert.id} value={expert.id}>
                      {expert.full_name ?? "—"} ({expert.company_name ?? "—"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="label-text mb-1 block">{t("admin.select_client")}</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.select_client_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name ?? "—"} ({client.company_name ?? "—"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (selectedExpert && selectedClient) {
                  assignClientMutation.mutate({
                    expertId: selectedExpert,
                    clientId: selectedClient,
                  });
                }
              }}
              disabled={!selectedExpert || !selectedClient}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un compte</DialogTitle>
            <DialogDescription>
              Créez un nouvel utilisateur avec un email et mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Prénom et Nom"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Société</Label>
                <Input
                  value={newUser.companyName}
                  onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label>NIF</Label>
                <Input
                  value={newUser.nif}
                  onChange={(e) => setNewUser({ ...newUser, nif: e.target.value })}
                  placeholder="Numéro d'identification fiscale"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v as "user" | "expert" | "admin" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!newUser.email || !newUser.password || !newUser.fullName || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={18} /> Supprimer le compte
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'utilisateur sera supprimé définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
