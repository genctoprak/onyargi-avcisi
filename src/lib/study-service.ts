import { prisma } from "@/lib/prisma";
import {
  buildScenarioAssignments,
  getFormsForGroup,
  sanitizeScenarioForStudyTest,
  type ScenarioPresentationAssignment,
  type StudyGroup,
} from "@/lib/study-engine";
import { CONTROL_MODULES } from "@/data/control-modules";
import { getStudyConfig } from "@/lib/study-config";

export type StudyPhase = "PRETEST" | "INTERVENTION" | "POSTTEST" | "FOLLOWUP";

export async function getOrCreateStudySessionForPhase(
  participantId: string,
  phase: StudyPhase,
) {
  const participant = await prisma.studyParticipant.findUnique({
    where: { id: participantId },
  });
  if (!participant) return { error: "Katılımcı kaydı bulunamadı.", status: 404 as const };
  if (participant.currentPhase === "WITHDRAWN") {
    return { error: "Bu katılım çalışmadan ayrılmış olarak işaretlenmiştir.", status: 403 as const };
  }

  const { config } = await getStudyConfig();

  // Enforce server-side phase progression
  const phaseOrder: Record<string, number> = {
    PRETEST: 1,
    INTERVENTION: 2,
    POSTTEST: 3,
    FOLLOWUP: 4,
    COMPLETED: 5,
  };

  if (phase === "FOLLOWUP") {
    if (!config.followupEnabled) {
      return {
        error: "İzleme testi araştırmacı tarafından henüz etkinleştirilmedi.",
        status: 403 as const,
      };
    }
    if (participant.currentPhase !== "COMPLETED" && participant.currentPhase !== "FOLLOWUP") {
      return {
        error: "İzleme testine geçebilmek için önce ön test, etkinlik ve son test aşamalarını tamamlamalısınız.",
        status: 403 as const,
      };
    }
  } else {
    const currentOrder = phaseOrder[participant.currentPhase] ?? 1;
    const requestedOrder = phaseOrder[phase] ?? 1;
    if (requestedOrder > currentOrder) {
      return {
        error: "Önce mevcut araştırma aşamasını tamamlamalısınız.",
        status: 403 as const,
      };
    }
  }

  const { armType } = getFormsForGroup(participant.groupAssignment as StudyGroup);

  let session = await prisma.studySession.findUnique({
    where: { participantId_phase: { participantId: participant.id, phase } },
    include: { responses: true },
  });

  if (!session) {
    let testForm = "A";
    let scenarioOrderJson = "[]";

    if (phase === "PRETEST" || phase === "POSTTEST") {
      testForm = phase === "PRETEST" ? participant.pretestForm : participant.posttestForm;
      const scenarios = await prisma.scenario.findMany({
        where: { formId: testForm, isActive: true },
        include: { characterPair: true },
        orderBy: { orderIndex: "asc" },
      });
      const assignments = buildScenarioAssignments(
        `${participant.anonymousParticipantId}:${phase}:${testForm}`,
        scenarios,
      );
      scenarioOrderJson = JSON.stringify(assignments);
    } else if (phase === "INTERVENTION") {
      if (armType === "EXPERIMENTAL") {
        testForm = "GAME";
        const scenarios = await prisma.scenario.findMany({
          where: { formId: "GAME", isActive: true },
          include: { characterPair: true },
          orderBy: { orderIndex: "asc" },
        });
        const assignments = buildScenarioAssignments(
          `${participant.anonymousParticipantId}:INTERVENTION:GAME`,
          scenarios,
        );
        scenarioOrderJson = JSON.stringify(assignments);
      } else {
        testForm = "CONTROL";
        scenarioOrderJson = JSON.stringify(
          CONTROL_MODULES.map((m) => ({ moduleId: m.id })),
        );
      }
    } else if (phase === "FOLLOWUP") {
      testForm = "FOLLOWUP";
      const followupScenarios = await prisma.scenario.findMany({
        where: { formId: "FOLLOWUP", isActive: true },
        include: { characterPair: true },
        orderBy: { orderIndex: "asc" },
      });
      if (followupScenarios.length === 0) {
        return {
          error:
            "İzleme testi için henüz yeni senaryolar tanımlanmamıştır. Tekrara bağlı öğrenme etkisini önlemek için araştırmacı izleme senaryolarını eklediğinde bu aşama açılacaktır.",
          status: 404 as const,
        };
      }
      const assignments = buildScenarioAssignments(
        `${participant.anonymousParticipantId}:FOLLOWUP`,
        followupScenarios,
      );
      scenarioOrderJson = JSON.stringify(assignments);
    }

    session = await prisma.studySession.create({
      data: {
        participantId: participant.id,
        isDemo: participant.isDemo,
        studyVersion: participant.studyVersion,
        phase,
        testForm,
        scenarioOrderJson,
        currentIndex: 0,
        completionStatus: "IN_PROGRESS",
      },
      include: { responses: true },
    });
  }

  // Control group intervention payload
  if (phase === "INTERVENTION" && armType === "CONTROL") {
    return {
      status: 200 as const,
      data: {
        participant: {
          anonymousParticipantId: participant.anonymousParticipantId,
          isDemo: participant.isDemo,
          groupAssignment: participant.groupAssignment,
          armType,
          pretestForm: participant.pretestForm,
          posttestForm: participant.posttestForm,
          currentPhase: participant.currentPhase,
        },
        session: {
          id: session.id,
          phase: session.phase,
          testForm: session.testForm,
          currentIndex: session.currentIndex,
          totalItems: CONTROL_MODULES.length,
          completionStatus: session.completionStatus,
        },
        controlModules: CONTROL_MODULES,
        currentScenario: null,
      },
    };
  }

  const assignments = JSON.parse(session.scenarioOrderJson) as ScenarioPresentationAssignment[];
  const currentAssignment = assignments[session.currentIndex] ?? null;

  let currentScenario = null;
  let stage: "FIRST_DECISION" | "CLUE1" | "CLUE2" | "DONE" = "FIRST_DECISION";

  if (session.completionStatus === "COMPLETED" || !currentAssignment) {
    stage = "DONE";
  } else {
    const scenario = await prisma.scenario.findUnique({
      where: { id: currentAssignment.scenarioId },
      include: { characterPair: true },
    });

    if (scenario) {
      const existingResponse = session.responses.find((r) => r.scenarioId === scenario.id);
      const firstChoiceSubmitted = Boolean(existingResponse);
      const clue2Unlocked = Boolean(existingResponse?.clue2ViewedAt);

      currentScenario = sanitizeScenarioForStudyTest({
        scenario,
        assignment: currentAssignment,
        firstChoiceSubmitted,
        clue2Unlocked,
      });

      if (existingResponse?.completionStatus === "COMPLETED") {
        stage = "DONE";
      } else if (firstChoiceSubmitted) {
        stage = clue2Unlocked ? "CLUE2" : "CLUE1";
      } else {
        stage = "FIRST_DECISION";
      }
    }
  }

  return {
    status: 200 as const,
    data: {
      participant: {
        anonymousParticipantId: participant.anonymousParticipantId,
        isDemo: participant.isDemo,
        groupAssignment: participant.groupAssignment,
        armType,
        pretestForm: participant.pretestForm,
        posttestForm: participant.posttestForm,
        currentPhase: participant.currentPhase,
      },
      session: {
        id: session.id,
        phase: session.phase,
        testForm: session.testForm,
        currentIndex: session.currentIndex,
        totalItems: assignments.length,
        completionStatus: session.completionStatus,
      },
      stage,
      currentScenario,
      controlModules: null,
    },
  };
}
