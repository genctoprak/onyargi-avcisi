import { test, expect } from "@playwright/test";

test.describe("Önyargı Avcısı — Uçtan Uca Bilimsel ve Kullanıcı Deneyimi Testleri", () => {
  test("12. Mobil (360px, 390px) ve masaüstü (768px, 1280px) ekranlarda yatay taşma bulunmaz", async ({
    page,
  }) => {
    const widths = [360, 390, 768, 1280];
    const routes = ["/", "/play", "/study", "/badges", "/results", "/admin"];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      for (const route of routes) {
        await page.goto(route, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(
          overflow,
          `${route} sayfasında ${width}px genişlikte yatay taşma (${overflow}px) bulundu`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("9. Yönetici paneline ve yönetici API uçlarına yetkisiz erişim engellenir", async ({
    request,
    page,
  }) => {
    const protectedEndpoints = [
      "/api/admin/overview",
      "/api/admin/scenarios",
      "/api/admin/visuals",
      "/api/admin/settings",
      "/api/admin/participants",
      "/api/admin/export",
      "/api/admin/notes",
    ];
    for (const ep of protectedEndpoints) {
      const res = await request.get(ep);
      expect(res.status(), `${ep} yetkisiz erişimde 401 dönmeli`).toBe(401);
    }

    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Araştırmacı Girişi" })).toBeVisible();
  });

  test("13 & 8. Eğitici oyun akışında klavye ile seçim yapılır, ilk karar olmadan ipucu açılmaz ve puan hesaplanır", async ({
    page,
  }) => {
    await page.goto("/play/classic", { waitUntil: "networkidle" });
    await expect(page.getByText(/Olay Dosyası İlerlemesi/)).toBeVisible();

    // İlk karar verilmeden ipucu başlığı görünmemeli
    await expect(page.getByText("1. İpucu Açıldı")).toHaveCount(0);

    // Klavye kısayolu '3' ile "Yeterli bilgim yok" seçimi yapılabilmeli
    await page.keyboard.press("3");
    const unknownRadio = page.getByRole("radio", { name: /Yeterli bilgim yok/ });
    await expect(unknownRadio).toHaveAttribute("aria-checked", "true");

    // Gerekçe seç ve ilk kararı sunucuya gönder
    await page.locator("#game-first-reason").selectOption("yeterli_bilgi_yok");
    await page.getByRole("button", { name: /İlerle ve İpucunu Aç/ }).click();

    // İlk karar kaydedildikten sonra ipucu açılmalı
    await expect(page.getByText("1. İpucu Açıldı")).toBeVisible();

    // Son kararı onayla ve sonuç ekranını gör
    await page.getByRole("button", { name: "İlk kararımı koruyorum" }).click();
    await page.getByRole("button", { name: "Kararımı Onayla" }).click();

    await expect(page.getByText("Olay Dosyası Sonucu")).toBeVisible();
    await expect(page.getByText("Farkındalık Mesajı")).toBeVisible();
  });

  test("2, 3, 4, 5, 10, 11. Araştırma ön testinde geri bildirim ve cevap anahtarı yoktur, ilk karar öncesi ipucu kilitlidir, yenilemede oturum ve grup korunur, demo verisi gerçek veriye karışmaz", async ({
    page,
  }) => {
    const testCode = `DEMO-E2E-${Date.now().toString().slice(-6)}`;

    // 1. Araştırma katılım ekranına git (gerçek veri toplama varsayılan olarak kapalı)
    await page.goto("/study", { waitUntil: "networkidle" });
    await expect(page.getByText(/Gerçek Veri Toplama: KAPALI/)).toBeVisible();

    // 2. Demo modunda katılım başlat
    await page.locator("#participant-code").fill(testCode);
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /Demo Araştırma Akışını Başlat/ }).click();

    await page.waitForURL("**/study/pretest", { timeout: 15000 });
    await expect(page.getByText("Bilimsel Ön Test")).toBeVisible();
    await expect(page.getByText(testCode)).toBeVisible();

    // 3. /api/study/phase yanıtında verifiedActor / teachingMessage / contextExplanation OLMADIĞINI doğrula
    const phaseJson = await page.evaluate(async () => {
      const r = await fetch("/api/study/phase?phase=PRETEST", { cache: "no-store" });
      return r.json();
    });

    expect(phaseJson.currentScenario).toBeTruthy();
    expect(phaseJson.currentScenario.verifiedActor).toBeUndefined();
    expect(phaseJson.currentScenario.teachingMessage).toBeUndefined();
    expect(phaseJson.currentScenario.contextExplanation).toBeUndefined();
    expect(phaseJson.currentScenario.clue1).toBeNull();

    const assignedGroup = phaseJson.participant.groupAssignment;
    const assignedPretestForm = phaseJson.participant.pretestForm;
    const assignedPosttestForm = phaseJson.participant.posttestForm;
    expect(assignedPretestForm).not.toBe(assignedPosttestForm);

    // 4. İlk karar kaydedilmeden second-decision çağrısı 409 dönmeli (ipucu/son karar kilidi)
    const prematureStatus = await page.evaluate(
      async ({ sessionId, scenarioId }) => {
        const r = await fetch("/api/study/second-decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            scenarioId,
            decisionMode: "KEEP",
            displayedChoice: "A",
            confidence: 3,
          }),
        });
        return r.status;
      },
      { sessionId: phaseJson.session.id, scenarioId: phaseJson.currentScenario.id },
    );
    expect(prematureStatus).toBe(409);

    // 5. İlk maddeyi (A01 veya B01 — belirsizlik maddesi) yanıtla
    await page.getByRole("radio", { name: "Yeterli bilgim yok" }).click();
    await page.locator("#study-first-reason").selectOption("yeterli_bilgi_yok");
    await page.getByRole("button", { name: "İlerle" }).click();

    // Ön testte öğretici geri bildirim, puan veya rozet görünmemeli; doğrudan Madde 2'ye geçmeli
    await expect(page.getByText(/Madde 2 \/ 12/)).toBeVisible();
    await expect(page.getByText("Farkındalık Mesajı")).toHaveCount(0);
    await expect(page.getByText("Olay Dosyası Sonucu")).toHaveCount(0);

    // 10. Sayfa yenilendikten sonra oturum ve ilerleme (Madde 2 / 12) korunmalı
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(/Madde 2 \/ 12/)).toBeVisible();
    await expect(page.getByText(testCode)).toBeVisible();

    // 5. Aynı katılımcı koduyla tekrar giriş yapıldığında grubun değişmediğini doğrula
    const reEnrollGroup = await page.evaluate(async (code) => {
      const r = await fetch("/api/study/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "DEMO",
          participantCode: code,
          consentAcknowledged: true,
        }),
      });
      const j = await r.json();
      return j.participant.groupAssignment;
    }, testCode);
    expect(reEnrollGroup).toBe(assignedGroup);

    // 11 & 14. Yönetici girişi yap, demo verisinin gerçek veriye karışmadığını ve CSV'de Türkçe karakterleri doğrula
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.locator("#admin-user").fill("arastirmaci");
    await page.locator("#admin-pass").fill("OnyargiAdmin2026!");
    await page.getByRole("button", { name: "Panele Giriş Yap" }).click();

    await expect(page.getByText("Önyargı Avcısı Araştırma Kontrol Merkezi")).toBeVisible();

    const realVsDemo = await page.evaluate(async () => {
      const [realRes, demoRes, csvRes] = await Promise.all([
        fetch("/api/admin/overview?dataMode=real"),
        fetch("/api/admin/overview?dataMode=demo"),
        fetch("/api/admin/export?dataMode=demo&bom=1"),
      ]);
      const real = await realRes.json();
      const demo = await demoRes.json();
      const csvText = await csvRes.text();
      return {
        realCount: real.summary.totalParticipants,
        demoCount: demo.summary.totalParticipants,
        csvContentType: csvRes.headers.get("content-type"),
        csvText,
      };
    });

    expect(realVsDemo.realCount).toBe(0);
    expect(realVsDemo.demoCount).toBeGreaterThanOrEqual(1);
    expect(realVsDemo.csvContentType).toContain("charset=utf-8");
    expect(realVsDemo.csvText).toContain("DEMO VERİSİ");
    expect(realVsDemo.csvText).toContain(testCode);
  });
});
