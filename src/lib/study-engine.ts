import { deterministicHashInt } from "@/lib/crypto";

export type StudyGroup = "EXP_AB" | "EXP_BA" | "CTRL_AB" | "CTRL_BA";
export type TestForm = "A" | "B";
export type DisplayedOrder = "AB" | "BA";
export type ChoiceValue = "A" | "B" | "UNKNOWN";

export const STUDY_GROUPS: readonly StudyGroup[] = [
  "EXP_AB",
  "EXP_BA",
  "CTRL_AB",
  "CTRL_BA",
] as const;

export function getFormsForGroup(group: StudyGroup): {
  pretestForm: TestForm;
  posttestForm: TestForm;
  armType: "EXPERIMENTAL" | "CONTROL";
} {
  switch (group) {
    case "EXP_AB":
      return { pretestForm: "A", posttestForm: "B", armType: "EXPERIMENTAL" };
    case "EXP_BA":
      return { pretestForm: "B", posttestForm: "A", armType: "EXPERIMENTAL" };
    case "CTRL_AB":
      return { pretestForm: "A", posttestForm: "B", armType: "CONTROL" };
    case "CTRL_BA":
      return { pretestForm: "B", posttestForm: "A", armType: "CONTROL" };
  }
}

/**
 * Selects the least-populated research arm to guarantee balanced 4-arm assignment
 * across participants, breaking ties deterministically via participant code hash.
 */
export function selectBalancedGroup(
  counts: Record<StudyGroup, number>,
  participantCode: string,
): StudyGroup {
  const minCount = Math.min(...STUDY_GROUPS.map((g) => counts[g] ?? 0));
  const candidates = STUDY_GROUPS.filter((g) => (counts[g] ?? 0) === minCount);
  const idx = deterministicHashInt(`group:${participantCode}`) % candidates.length;
  return candidates[idx];
}

export interface VisualPairLike {
  id: string;
  version: string;
  systemType: string;
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
}

export interface ScenarioPresentationAssignment {
  scenarioId: string;
  /**
   * 0 = Canonical A wears variant1 (e.g. sweatshirt) & Canonical B wears variant1 (e.g. collared)
   * 1 = Canonical A wears variant2 (e.g. collared) & Canonical B wears variant2 (e.g. sweatshirt)
   */
  outfitSwapIndex: 0 | 1;
  /**
   * "AB" = Left/Character A slot is Canonical A, Right/Character B slot is Canonical B
   * "BA" = Left/Character A slot is Canonical B, Right/Character B slot is Canonical A
   */
  displayedCharacterOrder: DisplayedOrder;
  /**
   * Encoded visual variant metadata recorded on every response for reproducibility
   */
  visualVariantId: string;
  /**
   * Rendered SVG keys for the left ("A") and right ("B") slots on screen
   */
  leftVisualKey: string;
  rightVisualKey: string;
  leftVisualLabel: string;
  rightVisualLabel: string;
  /**
   * Which clothing style is on canonical A ("sweatshirt" | "collared" | "style1" | "style2")
   */
  canonicalAStyle: string;
  canonicalBStyle: string;
}

/**
 * Deterministic, balanced, reproducible assignment of visual variants and A/B button positions.
 * Across participants and scenarios, balances:
 * - Outfit swap (0 vs 1) 50/50
 * - Screen side (AB vs BA) 50/50
 */
export function buildScenarioAssignments(
  seedKey: string,
  scenarios: Array<{ id: string; characterPair: VisualPairLike }>,
): ScenarioPresentationAssignment[] {
  const baseHash = deterministicHashInt(`visual-base:${seedKey}`);

  return scenarios.map((sc, idx) => {
    // Alternating counterbalanced parity seeded per participant so across participants
    // each scenario gets ~50% outfitSwap=0 / ~50% outfitSwap=1 AND ~50% AB / ~50% BA.
    const itemHash = deterministicHashInt(`visual-item:${seedKey}:${sc.id}`);
    const outfitSwapIndex: 0 | 1 = ((baseHash + idx) % 2 === 0 ? 0 : 1) as 0 | 1;
    const displayedCharacterOrder: DisplayedOrder =
      ((baseHash >> 1) + idx + (itemHash % 2 === 0 ? 0 : 0)) % 2 === 0 ? "AB" : "BA";

    const pair = sc.characterPair;
    const canonAKey = outfitSwapIndex === 0 ? pair.variantA1Key : pair.variantA2Key;
    const canonBKey = outfitSwapIndex === 0 ? pair.variantB1Key : pair.variantB2Key;
    const canonALabel = outfitSwapIndex === 0 ? pair.variantA1Label : pair.variantA2Label;
    const canonBLabel = outfitSwapIndex === 0 ? pair.variantB1Label : pair.variantB2Label;

    const canonicalAStyle = inferClothingStyle(canonAKey);
    const canonicalBStyle = inferClothingStyle(canonBKey);

    const leftVisualKey = displayedCharacterOrder === "AB" ? canonAKey : canonBKey;
    const rightVisualKey = displayedCharacterOrder === "AB" ? canonBKey : canonAKey;
    const leftVisualLabel = displayedCharacterOrder === "AB" ? canonALabel : canonBLabel;
    const rightVisualLabel = displayedCharacterOrder === "AB" ? canonBLabel : canonALabel;

    const visualVariantId = `${pair.id}:v${pair.version}:swap${outfitSwapIndex}:A=${canonicalAStyle}|B=${canonicalBStyle}:${displayedCharacterOrder}`;

    return {
      scenarioId: sc.id,
      outfitSwapIndex,
      displayedCharacterOrder,
      visualVariantId,
      leftVisualKey,
      rightVisualKey,
      leftVisualLabel,
      rightVisualLabel,
      canonicalAStyle,
      canonicalBStyle,
    };
  });
}

export function inferClothingStyle(visualKey: string): string {
  const lower = visualKey.toLowerCase();
  if (lower.includes("sweat") || lower.includes("hoodie")) return "sweatshirt";
  if (lower.includes("collared") || lower.includes("shirt") || lower.includes("polo")) return "collared";
  if (lower.includes("blazer") || lower.includes("jacket")) return "jacket";
  if (lower.includes("cardigan") || lower.includes("sweater")) return "sweater";
  return visualKey;
}

/**
 * Converts a displayed screen choice ("A" = left card, "B" = right card, "UNKNOWN")
 * into canonical actor identity ("A" | "B" | "UNKNOWN") according to displayedCharacterOrder.
 */
export function displayedToCanonicalChoice(
  displayedChoice: ChoiceValue,
  displayedCharacterOrder: DisplayedOrder,
): ChoiceValue {
  if (displayedChoice === "UNKNOWN") return "UNKNOWN";
  if (displayedCharacterOrder === "AB") return displayedChoice;
  return displayedChoice === "A" ? "B" : "A";
}

/**
 * Converts a canonical actor ("A" | "B" | "UNKNOWN") to its displayed screen slot label ("A" | "B" | "UNKNOWN").
 */
export function canonicalToDisplayedChoice(
  canonicalChoice: ChoiceValue,
  displayedCharacterOrder: DisplayedOrder,
): ChoiceValue {
  if (canonicalChoice === "UNKNOWN") return "UNKNOWN";
  if (displayedCharacterOrder === "AB") return canonicalChoice;
  return canonicalChoice === "A" ? "B" : "A";
}

/**
 * Resolves the `{ACTOR}` placeholder in clue texts so that the clue always refers to
 * the correct screen label ("Karakter A" or "Karakter B") matching displayedCharacterOrder.
 */
export function resolveClueText(
  template: string | null,
  verifiedActor: ChoiceValue,
  displayedCharacterOrder: DisplayedOrder,
): string | null {
  if (!template) return null;
  if (verifiedActor === "UNKNOWN") return template;
  const displayedActor = canonicalToDisplayedChoice(verifiedActor, displayedCharacterOrder);
  const label = displayedActor === "A" ? "Karakter A" : "Karakter B";
  return template.replaceAll("{ACTOR}", label);
}

/**
 * Strict sanitizer for study test phases (PRETEST / POSTTEST / FOLLOWUP).
 * NEVER includes verifiedActor, behaviorIntent, contextExplanation, teachingMessage, or scoring rules!
 * Clues are ONLY exposed after the first choice has been saved on the server.
 */
export interface SanitizedStudyScenarioDTO {
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
    displayedCharacterOrder: DisplayedOrder;
    leftVisualKey: string;
    rightVisualKey: string;
    isDemoMaterial: boolean;
    approvedForResearch: boolean;
  };
  // Clues are explicitly null until unlocked on the server after firstChoice submission
  clue1: string | null;
  clue2: string | null;
}

export function sanitizeScenarioForStudyTest(params: {
  scenario: {
    id: string;
    version: string;
    formId: string;
    orderIndex: number;
    title: string;
    valueCategory: string;
    scenarioType: string;
    eventText: string;
    researchQuestion: string;
    clue1: string | null;
    clue2: string | null;
    verifiedActor: string;
    availableChoicesJson: string;
    characterPair: {
      id: string;
      version: string;
      isDemoMaterial: boolean;
      approvedForResearch: boolean;
    };
  };
  assignment: ScenarioPresentationAssignment;
  firstChoiceSubmitted: boolean;
  clue2Unlocked?: boolean;
}): SanitizedStudyScenarioDTO {
  const { scenario, assignment, firstChoiceSubmitted, clue2Unlocked } = params;
  const sType = scenario.scenarioType as "B" | "K" | "Y";
  // B (Belirsizlik) scenarios in research tests do NOT show unnecessary clues
  const hasClueStage = sType !== "B" && Boolean(scenario.clue1);
  const hasSecondClue = sType === "Y" && Boolean(scenario.clue2);

  let availableChoices: ChoiceValue[] = ["A", "B", "UNKNOWN"];
  try {
    availableChoices = JSON.parse(scenario.availableChoicesJson) as ChoiceValue[];
  } catch {
    availableChoices = ["A", "B", "UNKNOWN"];
  }

  const clue1 =
    firstChoiceSubmitted && hasClueStage
      ? resolveClueText(
          scenario.clue1,
          scenario.verifiedActor as ChoiceValue,
          assignment.displayedCharacterOrder,
        )
      : null;

  const clue2 =
    firstChoiceSubmitted && hasSecondClue && clue2Unlocked
      ? resolveClueText(
          scenario.clue2,
          scenario.verifiedActor as ChoiceValue,
          assignment.displayedCharacterOrder,
        )
      : null;

  return {
    id: scenario.id,
    version: scenario.version,
    formId: scenario.formId,
    orderIndex: scenario.orderIndex,
    title: scenario.title,
    valueCategory: scenario.valueCategory,
    scenarioType: sType,
    eventText: scenario.eventText,
    researchQuestion: scenario.researchQuestion,
    availableChoices,
    hasClueStage,
    hasSecondClue,
    requiresInterpretationRating: sType === "Y",
    visual: {
      pairId: scenario.characterPair.id,
      pairVersion: scenario.characterPair.version,
      visualVariantId: assignment.visualVariantId,
      displayedCharacterOrder: assignment.displayedCharacterOrder,
      leftVisualKey: assignment.leftVisualKey,
      rightVisualKey: assignment.rightVisualKey,
      isDemoMaterial: scenario.characterPair.isDemoMaterial,
      approvedForResearch: scenario.characterPair.approvedForResearch,
    },
    clue1,
    clue2,
  };
}
