import { startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, leadActivities, users, userLocations } from "@/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STAGES } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";
import { StageBarChart } from "./_components/stage-bar-chart";
import { PeriodSelector } from "./period-selector";
import { Leaderboard, type LeaderboardEntry } from "./leaderboard";
import { requireUser } from "@/lib/current-user";
import { generalLeadScope, canSeeLeaderboardDetail } from "@/lib/rbac";
import { Users as UsersIcon, TrendingUp, Trophy, XCircle, Percent, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function resolveRange(period: string, from?: string, to?: string) {
  const now = new Date();
  if (period === "quarter") return { start: startOfQuarter(now), end: now };
  if (period === "year") return { start: startOfYear(now), end: now };
  if (period === "custom" && from) {
    return { start: new Date(from), end: to ? new Date(to) : now };
  }
  return { start: startOfMonth(now), end: now };
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const sp = await searchParams;
  const period = typeof sp.period === "string" ? sp.period : "month";
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const { start, end } = resolveRange(period, from, to);

  const db = getDb();
  const scope = generalLeadScope(user);

  // Real-time: current pipeline + workload, unaffected by period.
  const allLeads = await db
    .select({
      id: leads.id,
      stage: leads.stage,
      status: leads.status,
      value: leads.value,
      brand: leads.brand,
      source: leads.source,
      sellerId: leads.sellerId,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(scope);

  const active = allLeads.filter((l) => l.status === "active");
  const pipelineValue = active.reduce((sum, l) => sum + Number(l.value), 0);
  const stageData = STAGES.map((s) => ({
    stage: s.value,
    label: s.label,
    color: s.color,
    count: active.filter((l) => l.stage === s.value).length,
  }));

  // Historical: filtered by selected period.
  const periodLeads = allLeads.filter((l) => l.createdAt >= start && l.createdAt <= end);
  const wonInPeriod = periodLeads.filter((l) =>
    ["kunde_vunnet", "bil_levert", "ferdig"].includes(l.stage)
  );
  const lostInPeriod = periodLeads.filter((l) => l.status === "lost");
  const winRate =
    wonInPeriod.length + lostInPeriod.length > 0
      ? Math.round((wonInPeriod.length / (wonInPeriod.length + lostInPeriod.length)) * 100)
      : 0;

  const brandCounts = new Map<string, number>();
  for (const l of periodLeads) {
    const key = l.brand ?? "Ukjent";
    brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
  }
  const brandColors = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];
  const brandData = [...brandCounts.entries()].map(([brand, count], i) => ({
    stage: brand,
    label: brand,
    color: brandColors[i % brandColors.length],
    count,
  }));

  const sourceCounts = new Map<string, number>();
  for (const l of periodLeads) {
    const key = l.source ?? "Ukjent";
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const sourceData = [...sourceCounts.entries()].map(([source, count], i) => ({
    stage: source,
    label: source,
    color: brandColors[i % brandColors.length],
    count,
  }));

  // Gamification: activities within period, scoped to visible leads.
  const activityRows = await db
    .select({ type: leadActivities.type, userId: leadActivities.userId, leadId: leadActivities.leadId })
    .from(leadActivities)
    .innerJoin(leads, eq(leadActivities.leadId, leads.id))
    .where(
      and(
        gte(leadActivities.createdAt, start),
        lte(leadActivities.createdAt, end),
        scope ?? undefined
      )
    );

  const sellers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "selger"));

  const scopedSellerIds =
    user.role === "salgsleder"
      ? await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(userLocations, eq(userLocations.userId, users.id))
          .where(eq(users.role, "selger"))
          .then((rows) => new Set(rows.map((r) => r.id)))
      : null;

  const relevantSellers =
    user.role === "administrator"
      ? sellers
      : user.role === "salgsleder"
        ? sellers.filter((s) => scopedSellerIds?.has(s.id))
        : sellers.filter((s) => s.id === user.id);

  const leaderboard: LeaderboardEntry[] = relevantSellers.map((seller) => {
    const own = activityRows.filter((a) => a.userId === seller.id);
    const acceptedCount = own.filter((a) => a.type === "akseptert").length;
    const tilbudCount = own.filter(
      (a) => a.type === "tilbud_gitt" || a.type === "provekjoring_booket"
    ).length;
    const vunnetCount = own.filter((a) => a.type === "kontrakt_skrevet").length;
    return {
      userId: seller.id,
      name: seller.name,
      leads: acceptedCount,
      tilbud: tilbudCount,
      vunnet: vunnetCount,
      points: acceptedCount * 1 + tilbudCount * 2 + vunnetCount * 5,
    };
  });

  const kpis = [
    { label: "Nye leads i perioden", value: periodLeads.length.toLocaleString(), icon: UsersIcon },
    { label: "Aktiv pipeline-verdi", value: formatCurrency(pipelineValue), icon: TrendingUp },
    {
      label: "Vunnet i perioden",
      value: wonInPeriod.length.toLocaleString(),
      icon: Trophy,
    },
    { label: "Tapt i perioden", value: lostInPeriod.length.toLocaleString(), icon: XCircle },
    { label: "Vinnrate", value: `${winRate}%`, icon: Percent },
  ];

  const exportParams = new URLSearchParams({ period, ...(from ? { from } : {}), ...(to ? { to } : {}) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Oversikt over pipeline og ytelse.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector period={period} from={from} to={to} />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`/api/export/leads?${exportParams.toString()}`} />}
          >
            <Download className="size-4" />
            Eksporter CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <kpi.icon className="size-3.5" />
                {kpi.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold tracking-tight">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktive leads per stadium</CardTitle>
            <CardDescription>Sanntid — uavhengig av valgt periode.</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <EmptyChartState message="Ingen aktive leads." />
            ) : (
              <StageBarChart data={stageData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads per merke</CardTitle>
            <CardDescription>I valgt periode.</CardDescription>
          </CardHeader>
          <CardContent>
            {brandData.length === 0 ? (
              <EmptyChartState message="Ingen data for perioden." />
            ) : (
              <StageBarChart data={brandData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kilde-sammenligning</CardTitle>
            <CardDescription>Nettside vs. Facebook Lead Ads m.fl. i valgt periode.</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <EmptyChartState message="Ingen data for perioden." />
            ) : (
              <StageBarChart data={sourceData} />
            )}
          </CardContent>
        </Card>

        <Leaderboard
          entries={leaderboard}
          currentUserId={user.id}
          detailed={canSeeLeaderboardDetail(user)}
        />
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
