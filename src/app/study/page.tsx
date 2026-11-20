"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Lock,
  LogOut,
  ShieldAlert,
  UserX,
} from "lucide-react";

interface StudyStatusDTO {
  studyVersion: string;
  canCollectRealResearchData: boolean;
  readinessIssues: string[];
  followupEnabled: boolean;
  followupReady: boolean;
  followupDelayDays: number;
  demoDataEnabled: boolean;
  participant: {
    anonymousParticipantId: string;
    isDemo: boolean;
    studyVersion: string;
    groupAssignment: string;
    armType: "EXPERIMENTAL" | "CONTROL";
    pretestForm: string;
    posttestForm: string;
    currentPhase: string;
    withdrawnAt: string | null;
    deletionRequestedAt: string | null;
    sessions: Array<{
      phase: string;
      testForm: string;
      currentIndex: number;
      completionStatus: string;
    }>;
  } | null;
}

export default function StudyEntryPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StudyStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Form states
  const [mode, setMode] = useState<"DEMO" | "RESEARCH">("DEMO");
  const [participantCode, setParticipantCode] = useState("");
  const [parentalCode, setParentalCode] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Withdrawal modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [requestDeletion, setRequestDeletion] = useState(true);
  const [withdrawNote, setWithdrawNote] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study/status", { cache: "no-store" });
      const data = (await res.json()) as StudyStatusDTO;
      setStatus(data);
      if (data.canCollectRealResearchData) {
        setMode("RESEARCH");
      } else {
        setMode("DEMO");
      }
    } catch {
      setError("Araştırma durumu yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          participantCode: participantCode.trim(),
          consentAcknowledged: consentChecked,
          parentalPermissionCode: mode === "RESEARCH" ? parentalCode.trim() : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Katılım başlatılamadı.");

      await loadStatus();
      const nextPhase = json.participant?.currentPhase;
      if (nextPhase === "PRETEST") router.push("/study/pretest");
      else if (nextPhase === "INTERVENTION") router.push("/study/intervention");
      else if (nextPhase === "POSTTEST") router.push("/study/posttest");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestDataDeletion: requestDeletion,
          note: withdrawNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ayrılma talebi kaydedilemedi.");
      setShowWithdraw(false);
      setInfoMessage(json.message);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/study/logout", { method: "POST" });
    await loadStatus();
  }

  if (loading) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-primary-dark">Araştırma modülü yükleniyor...</p>
      </div>
    );
  }

  const activeParticipant = status?.participant;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <section className="card-surface space-y-3 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-dark">
            <FlaskConical className="h-3.5 w-3.5" />
            Bilimsel Araştırma Modülü (Sürüm {status?.studyVersion})
          </span>
          {status?.canCollectRealResearchData ? (
            <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-extrabold text-success-dark">
              Gerçek Veri Toplama: AÇIK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
              <Lock className="h-3 w-3" />
              Gerçek Veri Toplama: KAPALI (Demo/Pilot Modu Aktif)
            </span>
          )}
        </div>

        <h1 className="font-display text-2xl font-extrabold text-primary-dark sm:text-3xl">
          Araştırma Katılım ve Bilgilendirme
        </h1>

        <div className="grid grid-cols-1 gap-3 pt-1 text-xs leading-relaxed text-ink-muted sm:grid-cols-2 sm:text-sm">
          <div className="rounded-2xl bg-lavender-card p-4 space-y-1.5">
            <h2 className="font-extrabold text-ink">Araştırmanın Amacı ve Gönüllülük</h2>
            <p>
              Bu çalışma, lise öğrencilerinin dış görünüşe dayalı ilk izlenimlerini, kanıt
              yetersizliğinde karar verme eğilimlerini ve yeni bilgiyle görüş güncelleme
              davranışlarını bilimsel olarak incelemek amacıyla hazırlanmıştır. Katılım tamamen
              gönüllüdür ve dilediğiniz anda hiçbir gerekçe göstermeden ayrılabilirsiniz.
            </p>
          </div>
          <div className="rounded-2xl bg-lavender-card p-4 space-y-1.5">
            <h2 className="font-extrabold text-ink">Gizlilik ve En Az Veri İlkesi</h2>
            <p>
              Adınız, soyadınız, telefon numaranız veya açık adresiniz <strong>kesinlikle toplanmaz</strong>.
              Tüm yanıtlar yalnızca anonim bir katılımcı kodu ile saklanır. Bu yazılım bir
              psikolojik tanı aracı değildir ve katılımcıları etiketlemez.
            </p>
          </div>
        </div>
      </section>

      {infoMessage && (
        <div className="rounded-2xl border border-success bg-success-soft p-4 text-sm font-semibold text-success-dark">
          {infoMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900"
        >
          {error}
        </div>
      )}

      {/* Aktif Katılımcı Durumu */}
      {activeParticipant ? (
        <section className="card-surface space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-primary-dark">
                  Aktif Oturum: {activeParticipant.anonymousParticipantId}
                </h2>
                {activeParticipant.isDemo && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 border border-amber-300">
                    DEMO VERİSİ
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Bu anonim kodu not alın; aynı kodla yeniden giriş yaptığınızda aynı çalışma
                grubunuzdan ve kaldığınız aşamadan devam edersiniz.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="btn-secondary border-rose-200 text-xs text-rose-700 hover:border-rose-400"
              >
                <UserX className="h-4 w-4" />
                Çalışmadan Ayrıl
              </button>
              <button type="button" onClick={() => void handleLogout()} className="btn-secondary text-xs">
                <LogOut className="h-4 w-4" />
                Oturumu Kapat
              </button>
            </div>
          </div>

          {/* Aşama Kartları */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PhaseCard
              title="1. Ön Test"
              detail={`Form ${activeParticipant.pretestForm} • 12 madde`}
              href="/study/pretest"
              status={
                activeParticipant.sessions.find((s) => s.phase === "PRETEST")?.completionStatus ===
                "COMPLETED"
                  ? "COMPLETED"
                  : activeParticipant.currentPhase === "PRETEST"
                    ? "ACTIVE"
                    : "LOCKED"
              }
            />
            <PhaseCard
              title="2. Etkinlik"
              detail={
                activeParticipant.armType === "EXPERIMENTAL"
                  ? "Önyargı Avcısı Eğitici Senaryolar"
                  : "Bilgilendirme Kartları"
              }
              href="/study/intervention"
              status={
                activeParticipant.sessions.find((s) => s.phase === "INTERVENTION")
                  ?.completionStatus === "COMPLETED"
                  ? "COMPLETED"
                  : activeParticipant.currentPhase === "INTERVENTION"
                    ? "ACTIVE"
                    : "LOCKED"
              }
            />
            <PhaseCard
              title="3. Son Test"
              detail={`Form ${activeParticipant.posttestForm} • 12 madde`}
              href="/study/posttest"
              status={
                activeParticipant.sessions.find((s) => s.phase === "POSTTEST")?.completionStatus ===
                "COMPLETED"
                  ? "COMPLETED"
                  : activeParticipant.currentPhase === "POSTTEST"
                    ? "ACTIVE"
                    : "LOCKED"
              }
            />
            <PhaseCard
              title="4. İzleme Testi"
              detail={
                status?.followupReady
                  ? `Aktif (${status.followupDelayDays} gün sonra)`
                  : "Araştırmacı onayını bekliyor"
              }
              href="/study/followup"
              status={
                activeParticipant.sessions.find((s) => s.phase === "FOLLOWUP")?.completionStatus ===
                "COMPLETED"
                  ? "COMPLETED"
                  : status?.followupReady && activeParticipant.currentPhase === "COMPLETED"
                    ? "ACTIVE"
                    : "LOCKED"
              }
            />
          </div>

          {activeParticipant.currentPhase === "COMPLETED" && (
            <div className="rounded-2xl border border-success/40 bg-success-soft/70 p-4 text-sm font-semibold text-ink">
              Ön test, etkinlik ve son test aşamalarını başarıyla tamamladınız. Katkınız için
              teşekkür ederiz!
            </div>
          )}
        </section>
      ) : (
        /* Yeni Katılım / Devam Formu */
        <section className="card-surface space-y-5 p-5 sm:p-7">
          {!status?.canCollectRealResearchData && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-extrabold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Gerçek Araştırma Veri Toplama Şu Anda Kapalıdır
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {status?.readinessIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
              <p className="font-semibold">
                Araştırma akışını incelemek için aşağıdaki <strong>Demo / Pilot Önizleme</strong>{" "}
                modunu kullanabilirsiniz. Demo verileri gerçek araştırma kayıtlarına kesinlikle
                karışmaz.
              </p>
            </div>
          )}

          <form onSubmit={handleEnroll} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("DEMO")}
                className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                  mode === "DEMO"
                    ? "border-primary bg-primary-soft/50"
                    : "border-lavender-border bg-white"
                }`}
              >
                <div className="text-sm font-extrabold text-primary-dark">
                  Demo / Pilot Önizleme Modu
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Gerçek araştırma verilerinden tamamen ayrı kaydedilir ve &ldquo;DEMO VERİSİ&rdquo;
                  olarak etiketlenir.
                </p>
              </button>

              <button
                type="button"
                disabled={!status?.canCollectRealResearchData}
                onClick={() => setMode("RESEARCH")}
                className={`rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                  mode === "RESEARCH"
                    ? "border-primary bg-primary-soft/50"
                    : "border-lavender-border bg-white"
                }`}
              >
                <div className="text-sm font-extrabold text-primary-dark">
                  Gerçek Araştırma Katılımı
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Yalnızca izinler, veli onam protokolü ve görsel onayı tamamlandığında açılır.
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="participant-code" className="block text-sm font-extrabold text-ink">
                  Anonim Katılımcı Kodu (İsteğe bağlı — devam için aynı kodu girin)
                </label>
                <input
                  id="participant-code"
                  type="text"
                  value={participantCode}
                  onChange={(e) => setParticipantCode(e.target.value)}
                  placeholder="Boş bırakırsanız otomatik üretilir (örn. KAT-7A2B9C)"
                  className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {mode === "RESEARCH" && (
                <div className="space-y-1.5">
                  <label htmlFor="parental-code" className="block text-sm font-extrabold text-ink">
                    Veli Onamı / Araştırma İzin Kodu (Zorunlu)
                  </label>
                  <input
                    id="parental-code"
                    type="text"
                    required
                    value={parentalCode}
                    onChange={(e) => setParentalCode(e.target.value)}
                    placeholder="Araştırmacının verdiği onam takip kodu"
                    className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-lavender-border bg-lavender-card p-4 text-xs text-ink-muted space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-ink">
                <ShieldAlert className="h-4 w-4 text-primary" />
                18 Yaş Altı Katılımcılar İçin Etik Hatırlatma
              </div>
              <p>
                Gerçek araştırma uygulamasında 18 yaş altındaki katılımcılar için yazılı veli onamı
                ve kurum araştırma izinleri çalışma başlamadan önce tamamlanmış olmalıdır; bu
                onaylar yalnızca bir onay kutusuyla alınmış varsayılmaz.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-lavender-border bg-white p-4">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                required
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
              />
              <span className="text-xs leading-relaxed text-ink sm:text-sm">
                Çalışmanın amacını, anonim veri kullanım ilkelerini ve dilediğim zaman ayrılma
                hakkımı okudum; gönüllü olarak katılmayı onaylıyorum.
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/play" className="text-xs font-bold text-primary hover:underline">
                Araştırmaya katılmadan eğitici oyunu oynamak istiyorum →
              </Link>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting
                  ? "Oturum Hazırlanıyor..."
                  : mode === "DEMO"
                    ? "Demo Araştırma Akışını Başlat"
                    : "Araştırmaya Başla"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Çalışmadan Ayrılma & Veri Silme Talebi Modalı */}
      {showWithdraw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="card-surface w-full max-w-md space-y-4 p-6">
            <h3 className="font-display text-xl font-extrabold text-primary-dark">
              Çalışmadan Ayrılma Talebi
            </h3>
            <p className="text-xs leading-relaxed text-ink-muted">
              Araştırmadan istediğiniz zaman ayrılabilirsiniz. Dilerseniz anonim katılımcı kodunuza
              ait kayıtların araştırmacı tarafından kalıcı olarak silinmesini de talep edebilirsiniz.
            </p>
            <label className="flex items-start gap-2.5 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={requestDeletion}
                onChange={(e) => setRequestDeletion(e.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>Bu koda ait verilerimin silinmesini talep ediyorum.</span>
            </label>
            <textarea
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              placeholder="İsteğe bağlı not..."
              rows={2}
              className="w-full rounded-2xl border-2 border-lavender-border px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowWithdraw(false)} className="btn-secondary">
                Vazgeç
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleWithdraw()}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-rose-700"
              >
                Ayrılmayı Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseCard({
  title,
  detail,
  href,
  status,
}: {
  title: string;
  detail: string;
  href: string;
  status: "COMPLETED" | "ACTIVE" | "LOCKED";
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border-2 p-4 ${
        status === "ACTIVE"
          ? "border-primary bg-primary-soft/35"
          : status === "COMPLETED"
            ? "border-success/50 bg-success-soft/40"
            : "border-lavender-border bg-lavender-card/60 opacity-75"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base font-extrabold text-ink">{title}</h3>
          {status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-success-dark" />}
          {status === "LOCKED" && <Lock className="h-4 w-4 text-ink-subtle" />}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{detail}</p>
      </div>
      <div className="mt-4">
        {status === "ACTIVE" ? (
          <Link href={href} className="btn-primary w-full py-2.5 text-xs">
            Başla / Devam Et
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : status === "COMPLETED" ? (
          <span className="inline-block text-xs font-extrabold text-success-dark">Tamamlandı</span>
        ) : (
          <span className="inline-block text-xs font-bold text-ink-subtle">Kilitli</span>
        )}
      </div>
    </div>
  );
}
