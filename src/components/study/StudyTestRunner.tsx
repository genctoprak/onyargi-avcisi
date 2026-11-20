"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  Search,
} from "lucide-react";
import { CharacterAvatar } from "@/components/illustrations/CharacterAvatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DECISION_REASONS } from "@/data/scenarios-manifest";

type StudyPhase = "PRETEST" | "INTERVENTION" | "POSTTEST" | "FOLLOWUP";
type ChoiceValue = "A" | "B" | "UNKNOWN";

interface SanitizedStudyScenario {
  id: string;
  version: string;
  formId: string;
  orderIndex: number;
  title: string;
  valueCategory: string;
  scenarioType: "B" | "K" | "Y";
  eventText: string;
  researchQuestion: string;
  availableChoices: ChoiceValue[];
  hasClueStage: boolean;
  hasSecondClue: boolean;
  requiresInterpretationRating: boolean;
  visual: {
    pairId: string;
    pairVersion: string;
    visualVariantId: string;
    displayedCharacterOrder: "AB" | "BA";
    leftVisualKey: string;
    rightVisualKey: string;
    isDemoMaterial: boolean;
    approvedForResearch: boolean;
  };
  clue1: string | null;
  clue2: string | null;
}

interface PhaseResponseData {
  participant: {
    anonymousParticipantId: string;
    isDemo: boolean;
    groupAssignment: string;
    armType: "EXPERIMENTAL" | "CONTROL";
    pretestForm: string;
    posttestForm: string;
    currentPhase: string;
  };
  session: {
    id: string;
    phase: StudyPhase;
    testForm: string;
    currentIndex: number;
    totalItems: number;
    completionStatus: string;
  };
  stage: "FIRST_DECISION" | "CLUE1" | "CLUE2" | "DONE";
  currentScenario: SanitizedStudyScenario | null;
}

const PHASE_TITLES: Record<StudyPhase, string> = {
  PRETEST: "Bilimsel Ön Test",
  INTERVENTION: "Eğitim Aşaması (Deney Grubu)",
  POSTTEST: "Bilimsel Son Test",
  FOLLOWUP: "İzleme Testi",
};

/**
 * Bilimsel ölçüm ekranı (PRETEST / POSTTEST / FOLLOWUP) ve Deney Grubu eğitim aşaması.
 *
 * ÖNEMLİ BİLİMSEL KURAL:
 * PRETEST, POSTTEST ve FOLLOWUP aşamalarında:
 * - Süre baskısı YOKTUR.
 * - Puan ve rozet YOKTUR.
 * - Doğru/yanlış geri bildirimi veya öğretici açıklama YOKTUR.
 */
export function StudyTestRunner({ phase }: { phase: StudyPhase }) {
  const router = useRouter();
  const isMeasurementTest = phase === "PRETEST" || phase === "POSTTEST" || phase === "FOLLOWUP";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PhaseResponseData | null>(null);

  const [stage, setStage] = useState<"FIRST_DECISION" | "CLUE1" | "CLUE2" | "FEEDBACK" | "DONE">(
    "FIRST_DECISION",
  );
  const [firstChoice, setFirstChoice] = useState<ChoiceValue | null>(null);
  const [firstConfidence, setFirstConfidence] = useState<number>(3);
  const [firstReason, setFirstReason] = useState<string>("");
  const [firstReasonOther, setFirstReasonOther] = useState<string>("");
  const [interpBefore, setInterpBefore] = useState<number>(3);

  const [clue1, setClue1] = useState<string | null>(null);
  const [clue2, setClue2] = useState<string | null>(null);
  const [decisionMode, setDecisionMode] = useState<"KEEP" | "CHANGE" | "STILL_UNKNOWN" | null>(null);
  const [secondChoice, setSecondChoice] = useState<ChoiceValue | null>(null);
  const [secondConfidence, setSecondConfidence] = useState<number>(3);
  const [interpAfter, setInterpAfter] = useState<number>(3);

  // Only populated during experimental INTERVENTION — NEVER in PRETEST/POSTTEST/FOLLOWUP
  const [interventionFeedback, setInterventionFeedback] = useState<{
    verifiedActorLabel: string;
    contextExplanation: string;
    teachingMessage: string;
  } | null>(null);

  const scenarioStartedAtRef = useRef<string>(new Date().toISOString());

  const resetItemInputs = useCallback(() => {
    setFirstChoice(null);
    setFirstConfidence(3);
    setFirstReason("");
    setFirstReasonOther("");
    setInterpBefore(3);
    setClue1(null);
    setClue2(null);
    setDecisionMode(null);
    setSecondChoice(null);
    setSecondConfidence(3);
    setInterpAfter(3);
    setInterventionFeedback(null);
    scenarioStartedAtRef.current = new Date().toISOString();
  }, []);

  const loadPhase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/phase?phase=${phase}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Aşama verisi yüklenemedi.");
        setData(null);
        return;
      }
      setData(json);
      resetItemInputs();
      if (json.session?.completionStatus === "COMPLETED" || !json.currentScenario) {
        setStage("DONE");
      } else {
        setStage(json.stage ?? "FIRST_DECISION");
        setClue1(json.currentScenario.clue1 ?? null);
        setClue2(json.currentScenario.clue2 ?? null);
      }
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }, [phase, resetItemInputs]);

  useEffect(() => {
    void loadPhase();
  }, [loadPhase]);

  // Keyboard selection (1=A, 2=B, 3=Yeterli bilgim yok)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
        return;
      }
      if (stage === "FIRST_DECISION") {
        if (e.key === "1") setFirstChoice("A");
        else if (e.key === "2") setFirstChoice("B");
        else if (e.key === "3") setFirstChoice("UNKNOWN");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage]);

  async function handleFirstSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.currentScenario) return;
    if (!firstChoice) {
      setError("Lütfen bir seçenek işaretleyin (Karakter A, Karakter B veya Yeterli bilgim yok).");
      return;
    }
    if (!firstReason) {
      setError("Lütfen karar gerekçenizi seçin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/first-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: data.session.id,
          scenarioId: data.currentScenario.id,
          displayedChoice: firstChoice,
          confidence: firstConfidence,
          reason: firstReason,
          reasonOther: firstReason === "diger" ? firstReasonOther : null,
          interpretationBefore: data.currentScenario.requiresInterpretationRating
            ? interpBefore
            : null,
          scenarioStartedAt: scenarioStartedAtRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İlk yanıt kaydedilemedi.");

      if (json.stage === "NEXT") {
        // B (belirsizlik) maddesi ölçüm testinde gereksiz ipucu olmadan ilerler
        await loadPhase();
      } else {
        setClue1(json.clue1 ?? null);
        setSecondChoice(firstChoice);
        setSecondConfidence(firstConfidence);
        setInterpAfter(interpBefore);
        setStage("CLUE1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlockClue2() {
    if (!data?.currentScenario) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/unlock-clue2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: data.session.id,
          scenarioId: data.currentScenario.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İkinci ipucu açılamadı.");
      setClue2(json.clue2);
      setStage("CLUE2");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSecondSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.currentScenario) return;

    if (data.currentScenario.hasSecondClue && !clue2) {
      setError("Lütfen önce ikinci bilgiyi (bağlam ipucunu) görüntüleyin.");
      return;
    }

    if (!decisionMode) {
      setError("Lütfen ek bilgiden sonraki karar yaklaşımınızı seçin.");
      return;
    }

    const baseFirst = firstChoice ?? "UNKNOWN";
    const finalDisplayed: ChoiceValue =
      decisionMode === "STILL_UNKNOWN"
        ? "UNKNOWN"
        : decisionMode === "KEEP"
          ? baseFirst
          : secondChoice ?? baseFirst;

    if (decisionMode === "CHANGE" && !secondChoice) {
      setError("Lütfen güncellediğiniz seçimi işaretleyin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/second-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: data.session.id,
          scenarioId: data.currentScenario.id,
          decisionMode,
          displayedChoice: finalDisplayed,
          confidence: secondConfidence,
          interpretationAfter: data.currentScenario.requiresInterpretationRating
            ? interpAfter
            : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Son yanıt kaydedilemedi.");

      if (!isMeasurementTest && json.interventionFeedback) {
        setInterventionFeedback(json.interventionFeedback);
        setStage("FEEDBACK");
      } else {
        await loadPhase();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-primary-dark">Ölçüm aşaması yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card-surface space-y-4 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-primary" />
        <p className="text-sm font-semibold text-ink">{error || "Bu aşamaya erişilemiyor."}</p>
        <Link href="/study" className="btn-primary text-sm">
          Araştırma Katılım Ekranına Dön
        </Link>
      </div>
    );
  }

  const nextRoute =
    phase === "PRETEST"
      ? "/study/intervention"
      : phase === "INTERVENTION"
        ? "/study/posttest"
        : "/study";

  const nextButtonLabel =
    phase === "PRETEST"
      ? "Eğitim / Bilgilendirme Aşamasına Geç"
      : phase === "INTERVENTION"
        ? "Son Test Aşamasına Geç"
        : "Araştırma Özetine Dön";

  if (stage === "DONE" || !data.currentScenario) {
    return (
      <div className="card-surface space-y-5 p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="font-display text-2xl font-extrabold text-primary-dark">
          {PHASE_TITLES[phase]} Tamamlandı
        </h1>
        <p className="mx-auto max-w-lg text-sm text-ink-muted">
          {isMeasurementTest
            ? "Tüm maddelere verdiğiniz yanıtlar anonim katılımcı kodunuzla güvenli biçimde kaydedildi. Bilimsel ölçüm standartları gereği bu aşamada puan veya doğru/yanlış geri bildirimi gösterilmez."
            : "Eğitici senaryo aşamasını tamamladınız. Şimdi eşdeğer ölçüm formundaki son teste geçebilirsiniz."}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(nextRoute)}
            className="btn-primary"
          >
            {nextButtonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link href="/study" className="btn-secondary">
            Araştırma Paneline Dön
          </Link>
        </div>
      </div>
    );
  }

  const scenario = data.currentScenario;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Üst Bilgi Bandı (Test modunda puan/rozet/süre YOK) */}
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-dark">
              {PHASE_TITLES[phase]}
            </span>
            <span className="rounded-full bg-lavender-bg px-3 py-1 text-xs font-bold text-ink">
              Form {data.session.testForm} • Madde {data.session.currentIndex + 1} /{" "}
              {data.session.totalItems}
            </span>
            {data.participant.isDemo && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
                DEMO VERİSİ
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-bold text-ink-muted">
            Kod: {data.participant.anonymousParticipantId}
          </span>
        </div>

        <ProgressBar
          current={data.session.currentIndex + 1}
          total={data.session.totalItems}
          label="Ölçüm İlerlemesi"
        />

        {isMeasurementTest && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
            Bu bilimsel ölçüm aşamasında süre sınırı, puan, rozet veya doğru/yanlış geri bildirimi yoktur.
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Deney grubu eğitim geri bildirimi (Yalnızca INTERVENTION aşamasında) */}
      {!isMeasurementTest && stage === "FEEDBACK" && interventionFeedback ? (
        <section className="card-surface space-y-4 p-5 sm:p-7">
          <h2 className="font-display text-xl font-extrabold text-primary-dark">
            Olay Özeti: {interventionFeedback.verifiedActorLabel}
          </h2>
          <p className="rounded-2xl bg-lavender-card p-4 text-sm leading-relaxed text-ink">
            {interventionFeedback.contextExplanation}
          </p>
          <p className="rounded-2xl border border-success/40 bg-success-soft/70 p-4 text-sm font-semibold text-ink">
            {interventionFeedback.teachingMessage}
          </p>
          <div className="flex justify-end">
            <button type="button" onClick={() => void loadPhase()} className="btn-primary">
              Sonraki Olay
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="card-surface space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <FileText className="h-3.5 w-3.5" />
              <span>
                Dosya {scenario.id} • {scenario.valueCategory}
              </span>
            </div>
            <h1 className="font-display text-xl font-extrabold text-primary-dark sm:text-2xl">
              {scenario.title}
            </h1>
            <p className="rounded-2xl bg-lavender-card p-4 text-sm leading-relaxed text-ink sm:text-base">
              {scenario.eventText}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <CharacterAvatar
              visualKey={scenario.visual.leftVisualKey}
              slotLabel="A"
              isDemoMaterial={scenario.visual.isDemoMaterial}
              approvedForResearch={scenario.visual.approvedForResearch}
            />
            <CharacterAvatar
              visualKey={scenario.visual.rightVisualKey}
              slotLabel="B"
              isDemoMaterial={scenario.visual.isDemoMaterial}
              approvedForResearch={scenario.visual.approvedForResearch}
            />
          </div>

          {/* AŞAMA 1: İLK KARAR */}
          {stage === "FIRST_DECISION" && (
            <form onSubmit={handleFirstSubmit} className="space-y-5 border-t border-lavender-border pt-5">
              <div className="space-y-2.5">
                <p className="text-sm font-extrabold text-ink">{scenario.researchQuestion}</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="İlk karar seçimi">
                  {(
                    [
                      { value: "A" as const, label: "Karakter A" },
                      { value: "B" as const, label: "Karakter B" },
                      { value: "UNKNOWN" as const, label: "Yeterli bilgim yok" },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={firstChoice === opt.value}
                      onClick={() => setFirstChoice(opt.value)}
                      className={`rounded-2xl border-2 px-4 py-3.5 text-sm font-extrabold transition-colors ${
                        firstChoice === opt.value
                          ? "border-primary bg-primary text-white"
                          : "border-lavender-border bg-lavender-card text-ink hover:border-primary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-ink">
                  Karar güveni (1: Hiç emin değilim — 5: Çok eminim)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFirstConfidence(n)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-extrabold ${
                        firstConfidence === n
                          ? "border-primary bg-primary-soft text-primary-dark"
                          : "border-lavender-border bg-white text-ink-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {scenario.requiresInterpretationRating && (
                <div className="space-y-2 rounded-2xl bg-lavender-card p-4">
                  <label className="block text-sm font-extrabold text-ink">
                    Bu davranışı şu an nasıl değerlendiriyorsunuz? (1: Olumsuz — 5: Olumlu / Anlaşılır)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInterpBefore(n)}
                        className={`rounded-xl border-2 py-2 text-sm font-extrabold ${
                          interpBefore === n
                            ? "border-primary bg-primary text-white"
                            : "border-lavender-border bg-white text-ink"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="study-first-reason" className="block text-sm font-extrabold text-ink">
                  Karar gerekçesi
                </label>
                <select
                  id="study-first-reason"
                  value={firstReason}
                  onChange={(e) => setFirstReason(e.target.value)}
                  className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">Seçiniz...</option>
                  {DECISION_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {firstReason === "diger" && (
                  <input
                    type="text"
                    value={firstReasonOther}
                    onChange={(e) => setFirstReasonOther(e.target.value)}
                    placeholder="Kısaca belirtin..."
                    className="mt-2 w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-2.5 text-sm"
                  />
                )}
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                  {submitting ? "Kaydediliyor..." : "İlerle"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* AŞAMA 2: STANDART İPUCU VE İKİNCİ KARAR */}
          {(stage === "CLUE1" || stage === "CLUE2") && (
            <form onSubmit={handleSecondSubmit} className="space-y-5 border-t border-lavender-border pt-5">
              <div className="rounded-2xl border-2 border-primary/40 bg-primary-soft/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary-dark">
                  <Search className="h-4 w-4" />
                  Ek Bilgi 1
                </div>
                <p className="text-sm font-semibold leading-relaxed text-ink">{clue1}</p>
              </div>

              {scenario.hasSecondClue && (
                <div>
                  {!clue2 ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleUnlockClue2()}
                      className="btn-accent w-full text-sm"
                    >
                      Ek Bilgi 2&apos;yi (Bağlam) Görüntüle
                    </button>
                  ) : (
                    <div className="rounded-2xl border-2 border-accent bg-accent-soft/60 p-4 space-y-1.5">
                      <div className="text-xs font-extrabold uppercase tracking-wide text-ink">
                        Ek Bilgi 2 (Bağlam)
                      </div>
                      <p className="text-sm font-semibold leading-relaxed text-ink">{clue2}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <p className="text-sm font-extrabold text-ink">
                  Bu ek bilgiden sonra kararınız nedir?
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {(
                    [
                      { id: "KEEP" as const, label: "İlk kararımı koruyorum" },
                      { id: "CHANGE" as const, label: "Kararımı değiştiriyorum" },
                      { id: "STILL_UNKNOWN" as const, label: "Hâlâ yeterli bilgim yok" },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDecisionMode(opt.id);
                        if (opt.id === "KEEP") setSecondChoice(firstChoice ?? "UNKNOWN");
                        if (opt.id === "STILL_UNKNOWN") setSecondChoice("UNKNOWN");
                      }}
                      className={`rounded-2xl border-2 px-3.5 py-3 text-sm font-extrabold ${
                        decisionMode === opt.id
                          ? "border-primary bg-primary text-white"
                          : "border-lavender-border bg-lavender-card text-ink hover:border-primary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {decisionMode === "CHANGE" && (
                <div className="space-y-2 rounded-2xl bg-lavender-card p-4">
                  <p className="text-xs font-extrabold text-ink">Güncellenmiş seçiminiz:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["A", "B", "UNKNOWN"] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSecondChoice(val)}
                        className={`rounded-xl border-2 py-2.5 text-xs font-extrabold sm:text-sm ${
                          secondChoice === val
                            ? "border-primary bg-primary text-white"
                            : "border-lavender-border bg-white text-ink"
                        }`}
                      >
                        {val === "UNKNOWN" ? "Yeterli bilgim yok" : `Karakter ${val}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-ink">
                  Son karar güveniniz (1–5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSecondConfidence(n)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-extrabold ${
                        secondConfidence === n
                          ? "border-primary bg-primary-soft text-primary-dark"
                          : "border-lavender-border bg-white text-ink-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {scenario.requiresInterpretationRating && (
                <div className="space-y-2 rounded-2xl bg-lavender-card p-4">
                  <label className="block text-sm font-extrabold text-ink">
                    Bağlam bilgisinden sonra bu davranışı nasıl değerlendiriyorsunuz? (1: Olumsuz — 5: Olumlu / Anlaşılır)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInterpAfter(n)}
                        className={`rounded-xl border-2 py-2 text-sm font-extrabold ${
                          interpAfter === n
                            ? "border-primary bg-primary text-white"
                            : "border-lavender-border bg-white text-ink"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                  {submitting ? "Kaydediliyor..." : "Yanıtı Kaydet ve İlerle"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
