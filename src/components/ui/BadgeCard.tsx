"use client";

import React from "react";
import { Award, Lightbulb, Scale, Search, Shield, Sparkles, Lock } from "lucide-react";
import type { BadgeDefinition } from "@/lib/scoring";

const ICONS = {
  search: Search,
  scale: Scale,
  lightbulb: Lightbulb,
  shield: Shield,
  sparkles: Sparkles,
  award: Award,
};

export function BadgeCard({
  badge,
  earned,
}: {
  badge: BadgeDefinition;
  earned: boolean;
}) {
  const Icon = ICONS[badge.icon] ?? Award;

  return (
    <div
      className={`rounded-3xl border p-4 transition-all ${
        earned
          ? "border-accent bg-gradient-to-br from-white to-accent-soft/60 shadow-card"
          : "border-lavender-border bg-white/70 opacity-75"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            earned ? "bg-accent text-ink shadow-sm" : "bg-lavender-bg text-ink-subtle"
          }`}
        >
          {earned ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-ink">{badge.title}</h3>
            {earned ? (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-dark">
                Kazanıldı
              </span>
            ) : (
              <span className="rounded-full bg-lavender-bg px-2 py-0.5 text-[11px] font-bold text-ink-muted">
                Kilitli
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{badge.description}</p>
          <p className="mt-2 text-[11px] font-semibold text-primary-dark">
            Ölçüt: {badge.criteriaText}
          </p>
        </div>
      </div>
    </div>
  );
}
