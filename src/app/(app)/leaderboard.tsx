import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { Trophy } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];

export type LeaderboardEntry = {
  userId: string;
  name: string;
  points: number;
  leads: number;
  tilbud: number;
  vunnet: number;
};

export function Leaderboard({
  entries,
  currentUserId,
  detailed,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
  detailed: boolean;
}) {
  const sorted = [...entries].sort((a, b) => b.points - a.points);
  const myIndex = sorted.findIndex((e) => e.userId === currentUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-4" />
          Selger-rangering
        </CardTitle>
        <CardDescription>Poeng = Leads × 1 + Tilbud/Prøvekjøring × 2 + Vunnet × 5</CardDescription>
      </CardHeader>
      <CardContent>
        {!detailed ? (
          <p className="py-4 text-sm text-muted-foreground">
            {myIndex >= 0
              ? `Du er nr. ${myIndex + 1} av ${sorted.length} selgere med ${sorted[myIndex].points} poeng.`
              : "Ingen poeng registrert i denne perioden ennå."}
          </p>
        ) : sorted.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Ingen data for denne perioden.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {sorted.map((entry, i) => (
              <li
                key={entry.userId}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-base">{MEDALS[i] ?? i + 1}</span>
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{initials(entry.name)}</AvatarFallback>
                  </Avatar>
                  <span className={entry.userId === currentUserId ? "font-semibold" : ""}>
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{entry.leads} leads</span>
                  <span>{entry.tilbud} tilbud</span>
                  <span>{entry.vunnet} vunnet</span>
                  <span className="w-12 text-right font-semibold text-foreground">
                    {entry.points} p
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
