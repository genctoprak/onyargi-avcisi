export interface ControlReadingCard {
  id: string;
  orderIndex: number;
  title: string;
  topic: string;
  summary: string;
  exampleCase: string;
  keyTakeaway: string;
  reflectionQuestion: string;
  reflectionOptions: string[];
}

/**
 * Kontrol grubu için oyunlaştırma (puan, rozet, süre baskısı) içermeyen,
 * deney grubundaki 12 eğitici senaryo ile eşdeğer konu ve okuma süresine sahip
 * bilgilendirme modülleri.
 */
export const CONTROL_MODULES: ControlReadingCard[] = [
  {
    id: "C01",
    orderIndex: 1,
    title: "İlk İzlenim Nedir?",
    topic: "Görünüş ve Hızlı Karar",
    summary:
      "İnsan beyni günlük yaşamda hızlı karar verebilmek için kısa yollar kullanır. Bir kişinin kıyafeti, yüz ifadesi veya duruşu hakkında saniyeler içinde bir fikir oluştururuz. Ancak bu ilk izlenimler çoğu zaman davranışla ilgili somut kanıt içermez.",
    exampleCase:
      "Örnek: Bir okul bahçesinde bulunan eşyanın kimin tarafından teslim edildiğini yalnızca öğrencilerin dış görünüşüne bakarak tahmin etmek, teslim kaydı olmadan güvenilir sonuç vermez.",
    keyTakeaway: "İlk izlenim bir başlangıç algısıdır; kesin bilgi yerine geçmez.",
    reflectionQuestion: "Bu bölümde vurgulanan temel düşünce hangisidir?",
    reflectionOptions: [
      "İlk izlenimler her zaman doğru sonuç verir.",
      "Dış görünüş tek başına davranış hakkında kesin kanıt sağlamaz.",
      "Karar verirken kayıt ve belgelere gerek yoktur.",
    ],
  },
  {
    id: "C02",
    orderIndex: 2,
    title: "Belirsizliği Tanımak",
    topic: "Kanıtsız Kesin Karardan Kaçınma",
    summary:
      "Bazı durumlarda kimin ne yaptığını belirlemek için elimizde yeterli bilgi bulunmaz. Böyle anlarda tahmin yürütmek yerine 'yeterli bilgim yok' diyebilmek bilimsel ve adil düşünmenin temel adımıdır.",
    exampleCase:
      "Örnek: Kantin sırasında kimin öne geçtiğini gören kimse yoksa ve kayıt bulunmuyorsa, iki öğrenciden birini görünüşüne göre seçmek haksız bir varsayıma yol açabilir.",
    keyTakeaway: "Yeterli kanıt yoksa belirsizliği kabul etmek en doğru tutumdur.",
    reflectionQuestion: "Kanıt bulunmayan bir olayda hangi tutum daha sağlıklıdır?",
    reflectionOptions: [
      "Görünüşe göre bir tahmin yapıp kesinleştirmek",
      "Yeterli bilgi olmadığını kabul edip yargıyı ertelemek",
      "Her iki tarafı da peşinen sorumlu tutmak",
    ],
  },
  {
    id: "C03",
    orderIndex: 3,
    title: "Güvenilir Kanıt Türleri",
    topic: "Kayıt ve Doğrudan Gözlem",
    summary:
      "Bir olayın gerçeğine ulaşmak için tutanaklar, sistem kayıtları ve olayı doğrudan gören güvenilir tanıklar gibi doğrulanabilir bilgilere başvururuz. Söylentiler ve görünüşe dayalı tahminler kanıt değildir.",
    exampleCase:
      "Örnek: Kütüphaneden alınan bir kitabın teslim tarihi, öğrencilerin dış görünüşünden değil kütüphane barkod kayıtlarından kesin olarak anlaşılır.",
    keyTakeaway: "Doğrulanabilir kayıtlar ve doğrudan gözlemler kişisel tahminlerden üstündür.",
    reflectionQuestion: "Aşağıdakilerden hangisi güvenilir kanıta örnektir?",
    reflectionOptions: [
      "Bir kişinin kıyafet tarzı",
      "Kütüphane ödünç takip kaydı",
      "Başkalarının kulaktan dolma yorumları",
    ],
  },
  {
    id: "C04",
    orderIndex: 4,
    title: "Yeni Bilgiyle Görüş Güncelleme",
    topic: "Esnek ve Kanıta Dayalı Düşünme",
    summary:
      "Başlangıçta bir fikrimiz olsa bile, yeni ve güvenilir bir kanıt ortaya çıktığında düşüncemizi güncellemek bilimsel düşüncenin gereğidir. İlk tahmine ısrarla bağlı kalmak gerçeği görmeyi zorlaştırır.",
    exampleCase:
      "Örnek: Otobüste yaşlı bir yolcuya yer veren kişi hakkında başlangıçta farklı bir tahminde bulunulsa bile, olayı doğrudan gören tanığın bilgisi geldiğinde değerlendirme güncellenmelidir.",
    keyTakeaway: "Yeni ve güvenilir kanıt geldiğinde görüş değiştirmek tutarlılıktır.",
    reflectionQuestion: "Güvenilir yeni bir kanıt ilk tahminimizle çelişirse ne yapmalıyız?",
    reflectionOptions: [
      "İlk tahminimizi ne olursa olsun korumalıyız",
      "Yeni kanıtı dikkate alarak kararımızı güncellemeliyiz",
      "Kanıtı görmezden gelmeliyiz",
    ],
  },
  {
    id: "C05",
    orderIndex: 5,
    title: "Olumlu Önyargılar da Varsayımdır",
    topic: "Görünüşe Dayalı Olumlu Atıflar",
    summary:
      "Görünüşe göre karar vermek yalnızca olumsuz durumlarda değil, olumlu olaylarda da ortaya çıkabilir. Bir kişiye yalnızca düzenli giyindiği için olumlu bir davranışı kanıtsız biçimde atfetmek de bilimsel değildir.",
    exampleCase:
      "Örnek: Parkta plastik şişelerin toplanması olumlu bir davranıştır; ancak bunu kimin yaptığını gösteren bir kanıt yoksa belirli bir kişiyi seçmek yine varsayıma dayanır.",
    keyTakeaway: "Olumlu ya da olumsuz her yargı için somut kanıt aranmalıdır.",
    reflectionQuestion: "Olumlu bir davranışta kanıt yoksa nasıl değerlendirme yapılmalıdır?",
    reflectionOptions: [
      "Daha düzenli görünen kişi seçilmelidir",
      "Kanıt olmadığı için kimin yaptığı belirsiz sayılmalıdır",
      "İlk akla gelen kişi kesin kabul edilmelidir",
    ],
  },
  {
    id: "C06",
    orderIndex: 6,
    title: "Davranışın Bağlamını Görmek",
    topic: "Bağlam ve Niyet Ayrımı",
    summary:
      "Bir kişinin hangi davranışı yaptığını bilmek her zaman o davranışın nedenini bildiğimiz anlamına gelmez. Dışarıdan olumsuz görünen bir davranış, bağlamı öğrenildiğinde koruyucu veya görev gereği olabilir.",
    exampleCase:
      "Örnek: Sunum yapan arkadaşının sözünü aniden kesen bir öğrenci ilk bakışta saygısız görünebilir; oysa tahtanın üstündeki gevşek bir kabloya karşı uyarıda bulunuyor olabilir.",
    keyTakeaway: "Kişinin kimliği ile davranışın niyeti ayrı değerlendirilmelidir.",
    reflectionQuestion: "Bir davranışı adil biçimde yorumlamak için neye ihtiyaç vardır?",
    reflectionOptions: [
      "Yalnızca tek bir ana bakmaya",
      "Davranışın gerçekleştiği bağlamı ve nedenini öğrenmeye",
      "Kişinin giyim tarzını incelemeye",
    ],
  },
  {
    id: "C07",
    orderIndex: 7,
    title: "İzinli Görevler ve Yanlış Anlamalar",
    topic: "Bağlam Eksikliği",
    summary:
      "Bir olayın sadece küçük bir kesitini görmek yanlış yorumlara yol açabilir. Görevli veya izinli biçimde yapılan işler, bağlam bilinmediğinde şüpheli görünebilir.",
    exampleCase:
      "Örnek: Etkinlikte fotoğraf çeken bir öğrenci, izinli kulüp görevlisi olduğu öğrenilene kadar yanlış anlaşılabilir.",
    keyTakeaway: "Eksik kesitler üzerinden niyet okumak yerine bilgi istemek gerekir.",
    reflectionQuestion: "Bir olayın yalnızca kısa bir anını gördüğümüzde ne yapmalıyız?",
    reflectionOptions: [
      "Hemen olumsuz niyet varsaymalıyız",
      "Olayın bağlamını ve açıklamasını öğrenmeye çalışmalıyız",
      "Sadece dış görünüşe göre karar vermeliyiz",
    ],
  },
  {
    id: "C08",
    orderIndex: 8,
    title: "Niyetin Belirsiz Kaldığı Durumlar",
    topic: "Kimlik Kesin, Niyet Belirsiz",
    summary:
      "Bazen bir eylemi kimin yaptığı kesin olarak bilinir ancak o kişinin niyeti kesin olarak bilinemez. Örneğin selamımıza karşılık vermeyen bir arkadaşımız bizi duymamış veya dalgın olabilir.",
    exampleCase:
      "Örnek: Koridorda selamına yanıt vermeden yürüyen öğrencinin kimliği bilinse bile, bunu kasıtlı yapıp yapmadığı ek bilgi olmadan kesinleştirilemez.",
    keyTakeaway: "Eylemi kimin yaptığı bilinse bile niyeti kesin değilse varsayım yapılmamalıdır.",
    reflectionQuestion: "Bir arkadaşımız selamımızı almadan geçerse en dengeli yorum nedir?",
    reflectionOptions: [
      "Kesinlikle bize kızgın olduğu",
      "Duymamış veya dalgın olabileceği; kesin nedenin bilinmediği",
      "Kıyafetine göre niyetinin anlaşılabileceği",
    ],
  },
  {
    id: "C09",
    orderIndex: 9,
    title: "Karar Güveni ve Gerçekçilik",
    topic: "Özgüven Kalibrasyonu",
    summary:
      "Elinde kanıt yokken çok yüksek güvenle karar vermek, hatalı yargıları pekiştirir. Karar güvenimiz elimizdeki bilginin sağlamlığıyla orantılı olmalıdır.",
    exampleCase:
      "Örnek: Bir olayda yalnızca tahmin yürütüyorsak güven düzeyimizin düşük olması, somut bir kayıt gördüğümüzde ise yükselmesi daha tutarlıdır.",
    keyTakeaway: "Karar güveni, eldeki kanıtın gücüyle uyumlu olmalıdır.",
    reflectionQuestion: "Karar güvenimizin yüksek olması hangi durumda daha anlamlıdır?",
    reflectionOptions: [
      "Elimizde güvenilir ve doğrulanmış kanıt bulunduğunda",
      "Hiçbir bilgi olmadan hızlı tahmin yaptığımızda",
      "Sadece dış görünüşe baktığımızda",
    ],
  },
  {
    id: "C10",
    orderIndex: 10,
    title: "Etiketlemeden Değerlendirmek",
    topic: "Kişilik Etiketi Yerine Davranış Odaklılık",
    summary:
      "İnsanları tek bir görünüme veya tek bir olaya bakarak 'iyi', 'kötü' ya da 'sorumsuz' gibi genel etiketlere yerleştirmek adil değildir. Değerlendirmeler somut olaylara ve kanıtlara odaklanmalıdır.",
    exampleCase:
      "Örnek: Sınıf ışıklarının açık kalması bir sorumluluk konusudur; ancak kanıt olmadan bir kişiyi 'sorumsuz' diye etiketlemek doğru değildir.",
    keyTakeaway: "Kişileri etiketlemek yerine olayları ve kanıtları değerlendirmeliyiz.",
    reflectionQuestion: "Adil değerlendirme neye odaklanır?",
    reflectionOptions: [
      "İnsanlara genel kişilik etiketleri takmaya",
      "Somut olaylara, kanıtlara ve bağlama",
      "Görünüşe dayalı kalıplara",
    ],
  },
  {
    id: "C11",
    orderIndex: 11,
    title: "Günlük Yaşamda Kanıt Arayışı",
    topic: "Okul ve Sosyal Ortamda Uygulama",
    summary:
      "Okulda, sosyal medyada veya arkadaş ilişkilerinde bir iddia ile karşılaştığımızda üç basit soru sorabiliriz: 'Bunu destekleyen kanıt ne?', 'Eksik bir bağlam var mı?', 'Yeterli bilgi yoksa bekleyebilir miyim?'",
    exampleCase:
      "Örnek: Hızla kapanan bir kapının arkasında rüzgâr veya öğretmen isteği olabileceğini düşünmek, gereksiz tartışmaları önler.",
    keyTakeaway: "Kanıt, bağlam ve belirsizlik soruları adil karar vermeyi kolaylaştırır.",
    reflectionQuestion: "Bir olayla karşılaştığımızda sorulacak en yararlı sorulardan biri hangisidir?",
    reflectionOptions: [
      "Bu kişinin görünüşü bana ne hissettiriyor?",
      "Bu bilgiyi doğrulayan somut bir kanıt ve bağlam var mı?",
      "En hızlı nasıl birini seçebilirim?",
    ],
  },
  {
    id: "C12",
    orderIndex: 12,
    title: "Özet: Tanımadan Yargılama, Görmeden Karar Verme",
    topic: "Bütüncül Farkındalık",
    summary:
      "Bilgilendirme etkinliğini tamamladın. Özetle: Dış görünüş tek başına kanıt değildir; belirsiz durumlarda 'yeterli bilgim yok' demek değerlidir; yeni kanıt ve bağlam geldiğinde düşüncemizi güncellemek adil ve bilimsel bir yaklaşımdır.",
    exampleCase:
      "Hatırlatma: Bu çalışma kimseyi etiketlemek için değil, günlük yaşamda kanıta dayalı düşünme farkındalığını incelemek için hazırlanmıştır.",
    keyTakeaway: "Görünüşe aldanma, kanıtı ve bağlamı araştır.",
    reflectionQuestion: "Aşağıdaki ilkelerden hangisi bu eğitimin ana mesajını en iyi özetler?",
    reflectionOptions: [
      "Görünüşe bakarak hızlıca karar vermek",
      "Kanıt ve bağlam olmadan kesin yargı vermemek",
      "İlk tahmini hiçbir zaman değiştirmemek",
    ],
  },
];
