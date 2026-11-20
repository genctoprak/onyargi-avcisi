import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Önyargı Avcısı — Görünüşe aldanma, gerçeği keşfet!",
  description:
    "TÜBİTAK 2204-A projesi kapsamında geliştirilen, kanıta dayalı düşünme eğitici oyunu ve bilimsel ölçme aracı.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7651C8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">
        <PreferencesProvider>
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
              {children}
            </main>
            <footer className="border-t border-lavender-border/80 bg-white/70 py-5 text-center text-xs text-ink-muted">
              <div className="mx-auto max-w-5xl px-4 space-y-1">
                <p className="font-bold text-ink">
                  Önyargı Avcısı — &ldquo;Tanımadan yargılama, görmeden karar verme!&rdquo;
                </p>
                <p>
                  TÜBİTAK 2204-A Eğitim Araştırması ve Farkındalık Aracı. Bu yazılım bir psikolojik tanı aracı değildir.
                </p>
              </div>
            </footer>
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
