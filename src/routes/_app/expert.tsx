import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { searchUsersByNif, addExpertClient, removeExpertClient, saveClientDeclaration } from "@/lib/admin-service";
import { calculateG50, G50_OPERATION_LINES, emptyDeductions, type DeductionsInput, type G50Input, type OperationLineInput } from "@/lib/engines/tva";
import { generateId } from "@/lib/utils";
import { downloadG50Pdf, type G50CompanyInfo } from "@/lib/pdf/g50-pdf";
import {
  Users,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Search,
  UserPlus,
  UserMinus,
  X,
  Receipt,
  Calculator,
  Building2,
  Fuel,
  Coins,
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expert")({
  component: ExpertDashboard,
});

type ClientDetail = {
  id: string;
  client_id: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    company_name: string | null;
    nif: string | null;
  } | null;
};

type Declaration = {
  id: string;
  user_id: string;
  type: string;
  period_label: string | null;
  total_due: string | number | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; company_name: string | null } | null;
};

interface DraftLine extends OperationLineInput {
  id: string;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DECLARATION_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; route: string }> = {
  g50: { icon: Receipt, label: "G50 TVA", route: "/g50" },
  irg: { icon: Calculator, label: "IRG", route: "/irg" },
  ibs: { icon: Building2, label: "IBS", route: "/ibs" },
  tfpc: { icon: Fuel, label: "TFPC", route: "/tfpc" },
  withholding: { icon: Coins, label: "Retenue à la source", route: "/withholding" },
};

function ExpertDashboard() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; full_name: string | null; company_name: string | null; nif: string | null }>>([]);
  const [searching, setSearching] = useState(false);

  const [g50DialogOpen, setG50DialogOpen] = useState(false);
  const [g50Company, setG50Company] = useState<G50CompanyInfo>({ raisonSociale: "", nif: "", activite: "", adresse: "" });
  const [g50Period, setG50Period] = useState<{ kind: "monthly" | "quarterly"; year: number; month?: number; quarter?: number }>({ kind: "monthly", year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [g50Lines, setG50Lines] = useState<DraftLine[]>([{ id: generateId(), code: "E3B8", caHT: 0 }]);
  const [g50Deductions, setG50Deductions] = useState<DeductionsInput>(emptyDeductions());

  // Fetch clients assigned to this expert
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["expert-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_clients")
        .select("*, profiles!client_id(full_name, company_name, nif)")
        .eq("expert_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as ClientDetail[];
    },
  });

  // Fetch declarations for all clients
  const { data: declarations = [], isLoading: declLoading } = useQuery({
    queryKey: ["expert-declarations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const clientIds = clients.map((c) => c.client_id);
      if (clientIds.length === 0) return [];
      const { data, error } = await supabase
        .from("declarations")
        .select("*, profiles!user_id(full_name, company_name)")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Declaration[];
    },
  });

  const pendingDeclarations = declarations.filter((d) => d.status === "draft");
  const submittedDeclarations = declarations.filter((d) => d.status === "submitted");

  const addClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      return addExpertClient({ expertId: user.id, clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-clients"] });
      queryClient.invalidateQueries({ queryKey: ["expert-declarations"] });
      setAddModalOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Client ajouté avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeClientMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return removeExpertClient({ assignmentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-clients"] });
      queryClient.invalidateQueries({ queryKey: ["expert-declarations"] });
      toast.success("Client retiré");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const saveG50Mutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("No client selected");
      const input: G50Input = {
        period: g50Period,
        operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })),
        deductions: g50Deductions,
      };
      const result = calculateG50(input);
      const totalDue = result.precompteAReporter > 0 ? -result.precompteAReporter : result.totalTvaAPayer;
      const periodLabel = g50Period.kind === "monthly" && g50Period.month
        ? `${g50Period.month}/${g50Period.year}` : `T${g50Period.quarter}/${g50Period.year}`;
      return saveClientDeclaration({
        clientId: selectedClient.client_id,
        type: "g50",
        fiscalYear: g50Period.year,
        periodLabel,
        input,
        result,
        totalDue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-declarations"] });
      toast.success("Déclaration G50 enregistrée");
      setG50DialogOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsersByNif({ query: searchQuery.trim() });
      setSearchResults(results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  // Filter declarations for selected client
  const clientDeclarations = selectedClient
    ? declarations.filter((d) => d.user_id === selectedClient.client_id)
    : [];

  const existingClientIds = new Set(clients.map((c) => c.client_id));

  if (selectedClient) {
    const profile = selectedClient.profiles;
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedClient(null)}
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} /> Retour aux clients
        </button>

        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
              {profile?.full_name?.charAt(0) ?? "?"}
            </div>
            <div>
              <h1 className="headline-text">{profile?.full_name ?? "Client"}</h1>
              <p className="text-ink-muted">
                {profile?.company_name ?? "—"} · NIF: {profile?.nif ?? "—"}
              </p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileText size={20} />
              </div>
              <div>
                <div className="title-text text-2xl">{clientDeclarations.length}</div>
                <div className="text-xs text-ink-muted">Déclarations</div>
              </div>
            </div>
          </div>
          <div className="surface-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2 text-warning">
                <Clock size={20} />
              </div>
              <div>
                <div className="title-text text-2xl">{clientDeclarations.filter((d) => d.status === "draft").length}</div>
                <div className="text-xs text-ink-muted">En attente</div>
              </div>
            </div>
          </div>
          <div className="surface-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2 text-success">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="title-text text-2xl">{clientDeclarations.filter((d) => d.status === "submitted").length}</div>
                <div className="text-xs text-ink-muted">Soumises</div>
              </div>
            </div>
          </div>
        </div>

        {/* Declarations */}
        <section>
          <h2 className="title-text mb-3">Déclarations</h2>
          {clientDeclarations.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
              <FileText size={32} className="mb-2 text-ink-muted" />
              <p className="text-ink-muted">Aucune déclaration pour ce client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientDeclarations.map((d) => {
                const config = DECLARATION_TYPE_CONFIG[d.type];
                const Icon = config?.icon ?? FileText;
                return (
                  <div key={d.id} className="surface-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-medium">{config?.label ?? d.type}</div>
                        <div className="text-xs text-ink-muted">{d.period_label ?? "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium tabular-nums">
                          {d.total_due != null ? formatCurrency(Number(d.total_due), locale) : "—"}
                        </div>
                        <Badge
                          variant={d.status === "submitted" ? "default" : "secondary"}
                          className={d.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                        >
                          {d.status === "submitted" ? "Soumise" : "Brouillon"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="title-text mb-3">Actions rapides</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DECLARATION_TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              if (key === "g50") {
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const p = selectedClient?.profiles;
                      setG50Company({
                        raisonSociale: p?.full_name ?? "",
                        nif: p?.nif ?? "",
                        activite: "",
                        adresse: "",
                      });
                      setG50Lines([{ id: generateId(), code: "E3B8", caHT: 0 }]);
                      setG50Deductions(emptyDeductions());
                      setG50DialogOpen(true);
                    }}
                  >
                    <Icon size={16} />
                    {config.label}
                  </Button>
                );
              }
              return (
                <Button
                  key={key}
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate({ to: config.route as "/g50" | "/irg" | "/ibs" | "/tfpc" | "/withholding" })}
                >
                  <Icon size={16} />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users size={14} /> Espace Expert
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="headline-text mt-1">Tableau de bord expert</h1>
            <p className="text-ink-muted">Gérez vos clients et suivez leurs déclarations fiscales</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="inline-flex items-center gap-2">
            <UserPlus size={16} />
            Ajouter un client
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
              <div className="title-text text-2xl">{clients.length}</div>
              <div className="text-xs text-ink-muted">Clients actifs</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <Clock size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{pendingDeclarations.length}</div>
              <div className="text-xs text-ink-muted">En attente</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2 text-success">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{submittedDeclarations.length}</div>
              <div className="text-xs text-ink-muted">Soumises</div>
            </div>
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 text-ink-muted">
              <FileText size={20} />
            </div>
            <div>
              <div className="title-text text-2xl">{declarations.length}</div>
              <div className="text-xs text-ink-muted">Total déclarations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="title-text">Mes clients</h2>
        </div>
        {clientsLoading ? (
          <div className="surface-card space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : clients.length === 0 ? (
          <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-ink-muted">
              <Users size={32} />
            </div>
            <h3 className="title-text">Aucun client</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              Ajoutez des clients pour commencer à gérer leurs déclarations fiscales.
            </p>
            <Button onClick={() => setAddModalOpen(true)} className="mt-4" variant="outline">
              <UserPlus size={16} className="mr-2" />
              Ajouter un client
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const clientProfile = client.profiles;
              const clientDecls = declarations.filter((d) => d.user_id === client.client_id);
              const pending = clientDecls.filter((d) => d.status === "draft").length;

              return (
                <div
                  key={client.id}
                  className="surface-card flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {clientProfile?.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <div className="label-text">
                        {clientProfile?.full_name ?? "Client sans nom"}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {clientProfile?.company_name ?? "—"} · NIF: {clientProfile?.nif ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {pending > 0 && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                        <AlertTriangle size={12} /> {pending} en attente
                      </div>
                    )}
                    <div className="text-sm text-ink-muted">
                      {clientDecls.length} déclaration{clientDecls.length !== 1 ? "s" : ""}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeClientMutation.mutate(client.id);
                      }}
                      className="rounded-lg p-1 text-ink-muted hover:bg-destructive/10 hover:text-destructive"
                    >
                      <UserMinus size={16} />
                    </button>
                    <ChevronRight size={16} className="text-ink-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Declarations */}
      <section>
        <h2 className="title-text mb-3">Déclarations récentes</h2>
        {declLoading ? (
          <div className="surface-card space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : declarations.length === 0 ? (
          <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4 text-ink-muted">
              <FileText size={32} />
            </div>
            <h3 className="title-text">Aucune déclaration</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              Les déclarations de vos clients apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="surface-card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-start label-text">Client</th>
                  <th className="px-4 py-3 text-start label-text">Type</th>
                  <th className="px-4 py-3 text-start label-text">Période</th>
                  <th className="px-4 py-3 text-end label-text">Montant</th>
                  <th className="px-4 py-3 text-center label-text">Statut</th>
                </tr>
              </thead>
              <tbody>
                {declarations.slice(0, 10).map((d) => {
                  const clientProfile = d.profiles;
                  const config = DECLARATION_TYPE_CONFIG[d.type];
                  const Icon = config?.icon ?? FileText;
                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-ink-muted" />
                          {clientProfile?.full_name ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 uppercase">{d.type}</td>
                      <td className="px-4 py-3 text-ink-muted">{d.period_label ?? "—"}</td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {d.total_due != null ? formatCurrency(Number(d.total_due), locale) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={d.status === "submitted" ? "default" : "secondary"}
                          className={d.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                        >
                          {d.status === "submitted" ? (
                            <CheckCircle size={12} className="mr-1" />
                          ) : (
                            <Clock size={12} className="mr-1" />
                          )}
                          {d.status === "submitted" ? "Soumise" : "Brouillon"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Client Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
            <DialogDescription>
              Recherchez un client par son nom, sa société ou son NIF.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Nom, société ou NIF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? "..." : <Search size={16} />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((result) => {
                const alreadyAdded = existingClientIds.has(result.id);
                return (
                  <div key={result.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <div className="font-medium">{result.full_name ?? "—"}</div>
                      <div className="text-xs text-ink-muted">
                        {result.company_name ?? "—"} · NIF: {result.nif ?? "—"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyAdded ? "ghost" : "default"}
                      disabled={alreadyAdded || addClientMutation.isPending}
                      onClick={() => addClientMutation.mutate(result.id)}
                    >
                      {alreadyAdded ? "Déjà ajouté" : "Ajouter"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-center text-sm text-ink-muted">Aucun utilisateur trouvé.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* G50 Creation Dialog */}
      <Dialog open={g50DialogOpen} onOpenChange={setG50DialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle déclaration G50</DialogTitle>
            <DialogDescription>Créez une déclaration G50 pour {selectedClient?.profiles?.full_name ?? "ce client"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="label-text mb-2">Identification</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-text mb-1 block text-xs">Raison sociale</label>
                  <Input value={g50Company.raisonSociale} onChange={(e) => setG50Company({ ...g50Company, raisonSociale: e.target.value })} />
                </div>
                <div>
                  <label className="label-text mb-1 block text-xs">NIF</label>
                  <Input value={g50Company.nif} onChange={(e) => setG50Company({ ...g50Company, nif: e.target.value })} />
                </div>
                <div>
                  <label className="label-text mb-1 block text-xs">Activité</label>
                  <Input value={g50Company.activite} onChange={(e) => setG50Company({ ...g50Company, activite: e.target.value })} />
                </div>
                <div>
                  <label className="label-text mb-1 block text-xs">Adresse</label>
                  <Input value={g50Company.adresse} onChange={(e) => setG50Company({ ...g50Company, adresse: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="label-text mb-2">Période</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="inline-flex rounded-lg border border-border p-1">
                  {(["monthly", "quarterly"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setG50Period({ ...g50Period, kind: k, month: k === "monthly" ? (g50Period.month ?? 1) : undefined, quarter: k === "quarterly" ? (g50Period.quarter ?? 1) : undefined })}
                      className={`rounded-md px-3 py-1 text-sm ${g50Period.kind === k ? "bg-primary text-primary-foreground" : "text-ink-muted"}`}
                    >
                      {k === "monthly" ? "Mensuel" : "Trimestriel"}
                    </button>
                  ))}
                </div>
                {g50Period.kind === "monthly" ? (
                  <select value={g50Period.month ?? 1} onChange={(e) => setG50Period({ ...g50Period, month: Number(e.target.value) })} className="rounded-lg border border-input bg-surface px-3 py-2 text-sm">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                ) : (
                  <select value={g50Period.quarter ?? 1} onChange={(e) => setG50Period({ ...g50Period, quarter: Number(e.target.value) })} className="rounded-lg border border-input bg-surface px-3 py-2 text-sm">
                    {[1, 2, 3, 4].map((q) => <option key={q} value={q}>T{q}</option>)}
                  </select>
                )}
                <input type="number" value={g50Period.year} onChange={(e) => setG50Period({ ...g50Period, year: Number(e.target.value) })} className="w-24 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums" />
              </div>
            </div>

            <div>
              <h3 className="label-text mb-2">Opérations imposables</h3>
              <div className="space-y-2">
                {g50Lines.map((line) => (
                  <div key={line.id} className="flex items-center gap-2">
                    <select value={line.code} onChange={(e) => setG50Lines((prev) => prev.map((l) => l.id === line.id ? { ...l, code: e.target.value } : l))} className="flex-1 rounded-lg border border-input bg-surface px-3 py-2 text-sm">
                      {G50_OPERATION_LINES.map((d) => (
                        <option key={d.code} value={d.code}>{d.code} — {d.label} {d.kind === "exonere" ? "(exonéré)" : `(${(d.rate * 100).toFixed(0)}%)`}</option>
                      ))}
                    </select>
                    <input type="number" min={0} value={line.caHT || ""} onChange={(e) => setG50Lines((prev) => prev.map((l) => l.id === line.id ? { ...l, caHT: Number(e.target.value) } : l))} placeholder="CA HT" className="w-32 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums" />
                    <button onClick={() => setG50Lines((prev) => prev.filter((l) => l.id !== line.id))} className="rounded-lg p-2 text-ink-muted hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setG50Lines((prev) => [...prev, { id: generateId(), code: "E3B8", caHT: 0 }])}>
                  <Plus size={14} /> Ajouter
                </Button>
              </div>
            </div>

            <div>
              <h3 className="label-text mb-2">Déductions</h3>
              <div className="space-y-2">
                {([
                  { code: "E3B90", label: "Précompte antérieur", key: "precompteAnterieur" as const },
                  { code: "E3B91", label: "TVA sur achats biens/services (art. 29)", key: "tvaAchatsBiensServices" as const },
                  { code: "E3B92", label: "TVA sur achat de biens (art. 38)", key: "tvaAchatsBiens" as const },
                  { code: "E3B93", label: "Régularisation prorata", key: "proRataDeductionComplementaire" as const },
                  { code: "E3B94", label: "TVA factures annulées/impayées (art. 18)", key: "tvaFacturesAnnulees" as const },
                  { code: "E3B95", label: "Autres déductions", key: "autresDeductions" as const },
                ]).map(({ code, label, key }) => (
                  <div key={code} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-muted w-16">{code}</span>
                    <span className="flex-1 text-sm">{label}</span>
                    <input type="number" min={0} value={g50Deductions[key] || ""} onChange={(e) => setG50Deductions({ ...g50Deductions, [key]: Number(e.target.value) })} className="w-32 rounded-lg border border-input bg-surface px-3 py-2 text-sm tabular-nums" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="label-text mb-2">Récapitulatif</h3>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <SummaryRow label="CA imposable HT" value={(() => { const r = calculateG50({ period: g50Period, operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })), deductions: g50Deductions }); return formatCurrency(r.totalCAImposable, locale); })()} />
                <SummaryRow label="CA exonéré" value={(() => { const r = calculateG50({ period: g50Period, operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })), deductions: g50Deductions }); return formatCurrency(r.totalCAExonere, locale); })()} />
                <div className="h-px bg-border" />
                <SummaryRow label="Total déductions" value={(() => { const r = calculateG50({ period: g50Period, operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })), deductions: g50Deductions }); return `− ${formatCurrency(r.totalDeductions, locale)}`; })()} />
                {(() => { const r = calculateG50({ period: g50Period, operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })), deductions: g50Deductions }); return r.precompteAReporter > 0 ? (
                  <div className="rounded-lg bg-primary/5 p-3 text-center">
                    <div className="text-xs text-primary uppercase tracking-wider">Crédit de TVA</div>
                    <div className="text-2xl font-bold tabular-nums text-primary">{formatCurrency(r.precompteAReporter, locale)}</div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-surface p-3 text-center">
                    <div className="text-xs text-ink-muted uppercase tracking-wider">TVA à payer</div>
                    <div className="text-2xl font-bold tabular-nums">{formatCurrency(r.totalTvaAPayer, locale)}</div>
                  </div>
                ); })()}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="gap-2" onClick={() => {
              const input: G50Input = { period: g50Period, operations: g50Lines.map((l) => ({ code: l.code, caHT: l.caHT })), deductions: g50Deductions };
              const result = calculateG50(input);
              downloadG50Pdf(g50Company, input, result);
              toast.success("PDF G50 exporté");
            }}>
              <Download size={16} /> Exporter PDF
            </Button>
            <Button className="gap-2" onClick={() => saveG50Mutation.mutate()} disabled={saveG50Mutation.isPending}>
              {saveG50Mutation.isPending ? "..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="tabular-nums text-sm font-medium">{value}</span>
    </div>
  );
}