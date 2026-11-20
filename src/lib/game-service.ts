import { prisma } from "@/lib/prisma";
import {
  buildScenarioAssignments,
  resolveClueText,
  type ChoiceValue,
  type ScenarioPresentationAssignment,
} from "@/lib/study-engine";

export interface StoredGameOrderEntry extends ScenarioPresentationAssignment {
  scenarioId: string;
}

export function pickScenarioIdsForMode(
  mode: "CLASSIC" | "TIMED" | "EXPERT",
  availableIds: string[],
): string[] {
  const preferred: Record<"CLASSIC" | "TIMED" | "EXPERT", string[]> = {
    CLASSIC: ["G01", "G02", "G03", "G04", "G06"],
    TIMED: ["G05", "G10", "G07", "G09", "G11"],
    EXPERT: ["G03", "G07", "G08", "G12", "G02", "G05"],
  };
  const chosen = preferred[mode].filter((id) => availableIds.includes(id));
  if (chosen.length >= 5) return chosen;
  for (const id of availableIds) {
    if (!chosen.includes(id) && chosen.length < (mode === "EXPERT" ? 6 : 5)) {
      chosen.push(id);
    }
  }
  return chosen;
}

export async function buildGameSessionState(sessionId: string) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      responses: true,
    },
  });
  if (!session) return null;

  const assignments = JSON.parse(session.scenarioIdsJson) as StoredGameOrderEntry[];
  const currentAssignment = assignments[session.currentIndex] ?? null;

  let currentScenarioDTO = null;

  if (session.status === "IN_PROGRESS" && currentAssignment) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: currentAssignment.scenarioId },
      include: { characterPair: true },
    });

    if (scenario) {
      const existingResponse = session.responses.find((r) => r.scenarioId === scenario.id);
      const firstSubmitted = Boolean(existingResponse);

      let availableChoices: ChoiceValue[] = ["A", "B", "UNKNOWN"];
      try {
        availableChoices = JSON.parse(scenario.availableChoicesJson) as ChoiceValue[];
      } catch {
        availableChoices = ["A", "B", "UNKNOWN"];
      }

      let expertOptions: string[] | null = null;
      if (session.mode === "EXPERT" && scenario.expertOptionsJson) {
        try {
          expertOptions = JSON.parse(scenario.expertOptionsJson) as string[];
        } catch {
          expertOptions = null;
        }
      }

      const clue1 = firstSubmitted
        ? resolveClueText(
            scenario.clue1,
            scenario.verifiedActor as ChoiceValue,
            currentAssignment.displayedCharacterOrder,
          )
        : null;

      const clue2 = firstSubmitted
        ? resolveClueText(
            scenario.clue2,
            scenario.verifiedActor as ChoiceValue,
            currentAssignment.displayedCharacterOrder,
          )
        : null;

      currentScenarioDTO = {
        id: scenario.id,
        version: scenario.version,
        title: scenario.title,
        valueCategory: scenario.valueCategory,
        scenarioType: scenario.scenarioType as "B" | "K" | "Y",
        eventText: scenario.eventText,
        researchQuestion: scenario.researchQuestion,
        availableChoices,
        hasClue1: Boolean(scenario.clue1),
        hasClue2: Boolean(scenario.clue2),
        requiresInterpretationRating: scenario.scenarioType === "Y",
        expertQuestion: session.mode === "EXPERT" ? scenario.expertQuestion : null,
        expertOptions,
        visual: {
          pairId: scenario.characterPair.id,
          pairVersion: scenario.characterPair.version,
          visualVariantId: currentAssignment.visualVariantId,
          displayedCharacterOrder: currentAssignment.displayedCharacterOrder,
          leftVisualKey: currentAssignment.leftVisualKey,
          rightVisualKey: currentAssignment.rightVisualKey,
          isDemoMaterial: scenario.characterPair.isDemoMaterial,
          approvedForResearch: scenario.characterPair.approvedForResearch,
        },
        stage: existingResponse?.completed
          ? "RESULT"
          : firstSubmitted
            ? "CLUE"
            : "FIRST_DECISION",
        clue1,
        clue2,
      };
    }
  }

  let badgesEarned: string[] = [];
  try {
    badgesEarned = JSON.parse(session.badgesEarnedJson) as string[];
  } catch {
    badgesEarned = [];
  }

  return {
    session: {
      id: session.id,
      mode: session.mode as "CLASSIC" | "TIMED" | "EXPERT",
      currentIndex: session.currentIndex,
      totalScenarios: assignments.length,
      totalScore: session.totalScore,
      evidenceScoreCount: session.evidenceScoreCount,
      uncertaintyRecognizedCount: session.uncertaintyRecognizedCount,
      timedOutCount: session.timedOutCount,
      badgesEarned,
      status: session.status as "IN_PROGRESS" | "COMPLETED",
      completedCount: session.responses.filter((r) => r.completed).length,
    },
    currentScenario: currentScenarioDTO,
  };
}

export async function createGameSessionForPlayer(
  playerToken: string,
  mode: "CLASSIC" | "TIMED" | "EXPERT",
) {
  const gameScenarios = await prisma.scenario.findMany({
    where: { formId: "GAME", isActive: true },
    include: { characterPair: true },
    orderBy: { orderIndex: "asc" },
  });

  const selectedIds = pickScenarioIdsForMode(
    mode,
    gameScenarios.map((s) => s.id),
  );
  const orderedScenarios = selectedIds
    .map((id) => gameScenarios.find((s) => s.id === id))
    .filter((s): s is (typeof gameScenarios)[number] => Boolean(s));

  const seedKey = `${playerToken}:${mode}:${Date.now()}`;
  const assignments = buildScenarioAssignments(seedKey, orderedScenarios);

  const created = await prisma.gameSession.create({
    data: {
      playerToken,
      mode,
      scenarioIdsJson: JSON.stringify(assignments),
      currentIndex: 0,
      status: "IN_PROGRESS",
    },
  });

  return buildGameSessionState(created.id);
}
