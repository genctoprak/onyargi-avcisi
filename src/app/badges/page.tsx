"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Play } from "lucide-react";
import { BadgeCard } from "@/components/ui/BadgeCard";
import type { BadgeDefinition } from "@/lib/scoring";

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/game/stats")
      .then((r) => r.json())
      .then((d) => {
        setBadges(d.allBadges ?? []);
        setEarnedIds(d.earnedBadgeIds ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const earnedSet = new Set(earnedIds);

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold text-ink">
            <Award className="h-3.5 w-3.5 text-accent-dark" />
            Rozet Koleksiyonu
          </span>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark sm:text-3xl">
            Rozetlerim
          </h1>
          <p className="text-sm text-ink-muted">
            Rozetler, görünüşe göre rastgele tahminlerle değil; kanıt kullanımı, belirsizliği
            tanıma ve yeni bilgiye göre görüş güncelleme davranışlarıyla kazanılır.
          </p>
        </div>
        <Link href="/play" className="btn-primary shrink-0 text-sm">
          <Play className="h-4 w-4" />
          Oyuna Git
        </Link>
      </section>

      {loading ? (
        <div className="card-surface p-8 text-center text-sm text-ink-muted">Rozetler yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned={earnedSet.has(badge.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
