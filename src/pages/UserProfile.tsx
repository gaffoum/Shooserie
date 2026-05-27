import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  LayoutGrid,
  List,
  Lock,
  Package,
  Tag,
} from "lucide-react";

import { useUserProfileByPseudo } from "@/hooks/useUserProfileByPseudo";
import { useUserSneakers, type UserSneaker } from "@/hooks/useUserSneakers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// TODO i18n: migrer les chaines en dur vers useT() une fois les cles ajoutees
//            au catalogue (cf. PseudoSetupGuard pour le pattern).

type ViewMode = "grid" | "list";
type TabKey = "all" | "for-sale";

export default function UserProfile() {
  const { pseudo } = useParams<{ pseudo: string }>();

  const profileQ = useUserProfileByPseudo(pseudo);
  const profile = profileQ.data;

  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const sneakersQ = useUserSneakers(profile?.id, tab === "for-sale");
  const sneakers = sneakersQ.data ?? [];

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const s of sneakers) if (s.brand) set.add(s.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [sneakers]);

  const filtered = useMemo(() => {
    if (brandFilter === "all") return sneakers;
    return sneakers.filter((s) => s.brand === brandFilter);
  }, [sneakers, brandFilter]);

  // ---- Loading ---------------------------------------------------
  if (profileQ.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-6 h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ---- Not found -------------------------------------------------
  if (!profile) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Utilisateur introuvable</h1>
        <p className="mb-6 text-muted-foreground">
          Aucun utilisateur ne porte le pseudo &laquo;&nbsp;{pseudo}&nbsp;&raquo;.
        </p>
        <Button asChild>
          <Link to="/">Retour a l'accueil</Link>
        </Button>
      </div>
    );
  }

  const isPrivate = profile.is_public === false;

  // ---- Render ----------------------------------------------------
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* === Header B === */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                {isPrivate && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Collection privee
                  </Badge>
                )}
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Membre depuis le{" "}
                {new Date(profile.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-6">
              {profile.sneakers_count !== null && (
                <Stat
                  value={profile.sneakers_count}
                  label="paires"
                  icon={<Package className="h-3 w-3" />}
                />
              )}
              <Stat
                value={profile.for_sale_count}
                label="en vente"
                icon={<Tag className="h-3 w-3" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Onglets A : Tout / En vente === */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="for-sale">En vente</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Filtre marque */}
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle grille / liste */}
            <div className="flex overflow-hidden rounded-md border">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                className="rounded-none"
                aria-label="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="rounded-none"
                aria-label="Vue liste"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* === Onglet : Toutes === */}
        <TabsContent value="all" className="mt-0">
          {isPrivate ? (
            <PrivateCollection />
          ) : sneakersQ.isLoading ? (
            <LoadingGrid view={view} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Aucune paire a afficher" />
          ) : (
            <SneakerListing sneakers={filtered} view={view} />
          )}
        </TabsContent>

        {/* === Onglet : En vente === */}
        <TabsContent value="for-sale" className="mt-0">
          {sneakersQ.isLoading ? (
            <LoadingGrid view={view} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Aucune paire en vente actuellement" />
          ) : (
            <SneakerListing sneakers={filtered} view={view} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =================================================================
// Sub-components
// =================================================================

function Stat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
    </div>
  );
}

function PrivateCollection() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Collection privee</h2>
        <p className="text-muted-foreground">
          Cet utilisateur a choisi de garder sa collection privee.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous pouvez tout de meme consulter ses paires en vente via l'onglet
          &laquo;&nbsp;En vente&nbsp;&raquo;.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">{message}</div>
  );
}

function LoadingGrid({ view }: { view: ViewMode }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function SneakerListing({
  sneakers,
  view,
}: {
  sneakers: UserSneaker[];
  view: ViewMode;
}) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sneakers.map((s) => (
          <Card
            key={s.id}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <div className="aspect-square bg-muted">
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt={[s.brand, s.model].filter(Boolean).join(" ")}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div className="truncate font-medium">{s.brand ?? "â€”"}</div>
              <div className="truncate text-sm text-muted-foreground">
                {s.model ?? ""}
              </div>
              {s.is_for_sale && (
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    A vendre
                  </Badge>
                  {s.price != null && (
                    <span className="text-sm font-semibold tabular-nums">
                      {s.price}&nbsp;â‚¬
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // view === "list"
  return (
    <div className="space-y-2">
      {sneakers.map((s) => (
        <Card key={s.id} className="overflow-hidden">
          <div className="flex items-center gap-4 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {[s.brand, s.model].filter(Boolean).join(" \u00b7 ") || "â€”"}
              </div>
              {s.size && (
                <div className="text-sm text-muted-foreground">
                  Taille {s.size}
                </div>
              )}
            </div>
            {s.is_for_sale && (
              <div className="shrink-0 text-right">
                <Badge variant="default" className="text-xs">
                  A vendre
                </Badge>
                {s.price != null && (
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {s.price}&nbsp;â‚¬
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}