"use client";

import React from "react";

interface BrainMascotProps {
  mood?: "curious" | "happy" | "thinking" | "celebrate";
  size?: number;
  className?: string;
}

/**
 * Önyargı Avcısı'nın dost canlısı, özgün SVG beyin dedektif maskotu.
 */
export function BrainMascot({
  mood = "curious",
  size = 128,
  className = "",
}: BrainMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Önyargı Avcısı beyin dedektif maskotu"
    >
      {/* Yumuşak arka hale */}
      <circle cx="90" cy="94" r="72" fill="#E8DCFF" />
      <circle cx="90" cy="94" r="60" fill="#F6F1FF" />

      {/* Dedektif şapkası (deerstalker) */}
      <path
        d="M48 58C52 38 72 28 90 28C108 28 128 38 132 58H48Z"
        fill="#4B2C92"
      />
      <path
        d="M36 59C54 51 126 51 144 59C132 67 48 67 36 59Z"
        fill="#613CB5"
      />
      {/* Şapka şeridi */}
      <rect x="52" y="51" width="76" height="7" rx="3.5" fill="#FFC857" />
      <circle cx="90" cy="27" r="5" fill="#FFC857" />

      {/* Beyin gövdesi */}
      <path
        d="M52 94C44 92 40 82 44 73C47 66 54 63 60 64C64 56 76 53 86 58C90 54 96 54 100 58C110 53 122 56 126 64C132 63 139 66 142 73C146 82 142 92 134 94C138 103 134 115 125 119C121 127 109 131 99 127C94 132 86 132 81 127C71 131 59 127 55 119C46 115 42 103 52 94Z"
        fill="#FFB4C6"
        stroke="#4B2C92"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Beyin kıvrım çizgileri */}
      <path
        d="M64 73C68 68 76 68 79 73M101 73C104 68 112 68 116 73M58 92C62 88 67 89 69 93M111 93C113 89 118 88 122 92M90 60V75"
        stroke="#D97896"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Yanaklar */}
      <ellipse cx="67" cy="105" rx="6" ry="3.5" fill="#FF8FA8" opacity="0.7" />
      <ellipse cx="113" cy="105" rx="6" ry="3.5" fill="#FF8FA8" opacity="0.7" />

      {/* Gözler */}
      {mood === "celebrate" ? (
        <>
          <path d="M71 95C73 90 79 90 81 95" stroke="#231942" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M99 95C101 90 107 90 109 95" stroke="#231942" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="76" cy="94" r="5.5" fill="#231942" />
          <circle cx="104" cy="94" r="5.5" fill="#231942" />
          <circle cx="78" cy="92" r="2" fill="#FFFFFF" />
          <circle cx="106" cy="92" r="2" fill="#FFFFFF" />
        </>
      )}

      {/* Ağız ifadesi */}
      {mood === "thinking" ? (
        <path d="M84 110H97" stroke="#231942" strokeWidth="3.2" strokeLinecap="round" />
      ) : (
        <path
          d="M81 106C84 113 96 113 99 106"
          stroke="#231942"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )}

      {/* Büyüteç (sağ elde) */}
      <g transform={mood === "thinking" ? "translate(-4, -2)" : "translate(0, 0)"}>
        <line
          x1="138"
          y1="126"
          x2="155"
          y2="145"
          stroke="#4B2C92"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle
          cx="127"
          cy="114"
          r="16"
          fill="#E0F7FA"
          fillOpacity="0.85"
          stroke="#4B2C92"
          strokeWidth="4.5"
        />
        <path
          d="M120 107C123 104 128 104 131 106"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Küçük altın yıldız kıvılcımları */}
      <path
        d="M32 45L34.5 51L41 53.5L34.5 56L32 62L29.5 56L23 53.5L29.5 51L32 45Z"
        fill="#FFC857"
      />
      {mood === "celebrate" && (
        <path
          d="M150 40L152 45L157 47L152 49L150 54L148 49L143 47L148 45L150 40Z"
          fill="#39B98A"
        />
      )}
    </svg>
  );
}
