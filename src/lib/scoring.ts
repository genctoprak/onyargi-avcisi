import type { ChoiceValue } from "@/lib/study-engine";

export interface GameScoreInput {
  scenarioType: "B" | "K" | "Y";
  verifiedActor: ChoiceValue;
  firstChoice: ChoiceValue;
  secondChoice: ChoiceValue | null;
  interpretationBefore: number | null;
  interpretationAfter: number | null;
  expertAnswer?: string | null;
  expertCorrectOption?: string | null;
  mode: "CLASSIC" | "TIMED" | "EXPERT";
  timedOut?: boolean;
}

export interface GameScoreResult {
  points: number;
  stars: 1 | 2 | 3;
  evidenceAligned: boolean;
  uncertaintyRecognized: boolean;
  updatedWithEvidence: boolean;
  breakdown: string[];
}

/**
 * Gamified scoring engine (ONLY for educational game modes — NEVER used for scientific study metrics).
 *
 * Scientific design principles enforced:
 * 1. Guessing A or B without evidence in the first step is NOT rewarded with high points, even if lucky!
 * 2. Recognizing uncertainty ("UNKNOWN") when no evidence exists IS rewarded.
 * 3. Aligning the final decision with verified evidence (or updating an earlier guess when new evidence arrives)
 *    earns the highest points.
 * 4. Running out of time in TIMED mode NEVER penalizes points (recorded separately).
 */
export function calculateGameScenarioScore(input: GameScoreInput): GameScoreResult {
  const breakdown: string[] = [];
  let points = 0;
  let evidenceAligned = false;
  let uncertaintyRecognized = false;
  let updatedWithEvidence = false;

  const finalChoice = input.secondChoice ?? input.firstChoice;

  if (input.scenarioType === "B") {
    // Belirsizlik senaryosu: doğru ve bilimsel karar "UNKNOWN"
    if (input.firstChoice === "UNKNOWN") {
      points += 25;
      uncertaintyRecognized = true;
      breakdown.push("Kanıt yokken belirsizliği ilk adımda tanıdın (+25)");
    } else if (finalChoice === "UNKNOWN") {
      points += 20;
      uncertaintyRecognized = true;
      updatedWithEvidence = true;
      breakdown.push("Ek inceleme sonrası kanıt yetersizliğini fark ettin (+20)");
    } else {
      points += 5;
      breakdown.push("Olayı tamamladın — kanıtsız seçimde puan düşüktür (+5)");
    }
  } else if (input.scenarioType === "K") {
    // Güvenilir kanıt senaryosu
    if (input.firstChoice === "UNKNOWN") {
      points += 15;
      uncertaintyRecognized = true;
      breakdown.push("Kanıt gelmeden kesin yargı vermekten kaçındın (+15)");
    } else {
      // İlk adımda A veya B tahmini (doğru çıksa bile) yüksek puan getirmez!
      points += 5;
      breakdown.push("İlk izlenim kaydı (+5 — kanıtsız tahmin yüksek puan getirmez)");
    }

    if (finalChoice === input.verifiedActor) {
      points += 30;
      evidenceAligned = true;
      if (input.firstChoice !== input.verifiedActor) {
        points += 10;
        updatedWithEvidence = true;
        breakdown.push("Güvenilir kanıtla kararını güncelledin (+40)");
      } else {
        breakdown.push("Kararını güvenilir kanıtla doğruladın (+30)");
      }
    } else {
      breakdown.push("Son kararın sunulan güvenilir kanıtla örtüşmedi (+0)");
    }
  } else {
    // Y: Yeni bağlam senaryosu (kimlik + bağlam değerlendirmesi)
    if (input.firstChoice === "UNKNOWN") {
      points += 15;
      uncertaintyRecognized = true;
      breakdown.push("İlk aşamada kanıt bekleme yaklaşımı (+15)");
    } else {
      points += 5;
      breakdown.push("İlk izlenim kaydı (+5)");
    }

    if (finalChoice === input.verifiedActor) {
      points += 25;
      evidenceAligned = true;
      if (input.firstChoice !== input.verifiedActor) {
        points += 5;
        updatedWithEvidence = true;
        breakdown.push("Yeni bilgiyle kişi kararını kanıta göre güncelledin (+30)");
      } else {
        breakdown.push("Kişi bilgisini kanıtla doğruladın (+25)");
      }
    }

    if (
      typeof input.interpretationBefore === "number" &&
      typeof input.interpretationAfter === "number" &&
      input.interpretationAfter !== input.interpretationBefore
    ) {
      points += 15;
      updatedWithEvidence = true;
      breakdown.push("Yeni bağlam ışığında davranış yorumunu gözden geçirdin (+15)");
    }
  }

  // Uzman mod ek bağlam sorusu
  if (input.mode === "EXPERT" && input.expertCorrectOption && input.expertAnswer) {
    if (input.expertAnswer === input.expertCorrectOption) {
      points += 20;
      breakdown.push("Uzman bağlam sorusunda kanıta dayalı yanıt (+20)");
    } else {
      points += 5;
      breakdown.push("Uzman değerlendirme katılımı (+5)");
    }
  }

  // Süre dolsa bile ceza YOK (bilimsel ilke)
  if (input.timedOut) {
    breakdown.push("İlk karar süresi doldu (ceza puanı uygulanmadı)");
  }

  const stars: 1 | 2 | 3 = points >= 40 ? 3 : points >= 25 ? 2 : 1;

  return {
    points,
    stars,
    evidenceAligned,
    uncertaintyRecognized,
    updatedWithEvidence,
    breakdown,
  };
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: "search" | "scale" | "lightbulb" | "shield" | "sparkles" | "award";
  criteriaText: string;
}

export const GAME_BADGES: BadgeDefinition[] = [
  {
    id: "kanit_avcisi",
    title: "Kanıt Avcısı",
    description: "Güvenilir kanıta dayalı en az 2 karar verdin.",
    icon: "search",
    criteriaText: "Kanıt senaryolarında en az 2 kanıta uyumlu karar",
  },
  {
    id: "belirsizlik_ustasi",
    title: "Belirsizlik Ustası",
    description: "Kanıt yokken tahmin yürütmek yerine 'Yeterli bilgim yok' seçeneğini kullandın.",
    icon: "scale",
    criteriaText: "Belirsizlik senaryosunda kanıtsız karar vermekten kaçınma",
  },
  {
    id: "esnek_dusunur",
    title: "Esnek Düşünür",
    description: "Yeni kanıt veya bağlam geldiğinde ilk görüşünü güncelleyebildin.",
    icon: "lightbulb",
    criteriaText: "Yeni bilgiyle karar veya yorum güncelleme",
  },
  {
    id: "baglam_dedektifi",
    title: "Bağlam Dedektifi",
    description: "Bir davranışın dış görüntüsünün ötesine bakıp bağlamını inceledin.",
    icon: "shield",
    criteriaText: "Bağlam senaryosunda (Y) kanıt ve bağlamı değerlendirme",
  },
  {
    id: "tam_dosya",
    title: "Dosya Tamamlayıcı",
    description: "Bir oyun oturumundaki tüm olay dosyalarını tamamladın.",
    icon: "award",
    criteriaText: "Bir oyun modunu baştan sona tamamlama",
  },
  {
    id: "uzman_arastirmaci",
    title: "Uzman Dedektif",
    description: "Uzman modundaki çok aşamalı ve bağlamlı dosyaları tamamladın.",
    icon: "sparkles",
    criteriaText: "Uzman Modu tamamlama",
  },
];

export function evaluateEarnedBadges(stats: {
  evidenceAlignedCount: number;
  uncertaintyRecognizedCount: number;
  updatedWithEvidenceCount: number;
  contextScenariosCompleted: number;
  sessionCompleted: boolean;
  mode: "CLASSIC" | "TIMED" | "EXPERT";
}): string[] {
  const earned: string[] = [];
  if (stats.evidenceAlignedCount >= 2) earned.push("kanit_avcisi");
  if (stats.uncertaintyRecognizedCount >= 1) earned.push("belirsizlik_ustasi");
  if (stats.updatedWithEvidenceCount >= 1) earned.push("esnek_dusunur");
  if (stats.contextScenariosCompleted >= 1) earned.push("baglam_dedektifi");
  if (stats.sessionCompleted) earned.push("tam_dosya");
  if (stats.sessionCompleted && stats.mode === "EXPERT") earned.push("uzman_arastirmaci");
  return earned;
}
