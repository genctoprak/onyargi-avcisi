import { PrismaClient } from "@prisma/client";
import { SCENARIOS_SEED, VISUAL_PAIRS_SEED } from "../src/data/scenarios-manifest";
import { hashPassword } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Önyargı Avcısı veri tabanı başlangıç verileri yükleniyor...");

  // 1. Varsayılan araştırma yapılandırması (veri toplama varsayılan olarak KAPALI)
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

  // 2. Varsayılan araştırmacı / yönetici hesabı
  const adminUsername = process.env.ADMIN_USERNAME || "arastirmaci";
  const adminPassword = process.env.ADMIN_PASSWORD || "OnyargiAdmin2026!";

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        passwordHash: hashPassword(adminPassword),
        displayName: "Baş Araştırmacı",
        role: "RESEARCHER",
      },
    });
    console.log(`Yönetici hesabı oluşturuldu: ${adminUsername}`);
  }

  // 3. Karakter görsel çiftleri
  for (const pair of VISUAL_PAIRS_SEED) {
    await prisma.characterVisualPair.upsert({
      where: { id: pair.id },
      update: {
        version: pair.version,
        title: pair.title,
        variableName: pair.variableName,
        variantA1Key: pair.variantA1Key,
        variantA2Key: pair.variantA2Key,
        variantB1Key: pair.variantB1Key,
        variantB2Key: pair.variantB2Key,
        variantA1Label: pair.variantA1Label,
        variantA2Label: pair.variantA2Label,
        variantB1Label: pair.variantB1Label,
        variantB2Label: pair.variantB2Label,
        notes: pair.notes,
      },
      create: pair,
    });
  }
  console.log(`${VISUAL_PAIRS_SEED.length} karakter görsel çifti hazırlandı.`);

  // 4. İlk 36 senaryo (12 Eğitici Oyun + 12 Ölçüm Formu A + 12 Ölçüm Formu B)
  for (const scenario of SCENARIOS_SEED) {
    await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {
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
        expertOptionsJson: scenario.expertOptions ? JSON.stringify(scenario.expertOptions) : null,
        expertCorrectOption: scenario.expertCorrectOption ?? null,
        availableChoicesJson: JSON.stringify(scenario.availableChoices),
        scoringRuleJson: JSON.stringify(scenario.scoringRule),
      },
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
        expertOptionsJson: scenario.expertOptions ? JSON.stringify(scenario.expertOptions) : null,
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
  console.log(`${SCENARIOS_SEED.length} senaryo veri tabanına yüklendi.`);

  // 5. Başlangıç pilot değerlendirme notu (yoksa ekle)
  const noteCount = await prisma.expertReviewNote.count();
  if (noteCount === 0) {
    await prisma.expertReviewNote.create({
      data: {
        authorName: "Araştırma Ekibi",
        authorRole: "Proje Koordinatörü",
        targetType: "PILOT",
        studyVersion: "1.0.0-pilot",
        note: "Başlangıç 36 senaryo (12 Oyun, 12 Form A, 12 Form B) ve tek değişkenli üst giyim demo görselleri sisteme yüklendi. Gerçek araştırma veri toplaması açılmadan önce uzman görüşü, pilot uygulama ve görsel onayı tamamlanmalıdır.",
        status: "OPEN",
      },
    });
  }

  console.log("Seed işlemi başarıyla tamamlandı.");
}

main()
  .catch((err) => {
    console.error("Seed hatası:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
