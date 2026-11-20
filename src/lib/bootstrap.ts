import { prisma } from "@/lib/prisma";
import { SCENARIOS_SEED, VISUAL_PAIRS_SEED } from "@/data/scenarios-manifest";
import { hashPassword } from "@/lib/crypto";

let bootstrapPromise: Promise<void> | null = null;
let bootstrapDone = false;

/**
 * Ensures the initial 36 scenarios, 6 character visual pairs, default StudyConfig,
 * and default AdminUser exist in a fresh database (e.g. first deploy on Vercel + Neon).
 * Completely idempotent and cached per serverless instance once verified.
 */
export async function ensureInitialDataSeeded(): Promise<void> {
  if (bootstrapDone) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const [scenarioCount, adminCount] = await Promise.all([
        prisma.scenario.count(),
        prisma.adminUser.count(),
      ]);

      if (scenarioCount >= 36 && adminCount >= 1) {
        bootstrapDone = true;
        return;
      }

      // 1. Default StudyConfig (real data collection disabled by default)
      await prisma.studyConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
          id: "default",
          studyVersion: "1.0.0-pilot",
          studyCollectionEnabled: false,
          ethicsApproved: false,
          parentalConsentProtocolReady: false,
          visualsApprovedForResearch: false,
          scenariosFrozen: false,
          followupEnabled: false,
          followupDelayDays: 14,
          demoDataEnabled: true,
        },
      });

      // 2. Default AdminUser from environment variables if none exists
      if (adminCount === 0) {
        const adminUsername = process.env.ADMIN_USERNAME || "arastirmaci";
        const adminPassword = process.env.ADMIN_PASSWORD || "OnyargiAdmin2026!";
        await prisma.adminUser.upsert({
          where: { username: adminUsername },
          update: {},
          create: {
            username: adminUsername,
            passwordHash: hashPassword(adminPassword),
            displayName: "Baş Araştırmacı",
            role: "RESEARCHER",
          },
        });
      }

      // 3. Visual pairs & 36 initial scenarios
      if (scenarioCount < 36) {
        for (const pair of VISUAL_PAIRS_SEED) {
          await prisma.characterVisualPair.upsert({
            where: { id: pair.id },
            update: {},
            create: pair,
          });
        }

        for (const scenario of SCENARIOS_SEED) {
          await prisma.scenario.upsert({
            where: { id: scenario.id },
            update: {},
            create: {
              id: scenario.id,
              version: scenario.version,
              formId: scenario.formId,
              orderIndex: scenario.orderIndex,
              title: scenario.title,
              valueCategory: scenario.valueCategory,
              scenarioType: scenario.scenarioType,
              eventText: scenario.eventText,
              characterPairId: scenario.characterPairId,
              clue1: scenario.clue1,
              clue2: scenario.clue2,
              verifiedActor: scenario.verifiedActor,
              behaviorIntent: scenario.behaviorIntent,
              contextExplanation: scenario.contextExplanation,
              teachingMessage: scenario.teachingMessage,
              researchQuestion: scenario.researchQuestion,
              expertQuestion: scenario.expertQuestion ?? null,
              expertOptionsJson: scenario.expertOptions
                ? JSON.stringify(scenario.expertOptions)
                : null,
              expertCorrectOption: scenario.expertCorrectOption ?? null,
              availableChoicesJson: JSON.stringify(scenario.availableChoices),
              scoringRuleJson: JSON.stringify(scenario.scoringRule),
              isActive: scenario.isActive,
              approvedForResearch: scenario.approvedForResearch,
              expertReviewStatus: scenario.expertReviewStatus,
              expertReviewNotes: scenario.expertReviewNotes,
            },
          });
        }

        const noteCount = await prisma.expertReviewNote.count();
        if (noteCount === 0) {
          await prisma.expertReviewNote.create({
            data: {
              authorName: "Araştırma Ekibi",
              authorRole: "Proje Koordinatörü",
              targetType: "PILOT",
              studyVersion: "1.0.0-pilot",
              note: "Başlangıç 36 senaryo (12 Oyun, 12 Form A, 12 Form B) ve tek değişkenli üst giyim demo görselleri sisteme yüklendi.",
              status: "OPEN",
            },
          });
        }
      }

      bootstrapDone = true;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}
