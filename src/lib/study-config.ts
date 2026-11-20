import { prisma } from "@/lib/prisma";
import { ensureInitialDataSeeded } from "@/lib/bootstrap";

export async function getStudyConfig() {
  await ensureInitialDataSeeded();
  let config = await prisma.studyConfig.findUnique({ where: { id: "default" } });
  if (!config) {
    config = await prisma.studyConfig.create({
      data: {
        id: "default",
        studyVersion: "1.0.0-pilot",
        studyCollectionEnabled: false,
      },
    });
  }

  const envAllowsCollection = process.env.STUDY_COLLECTION_ENABLED === "true";

  // Check if at least all research visual pairs are approved
  const unapprovedResearchVisuals = await prisma.characterVisualPair.count({
    where: {
      systemType: "RESEARCH",
      OR: [{ approvedForResearch: false }, { isDemoMaterial: true }],
    },
  });

  const readinessIssues: string[] = [];
  if (!envAllowsCollection) {
    readinessIssues.push("Ortam değişkeni STUDY_COLLECTION_ENABLED=false olarak ayarlı.");
  }
  if (!config.studyCollectionEnabled) {
    readinessIssues.push("Yönetici panelinden araştırma veri toplama anahtarı henüz açılmadı.");
  }
  if (!config.ethicsApproved) {
    readinessIssues.push("Araştırma izni / etik onay doğrulaması tamamlanmadı.");
  }
  if (!config.parentalConsentProtocolReady) {
    readinessIssues.push("18 yaş altı katılımcılar için veli onam protokolü doğrulanmadı.");
  }
  if (!config.visualsApprovedForResearch || unapprovedResearchVisuals > 0) {
    readinessIssues.push("Araştırma karakter görselleri henüz araştırmacı tarafından onaylanmadı (demo materyali durumunda).");
  }

  const canCollectRealResearchData = readinessIssues.length === 0;

  return {
    config,
    envAllowsCollection,
    unapprovedResearchVisuals,
    readinessIssues,
    canCollectRealResearchData,
  };
}
