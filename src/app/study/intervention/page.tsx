"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Info } from "lucide-react";
import { StudyTestRunner } from "@/components/study/StudyTestRunner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ControlReadingCard } from "@/data/control-modules";

export default function InterventionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [armType, setArmType] = useState<"EXPERIMENTAL" | "CONTROL" | null>(null);
  const [controlModules, setControlModules] = useState<ControlReadingCard[]>([]);
  const [participantCode, setParticipantCode] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedReflection, setSelectedReflection] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study/phase?phase=INTERVENTION", { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Etkinlik yüklenemedi.");
        setArmType(json.participant.armType);
        setParticipantCode(json.participant.anonymousParticipantId);
        setIsDemo(json.participant.isDemo);
        if (json.controlModules) {
          setControlModules(json.controlModules);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Hata oluştu."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-primary-dark">Etkinlik aşaması hazırlanıyor...</p>
      </div>
    );
  }

  if (error || !armType) {
    return (
      <div className="card-surface space-y-4 p-6 text-center">
        <p className="text-sm font-semibold text-ink">{error || "Bu aşamaya erişilemiyor."}</p>
        <Link href="/study" className="btn-primary text-sm">
          Araştırma Ekranına Dön
        </Link>
      </div>
    );
  }

  // Deney grubu (EXP_AB / EXP_BA): 12 eğitici Önyargı Avcısı senaryosu
  if (armType === "EXPERIMENTAL") {
    return <StudyTestRunner phase="INTERVENTION" />;
  }

  // Kontrol grubu (CTRL_AB / CTRL_BA): Oyunlaştırma olmadan eşdeğer 12 bilgilendirme kartı
  const card = controlModules[currentIdx];

  async function handleNextCard() {
    if (!selectedReflection) {
      setError("Lütfen devam etmeden önce düşünme sorusu için bir seçenek işaretleyin.");
      return;
    }
    setError(null);
    if (currentIdx + 1 < controlModules.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedReflection("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/study/intervention/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedItems: controlModules.length }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Tamamlama kaydedilemedi.");
      router.push("/study/posttest");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!card) return null;

  return (
    <div className="space-y-5">
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-dark">
              <BookOpen className="h-3.5 w-3.5" />
              Bilgilendirme Etkinliği (Kontrol Grubu)
            </span>
            {isDemo && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
                DEMO VERİSİ
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-bold text-ink-muted">Kod: {participantCode}</span>
        </div>
        <ProgressBar
          current={currentIdx + 1}
          total={controlModules.length}
          label="Bilgilendirme Kartı İlerlemesi"
        />
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Info className="h-3.5 w-3.5 text-primary" />
          Bu bölümde oyun puanı, rozet veya süre sınırı bulunmamaktadır.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      <article className="card-surface space-y-5 p-5 sm:p-7">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-wide text-primary">
            Bölüm {card.orderIndex} • {card.topic}
          </span>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark">{card.title}</h1>
        </div>

        <p className="text-sm leading-relaxed text-ink sm:text-base">{card.summary}</p>

        <div className="rounded-2xl bg-lavender-card p-4 text-sm leading-relaxed text-ink">
          {card.exampleCase}
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-4 text-sm font-bold text-primary-dark">
          Temel İlke: {card.keyTakeaway}
        </div>

        <div className="space-y-2.5 border-t border-lavender-border pt-4">
          <p className="text-sm font-extrabold text-ink">{card.reflectionQuestion}</p>
          <div className="space-y-2">
            {card.reflectionOptions.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
                  selectedReflection === opt
                    ? "border-primary bg-primary-soft/50 text-primary-dark"
                    : "border-lavender-border bg-white text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="control-reflection"
                  checked={selectedReflection === opt}
                  onChange={() => setSelectedReflection(opt)}
                  className="accent-primary"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleNextCard()}
            className="btn-primary w-full sm:w-auto"
          >
            {currentIdx + 1 < controlModules.length ? (
              <>
                Sonraki Kart
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                {submitting ? "Kaydediliyor..." : "Etkinliği Tamamla ve Son Teste Geç"}
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </article>
    </div>
  );
}
