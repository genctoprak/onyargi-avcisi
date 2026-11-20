"use client";

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { CharacterAvatar } from "@/components/illustrations/CharacterAvatar";

export interface VisualPairRecord {
  id: string;
  version: string;
  systemType: string;
  title: string;
  variableName: string;
  variantA1Key: string;
  variantA2Key: string;
  variantB1Key: string;
  variantB2Key: string;
  variantA1Label: string;
  variantA2Label: string;
  variantB1Label: string;
  variantB2Label: string;
  isDemoMaterial: boolean;
  approvedForResearch: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  _count: { scenarios: number };
}

export function AdminVisualsTab({
  visuals,
  onToggleApprove,
  busyId,
}: {
  visuals: VisualPairRecord[];
  onToggleApprove: (id: string, nextApproved: boolean) => Promise<void>;
  busyId: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
        <strong>Kontrollü Görsel Standardı:</strong> Araştırma görselleri (<code>RESEARCH</code>)
        tek değişkenli üst giyim karşılaştırması (sweatshirt vs yakalı gömlek) kullanır. Araştırmacı
        onayından geçmeyen görseller <strong>DEMO MATERYALİ</strong> olarak işaretlenir ve gerçek
        veri toplama başlatılamaz.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visuals.map((v) => (
          <div key={v.id} className="card-surface space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-extrabold text-primary-dark">
                    {v.systemType === "RESEARCH" ? "ARAŞTIRMA GÖRSELİ" : "OYUN GÖRSELİ"}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink-muted">
                    {v.id} • v{v.version}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-base font-extrabold text-ink">{v.title}</h3>
                <p className="text-xs text-ink-muted">
                  Değişken: <code>{v.variableName}</code> • Bağlı senaryo: {v._count.scenarios}
                </p>
              </div>

              {v.systemType === "RESEARCH" && (
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => void onToggleApprove(v.id, !v.approvedForResearch)}
                  className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-colors ${
                    v.approvedForResearch
                      ? "bg-success-soft text-success-dark hover:bg-amber-100 hover:text-amber-900"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {v.approvedForResearch ? "Onaylandı (Geri Al)" : "Araştırma İçin Onayla"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1 text-center">
                <CharacterAvatar
                  visualKey={v.variantA1Key}
                  slotLabel="A"
                  isDemoMaterial={v.isDemoMaterial}
                  approvedForResearch={v.approvedForResearch}
                  compact
                />
                <p className="text-[10px] font-semibold text-ink-muted">{v.variantA1Label}</p>
              </div>
              <div className="space-y-1 text-center">
                <CharacterAvatar
                  visualKey={v.variantA2Key}
                  slotLabel="A"
                  isDemoMaterial={v.isDemoMaterial}
                  approvedForResearch={v.approvedForResearch}
                  compact
                />
                <p className="text-[10px] font-semibold text-ink-muted">{v.variantA2Label}</p>
              </div>
              <div className="space-y-1 text-center">
                <CharacterAvatar
                  visualKey={v.variantB1Key}
                  slotLabel="B"
                  isDemoMaterial={v.isDemoMaterial}
                  approvedForResearch={v.approvedForResearch}
                  compact
                />
                <p className="text-[10px] font-semibold text-ink-muted">{v.variantB1Label}</p>
              </div>
              <div className="space-y-1 text-center">
                <CharacterAvatar
                  visualKey={v.variantB2Key}
                  slotLabel="B"
                  isDemoMaterial={v.isDemoMaterial}
                  approvedForResearch={v.approvedForResearch}
                  compact
                />
                <p className="text-[10px] font-semibold text-ink-muted">{v.variantB2Label}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {v.systemType === "RESEARCH" ? (
                v.approvedForResearch ? (
                  <span className="inline-flex items-center gap-1 font-bold text-success-dark">
                    <CheckCircle2 className="h-4 w-4" />
                    Onaylayan: {v.approvedBy ?? "Araştırmacı"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    DEMO MATERYALİ — Araştırmacı onayı bekleniyor
                  </span>
                )
              ) : (
                <span className="text-ink-muted">Eğitici oyun modu illüstrasyonu</span>
              )}
            </div>
            {v.notes && <p className="text-xs text-ink-muted">{v.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
