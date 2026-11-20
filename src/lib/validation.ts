import { z } from "zod";

export const choiceSchema = z.enum(["A", "B", "UNKNOWN"]);
export const reasonSchema = z.enum([
  "yuz_ifadesi",
  "giyim_tarzi",
  "sac_genel_gorunus",
  "ilk_izlenim_sezgi",
  "somut_bilgi",
  "yeterli_bilgi_yok",
  "diger",
]);

export const gameStartSchema = z.object({
  mode: z.enum(["CLASSIC", "TIMED", "EXPERT"]),
});

export const gameFirstDecisionSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  displayedChoice: choiceSchema,
  confidence: z.number().int().min(1).max(5),
  reason: reasonSchema,
  reasonOther: z.string().max(300).optional().nullable(),
  interpretationBefore: z.number().int().min(1).max(5).optional().nullable(),
  timedOut: z.boolean().optional().default(false),
});

export const gameSecondDecisionSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  decisionMode: z.enum(["KEEP", "CHANGE", "STILL_UNKNOWN"]),
  displayedChoice: choiceSchema,
  confidence: z.number().int().min(1).max(5),
  interpretationAfter: z.number().int().min(1).max(5).optional().nullable(),
  expertAnswer: z.string().max(300).optional().nullable(),
});

export const studyEnrollSchema = z.object({
  mode: z.enum(["RESEARCH", "DEMO"]),
  participantCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{4,24}$/, "Katılımcı kodu 4-24 karakter harf, rakam, tire veya alt çizgi içermelidir.")
    .optional()
    .or(z.literal("")),
  consentAcknowledged: z.boolean().refine((v) => v === true, {
    message: "Bilgilendirilmiş gönüllü katılım metnini onaylamanız gerekir.",
  }),
  parentalPermissionCode: z.string().trim().max(40).optional().nullable(),
});

export const studyFirstDecisionSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  displayedChoice: choiceSchema,
  confidence: z.number().int().min(1).max(5),
  reason: reasonSchema,
  reasonOther: z.string().max(300).optional().nullable(),
  interpretationBefore: z.number().int().min(1).max(5).optional().nullable(),
  scenarioStartedAt: z.string().datetime().optional(),
});

export const studySecondDecisionSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  decisionMode: z.enum(["KEEP", "CHANGE", "STILL_UNKNOWN"]),
  displayedChoice: choiceSchema,
  confidence: z.number().int().min(1).max(5),
  interpretationAfter: z.number().int().min(1).max(5).optional().nullable(),
});

export const studyInterventionCompleteSchema = z.object({
  completedItems: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional(),
});

export const studyWithdrawSchema = z.object({
  requestDataDeletion: z.boolean().default(false),
  note: z.string().max(500).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(2).max(64),
  password: z.string().min(4).max(128),
});

export const adminStudyConfigSchema = z.object({
  studyVersion: z.string().trim().min(1).max(40).optional(),
  studyCollectionEnabled: z.boolean().optional(),
  ethicsApproved: z.boolean().optional(),
  parentalConsentProtocolReady: z.boolean().optional(),
  visualsApprovedForResearch: z.boolean().optional(),
  scenariosFrozen: z.boolean().optional(),
  followupEnabled: z.boolean().optional(),
  followupDelayDays: z.number().int().min(1).max(90).optional(),
  demoDataEnabled: z.boolean().optional(),
});

export const adminScenarioUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  valueCategory: z.string().trim().min(2).max(80).optional(),
  eventText: z.string().trim().min(10).max(1000).optional(),
  clue1: z.string().max(1000).nullable().optional(),
  clue2: z.string().max(1000).nullable().optional(),
  contextExplanation: z.string().max(1000).optional(),
  teachingMessage: z.string().max(1000).optional(),
  researchQuestion: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  approvedForResearch: z.boolean().optional(),
  expertReviewStatus: z.enum(["PENDING", "PILOT", "APPROVED"]).optional(),
  expertReviewNotes: z.string().max(1000).nullable().optional(),
});

export const adminScenarioCreateSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_-]{2,20}$/, "Senaryo kimliği büyük harf ve rakamlardan oluşmalıdır (örn. F01)."),
  formId: z.enum(["GAME", "A", "B", "FOLLOWUP"]),
  title: z.string().trim().min(2).max(120),
  valueCategory: z.string().trim().min(2).max(80),
  scenarioType: z.enum(["B", "K", "Y"]),
  eventText: z.string().trim().min(10).max(1000),
  characterPairId: z.string().min(1),
  clue1: z.string().max(1000).nullable().optional(),
  clue2: z.string().max(1000).nullable().optional(),
  verifiedActor: choiceSchema,
  behaviorIntent: z
    .enum(["HELPFUL", "NEUTRAL", "PROTECTIVE", "AUTHORIZED", "AMBIGUOUS", "HARMFUL", "UNKNOWN"])
    .default("UNKNOWN"),
  contextExplanation: z.string().trim().min(4).max(1000),
  teachingMessage: z.string().trim().min(4).max(1000),
  researchQuestion: z.string().trim().min(4).max(500),
});

export const adminVisualUpdateSchema = z.object({
  approvedForResearch: z.boolean().optional(),
  isDemoMaterial: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export const adminExpertNoteSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  authorRole: z.string().trim().min(2).max(80),
  targetType: z.enum(["GENERAL", "SCENARIO", "VISUAL", "PILOT"]),
  targetId: z.string().max(40).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  note: z.string().trim().min(4).max(1500),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
});
