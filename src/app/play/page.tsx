import React from "react";
import Link from "next/link";
import { Clock, Compass, Layers, ArrowRight, Sparkles } from "lucide-react";
import { BrainMascot } from "@/components/illustrations/BrainMascot";

export default function PlayModeSelectionPage() {
  const modes = [
    {
      href: "/play/classic",
      title: "Klasik Mod",
      badge: "Önerilen Başlangıç",
      icon: Compass,
      accent: "bg-primary-soft text-primary-dark",
      features: [
        "5 farklı olay dosyası",
        "Süre sınırı yok — rahatça incele",
        "Kanıta dayalı puan ve rozet desteği",
      ],
      buttonText: "Klasik Modu Başlat",
    },
    {
      href: "/play/timed",
      title: "Zaman Modu",
      badge: "15 Saniye İlk Karar",
      icon: Clock,
      accent: "bg-accent-soft text-accent-dark",
      features: [
        "15 saniyelik ilk karar sayacı",
        "Süre dolunca ceza puanı uygulanmaz",
        "Süre dolma durumu ayrı veri olarak kaydedilir",
      ],
      buttonText: "Zaman Modunu Başlat",
    },
    {
      href: "/play/expert",
      title: "Uzman Mod",
      badge: "Çok Aşamalı & Bağlamlı",
      icon: Layers,
      accent: "bg-success-soft text-success-dark",
      features: [
        "Daha zor ve çok aşamalı 6 olay dosyası",
        "Birden fazla ipucu ve bağlam açılımı",
        "Davranışın nedeni ve bağlamı hakkında ek uzman soruları",
      ],
      buttonText: "Uzman Modu Başlat",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card-surface flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:p-7 sm:text-left">
        <BrainMascot mood="happy" size={104} className="shrink-0" />
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-dark">
            <Sparkles className="h-3.5 w-3.5" />
            Eğitici Oyun Modları
          </span>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark sm:text-3xl">
            Oyun Modunu Seç
          </h1>
          <p className="text-sm text-ink-muted">
            Tüm oyun modları kanıta dayalı düşünme farkındalığı geliştirmek içindir. Bilimsel ön
            test ve son test ekranları bu oyun modlarından tamamen ayrıdır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div key={mode.href} className="card-surface flex flex-col justify-between p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${mode.accent}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-lavender-bg px-3 py-1 text-[11px] font-extrabold text-primary-dark">
                    {mode.badge}
                  </span>
                </div>

                <h2 className="font-display text-xl font-extrabold text-ink">{mode.title}</h2>

                <ul className="space-y-2 text-sm text-ink-muted">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link href={mode.href} className="btn-primary w-full text-sm">
                  {mode.buttonText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-lavender-border bg-white/80 p-4 text-xs text-ink-muted">
        <strong className="text-ink">Not:</strong> Zaman Modunda süre baskısının karar davranışına
        etkisi, yalnızca bilimsel araştırma verisi olarak tasarlanmadıkça kişisel bir yorum veya
        tanı aracı olarak kullanılmaz.
      </div>
    </div>
  );
}
