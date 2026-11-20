import { describe, it, expect } from "vitest";
import { SCENARIOS_SEED, VISUAL_PAIRS_SEED } from "@/data/scenarios-manifest";
import {
  buildScenarioAssignments,
  displayedToCanonicalChoice,
  getFormsForGroup,
  resolveClueText,
  sanitizeScenarioForStudyTest,
  selectBalancedGroup,
  type StudyGroup,
} from "@/lib/study-engine";
import { calculateGameScenarioScore } from "@/lib/scoring";
import { calculateScientificIndicators } from "@/lib/metrics";
import { buildAnonymousCsv } from "@/lib/csv";
import { hashPassword, signToken, verifyPassword, verifyToken } from "@/lib/crypto";

describe("Önyargı Avcısı — Bilimsel Senaryo Motoru ve Ölçüm Kuralları", () => {
  it("1. İlk 36 senaryo tam ve belirsiz (B) olayların tamamında doğru yanıt UNKNOWN", () => {
    expect(SCENARIOS_SEED.length).toBe(36);
    const gameScenarios = SCENARIOS_SEED.filter((s) => s.formId === "GAME");
    const formA = SCENARIOS_SEED.filter((s) => s.formId === "A");
    const formB = SCENARIOS_SEED.filter((s) => s.formId === "B");
    expect(gameScenarios.length).toBe(12);
    expect(formA.length).toBe(12);
    expect(formB.length).toBe(12);

    const uncertaintyScenarios = SCENARIOS_SEED.filter((s) => s.scenarioType === "B");
    expect(uncertaintyScenarios.length).toBeGreaterThanOrEqual(16);
    for (const sc of uncertaintyScenarios) {
      expect(sc.verifiedActor).toBe("UNKNOWN");
    }
  });

  it("2 & 3. Ön/son test istemci verisinde doğru cevap ve öğretici geri bildirim kesinlikle yer almaz", () => {
    const sc = SCENARIOS_SEED.find((s) => s.id === "A03")!;
    const pair = VISUAL_PAIRS_SEED.find((p) => p.id === sc.characterPairId)!;
    const [assignment] = buildScenarioAssignments("KAT-TEST1:PRETEST:A", [
      { id: sc.id, characterPair: pair },
    ]);

    const dtoBeforeFirst = sanitizeScenarioForStudyTest({
      scenario: {
        ...sc,
        availableChoicesJson: JSON.stringify(sc.availableChoices),
        characterPair: pair,
      },
      assignment,
      firstChoiceSubmitted: false,
    });

    // Doğru cevap ve öğretici alanlar DTO'da kesinlikle olmamalı
    expect("verifiedActor" in dtoBeforeFirst).toBe(false);
    expect("contextExplanation" in dtoBeforeFirst).toBe(false);
    expect("teachingMessage" in dtoBeforeFirst).toBe(false);
    expect("behaviorIntent" in dtoBeforeFirst).toBe(false);

    // İlk karar kaydedilmeden ipuçları null olmalı
    expect(dtoBeforeFirst.clue1).toBeNull();
    expect(dtoBeforeFirst.clue2).toBeNull();

    // İlk karar kaydedildikten sonra ipucu açılır ama hâlâ doğru cevap anahtarı veya geri bildirim sızmaz
    const dtoAfterFirst = sanitizeScenarioForStudyTest({
      scenario: {
        ...sc,
        availableChoicesJson: JSON.stringify(sc.availableChoices),
        characterPair: pair,
      },
      assignment,
      firstChoiceSubmitted: true,
    });
    expect(dtoAfterFirst.clue1).toBeTruthy();
    expect("verifiedActor" in dtoAfterFirst).toBe(false);
    expect("teachingMessage" in dtoAfterFirst).toBe(false);
  });

  it("5 & 6. Form A-B ve B-A sırası doğru uygulanır ve aynı katılımcı kodu deterministik grup alır", () => {
    expect(getFormsForGroup("EXP_AB")).toEqual({
      pretestForm: "A",
      posttestForm: "B",
      armType: "EXPERIMENTAL",
    });
    expect(getFormsForGroup("EXP_BA")).toEqual({
      pretestForm: "B",
      posttestForm: "A",
      armType: "EXPERIMENTAL",
    });
    expect(getFormsForGroup("CTRL_AB")).toEqual({
      pretestForm: "A",
      posttestForm: "B",
      armType: "CONTROL",
    });
    expect(getFormsForGroup("CTRL_BA")).toEqual({
      pretestForm: "B",
      posttestForm: "A",
      armType: "CONTROL",
    });

    const equalCounts: Record<StudyGroup, number> = {
      EXP_AB: 2,
      EXP_BA: 2,
      CTRL_AB: 2,
      CTRL_BA: 2,
    };
    const g1 = selectBalancedGroup(equalCounts, "KAT-AYNI01");
    const g2 = selectBalancedGroup(equalCounts, "KAT-AYNI01");
    expect(g1).toBe(g2);

    // Dengeli dağılım kontrolü (en az katılımcılı kol seçilir)
    const unbalanced: Record<StudyGroup, number> = {
      EXP_AB: 5,
      EXP_BA: 5,
      CTRL_AB: 4,
      CTRL_BA: 5,
    };
    expect(selectBalancedGroup(unbalanced, "KAT-DENGE")).toBe("CTRL_AB");
  });

  it("7. Görsel sürümleri (sweatshirt/gömlek) ve A/B buton konumları dengeli dağıtılır", () => {
    const formAScenarios = SCENARIOS_SEED.filter((s) => s.formId === "A").map((s) => ({
      id: s.id,
      characterPair: VISUAL_PAIRS_SEED.find((p) => p.id === s.characterPairId)!,
    }));

    let swap0 = 0;
    let swap1 = 0;
    let orderAB = 0;
    let orderBA = 0;

    for (let i = 0; i < 60; i++) {
      const list = buildScenarioAssignments(`KAT-SIM-${i}`, formAScenarios);
      for (const a of list) {
        if (a.outfitSwapIndex === 0) swap0++;
        else swap1++;
        if (a.displayedCharacterOrder === "AB") orderAB++;
        else orderBA++;
      }
    }

    const total = swap0 + swap1;
    expect(Math.abs(swap0 - swap1) / total).toBeLessThan(0.1);
    expect(Math.abs(orderAB - orderBA) / total).toBeLessThan(0.1);

    // Konum değişiminde {ACTOR} çözümlemesi ve kanonik eşleme tutarlı olmalı
    const clueAB = resolveClueText("Kayıtta {ACTOR} yer alıyor.", "A", "AB");
    const clueBA = resolveClueText("Kayıtta {ACTOR} yer alıyor.", "A", "BA");
    expect(clueAB).toContain("Karakter A");
    expect(clueBA).toContain("Karakter B");
    expect(displayedToCanonicalChoice("B", "BA")).toBe("A");
    expect(displayedToCanonicalChoice("A", "BA")).toBe("B");
    expect(displayedToCanonicalChoice("UNKNOWN", "BA")).toBe("UNKNOWN");
  });

  it("8. Oyun puanı kanıta dayalı kararı ve belirsizliği ödüllendirir; araştırma göstergeleri bağımsız hesaplanır", () => {
    // Rastgele A/B tahmini (kanıtsız) yüksek puan almamalı; kanıta göre güncelleme yüksek puan almalı
    const luckyGuess = calculateGameScenarioScore({
      scenarioType: "B",
      verifiedActor: "UNKNOWN",
      firstChoice: "A",
      secondChoice: "A",
      interpretationBefore: null,
      interpretationAfter: null,
      mode: "CLASSIC",
    });
    const recognizedUncertainty = calculateGameScenarioScore({
      scenarioType: "B",
      verifiedActor: "UNKNOWN",
      firstChoice: "UNKNOWN",
      secondChoice: "UNKNOWN",
      interpretationBefore: null,
      interpretationAfter: null,
      mode: "CLASSIC",
    });
    expect(recognizedUncertainty.points).toBeGreaterThan(luckyGuess.points);

    // Zaman modunda süre dolunca ceza yok
    const timedOutScore = calculateGameScenarioScore({
      scenarioType: "K",
      verifiedActor: "A",
      firstChoice: "UNKNOWN",
      secondChoice: "A",
      interpretationBefore: null,
      interpretationAfter: null,
      mode: "TIMED",
      timedOut: true,
    });
    const onTimeScore = calculateGameScenarioScore({
      scenarioType: "K",
      verifiedActor: "A",
      firstChoice: "UNKNOWN",
      secondChoice: "A",
      interpretationBefore: null,
      interpretationAfter: null,
      mode: "TIMED",
      timedOut: false,
    });
    expect(timedOutScore.points).toBe(onTimeScore.points);

    // Bilimsel göstergeler (KKO, KUK, Görünüş etkisi, Güven, Bağlam etkisi)
    const indicators = calculateScientificIndicators([
      {
        scenarioId: "A01",
        scenarioType: "B",
        verifiedActor: "UNKNOWN",
        testForm: "A",
        phase: "PRETEST",
        groupAssignment: "EXP_AB",
        visualVariantId: "RES_PAIR_1:v1.0.0:swap0:A=sweatshirt|B=collared:AB",
        displayedCharacterOrder: "AB",
        firstChoice: "A", // belirsizlikte A seçildi -> KKO'ya girer, sweatshirt seçildi
        firstConfidence: 4,
        secondChoice: null,
        secondConfidence: null,
        interpretationBefore: null,
        interpretationAfter: null,
        completionStatus: "COMPLETED",
      },
      {
        scenarioId: "A02",
        scenarioType: "B",
        verifiedActor: "UNKNOWN",
        testForm: "A",
        phase: "PRETEST",
        groupAssignment: "EXP_AB",
        visualVariantId: "RES_PAIR_2:v1.0.0:swap1:A=collared|B=sweatshirt:BA",
        displayedCharacterOrder: "BA",
        firstChoice: "UNKNOWN", // belirsizliği tanıdı
        firstConfidence: 2,
        secondChoice: null,
        secondConfidence: null,
        interpretationBefore: null,
        interpretationAfter: null,
        completionStatus: "COMPLETED",
      },
      {
        scenarioId: "A03",
        scenarioType: "K",
        verifiedActor: "B",
        testForm: "A",
        phase: "PRETEST",
        groupAssignment: "EXP_AB",
        visualVariantId: "RES_PAIR_3:v1.0.0:swap0:A=sweatshirt|B=collared:AB",
        displayedCharacterOrder: "AB",
        firstChoice: "A",
        firstConfidence: 3,
        secondChoice: "B", // kanıtla uyumlu
        secondConfidence: 5,
        interpretationBefore: null,
        interpretationAfter: null,
        completionStatus: "COMPLETED",
      },
      {
        scenarioId: "A11",
        scenarioType: "Y",
        verifiedActor: "A",
        testForm: "A",
        phase: "PRETEST",
        groupAssignment: "EXP_AB",
        visualVariantId: "RES_PAIR_2:v1.0.0:swap0:A=sweatshirt|B=collared:AB",
        displayedCharacterOrder: "AB",
        firstChoice: "B", // collared
        firstConfidence: 3,
        secondChoice: "A",
        secondConfidence: 5,
        interpretationBefore: 2,
        interpretationAfter: 5,
        completionStatus: "COMPLETED",
      },
    ]);

    expect(indicators.kkoPercent).toBe(50);
    expect(indicators.kukPercent).toBe(100);
    expect(indicators.contextEffectDelta).toBe(3);
    expect(indicators.avgFirstConfidence).toBe(3);
    expect(indicators.appearanceEffect.sweatshirtChosenCount).toBe(2);
    expect(indicators.appearanceEffect.collaredChosenCount).toBe(1);
  });

  it("14. CSV dışa aktarma UTF-8 BOM ve Türkçe karakterleri (ç ğ ı İ ö ş ü) eksiksiz korur", () => {
    const csv = buildAnonymousCsv(
      [
        {
          anonymousParticipantId: "KAT-TR001",
          dataType: "DEMO VERİSİ",
          studyVersion: "1.0.0-pilot",
          scenarioVersion: "1.0.0",
          sessionId: "sess_1",
          groupAssignment: "EXP_AB",
          testForm: "A",
          phase: "PRETEST",
          scenarioId: "A01",
          scenarioType: "B",
          visualVariantId: "RES_PAIR_1:v1.0.0:swap0:A=sweatshirt|B=collared:AB",
          displayedCharacterOrder: "AB",
          scenarioStartedAt: "2026-11-20T10:00:00.000Z",
          firstChoice: "UNKNOWN",
          firstConfidence: 3,
          firstReason: "Karar vermek için yeterli bilgi bulunmaması (çğıİöşü)",
          firstSubmittedAt: "2026-11-20T10:00:12.000Z",
          clueViewedAt: "",
          secondDecisionMode: "",
          secondChoice: "",
          secondConfidence: "",
          secondSubmittedAt: "",
          interpretationBefore: "",
          interpretationAfter: "",
          completionStatus: "COMPLETED",
        },
      ],
      { includeBom: true },
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("DEMO VERİSİ");
    expect(csv).toContain("Karar vermek için yeterli bilgi bulunmaması (çğıİöşü)");
    expect(csv).not.toContain("telefon");
    expect(csv).not.toContain("adres");
  });

  it("Parola karma ve imzalı oturum belirteçleri güvenli biçimde doğrulanır", () => {
    const hash = hashPassword("GizliParola2026!");
    expect(verifyPassword("GizliParola2026!", hash)).toBe(true);
    expect(verifyPassword("YanlisParola", hash)).toBe(false);

    const token = signToken({ adminId: "1", username: "arastirmaci" });
    const decoded = verifyToken<{ adminId: string; username: string }>(token);
    expect(decoded?.username).toBe("arastirmaci");
    expect(verifyToken(`${token}tampered`)).toBeNull();
  });
});
