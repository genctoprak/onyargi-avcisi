import React from "react";
import Link from "next/link";
import {
  Play,
  HelpCircle,
  Award,
  BarChart3,
  FlaskConical,
  Search,
  Lightbulb,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { BrainMascot } from "@/components/illustrations/BrainMascot";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Kahraman Bölümü */}
      <section className="card-surface relative overflow-hidden p-5 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary-soft/80 blur-2xl"
        />
        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="shrink-0 animate-float">
            <BrainMascot mood="curious" size={146} />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1 text-xs font-extrabold text-ink border border-accent/60">
              <Sparkles className="h-3.5 w-3.5 text-accent-dark" />
              TÜBİTAK 2204-A Eğitim Araştırması &amp; Farkındalık Oyunu
            </span>

            <h1 className="font-display text-3xl font-extrabold leading-tight text-primary-dark sm:text-4xl">
              Önyargı Avcısı
            </h1>

            <p className="font-display text-lg font-bold text-primary sm:text-xl">
              &ldquo;Görünüşe aldanma, gerçeği keşfet!&rdquo;
            </p>

            <p className="max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
              <strong className="text-ink">Tanımadan yargılama, görmeden karar verme!</strong>{" "}
              Günlük okul olaylarını incele, ilk izlenimini fark et, kanıtları topla ve yeni
              bilgiyle kararını değerlendir.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/play" className="btn-primary w-full sm:w-auto">
                <Play className="h-5 w-5 fill-current" />
                Oyuna Başla
              </Link>
              <Link href="/study" className="btn-accent w-full sm:w-auto">
                <FlaskConical className="h-5 w-5" />
                Araştırma Katılımı
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hızlı Erişim Kartları */}
      <section aria-label="Ana menü seçenekleri" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MenuCard
          href="#nasil-oynanir"
          icon={HelpCircle}
          iconBg="bg-primary-soft text-primary-dark"
          title="Nasıl Oynanır?"
          description="Olay dosyası, kanıt açma ve bağlam değerlendirme adımlarını öğren."
        />
        <MenuCard
          href="/badges"
          icon={Award}
          iconBg="bg-accent-soft text-accent-dark"
          title="Rozetlerim"
          description="Kanıta dayalı düşünme başarılarınla kazandığın rozetleri incele."
        />
        <MenuCard
          href="/results"
          icon={BarChart3}
          iconBg="bg-success-soft text-success-dark"
          title="İstatistiklerim"
          description="Oyun puanlarını, kanıt başarını ve belirsizlik kararlarını gör."
        />
        <MenuCard
          href="/admin"
          icon={ShieldCheck}
          iconBg="bg-lavender-bg text-primary-dark"
          title="Araştırmacı Paneli"
          description="Senaryo yönetimi, bilimsel göstergeler ve anonim CSV dışa aktarma."
        />
      </section>

      {/* Nasıl Oynanır? */}
      <section id="nasil-oynanir" className="card-lilac p-5 sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-primary-dark">
              Nasıl Oynanır?
            </h2>
            <p className="text-xs text-ink-muted">
              Araştırmaya katılmadan da demo ve eğitici oyun modlarını özgürce oynayabilirsin.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StepCard
            step="1"
            icon={FileText}
            title="Olay Dosyasını İncele"
            text="Kısa olay metnini ve iki karakteri incele. Karakter A, Karakter B veya 'Yeterli bilgim yok' seçeneğini işaretle; karar güvenini ve gerekçeni belirt."
          />
          <StepCard
            step="2"
            icon={Search}
            title="Kanıtları ve Bağlamı Aç"
            text="İlk kararın kaydedildikten sonra güvenilir ipuçları sırayla açılır. Yeni bilgiye göre kararını koruyabilir, değiştirebilir veya belirsizliği koruyabilirsin."
          />
          <StepCard
            step="3"
            icon={Lightbulb}
            title="Gerçeği Keşfet"
            text="Rastgele doğru tahmin yerine kanıta dayalı seçim, belirsizliği tanıma ve yeni bilgiyle güncelleme daha yüksek puan ve rozet kazandırır."
          />
        </div>
      </section>

      {/* Bilimsel Sorumluluk Notu */}
      <section className="rounded-3xl border border-lavender-border bg-white/80 p-4 text-xs leading-relaxed text-ink-muted sm:p-5">
        <p className="font-bold text-ink">Bilimsel İlkelerimiz</p>
        <p className="mt-1">
          Önyargı Avcısı bir psikolojik tanı aracı değildir ve hiç kimseyi &ldquo;önyargılı&rdquo;,
          &ldquo;önyargısız&rdquo;, &ldquo;iyi&rdquo; ya da &ldquo;kötü&rdquo; olarak etiketlemez.
          Eğitici oyun sonuçları ile bilimsel araştırma ölçümleri sistemde tamamen ayrı tutulur.
        </p>
      </section>
    </div>
  );
}

function MenuCard({
  href,
  icon: Icon,
  iconBg,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="card-surface group flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-display text-base font-extrabold text-ink group-hover:text-primary-dark">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
    </Link>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  text,
}: {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-lavender-border bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-extrabold text-ink">
          {step}
        </span>
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-extrabold text-ink">{title}</h3>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-ink-muted sm:text-sm">{text}</p>
    </div>
  );
}
