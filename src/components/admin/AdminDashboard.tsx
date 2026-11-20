"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Plus,
} from "lucide-react";
import { AdminVisualsTab, type VisualPairRecord } from "@/components/admin/AdminVisualsTab";
import {
  AdminAnalyticsTab,
  type ScenarioDistributionItem,
} from "@/components/admin/AdminAnalyticsTab";
import type { ScientificIndicators } from "@/lib/metrics";

type TabId =
  | "overview"
  | "scenarios"
  | "visuals"
  | "settings"
  | "participants"
  | "analytics"
  | "export"
  | "notes";

interface AdminUserDTO {
  username: string;
  displayName: string;
  role: string;
}

interface OverviewResponse {
  dataMode: "real" | "demo";
  isDemoData: boolean;
  readiness: {
    canCollectRealResearchData: boolean;
    readinessIssues: string[];
    studyVersion: string;
    scenariosFrozen: boolean;
    followupEnabled: boolean;
  };
  summary: {
    totalParticipants: number;
    realParticipantCount: number;
    demoParticipantCount: number;
    expCount: number;
    ctrlCount: number;
    formACount: number;
    formBCount: number;
    completedPretests: number;
    completedPosttests: number;
    incompleteSessions: number;
    withdrawnCount: number;
    deletionRequestsCount: number;
    standaloneGameSessionCount: number;
  };
  indicators: {
    overall: ScientificIndicators;
    pretest: ScientificIndicators;
    posttest: ScientificIndicators;
  };
  scenarioDistributions: ScenarioDistributionItem[];
}

interface ScenarioRecord {
  id: string;
  version: string;
  formId: string;
  orderIndex: number;
  title: string;
  valueCategory: string;
  scenarioType: string;
  verifiedActor: string;
  behaviorIntent: string;
  isActive: boolean;
  approvedForResearch: boolean;
  expertReviewStatus: string;
  expertReviewNotes: string | null;
}

interface ParticipantRecord {
  id: string;
  anonymousParticipantId: string;
  isDemo: boolean;
  studyVersion: string;
  groupAssignment: string;
  pretestForm: string;
  posttestForm: string;
  currentPhase: string;
  withdrawnAt: string | null;
  deletionRequestedAt: string | null;
  deletionNote: string | null;
  createdAt: string;
  _count: { responses: number };
  sessions: Array<{
    id: string;
    phase: string;
    testForm: string;
    completionStatus: string;
  }>;
}

interface ExpertNoteRecord {
  id: string;
  authorName: string;
  authorRole: string;
  targetType: string;
  targetId: string | null;
  studyVersion: string;
  rating: number | null;
  note: string;
  status: string;
  createdAt: string;
}

interface SettingsResponse {
  config: {
    studyVersion: string;
    studyCollectionEnabled: boolean;
    ethicsApproved: boolean;
    parentalConsentProtocolReady: boolean;
    visualsApprovedForResearch: boolean;
    scenariosFrozen: boolean;
    frozenScenarioVersion: string | null;
    followupEnabled: boolean;
    followupDelayDays: number;
    demoDataEnabled: boolean;
  };
  envAllowsCollection: boolean;
  unapprovedResearchVisuals: number;
  readinessIssues: string[];
  canCollectRealResearchData: boolean;
  auditLogs: Array<{
    id: string;
    adminUsername: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
}

export function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [admin, setAdmin] = useState<AdminUserDTO | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<TabId>("overview");
  const [dataMode, setDataMode] = useState<"real" | "demo">("real");
  const [filters, setFilters] = useState({ form: "ALL", phase: "ALL", group: "ALL" });

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [scenariosFrozen, setScenariosFrozen] = useState(false);
  const [scenarioFormFilter, setScenarioFormFilter] = useState<string>("ALL");
  const [visuals, setVisuals] = useState<VisualPairRecord[]>([]);
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [notes, setNotes] = useState<ExpertNoteRecord[]>([]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV export options
  const [exportBom, setExportBom] = useState(true);

  // New expert note form
  const [noteAuthor, setNoteAuthor] = useState("");
  const [noteRole, setNoteRole] = useState("Alan Uzmanı / Danışman Öğretmen");
  const [noteTargetType, setNoteTargetType] = useState<"GENERAL" | "SCENARIO" | "VISUAL" | "PILOT">("PILOT");
  const [noteTargetId, setNoteTargetId] = useState("");
  const [noteText, setNoteText] = useState("");

  // New followup scenario form
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [newSc, setNewSc] = useState({
    id: "F01",
    formId: "FOLLOWUP" as "FOLLOWUP" | "GAME" | "A" | "B",
    title: "",
    valueCategory: "Dürüstlük",
    scenarioType: "B" as "B" | "K" | "Y",
    eventText: "",
    characterPairId: "RES_PAIR_1",
    clue1: "",
    clue2: "",
    verifiedActor: "UNKNOWN" as "A" | "B" | "UNKNOWN",
    contextExplanation: "Belirsizlik maddesi — yeterli kanıt yok.",
    teachingMessage: "Kanıt olmadan kesin hüküm vermemeliyiz.",
    researchQuestion: "Bu davranışı kim yapmış olabilir?",
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAdmin(json.admin);
      } else {
        setAdmin(null);
      }
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadOverview = useCallback(async () => {
    const qs = new URLSearchParams({
      dataMode,
      form: filters.form,
      phase: filters.phase,
      group: filters.group,
    });
    const res = await fetch(`/api/admin/overview?${qs.toString()}`, { cache: "no-store" });
    if (res.ok) setOverview(await res.json());
  }, [dataMode, filters]);

  const loadScenarios = useCallback(async () => {
    const res = await fetch("/api/admin/scenarios", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setScenarios(json.scenarios ?? []);
      setScenariosFrozen(Boolean(json.scenariosFrozen));
    }
  }, []);

  const loadVisuals = useCallback(async () => {
    const res = await fetch("/api/admin/visuals", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setVisuals(json.visuals ?? []);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    if (res.ok) setSettingsData(await res.json());
  }, []);

  const loadParticipants = useCallback(async () => {
    const res = await fetch(`/api/admin/participants?dataMode=${dataMode}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setParticipants(json.participants ?? []);
    }
  }, [dataMode]);

  const loadNotes = useCallback(async () => {
    const res = await fetch("/api/admin/notes", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setNotes(json.notes ?? []);
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    void loadOverview();
  }, [admin, loadOverview]);

  useEffect(() => {
    if (!admin) return;
    if (tab === "scenarios") void loadScenarios();
    if (tab === "visuals") void loadVisuals();
    if (tab === "settings") void loadSettings();
    if (tab === "participants") void loadParticipants();
    if (tab === "notes") void loadNotes();
  }, [admin, tab, loadScenarios, loadVisuals, loadSettings, loadParticipants, loadNotes]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Giriş başarısız.");
      setAdmin(json.admin);
      setLoginPass("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Giriş hatası.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
  }

  async function handleToggleVisualApprove(id: string, nextApproved: boolean) {
    setBusyId(id);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/visuals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedForResearch: nextApproved }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFlashMessage(`Görsel çifti (${id}) güncellendi.`);
      await Promise.all([loadVisuals(), loadOverview(), loadSettings()]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Güncelleme hatası.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateSettings(patch: Record<string, unknown>) {
    setErrorMessage(null);
    setFlashMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error || "Ayar güncellenemedi.");
      return;
    }
    setFlashMessage("Araştırma ayarları güncellendi.");
    await Promise.all([loadSettings(), loadOverview()]);
  }

  async function handleToggleScenarioApproval(sc: ScenarioRecord) {
    setBusyId(sc.id);
    setErrorMessage(null);
    const res = await fetch(`/api/admin/scenarios/${sc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvedForResearch: !sc.approvedForResearch,
        expertReviewStatus: !sc.approvedForResearch ? "APPROVED" : "PILOT",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error || "Senaryo güncellenemedi.");
    } else {
      setFlashMessage(`Senaryo ${sc.id} güncellendi.`);
      await loadScenarios();
    }
    setBusyId(null);
  }

  async function handleCreateScenario(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const res = await fetch("/api/admin/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newSc,
        clue1: newSc.clue1.trim() || null,
        clue2: newSc.clue2.trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error || "Senaryo eklenemedi.");
      return;
    }
    setFlashMessage(`Yeni senaryo (${json.scenario.id}) eklendi.`);
    setShowNewScenario(false);
    await loadScenarios();
  }

  async function handleDeleteParticipant(id: string) {
    setBusyId(id);
    setErrorMessage(null);
    const res = await fetch(`/api/admin/participants/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error || "Katılımcı silinemedi.");
    } else {
      setFlashMessage(`Katılımcı (${json.anonymousParticipantId}) verileri kalıcı olarak silindi.`);
      await Promise.all([loadParticipants(), loadOverview()]);
    }
    setBusyId(null);
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: noteAuthor,
        authorRole: noteRole,
        targetType: noteTargetType,
        targetId: noteTargetId.trim() || null,
        note: noteText,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error || "Not eklenemedi.");
      return;
    }
    setNoteText("");
    setFlashMessage("Uzman değerlendirme notu kaydedildi.");
    await loadNotes();
  }

  async function handleToggleNoteStatus(note: ExpertNoteRecord) {
    const nextStatus = note.status === "OPEN" ? "RESOLVED" : "OPEN";
    await fetch(`/api/admin/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadNotes();
  }

  if (!authChecked) {
    return (
      <div className="card-surface p-8 text-center text-sm font-bold text-primary-dark">
        Yönetici oturumu kontrol ediliyor...
      </div>
    );
  }

  // Kimlik doğrulama ekranı
  if (!admin) {
    return (
      <div className="mx-auto max-w-md">
        <section className="card-surface space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-primary-dark">
                Araştırmacı Girişi
              </h1>
              <p className="text-xs text-ink-muted">
                Yönetim paneli yalnızca yetkili araştırmacılara açıktır.
              </p>
            </div>
          </div>

          {loginError && (
            <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-900">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-user" className="block text-sm font-extrabold text-ink">
                Kullanıcı Adı
              </label>
              <input
                id="admin-user"
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="username"
                className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-pass" className="block text-sm font-extrabold text-ink">
                Parola
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl border-2 border-lavender-border bg-white px-4 py-3 text-sm"
              />
            </div>
            <button type="submit" disabled={loginBusy} className="btn-primary w-full">
              {loginBusy ? "Giriş yapılıyor..." : "Panele Giriş Yap"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "1. Genel Durum", icon: Database },
    { id: "scenarios", label: "2. Senaryolar", icon: FileText },
    { id: "visuals", label: "3. Görseller", icon: ImageIcon },
    { id: "settings", label: "4. Ayarlar", icon: Settings },
    { id: "participants", label: "5. Katılımcılar", icon: Users },
    { id: "analytics", label: "6. Veri Analizi", icon: BarChart3 },
    { id: "export", label: "7. Dışa Aktarma", icon: FileSpreadsheet },
    { id: "notes", label: "8. Uzman Notları", icon: MessageSquareText },
  ];

  const exportUrl = `/api/admin/export?dataMode=${dataMode}&bom=${exportBom ? "1" : "0"}&form=${filters.form}&phase=${filters.phase}&group=${filters.group}`;

  return (
    <div className="space-y-5">
      {/* Yönetici Üst Bandı */}
      <div className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-extrabold text-primary-dark">
              <ShieldCheck className="h-3.5 w-3.5" />
              Araştırmacı Yönetim Paneli
            </span>
            <span className="text-xs font-bold text-ink-muted">
              {admin.displayName} (@{admin.username})
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-primary-dark">
            Önyargı Avcısı Araştırma Kontrol Merkezi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gerçek vs Demo Veri Kaynağı Seçici */}
          <div className="flex rounded-2xl border-2 border-lavender-border bg-lavender-card p-1 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setDataMode("real")}
              className={`rounded-xl px-3 py-1.5 transition-colors ${
                dataMode === "real" ? "bg-primary text-white" : "text-ink-muted"
              }`}
            >
              Araştırma Verisi ({overview?.summary.realParticipantCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setDataMode("demo")}
              className={`rounded-xl px-3 py-1.5 transition-colors ${
                dataMode === "demo" ? "bg-amber-500 text-white" : "text-ink-muted"
              }`}
            >
              DEMO VERİSİ ({overview?.summary.demoParticipantCount ?? 0})
            </button>
          </div>
          <button type="button" onClick={() => void handleLogout()} className="btn-secondary py-2 text-xs">
            <LogOut className="h-4 w-4" />
            Çıkış
          </button>
        </div>
      </div>

      {/* 8 Sekmeli Gezinme */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Yönetim paneli bölümleri">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(t.id);
                setFlashMessage(null);
                setErrorMessage(null);
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3.5 py-2 text-xs font-extrabold transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-lavender-border bg-white text-ink hover:border-primary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {flashMessage && (
        <div className="rounded-2xl border border-success bg-success-soft px-4 py-3 text-xs font-bold text-success-dark">
          {flashMessage}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-900">
          {errorMessage}
        </div>
      )}

      {/* 1. GENEL DURUM */}
      {tab === "overview" && overview && (
        <div className="space-y-5">
          {overview.isDemoData && (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3.5 text-xs font-extrabold text-amber-950">
              DEMO VERİSİ: Bu sekmedeki istatistikler yalnızca demo / pilot oturumlarına aittir ve
              gerçek araştırma veri kümesinden tamamen ayrıdır.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <KpiBox label="Toplam Katılımcı" value={overview.summary.totalParticipants} />
            <KpiBox
              label="Deney / Kontrol"
              value={`${overview.summary.expCount} / ${overview.summary.ctrlCount}`}
            />
            <KpiBox
              label="Form A / B (Ön Test)"
              value={`${overview.summary.formACount} / ${overview.summary.formBCount}`}
            />
            <KpiBox label="Tamamlanan Ön Test" value={overview.summary.completedPretests} />
            <KpiBox label="Tamamlanan Son Test" value={overview.summary.completedPosttests} />
            <KpiBox label="Eksik / Devam Eden Oturum" value={overview.summary.incompleteSessions} />
            <KpiBox
              label="Ayrılan / Silme Talebi"
              value={`${overview.summary.withdrawnCount} / ${overview.summary.deletionRequestsCount}`}
            />
            <KpiBox
              label="Ayrı Oyun Oturumları"
              value={overview.summary.standaloneGameSessionCount}
            />
          </div>

          <div className="card-surface space-y-2 p-5">
            <h2 className="font-display text-lg font-extrabold text-primary-dark">
              Araştırma Veri Toplama Hazırlık Durumu
            </h2>
            <p className="text-xs text-ink-muted">
              Aktif sürüm: <strong>{overview.readiness.studyVersion}</strong> • Senaryo Kilidi:{" "}
              <strong>{overview.readiness.scenariosFrozen ? "Donduruldu" : "Açık"}</strong>
            </p>
            {overview.readiness.canCollectRealResearchData ? (
              <p className="text-sm font-bold text-success-dark">
                Tüm etik, veli onamı ve görsel onay koşulları tamamlandı; gerçek veri toplama açık.
              </p>
            ) : (
              <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1">
                {overview.readiness.readinessIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 2. SENARYO YÖNETİMİ */}
      {tab === "scenarios" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["ALL", "GAME", "A", "B", "FOLLOWUP"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setScenarioFormFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold ${
                    scenarioFormFilter === f
                      ? "bg-primary text-white"
                      : "border border-lavender-border bg-white text-ink"
                  }`}
                >
                  {f === "ALL" ? `Tümü (${scenarios.length})` : `Form ${f}`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNewScenario((s) => !s)}
              className="btn-primary py-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              Yeni Senaryo / İzleme Maddesi Ekle
            </button>
          </div>

          {scenariosFrozen && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-950">
              Ölçüm formu (A/B) senaryoları gerçek araştırma başladığı için dondurulmuştur. Yalnızca
              yeni İzleme Testi (FOLLOWUP) senaryoları eklenebilir.
            </div>
          )}

          {showNewScenario && (
            <form onSubmit={handleCreateScenario} className="card-surface space-y-3 p-5">
              <h3 className="font-display text-base font-extrabold text-primary-dark">
                Yeni Sürümlenmiş Senaryo Ekle
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  required
                  placeholder="ID (örn. F01)"
                  value={newSc.id}
                  onChange={(e) => setNewSc({ ...newSc, id: e.target.value.toUpperCase() })}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                />
                <select
                  value={newSc.formId}
                  onChange={(e) =>
                    setNewSc({ ...newSc, formId: e.target.value as "FOLLOWUP" | "GAME" | "A" | "B" })
                  }
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                >
                  <option value="FOLLOWUP">FOLLOWUP (İzleme Testi)</option>
                  <option value="GAME">GAME (Eğitici Oyun)</option>
                  <option value="A">Form A</option>
                  <option value="B">Form B</option>
                </select>
                <select
                  value={newSc.scenarioType}
                  onChange={(e) => {
                    const t = e.target.value as "B" | "K" | "Y";
                    setNewSc({
                      ...newSc,
                      scenarioType: t,
                      verifiedActor: t === "B" ? "UNKNOWN" : newSc.verifiedActor,
                    });
                  }}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                >
                  <option value="B">B — Belirsizlik (UNKNOWN)</option>
                  <option value="K">K — Kanıtlı</option>
                  <option value="Y">Y — Bağlamlı</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  required
                  placeholder="Başlık"
                  value={newSc.title}
                  onChange={(e) => setNewSc({ ...newSc, title: e.target.value })}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Değer Kategorisi"
                  value={newSc.valueCategory}
                  onChange={(e) => setNewSc({ ...newSc, valueCategory: e.target.value })}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                />
                <select
                  value={newSc.verifiedActor}
                  disabled={newSc.scenarioType === "B"}
                  onChange={(e) =>
                    setNewSc({ ...newSc, verifiedActor: e.target.value as "A" | "B" | "UNKNOWN" })
                  }
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                >
                  <option value="UNKNOWN">Doğrulanan Kişi: UNKNOWN</option>
                  <option value="A">Doğrulanan Kişi: A</option>
                  <option value="B">Doğrulanan Kişi: B</option>
                </select>
              </div>
              <textarea
                required
                rows={2}
                placeholder="Olay metni..."
                value={newSc.eventText}
                onChange={(e) => setNewSc({ ...newSc, eventText: e.target.value })}
                className="w-full rounded-xl border border-lavender-border px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="1. İpucu (isteğe bağlı; {ACTOR} yer tutucusu kullanılabilir)"
                  value={newSc.clue1}
                  onChange={(e) => setNewSc({ ...newSc, clue1: e.target.value })}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                />
                <input
                  placeholder="2. İpucu / Bağlam (Y senaryoları için)"
                  value={newSc.clue2}
                  onChange={(e) => setNewSc({ ...newSc, clue2: e.target.value })}
                  className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewScenario(false)} className="btn-secondary py-2 text-xs">
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 text-xs">
                  Senaryoyu Kaydet
                </button>
              </div>
            </form>
          )}

          <div className="card-surface overflow-x-auto p-4">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-lavender-border text-ink-muted">
                  <th className="py-2 pr-3 font-extrabold">ID</th>
                  <th className="py-2 pr-3 font-extrabold">Form</th>
                  <th className="py-2 pr-3 font-extrabold">Tür</th>
                  <th className="py-2 pr-3 font-extrabold">Başlık &amp; Kategori</th>
                  <th className="py-2 pr-3 font-extrabold">Doğrulanan / Niyet</th>
                  <th className="py-2 pr-3 font-extrabold">Durum</th>
                  <th className="py-2 font-extrabold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-border/60">
                {scenarios
                  .filter((s) => scenarioFormFilter === "ALL" || s.formId === scenarioFormFilter)
                  .map((sc) => (
                    <tr key={sc.id}>
                      <td className="py-2.5 pr-3 font-mono font-extrabold text-primary-dark">{sc.id}</td>
                      <td className="py-2.5 pr-3 font-bold">{sc.formId}</td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded bg-primary-soft px-2 py-0.5 font-extrabold text-primary-dark">
                          {sc.scenarioType}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-ink">{sc.title}</div>
                        <div className="text-[11px] text-ink-muted">{sc.valueCategory}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px]">
                        {sc.verifiedActor} / {sc.behaviorIntent}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            sc.approvedForResearch
                              ? "bg-success-soft text-success-dark"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {sc.expertReviewStatus}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          disabled={busyId === sc.id || (scenariosFrozen && (sc.formId === "A" || sc.formId === "B"))}
                          onClick={() => void handleToggleScenarioApproval(sc)}
                          className="rounded-lg border border-lavender-border px-2.5 py-1 text-[11px] font-bold hover:border-primary disabled:opacity-45"
                        >
                          {sc.approvedForResearch ? "Onayı Kaldır" : "Onayla"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. KARAKTER VE GÖRSEL YÖNETİMİ */}
      {tab === "visuals" && (
        <AdminVisualsTab
          visuals={visuals}
          onToggleApprove={handleToggleVisualApprove}
          busyId={busyId}
        />
      )}

      {/* 4. ARAŞTIRMA AYARLARI */}
      {tab === "settings" && settingsData && (
        <div className="space-y-5">
          <div className="card-surface space-y-4 p-5">
            <h2 className="font-display text-lg font-extrabold text-primary-dark">
              Araştırma Koşulları ve Veri Toplama Kilidi
            </h2>
            <p className="text-xs text-ink-muted">
              Ortam değişkeni <code>STUDY_COLLECTION_ENABLED</code> şu anda:{" "}
              <strong>{settingsData.envAllowsCollection ? "true" : "false"}</strong>
            </p>

            <div className="space-y-2.5">
              <SettingToggle
                label="Etik ve kurum araştırma izinleri doğrulandı"
                checked={settingsData.config.ethicsApproved}
                onChange={(v) => void handleUpdateSettings({ ethicsApproved: v })}
              />
              <SettingToggle
                label="18 yaş altı veli onam protokolü tamamlandı"
                checked={settingsData.config.parentalConsentProtocolReady}
                onChange={(v) => void handleUpdateSettings({ parentalConsentProtocolReady: v })}
              />
              <SettingToggle
                label="Kontrollü araştırma görselleri onaylandı"
                description={`Onay bekleyen araştırma görsel çifti: ${settingsData.unapprovedResearchVisuals}`}
                checked={settingsData.config.visualsApprovedForResearch}
                onChange={(v) => void handleUpdateSettings({ visualsApprovedForResearch: v })}
              />
              <SettingToggle
                label="Ölçüm senaryo sürümlerini dondur (değişiklik kilidi)"
                checked={settingsData.config.scenariosFrozen}
                onChange={(v) => void handleUpdateSettings({ scenariosFrozen: v })}
              />
              <SettingToggle
                label="Gerçek araştırma veri toplamayı etkinleştir"
                description="Açıldığında ölçüm senaryoları otomatik dondurulur."
                checked={settingsData.config.studyCollectionEnabled}
                onChange={(v) => void handleUpdateSettings({ studyCollectionEnabled: v })}
              />
              <SettingToggle
                label="İzleme testi modülünü etkinleştir (2–4 hafta sonrası için)"
                checked={settingsData.config.followupEnabled}
                onChange={(v) => void handleUpdateSettings({ followupEnabled: v })}
              />
            </div>
          </div>

          <div className="card-surface space-y-2 p-5">
            <h3 className="font-display text-base font-extrabold text-primary-dark">
              Son Yönetici İşlem Kayıtları (Denetim İzi)
            </h3>
            <ul className="divide-y divide-lavender-border/60 text-xs">
              {settingsData.auditLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    <strong className="text-primary-dark">{log.action}</strong> — {log.details}
                  </span>
                  <span className="text-ink-muted">
                    {log.adminUsername} • {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 5. KATILIMCI OTURUMLARI */}
      {tab === "participants" && (
        <div className="card-surface overflow-x-auto p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold text-primary-dark">
              Katılımcı Oturumları ({dataMode === "demo" ? "DEMO VERİSİ" : "GERÇEK ARAŞTIRMA"})
            </h2>
            <p className="text-xs text-ink-muted">
              Yalnızca anonim kodlar gösterilir. Ayrılma/silme talebi olan kayıtlar kalıcı olarak silinebilir.
            </p>
          </div>
          {participants.length === 0 ? (
            <p className="text-sm text-ink-muted">Bu veri kümesinde henüz katılımcı oturumu yok.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-lavender-border text-ink-muted">
                  <th className="py-2 pr-3 font-extrabold">Anonim Kod</th>
                  <th className="py-2 pr-3 font-extrabold">Grup / Formlar</th>
                  <th className="py-2 pr-3 font-extrabold">Mevcut Aşama</th>
                  <th className="py-2 pr-3 font-extrabold">Yanıt Sayısı</th>
                  <th className="py-2 pr-3 font-extrabold">Ayrılma / Silme Talebi</th>
                  <th className="py-2 font-extrabold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-border/60">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 font-mono font-extrabold text-primary-dark">
                      {p.anonymousParticipantId}
                    </td>
                    <td className="py-2.5 pr-3 font-bold">
                      {p.groupAssignment} (Ön:{p.pretestForm} → Son:{p.posttestForm})
                    </td>
                    <td className="py-2.5 pr-3">{p.currentPhase}</td>
                    <td className="py-2.5 pr-3 font-bold">{p._count.responses}</td>
                    <td className="py-2.5 pr-3">
                      {p.deletionRequestedAt ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                          Silme talebi var
                        </span>
                      ) : p.withdrawnAt ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                          Ayrıldı
                        </span>
                      ) : (
                        <span className="text-ink-muted">Aktif</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        disabled={
                          busyId === p.id ||
                          (!p.isDemo && !p.withdrawnAt && !p.deletionRequestedAt)
                        }
                        onClick={() => void handleDeleteParticipant(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Veriyi Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 6. VERİ ANALİZİ */}
      {tab === "analytics" && overview && (
        <AdminAnalyticsTab
          isDemoData={overview.isDemoData}
          indicators={overview.indicators}
          scenarioDistributions={overview.scenarioDistributions}
          filters={filters}
          onChangeFilter={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        />
      )}

      {/* 7. VERİ DIŞA AKTARMA */}
      {tab === "export" && (
        <div className="card-surface space-y-4 p-6">
          <h2 className="font-display text-lg font-extrabold text-primary-dark">
            Anonim CSV Veri Dışa Aktarma
          </h2>
          <p className="text-sm text-ink-muted">
            Dışa aktarılan dosyalarda hiçbir gerçek kimlik bilgisi yer almaz. Seçili veri kaynağı:{" "}
            <strong className="text-ink">
              {dataMode === "demo" ? "DEMO VERİSİ" : "GERÇEK ARAŞTIRMA VERİSİ"}
            </strong>
            .
          </p>

          <label className="flex items-center gap-2.5 text-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={exportBom}
              onChange={(e) => setExportBom(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Excel uyumlu UTF-8 BOM ekle (Türkçe karakterlerin doğru açılması için önerilir)</span>
          </label>

          <div>
            <a href={exportUrl} download className="btn-primary text-sm">
              <Download className="h-4 w-4" />
              CSV Dosyasını İndir ({dataMode === "demo" ? "DEMO" : "ARAŞTIRMA"})
            </a>
          </div>
        </div>
      )}

      {/* 8. UZMAN DEĞERLENDİRME VE PİLOT SÜRÜM NOTLARI */}
      {tab === "notes" && (
        <div className="space-y-4">
          <form onSubmit={handleCreateNote} className="card-surface space-y-3 p-5">
            <h2 className="font-display text-lg font-extrabold text-primary-dark">
              Yeni Uzman Değerlendirme / Pilot Notu Ekle
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                required
                placeholder="Değerlendirici Adı"
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Rolü / Uzmanlık"
                value={noteRole}
                onChange={(e) => setNoteRole(e.target.value)}
                className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
              />
              <select
                value={noteTargetType}
                onChange={(e) =>
                  setNoteTargetType(e.target.value as "GENERAL" | "SCENARIO" | "VISUAL" | "PILOT")
                }
                className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
              >
                <option value="PILOT">Pilot Uygulama</option>
                <option value="SCENARIO">Senaryo</option>
                <option value="VISUAL">Karakter Görseli</option>
                <option value="GENERAL">Genel</option>
              </select>
              <input
                placeholder="Hedef ID (örn. A03, RES_PAIR_1)"
                value={noteTargetId}
                onChange={(e) => setNoteTargetId(e.target.value)}
                className="rounded-xl border border-lavender-border px-3 py-2 text-sm"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder="Uzman görüşü, madde geçerliliği veya pilot gözlem notu..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full rounded-xl border border-lavender-border px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary py-2 text-xs">
                Notu Kaydet
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="card-surface flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-extrabold text-primary-dark">
                      {n.targetType}
                      {n.targetId ? ` • ${n.targetId}` : ""}
                    </span>
                    <span className="font-bold text-ink">{n.authorName}</span>
                    <span className="text-ink-muted">({n.authorRole})</span>
                    <span className="text-ink-subtle">v{n.studyVersion}</span>
                  </div>
                  <p className="text-sm text-ink">{n.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleNoteStatus(n)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold ${
                    n.status === "RESOLVED"
                      ? "bg-success-soft text-success-dark"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {n.status === "RESOLVED" ? "Çözüldü" : "Açık (Çözüldü İşaretle)"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs font-bold text-ink-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold text-primary-dark">{value}</div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-lavender-border bg-lavender-card/70 px-4 py-3">
      <div>
        <div className="text-sm font-bold text-ink">{label}</div>
        {description && <div className="text-xs text-ink-muted">{description}</div>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
    </label>
  );
}
