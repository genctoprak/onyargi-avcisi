"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Award,
  BarChart3,
  Gamepad2,
  FlaskConical,
} from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";

export function AppHeader() {
  const pathname = usePathname();
  const { settings, updateSettings } = usePreferences();
  const [openA11y, setOpenA11y] = useState(false);

  const navItems = [
    { href: "/play", label: "Oyna", icon: Gamepad2 },
    { href: "/study", label: "Araştırma", icon: FlaskConical },
    { href: "/badges", label: "Rozetler", icon: Award },
    { href: "/results", label: "İstatistikler", icon: BarChart3 },
    { href: "/admin", label: "Yönetici", icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-lavender-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-xl py-1 pr-2 focus-visible:outline-accent"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Search className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate font-display text-lg font-extrabold tracking-tight text-primary-dark sm:text-xl">
              Önyargı Avcısı
            </span>
          </Link>

          <nav aria-label="Ana gezinme" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                    active
                      ? "bg-primary-soft text-primary-dark"
                      : "text-ink-muted hover:bg-lavender-bg hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-lavender-border bg-lavender-card text-ink hover:border-primary"
              aria-label={settings.soundEnabled ? "Sesi kapat" : "Sesi aç"}
              title={settings.soundEnabled ? "Ses açık" : "Ses kapalı"}
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-ink-muted" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setOpenA11y(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-lavender-border bg-lavender-card px-2.5 text-xs font-bold text-ink hover:border-primary"
              aria-label="Erişilebilirlik ve ses ayarları"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Ayarlar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Erişilebilirlik & Ses Ayarları Modalı */}
      {openA11y && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-modal-title"
        >
          <div className="card-surface w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="a11y-modal-title" className="font-display text-xl font-extrabold text-primary-dark">
                Erişilebilirlik ve Ses Ayarları
              </h2>
              <button
                type="button"
                onClick={() => setOpenA11y(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-lavender-border text-ink-muted hover:text-ink"
                aria-label="Pencereyi kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Ses efektleri"
                description="Oyun içi hafif tıklama ve ipucu sesleri"
                checked={settings.soundEnabled}
                onChange={(v) => updateSettings({ soundEnabled: v })}
              />
              <ToggleRow
                label="Azaltılmış hareket"
                description="Animasyon ve geçiş hareketlerini en aza indirir"
                checked={settings.reducedMotion}
                onChange={(v) => updateSettings({ reducedMotion: v })}
              />
              <ToggleRow
                label="Yüksek kontrast"
                description="Kart kenarlıklarını ve metin kontrastını artırır"
                checked={settings.highContrast}
                onChange={(v) => updateSettings({ highContrast: v })}
              />
              <ToggleRow
                label="Büyük yazı tipi"
                description="Okunabilirliği artırmak için yazı boyutunu büyütür"
                checked={settings.largeText}
                onChange={(v) => updateSettings({ largeText: v })}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-lavender-card p-3 text-xs text-ink-muted">
              <strong className="text-ink">Klavye kısayolları:</strong> Olay dosyası ekranında{" "}
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-ink shadow-xs">1</kbd> (Karakter A),{" "}
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-ink shadow-xs">2</kbd> (Karakter B) ve{" "}
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-ink shadow-xs">3</kbd> (Yeterli bilgim yok)
              tuşlarıyla seçim yapabilirsiniz.
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenA11y(false)}
                className="btn-primary py-2.5 text-sm"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-lavender-border bg-lavender-card/70 px-4 py-3">
      <div>
        <div className="text-sm font-bold text-ink">{label}</div>
        <div className="text-xs text-ink-muted">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
    </label>
  );
}
