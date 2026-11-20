# Önyargı Avcısı

> **Slogan:** *"Görünüşe aldanma, gerçeği keşfet!"*  
> **Ana Mesaj:** *"Tanımadan yargılama, görmeden karar verme!"*

**Önyargı Avcısı**, TÜBİTAK 2204-A lise araştırma projeleri yarışması kapsamında geliştirilmiş, Türkçe, mobil öncelikli, oyunlaştırılmış bir kanıta dayalı düşünme uygulaması ve bilimsel ölçme aracıdır.

> **Bilimsel Sorumluluk Notu:** Bu yazılım bir psikolojik tanı aracı değildir. Kullanıcıları *"önyargılı"*, *"önyargısız"*, *"iyi"* veya *"kötü"* olarak etiketlemez; yalnızca gerçek kullanıcı seçimlerinden ve açıkça tanımlanmış ölçüm kurallarından elde edilen göstergeleri raporlar.

---

## 1. Özellikler ve Modüller

- **Eğitici Oyun Modları (`/play`)**
  - **Klasik Mod (`/play/classic`)**: 5 olay dosyası, süre sınırı yok, kanıta dayalı puan ve rozet sistemi.
  - **Zaman Modu (`/play/timed`)**: 15 saniyelik ilk karar sayacı; süre dolunca ceza puanı uygulanmaz, süre dolma durumu ayrı veri olarak kaydedilir.
  - **Uzman Mod (`/play/expert`)**: Çok aşamalı, bağlamlı olaylar ve davranışın nedeni üzerine ek uzman soruları.
  - **Oyun İstatistikleri & Rozetler (`/results`, `/badges`)**: Bilimsel araştırma verilerinden tamamen ayrı saklanır.
- **Bilimsel Araştırma Modülü (`/study`)**
  - Bilgilendirme, gönüllülük, anonim katılımcı kodu ve 18 yaş altı veli onam protokolü doğrulaması.
  - Varsayılan olarak kapalı veri toplama kilidi (`STUDY_COLLECTION_ENABLED=false`) ve gerçek veriden tamamen ayrı **Demo / Pilot Önizleme Modu**.
  - 4 dengelenmiş araştırma kolu: **Deney A-B**, **Deney B-A**, **Kontrol A-B**, **Kontrol B-A**.
  - **Ön Test (`/study/pretest`)** ve **Son Test (`/study/posttest`)**: 12'şer maddelik eşdeğer Form A / Form B; süre baskısı, puan, rozet veya doğru/yanlış geri bildirimi yoktur; cevap anahtarları istemciye gönderilmez; ilk karar sunucuya kaydedilmeden ipucu açılmaz.
  - **Eğitim / Kontrol Aşaması (`/study/intervention`)**: Deney grubu için 12 eğitici senaryo, kontrol grubu için oyunlaştırma içermeyen 12 eşdeğer bilgilendirme kartı.
  - **İzleme Testi (`/study/followup`)**: Yönetici tarafından etkinleştirilebilir; tekrara bağlı öğrenme etkisini önlemek için yeni senaryo eklemeyi destekler, sahte izleme verisi üretmez.
  - Çalışmadan ayrılma ve araştırmacı onaylı veri silme iş akışı.
- **Sürümlenmiş Senaryo Motoru ve Kontrollü Görseller**
  - 36 başlangıç senaryosu (`G01–G12`, `A01–A12`, `B01–B12`) veri tabanında sürümlenmiş olarak saklanır.
  - İki ayrı özgün SVG görsel sistemi: renkli genç oyun karakterleri (`GAME`) ve tek değişkenli üst giyim karşılaştırmalı (sweatshirt vs yakalı gömlek) araştırma karakterleri (`RESEARCH`). Araştırma görselleri araştırmacı onaylayana kadar **DEMO MATERYALİ** olarak işaretlenir.
  - Görsel sürümleri ve A/B buton konumları sunucu tarafında dengelenmiş ve yeniden üretilebilir şekilde atanır.
- **Araştırmacı Yönetim Paneli (`/admin`)**
  - Kimlik doğrulamalı 8 bölüm: *Genel Durum*, *Senaryo Yönetimi*, *Karakter ve Görsel Yönetimi*, *Araştırma Ayarları*, *Katılımcı Oturumları*, *Veri Analizi*, *Veri Dışa Aktarma*, *Uzman Değerlendirme ve Pilot Notları*.
  - 5 bilimsel gösterge: **KKO** (Kanıtsız Kesin Karar Oranı), **KUK** (Kanıta Uygun Karar Oranı), **Görünüşe Bağlı Seçim Etkisi**, **Karar Güveni (1–5)** ve **Bağlam Etkisi (1–5 farkı)** — Form, Aşama ve Grup bazında filtrelenebilir.
  - Gerçek araştırma verisi ile **DEMO VERİSİ** kesin olarak ayrılır.
  - Excel uyumlu UTF-8 BOM destekli anonim CSV dışa aktarma.
- **Erişilebilirlik ve Mobil Öncelikli Tasarım**
  - 360px, 390px, 768px ve 1280px genişliklerde yatay taşma olmadan duyarlı görünüm.
  - Klavye ile seçim (`1`, `2`, `3`, `Tab`, `Enter`), azaltılmış hareket (`prefers-reduced-motion` + uygulama içi ayar), yüksek kontrast, büyük yazı tipi ve isteğe bağlı hafif ses efektleri.

---

## 2. Mimari Tercihler ve Gerekçeler

- **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS**: Sunucu tarafı doğrulama, API rotaları ve mobil uyumlu arayüzü tek projede güvenli şekilde birleştirir.
- **Prisma ORM (SQLite Yerel Geliştirme + PostgreSQL Üretim/Docker Desteği)**:
  - Yerel geliştirme ortamında ve otomatik testlerde Docker/PostgreSQL kurulu olmasa dahi uygulamanın tek komutla çalışabilmesi için varsayılan şema (`prisma/schema.prisma`) SQLite (`file:./dev.db`) ile yapılandırılmıştır.
  - Üretim ve Docker Compose ortamı için birebir eşdeğer PostgreSQL şeması (`prisma/schema.postgresql.prisma`) ve `docker-compose.yml` dosyası eklenmiştir.
  - PostgreSQL'e geçiş için:
    ```bash
    docker compose up -d
    npm run db:use:postgres
    # .env içindeki DATABASE_URL satırını postgresql://... olarak güncelleyin
    npx prisma migrate deploy
    npm run db:seed
    ```
- **Sunucu Tarafı Güvenlik**: `scrypt` parola karması, `HMAC-SHA256` imzalı `HttpOnly` çerezler, `Origin` tabanlı CSRF doğrulaması, temel istek hız sınırlandırması (rate limiting), Zod şema doğrulaması, çift gönderim engelleme (`@@unique`), aşama kilidi ve araştırma başladığında ölçüm senaryolarını dondurma mekanizması.

---

## 3. Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 20+ (önerilen 22/24) ve npm
- İsteğe bağlı (PostgreSQL için): Docker & Docker Compose

### Adım Adım Kurulum

```bash
# 1. Bağımlılıkları kurun
npm install

# 2. Ortam dosyasını oluşturun
cp .env.example .env

# 3. Veri tabanını oluşturun ve 36 başlangıç senaryosunu yükleyin
npx prisma migrate dev --name init
npm run db:seed

# 4. Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama `http://localhost:3010` adresinde açılır.

### Varsayılan Yönetici Girişi (Geliştirme)
- **URL:** `http://localhost:3010/admin`
- **Kullanıcı adı:** `arastirmaci` (`.env` içindeki `ADMIN_USERNAME`)
- **Parola:** `OnyargiAdmin2026!` (`.env` içindeki `ADMIN_PASSWORD` — üretimde mutlaka değiştirin)

---

## 4. Kalıcı Depolama ve Yedekleme Koşulları

- **Gerçek araştırma uygulaması öncesinde PostgreSQL kullanılması önerilir** (`docker-compose.yml` içindeki `pgdata` kalıcı hacmi veya yönetilen bir PostgreSQL sunucusu).
- **Günlük Yedekleme:**
  - PostgreSQL için: `pg_dump -U onyargi -Fc onyargi_avcisi > backup_$(date +%F).dump`
  - SQLite pilot kullanımı için: `prisma/dev.db` dosyasının günlük şifreli kopyası alınmalıdır.
- **Veri Toplama Güvenliği:** Gerçek katılımcı verisi toplamaya başlamadan önce:
  1. Etik kurul / kurum izni ve 18 yaş altı veli onam protokolü belgelenmeli,
  2. `/admin` → **Görseller** sekmesinden kontrollü araştırma görselleri onaylanmalı,
  3. `.env` dosyasında `STUDY_COLLECTION_ENABLED=true` yapılmalı ve güçlü rastgele `SESSION_SECRET` atanmalı,
  4. `/admin` → **Ayarlar** sekmesinden doğrulama onayları işaretlenerek senaryo sürümleri dondurulmalıdır.

---

## 5. Otomatik Testler

```bash
# Tip kontrolü
npm run typecheck

# Birim testleri (Vitest)
npm test

# Üretim derlemesi
npm run build

# Uçtan uca testler (Playwright — önce Chromium kurulmalıdır: npx playwright install chromium)
npm run test:e2e
```

---

## 6. Proje Dosya Yapısı

```text
prisma/
  schema.prisma               # Varsayılan Prisma şeması (SQLite / geçişli)
  schema.postgresql.prisma    # PostgreSQL eşdeğer şema
  migrations/                 # Veri tabanı migration dosyaları
  seed.ts                     # 36 senaryo + 6 görsel çifti + yönetici seed
src/
  app/
    page.tsx                  # Ana ekran
    play/                     # Oyun modu seçimi + classic/timed/expert
    study/                    # Araştırma katılımı + pretest/intervention/posttest/followup
    results/                  # Oyun final sonuçları ve istatistikler
    badges/                   # Rozetlerim
    admin/                    # 8 sekmeli araştırmacı yönetim paneli
    api/                      # game/*, study/*, admin/* sunucu API uçları
  components/
    illustrations/            # Beyin dedektif maskotu & iki ayrı karakter SVG sistemi
    game/                     # Oyun akışı bileşeni
    study/                    # Bilimsel ölçüm ekranı bileşeni
    admin/                    # Yönetim paneli bileşenleri
    layout/                   # Üst menü & erişilebilirlik/ses ayarları
    providers/                # Erişilebilirlik & ses tercihleri bağlamı
  data/
    scenarios-manifest.ts     # 36 senaryo ve görsel çifti sürümlenmiş manifesti
    control-modules.ts        # Kontrol grubu için 12 bilgilendirme kartı
  lib/
    study-engine.ts           # Dengeli grup/görsel atama & sıkı istemci sanitizasyonu
    scoring.ts                # Oyun puanlama ve rozet motoru (araştırmadan ayrı)
    metrics.ts                # KKO, KUK, görünüş, güven ve bağlam göstergeleri
    csv.ts                    # UTF-8 BOM destekli anonim CSV üretici
    security.ts               # Oturum çerezleri, CSRF, rate limiting
    crypto.ts                 # scrypt parola karması, HMAC token, anonim kod
tests/
  unit/core.test.ts           # Vitest bilimsel ve güvenlik birim testleri
  e2e/onyargi-avcisi.spec.ts  # Playwright uçtan uca testleri
```

---

## 7. Bilinen Sınırlılıklar ve Araştırma Öncesi Tamamlanacak Adımlar

- **Gerçek Kontrollü Fotoğraflar:** Başlangıçta araştırma görselleri tek değişkenli özgün SVG illüstrasyonlar olarak sağlanmış ve **DEMO MATERYALİ** olarak işaretlenmiştir. Gerçek TÜBİTAK 2204-A saha çalışması öncesinde standart ışık/arka plan/ifade kontrollü fotoğraflar veya uzman onaylı çizimler eklenip `/admin` üzerinden onaylanmalıdır.
- **İzleme Testi Senaryoları:** Tekrara bağlı öğrenme etkisini önlemek amacıyla izleme testi (`FOLLOWUP`) için hazır sahte veri veya tekrarlı madde eklenmemiştir; araştırmacı 2–4 haftalık izleme öncesinde `/admin` → **Senaryolar** sekmesinden yeni `FOLLOWUP` senaryolarını tanımlayabilir.
- **Hız Sınırlandırma (Rate Limiting):** Tek sunucu bellek içi (in-memory) yapıdadır; çoklu sunucu (horizontal scaling) kurulumunda Redis tabanlı paylaşımlı sınırlayıcıya geçilmesi önerilir.
