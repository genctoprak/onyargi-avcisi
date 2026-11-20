-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RESEARCHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "studyVersion" TEXT NOT NULL DEFAULT '1.0.0-pilot',
    "studyCollectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ethicsApproved" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentProtocolReady" BOOLEAN NOT NULL DEFAULT false,
    "visualsApprovedForResearch" BOOLEAN NOT NULL DEFAULT false,
    "scenariosFrozen" BOOLEAN NOT NULL DEFAULT false,
    "frozenScenarioVersion" TEXT,
    "followupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "followupDelayDays" INTEGER NOT NULL DEFAULT 14,
    "demoDataEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterVisualPair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "systemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "variableName" TEXT NOT NULL DEFAULT 'ust_giyim_tarzi',
    "characterAId" TEXT NOT NULL,
    "characterBId" TEXT NOT NULL,
    "variantA1Key" TEXT NOT NULL,
    "variantA2Key" TEXT NOT NULL,
    "variantB1Key" TEXT NOT NULL,
    "variantB2Key" TEXT NOT NULL,
    "variantA1Label" TEXT NOT NULL,
    "variantA2Label" TEXT NOT NULL,
    "variantB1Label" TEXT NOT NULL,
    "variantB2Label" TEXT NOT NULL,
    "isDemoMaterial" BOOLEAN NOT NULL DEFAULT true,
    "approvedForResearch" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "formId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "valueCategory" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "eventText" TEXT NOT NULL,
    "characterPairId" TEXT NOT NULL,
    "clue1" TEXT,
    "clue2" TEXT,
    "verifiedActor" TEXT NOT NULL,
    "behaviorIntent" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "contextExplanation" TEXT NOT NULL,
    "teachingMessage" TEXT NOT NULL,
    "researchQuestion" TEXT NOT NULL,
    "expertQuestion" TEXT,
    "expertOptionsJson" TEXT,
    "expertCorrectOption" TEXT,
    "availableChoicesJson" TEXT NOT NULL DEFAULT '["A","B","UNKNOWN"]',
    "scoringRuleJson" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedForResearch" BOOLEAN NOT NULL DEFAULT false,
    "expertReviewStatus" TEXT NOT NULL DEFAULT 'PILOT',
    "expertReviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scenario_characterPairId_fkey" FOREIGN KEY ("characterPairId") REFERENCES "CharacterVisualPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonymousParticipantId" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "studyVersion" TEXT NOT NULL,
    "groupAssignment" TEXT NOT NULL,
    "pretestForm" TEXT NOT NULL,
    "posttestForm" TEXT NOT NULL,
    "currentPhase" TEXT NOT NULL DEFAULT 'PRETEST',
    "consentAcknowledgedAt" DATETIME,
    "parentalPermissionCode" TEXT,
    "withdrawnAt" DATETIME,
    "deletionRequestedAt" DATETIME,
    "deletionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "studyVersion" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "testForm" TEXT NOT NULL,
    "scenarioOrderJson" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "completionStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudySession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "StudyParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "anonymousParticipantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "studyVersion" TEXT NOT NULL,
    "scenarioVersion" TEXT NOT NULL,
    "groupAssignment" TEXT NOT NULL,
    "testForm" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "visualVariantId" TEXT NOT NULL,
    "displayedCharacterOrder" TEXT NOT NULL,
    "scenarioStartedAt" DATETIME NOT NULL,
    "firstChoice" TEXT NOT NULL,
    "firstConfidence" INTEGER NOT NULL,
    "firstReason" TEXT NOT NULL,
    "firstReasonOther" TEXT,
    "firstSubmittedAt" DATETIME NOT NULL,
    "clueViewedAt" DATETIME,
    "clue2ViewedAt" DATETIME,
    "secondDecisionMode" TEXT,
    "secondChoice" TEXT,
    "secondConfidence" INTEGER,
    "secondSubmittedAt" DATETIME,
    "interpretationBefore" INTEGER,
    "interpretationAfter" INTEGER,
    "completionStatus" TEXT NOT NULL DEFAULT 'FIRST_SUBMITTED',
    CONSTRAINT "StudyResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "StudyParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyResponse_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerToken" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "scenarioIdsJson" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "evidenceScoreCount" INTEGER NOT NULL DEFAULT 0,
    "uncertaintyRecognizedCount" INTEGER NOT NULL DEFAULT 0,
    "timedOutCount" INTEGER NOT NULL DEFAULT 0,
    "badgesEarnedJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GameResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameSessionId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" TEXT NOT NULL,
    "visualVariantId" TEXT NOT NULL,
    "displayedCharacterOrder" TEXT NOT NULL,
    "firstChoice" TEXT NOT NULL,
    "firstConfidence" INTEGER NOT NULL,
    "firstReason" TEXT NOT NULL,
    "firstReasonOther" TEXT,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "firstSubmittedAt" DATETIME NOT NULL,
    "clue1ViewedAt" DATETIME,
    "clue2ViewedAt" DATETIME,
    "secondDecisionMode" TEXT,
    "secondChoice" TEXT,
    "secondConfidence" INTEGER,
    "secondSubmittedAt" DATETIME,
    "interpretationBefore" INTEGER,
    "interpretationAfter" INTEGER,
    "expertAnswer" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "scoringBreakdownJson" TEXT NOT NULL DEFAULT '{}',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GameResponse_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameResponse_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpertReviewNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'GENERAL',
    "targetId" TEXT,
    "studyVersion" TEXT NOT NULL DEFAULT '1.0.0-pilot',
    "rating" INTEGER,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUsername" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "Scenario_formId_isActive_idx" ON "Scenario"("formId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StudyParticipant_anonymousParticipantId_key" ON "StudyParticipant"("anonymousParticipantId");

-- CreateIndex
CREATE INDEX "StudyParticipant_isDemo_groupAssignment_idx" ON "StudyParticipant"("isDemo", "groupAssignment");

-- CreateIndex
CREATE INDEX "StudySession_isDemo_phase_completionStatus_idx" ON "StudySession"("isDemo", "phase", "completionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StudySession_participantId_phase_key" ON "StudySession"("participantId", "phase");

-- CreateIndex
CREATE INDEX "StudyResponse_isDemo_phase_testForm_idx" ON "StudyResponse"("isDemo", "phase", "testForm");

-- CreateIndex
CREATE INDEX "StudyResponse_scenarioId_isDemo_idx" ON "StudyResponse"("scenarioId", "isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "StudyResponse_sessionId_scenarioId_key" ON "StudyResponse"("sessionId", "scenarioId");

-- CreateIndex
CREATE INDEX "GameSession_playerToken_status_idx" ON "GameSession"("playerToken", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GameResponse_gameSessionId_scenarioId_key" ON "GameResponse"("gameSessionId", "scenarioId");
