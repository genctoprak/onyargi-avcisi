"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, HelpCircle, Home, Play, Star } from "lucide-react";
import { BrainMascot } from "@/components/illustrations/BrainMascot";
import { BadgeCard } from "@/components/ui/BadgeCard";
import type { BadgeDefinition } from "@/lib/scoring";

interface GameStatsResponse {
  totals: {
    totalScore: number;
    completedSessionsCount: number;
    completedScenariosCount: number;
    evidenceSuccessRate: number | null;
    uncertaintyRecognitionRate: number | null;
    evidenceAligned: number;
    evidenceTotal: number;
    uncertaintyRecognized: number;
    uncertaintyTotal: number;
    changedAfterClue: number;
    clueDecisionTotal: number;
  };
  earnedBadgeIds: string[];
  allBadges: BadgeDefinition[];
  latestSession: {
    id: string;
    mode: string;
    totalScore: number;
    evidenceScoreCount: number;
    uncertaintyRecognizedCount: number;
    timedOutCount: number;
    completedScenarios: number;
    badgesEarned: string[];
    completedAt: string | null;
  } | null;
}

export default function ResultsPage() {
  const [data, setData] = useState<GameStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/game/stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-primary-dark">Oyun sonuçları yükleniyor...</p>
      </div>
    );
  }

  const totals = data?.totals;
  const earnedSet = new Set(data?.earnedBadgeIds ?? []);

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
        <BrainMascot mood="celebrate" size={126} className="shrink-0" />
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold text-ink">
            Eğitici Oyun Özeti (Araştırma Raporundan Ayrıdır)
          </span>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark sm:text-3xl">
            Dedektiflik Sonuçların ve İstatistiklerin
          </h1>
          <p className="text-sm text-ink-muted">
            Bu ekrandaki puanlar ve rozetler yalnızca eğitici oyun oturumlarını yansıtır; bilimsel
            araştırma ölçüm göstergeleriyle karıştırılmaz.
          </p>
        </div>
      </section>

      {/* Özet Kartları */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile
          icon={Star}
          label="Toplam Oyun Puanı"
          value={String(totals?.totalScore ?? 0)}
          sub="Kanıta dayalı puan"
        />
        <StatTile
          icon={CheckCircle2}
          label="Tamamlanan Senaryo"
          value={String(totals?.completedScenariosCount ?? 0)}
          sub={`${totals?.completedSessionsCount ?? 0} oyun oturumu`}
        />
        <StatTile
          icon={Award}
          label="Kanıt Kullanma Başarısı"
          value={totals?.evidenceSuccessRate !== null && totals?.evidenceSuccessRate !== undefined ? `%${totals.evidenceSuccessRate}` : "—"}
          sub={`${totals?.evidenceAligned ?? 0} / ${totals?.evidenceTotal ?? 0} kanıtlı olay`}
        />
        <StatTile
          icon={HelpCircle}
          label="Belirsizliği Tanıma"
          value={
            totals?.uncertaintyRecognitionRate !== null && totals?.uncertaintyRecognitionRate !== undefined
              ? `%${totals.uncertaintyRecognitionRate}`
              : "—"
          }
          sub={`${totals?.uncertaintyRecognized ?? 0} / ${totals?.uncertaintyTotal ?? 0} belirsiz olay`}
        />
      </section>

      {/* Kazanılan Rozetler */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-primary-dark">
            Kazanılan Rozetler ({earnedSet.size} / {data?.allBadges.length ?? 0})
          </h2>
          <Link href="/badges" className="text-xs font-bold text-primary hover:underline">
            Tümünü gör
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.allBadges ?? []).map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned={earnedSet.has(badge.id)} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/play" className="btn-primary">
          <Play className="h-4 w-4" />
          Yeni Oyun Oyna
        </Link>
        <Link href="/" className="btn-secondary">
          <Home className="h-4 w-4" />
          Ana Menüye Dön
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card-surface p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 font-display text-2xl font-extrabold text-primary-dark">{value}</div>
      <div className="text-xs font-bold text-ink">{label}</div>
      <div className="mt-0.5 text-[11px] text-ink-muted">{sub}</div>
    </div>
  );
}
