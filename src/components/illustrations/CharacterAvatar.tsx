"use client";

import React from "react";

interface CharacterAvatarProps {
  visualKey: string;
  slotLabel: "A" | "B";
  isDemoMaterial?: boolean;
  approvedForResearch?: boolean;
  compact?: boolean;
}

interface CharacterStyleSpec {
  mode: "GAME" | "RESEARCH";
  bg: string;
  skin: string;
  hair: string;
  hairStyle: "short" | "wavy" | "curly" | "bob" | "parted" | "bun";
  garment: "sweatshirt" | "collared" | "jacket" | "cardigan" | "polo" | "blazer";
  garmentPrimary: string;
  garmentSecondary: string;
  glasses?: boolean;
  labelHint: string;
}

/**
 * İki ayrı karakter görsel sistemi:
 * 1) GAME: Renkli, genç, eğlenceli ve saygılı özgün karakter illüstrasyonları.
 * 2) RESEARCH: Tek değişkenli kontrollü karşılaştırma (aynı yüz, saç, ifade, duruş,
 *    ışık ve nötr arka plan; yalnızca üst giyim sweatshirt / yakalı gömlek olarak değişir).
 */
const VISUAL_SPECS: Record<string, CharacterStyleSpec> = {
  // ---- OYUN GÖRSELLERİ ----
  game_deniz_hoodie: {
    mode: "GAME",
    bg: "#EDE4FF",
    skin: "#F4C9A8",
    hair: "#3B2820",
    hairStyle: "wavy",
    garment: "sweatshirt",
    garmentPrimary: "#7651C8",
    garmentSecondary: "#5A38A8",
    labelHint: "Kapüşonlu spor üst",
  },
  game_deniz_jacket: {
    mode: "GAME",
    bg: "#EDE4FF",
    skin: "#F4C9A8",
    hair: "#3B2820",
    hairStyle: "wavy",
    garment: "jacket",
    garmentPrimary: "#4A7BB7",
    garmentSecondary: "#FFFFFF",
    labelHint: "Kot ceket",
  },
  game_mert_shirt: {
    mode: "GAME",
    bg: "#E6F6F0",
    skin: "#EAB892",
    hair: "#2A1F1B",
    hairStyle: "short",
    garment: "collared",
    garmentPrimary: "#39B98A",
    garmentSecondary: "#FFFFFF",
    glasses: true,
    labelHint: "Yakalı gömlek",
  },
  game_mert_sweater: {
    mode: "GAME",
    bg: "#E6F6F0",
    skin: "#EAB892",
    hair: "#2A1F1B",
    hairStyle: "short",
    garment: "cardigan",
    garmentPrimary: "#E07A5F",
    garmentSecondary: "#FFF7EB",
    glasses: true,
    labelHint: "Örgü kazak",
  },
  game_elif_cardigan: {
    mode: "GAME",
    bg: "#FFF3DA",
    skin: "#F7D3B5",
    hair: "#5A3522",
    hairStyle: "bob",
    garment: "cardigan",
    garmentPrimary: "#D96B8A",
    garmentSecondary: "#FFFFFF",
    labelHint: "Hırka",
  },
  game_elif_sweat: {
    mode: "GAME",
    bg: "#FFF3DA",
    skin: "#F7D3B5",
    hair: "#5A3522",
    hairStyle: "bob",
    garment: "sweatshirt",
    garmentPrimary: "#4E89AE",
    garmentSecondary: "#376787",
    labelHint: "Sweatshirt",
  },
  game_kaan_polo: {
    mode: "GAME",
    bg: "#E8F0FF",
    skin: "#DFAA83",
    hair: "#241D1B",
    hairStyle: "curly",
    garment: "polo",
    garmentPrimary: "#4B6CB7",
    garmentSecondary: "#FFFFFF",
    labelHint: "Polo yaka",
  },
  game_kaan_hoodie: {
    mode: "GAME",
    bg: "#E8F0FF",
    skin: "#DFAA83",
    hair: "#241D1B",
    hairStyle: "curly",
    garment: "sweatshirt",
    garmentPrimary: "#F2A65A",
    garmentSecondary: "#C97F34",
    labelHint: "Kapüşonlu",
  },
  game_zeynep_blazer: {
    mode: "GAME",
    bg: "#FCE9F3",
    skin: "#F1C3A1",
    hair: "#2C201E",
    hairStyle: "bun",
    garment: "blazer",
    garmentPrimary: "#5C4B99",
    garmentSecondary: "#FFFFFF",
    labelHint: "Ceket",
  },
  game_zeynep_hoodie: {
    mode: "GAME",
    bg: "#FCE9F3",
    skin: "#F1C3A1",
    hair: "#2C201E",
    hairStyle: "bun",
    garment: "sweatshirt",
    garmentPrimary: "#3D9970",
    garmentSecondary: "#2A7252",
    labelHint: "Kapüşonlu",
  },
  game_arda_sweat: {
    mode: "GAME",
    bg: "#EAF7FF",
    skin: "#E8B794",
    hair: "#432F23",
    hairStyle: "parted",
    garment: "sweatshirt",
    garmentPrimary: "#6C5CE7",
    garmentSecondary: "#4B3DC2",
    labelHint: "Sweatshirt",
  },
  game_arda_shirt: {
    mode: "GAME",
    bg: "#EAF7FF",
    skin: "#E8B794",
    hair: "#432F23",
    hairStyle: "parted",
    garment: "collared",
    garmentPrimary: "#5282B8",
    garmentSecondary: "#FFFFFF",
    labelHint: "Yakalı gömlek",
  },

  // ---- ARAŞTIRMA GÖRSELLERİ (TEK DEĞİŞKENLİ KONTROLLÜ ÜST GİYİM — NÖTR ARKA PLAN & AYNI İFADE) ----
  // Çift 1: Model X1 (yalnızca üst giyim değişir) & Model Y1 (yalnızca üst giyim değişir)
  res_x1_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#ECC19E",
    hair: "#362721",
    hairStyle: "short",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_x1_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#ECC19E",
    hair: "#362721",
    hairStyle: "short",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },
  res_y1_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#E4B591",
    hair: "#2A1F1B",
    hairStyle: "parted",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_y1_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#E4B591",
    hair: "#2A1F1B",
    hairStyle: "parted",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },

  // Çift 2
  res_x2_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#F2C9A8",
    hair: "#4A2E20",
    hairStyle: "bob",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_x2_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#F2C9A8",
    hair: "#4A2E20",
    hairStyle: "bob",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },
  res_y2_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#E6BA96",
    hair: "#2E221D",
    hairStyle: "bun",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_y2_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#E6BA96",
    hair: "#2E221D",
    hairStyle: "bun",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },

  // Çift 3
  res_x3_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#DFB08C",
    hair: "#241B18",
    hairStyle: "curly",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_x3_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#DFB08C",
    hair: "#241B18",
    hairStyle: "curly",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },
  res_y3_sweatshirt: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#F0C5A2",
    hair: "#3D2B22",
    hairStyle: "wavy",
    garment: "sweatshirt",
    garmentPrimary: "#64748B",
    garmentSecondary: "#475569",
    labelHint: "Üst giyim: Sweatshirt",
  },
  res_y3_collared: {
    mode: "RESEARCH",
    bg: "#F1F2F6",
    skin: "#F0C5A2",
    hair: "#3D2B22",
    hairStyle: "wavy",
    garment: "collared",
    garmentPrimary: "#DCE7F5",
    garmentSecondary: "#94A3B8",
    labelHint: "Üst giyim: Yakalı gömlek",
  },
};

export function CharacterAvatar({
  visualKey,
  slotLabel,
  isDemoMaterial = false,
  approvedForResearch = false,
  compact = false,
}: CharacterAvatarProps) {
  const spec = VISUAL_SPECS[visualKey] ?? VISUAL_SPECS.res_x1_sweatshirt;
  const showDemoTag = spec.mode === "RESEARCH" && (isDemoMaterial || !approvedForResearch);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-lavender-border bg-white ${
          compact ? "max-w-[130px]" : "max-w-[190px]"
        }`}
      >
        <svg
          viewBox="0 0 180 190"
          className="block h-auto w-full"
          role="img"
          aria-label={`Karakter ${slotLabel} görseli (${spec.labelHint})`}
        >
          {/* Sabit, eşit aydınlatmalı arka plan */}
          <rect width="180" height="190" fill={spec.bg} />
          {spec.mode === "GAME" && (
            <circle cx="90" cy="84" r="62" fill="#FFFFFF" fillOpacity="0.45" />
          )}

          {/* Omuzlar ve üst giyim */}
          {spec.garment === "sweatshirt" && (
            <g>
              <path
                d="M32 190C34 146 56 132 90 132C124 132 146 146 148 190H32Z"
                fill={spec.garmentPrimary}
              />
              {/* Kapüşon / bisiklet yaka çizgisi ve bağcıklar */}
              <path
                d="M66 133C73 147 107 147 114 133"
                fill="none"
                stroke={spec.garmentSecondary}
                strokeWidth="5"
                strokeLinecap="round"
              />
              <line x1="80" y1="143" x2="78" y2="168" stroke="#E2E8F0" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="100" y1="143" x2="102" y2="168" stroke="#E2E8F0" strokeWidth="2.6" strokeLinecap="round" />
              {/* Kanguru cep üst dikişi */}
              <path d="M62 178H118" stroke={spec.garmentSecondary} strokeWidth="2" opacity="0.6" />
            </g>
          )}

          {(spec.garment === "collared" || spec.garment === "polo") && (
            <g>
              <path
                d="M32 190C34 146 56 132 90 132C124 132 146 146 148 190H32Z"
                fill={spec.garmentPrimary}
              />
              {/* Yakalı gömlek katları */}
              <polygon points="72,130 90,150 66,154" fill="#FFFFFF" stroke={spec.garmentSecondary} strokeWidth="2" />
              <polygon points="108,130 90,150 114,154" fill="#FFFFFF" stroke={spec.garmentSecondary} strokeWidth="2" />
              {/* Düğme patı */}
              <line x1="90" y1="150" x2="90" y2="190" stroke={spec.garmentSecondary} strokeWidth="2" />
              <circle cx="90" cy="161" r="2.3" fill={spec.garmentSecondary} />
              <circle cx="90" cy="174" r="2.3" fill={spec.garmentSecondary} />
            </g>
          )}

          {(spec.garment === "jacket" || spec.garment === "blazer" || spec.garment === "cardigan") && (
            <g>
              <path
                d="M32 190C34 146 56 132 90 132C124 132 146 146 148 190H32Z"
                fill={spec.garmentPrimary}
              />
              {/* İç tişört */}
              <polygon points="73,132 107,132 100,190 80,190" fill={spec.garmentSecondary} />
              {/* Yaka kenarları */}
              <path d="M73 132L82 162L66 156Z" fill={spec.garmentPrimary} stroke="#231942" strokeOpacity="0.2" />
              <path d="M107 132L98 162L114 156Z" fill={spec.garmentPrimary} stroke="#231942" strokeOpacity="0.2" />
            </g>
          )}

          {/* Boyun */}
          <rect x="79" y="114" width="22" height="24" rx="8" fill={spec.skin} />

          {/* Arka saç (bob / wavy / bun) */}
          {spec.hairStyle === "bob" && (
            <path d="M48 76C48 44 132 44 132 76V122C132 128 118 128 114 118H66C62 128 48 128 48 122V76Z" fill={spec.hair} />
          )}
          {spec.hairStyle === "wavy" && (
            <path d="M46 78C46 42 134 42 134 78C136 96 130 116 122 126H58C50 116 44 96 46 78Z" fill={spec.hair} />
          )}
          {spec.hairStyle === "bun" && (
            <>
              <circle cx="90" cy="34" r="16" fill={spec.hair} />
              <path d="M52 76C52 46 128 46 128 76V98H52V76Z" fill={spec.hair} />
            </>
          )}

          {/* Kulaklar */}
          <circle cx="56" cy="88" r="7" fill={spec.skin} />
          <circle cx="124" cy="88" r="7" fill={spec.skin} />

          {/* Yüz (araştırma görsellerinde tam nötr ve sabit oran) */}
          <rect x="57" y="48" width="66" height="74" rx="30" fill={spec.skin} />

          {/* Ön saç */}
          {spec.hairStyle === "short" && (
            <path d="M55 76C55 44 125 44 125 76C116 63 102 59 90 59C78 59 64 63 55 76Z" fill={spec.hair} />
          )}
          {spec.hairStyle === "parted" && (
            <path d="M55 77C54 44 126 44 125 77C114 66 102 60 84 62C72 64 62 68 55 77Z" fill={spec.hair} />
          )}
          {spec.hairStyle === "curly" && (
            <g fill={spec.hair}>
              <circle cx="64" cy="54" r="12" />
              <circle cx="80" cy="47" r="13" />
              <circle cx="98" cy="47" r="13" />
              <circle cx="115" cy="54" r="12" />
              <circle cx="57" cy="67" r="9" />
              <circle cx="123" cy="67" r="9" />
            </g>
          )}
          {(spec.hairStyle === "bob" || spec.hairStyle === "wavy" || spec.hairStyle === "bun") && (
            <path d="M56 75C58 49 122 49 124 75C112 63 99 61 90 61C81 61 68 63 56 75Z" fill={spec.hair} />
          )}

          {/* Kaşlar (nötr ve simetrik) */}
          <path d="M69 78H82" stroke="#2D232E" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M98 78H111" stroke="#2D232E" strokeWidth="2.6" strokeLinecap="round" />

          {/* Gözler (nötr ve simetrik) */}
          <circle cx="76" cy="87" r="3.6" fill="#231942" />
          <circle cx="104" cy="87" r="3.6" fill="#231942" />
          <circle cx="77.2" cy="85.8" r="1.2" fill="#FFFFFF" />
          <circle cx="105.2" cy="85.8" r="1.2" fill="#FFFFFF" />

          {/* Opsiyonel gözlük (sadece oyun modunda) */}
          {spec.glasses && (
            <g stroke="#231942" strokeWidth="2.2" fill="none">
              <rect x="66" y="80" width="19" height="14" rx="5" />
              <rect x="95" y="80" width="19" height="14" rx="5" />
              <line x1="85" y1="87" x2="95" y2="87" />
            </g>
          )}

          {/* Burun */}
          <path d="M90 89V97C90 98 92 99 93 98" stroke="#C59373" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Ağız: Araştırma görsellerinde tam nötr ifade, oyun görsellerinde hafif dostane tebessüm */}
          {spec.mode === "RESEARCH" ? (
            <path d="M82 106C86 107.5 94 107.5 98 106" stroke="#6E473B" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M81 104C85 110 95 110 99 104" stroke="#6E473B" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </svg>

        {/* Sol üst Karakter A / B etiketi */}
        <span className="absolute left-2 top-2 rounded-full bg-primary-dark/90 px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
          Karakter {slotLabel}
        </span>

        {/* Demo materyali etiketi (araştırmacı onaylamadığı sürece görünür) */}
        {showDemoTag && (
          <span
            className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-amber-100/95 px-1.5 py-0.5 text-center text-[10px] font-bold text-amber-900 border border-amber-300"
            title="Bu görsel araştırmacı onayına kadar demo materyali olarak işaretlenmiştir."
          >
            DEMO MATERYALİ
          </span>
        )}
      </div>
    </div>
  );
}
