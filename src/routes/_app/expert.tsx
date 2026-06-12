import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import {
  Users,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/expert")({
  component: ExpertDashboard,
});

function ExpertDashboard() {
  const { t, locale } = useI18n();
  const { user, profile } = useAuth();

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
      return data;
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
      return data;
    },
  });

  const pendingDeclarations = declarations.filter((d) => d.status === "draft");
  const submittedDeclarations = declarations.filter((d) => d.status === "submitted");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users size={14} /> Espace Expert
          </div>
        </div>
        <div>
          <h1 className="headline-text mt-1">Tableau de bord expert</h1>
          <p className="text-ink-muted">Gérez vos clients et suivez leurs déclarations fiscales</p>
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
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const clientProfile = client.profiles as any;
              const clientDecls = declarations.filter((d) => d.user_id === client.client_id);
              const pending = clientDecls.filter((d) => d.status === "draft").length;

              return (
                <div key={client.id} className="surface-card flex items-center justify-between">
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
                      {clientDecls.length} déclaration
                      {clientDecls.length !== 1 ? "s" : ""}
                    </div>
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
                  const clientProfile = d.profiles as any;
                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3">{clientProfile?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 uppercase">{d.type}</td>
                      <td className="px-4 py-3 text-ink-muted">{d.period_label ?? "—"}</td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {d.total_due != null ? formatCurrency(Number(d.total_due), locale) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.status === "submitted"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {d.status === "submitted" ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {d.status === "submitted" ? "Soumise" : "Brouillon"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
