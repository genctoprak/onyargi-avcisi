export interface MetricResponseRow {
  scenarioId: string;
  scenarioType: string; // "B" | "K" | "Y"
  verifiedActor: string; // "A" | "B" | "UNKNOWN"
  testForm: string;
  phase: string;
  groupAssignment: string;
  visualVariantId: string;
  displayedCharacterOrder: string;
  firstChoice: string;
  firstConfidence: number;
  secondChoice: string | null;
  secondConfidence: number | null;
  interpretationBefore: number | null;
  interpretationAfter: number | null;
  completionStatus: string;
}

export interface ScientificIndicators {
  totalResponses: number;
  /** Kanıtsız kesin karar oranı (KKO) % */
  kkoPercent: number | null;
  kkoNumerator: number;
  kkoDenominator: number;
  /** Kanıta uygun karar oranı (KUK) % */
  kukPercent: number | null;
  kukNumerator: number;
  kukDenominator: number;
  /** Karar güveni (1-5) */
  avgFirstConfidence: number | null;
  avgSecondConfidence: number | null;
  /** Bağlam etkisi (1-5 bağlam sonrası - bağlam öncesi ortalama fark) */
  contextEffectDelta: number | null;
  avgInterpretationBefore: number | null;
  avgInterpretationAfter: number | null;
  contextSampleSize: number;
  /** Görünüşe bağlı seçim etkisi (sweatshirt vs collared seçim olasılığı farkı) */
  appearanceEffect: {
    sweatshirtChoiceRate: number | null;
    collaredChoiceRate: number | null;
    probabilityDiffPercent: number | null;
    validDecisiveCount: number;
    sweatshirtChosenCount: number;
    collaredChosenCount: number;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Parses `visualVariantId` (e.g. "RES_PAIR_1:v1.0.0:swap0:A=sweatshirt|B=collared:AB")
 * to find which clothing style the participant selected on their first choice.
 */
export function extractChosenStyleFromVariant(
  visualVariantId: string,
  canonicalChoice: string,
): "sweatshirt" | "collared" | null {
  if (canonicalChoice !== "A" && canonicalChoice !== "B") return null;
  const match = visualVariantId.match(/A=([^|:]+)\|B=([^|:]+)/);
  if (!match) return null;
  const styleA = match[1];
  const styleB = match[2];
  const chosenStyle = canonicalChoice === "A" ? styleA : styleB;
  if (chosenStyle === "sweatshirt" || chosenStyle === "collared") {
    return chosenStyle;
  }
  return null;
}

/**
 * Computes the 5 scientific indicators defined in Section 9 strictly from
 * real recorded responses (NEVER mixes game scores or labels participants).
 */
export function calculateScientificIndicators(rows: MetricResponseRow[]): ScientificIndicators {
  const validRows = rows.filter((r) => r.completionStatus === "COMPLETED");

  // 1. KKO: Belirsizlik (B) sorularında A veya B seçilen soru sayısı / toplam geçerli belirsizlik sorusu × 100
  const uncertaintyRows = validRows.filter((r) => r.scenarioType === "B");
  const kkoDenominator = uncertaintyRows.length;
  const kkoNumerator = uncertaintyRows.filter(
    (r) => r.firstChoice === "A" || r.firstChoice === "B",
  ).length;
  const kkoPercent =
    kkoDenominator > 0 ? round2((kkoNumerator / kkoDenominator) * 100) : null;

  // 2. KUK: Kanıt (K) sorularında güvenilir ipucu sonrasında kanıtla uyumlu verilen karar sayısı / geçerli kanıt sorusu × 100
  const evidenceRows = validRows.filter(
    (r) => r.scenarioType === "K" && (r.verifiedActor === "A" || r.verifiedActor === "B") && r.secondChoice !== null,
  );
  const kukDenominator = evidenceRows.length;
  const kukNumerator = evidenceRows.filter((r) => r.secondChoice === r.verifiedActor).length;
  const kukPercent =
    kukDenominator > 0 ? round2((kukNumerator / kukDenominator) * 100) : null;

  // 3. Karar güveni (1-5)
  const firstConfValues = validRows.map((r) => r.firstConfidence).filter((n) => n >= 1 && n <= 5);
  const secondConfValues = validRows
    .map((r) => r.secondConfidence)
    .filter((n): n is number => typeof n === "number" && n >= 1 && n <= 5);

  const avgFirstConfidence =
    firstConfValues.length > 0
      ? round2(firstConfValues.reduce((a, b) => a + b, 0) / firstConfValues.length)
      : null;
  const avgSecondConfidence =
    secondConfValues.length > 0
      ? round2(secondConfValues.reduce((a, b) => a + b, 0) / secondConfValues.length)
      : null;

  // 4. Bağlam etkisi (Y senaryoları için 1-5 bağlam öncesi ve sonrası farkı)
  const contextRows = validRows.filter(
    (r) =>
      r.scenarioType === "Y" &&
      typeof r.interpretationBefore === "number" &&
      typeof r.interpretationAfter === "number",
  );
  const contextSampleSize = contextRows.length;
  const avgInterpretationBefore =
    contextSampleSize > 0
      ? round2(
          contextRows.reduce((acc, r) => acc + (r.interpretationBefore ?? 0), 0) / contextSampleSize,
        )
      : null;
  const avgInterpretationAfter =
    contextSampleSize > 0
      ? round2(
          contextRows.reduce((acc, r) => acc + (r.interpretationAfter ?? 0), 0) / contextSampleSize,
        )
      : null;
  const contextEffectDelta =
    avgInterpretationBefore !== null && avgInterpretationAfter !== null
      ? round2(avgInterpretationAfter - avgInterpretationBefore)
      : null;

  // 5. Görünüşe bağlı seçim etkisi (aynı olayda sweatshirt vs collared seçim olasılıkları farkı)
  let sweatshirtChosenCount = 0;
  let collaredChosenCount = 0;
  for (const row of validRows) {
    const style = extractChosenStyleFromVariant(row.visualVariantId, row.firstChoice);
    if (style === "sweatshirt") sweatshirtChosenCount++;
    else if (style === "collared") collaredChosenCount++;
  }
  const validDecisiveCount = sweatshirtChosenCount + collaredChosenCount;
  const sweatshirtChoiceRate =
    validDecisiveCount > 0 ? round2((sweatshirtChosenCount / validDecisiveCount) * 100) : null;
  const collaredChoiceRate =
    validDecisiveCount > 0 ? round2((collaredChosenCount / validDecisiveCount) * 100) : null;
  const probabilityDiffPercent =
    sweatshirtChoiceRate !== null && collaredChoiceRate !== null
      ? round2(sweatshirtChoiceRate - collaredChoiceRate)
      : null;

  return {
    totalResponses: validRows.length,
    kkoPercent,
    kkoNumerator,
    kkoDenominator,
    kukPercent,
    kukNumerator,
    kukDenominator,
    avgFirstConfidence,
    avgSecondConfidence,
    contextEffectDelta,
    avgInterpretationBefore,
    avgInterpretationAfter,
    contextSampleSize,
    appearanceEffect: {
      sweatshirtChoiceRate,
      collaredChoiceRate,
      probabilityDiffPercent,
      validDecisiveCount,
      sweatshirtChosenCount,
      collaredChosenCount,
    },
  };
}
