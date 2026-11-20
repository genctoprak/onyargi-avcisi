import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardMutation, setStudyCookie } from "@/lib/security";
import { studyEnrollSchema } from "@/lib/validation";
import { getStudyConfig } from "@/lib/study-config";
import { generateAnonymousCode } from "@/lib/crypto";
import {
  getFormsForGroup,
  selectBalancedGroup,
  type StudyGroup,
} from "@/lib/study-engine";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req, "study-enroll", 40);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const parsed = studyEnrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Katılım bilgilerini kontrol edin.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { mode, participantCode, parentalPermissionCode } = parsed.data;
    const isDemo = mode === "DEMO";
    const readiness = await getStudyConfig();

    if (!isDemo) {
      if (!readiness.canCollectRealResearchData) {
        return NextResponse.json(
          {
            error:
              "Gerçek araştırma veri toplaması şu anda kapalıdır. Yönetici tarafından tüm etik, veli onamı ve görsel onay koşulları doğrulanmadan gerçek katılımcı kaydı yapılamaz.",
            readinessIssues: readiness.readinessIssues,
          },
          { status: 403 },
        );
      }

      if (!parentalPermissionCode || parentalPermissionCode.trim().length < 4) {
        return NextResponse.json(
          {
            error:
              "18 yaş altı katılımcılar için araştırmacı tarafından doğrulanmış veli onam / izin takip kodu gereklidir. Onam yalnızca kutucuk işaretlenerek alınmış varsayılamaz.",
          },
          { status: 400 },
        );
      }
    }

    const normalizedCode = participantCode
      ? participantCode.toUpperCase()
      : generateAnonymousCode(isDemo ? "DEMO" : "KAT");

    // Check if returning participant with same code (must keep EXACT same group assignment!)
    const existing = await prisma.studyParticipant.findUnique({
      where: { anonymousParticipantId: normalizedCode },
    });

    if (existing) {
      if (existing.isDemo !== isDemo) {
        return NextResponse.json(
          {
            error:
              "Bu katılımcı kodu farklı bir ortamda (Demo / Araştırma) kayıtlıdır. Demo ve gerçek araştırma verileri karıştırılamaz.",
          },
          { status: 409 },
        );
      }
      if (existing.currentPhase === "WITHDRAWN") {
        return NextResponse.json(
          { error: "Bu katılımcı kodu çalışmadan ayrılmış olarak kaydedilmiştir." },
          { status: 403 },
        );
      }

      const { armType } = getFormsForGroup(existing.groupAssignment as StudyGroup);
      const res = NextResponse.json({
        resumed: true,
        participant: {
          anonymousParticipantId: existing.anonymousParticipantId,
          isDemo: existing.isDemo,
          groupAssignment: existing.groupAssignment,
          armType,
          pretestForm: existing.pretestForm,
          posttestForm: existing.posttestForm,
          currentPhase: existing.currentPhase,
        },
      });
      setStudyCookie(res, {
        participantId: existing.id,
        anonymousParticipantId: existing.anonymousParticipantId,
        isDemo: existing.isDemo,
      });
      return res;
    }

    // Balanced 4-arm assignment within same data scope (real vs demo strictly separate)
    const grouped = await prisma.studyParticipant.groupBy({
      by: ["groupAssignment"],
      where: { isDemo },
      _count: { _all: true },
    });

    const counts: Record<StudyGroup, number> = {
      EXP_AB: 0,
      EXP_BA: 0,
      CTRL_AB: 0,
      CTRL_BA: 0,
    };
    for (const row of grouped) {
      if (row.groupAssignment in counts) {
        counts[row.groupAssignment as StudyGroup] = row._count._all;
      }
    }

    const assignedGroup = selectBalancedGroup(counts, normalizedCode);
    const { pretestForm, posttestForm, armType } = getFormsForGroup(assignedGroup);

    const created = await prisma.studyParticipant.create({
      data: {
        anonymousParticipantId: normalizedCode,
        isDemo,
        studyVersion: readiness.config.studyVersion,
        groupAssignment: assignedGroup,
        pretestForm,
        posttestForm,
        currentPhase: "PRETEST",
        consentAcknowledgedAt: new Date(),
        parentalPermissionCode: isDemo ? "DEMO-ONIZLEME" : parentalPermissionCode?.trim() ?? null,
      },
    });

    const res = NextResponse.json(
      {
        resumed: false,
        participant: {
          anonymousParticipantId: created.anonymousParticipantId,
          isDemo: created.isDemo,
          groupAssignment: created.groupAssignment,
          armType,
          pretestForm: created.pretestForm,
          posttestForm: created.posttestForm,
          currentPhase: created.currentPhase,
        },
      },
      { status: 201 },
    );

    setStudyCookie(res, {
      participantId: created.id,
      anonymousParticipantId: created.anonymousParticipantId,
      isDemo: created.isDemo,
    });

    return res;
  } catch (err) {
    console.error("POST /api/study/enroll error:", err);
    return NextResponse.json({ error: "Araştırma oturumu başlatılamadı." }, { status: 500 });
  }
}
