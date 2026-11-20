import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getFormsForGroup, selectBalancedGroup, type StudyGroup } from "@/lib/study-engine";
import { getStudyConfig } from "@/lib/study-config";

describe("Veri Tabanı Bütünlüğü ve Araştırma Güvenlik Kuralları", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Seed sonrası veri tabanında tam 36 başlangıç senaryosu ve 6 karakter görsel çifti bulunur", async () => {
    const [scenarios, visuals] = await Promise.all([
      prisma.scenario.findMany(),
      prisma.characterVisualPair.findMany(),
    ]);

    expect(scenarios.length).toBeGreaterThanOrEqual(36);
    expect(visuals.length).toBeGreaterThanOrEqual(6);

    const formA = scenarios.filter((s) => s.formId === "A");
    const formB = scenarios.filter((s) => s.formId === "B");
    const formGame = scenarios.filter((s) => s.formId === "GAME");
    expect(formA.length).toBe(12);
    expect(formB.length).toBe(12);
    expect(formGame.length).toBe(12);

    // Tüm belirsizlik senaryoları UNKNOWN olmalı
    for (const sc of scenarios.filter((s) => s.scenarioType === "B")) {
      expect(sc.verifiedActor).toBe("UNKNOWN");
    }

    // Araştırma görselleri başlangıçta onaylanmamış DEMO MATERYALİ olmalı
    const researchVisuals = visuals.filter((v) => v.systemType === "RESEARCH");
    expect(researchVisuals.length).toBe(3);
    for (const rv of researchVisuals) {
      expect(rv.isDemoMaterial).toBe(true);
      expect(rv.approvedForResearch).toBe(false);
    }
  });

  it("Gerçek araştırma veri toplaması varsayılan olarak kapalıdır (STUDY_COLLECTION_ENABLED=false)", async () => {
    const readiness = await getStudyConfig();
    expect(readiness.canCollectRealResearchData).toBe(false);
    expect(readiness.readinessIssues.length).toBeGreaterThan(0);
  });

  it("Dört araştırma kolu ardışık katılımlarda dengeli atanır ve form sırası (A-B / B-A) korunur", () => {
    const counts: Record<StudyGroup, number> = {
      EXP_AB: 0,
      EXP_BA: 0,
      CTRL_AB: 0,
      CTRL_BA: 0,
    };

    for (let i = 0; i < 40; i++) {
      const assigned = selectBalancedGroup(counts, `KAT-BAL-${i}`);
      counts[assigned]++;
      const forms = getFormsForGroup(assigned);
      expect(forms.pretestForm).not.toBe(forms.posttestForm);
    }

    expect(counts.EXP_AB).toBe(10);
    expect(counts.EXP_BA).toBe(10);
    expect(counts.CTRL_AB).toBe(10);
    expect(counts.CTRL_BA).toBe(10);
  });
});
