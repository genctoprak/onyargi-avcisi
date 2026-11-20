"use client";

import React from "react";
import type { ScientificIndicators } from "@/lib/metrics";

export interface ScenarioDistributionItem {
  scenarioId: string;
  title: string;
  formId: string;
  scenarioType: string;
  total: number;
  firstA: number;
  firstB: number;
  firstUnknown: number;
  secondA: number;
  secondB: number;
  secondUnknown: number;
  sweatshirtChosen: number;
  collaredChosen: number;
}

export function AdminAnalyticsTab({
  isDemoData,
  indicators,
  scenarioDistributions,
  filters,
  onChangeFilter,
}: {
  isDemoData: boolean;
  indicators: {
    overall: ScientificIndicators;
    pretest: ScientificIndicators;
    posttest: ScientificIndicators;
  };
  scenarioDistributions: ScenarioDistributionItem[];
  filters: { form: string; phase: string; group: string };
  onChangeFilter: (patch: Partial<{ form: string; phase: string; group: string }>) => void;
}) {
  const { overall, pretest, posttest } = indicators;

  return (
    <div className="space-y-5">
      {isDemoData && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3.5 text-xs font-extrabold text-amber-950">
          DEMO VERİSİ GÖRÜNTÜLENİYOR — Aşağıdaki göstergeler ve grafikler yalnızca pilot/demo
          oturumlarından üretilmiştir; gerçek araştırma verilerinden tamamen ayrıdır.
        </div>
      )}

      {/* Filtreler */}
      <div className="card-surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold text-ink-muted">Form Filtresi</label>
          <select
            value={filters.form}
            onChange={(e) => onChangeFilter({ form: e.target.value })}
            className="mt-1 w-full rounded-xl border border-lavender-border bg-white px-3 py-2 text-sm font-semibold"
          >
            <option value="ALL">Tüm Formlar</option>
            <option value="A">Form A</option>
            <option value="B">Form B</option>
            <option value="GAME">Eğitim (GAME)</option>
            <option value="FOLLOWUP">İzleme (FOLLOWUP)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-muted">Aşama Filtresi</label>
          <select
            value={filters.phase}
            onChange={(e) => onChangeFilter({ phase: e.target.value })}
            className="mt-1 w-full rounded-xl border border-lavender-border bg-white px-3 py-2 text-sm font-semibold"
          >
            <option value="ALL">Tüm Aşamalar</option>
            <option value="PRETEST">Ön Test</option>
            <option value="INTERVENTION">Eğitim</option>
            <option value="POSTTEST">Son Test</option>
            <option value="FOLLOWUP">İzleme Testi</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-muted">Grup Filtresi</label>
          <select
            value={filters.group}
            onChange={(e) => onChangeFilter({ group: e.target.value })}
            className="mt-1 w-full rounded-xl border border-lavender-border bg-white px-3 py-2 text-sm font-semibold"
          >
            <option value="ALL">Tüm Gruplar</option>
            <option value="EXP_AB">Deney A-B</option>
            <option value="EXP_BA">Deney B-A</option>
            <option value="CTRL_AB">Kontrol A-B</option>
            <option value="CTRL_BA">Kontrol B-A</option>
          </select>
        </div>
      </div>

      {/* 5 Bilimsel Gösterge */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <IndicatorCard
          title="Kanıtsız Kesin Karar Oranı (KKO)"
          value={overall.kkoPercent !== null ? `%${overall.kkoPercent}` : "Veri yok"}
          detail={`Belirsizlik sorularında A/B seçimi: ${overall.kkoNumerator} / ${overall.kkoDenominator}`}
          comparison={`Ön test: ${pretest.kkoPercent !== null ? `%${pretest.kkoPercent}` : "—"} | Son test: ${posttest.kkoPercent !== null ? `%${posttest.kkoPercent}` : "—"}`}
        />
        <IndicatorCard
          title="Kanıta Uygun Karar Oranı (KUK)"
          value={overall.kukPercent !== null ? `%${overall.kukPercent}` : "Veri yok"}
          detail={`Kanıt sonrası uyumlu karar: ${overall.kukNumerator} / ${overall.kukDenominator}`}
          comparison={`Ön test: ${pretest.kukPercent !== null ? `%${pretest.kukPercent}` : "—"} | Son test: ${posttest.kukPercent !== null ? `%${posttest.kukPercent}` : "—"}`}
        />
        <IndicatorCard
          title="Görünüşe Bağlı Seçim Etkisi"
          value={
            overall.appearanceEffect.probabilityDiffPercent !== null
              ? `${overall.appearanceEffect.probabilityDiffPercent > 0 ? "+" : ""}${overall.appearanceEffect.probabilityDiffPercent} puan`
              : "Veri yok"
          }
          detail={`Sweatshirt: %${overall.appearanceEffect.sweatshirtChoiceRate ?? "—"} (${overall.appearanceEffect.sweatshirtChosenCount}) | Gömlek: %${overall.appearanceEffect.collaredChoiceRate ?? "—"} (${overall.appearanceEffect.collaredChosenCount})`}
          comparison={`Geçerli A/B seçimi: n=${overall.appearanceEffect.validDecisiveCount}`}
        />
        <IndicatorCard
          title="Karar Güveni (1–5)"
          value={
            overall.avgFirstConfidence !== null ? `${overall.avgFirstConfidence} / 5` : "Veri yok"
          }
          detail={`İlk karar ort.: ${overall.avgFirstConfidence ?? "—"} | Son karar ort.: ${overall.avgSecondConfidence ?? "—"}`}
          comparison={`Ön test ilk güven: ${pretest.avgFirstConfidence ?? "—"} | Son test: ${posttest.avgFirstConfidence ?? "—"}`}
        />
        <IndicatorCard
          title="Bağlam Etkisi (1–5 Farkı)"
          value={
            overall.contextEffectDelta !== null
              ? `${overall.contextEffectDelta > 0 ? "+" : ""}${overall.contextEffectDelta}`
              : "Veri yok"
          }
          detail={`Bağlam öncesi: ${overall.avgInterpretationBefore ?? "—"} → Sonrası: ${overall.avgInterpretationAfter ?? "—"}`}
          comparison={`Geçerli bağlam (Y) yanıtı: n=${overall.contextSampleSize}`}
        />
        <IndicatorCard
          title="Toplam Geçerli Yanıt"
          value={String(overall.totalResponses)}
          detail="Yalnızca tamamlanmış (COMPLETED) ölçüm yanıtları hesaplamaya katılır."
          comparison="Not: Göstergeler tanı veya kişilik etiketi değildir."
        />
      </div>

      {/* Senaryo Bazlı Cevap Dağılımı & Görünüş Karşılaştırması */}
      <div className="card-surface overflow-hidden p-5">
        <h3 className="font-display text-lg font-extrabold text-primary-dark">
          Senaryo Bazlı Yanıt Dağılımı ve Görünüş Sürümleri Karşılaştırması
        </h3>
        {scenarioDistributions.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Seçili filtrelerde henüz tamamlanmış ölçüm yanıtı bulunmamaktadır.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="border-b border-lavender-border text-ink-muted">
                  <th className="py-2 pr-3 font-extrabold">Senaryo</th>
                  <th className="py-2 pr-3 font-extrabold">Tür</th>
                  <th className="py-2 pr-3 font-extrabold">n</th>
                  <th className="py-2 pr-3 font-extrabold">İlk Seçim (A / B / Belirsiz)</th>
                  <th className="py-2 pr-3 font-extrabold">Son Seçim (A / B / Belirsiz)</th>
                  <th className="py-2 font-extrabold">Kıyafet Dağılımı (Sweatshirt vs Gömlek)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-border/60">
                {scenarioDistributions.map((s) => {
                  const totalStyle = s.sweatshirtChosen + s.collaredChosen;
                  const sweatPct = totalStyle > 0 ? Math.round((s.sweatshirtChosen / totalStyle) * 100) : 0;
                  return (
                    <tr key={s.scenarioId}>
                      <td className="py-2.5 pr-3 font-bold text-ink">
                        {s.scenarioId} — {s.title}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded bg-primary-soft px-2 py-0.5 font-extrabold text-primary-dark">
                          {s.scenarioType}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-bold">{s.total}</td>
                      <td className="py-2.5 pr-3">
                        {s.firstA} / {s.firstB} / {s.firstUnknown}
                      </td>
                      <td className="py-2.5 pr-3">
                        {s.secondA} / {s.secondB} / {s.secondUnknown}
                      </td>
                      <td className="py-2.5">
                        {totalStyle > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span>Sweat: {s.sweatshirtChosen} (%{sweatPct})</span>
                              <span>Gömlek: {s.collaredChosen} (%{100 - sweatPct})</span>
                            </div>
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-lavender-bg">
                              <div className="bg-primary" style={{ width: `${sweatPct}%` }} />
                              <div className="bg-accent" style={{ width: `${100 - sweatPct}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function IndicatorCard({
  title,
  value,
  detail,
  comparison,
}: {
  title: string;
  value: string;
  detail: string;
  comparison: string;
}) {
  return (
    <div className="card-surface space-y-1.5 p-4">
      <div className="text-xs font-extrabold text-ink-muted">{title}</div>
      <div className="font-display text-2xl font-extrabold text-primary-dark">{value}</div>
      <div className="text-xs text-ink">{detail}</div>
      <div className="pt-1 text-[11px] font-semibold text-primary">{comparison}</div>
    </div>
  );
}
