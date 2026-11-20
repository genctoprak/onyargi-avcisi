"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileText,
  Lightbulb,
  Search,
  Star,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { CharacterAvatar } from "@/components/illustrations/CharacterAvatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DECISION_REASONS } from "@/data/scenarios-manifest";
import { usePreferences } from "@/components/providers/PreferencesProvider";

type GameMode = "CLASSIC" | "TIMED" | "EXPERT";
type ChoiceValue = "A" | "B" | "UNKNOWN";

interface GameScenarioDTO {
  id: string;
  version: string;
  title: string;
  valueCategory: string;
  scenarioType: "B" | "K" | "Y";
  eventText: string;
  researchQuestion: string;
  availableChoices: ChoiceValue[];
  hasClue1: boolean;
  hasClue2: boolean;
  requiresInterpretationRating: boolean;
  expertQuestion: string | null;
  expertOptions: string[] | null;
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
  stage: "FIRST_DECISION" | "CLUE" | "RESULT";
  clue1: string | null;
  clue2: string | null;
}

interface GameSessionDTO {
  id: string;
  mode: GameMode;
  currentIndex: number;
  totalScenarios: number;
  totalScore: number;
  evidenceScoreCount: number;
  uncertaintyRecognizedCount: number;
  timedOutCount: number;
  badgesEarned: string[];
  status: "IN_PROGRESS" | "COMPLETED";
  completedCount: number;
}

interface ScenarioOutcomeDTO {
  scenarioId: string;
  scenarioType: "B" | "K" | "Y";
  verifiedActorLabel: string;
  isUncertaintyScenario: boolean;
  behaviorIntent: string;
  contextExplanation: string;
  teachingMessage: string;
  pointsAwarded: number;
  stars: 1 | 2 | 3;
  breakdown: string[];
  evidenceAligned: boolean;
  uncertaintyRecognized: boolean;
  expertCorrectOption: string | null;
}

const MODE_LABELS: Record<GameMode, string> = {
  CLASSIC: "Klasik Mod",
  TIMED: "Zaman Modu (15 sn)",
  EXPERT: "Uzman Mod",
};

export function GameRunner({ mode }: { mode: GameMode }) {
  const router = useRouter();
  const { playCue } = usePreferences();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<GameSessionDTO | null>(null);
  const [scenario, setScenario] = useState<GameScenarioDTO | null>(null);

  // First decision state
  const [stage, setStage] = useState<"FIRST_DECISION" | "CLUE" | "RESULT">("FIRST_DECISION");
  const [firstChoice, setFirstChoice] = useState<ChoiceValue | null>(null);
  const [firstConfidence, setFirstConfidence] = useState<number>(3);
  const [firstReason, setFirstReason] = useState<string>("");
  const [firstReasonOther, setFirstReasonOther] = useState<string>("");
  const [interpBefore, setInterpBefore] = useState<number>(3);

  // Timed mode state (15s non-punitive timer)
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  // Clue & second decision state
  const [clue1, setClue1] = useState<string | null>(null);
  const [clue2, setClue2] = useState<string | null>(null);
  const [clue2Visible, setClue2Visible] = useState<boolean>(false);
  const [decisionMode, setDecisionMode] = useState<"KEEP" | "CHANGE" | "STILL_UNKNOWN" | null>(null);
  const [secondChoice, setSecondChoice] = useState<ChoiceValue | null>(null);
  const [secondConfidence, setSecondConfidence] = useState<number>(3);
  const [interpAfter, setInterpAfter] = useState<number>(3);
  const [expertAnswer, setExpertAnswer] = useState<string>("");

  // Result stage
  const [outcome, setOutcome] = useState<ScenarioOutcomeDTO | null>(null);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const resetFormState = useCallback(() => {
    setFirstChoice(null);
    setFirstConfidence(3);
    setFirstReason("");
    setFirstReasonOther("");
    setInterpBefore(3);
    setSecondsLeft(15);
    setTimedOut(false);
    setClue1(null);
    setClue2(null);
    setClue2Visible(false);
    setDecisionMode(null);
    setSecondChoice(null);
    setSecondConfidence(3);
    setInterpAfter(3);
    setExpertAnswer("");
    setOutcome(null);
    setError(null);
  }, []);

  const startFreshSession = useCallback(async () => {
    setLoading(true);
    resetFormState();
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Oyun başlatılamadı.");
      setSession(data.session);
      setScenario(data.currentScenario);
      setStage(data.currentScenario?.stage ?? "FIRST_DECISION");
      if (data.currentScenario?.clue1) setClue1(data.currentScenario.clue1);
      if (data.currentScenario?.clue2) setClue2(data.currentScenario.clue2);
      setIsSessionFinished(data.session?.status === "COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oyun yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [mode, resetFormState]);

  const loadSessionState = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      resetFormState();
      try {
        const res = await fetch(`/api/game/session?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Oturum yüklenemedi.");
        setSession(data.session);
        setScenario(data.currentScenario);
        setStage(data.currentScenario?.stage ?? "FIRST_DECISION");
        if (data.currentScenario?.clue1) setClue1(data.currentScenario.clue1);
        if (data.currentScenario?.clue2) setClue2(data.currentScenario.clue2);
        setIsSessionFinished(data.session?.status === "COMPLETED");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Oturum yüklenemedi.");
      } finally {
        setLoading(false);
      }
    },
    [resetFormState],
  );

  useEffect(() => {
    void startFreshSession();
  }, [startFreshSession]);

  // 15s countdown in TIMED mode (only during FIRST_DECISION; NEVER punishes user)
  useEffect(() => {
    if (mode !== "TIMED" || stage !== "FIRST_DECISION" || loading || !scenario) return;
    if (secondsLeft <= 0) {
      setTimedOut(true);
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [mode, stage, loading, scenario, secondsLeft]);

  // Keyboard shortcuts (1 = A, 2 = B, 3 = Yeterli bilgim yok)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      if (stage === "FIRST_DECISION") {
        if (e.key === "1") {
          setFirstChoice("A");
          playCue("click");
        } else if (e.key === "2") {
          setFirstChoice("B");
          playCue("click");
        } else if (e.key === "3") {
          setFirstChoice("UNKNOWN");
          playCue("click");
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, playCue]);

  async function handleFirstDecisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !scenario) return;
    if (!firstChoice) {
      setError("Lütfen Karakter A, Karakter B veya 'Yeterli bilgim yok' seçeneğini işaretleyin.");
      return;
    }
    if (!firstReason) {
      setError("Lütfen karar gerekçenizi seçin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/game/first-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          scenarioId: scenario.id,
          displayedChoice: firstChoice,
          confidence: firstConfidence,
          reason: firstReason,
          reasonOther: firstReason === "diger" ? firstReasonOther : null,
          interpretationBefore: scenario.requiresInterpretationRating ? interpBefore : null,
          timedOut,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İlk karar kaydedilemedi.");

      setClue1(data.clue1 ?? null);
      setClue2(data.clue2 ?? null);
      setClue2Visible(false);
      setSecondChoice(firstChoice);
      setSecondConfidence(firstConfidence);
      setInterpAfter(interpBefore);
      setStage("CLUE");
      playCue("clue");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSecondDecisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !scenario || !firstChoice) return;
    if (clue2 && !clue2Visible) {
      setError("Lütfen önce 2. ipucunu açıp inceleyin.");
      return;
    }
    if (!decisionMode) {
      setError("Lütfen ipucundan sonraki karar yaklaşımınızı seçin.");
      return;
    }

    const effectiveChoice: ChoiceValue =
      decisionMode === "STILL_UNKNOWN"
        ? "UNKNOWN"
        : decisionMode === "KEEP"
          ? firstChoice
          : secondChoice ?? firstChoice;

    if (decisionMode === "CHANGE" && (!secondChoice || secondChoice === firstChoice)) {
      setError("Kararınızı değiştirmeyi seçtiniz; lütfen yeni seçiminizi işaretleyin.");
      return;
    }

    if (mode === "EXPERT" && scenario.expertQuestion && !expertAnswer) {
      setError("Lütfen Uzman Mod ek bağlam sorusunu yanıtlayın.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/game/second-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          scenarioId: scenario.id,
          decisionMode,
          displayedChoice: effectiveChoice,
          confidence: secondConfidence,
          interpretationAfter: scenario.requiresInterpretationRating ? interpAfter : null,
          expertAnswer: mode === "EXPERT" ? expertAnswer || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Son karar kaydedilemedi.");

      setOutcome(data.result);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              totalScore: data.sessionSummary.totalScore,
              badgesEarned: data.sessionSummary.badgesEarned,
              currentIndex: data.sessionSummary.nextIndex,
              status: data.sessionSummary.isSessionCompleted ? "COMPLETED" : "IN_PROGRESS",
            }
          : prev,
      );
      setIsSessionFinished(data.sessionSummary.isSessionCompleted);
      setStage("RESULT");
      playCue("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-primary-dark">Olay dosyası hazırlanıyor...</p>
      </div>
    );
  }

  if (!session || (!scenario && !outcome)) {
    return (
      <div className="card-surface space-y-4 p-6 text-center">
        <p className="text-sm text-ink-muted">{error || "Oyun oturumu tamamlandı veya bulunamadı."}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => void startFreshSession()} className="btn-primary text-sm">
            <RotateCcw className="h-4 w-4" />
            Yeni Oyun Başlat
          </button>
          <Link href="/results" className="btn-secondary">
            Sonuçları Gör
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Üst Bilgi & İlerleme Çubuğu */}
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-dark">
              {MODE_LABELS[mode]}
            </span>
            {scenario && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lavender-bg px-3 py-1 text-xs font-bold text-ink">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Dosya #{session.currentIndex + (stage === "RESULT" ? 0 : 1)} ({scenario.id})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold text-ink">
              <Star className="h-3.5 w-3.5 fill-accent text-accent-dark" />
              {session.totalScore} Puan
            </span>
          </div>
        </div>
        <ProgressBar
          current={stage === "RESULT" ? session.currentIndex : session.currentIndex + 1}
          total={session.totalScenarios}
          label="Olay Dosyası İlerlemesi"
        />
      </div>

      {/* Zaman Modu 15 sn Sayacı (Sadece ilk karar aşamasında, ceza yok) */}
      {mode === "TIMED" && stage === "FIRST_DECISION" && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold sm:text-sm ${
            timedOut
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-lavender-border bg-white text-primary-dark"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            {timedOut ? (
              <span>
                15 saniyelik ilk karar süresi doldu — ceza uygulanmaz, kararını seçip devam
                edebilirsin.
              </span>
            ) : (
              <span>İlk karar için kalan süre: {secondsLeft} saniye</span>
            )}
          </div>
          <span className="rounded-lg bg-primary-soft px-2.5 py-1 font-mono text-sm font-extrabold text-primary-dark">
            {secondsLeft}s
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Olay Dosyası & Karakterler (İlk Karar ve İpucu Aşamalarında) */}
      {scenario && stage !== "RESULT" && (
        <section className="card-surface space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-primary">
              <span>{scenario.valueCategory}</span>
              <span>•</span>
              <span>Sürüm {scenario.version}</span>
            </div>
            <h1 className="font-display text-xl font-extrabold text-primary-dark sm:text-2xl">
              {scenario.title}
            </h1>
            <p className="rounded-2xl bg-lavender-card p-4 text-sm leading-relaxed text-ink sm:text-base">
              {scenario.eventText}
            </p>
          </div>

          {/* İki Karakter Görseli */}
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
            <form onSubmit={handleFirstDecisionSubmit} className="space-y-5 border-t border-lavender-border pt-5">
              <div className="space-y-2.5">
                <p className="text-sm font-extrabold text-ink">
                  {scenario.researchQuestion}{" "}
                  <span className="text-xs font-normal text-ink-muted">(Klavye: 1 / 2 / 3)</span>
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="İlk karar seçimi">
                  {(
                    [
                      { value: "A" as const, label: "Karakter A", hint: "Tuş: 1" },
                      { value: "B" as const, label: "Karakter B", hint: "Tuş: 2" },
                      { value: "UNKNOWN" as const, label: "Yeterli bilgim yok", hint: "Tuş: 3" },
                    ]
                  ).map((opt) => {
                    const selected = firstChoice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setFirstChoice(opt.value);
                          playCue("click");
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-3.5 text-center transition-all ${
                          selected
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-lavender-border bg-lavender-card text-ink hover:border-primary"
                        }`}
                      >
                        <span className="text-sm font-extrabold">{opt.label}</span>
                        <span className={`text-[11px] ${selected ? "text-white/80" : "text-ink-muted"}`}>
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Karar Güveni 1-5 */}
              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-ink">
                  Karar güvenin (1: Hiç emin değilim — 5: Çok eminim)
                </label>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="İlk karar güven düzeyi">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={firstConfidence === n}
                      onClick={() => setFirstConfidence(n)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-extrabold transition-colors ${
                        firstConfidence === n
                          ? "border-primary bg-primary-soft text-primary-dark"
                          : "border-lavender-border bg-white text-ink-muted hover:border-primary"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bağlam (Y) senaryosunda davranış yorumu 1-5 */}
              {scenario.requiresInterpretationRating && (
                <div className="space-y-2 rounded-2xl bg-lavender-card p-4">
                  <label className="block text-sm font-extrabold text-ink">
                    Bu davranışı şu an nasıl yorumluyorsun? (1: Olumsuz/Kasıtlı — 5: Olumlu/Anlaşılır)
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

              {/* Karar Gerekçesi */}
              <div className="space-y-2">
                <label htmlFor="game-first-reason" className="block text-sm font-extrabold text-ink">
                  Karar gerekçen nedir?
                </label>
                <select
                  id="game-first-reason"
                  value={firstReason}
                  onChange={(e) => setFirstReason(e.target.value)}
                  className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">Bir gerekçe seçin...</option>
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
                    placeholder="Kısaca gerekçeni yaz..."
                    maxLength={250}
                    className="mt-2 w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                )}
              </div>

              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-ink-muted">
                  İpucu aşaması, ilk kararın sunucuya kaydedildikten sonra açılır.
                </p>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Kaydediliyor..." : "İlerle ve İpucunu Aç"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* AŞAMA 2: İPUCU VE İKİNCİ KARAR */}
          {stage === "CLUE" && (
            <form onSubmit={handleSecondDecisionSubmit} className="space-y-5 border-t border-lavender-border pt-5">
              {/* 1. İpucu */}
              <div className="rounded-2xl border-2 border-accent bg-accent-soft/60 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-ink">
                  <Search className="h-4 w-4 text-primary-dark" />
                  1. İpucu Açıldı
                </div>
                <p className="text-sm font-semibold leading-relaxed text-ink">
                  {clue1 || "Bu olayla ilgili ek bir kayıt veya görgü tanığı bulunamadı."}
                </p>
              </div>

              {/* 2. İpucu (Sıralı açılım) */}
              {clue2 && (
                <div className="space-y-2">
                  {!clue2Visible ? (
                    <button
                      type="button"
                      onClick={() => {
                        setClue2Visible(true);
                        playCue("clue");
                      }}
                      className="btn-accent w-full text-sm"
                    >
                      <Lightbulb className="h-4 w-4" />
                      2. İpucunu (Bağlam Bilgisini) Aç
                    </button>
                  ) : (
                    <div className="rounded-2xl border-2 border-primary bg-primary-soft/60 p-4 space-y-1.5 animate-pop">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary-dark">
                        <Lightbulb className="h-4 w-4" />
                        2. İpucu — Bağlam Bilgisi
                      </div>
                      <p className="text-sm font-semibold leading-relaxed text-ink">{clue2}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Yeni bilgi sonrası karar */}
              <div className="space-y-2.5">
                <p className="text-sm font-extrabold text-ink">
                  Bu ipucundan sonra kararın nedir?
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
                        if (opt.id === "KEEP") setSecondChoice(firstChoice);
                        if (opt.id === "STILL_UNKNOWN") setSecondChoice("UNKNOWN");
                        playCue("click");
                      }}
                      className={`rounded-2xl border-2 px-3.5 py-3 text-sm font-extrabold transition-colors ${
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
                  <p className="text-xs font-extrabold text-ink">Yeni seçimin hangisi?</p>
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

              {/* Son Karar Güveni */}
              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-ink">
                  Yeni karar güvenin (1–5)
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

              {/* Bağlam sonrası yorum (Y senaryoları) */}
              {scenario.requiresInterpretationRating && (
                <div className="space-y-2 rounded-2xl bg-lavender-card p-4">
                  <label className="block text-sm font-extrabold text-ink">
                    Bağlam bilgisinden sonra bu davranışı nasıl yorumluyorsun? (1: Olumsuz — 5: Olumlu/Anlaşılır)
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

              {/* Uzman Mod Ek Sorusu */}
              {mode === "EXPERT" && scenario.expertQuestion && scenario.expertOptions && (
                <div className="space-y-2.5 rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-4">
                  <p className="text-sm font-extrabold text-primary-dark">
                    Uzman Değerlendirme Sorusu: {scenario.expertQuestion}
                  </p>
                  <div className="space-y-2">
                    {scenario.expertOptions.map((opt) => (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-sm font-semibold ${
                          expertAnswer === opt
                            ? "border-primary bg-white text-primary-dark"
                            : "border-lavender-border bg-white/70 text-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name="expertAnswer"
                          checked={expertAnswer === opt}
                          onChange={() => setExpertAnswer(opt)}
                          className="accent-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                  {submitting ? "Değerlendiriliyor..." : "Kararımı Onayla"}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* AŞAMA 3: SONUÇ VE FARKINDALIK AÇIKLAMASI (Sadece oyun modunda) */}
      {stage === "RESULT" && outcome && (
        <section className="card-surface space-y-5 p-5 sm:p-7 animate-pop">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {outcome.isUncertaintyScenario ? (
                <HelpCircle className="h-7 w-7 text-primary" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-success" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Olay Dosyası Sonucu
                </p>
                <h2 className="font-display text-xl font-extrabold text-primary-dark sm:text-2xl">
                  {outcome.verifiedActorLabel}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-2xl bg-accent-soft px-4 py-2">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= outcome.stars ? "fill-accent text-accent-dark" : "text-lavender-border"
                  }`}
                />
              ))}
              <span className="ml-2 font-display text-base font-extrabold text-ink">
                +{outcome.pointsAwarded} Puan
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-lavender-card p-4 space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-primary-dark">
              Kanıt ve Bağlam Özeti
            </h3>
            <p className="text-sm leading-relaxed text-ink">{outcome.contextExplanation}</p>
          </div>

          <div className="rounded-2xl border border-success/40 bg-success-soft/70 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-success-dark">
              <Sparkles className="h-4 w-4" />
              Farkındalık Mesajı
            </div>
            <p className="text-sm font-semibold leading-relaxed text-ink">{outcome.teachingMessage}</p>
          </div>

          <div className="rounded-2xl border border-lavender-border bg-white p-4 space-y-1.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
              Puanlama Detayı
            </h3>
            <ul className="space-y-1 text-xs text-ink-muted">
              {outcome.breakdown.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {isSessionFinished ? (
              <button
                type="button"
                onClick={() => router.push("/results")}
                className="btn-accent w-full sm:w-auto"
              >
                Final Sonuçlarını ve Rozetleri Gör
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void loadSessionState(session.id)}
                className="btn-primary w-full sm:w-auto"
              >
                Sonraki Olay Dosyası
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
