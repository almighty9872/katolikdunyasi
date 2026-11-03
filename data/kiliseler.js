/* =====================================================================
 * EN: Catholic churches in Turkey (Latin, Armenian Catholic, Syriac
 *     Catholic, Chaldean Catholic), one entry per church, grouped by the
 *     cities shown on the Kilise Bul map. Each church gets its own page
 *     (kilise/<id>.html) with its history, Mass times, visiting hours and
 *     contact details, and the sources they came from. "short" is the
 *     name shown in the map's list; "side" (Istanbul only) is the side of
 *     the Bosphorus; "status" is active, limited or closed, with "notice"
 *     explaining it. "open" on a city is the side of its dot the list opens.
 *     "lat"/"lon" place a church on its city map (from OpenStreetMap; "approx"
 *     marks a position known only to the street or district; "map" puts a church
 *     on a map of its own, away from the city's, e.g. Selçuk for İzmir).
 *     English, shown when the reader switches to EN, sits beside each
 *     Turkish field ("nameEn", "shortEn", "massEn", "massNoteEn",
 *     "visitsEn", "historyEn", "noticeEn"; a source's third item, when its
 *     title needs one).
 * TR: Türkiye'deki Katolik kiliseleri: her kilise için ayrı bir sayfa
 *     (kilise/<id>.html) üretilir. Ayin saatleri değişebilir; kaynaklar her
 *     kilisenin "sources" alanındadır. Düzenledikten sonra tools/build.ps1
 *     çalıştırın. JSON-START / JSON-END işaretlerini silmeyin.
 * ===================================================================== */
window.CHURCHES = /*JSON-START*/{
 "title": "Kilise Bul",
 "en": "Find a Church",
 "updated": "Ekim 2026",
 "note": "Bu bilgiler kiliselerin kendi sitelerinden, İzmir Katolik Başepiskoposluğu’ndan, Türkiye Katolik Ruhani Reisler Kurulu’nun ayin saatleri listesinden, İstanbul Valiliği’nin Dijital İstanbul envanterinden ve başka açık kaynaklardan derlenmiştir; resmî ve eksiksiz bir kilise sicili değildir. Bir bilgide hata gördüyseniz İletişim sayfasından bize bildirebilirsiniz.",
 "orthodoxNote": "Yakınınızda Katolik kilisesi yoksa Ortodoks bir kilise olabilir. Kilise Hukuku’na göre (Kanun 844 §2), Katolik bir rahibe ulaşmak mümkün değilse ve gerçek bir ihtiyaç varsa, bir Katolik Efkaristiya’yı, Günah Çıkarma’yı ve Hastaların Meshi’ni, sırları geçerli olan Ortodoks Kilisesi’nden alabilir. Bu olağan değil, istisnai bir izindir; her cemaatin kendi disiplini vardır ve rahip her zaman komünyon vermeyebilir.",
 "rites": [
  {
   "id": "latin",
   "tr": "Latin Katolik",
   "en": "Latin Catholic"
  },
  {
   "id": "ermeni",
   "tr": "Ermeni Katolik",
   "en": "Armenian Catholic"
  },
  {
   "id": "suryani",
   "tr": "Süryani Katolik",
   "en": "Syriac Catholic"
  },
  {
   "id": "keldani",
   "tr": "Keldani Katolik",
   "en": "Chaldean Catholic"
  }
 ],
 "cities": [
  {
   "id": "istanbul",
   "name": "İstanbul",
   "lat": 41.01,
   "lon": 28.98,
   "label": [
    0,
    -13,
    "middle"
   ],
   "open": "r",
   "churches": [
    {
     "id": "sent-antuan",
     "lat": 41.03228,
     "lon": 28.9772,
     "side": "avrupa",
     "short": "Sent Antuan",
     "name": "Sent Antuan Bazilikası",
     "rite": "latin",
     "district": "Beyoğlu",
     "address": "İstiklal Caddesi No: 171, 34433 Beyoğlu, İstanbul",
     "phones": [
      "0212 244 09 35"
     ],
     "email": "info@sentantuan.com",
     "website": "https://www.sentantuan.com",
     "mass": [
      [
       "Pazar",
       "10:00 İngilizce · 11:30 İtalyanca · 11:30 Lehçe (alt kilisede) · 19:00 Türkçe (Ekim–Mart döneminde 18:00)"
      ],
      [
       "Pazartesi–Cumartesi",
       "08:00 İngilizce"
      ],
      [
       "Salı",
       "11:30 Türkçe (ilahili, org eşliğinde)"
      ],
      [
       "Salı–Cuma",
       "19:00 Türkçe"
      ],
      [
       "Cumartesi",
       "19:00 İngilizce ve İtalyanca"
      ]
     ],
     "massNote": "Kutsal Hafta ve Noel gibi büyük bayramlarda ayrı bir program yayımlanır.",
     "visits": "Kilise her gün yaklaşık 08:00–19:30 arası açıktır (pazar 09:00’dan itibaren). Salı günleri 10:00–11:30 ve 15:00–17:00 arasında günah çıkarmak isteyenler için bir rahip hazır bulunur.",
     "history": [
      "İstanbul’un en büyük Katolik kilisesi olan Sent Antuan, Padovalı Aziz Antuan’a adanmıştır ve Fransisken Konventüel rahipleri tarafından yönetilir. Fransiskenlerin şehirdeki varlığı 13. yüzyılın başına, 1221 yılına kadar uzanır.",
      "Aynı adı taşıyan ilk kilise 1725’te şehrin İtalyan cemaati tarafından yaptırıldı. Cadde boyunca döşenecek yeni tramvay hattı nedeniyle bu yapı yıkılınca, cemaat İstiklal Caddesi üzerinde yeni bir yer buldu. Temelin ilk taşı 23 Ağustos 1906’da kondu; mali sıkıntılar yüzünden bir süre duran inşaat tamamlandı ve kilise 15 Şubat 1912’de kutsanarak ibadete açıldı.",
      "Venedik yeni-gotik üslubundaki yapıyı Levanten mimar Giulio Mongeri, Eduardo de Nari ile birlikte tasarladı. Latin haçı planlı kilisenin orta nefi apsisten kapıya kadar yaklaşık 50 metre, iç yüksekliği yaklaşık 23 metredir; altında romanesk bir kripta bulunur. Caddeye bakan “St. Antoine Apartmanları”, kiliseye gelir sağlamak amacıyla yapı kompleksiyle birlikte tasarlanmıştır.",
      "Papa XI. Pius kiliseyi 1932’de küçük bazilika ilan etti. Sonradan Papa XXIII. Yuhanna olacak Angelo Giuseppe Roncalli, 1934–1944 yılları arasında Vatikan’ın Türkiye temsilcisiyken burada yıllarca vaaz verdi; avludaki heykeli bu yüzden oradadır. Papa VI. Pavlus 1967’de burada ayin yönetti. Bugün kilise Türkçe, İngilizce, İtalyanca ve Lehçe ayinlerle dört dilde bir cemaate ev sahipliği yapar."
     ],
     "sources": [
      [
       "Sent Antuan Bazilikası resmi sitesi",
       "https://www.sentantuan.com",
       "Basilica of Sent Antuan, official website"
      ],
      [
       "Dijital İstanbul (İstanbul Valiliği): Sent Antuan Katolik Kilisesi",
       "https://dijitalistanbul.org/sent-antuan-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Basilica of St. Anthony of Padua (Sent Antuan)"
      ],
      [
       "Wikipedia: Church of St. Anthony of Padua, Istanbul",
       "https://en.wikipedia.org/wiki/Church_of_Saint_Anthony_of_Padua,_Istanbul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Basilica of St. Anthony of Padua (Sent Antuan)",
     "shortEn": "St. Anthony",
     "massEn": [
      [
       "Sunday",
       "10:00 English · 11:30 Italian · 11:30 Polish (in the lower church) · 19:00 Turkish (18:00 from October to March)"
      ],
      [
       "Monday–Saturday",
       "08:00 English"
      ],
      [
       "Tuesday",
       "11:30 Turkish (sung, with organ)"
      ],
      [
       "Tuesday–Friday",
       "19:00 Turkish"
      ],
      [
       "Saturday",
       "19:00 English and Italian"
      ]
     ],
     "massNoteEn": "A separate schedule is published for great feasts such as Holy Week and Christmas.",
     "visitsEn": "The church is open every day from about 08:00 to 19:30 (from 09:00 on Sundays). On Tuesdays a priest is available for confession from 10:00 to 11:30 and from 15:00 to 17:00.",
     "historyEn": [
      "The largest Catholic church in Istanbul, Sent Antuan is dedicated to St. Anthony of Padua and is run by the Conventual Franciscan friars. The Franciscan presence in the city goes back to the early 13th century, to 1221.",
      "The first church of the same name was built in 1725 by the city’s Italian community. When that building was demolished to make way for a new tram line along the street, the community found a new site on İstiklal Avenue. The foundation stone was laid on 23 August 1906; construction was halted for a time by financial difficulties, but the church was finally consecrated and opened for worship on 15 February 1912.",
      "The Venetian neo-Gothic building was designed by the Levantine architect Giulio Mongeri together with Eduardo de Nari. The church is built on the plan of a Latin cross; its nave is about 50 meters long from the apse to the door and about 23 meters high inside, and beneath it lies a Romanesque crypt. The “St. Antoine Apartments” facing the street were designed together with the complex to provide the church with an income.",
      "Pope Pius XI made the church a minor basilica in 1932. Angelo Giuseppe Roncalli, later Pope John XXIII, preached here for years while he was the Vatican’s representative in Turkey from 1934 to 1944, which is why his statue stands in the courtyard. Pope Paul VI celebrated Mass here in 1967. Today the church is home to a community that worships in four languages, with Masses in Turkish, English, Italian and Polish."
     ]
    },
    {
     "id": "santa-maria-draperis",
     "lat": 41.0301,
     "lon": 28.97615,
     "side": "avrupa",
     "short": "Santa Maria Draperis",
     "name": "Santa Maria Draperis Kilisesi",
     "rite": "latin",
     "district": "Beyoğlu",
     "address": "İstiklal Caddesi No: 215, 34433 Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "https://www.istanbulofm.org",
     "mass": [
      [
       "Pazar",
       "09:00 İtalyanca · 10:00 Korece · 11:15 İngilizce · İspanyolca ayin akşam (Ekim–Mart 17:00, Nisan–Eylül 18:30)"
      ],
      [
       "Ayın son pazarı",
       "Tek ayin: 10:30"
      ],
      [
       "Pazartesi–Cumartesi",
       "08:00 İtalyanca"
      ]
     ],
     "massNote": "Saatler yıl içinde değişebilir; güncel programı kilisenin sitesinden kontrol edin.",
     "visits": "Gün içinde, ayin saatleri dışında genellikle ziyarete açıktır. Kilise, İstiklal Caddesi’nden merdivenle inilen avlunun dibindedir.",
     "history": [
      "Santa Maria Draperis, İstanbul’un en eski Katolik cemaatlerinden birinin kilisesidir. Hikâyesi 1453’ten kısa süre önce Fransisken rahiplerin Sirkeci’de yaptığı Servili Aziz Antuan (Sant’Antonio dei Cipressi) kilisesiyle başlar. Fetihten sonra bu kiliseyi bırakmak zorunda kalan rahipler, uzun bir yer değiştirme döneminin ardından 1584’te Galata’ya yerleşti. Levanten bir hanım olan Clara Maria Draperis onlara küçük bir şapeli olan evini bağışladı; kilise adını bu bağışçıdan alır.",
      "Şapelin sunağını, Meryem Ana’yı tasvir eden ahşap bir ikona süslüyordu. Şapel 1660 yangınında tamamen yandı, ikona ise Draperis ailesinden biri tarafından kurtarıldı. Cemaat 1678’de Pera’ya taşındı; bugünkü kilise 1767 yangınından sonra, 1769’da yeniden inşa edildi.",
      "Üç nefli, dikdörtgen planlı kilisenin beşik tonozu 1874’te süslendi. Pembe Carrara mermerinden yüksek sunak 1772 tarihlidir ve Draperis ikonası hâlâ onun üzerindedir; ikona 25 Mart 1911’de papalık tacıyla taçlandırıldı. İstiklal Caddesi’ndeki girişte, bir nişin içinde Meryem heykeli bulunan neoklasik bir cephe vardır; 1904 tarihli yenilemenin kitabesi de buradadır. Kilisenin içinde, 18. ve 19. yüzyıldan kalma, çoğu İtalyanca ve Latince mezar taşları Levanten ailelerini, piskoposları ve konsolosları anar.",
      "Kilise bugün de Küçük Kardeşler Fransiskenleri (OFM) tarafından yönetilir ve İtalyanca, İngilizce, Korece ve İspanyolca ayinlerle çok uluslu bir cemaate hizmet eder."
     ],
     "sources": [
      [
       "İstanbul OFM (Santa Maria Draperis)",
       "https://www.istanbulofm.org",
       "Istanbul OFM (Santa Maria Draperis)"
      ],
      [
       "Dijital İstanbul (İstanbul Valiliği): Santa Maria Draperis Kilisesi",
       "https://dijitalistanbul.org/santa-maria-draperis-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of Santa Maria Draperis"
      ],
      [
       "Wikipedia: Church of Saint Mary Draperis",
       "https://en.wikipedia.org/wiki/Church_of_Saint_Mary_Draperis,_Istanbul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Santa Maria Draperis",
     "shortEn": "Santa Maria Draperis",
     "massEn": [
      [
       "Sunday",
       "09:00 Italian · 10:00 Korean · 11:15 English · Spanish Mass in the evening (17:00 October–March, 18:30 April–September)"
      ],
      [
       "Last Sunday of the month",
       "One Mass only: 10:30"
      ],
      [
       "Monday–Saturday",
       "08:00 Italian"
      ]
     ],
     "massNoteEn": "Times may change during the year; check the current schedule on the church’s website.",
     "visitsEn": "Usually open to visitors during the day, outside Mass times. The church stands at the far end of a courtyard reached by steps down from İstiklal Avenue.",
     "historyEn": [
      "Santa Maria Draperis is the church of one of Istanbul’s oldest Catholic communities. Its story begins with the church of St. Anthony of the Cypresses (Sant’Antonio dei Cipressi), built by Franciscan friars in Sirkeci shortly before 1453. Forced to leave that church after the conquest, the friars settled in Galata in 1584 after a long period of moving from place to place. A Levantine lady, Clara Maria Draperis, gave them her house, which had a small chapel; the church takes its name from this benefactor.",
      "The chapel’s altar was adorned with a wooden icon of the Virgin Mary. The chapel burned down completely in the fire of 1660, but the icon was rescued by a member of the Draperis family. The community moved to Pera in 1678; the present church was rebuilt in 1769, after the fire of 1767.",
      "The barrel vault of the rectangular, three-aisled church was decorated in 1874. The high altar of pink Carrara marble dates from 1772, and the Draperis icon still stands above it; the icon was crowned with a papal crown on 25 March 1911. The entrance on İstiklal Avenue has a neoclassical façade with a statue of Mary in a niche, and the inscription of the 1904 renovation. Inside the church, gravestones from the 18th and 19th centuries, most in Italian and Latin, commemorate Levantine families, bishops and consuls.",
      "The church is still run by the Friars Minor (OFM) and serves a multinational community with Masses in Italian, English, Korean and Spanish."
     ]
    },
    {
     "id": "sen-piyer",
     "lat": 41.02484,
     "lon": 28.97294,
     "side": "avrupa",
     "short": "Sen Piyer (Galata)",
     "name": "Sen Piyer ve Pol Kilisesi",
     "rite": "latin",
     "district": "Galata, Beyoğlu",
     "address": "Kuledibi, Galata Kulesi Sokak No: 26, 34420 Beyoğlu, İstanbul",
     "phones": [],
     "email": "info@senpiyer.org",
     "website": "https://senpiyer.org",
     "mass": [
      [
       "Pazartesi–Cuma",
       "08:00 (Türkçe / İtalyanca)"
      ],
      [
       "Cumartesi",
       "19:00"
      ]
     ],
     "massNote": "",
     "visits": "Cuma ve cumartesi 14:30–17:30 arası ziyarete açıktır.",
     "history": [
      "Galata Kulesi’nin eteğindeki Sen Piyer ve Pol Kilisesi, Dominiken rahiplerinin kilisesidir. Dominikenler İstanbul’a 13. yüzyılın başında geldiler; Galata’daki ilk büyük kiliseleri San Paolo, 1475’te camiye çevrildi (bugünkü Arap Camii). Bunun ardından rahipler bugünkü yere yerleşti; burada 1604’te Cenevizliler tarafından bir kilise yapıldı.",
      "Kilise 1660 ve 1731’de iki kez yangınla yıkıldı. Bugünkü yapı, İsviçreli-İtalyan Fossati kardeşler tarafından 1841–1843 yılları arasında neoklasik üslupta yeniden inşa edildi. Dar Galata sokaklarının arasında, dışarıdan pek fark edilmeyen bir avlunun içinde yer alır.",
      "Kilisenin en değerli eseri, Hodegetria tipinde bir Meryem Ana ikonasıdır. İkona aslen Kırım’daki Kefe (Caffa) şehrinin Dominiken kilisesindeydi ve 1731 yangınından kurtuldu. Bugün manastır, Dominiken rahiplerin yürüttüğü “Dost-i” adlı bir araştırma ve diyalog merkezine de ev sahipliği yapar."
     ],
     "sources": [
      [
       "Sen Piyer (Dominikenler)",
       "https://senpiyer.org",
       "Sen Piyer (the Dominicans)"
      ],
      [
       "Wikipedia: Church of SS Peter and Paul, Istanbul",
       "https://en.wikipedia.org/wiki/Church_of_SS_Peter_and_Paul,_Istanbul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Saints Peter and Paul",
     "shortEn": "St. Peter (Galata)",
     "massEn": [
      [
       "Monday–Friday",
       "08:00 (Turkish / Italian)"
      ],
      [
       "Saturday",
       "19:00"
      ]
     ],
     "visitsEn": "Open to visitors on Fridays and Saturdays from 14:30 to 17:30.",
     "historyEn": [
      "The Church of Saints Peter and Paul, at the foot of the Galata Tower, is the church of the Dominican friars. The Dominicans came to Constantinople at the beginning of the 13th century; their first large church in Galata, San Paolo, was turned into a mosque in 1475 (today’s Arap Mosque). After that the friars settled on the present site, where the Genoese built a church in 1604.",
      "The church was destroyed by fire twice, in 1660 and 1731. The present building was rebuilt in the neoclassical style between 1841 and 1843 by the Swiss-Italian Fossati brothers. It stands inside a courtyard among the narrow streets of Galata, barely visible from the street.",
      "The church’s most precious treasure is an icon of the Virgin of the Hodegetria type. The icon originally belonged to the Dominican church of Caffa (Kefe) in Crimea and survived the fire of 1731. Today the priory also houses a research and dialogue center called “Dost-i”, run by the Dominican friars."
     ]
    },
    {
     "id": "sent-esprit",
     "lat": 41.0447,
     "lon": 28.98573,
     "side": "avrupa",
     "short": "Sent Esprit Katedrali",
     "name": "Kutsal Ruh Katedrali (Sent Esprit)",
     "rite": "latin",
     "district": "Harbiye, Şişli",
     "address": "Cumhuriyet Caddesi No: 127/A, 34373 Harbiye, Şişli, İstanbul",
     "phones": [
      "0212 248 09 10"
     ],
     "email": "",
     "website": "https://www.facebook.com/kutsalruhkatedrali/",
     "mass": [
      [
       "Pazar",
       "08:00 Aramice/Arapça · 10:00 İngilizce · 11:15 Fransızca"
      ],
      [
       "Cumartesi",
       "18:00 Türkçe (pazar arifesi)"
      ],
      [
       "Hafta içi",
       "18:00 Fransızca"
      ]
     ],
     "massNote": "Kaynaklar arasında küçük farklar var (Fransızca pazar ayini 11:15 ya da 11:30 olarak geçiyor); gitmeden önce teyit edin.",
     "visits": "Ayin saatlerinde ve gün içinde genellikle açıktır.",
     "history": [
      "Kutsal Ruh Katedrali, İstanbul Latin Katolik Havarisel Vekilliği’nin katedralidir; episkoposun makamı buradadır. Taksim ile Nişantaşı arasında, Notre Dame de Sion Lisesi’nin bitişiğinde yer alır ve Sent Antuan’dan sonra şehrin en büyük ikinci Katolik kilisesidir.",
      "Barok üsluptaki bazilika, Havarisel Vekil Fransız başepiskopos Julien Hillereau’nun girişimiyle, mimar Gaspare Fossati tarafından 1846’da yapıldı. 1865 depreminde zarar gördü ve Pietro Vitalis tarafından yenilendi; 1876’da katedral oldu, 18 Mart 1909’da da küçük bazilika ilan edildi. Ana sunaktaki “Kutsal Ruh’un İnişi” tablosunu 1867’de Papa IX. Pius hediye etti.",
      "Katedralin altındaki kriptada Başepiskopos Hillereau ile Osmanlı sarayının müzik şefi Giuseppe Donizetti (Donizetti Paşa) gömülüdür. Avludaki Papa XV. Benedictus heykeli 1921’de dikildi; Birinci Dünya Savaşı sırasında milliyet ve din ayırmadan yaralılara yardım eden papayı anar. Katedral 1989’dan beri Salezyen rahiplerine emanettir.",
      "Papa VI. Pavlus, II. Jean Paul, XVI. Benedictus, Fransuva ve 28 Kasım 2025’te XIV. Leo, Türkiye ziyaretlerinde bu katedrale geldiler. Kilisenin yanındaki sokak, Papa XXIII. Yuhanna’nın anısına “Papa Roncalli Sokağı” adını taşır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Saint Esprit Katedrali",
       "https://dijitalistanbul.org/saint-esprit-katedrali",
       "Dijital İstanbul (Governorship of Istanbul): Cathedral of the Holy Spirit (Sent Esprit)"
      ],
      [
       "Wikipedia: Cathedral of the Holy Spirit, Istanbul",
       "https://en.wikipedia.org/wiki/Cathedral_of_the_Holy_Spirit,_Istanbul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Cathedral of the Holy Spirit (Sent Esprit)",
     "shortEn": "Holy Spirit Cathedral",
     "massEn": [
      [
       "Sunday",
       "08:00 Aramaic/Arabic · 10:00 English · 11:15 French"
      ],
      [
       "Saturday",
       "18:00 Turkish (Sunday vigil)"
      ],
      [
       "Weekdays",
       "18:00 French"
      ]
     ],
     "massNoteEn": "The sources differ slightly (the French Sunday Mass is given as 11:15 or 11:30); check before you go.",
     "visitsEn": "Usually open during Mass times and during the day.",
     "historyEn": [
      "The Cathedral of the Holy Spirit is the cathedral of the Latin Catholic Apostolic Vicariate of Istanbul; the bishop’s seat is here. It stands between Taksim and Nişantaşı, next to the Notre Dame de Sion school, and is the city’s second largest Catholic church after Sent Antuan.",
      "The Baroque basilica was built in 1846 by the architect Gaspare Fossati, on the initiative of the Apostolic Vicar, the French archbishop Julien Hillereau. Damaged in the earthquake of 1865, it was restored by Pietro Vitalis; it became a cathedral in 1876 and was made a minor basilica on 18 March 1909. The painting of “The Descent of the Holy Spirit” on the high altar was a gift of Pope Pius IX in 1867.",
      "In the crypt beneath the cathedral lie Archbishop Hillereau and Giuseppe Donizetti (Donizetti Pasha), master of music at the Ottoman court. The statue of Pope Benedict XV in the courtyard was erected in 1921; it honors the pope who helped the wounded of the First World War without regard to nationality or religion. Since 1989 the cathedral has been in the care of the Salesian priests.",
      "Popes Paul VI, John Paul II, Benedict XVI, Francis and, on 28 November 2025, Leo XIV came to this cathedral during their visits to Turkey. The street beside the church is named “Papa Roncalli Street” in memory of Pope John XXIII."
     ]
    },
    {
     "id": "sankt-georg",
     "lat": 41.02439,
     "lon": 28.97344,
     "side": "avrupa",
     "short": "St. Georg (Karaköy)",
     "name": "Sankt Georg Kilisesi",
     "rite": "latin",
     "district": "Karaköy, Beyoğlu",
     "address": "Kart Çınar Sokak No: 2, Bankalar Caddesi, 34420 Karaköy, İstanbul",
     "phones": [
      "0212 313 49 70",
      "0212 249 76 17"
     ],
     "email": "gemeinde@sg.org.tr",
     "website": "https://www.sg.org.tr",
     "mass": [
      [
       "Pazar",
       "10:00 Almanca"
      ],
      [
       "Salı ve perşembe",
       "18:30"
      ]
     ],
     "massNote": "Almanca konuşan Avusturya cemaatinin kilisesidir. Bazı pazarlar ayin olmaz (ortak ekümenik ayinler gibi); cemaatin takvimine bakın.",
     "visits": "Ziyaret için St. Georg Avusturya Lisesi’nin girişinden, önceden haber vererek gelinmesi önerilir.",
     "history": [
      "Sankt Georg’un adı ilk kez 1303’te geçer; kilisenin bir ayazmanın üzerine kurulduğu bilinir. İstanbul’un fethine kadar Galata’yı elinde tutan Cenevizlilerin merkez kilisesiydi. Bir inanışa göre İstanbul’un koruyucu azizelerinden Aziz İrini’nin başı bu ayazmaya atılmıştır.",
      "Kilise 1628’de içinde küçük bir okul açılmasıyla bir yerleşkeye dönüştü; 1660 yangınında tamamen yandı. 1677’de Fransa elçisi Marki de Nointel, Sultan IV. Mehmed’den izin alarak kiliseyi yeniden yaptırdı. 1696 ve 1731 yangınlarından sonra, 1732’de kısmen Fransa Kralı XV. Louis’nin bağışlarıyla onarıldı.",
      "Bir süre Avusturya-Macaristan denizcileri için hastane olarak da kullanılan yapı, 1882’de okuluyla birlikte Avusturyalı Lazaristler tarafından satın alındı. Bugünkü St. Georg Avusturya Lisesi’nin kökleri bu okula dayanır. Kilise 20. yüzyılın başında yenilendi, iç mekânı 1963’te sadeleştirildi; nefin ortasındaki kubbede Kutsal Ruh’u simgeleyen bir güvercin vardır.",
      "Kilise bugün Almanca konuşan Katolik cemaatin kilisesidir ve Lazaristler ile Hayırsever Rahibeler’in (Barmherzige Schwestern) mirasını taşır. Rahibeler 150 yılı aşkın hizmetin ardından Eylül 2025’te İstanbul’dan ayrıldı."
     ],
     "sources": [
      [
       "St. Georgs-Gemeinde Istanbul",
       "https://www.sg.org.tr"
      ],
      [
       "Dijital İstanbul (İstanbul Valiliği): Sankt Georg Katolik Kilisesi",
       "https://dijitalistanbul.org/sankt-georg-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of St. George (Sankt Georg)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. George (Sankt Georg)",
     "shortEn": "St. George (Karaköy)",
     "massEn": [
      [
       "Sunday",
       "10:00 German"
      ],
      [
       "Tuesday and Thursday",
       "18:30"
      ]
     ],
     "massNoteEn": "This is the church of the German-speaking Austrian community. On some Sundays there is no Mass here (for example when there is a joint ecumenical service); check the community’s calendar.",
     "visitsEn": "Visitors are advised to arrange their visit in advance and come in through the entrance of the St. Georg Austrian High School.",
     "historyEn": [
      "Sankt Georg is first mentioned in 1303; the church is known to have been built over a holy spring (ayazma). It was the principal church of the Genoese, who held Galata until the conquest of Constantinople. According to one tradition, the head of St. Irene, one of the city’s patron saints, was thrown into this spring.",
      "In 1628 the church grew into a complex, with a small school inside it; it burned down completely in the fire of 1660. In 1677 the French ambassador, the Marquis de Nointel, obtained permission from Sultan Mehmed IV and had the church rebuilt. After the fires of 1696 and 1731 it was repaired in 1732, partly with donations from King Louis XV of France.",
      "The building, which for a time also served as a hospital for Austro-Hungarian sailors, was bought together with its school by the Austrian Lazarists in 1882. Today’s St. Georg Austrian High School has its roots in that school. The church was renovated at the beginning of the 20th century and its interior simplified in 1963; in the dome over the middle of the nave is a dove, symbol of the Holy Spirit.",
      "Today the church belongs to the German-speaking Catholic community and carries the legacy of the Lazarists and the Sisters of Mercy (Barmherzige Schwestern). The sisters left Istanbul in September 2025 after more than 150 years of service."
     ]
    },
    {
     "id": "saint-benoit",
     "lat": 41.02508,
     "lon": 28.97677,
     "side": "avrupa",
     "short": "Saint Benoît (Karaköy)",
     "name": "Saint Benoît Kilisesi",
     "rite": "latin",
     "district": "Karaköy, Beyoğlu",
     "address": "Kemeraltı Caddesi, Saint Benoît Lisesi yerleşkesi, 34425 Karaköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "http://www.st-louis-des-francais-istanbul.org",
     "status": "active",
     "notice": "Saint-Louis des Français Kilisesi 1 Eylül 2025’te kapanınca Fransızca konuşan cemaat buraya taşındı. Fransızca ayin hafta içi her gün 18:00, cumartesi 09:00 ve pazar 11:00’de; ayinleri Lazarist rahip Peder Cristinel Andrei yönetiyor.",
     "mass": [
      [
       "Pazartesi–Cuma",
       "18:00 Fransızca"
      ],
      [
       "Cumartesi",
       "09:00 Fransızca"
      ],
      [
       "Pazar",
       "11:00 Fransızca"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır; kilise Saint Benoît Lisesi’nin yerleşkesinde olduğu için başka saatlerde ziyaret önceden izin gerektirir.",
     "history": [
      "Saint Benoît, İstanbul’da hâlâ kullanılan en eski Katolik kiliselerinden biridir. Kökleri, 13. yüzyılın başındaki bir manastıra ve Cenevizlilerin 1362’de yaptırdığı çan kulesiyle birlikte Pera’daki Santa Maria della Cisterna manastırına dayanır. Bugün ayakta duran çan kulesi, bu 14. yüzyıl yapısıdır.",
      "Yapı grubu 1427 ile 1450 arasında Fransız Benedikten rahiplerinin eline geçti ve Aziz Benedikt’e (Saint Benoît) adandı. Fetih sırasında kilisenin rölikleri ve dinî eşyaları önce Sakız Adası’na, sonra Ceneviz’e götürüldü. 17. ve 18. yüzyıllarda kilise Cizvitlerin elindeydi; 1783’te Fransız Lazarist rahiplerine devredildi.",
      "Kilise 1686, 1696 ve 1731 yangınlarında zarar gördü ve girişindeki kitabede yazdığı gibi 1732’de bugünkü hâliyle yeniden yapıldı. Fransa elçisi Pierre de Girardin’in girişimiyle, o güne kadar yalnızca camilere tanınan bir ayrıcalıkla kubbeli olarak inşa edilmesine izin verildi; rivayete göre dönemin şeyhülislamı bugün hâlâ ayakta olan sütunları hediye etti.",
      "Lazaristlerin 1783’te burada kurduğu okul, bugünkü Saint Benoît Fransız Lisesi’dir. Yerleşke 2000’li yıllarda kapsamlı bir restorasyondan geçti."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Saint Benoit Kilisesi",
       "https://dijitalistanbul.org/saint-benoit-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of Saint Benoît"
      ],
      [
       "Vikipedi: Saint Benoît Latin Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/Saint_Beno%C3%AEt_Latin_Katolik_Kilisesi",
       "Wikipedia (Turkish): Church of Saint Benoît"
      ],
      [
       "Paroisse Saint-Louis-des-Français Istanbul",
       "http://www.st-louis-des-francais-istanbul.org/"
      ]
     ],
     "nameEn": "Church of Saint Benoît",
     "shortEn": "Saint Benoît (Karaköy)",
     "massEn": [
      [
       "Monday–Friday",
       "18:00 French"
      ],
      [
       "Saturday",
       "09:00 French"
      ],
      [
       "Sunday",
       "11:00 French"
      ]
     ],
     "visitsEn": "Open at Mass times; because the church is on the grounds of the Saint Benoît High School, a visit at other times needs permission in advance.",
     "noticeEn": "When the Church of Saint-Louis des Français closed on 1 September 2025, the French-speaking parish moved here. Mass in French is on weekdays at 18:00, Saturday at 09:00 and Sunday at 11:00, celebrated by Fr. Cristinel Andrei, a Lazarist priest.",
     "historyEn": [
      "Saint Benoît is one of the oldest Catholic churches in Istanbul still in use. Its roots go back to an early 13th-century monastery and to the monastery of Santa Maria della Cisterna in Pera, whose bell tower the Genoese built in 1362. That 14th-century bell tower still stands today.",
      "Between 1427 and 1450 the complex passed to French Benedictine monks and was dedicated to St. Benedict (Saint Benoît). At the time of the conquest, the church’s relics and liturgical objects were taken first to Chios and then to Genoa. In the 17th and 18th centuries the church belonged to the Jesuits; in 1783 it was handed over to the French Lazarist priests.",
      "The church was damaged in the fires of 1686, 1696 and 1731 and, as the inscription at its entrance records, was rebuilt in its present form in 1732. Through the efforts of the French ambassador Pierre de Girardin, it was allowed to be built with a dome, a privilege until then granted only to mosques; according to tradition, the şeyhülislam of the day gave the columns that still stand today.",
      "The school the Lazarists founded here in 1783 is today’s Saint Benoît French High School. The complex underwent an extensive restoration in the 2000s."
     ]
    },
    {
     "id": "aziz-louis",
     "lat": 41.0352,
     "lon": 28.9823,
     "approx": true,
     "side": "avrupa",
     "short": "Saint-Louis (Fransız)",
     "name": "Saint-Louis des Français Kilisesi",
     "rite": "latin",
     "district": "Beyoğlu",
     "address": "Nuri Ziya Sokak No: 10, Fransız Sarayı (Palais de France) bahçesi, 34433 Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "http://www.st-louis-des-francais-istanbul.org",
     "status": "closed",
     "notice": "Kilise, deprem riski değerlendirmelerinin ardından 1 Eylül 2025’ten bu yana kapalıdır; ayinler bir sonraki duyuruya kadar askıya alınmıştır. Fransızca konuşan cemaat artık Karaköy’deki <a href=\"kilise/saint-benoit.html\">Saint Benoît Kilisesi</a>’nde toplanıyor: hafta içi 18:00, cumartesi 09:00 ve pazar 11:00’de Fransızca ayin var.",
     "mass": [
      [
       "Şu anda",
       "Ayin yapılmıyor (1 Eylül 2025’ten beri kapalı)."
      ]
     ],
     "massNote": "",
     "visits": "Kapalı.",
     "history": [
      "Saint-Louis des Français, Beyoğlu’ndaki Fransız Sarayı’nın (eski Fransa Büyükelçiliği, bugün başkonsolosluk) bahçesinde bulunan kilisedir. Fransa’nın Osmanlı İmparatorluğu’ndaki elçiliğinin kilisesi olarak, İstanbul’daki Katolik varlığın en eski kurumlarından biriyle bağlantılıdır ve uzun yıllar Fransızca konuşan cemaatin buluşma yeri oldu.",
      "Kilisenin cemaati 1 Eylül 2025’te, deprem riskine ilişkin yeni değerlendirmelerin ardından ayinlerin askıya alındığını ve kilisenin kapatıldığını duyurdu. Yeniden açılış için bir tarih açıklanmadı."
     ],
     "sources": [
      [
       "Paroisse Saint-Louis-des-Français Istanbul",
       "http://www.st-louis-des-francais-istanbul.org/"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "nameEn": "Church of Saint-Louis des Français",
     "shortEn": "Saint-Louis (French)",
     "massEn": [
      [
       "Currently",
       "No Mass (closed since 1 September 2025)."
      ]
     ],
     "visitsEn": "Closed.",
     "noticeEn": "The church has been closed since 1 September 2025 following earthquake risk assessments; Masses are suspended until further notice. The French-speaking parish now meets at the <a href=\"kilise/saint-benoit.html\">Church of Saint Benoît</a> in Karaköy, with Mass in French on weekdays at 18:00, Saturday at 09:00 and Sunday at 11:00.",
     "historyEn": [
      "Saint-Louis des Français is the church in the garden of the Palais de France in Beyoğlu (the former French Embassy, today the consulate general). As the church of France’s embassy in the Ottoman Empire, it is linked to one of the oldest institutions of the Catholic presence in Istanbul, and for many years it was the meeting place of the French-speaking community.",
      "On 1 September 2025 the parish announced that, following new assessments of earthquake risk, Masses had been suspended and the church closed. No date has been given for its reopening."
     ]
    },
    {
     "id": "bomonti-lourdes",
     "lat": 41.05866,
     "lon": 28.98301,
     "side": "avrupa",
     "short": "Notre-Dame de Lourdes (Bomonti)",
     "name": "Notre-Dame de Lourdes Gürcü Katolik Kilisesi",
     "rite": "latin",
     "district": "Bomonti, Şişli",
     "address": "Kazım Orbay Caddesi No: 29, 34373 Şişli, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:15 Türkçe"
      ],
      [
       "Pazartesi–Cumartesi",
       "08:00"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır; başka zamanlar için kapıdan sormanız gerekir.",
     "history": [
      "Bomonti’deki Notre-Dame de Lourdes, dünyada sayısı çok az olan Gürcü Katolik kiliselerinden biridir; eski kaynaklarda “Feriköy Gürcü Katolik Kilisesi” olarak geçer. 1828–1829 Osmanlı-Rus Savaşı’ndan sonra Rusların Meshet-Cavaheti bölgesinden göçe zorladığı binlerce Katolik Gürcü İstanbul’a geldi. Göç edenlerden rahip Petre Harisçiraşvili, 1861’de bu kiliseyi ve manastırı kurdu.",
      "Manastır kısa sürede Gürcülerin kültür merkezi oldu. 1870’te kurulan matbaasında Gürcüce ve Fransızca yaklaşık 200 kitap basıldı; kız ve erkek çocuklar için okullar açıldı, 1908’de şair Akaki Tsereteli adına bir kütüphane kuruldu. Osmanlı ülkesindeki Müslüman Gürcüler için ilk okuma kitapları da burada basıldı. 1921’de Kızıl Ordu Gürcistan’ı işgal edince Noe Jordania başkanlığındaki Gürcü hükümeti ve pek çok mülteci önce buraya sığındı.",
      "Kilise 1901’de onarıldı. İçinde kurucunun Latince-Gürcüce mezar taşı, Aziz Nino tasviri ve ana sunakta Lehçe yazılı bir Meryem ikonası bulunur; bahçede Casciali Azize Rita’ya adanmış küçük bir mabet vardır. 1955’ten sonra Gürcü Katoliklerin sayısı çok azaldığından, cemaatin büyük kısmını bugün Türk ve Ermeni Katolikler oluşturur."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Notre Dame de Lourdes Gürcü Katolik Kilisesi",
       "https://dijitalistanbul.org/notre-dame-de-lourdes-gurcu-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Notre-Dame de Lourdes Georgian Catholic Church"
      ],
      [
       "Vikipedi: Bomonti Gürcü Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/Bomonti_G%C3%BCrc%C3%BC_Katolik_Kilisesi",
       "Wikipedia (Turkish): Notre-Dame de Lourdes Georgian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Notre-Dame de Lourdes Georgian Catholic Church",
     "shortEn": "Notre-Dame de Lourdes (Bomonti)",
     "massEn": [
      [
       "Sunday",
       "11:15 Turkish"
      ],
      [
       "Monday–Saturday",
       "08:00"
      ]
     ],
     "visitsEn": "Open during Mass times; at other times you need to ask at the door.",
     "historyEn": [
      "Notre-Dame de Lourdes in Bomonti is one of the very few Georgian Catholic churches in the world; older sources call it the “Feriköy Georgian Catholic Church”. After the Russo-Ottoman War of 1828–1829, thousands of Catholic Georgians forced by the Russians to leave the Meskheti-Javakheti region came to Istanbul. One of the emigrants, the priest Petre Kharischirashvili, founded this church and monastery in 1861.",
      "The monastery soon became a cultural center for the Georgians. Some 200 books in Georgian and French were printed at its press, founded in 1870; schools were opened for girls and boys, and in 1908 a library named after the poet Akaki Tsereteli was founded. The first readers for Muslim Georgians in the Ottoman lands were also printed here. When the Red Army invaded Georgia in 1921, the Georgian government under Noe Jordania and many refugees first took shelter here.",
      "The church was repaired in 1901. Inside are the founder’s Latin-Georgian gravestone, an image of St. Nino and, on the high altar, an icon of Mary with a Polish inscription; in the garden is a small shrine dedicated to St. Rita of Cascia. Since the number of Georgian Catholics fell sharply after 1955, most of the congregation today are Turkish and Armenian Catholics."
     ]
    },
    {
     "id": "aziz-pavlus-nisantasi",
     "lat": 41.05339,
     "lon": 28.99738,
     "side": "avrupa",
     "short": "St. Paul (Nişantaşı)",
     "name": "Aziz Pavlus Kilisesi (St. Paul)",
     "rite": "latin",
     "district": "Nişantaşı, Şişli",
     "address": "Büyük Çiftlik Sokak No: 20-22, 34365 Nişantaşı, İstanbul",
     "phones": [],
     "email": "",
     "website": "https://www.stpaul.de",
     "mass": [
      [
       "Ayın 1. ve 3. pazarı",
       "10:30 Almanca"
      ]
     ],
     "massNote": "Almanca konuşan Katolik cemaatin buluşma yeridir.",
     "visits": "Yalnızca ayin saatlerinde açıktır.",
     "history": [
      "Nişantaşı’ndaki St. Paul, İstanbul’da yaşayan Almanca konuşan Katoliklerin cemaat merkezidir. Burada ayda iki kez Almanca ayin yapılır; cemaatin toplantıları ve etkinlikleri de bu binada düzenlenir.",
      "Kilise, Almanca konuşan Avusturya cemaatinin Karaköy’deki St. Georg Kilisesi ile birlikte çalışır; iki cemaat bayramları ve ekümenik ayinleri çoğu zaman birlikte kutlar."
     ],
     "sources": [
      [
       "St. Paul Istanbul",
       "https://www.stpaul.de"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Paul",
     "shortEn": "St. Paul (Nişantaşı)",
     "massEn": [
      [
       "1st and 3rd Sunday of the month",
       "10:30 German"
      ]
     ],
     "massNoteEn": "The meeting place of the German-speaking Catholic community.",
     "visitsEn": "Open only during Mass times.",
     "historyEn": [
      "St. Paul in Nişantaşı is the parish center of the German-speaking Catholics living in Istanbul. Mass is celebrated here in German twice a month, and the community’s meetings and events are also held in this building.",
      "The church works together with the German-speaking Austrian community’s St. Georg Church in Karaköy; the two communities often celebrate feasts and ecumenical services together."
     ]
    },
    {
     "id": "kutsal-kalp-bebek",
     "lat": 41.07676,
     "lon": 29.0413,
     "side": "avrupa",
     "short": "Kutsal Kalp (Bebek)",
     "name": "Kutsal Kalp Kilisesi (Bebek)",
     "rite": "latin",
     "district": "Bebek, Beşiktaş",
     "address": "Yoğurtçu Zülfü Sokak No: 15/2, 34342 Bebek, Beşiktaş, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Cumartesi",
       "18:00 Türkçe (pazar arifesi)"
      ],
      [
       "Pazar",
       "11:00"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Boğaz kıyısındaki Bebek’te bulunan Kutsal Kalp Kilisesi, bölgede yaşayan Katolik aileler ile semtteki okullarda ve üniversitede bulunan yabancı öğrenci ve öğretim görevlilerine hizmet eden küçük bir cemaat kilisesidir.",
      "Kilise, İsa’nın Kutsal Kalbi’ne adanmıştır. Pazar ayinleri, farklı ülkelerden gelen cemaat nedeniyle çoğu zaman birden çok dilde okunur."
     ],
     "sources": [
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of the Sacred Heart (Bebek)",
     "shortEn": "Sacred Heart (Bebek)",
     "massEn": [
      [
       "Saturday",
       "18:00 Turkish (Sunday vigil)"
      ],
      [
       "Sunday",
       "11:00"
      ]
     ],
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Church of the Sacred Heart in Bebek, on the shore of the Bosphorus, is a small parish church serving the Catholic families of the area and the foreign students and teachers at the neighborhood’s schools and university.",
      "The church is dedicated to the Sacred Heart of Jesus. Because the congregation comes from many countries, Sunday Masses are often said in more than one language."
     ]
    },
    {
     "id": "rosario-bakirkoy",
     "lat": 40.97708,
     "lon": 28.8797,
     "side": "avrupa",
     "short": "Rosario (Bakırköy)",
     "name": "Meryem Ana Rosario Kilisesi",
     "rite": "latin",
     "district": "Bakırköy",
     "address": "Rüya Sokak No: 22, 34142 Bakırköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 Türkçe"
      ],
      [
       "Pazartesi, çarşamba, perşembe, cuma",
       "18:30"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Bakırköy’deki Meryem Ana Rosario Kilisesi, 19. yüzyılın ikinci yarısında (1849–1885) bölgedeki Latin Katolik cemaati için inşa edildi. Alınlığın ortasındaki Dominiken tarikatı simgesi, kilisenin Dominiken rahiplerle olan bağını gösterir.",
      "Yeni-barok cepheli yapı Latin haçı planlıdır; kolların kesiştiği yerde iç yüksekliği 20,48 metreyi bulan, kasnağında on kemerli pencere bulunan bir kubbe yükselir. İç mekânda kalem işi bezemeler ve pandantiflerde aziz tasvirleri vardır. Ana sunakta, Consoli Pinse imzalı 1886 tarihli “Tespihli Meryem Ana” tablosu bulunur.",
      "Kilise zaman içinde farklı cemaatlerin de kullanımına açıldı; Latin cemaatin ayinleri bugün de devam etmektedir."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Meryem Ana Rosario Kilisesi",
       "https://dijitalistanbul.org/meryem-ana-rosario-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of Our Lady of the Rosary"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Our Lady of the Rosary",
     "shortEn": "Rosario (Bakırköy)",
     "massEn": [
      [
       "Sunday",
       "11:00 Turkish"
      ],
      [
       "Monday, Wednesday, Thursday, Friday",
       "18:30"
      ]
     ],
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Church of Our Lady of the Rosary in Bakırköy was built in the second half of the 19th century (1849–1885) for the area’s Latin Catholic community. The emblem of the Dominican order in the middle of the pediment shows the church’s link with the Dominican friars.",
      "The building, with its neo-Baroque façade, is built on the plan of a Latin cross; over the crossing rises a dome 20.48 meters high inside, with ten arched windows in its drum. The interior has painted decoration and images of saints in the pendentives. On the high altar is a painting of “Our Lady of the Rosary” signed by Consoli Pinse and dated 1886.",
      "Over time the church was also opened to other congregations; the Masses of the Latin community continue to this day."
     ]
    },
    {
     "id": "aziz-stefanos-yesilkoy",
     "lat": 40.95756,
     "lon": 28.82188,
     "side": "avrupa",
     "short": "Aziz Stefanos (Yeşilköy)",
     "name": "Aziz Stefanos Kilisesi (St. Etienne)",
     "rite": "latin",
     "district": "Yeşilköy, Bakırköy",
     "address": "Yeşilköy Mah., Cümbüş Sokak No: 8, 34149 Bakırköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "10:30"
      ],
      [
       "Pazartesi–Cumartesi",
       "18:00 (cumartesi akşamı pazar arifesi ayini)"
      ]
     ],
     "massNote": "CET’in 2023 listesinde pazar ayini 09:30 olarak geçiyordu; güncel kaynaklar 10:30 veriyor.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Yeşilköy’ün 1926’ya kadarki adı San Stefano (Ayastefanos), Hristiyanlığın ilk şehidi Aziz Stefanos’a adanmış eski bir kiliseden gelir. Geleneğe göre azizin kemikleri 4. yüzyılda Filistin’den İstanbul’a getirilmiş, İtalya’ya gönderilirken gemi fırtınaya yakalanıp bugünkü Yeşilköy açıklarında karaya çıkmak zorunda kalmıştır; çadırın kurulduğu yere de Aziz Stefanos’a adanmış bir kilise yapılmıştır.",
      "Bugünkü Latin Katolik kilisesi 1865’te inşa edildi ve 1886’da resmen açıldı. 1894 depreminde taş kubbesi çöktü; yerine Avusturya’dan getirilen malzemeyle ahşap bir tavan yapıldı. Kilisenin önündeki üç heykel Fransa’dan getirilmiştir. Son tadilat ve boya çalışması 2024’te tamamlandı.",
      "Kilise Fransisken Kapuçin rahipleri tarafından yönetilir ve ayinler Türkçe ile İtalyanca yapılır. Semtte aynı azize adanmış bir Rum Ortodoks ve bir Ermeni kilisesi de bulunur."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Aziz Stefanos Latin Katolik Kilisesi",
       "https://dijitalistanbul.org/aziz-stefanos-latin-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of St. Stephen (St. Etienne)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Stephen (St. Etienne)",
     "shortEn": "St. Stephen (Yeşilköy)",
     "massEn": [
      [
       "Sunday",
       "10:30"
      ],
      [
       "Monday–Saturday",
       "18:00 (on Saturday evening, the Sunday vigil Mass)"
      ]
     ],
     "massNoteEn": "The CET’s 2023 list gave the Sunday Mass as 09:30; current sources give 10:30.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "Until 1926 Yeşilköy was called San Stefano (Ayastefanos), after an old church dedicated to St. Stephen, the first martyr of Christianity. According to tradition, the saint’s bones were brought from Palestine to Constantinople in the 4th century; as they were being sent on to Italy, the ship was caught in a storm and had to put ashore off present-day Yeşilköy, and a church dedicated to St. Stephen was built on the spot where a tent had been pitched for the relics.",
      "The present Latin Catholic church was built in 1865 and officially opened in 1886. Its stone dome collapsed in the earthquake of 1894 and was replaced by a wooden ceiling made with materials brought from Austria. The three statues in front of the church were brought from France. The latest renovation and repainting was completed in 2024.",
      "The church is run by the Capuchin Franciscan friars, and Mass is said in Turkish and Italian. The neighborhood also has a Greek Orthodox and an Armenian church dedicated to the same saint."
     ]
    },
    {
     "id": "buyukdere-meryem-ana",
     "lat": 41.16035,
     "lon": 29.04172,
     "side": "avrupa",
     "short": "Santa Maria (Büyükdere)",
     "name": "Meryem Ana’nın Doğuşu Kilisesi (Santa Maria)",
     "rite": "latin",
     "district": "Büyükdere, Sarıyer",
     "address": "Azatlı Sokak No: 1, 34453 Büyükdere, Sarıyer, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 (Türkçe / İngilizce)"
      ],
      [
       "Pazartesi–Cumartesi",
       "19:00 (Türkçe / İngilizce)"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır. 2024’teki saldırıdan beri girişte güvenlik kontrolü yapılabilir.",
     "history": [
      "Büyükdere’deki ilk Katolik kilisesi 1815’te ahşaptan yapıldı. Fransisken Konventüel rahipleri 1866’da onun yerine, Meryem Ana’nın Doğuşu’na adanmış bugünkü kâgir kiliseyi inşa etti. Barok ve yeni-gotik öğeleri birleştiren cephede bir gül pencere ve kapılarda iki melek figürü vardır.",
      "Birinci Dünya Savaşı sırasında (1915–1918) kilise kapalı kaldı ve Müslüman çocuklar için aşevi olarak kullanıldı; savaştan sonra yeniden ibadete açıldı. 1960’lara kadar ruhban okulu olarak da hizmet verdi. 1985’te Focolari hareketine devredilen yapı, 1999’da yeniden Fransisken Konventüellere döndü.",
      "İçerideki üç büyük tabloyu Giuseppe Carta, dördüncüsünü Fransisken rahip Pasquale Sarullo yaptı. 1914’te kurulan org, aslen Notre Dame de Sion Lisesi’nin şapeli için getirilmişti ve bugün hâlâ çalışır.",
      "28 Ocak 2024’te pazar ayini sırasında kiliseye silahlı bir saldırı düzenlendi ve cemaatten Tuncer Cihan hayatını kaybetti. Cemaat, saldırıdan sonra da ayinlerini sürdürmektedir."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Meryem Ana Doğuş Katolik Kilisesi",
       "https://dijitalistanbul.org/meryem-ana-dogus-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of the Nativity of Mary (Santa Maria)"
      ],
      [
       "Wikipedia: Church of Saint Mary of Büyükdere",
       "https://en.wikipedia.org/wiki/Church_of_Saint_Mary_of_B%C3%BCy%C3%BCkdere,_Istanbul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of the Nativity of Mary (Santa Maria)",
     "shortEn": "Santa Maria (Büyükdere)",
     "massEn": [
      [
       "Sunday",
       "11:00 (Turkish / English)"
      ],
      [
       "Monday–Saturday",
       "19:00 (Turkish / English)"
      ]
     ],
     "visitsEn": "Open during Mass times. Since the attack in 2024 there may be a security check at the entrance.",
     "historyEn": [
      "The first Catholic church in Büyükdere was built of wood in 1815. In 1866 the Conventual Franciscan friars replaced it with the present masonry church, dedicated to the Nativity of Mary. The façade, which combines Baroque and neo-Gothic elements, has a rose window and two angel figures over the doors.",
      "During the First World War (1915–1918) the church was closed and used as a soup kitchen for Muslim children; after the war it was reopened for worship. Until the 1960s it also served as a seminary. Handed over to the Focolare movement in 1985, the building returned to the Conventual Franciscans in 1999.",
      "Three of the large paintings inside are by Giuseppe Carta and the fourth by the Franciscan friar Pasquale Sarullo. The organ, installed in 1914, was originally brought for the chapel of the Notre Dame de Sion school and still works today.",
      "On 28 January 2024 the church was attacked by gunmen during Sunday Mass, and a member of the congregation, Tuncer Cihan, was killed. The community has continued to celebrate Mass since the attack."
     ]
    },
    {
     "id": "surp-asdvadzadzin",
     "lat": 41.03556,
     "lon": 28.9797,
     "side": "avrupa",
     "short": "Surp Asdvadzadzin Katedrali",
     "name": "Surp Asdvadzadzin Ermeni Katolik Katedrali",
     "rite": "ermeni",
     "district": "Sakızağacı, Beyoğlu",
     "address": "Atıf Yılmaz Caddesi No: 17, 34435 Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Her gün",
       "10:30"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Sakızağacı’ndaki Surp Asdvadzadzin (Meryem Ana) Katedrali, Türkiye Ermeni Katolik Patrikliği’nin ve İstanbul’daki Ermeni Katolik topluluğunun ruhani merkezidir. Kilise, patriklik sarayı, rahip konutu, kütüphane ve matbaadan oluşan bir yerleşkenin tam ortasında yer alır.",
      "İnşası için 15 Haziran 1864’te padişah fermanı alındı. Bedros Bey Mısırlıyan’ın yaptırdığı ve mimar Andon Tülbentçiyan’ın tasarladığı kilisenin temeli Ocak 1865’te atıldı; yaklaşık 18 ayda tamamlanan yapı 6 Kasım 1866’da kutsandı.",
      "1870’teki büyük Beyoğlu yangınında patriklik binası ve müştemilatı ağır hasar gördü; 1880–1881’de kapsamlı bir onarım yapıldı. Neoklasik yapının içinde Aydınlatıcı Aziz Krikor’a (Surp Krikor Lusavoriç) ait bir rölik kutusu korunur. 26 Temmuz 1967’de Papa VI. Pavlus’un katıldığı büyük bir ayin burada kutlandı."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Asdvadzadzin Ermeni Katolik Katedrali",
       "https://dijitalistanbul.org/surp-asdvadzadzin-ermeni-katolik-katedrali",
       "Dijital İstanbul (Governorship of Istanbul): Surp Asdvadzadzin Armenian Catholic Cathedral"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Asdvadzadzin Armenian Catholic Cathedral",
     "shortEn": "Surp Asdvadzadzin Cathedral",
     "massEn": [
      [
       "Every day",
       "10:30"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Surp Asdvadzadzin (Holy Mother of God) Cathedral in Sakızağacı is the spiritual center of the Armenian Catholic Patriarchate in Turkey and of the Armenian Catholic community of Istanbul. The church stands at the very heart of a compound made up of the patriarchal residence, the priests’ house, a library and a printing house.",
      "An imperial firman for its construction was obtained on 15 June 1864. Built at the expense of Bedros Bey Mısırlıyan and designed by the architect Andon Tülbentçiyan, the church had its foundations laid in January 1865; completed in about 18 months, it was consecrated on 6 November 1866.",
      "In the great Beyoğlu fire of 1870 the patriarchal building and its outbuildings were badly damaged; an extensive restoration was carried out in 1880–1881. Inside the neoclassical building is kept a reliquary of St. Gregory the Illuminator (Surp Krikor Lusavoriç). On 26 July 1967 a great liturgy attended by Pope Paul VI was celebrated here."
     ]
    },
    {
     "id": "surp-hovhan-vosgeperan",
     "lat": 41.03644,
     "lon": 28.9832,
     "side": "avrupa",
     "short": "Surp Hovhan Vosgeperan",
     "name": "Surp Hovhan Vosgeperan Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Taksim, Beyoğlu",
     "address": "Ana Çeşmesi Sokak No: 2, 34435 Taksim, Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar (kış)",
       "11:00"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Taksim Meydanı’nın yakınında, Fransız Konsolosluğu’nun arkasındaki Surp Hovhan Vosgeperan (Aziz Yuhanna Hrisostomos), 600 kişilik kapasitesiyle Türkiye’deki en büyük Ermeni Katolik kilisesidir.",
      "Burada 1837’de yapılan ahşap kilise zamanla yıprandı ve yandı. 1860’ta yeni kâgir yapının temeli atıldı; mimar Garabet Tülbentçiyan’ın 1861’deki ölümünden sonra inşaatı Andon Tülbentçiyan tamamladı ve kilise 1863’te bitti. Yanına bir de okul binası yapıldı.",
      "Düzgün kesme taştan yapılan kilise dışarıdan bazilika, içeriden ise merkezî kubbeli bir rotunda görünümündedir; sekizgen kubbeyi dört paye taşır. İç mekânda yarım yuvarlak kemerler, gömme payeler ve kompozit başlıklı sütunlarla neoklasik üslup hâkimdir. Papa II. Jean Paul 1979’daki Türkiye ziyaretinde bu kiliseye geldi."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Hovhan Vosgeperan Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-hovhan-vosgeperan-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Hovhan Vosgeperan Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Hovhan Vosgeperan Armenian Catholic Church",
     "shortEn": "Surp Hovhan Vosgeperan",
     "massEn": [
      [
       "Sunday (winter)",
       "11:00"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "Surp Hovhan Vosgeperan (St. John Chrysostom), near Taksim Square behind the French Consulate, holds 600 people and is the largest Armenian Catholic church in Turkey.",
      "The wooden church built here in 1837 deteriorated over time and later burned down. The foundations of the new masonry building were laid in 1860; after the death of the architect Garabet Tülbentçiyan in 1861, Andon Tülbentçiyan completed the work, and the church was finished in 1863. A school building was also put up beside it.",
      "Built of dressed stone, the church looks like a basilica from outside and like a rotunda with a central dome from inside; four piers carry the octagonal dome. Inside, the neoclassical style prevails, with round arches, engaged piers and columns with composite capitals. Pope John Paul II came to this church during his visit to Turkey in 1979."
     ]
    },
    {
     "id": "surp-pirgic",
     "lat": 41.0245,
     "lon": 28.97601,
     "side": "avrupa",
     "short": "Surp Pırgiç (Galata)",
     "name": "Surp Pırgiç Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Galata, Beyoğlu",
     "address": "Kuyu Sokak No: 5, 34425 Galata, Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Perşembe (kış)",
       "10:30"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Galata’daki Surp Pırgiç (Kutsal Kurtarıcı), İstanbul’da inşa edilen ilk Ermeni Katolik kilisesidir. Galata’daki Ermeni Katolik cemaati tarafından 1832–1834 yıllarında yaptırıldı ve 1850’den 1928’e kadar Ermeni Katolik patriklik makamına ev sahipliği yaptı.",
      "Rivayete göre inşaat sürerken şehirde veba salgını baş gösterdi ve 25 Mart’ta Meryem Ana ikonası sokaklarda dolaştırıldı; salgın dindikten sonra Sultan II. Mahmud’un kiliseye elmaslı bir hediye gönderdiği anlatılır.",
      "Geniş bazilika planlı yapının girişi, merdivenle çıkılan ve altı payenin arşitravla birleştiği bir “antik tapınak” cephesine sahiptir. İçeride beş sunak vardır; biri taçlı Meryem ile Çocuk İsa tasviriyle Meryem Ana’ya adanmıştır. Lübnan Emiri Beşir Şihabi’nin mezarı da bu kilisededir. 1958’de cadde genişletilirken yapının bir bölümü yıkıldı."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Pirgiç Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-pirgic-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Pırgiç Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Pırgiç Armenian Catholic Church",
     "shortEn": "Surp Pırgiç (Galata)",
     "massEn": [
      [
       "Thursday (winter)",
       "10:30"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "Surp Pırgiç (Holy Savior) in Galata is the first Armenian Catholic church built in Istanbul. It was built by the Armenian Catholic community of Galata in 1832–1834, and from 1850 to 1928 it was the seat of the Armenian Catholic patriarchate.",
      "According to tradition, while it was being built a plague broke out in the city, and on 25 March the icon of the Virgin Mary was carried in procession through the streets; after the epidemic subsided, Sultan Mahmud II is said to have sent the church a gift set with diamonds.",
      "The broad basilica-plan building is entered through a temple-style façade, reached by steps, in which six piers carry an architrave. Inside are five altars; one is dedicated to the Virgin Mary, with an image of the crowned Virgin and Child. The tomb of Emir Bashir Shihab of Lebanon is also in this church. Part of the building was demolished in 1958 when the street was widened."
     ]
    },
    {
     "id": "anarad-higutyun",
     "lat": 40.99945,
     "lon": 28.9307,
     "side": "avrupa",
     "short": "Anarad Hığutyun (Fatih)",
     "name": "Anarad Hığutyun Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Kocamustafapaşa, Fatih",
     "address": "Org. Abdurrahman Nafiz Gürman Caddesi No: 356, 34098 Kocamustafapaşa, Fatih, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar (kış)",
       "10:30"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Anarad Hığutyun (Lekesiz Gebelik) Kilisesi, tarihî yarımadada, surların içinde bulunan az sayıdaki Ermeni Katolik kilisesinden biridir. Kökleri, Katolik Ermeni cemaatinin çocuklarını okutmak için 1845’te kurulan Mesrobyan Okulu’na dayanır.",
      "Kilise 1856’da Sultan Abdülmecid’in izniyle açıldı. Yapımını, Osmanlı topraklarından çıkan ilk Ermeni Katolik kardinal olan Patrik Andon Bedros IX Hasunyan üstlendi; mimarı, Taksim’deki Surp Hovhan Vosgeperan ile Sakızağacı’ndaki katedralin de mimarı olan Andon Tülbentçiyan’dır.",
      "Mesrobyan Okulu, yoksul Ermeni kız çocuklarının eğitimi için kurulan Anarad Hığutyun Rahibeleri Birliği’nin İstanbul’daki ilk okuluydu. Depremler ve semt yangınları kiliseyi yıprattı; yapı 1990’daki restorasyonla bugünkü hâlini aldı."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Anarad Hığutyun Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/anarad-higutyun-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Anarad Hığutyun Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Anarad Hığutyun Armenian Catholic Church",
     "shortEn": "Anarad Hığutyun (Fatih)",
     "massEn": [
      [
       "Sunday (winter)",
       "10:30"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Anarad Hığutyun (Immaculate Conception) Church is one of the few Armenian Catholic churches on the historic peninsula, inside the city walls. Its roots go back to the Mesrobyan School, founded in 1845 to educate the children of the Armenian Catholic community.",
      "The church opened in 1856 with the permission of Sultan Abdülmecid. Its construction was undertaken by Patriarch Andon Bedros IX Hasunyan, the first Armenian Catholic cardinal from the Ottoman lands; its architect was Andon Tülbentçiyan, who also designed Surp Hovhan Vosgeperan in Taksim and the cathedral in Sakızağacı.",
      "The Mesrobyan School was the first Istanbul school of the Sisters of the Immaculate Conception (Anarad Hığutyun), a congregation founded to educate poor Armenian girls. Earthquakes and neighborhood fires took their toll on the church; the building took its present form in a restoration in 1990."
     ]
    },
    {
     "id": "surp-krikor-ortakoy",
     "lat": 41.05218,
     "lon": 29.0245,
     "side": "avrupa",
     "short": "Surp Krikor Lusavoriç (Ortaköy)",
     "name": "Surp Krikor Lusavoriç Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Ortaköy, Beşiktaş",
     "address": "Dereboyu Caddesi No: 132, 34347 Ortaköy, Beşiktaş, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Cumartesi (kış)",
       "15:00"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Ortaköy’deki Surp Krikor Lusavoriç (Aydınlatıcı Aziz Krikor) Kilisesi’nin yapımına 5 Kasım 1837 tarihli bir fermanla izin verildi. Krikor Hekimyan’ın yaptırdığı kilise 6 Ocak 1839’da ibadete açıldı.",
      "Mimarisiyle Roma bazilikalarını andıran yapının içinde, kadınlar için üst üste iki balkon ve dört küçük sunak bulunur. Kilise bugün Ortaköy Surp Krikor Lusavoriç Ermeni Katolik Kilisesi Vakfı tarafından yönetilir."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Krikor Lusavoriç Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-krikor-lusavoric-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Krikor Lusavoriç Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Krikor Lusavoriç Armenian Catholic Church",
     "shortEn": "Surp Krikor Lusavoriç (Ortaköy)",
     "massEn": [
      [
       "Saturday (winter)",
       "15:00"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The building of the Surp Krikor Lusavoriç (St. Gregory the Illuminator) Church in Ortaköy was permitted by a firman dated 5 November 1837. Built at the expense of Krikor Hekimyan, the church opened for worship on 6 January 1839.",
      "The building, whose architecture recalls the basilicas of Rome, has two stacked galleries for women and four small altars inside. Today the church is run by the Ortaköy Surp Krikor Lusavoriç Armenian Catholic Church Foundation."
     ]
    },
    {
     "id": "surp-bogos-buyukdere",
     "lat": 41.16228,
     "lon": 29.04694,
     "side": "avrupa",
     "short": "Surp Boğos (Büyükdere)",
     "name": "Surp Boğos Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Büyükdere, Sarıyer",
     "address": "Piyasa Caddesi No: 3, 34453 Büyükdere, Sarıyer, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar (yaz)",
       "11:00"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Yaz aylarında ayin saatinde açıktır.",
     "history": [
      "Büyükdere’deki Surp Boğos (Aziz Pavlus) ilk olarak 1847’de ahşap bir şapel olarak yapıldı. Cemaat büyüyünce ahşap yapı yetersiz kaldı; 1882’de kaldırılarak yerine Boğos Amira Bilezikçiyan’ın yaptırdığı daha geniş kâgir kilise inşa edildi ve 1885’te ibadete açıldı.",
      "Bahçe içindeki iki katlı görünümlü kilisenin doğusunda papaz evi ve çan kulesi bulunur; yerleşkede eski bir kuyu vardır. Yapı 1978’de tescil edildi. Boğaz’ın yazlık semtlerindeki pek çok kilise gibi burada da ayin yaz aylarında yapılır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Boğos Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-bogos-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Boğos Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Boğos Armenian Catholic Church",
     "shortEn": "Surp Boğos (Büyükdere)",
     "massEn": [
      [
       "Sunday (summer)",
       "11:00"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times in the summer months.",
     "historyEn": [
      "Surp Boğos (St. Paul) in Büyükdere was first built as a wooden chapel in 1847. As the community grew, the wooden building became too small; it was taken down in 1882 and replaced by the larger masonry church built at the expense of Boğos Amira Bilezikçiyan, which opened for worship in 1885.",
      "East of the church, which stands in a garden and looks two-storied, are the priest’s house and the bell tower; the compound has an old well. The building was listed in 1978. As at many churches in the Bosphorus summer neighborhoods, Mass is held here in the summer months."
     ]
    },
    {
     "id": "surp-andon-sariyer",
     "lat": 41.167,
     "lon": 29.056,
     "approx": true,
     "side": "avrupa",
     "short": "Surp Andon (Sarıyer)",
     "name": "Surp Andon Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Sarıyer",
     "address": "Sarıyer, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "status": "limited",
     "notice": "Düzenli bir ayin programı yayımlanmamıştır; restorasyondan sonra kilisede ayin yeniden yapılmaya başlanmıştır. Gitmeden önce Ermeni Katolik Patrikliği’ne danışın.",
     "mass": [
      [
       "Düzenli ayin",
       "Yayımlanmış bir program yok."
      ]
     ],
     "massNote": "",
     "visits": "Önceden bilgi alarak ziyaret edin.",
     "history": [
      "Aziz Antuan’a adanmış Surp Andon Kilisesi, 1871’de Andon Tıngır Yaver Paşa tarafından yaptırıldı. Kilise ve bitişiğindeki iki bina, 1877 tarihli bir anlaşmayla Ermeni Katolik Ruhani Reisliği’nin idaresine bırakıldı.",
      "Tek nefli bazilika planlı yapıda narteks, koro, apsis ve vaftizhane bulunur; batı girişinin iki köşesinde birer kule yükselir ve dış cephe yarı gotik bir görünüm taşır. 2019’da başlayan restorasyonda bahçe, duvarlar ve mezarlık yenilendi; çalışmaların ardından kilisede uzun bir aradan sonra yeniden ayin yapıldı."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Andon Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-andon-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Andon Armenian Catholic Church"
      ]
     ],
     "nameEn": "Surp Andon Armenian Catholic Church",
     "shortEn": "Surp Andon (Sarıyer)",
     "massEn": [
      [
       "Regular Mass",
       "No published schedule."
      ]
     ],
     "visitsEn": "Ask before you visit.",
     "noticeEn": "No regular Mass schedule has been published; Mass has resumed in the church since its restoration. Consult the Armenian Catholic Patriarchate before you go.",
     "historyEn": [
      "The Surp Andon Church, dedicated to St. Anthony, was built in 1871 by Andon Tıngır Yaver Pasha. The church and the two buildings beside it were placed under the administration of the Armenian Catholic spiritual authority by an agreement dated 1877.",
      "The single-nave, basilica-plan building has a narthex, choir, apse and baptistery; a tower rises at each corner of the west entrance, and the exterior has a partly Gothic look. In a restoration begun in 2019 the garden, walls and cemetery were renewed; after the work, Mass was celebrated in the church again after a long interval."
     ]
    },
    {
     "id": "suryani-katolik-gumussuyu",
     "lat": 41.036,
     "lon": 28.99,
     "approx": true,
     "side": "avrupa",
     "short": "Süryani Katolik (Gümüşsuyu)",
     "name": "Kutsal Kalp Süryani Katolik Kilisesi",
     "rite": "suryani",
     "district": "Gümüşsuyu, Beyoğlu",
     "address": "Ayazpaşa, Sarayarkası Sokak No: 15, 34437 Gümüşsuyu, Beyoğlu, İstanbul",
     "phones": [
      "0212 243 25 21"
     ],
     "email": "",
     "website": "https://presencet.com.tr",
     "mass": [
      [
       "Kış: pazartesi–cumartesi",
       "10:00 (Arapça-Aramice)"
      ],
      [
       "Kış: pazar",
       "11:00 (Türkçe, Arapça-Aramice)"
      ],
      [
       "Yaz: pazar",
       "09:30 (tek ayin)"
      ],
      [
       "Her ayın ilk cuması",
       "11:00 Türkçe, Kutsal Kalp onuruna"
      ]
     ],
     "massNote": "Süryani Katolik ayinleri Süryanice (Aramice), Arapça ve Türkçe yapılır.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Gümüşsuyu’ndaki Kutsal Kalp (Sacré-Cœur) Kilisesi, Türkiye Süryani Katolik Patriklik Vekâleti’nin merkez kilisesidir. Yapı 1910’da Cizvit rahipleri tarafından inşa edildi. Cizvitler Türkiye’den ayrıldıktan sonra bina ve arsası Hazine’ye geçti.",
      "1970’lerden itibaren Güneydoğu’dan İstanbul’a gelen Süryani Katolik cemaati, o dönem harap durumdaki kiliseyi onararak ibadete açtı. Yapı 1997’de 99 yıllığına bedelsiz olarak cemaatin vakfına tahsis edildi; uzun süren bir hukuki sürecin ardından 2018’de 49 yıllık bedelsiz tahsis kararı çıktı.",
      "Süryani Katolikler, Antakya’nın kadim Süryani Kilisesi’nden gelen ve 18. yüzyılda Roma ile birliğe giren bir Doğu Katolik Kilisesi’dir. Ayinlerinde, İsa’nın konuştuğu dile yakın olan Süryanice (Aramice) hâlâ kullanılır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Gümüşsuyu Süryani Katolik Kilisesi",
       "https://dijitalistanbul.org/gumussuyu-suryani-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Sacred Heart Syriac Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Sacred Heart Syriac Catholic Church",
     "shortEn": "Syriac Catholic (Gümüşsuyu)",
     "massEn": [
      [
       "Winter: Monday–Saturday",
       "10:00 (Arabic-Aramaic)"
      ],
      [
       "Winter: Sunday",
       "11:00 (Turkish, Arabic-Aramaic)"
      ],
      [
       "Summer: Sunday",
       "09:30 (one Mass only)"
      ],
      [
       "First Friday of every month",
       "11:00 Turkish, in honor of the Sacred Heart"
      ]
     ],
     "massNoteEn": "The Syriac Catholic liturgy is celebrated in Syriac (Aramaic), Arabic and Turkish.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Sacred Heart (Sacré-Cœur) Church in Gümüşsuyu is the principal church of the Syriac Catholic Patriarchal Vicariate in Turkey. The church was built by the Jesuits in 1910. After the Jesuits left Turkey, the building and its land passed to the Treasury.",
      "From the 1970s on, the Syriac Catholic community that had come to Istanbul from the southeast repaired the church, then in ruins, and opened it for worship. In 1997 the building was allocated to the community’s foundation free of charge for 99 years; after a long legal process, a decision granting it free of charge for 49 years was issued in 2018.",
      "The Syriac Catholics are an Eastern Catholic Church that comes from the ancient Syriac Church of Antioch and entered into union with Rome in the 18th century. Their liturgy still uses Syriac (Aramaic), close to the language Jesus spoke."
     ]
    },
    {
     "id": "keldani-istanbul",
     "lat": 41.035,
     "lon": 28.9826,
     "approx": true,
     "side": "avrupa",
     "short": "Keldani Katolik (Beyoğlu)",
     "name": "Keldani Katolik Kilisesi (İstanbul)",
     "rite": "keldani",
     "district": "Parmakkapı, Beyoğlu",
     "address": "Parmakkapı, Beyoğlu, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "status": "limited",
     "notice": "Kilisenin tam adresi ve ayin saatleri için güvenilir, güncel bir kaynak bulunamadı. Gitmeden önce Türkiye Keldani Katolik Patrik Vekilliği’ne danışın.",
     "mass": [
      [
       "Ayin saatleri",
       "Kiliseye danışın."
      ]
     ],
     "massNote": "",
     "visits": "Önceden görüşerek ziyaret edin.",
     "history": [
      "Keldani Katolik Kilisesi, Mezopotamya’daki kadim Doğu Kilisesi’nden gelen ve 16. yüzyılda (1552) Roma ile birliğe giren bir Doğu Katolik Kilisesi’dir. Ayinlerinde Süryanicenin doğu lehçesi kullanılır; patrikliğin merkezi bugün Bağdat’tadır.",
      "Türkiye’deki Keldani Katolik topluluğunun merkezi İstanbul’da, Beyoğlu’ndadır ve Türkiye Keldani Katolik Patrik Vekili Mgr. Fransua Yakan tarafından yönetilir. Cemaatin büyük bölümü, 20. yüzyılın ikinci yarısında Güneydoğu’dan, özellikle Şırnak, Mardin ve Diyarbakır çevresinden gelen ailelerden oluşur."
     ],
     "sources": [
      [
       "Vikipedi: Keldani Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/Keldani_Katolik_Kilisesi",
       "Wikipedia (Turkish): Chaldean Catholic Church (Istanbul)"
      ]
     ],
     "nameEn": "Chaldean Catholic Church (Istanbul)",
     "shortEn": "Chaldean Catholic (Beyoğlu)",
     "massEn": [
      [
       "Mass times",
       "Ask the church."
      ]
     ],
     "visitsEn": "Arrange your visit in advance.",
     "noticeEn": "No reliable, current source could be found for the church’s exact address and Mass times. Consult the Chaldean Catholic Patriarchal Vicariate of Turkey before you go.",
     "historyEn": [
      "The Chaldean Catholic Church is an Eastern Catholic Church that comes from the ancient Church of the East in Mesopotamia and entered into union with Rome in the 16th century (1552). Its liturgy uses the eastern dialect of Syriac; the patriarchate is based in Baghdad today.",
      "The center of the Chaldean Catholic community in Turkey is in Istanbul, in Beyoğlu, and is led by the Chaldean Catholic Patriarchal Vicar of Turkey, Mgr. François Yakan. Most of the community are families who came from the southeast in the second half of the 20th century, especially from around Şırnak, Mardin and Diyarbakır."
     ]
    },
    {
     "id": "assomption-moda",
     "lat": 40.98411,
     "lon": 29.0252,
     "side": "anadolu",
     "short": "Notre Dame de l’Assomption (Moda)",
     "name": "Notre Dame de l’Assomption Kilisesi",
     "rite": "latin",
     "district": "Moda, Kadıköy",
     "address": "Moda, Cem Sokak No: 5, 34710 Kadıköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:30 (Türkçe / Fransızca)"
      ],
      [
       "Pazartesi–Cuma",
       "18:30 (Türkçe / Fransızca)"
      ],
      [
       "Cumartesi",
       "18:30 Türkçe"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Kadıköy’de “Fransız Kilisesi” olarak da bilinen Notre Dame de l’Assomption, Meryem Ana’nın Göğe Alınışı’na adanmıştır. 1858’de Havarisel Vekil Brunoni, rahip De Negri’yi Kadıköy’de bir kilise kurmakla görevlendirdi; Sakız Adası’ndan yeni gelen Katolik aileler inşaata somut katkı sağladı.",
      "1859 tarihli bir fermanla izin alınan kilise, mimar Giovanni Battista Barberini tarafından neoklasik üslupta tasarlandı ve 1865’te tamamlandı; cephedeki Latince yazıtta mimarın adı “Architectus Johannes Barborini” olarak geçer. Haç planlı, kubbeli yapının batı cephesinde iki çan kulesi yükselir.",
      "2 Temmuz 1895 tarihli bir papalık yazısıyla kilise ve eklentileri Assomptionist (Asumsiyonist) rahiplere devredildi ve yanına bir manastır binası eklendi. 1970’lerin ortasından beri kilise Süryani cemaati tarafından da kullanılmaktadır. Ayinler Türkçe ve Fransızca yapılır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Notre Dame de L’Assomption Kilisesi",
       "https://dijitalistanbul.org/notre-dame-de-lassomption-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of Notre Dame de l’Assomption"
      ],
      [
       "Vikipedi: Kadıköy Fransız Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/Kad%C4%B1k%C3%B6y_Frans%C4%B1z_Katolik_Kilisesi",
       "Wikipedia (Turkish): Church of Notre Dame de l’Assomption"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Notre Dame de l’Assomption",
     "shortEn": "Notre Dame de l’Assomption (Moda)",
     "massEn": [
      [
       "Sunday",
       "11:30 (Turkish / French)"
      ],
      [
       "Monday–Friday",
       "18:30 (Turkish / French)"
      ],
      [
       "Saturday",
       "18:30 Turkish"
      ]
     ],
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "Notre Dame de l’Assomption, also known in Kadıköy as “the French Church”, is dedicated to the Assumption of the Virgin Mary. In 1858 the Apostolic Vicar Brunoni charged Father De Negri with founding a church in Kadıköy; Catholic families newly arrived from Chios contributed substantially to its construction.",
      "Permitted by a firman of 1859, the church was designed in the neoclassical style by the architect Giovanni Battista Barberini and completed in 1865; in the Latin inscription on the façade the architect’s name appears as “Architectus Johannes Barborini”. Two bell towers rise on the west front of the cross-plan, domed building.",
      "By a papal letter of 2 July 1895 the church and its annexes were handed over to the Assumptionist priests, and a monastery building was added beside it. Since the mid-1970s the church has also been used by the Syriac community. Mass is said in Turkish and French."
     ]
    },
    {
     "id": "tubini-sapeli",
     "lat": 40.9898,
     "lon": 29.02932,
     "approx": true,
     "side": "anadolu",
     "short": "Tubini Şapeli (Kadıköy)",
     "name": "Meryem Ana Latin Katolik Kilisesi (Tubini Şapeli)",
     "rite": "latin",
     "district": "Kadıköy",
     "address": "Misbah Muayyeş Sokak No: 2, 34710 Kadıköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Salı ve perşembe",
       "18:00"
      ],
      [
       "Pazar",
       "18:00"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Kadıköy’deki bu küçük barok şapel, Hyacinthe Tubini’nin 30 Aralık 1886 tarihli vasiyetiyle aile kullanımı için yapılmasını istediği, ama aynı zamanda bütün inananlara açık olmasını şart koştuğu şapeldir. Yaklaşık 6 metre genişliğinde ve 12 metre uzunluğundaki yapı 1905’te tamamlandı ve Meryem Ana’nın Müjdesi’ne adandı.",
      "Şapel 1960’ta ve 13 Ocak 1990’da onarıldı. 2017’de yapılan bir kira sözleşmesiyle 2023’e kadar başka bir Hristiyan cemaatinin kullanımına verildi. 2023’te yeniden restore edilen şapel, 7 Aralık 2023’te kutsanarak Latin Katolik ibadetine açıldı ve bu kez Kalkedonlu Meryem Ana’ya (Santa Maria in Calcedonia) adandı; Kadıköy’ün antik adı Kalkedon’dur."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Meryem Ana Latin Katolik Kilisesi",
       "https://dijitalistanbul.org/meryem-ana-latin-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of Our Lady, Latin Catholic (Tubini Chapel)"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Our Lady, Latin Catholic (Tubini Chapel)",
     "shortEn": "Tubini Chapel (Kadıköy)",
     "massEn": [
      [
       "Tuesday and Thursday",
       "18:00"
      ],
      [
       "Sunday",
       "18:00"
      ]
     ],
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "In his will of 30 December 1886, Hyacinthe Tubini asked for this small Baroque chapel in Kadıköy to be built for his family’s use, on condition that it also be open to all believers. The building, about 6 meters wide and 12 meters long, was completed in 1905 and dedicated to the Annunciation.",
      "The chapel was repaired in 1960 and on 13 January 1990. Under a lease signed in 2017 it was given to another Christian community for use until 2023. Restored again in 2023, the chapel was consecrated and opened for Latin Catholic worship on 7 December 2023, this time dedicated to Our Lady of Chalcedon (Santa Maria in Calcedonia); Chalcedon is the ancient name of Kadıköy."
     ]
    },
    {
     "id": "aziz-augustin-fenerbahce",
     "lat": 40.97159,
     "lon": 29.04159,
     "side": "anadolu",
     "short": "Aziz Augustin (Fenerbahçe)",
     "name": "Aziz Augustin Kilisesi",
     "rite": "latin",
     "district": "Fenerbahçe, Kadıköy",
     "address": "Atlıhan Sokak No: 1, 34726 Fenerbahçe, Kadıköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "10:00 (Türkçe / Fransızca)"
      ]
     ],
     "massNote": "",
     "visits": "Pazar ayininde açıktır.",
     "history": [
      "Fenerbahçe’deki Aziz Augustin şapeli, 1889–1892 yıllarında Assomptionist rahiplerin eğitim evi olarak inşa edilen bir yapının parçasıdır. Bina 1 Mayıs 1890’da Piskopos Bonetti tarafından kutsandı; 1892’de eklenen iki yan kanattan soldaki, Hipponlu Aziz Augustinus’a adanmış şapel olarak düzenlendi.",
      "Yapı 1890–1914 arasında sırasıyla novis evi, skolastik eğitim evi ve öğrenci yurdu olarak kullanıldı; 1895–1914 arasında papaz okulu oldu ve bu işlevini küçük ölçekte İkinci Dünya Savaşı’na kadar sürdürdü. 1914–1919 arasında hastane olarak hizmet verdi. 1920’den sonra şapel Kadıköy cemaatinin bir eklentisi hâline geldi ve Moda’daki rahipler burada düzenli ayin yapmayı sürdürdü.",
      "Bina 1982’de bir spor tesisinin parçası olarak kiraya verildi; şapel ise 2012–2013’te kapsamlı biçimde yenilendi. Semtin eski Rumca adı “Phanaraki” (küçük fener), yapının erken dönem kayıtlarında geçer."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Aziz Augustin Kilisesi",
       "https://dijitalistanbul.org/aziz-augustin-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of St. Augustine"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Weekday Masses: İstanbul kiliseleri",
       "https://weekdaymasses.org.uk/en/area/turkey-istanbul/churches",
       "Weekday Masses: Istanbul churches"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Augustine",
     "shortEn": "St. Augustine (Fenerbahçe)",
     "massEn": [
      [
       "Sunday",
       "10:00 (Turkish / French)"
      ]
     ],
     "visitsEn": "Open for Sunday Mass.",
     "historyEn": [
      "The St. Augustine chapel in Fenerbahçe is part of a building put up in 1889–1892 as a house of formation for the Assumptionist priests. The building was blessed by Bishop Bonetti on 1 May 1890; of the two side wings added in 1892, the left one was fitted out as a chapel dedicated to St. Augustine of Hippo.",
      "Between 1890 and 1914 the building served in turn as a novitiate, a house of studies and a student hostel; from 1895 to 1914 it was a seminary, a role it kept on a small scale until the Second World War. From 1914 to 1919 it served as a hospital. After 1920 the chapel became an annex of the Kadıköy parish, and the priests from Moda went on celebrating Mass here regularly.",
      "In 1982 the building was leased as part of a sports facility; the chapel was thoroughly renovated in 2012–2013. The neighborhood’s old Greek name, “Phanaraki” (little lighthouse), appears in the building’s early records."
     ]
    },
    {
     "id": "surp-levon-kadikoy",
     "lat": 40.98972,
     "lon": 29.02947,
     "side": "anadolu",
     "short": "Surp Levon (Kadıköy)",
     "name": "Surp Levon Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Altıyol, Kadıköy",
     "address": "Altıyol, Ali Suavi Sokak No: 1, 34714 Kadıköy, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:30"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Pazar ayininde açıktır.",
     "history": [
      "Kadıköy Altıyol’daki Surp Levon Kilisesi, adını 440–461 yılları arasında papalık yapan Büyük Aziz Leo’dan (Surp Levon) alır. Burada 1890’da, Ermeni mezarlığı arazisinde ahşap bir şapel yapıldı.",
      "Ahşap yapı kaldırılarak 1908’de bugünkü kâgir kilisenin temelleri atıldı; kilise 1911’de tamamlanıp ibadete açıldı. Planı Roma bazilikalarını örnek alır. Apsisteki ana sunakta Giovanni Cingolani’nin 1890 tarihli Surp Levon tablosu bulunur; çan kulesinde farklı boyutlarda dört çan ve tepesinde bir horoz figürü vardır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Surp Levon Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/surp-levon-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Surp Levon Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Surp Levon Armenian Catholic Church",
     "shortEn": "Surp Levon (Kadıköy)",
     "massEn": [
      [
       "Sunday",
       "11:30"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open for Sunday Mass.",
     "historyEn": [
      "The Surp Levon Church in Altıyol, Kadıköy, takes its name from St. Leo the Great (Surp Levon), pope from 440 to 461. A wooden chapel was built here in 1890, on the grounds of the Armenian cemetery.",
      "The wooden building was taken down, and in 1908 the foundations of the present masonry church were laid; the church was completed and opened for worship in 1911. Its plan follows the basilicas of Rome. On the high altar in the apse is a painting of Surp Levon by Giovanni Cingolani, dated 1890; the bell tower has four bells of different sizes and a rooster figure on top."
     ]
    },
    {
     "id": "polonezkoy",
     "lat": 41.10986,
     "lon": 29.20739,
     "side": "anadolu",
     "short": "Polonezköy Meryem Ana",
     "name": "Częstochowa Meryem Ana Kilisesi (Polonezköy)",
     "rite": "latin",
     "district": "Polonezköy, Beykoz",
     "address": "Polonezköy, 34827 Beykoz, İstanbul",
     "phones": [],
     "email": "",
     "website": "https://duszpasterstwowstambule.pl",
     "mass": [
      [
       "Cumartesi",
       "18:00 (Ekim–Mart) · 19:00 (Nisan–Eylül), Lehçe / Türkçe"
      ]
     ],
     "massNote": "Polonya cemaatinin ayinleri için duszpasterstwowstambule.pl adresine bakabilirsiniz.",
     "visits": "Ayin saatinde ve köyün etkinlik günlerinde açıktır.",
     "history": [
      "Polonezköy (Adampol), 1842’de Polonyalı göçmenlerin kurduğu bir köydür. Köydeki ilk dinî yapı 1842’de yapılan Azize Anna Kilisesi’ydi. 1894 İstanbul depreminde bu kilise yıkıldı ve yerine 1914’te bugünkü Częstochowa Meryem Ana Kilisesi inşa edildi.",
      "Birinci Dünya Savaşı sırasında kilise Türk ordusu tarafından karargâh olarak kullanıldı; savaştan sonra 1918’de onarılarak yeniden ibadete açıldı. İçinde, Polonya’nın en önemli hac yeri olan Częstochowa’daki ünlü Meryem Ana ikonasının bir kopyası bulunur. Kilise bugün de Polonya kökenli köy halkının ve İstanbul’daki Polonyalı Katoliklerin buluşma yeridir."
     ],
     "sources": [
      [
       "Vikipedi: Czestochova Meryem Ana Kilisesi",
       "https://tr.wikipedia.org/wiki/Czestochova_Meryem_Ana_Kilisesi",
       "Wikipedia (Turkish): Church of Our Lady of Częstochowa (Polonezköy)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of Our Lady of Częstochowa (Polonezköy)",
     "shortEn": "Our Lady (Polonezköy)",
     "massEn": [
      [
       "Saturday",
       "18:00 (October–March) · 19:00 (April–September), Polish / Turkish"
      ]
     ],
     "massNoteEn": "For the Polish community’s Masses, see duszpasterstwowstambule.pl.",
     "visitsEn": "Open during Mass times and on village festival days.",
     "historyEn": [
      "Polonezköy (Adampol) is a village founded in 1842 by Polish émigrés. The village’s first place of worship was the Church of St. Anne, built in 1842. That church was destroyed in the Istanbul earthquake of 1894, and the present Church of Our Lady of Częstochowa was built in its place in 1914.",
      "During the First World War the church was used as a headquarters by the Turkish army; after the war it was repaired and reopened for worship in 1918. Inside is a copy of the famous icon of the Virgin Mary at Częstochowa, Poland’s most important place of pilgrimage. The church is still the meeting place of the village’s people of Polish descent and of the Polish Catholics of Istanbul."
     ]
    },
    {
     "id": "san-pacifico-buyukada",
     "lat": 40.87214,
     "lon": 29.12769,
     "side": "anadolu",
     "short": "San Pacifico (Büyükada)",
     "name": "Aziz Pasifiko Kilisesi (San Pacifico)",
     "rite": "latin",
     "district": "Büyükada, Adalar",
     "address": "Yeni Sokak No: 21, 34970 Büyükada, Adalar, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 Türkçe"
      ],
      [
       "Salı",
       "11:00 Türkçe"
      ],
      [
       "Cumartesi (Nisan–Eylül)",
       "19:00 İtalyanca"
      ]
     ],
     "massNote": "",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Büyükada’daki San Pacifico Kilisesi, Ignazio Corpi’nin yaptırdığı ve mimar Giacomo Leoni’nin tasarladığı yeni-gotik bir kilisedir; 1885’te inşa edildi. 1894 İstanbul depreminde kilise ve manastır hasar gördü, depremden yaklaşık bir buçuk ay sonra onarıldı.",
      "İç mekânda ahşap bir tavan ile çeşitli resim ve heykeller bulunur; girişteki haçla taçlanmış demir kapının sembolü vitraylarda da tekrarlanır. Kilisede, 1935–1944 arasında Türkiye’de papalık temsilcisi olarak bulunan ve Büyükada’yı sık sık ziyaret eden Angelo Giuseppe Roncalli (Papa XXIII. Yuhanna) ile ilişkilendirilen bir tablo da vardır."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Büyükada Aziz Pasifiko Kilisesi",
       "https://dijitalistanbul.org/buyukada-aziz-pasifiko-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Church of St. Pacificus (San Pacifico)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Pacificus (San Pacifico)",
     "shortEn": "San Pacifico (Büyükada)",
     "massEn": [
      [
       "Sunday",
       "11:00 Turkish"
      ],
      [
       "Tuesday",
       "11:00 Turkish"
      ],
      [
       "Saturday (April–September)",
       "19:00 Italian"
      ]
     ],
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The San Pacifico Church on Büyükada is a neo-Gothic church completed in 1885, paid for by Ignazio Corpi and designed by the architect Giacomo Leoni. The church and friary were damaged in the Istanbul earthquake of 1894 and repaired about a month and a half later.",
      "Inside are a wooden ceiling and various paintings and statues; the symbol of the iron gate crowned with a cross at the entrance is repeated in the stained glass. The church also has a painting associated with Angelo Giuseppe Roncalli (Pope John XXIII), who was the papal representative in Turkey from 1935 to 1944 and often visited Büyükada."
     ]
    },
    {
     "id": "verapokhumin-buyukada",
     "lat": 40.87209,
     "lon": 29.12617,
     "side": "anadolu",
     "short": "Verapokhumin (Büyükada)",
     "name": "Verapokhumin Surp Asdvadzadzin Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Büyükada, Adalar",
     "address": "Mehmetçik Sokak No: 11, 34970 Büyükada, Adalar, İstanbul",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar (yaz)",
       "11:00"
      ]
     ],
     "massNote": "Ermeni Katolik kiliselerinde ayinler Ermenice ve Türkçe yapılır. Saatler mevsime göre değişir; bazı kiliselerde ayin yalnızca yazın ya da yalnızca kışın yapılır.",
     "visits": "Yaz aylarında ayin saatinde açıktır.",
     "history": [
      "Verapokhumin Surp Asdvadzadzin (Meryem Ana’nın Göğe Alınışı) Kilisesi, Adalar’daki tek Ermeni Katolik kilisesidir. Hayırsever Andon Ağa Apelyan tarafından 1856–1858 yıllarında yaptırıldı; kutsama ve açılış tarihi, Meryem Ana’nın Göğe Alınışı bayramına denk gelen 15 Ağustos 1858’dir.",
      "Kemerli tavanı sütunlarla taşınan ibadet salonunda Andon Ağa Apelyan’ı anan bir mermer plaket bulunur; Apelyan vasiyeti üzerine kilisenin içine gömülmüştür. Girişin üzerinde dairesel bir gül pencere, içeride koro balkonu ve org vardır. Çan kulesi 1895 tarihlidir; kilise 1956 ve 1985’te onarıldı."
     ],
     "sources": [
      [
       "Dijital İstanbul (İstanbul Valiliği): Verapokhumin Surp Asdvadzazni Ermeni Katolik Kilisesi",
       "https://dijitalistanbul.org/verapokhumin-surp-asdvadzazni-ermeni-katolik-kilisesi",
       "Dijital İstanbul (Governorship of Istanbul): Verapokhumin Surp Asdvadzadzin Armenian Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "nameEn": "Verapokhumin Surp Asdvadzadzin Armenian Catholic Church",
     "shortEn": "Verapokhumin (Büyükada)",
     "massEn": [
      [
       "Sunday (summer)",
       "11:00"
      ]
     ],
     "massNoteEn": "In Armenian Catholic churches, Mass is celebrated in Armenian and Turkish. Times vary with the season; in some churches Mass is held only in summer or only in winter.",
     "visitsEn": "Open during Mass times in the summer months.",
     "historyEn": [
      "The Verapokhumin Surp Asdvadzadzin (Assumption of the Virgin Mary) Church is the only Armenian Catholic church on the Princes’ Islands. It was built in 1856–1858 at the expense of the benefactor Andon Ağa Apelyan; it was consecrated and opened on 15 August 1858, the feast of the Assumption.",
      "In the prayer hall, whose vaulted ceiling rests on columns, is a marble plaque commemorating Andon Ağa Apelyan, who at his request was buried inside the church. Above the entrance is a circular rose window, and inside are a choir gallery and an organ. The bell tower dates from 1895; the church was repaired in 1956 and 1985."
     ]
    }
   ],
   "nameEn": "Istanbul"
  },
  {
   "id": "izmir",
   "name": "İzmir",
   "lat": 38.42,
   "lon": 27.14,
   "label": [
    11,
    5,
    "start"
   ],
   "open": "r",
   "churches": [
    {
     "id": "aziz-yuhanna-izmir",
     "lat": 38.42888,
     "lon": 27.13963,
     "short": "Aziz Yuhanna Katedrali",
     "name": "Aziz Yuhanna Katedral Bazilikası",
     "rite": "latin",
     "district": "Alsancak, Konak",
     "address": "Kültür Mah., Şehit Nevres Bulvarı No: 29, 35220 Alsancak, Konak, İzmir",
     "phones": [
      "0232 421 21 90"
     ],
     "email": "izmirkatedrali@gmail.com",
     "website": "https://www.izmirkatedrali.com",
     "mass": [
      [
       "Pazar",
       "10:00 İngilizce · 12:00 Türkçe · 18:00 Lehçe"
      ],
      [
       "Cumartesi",
       "17:30 Tespih Duası · 18:00 Türkçe ayin (pazar arifesi)"
      ],
      [
       "Pazartesi–Cuma",
       "17:30 Tespih Duası · 18:00 Türkçe ayin"
      ],
      [
       "Perşembe",
       "Ayinden sonra Efkaristiya’ya Tapınma (18:30)"
      ]
     ],
     "massNote": "Her pazar ayinden sonra çay ve kahve ikram edilir. Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Kişisel dua ve ziyaret için her gün 15:00–17:00 arası açıktır; pazar ve pazartesi günleri ziyarete kapalıdır.",
     "history": [
      "Aziz Yuhanna Katedral Bazilikası, İzmir Katolik Başepiskoposluğu’nun katedralidir ve Anadolu’daki en etkileyici Katolik ibadet yerlerinden biridir. Vahiy Kitabı’ndaki yedi kiliseden biri olan İzmir (Smyrna) kilisesi, İsa’nın Yuhanna aracılığıyla gönderdiği ikinci mektupta “Ölene kadar sadık kal, sana yaşam tacını vereceğim” sözleriyle övülür (Esinleme 2,8-11). Gelenek, bu topluluğun kurucusu olarak Havari Yuhanna’yı kabul eder; katedral de ona adanmıştır.",
      "İzmir kilisesinin tarihi, Yuhanna’nın öğrencisi Episkopos Polikarp’la sürer. Polikarp, 107 yılı civarında Roma’ya zincirlerle götürülen Antakyalı İgnatius’u burada karşıladı ve 155 yılı civarında, katedralden pek uzak olmayan antik stadyumda şehit edildi. Osmanlı döneminde İzmir’de piskopos oturamadığından unvan uzun süre onursal kaldı; 17. ve 19. yüzyıllar arasında bir Havarisel Vekillik vardı. 1818’de Papa VII. Pius, İzmir Başepiskoposluğu’nu yeniden kurdu; yeni bir katedral yapılana kadar Pasaport’taki Santa Maria Kilisesi 56 yıl boyunca katedral olarak kullanıldı.",
      "1857’de Başepiskopos Antonio Mussabini katedral için arazi satın aldı. İstanbul’da papalık temsilcisi olan Mussabini, Sultan Abdülaziz ile dostluğu sayesinde yalnızca izin almakla kalmadı; padişah inşaat için 11.000 altın lira da bağışladı. Mussabini’nin ölümüyle ara veren çalışmalar, halefi Vincenzo Spaccapietra’nın 25 Kasım 1862’de temel taşını kutsamasıyla yeniden başladı. On iki yıl süren ve İzmir Katoliklerinin cömert katkılarıyla yürüyen inşaatın sonunda katedral 14 Haziran 1874’te kutsandı.",
      "Sade ve zarif neoklasik yapı, antik Smyrna limanının bulunduğu yerdedir; Helenistik-Roma liman kalıntıları katedralin önündeki binaların altında kalır. Papa IX. Pius katedrale ana sunağı hediye etti; İzmirli Aziz İreneus’un piskoposu olduğu Lyon Başepiskoposluğu da minnet işareti olarak Haç Yolu’nun on dört tablosunu gönderdi. 1901’de Paris’te ressam Paul Gaudin’e yaptırılan vitrayların yalnızca biri 1922 yangınından kurtulabildi; bugün Aziz Yusuf sunağının sağındadır. Kutsal Sakrament şapelinin altındaki mahzende Mussabini, Spaccapietra, Efes’teki Meryem Ana Evi’nin bulunmasına katkı sağlayan Andrea Timoni ve Domenico Marengo gömülüdür.",
      "1922’deki büyük yangında katedral ağır hasar gördü; başepiskoposluk sarayı, idari binalar ve ilmihal salonları tamamen yandı. Yangından önce İzmir’de yaklaşık 15.000 Katolik, pek çok okul, hastane ve tarikat vardı; bu canlılık sonrasında hızla azaldı. Başepiskopos Joseph Descuffi, katedrali korumak için 1965’te onu ABD askerî topluluğuna şapel olarak kiraladı. Güvenlik önlemleri halkın kiliseye girmesini zorlaştırınca başepiskoposluk 2013’te sözleşmeyi sona erdirdi; restore edilen katedral 29 Eylül 2013’te yeniden yerel cemaate açıldı.",
      "2014’te İtalya’daki Isernia piskoposluğu, heykeltıraş Battista Marello’nun yaptığı 4 metre yüksekliğindeki bronz Aziz Yuhanna heykelini hediye etti; heykel bugün kilise bahçesindedir. 27 Aralık 2016’da Başepiskopos Lorenzo Piretto, içinde Aziz Yuhanna ve diğer havarilerin rölikleriyle Aziz Petrus’un mezarından bir parça bulunan yeni mermer sunağı kutsadı. Papa XXIII. Yuhanna, VI. Pavlus ve II. Jean Paul katedrali ziyaret etmiştir."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Yuhanna Katedral Bazilikası",
       "https://izmirkatolikkilisesi.com/aziz-yuhanna-kilisesi/",
       "Catholic Archdiocese of Izmir: Cathedral Basilica of St. John"
      ],
      [
       "İzmir Katedrali resmi sitesi",
       "https://www.izmirkatedrali.com",
       "Izmir Cathedral, official website"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Cathedral Basilica of St. John",
     "shortEn": "St. John’s Cathedral",
     "massEn": [
      [
       "Sunday",
       "10:00 English · 12:00 Turkish · 18:00 Polish"
      ],
      [
       "Saturday",
       "17:30 Rosary · 18:00 Mass in Turkish (Sunday vigil)"
      ],
      [
       "Monday–Friday",
       "17:30 Rosary · 18:00 Mass in Turkish"
      ],
      [
       "Thursday",
       "Eucharistic Adoration after Mass (18:30)"
      ]
     ],
     "massNoteEn": "Tea and coffee are served after Mass every Sunday. Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open every day from 15:00 to 17:00 for personal prayer and visits; closed to visitors on Sundays and Mondays.",
     "historyEn": [
      "The Cathedral Basilica of St. John is the cathedral of the Catholic Archdiocese of Izmir and one of the most impressive Catholic places of worship in Anatolia. The church of Smyrna (Izmir), one of the seven churches of the Book of Revelation, is praised in the second letter Jesus sent through John with the words “Be faithful unto death, and I will give you the crown of life” (Revelation 2:8-11). Tradition holds the Apostle John to be the founder of this community, and the cathedral is dedicated to him.",
      "The history of the church of Smyrna continues with John’s disciple, Bishop Polycarp. Around the year 107 Polycarp welcomed Ignatius of Antioch here as he was being taken to Rome in chains, and around 155 he was martyred in the ancient stadium, not far from the cathedral. Because no bishop could reside in Izmir in Ottoman times, the title long remained honorary; between the 17th and 19th centuries there was an Apostolic Vicariate. In 1818 Pope Pius VII re-established the Archdiocese of Izmir; until a new cathedral was built, the Santa Maria Church in Pasaport served as the cathedral for 56 years.",
      "In 1857 Archbishop Antonio Mussabini bought land for the cathedral. Thanks to the friendship between Mussabini, then papal representative in Constantinople, and Sultan Abdülaziz, permission was granted, and the sultan even donated 11,000 gold liras for the building. The work, interrupted by Mussabini’s death, resumed when his successor Vincenzo Spaccapietra blessed the foundation stone on 25 November 1862. After twelve years of building, carried forward by the generous contributions of Izmir’s Catholics, the cathedral was consecrated on 14 June 1874.",
      "The simple, elegant neoclassical building stands where the ancient harbor of Smyrna lay; remains of the Hellenistic-Roman harbor lie beneath the buildings in front of the cathedral. Pope Pius IX gave the cathedral its high altar, and the Archdiocese of Lyon, whose bishop was St. Irenaeus of Smyrna, sent the fourteen paintings of the Stations of the Cross as a sign of gratitude. Of the stained-glass windows commissioned from the painter Paul Gaudin in Paris in 1901, only one survived the fire of 1922; it is now to the right of the altar of St. Joseph. In the vault beneath the Blessed Sacrament chapel lie Mussabini, Spaccapietra, Andrea Timoni, who helped bring about the discovery of the House of the Virgin Mary at Ephesus, and Domenico Marengo.",
      "In the great fire of 1922 the cathedral was badly damaged; the archbishop’s palace, the administrative buildings and the catechism halls burned down completely. Before the fire Izmir had about 15,000 Catholics and many schools, hospitals and religious orders; that vitality declined quickly afterwards. To preserve the cathedral, Archbishop Joseph Descuffi leased it in 1965 to the US military community as a chapel. When security measures made it hard for the public to enter the church, the archdiocese ended the agreement in 2013; the restored cathedral reopened to the local community on 29 September 2013.",
      "In 2014 the Diocese of Isernia in Italy gave a 4-meter bronze statue of St. John by the sculptor Battista Marello; it now stands in the church garden. On 27 December 2016 Archbishop Lorenzo Piretto consecrated the new marble altar, which contains relics of St. John and the other apostles and a fragment from the tomb of St. Peter. Popes John XXIII, Paul VI and John Paul II have visited the cathedral."
     ]
    },
    {
     "id": "aziz-polikarp",
     "lat": 38.42569,
     "lon": 27.13581,
     "short": "Aziz Polikarp",
     "name": "Aziz Polikarp Kilisesi (Sen Polikarp)",
     "rite": "latin",
     "district": "Pasaport, Konak",
     "address": "Necatibey Bulvarı No: 2/A, 35210 Pasaport, Konak, İzmir",
     "phones": [
      "0232 484 84 36"
     ],
     "email": "sanpolicarpo.izmir@gmail.com",
     "website": "https://senpolikarpizmir.com",
     "mass": [
      [
       "Pazartesi",
       "09:00 ayin, ardından 12:00’ye kadar Efkaristiya’ya Tapınma"
      ],
      [
       "Cumartesi ve pazar",
       "Ayin yok"
      ]
     ],
     "massNote": "Aziz Polikarp bayramı her yıl 23 Şubat’ta görkemle kutlanır; öncesinde dokuz günlük bir novena yapılır. Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Pazar hariç her gün 15:00–17:00 arası ziyarete açıktır.",
     "history": [
      "Aziz Polikarp Kilisesi, İzmir’in hâlâ ayakta olan en eski kilisesidir. Adını, Havari Yuhanna’nın öğrencilerinden biri olan ve yaklaşık elli yıl İzmir episkoposluğu yapan Aziz Polikarp’tan alır. Polikarp, İsa’yı inkâr etmeyi reddettiği için 155 yılı civarında İzmir’in stadyumunda diri diri yakılmak istenmiş, alevler ona dokunmayınca bir hançerle öldürülmüştür. O zamandan beri İzmir’in koruyucu azizi sayılır.",
      "Kilisenin hikâyesi 1625’te, Osmanlı yönetiminden alınan izinle Fransa Konsolosluğu binasında açılan bir şapelle başlar. 1630’da şapelin yerine başepiskoposluğun bugünkü arazisinde bir kilise ve manastır yapıldı ve Aziz Polikarp, Fransız cemaatinin kilisesi oldu. 1688’deki büyük depremde yıkılan yapının yerine 1690’da bugünkü kilise inşa edildi.",
      "Defalarca hasar görüp onarılan kilise 1898’de genişletildi ve bugünkü görkemli süslemelerine kavuştu. 19. yüzyılın sonunda İzmir’e yerleşen genç Fransız ressam-mimar Raymond Péré, Aziz Polikarp’ın şehitliğini de anlatan freskleri yaptı. Kilisenin adı, İzmir’in simgesi Saat Kulesi ile birlikte anılır.",
      "Kiliseye yüzyıllarca Fransisken Kapuçin rahipleri hizmet etti; tarikat manastırı 1984’te bıraktı. Bugünkü manastır binası, 1922’deki büyük İzmir yangınında yıkılan eski binanın yerine 1929’da yapılmıştır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Polikarp Kilisesi",
       "https://izmirkatolikkilisesi.com/aziz-polikarpos/",
       "Catholic Archdiocese of Izmir: Church of St. Polycarp (Sen Polikarp)"
      ],
      [
       "Aziz Polikarp Katolik Kilisesi resmi sitesi",
       "https://senpolikarpizmir.com",
       "St. Polycarp Catholic Church, official website"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Polycarp (Sen Polikarp)",
     "shortEn": "St. Polycarp",
     "massEn": [
      [
       "Monday",
       "09:00 Mass, followed by Eucharistic Adoration until 12:00"
      ],
      [
       "Saturday and Sunday",
       "No Mass"
      ]
     ],
     "massNoteEn": "The feast of St. Polycarp is celebrated with great solemnity every year on 23 February, preceded by a nine-day novena. Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open to visitors every day except Sunday from 15:00 to 17:00.",
     "historyEn": [
      "The Church of St. Polycarp is the oldest church still standing in Izmir. It takes its name from St. Polycarp, one of the disciples of the Apostle John, who was bishop of Smyrna for about fifty years. Because he refused to deny Christ, around the year 155 they tried to burn him alive in the stadium of Smyrna, and when the flames did not touch him he was killed with a dagger. He has been regarded as the patron saint of Izmir ever since.",
      "The church’s story begins in 1625 with a chapel opened in the French Consulate building, with permission from the Ottoman authorities. In 1630 a church and friary were built in place of the chapel on the archdiocese’s present grounds, and St. Polycarp became the church of the French community. The building was destroyed in the great earthquake of 1688, and the present church was built in its place in 1690.",
      "Damaged and repaired many times, the church was enlarged in 1898 and received its present splendid decoration. Raymond Péré, a young French painter and architect who settled in Izmir at the end of the 19th century, painted the frescoes, which also tell the story of St. Polycarp’s martyrdom. The church’s name is linked with Izmir’s emblem, the Clock Tower.",
      "For centuries the church was served by the Capuchin Franciscan friars; the order left the friary in 1984. The present friary building was built in 1929 to replace the old one destroyed in the great Izmir fire of 1922."
     ]
    },
    {
     "id": "santo-rosario-izmir",
     "lat": 38.43842,
     "lon": 27.1429,
     "short": "Santo Rosario (Alsancak)",
     "name": "Notre Dame du Rosaire Kilisesi (Santo Rosario)",
     "rite": "latin",
     "district": "Alsancak, Konak",
     "address": "1481 Sokak No: 8, Alsancak, Konak, İzmir",
     "phones": [
      "0232 421 66 66"
     ],
     "email": "alsancakkatolikkilisesi@gmail.com",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 İtalyanca · 18:30 Türkçe (Ocak–Mayıs; yazın 19:00) · ayda bir 17:00 İspanyolca"
      ],
      [
       "Pazartesi, salı, çarşamba, cuma (Ocak–Mayıs)",
       "18:10 Tespih Duası · 18:30 ayin"
      ],
      [
       "Hafta içi (Haziran–Eylül)",
       "09:00"
      ],
      [
       "Perşembe",
       "10:00"
      ],
      [
       "Cumartesi (Ekim–Mayıs)",
       "17:00 Türkçe"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Alsancak’taki Kutsal Tespih Kilisesi, İzmir’deki Latin Katolik cemaatinin merkezlerinden biridir ve kuruluşundan beri Dominiken rahiplere bağlıdır. Ermeni Dominiken rahipleri 1718’de İzmir’e geldi ve 1755’te ilk evlerini, cemaat için de bir misafirhane açtı. 1813’ten itibaren İtalyan Dominikenler cemaate hizmet etmeye başladı.",
      "1859’da Aziz Petrus ve Pavlus’a adanmış ilk kilise tamamlandı. Kutsal Tespih onuruna yapılacak yeni kilisenin temel taşı 4 Ekim 1903’te kondu ve kilise 1 Ekim 1904’te cemaate açıldı. 1922’deki büyük İzmir yangını çevredeki mahalleleri yok ederken kilise, cemaatin deyişiyle mucizevi bir şekilde, hiçbir zarar görmeden ayakta kaldı.",
      "İkinci Vatikan Konsili’nin ardından, 1965’te sunak ve çevresi yeni litürjiye göre yenilendi. Ermeni Dominikenler İzmir’e gelirken en değerli emanetlerini de yanlarında getirmişti: bugün ABD’deki bir kilisede korunan Havari Yahuda Tadday’ın kolu, Longinus’un mızrağı olarak saygı gören bir emanet ve Tespihin Meryem Ana’sının gümüş bir heykeli. Rahipler bu heykeli, İzmir’deki ilk günlerinde onları Aziz Polikarp Kilisesi’nde ağırlayan Kapuçinlere minnet hediyesi olarak verdiler."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Notre Dame du Rosaire Kilisesi",
       "https://izmirkatolikkilisesi.com/santo-rosario/",
       "Catholic Archdiocese of Izmir: Church of Notre Dame du Rosaire (Santo Rosario)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of Notre Dame du Rosaire (Santo Rosario)",
     "shortEn": "Santo Rosario (Alsancak)",
     "massEn": [
      [
       "Sunday",
       "11:00 Italian · 18:30 Turkish (January–May; 19:00 in summer) · 17:00 Spanish once a month"
      ],
      [
       "Monday, Tuesday, Wednesday, Friday (January–May)",
       "18:10 Rosary · 18:30 Mass"
      ],
      [
       "Weekdays (June–September)",
       "09:00"
      ],
      [
       "Thursday",
       "10:00"
      ],
      [
       "Saturday (October–May)",
       "17:00 Turkish"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Church of the Holy Rosary in Alsancak is one of the centers of the Latin Catholic community in Izmir and has been attached to the Dominican friars since its foundation. Armenian Dominican friars came to Izmir in 1718 and in 1755 opened their first house, together with a guesthouse for the community. From 1813 on, Italian Dominicans began to serve the community.",
      "In 1859 the first church, dedicated to Saints Peter and Paul, was completed. The foundation stone of a new church in honor of the Holy Rosary was laid on 4 October 1903, and the church opened to the community on 1 October 1904. When the great Izmir fire of 1922 destroyed the surrounding neighborhoods, the church remained standing without any damage, miraculously, as the community puts it.",
      "After the Second Vatican Council, the altar and sanctuary were renewed in 1965 in line with the new liturgy. When the Armenian Dominicans came to Izmir they brought their most precious relics with them: the arm of the Apostle Jude Thaddeus, now kept in a church in the United States, a relic venerated as the lance of Longinus, and a silver statue of Our Lady of the Rosary. The friars gave this statue as a gift of thanks to the Capuchins, who had welcomed them at the Church of St. Polycarp in their first days in Izmir."
     ]
    },
    {
     "id": "santa-maria-izmir",
     "lat": 38.42655,
     "lon": 27.13473,
     "short": "Santa Maria (Pasaport)",
     "name": "Santa Maria Kilisesi",
     "rite": "latin",
     "district": "Pasaport, Konak",
     "address": "Akdeniz Mah., Halit Ziya Bulvarı No: 67, Pasaport, Konak, İzmir",
     "phones": [],
     "email": "",
     "website": "",
     "status": "limited",
     "notice": "İzmir Katolik Başepiskoposluğu’na göre kilise şu anda Ortodoks kilisesi olarak kullanılmaktadır; Katolik ayini yapılmamaktadır. CET’in 2023 listesinde pazar 11:00 İtalyanca ayin geçiyordu; gitmeden önce teyit edin.",
     "mass": [
      [
       "Katolik ayini",
       "Şu anda yok (kilise Ortodoks ibadetine açık)."
      ]
     ],
     "massNote": "",
     "visits": "Ziyaret için önceden bilgi alın.",
     "history": [
      "Santa Maria, İzmir’in en eski Katolik kiliselerinden biridir. 14. yüzyılda İtalyan Fransisken rahipler, bugünkü yerin yakınında Meryem Ana’ya adanmış bir kilise yaptılar; bu yapı 1688 depreminde hasar gördü. 1692’de bugünkü yerde yeni bir kilise ve manastırın inşasına başlandı; Hollandalılar da inşaata katkıda bulundu. Kilise 25 Aralık 1698’de kutsandı. O dönem kıyıda olan semt, burada yaşayan Maltalı göçmenler yüzünden Maltezika diye anılıyordu.",
      "1865’e kadar İtalyan Katolikler, Raguzalılar ve Avusturyalılar kilisenin bahçesine gömüldü. 1866’da kurulan Sant’Antonio Hastanesi’ni kilisenin Fransisken rahipleri yönetti. 16 Ağustos 1889 yangınında hasar gören kilise, 1890’dan 1919’a kadar Avusturya-Macaristan’ın himayesindeydi; bu dönemde tavanı demir yapılarla güçlendirildi. Manastır binası 1922 yangınında yıkıldı.",
      "İzmir Başepiskoposluğu 1818’de yeniden kurulunca, Aziz Yuhanna Katedrali tamamlanana kadar (1874) başepiskoposun makamı olarak 56 yıl boyunca katedral görevi yaptı; Başepiskopos Mussabini geçici olarak burada gömüldü. Kilisenin orgu 1700 yılına ait, Venedik yapımıdır ve 2014’te Lucien Arkas tarafından eşi Viviana de Zandonati Arkas anısına onartıldı. Son restorasyonu, 2003–2015 arasında burada görev yapan Peder Francesco de Luca yaptırdı."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Santa Maria Katolik Kilisesi",
       "https://izmirkatolikkilisesi.com/santa-maria/",
       "Catholic Archdiocese of Izmir: Church of Santa Maria"
      ],
      [
       "Vikipedi: Santa Maria Katolik Kilisesi (Konak)",
       "https://tr.wikipedia.org/wiki/Santa_Maria_Katolik_Kilisesi_(Konak)",
       "Wikipedia (Turkish): Church of Santa Maria"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "nameEn": "Church of Santa Maria",
     "shortEn": "Santa Maria (Pasaport)",
     "massEn": [
      [
       "Catholic Mass",
       "None at the moment; the church is currently used for Orthodox worship."
      ]
     ],
     "visitsEn": "Ask in advance before visiting.",
     "noticeEn": "According to the Catholic Archdiocese of Izmir, the church is currently used as an Orthodox church; no Catholic Mass is celebrated. The CET’s 2023 list gave a Sunday Mass in Italian at 11:00; check before you go.",
     "historyEn": [
      "Santa Maria is one of the oldest Catholic churches in Izmir. In the 14th century Italian Franciscan friars built a church dedicated to the Virgin Mary near the present site; that building was damaged in the earthquake of 1688. In 1692 work began on a new church and friary on the present site, with the Dutch also contributing to the building. The church was consecrated on 25 December 1698. The neighborhood, then on the shore, was known as Maltezika after the Maltese immigrants who lived there.",
      "Until 1865 Italian Catholics, Ragusans and Austrians were buried in the church garden. The Sant’Antonio Hospital, founded in 1866, was run by the church’s Franciscan friars. Damaged in the fire of 16 August 1889, the church was under the protection of Austria-Hungary from 1890 to 1919; during this period its ceiling was reinforced with iron structures. The friary building was destroyed in the fire of 1922.",
      "When the Archdiocese of Izmir was re-established in 1818, the church served for 56 years as the cathedral, the archbishop’s seat, until St. John’s Cathedral was completed (1874); Archbishop Mussabini was temporarily buried here. The church’s organ, made in Venice, dates from 1700 and was restored in 2014 by Lucien Arkas in memory of his wife, Viviana de Zandonati Arkas. Its latest restoration was carried out by Father Francesco de Luca, who served here from 2003 to 2015."
     ]
    },
    {
     "id": "bornova-meryemin-adi",
     "lat": 38.46566,
     "lon": 27.2199,
     "short": "Meryem’in Kutsal Adı (Bornova)",
     "name": "Meryem’in Kutsal Adı Kilisesi (Saint Nom de Marie)",
     "rite": "latin",
     "district": "Bornova",
     "address": "Erzene Mah., Kazım Karabekir Caddesi No: 4, 35040 Bornova, İzmir",
     "phones": [
      "0232 484 86 32"
     ],
     "email": "bornova@izmirsantamariakilisesi.org",
     "website": "https://www.izmirsantamariakilisesi.org",
     "mass": [
      [
       "Pazartesi–Cuma",
       "08:30 Türkçe"
      ],
      [
       "Cumartesi",
       "17:00 (kış) · 18:00 (yaz), Türkçe"
      ],
      [
       "Pazar",
       "Ayin yok"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Bornova’daki Meryem’in Kutsal Adı Kilisesi, bu semtte yaşayan Levanten ve Katolik aileler için kurulmuştur. Burada yaklaşık yarım yüzyıldır ahşap bir ev ve şapel bulunuyordu; kilise kanonik olarak 1797’de kuruldu. O tarihten önce ayinleri yapmak için İzmir’deki Santa Maria Kilisesi’nin rahipleri gelirdi.",
      "Bugünkü kilise 1831’den beri ayaktadır ve Meryem’in Kutsal Adı’nı taşır. 1925’e kadar cemaatte 500’den fazla Katolik, üç rahip ve rahibeler vardı; cemaatin bir yetimhanesi ve Hayırsever Rahibeler’in yönettiği, 1935’te kapanan bir okulu bulunuyordu.",
      "Kilise 1918’e kadar Avusturya’nın himayesindeydi; 1960’larda yedi farklı milletten 82 Hristiyanın bulunduğu cemaatin resmî dili Fransızca oldu. Kilise kuruluşundan beri Küçük Kardeşler Fransiskenleri’ne (OFM) aittir; bugün cemaatin başında Arjantinli ve Pakistanlı iki rahip bulunur ve ayinler Türkçe yapılır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Meryem’in Kutsal Adı Kilisesi",
       "https://izmirkatolikkilisesi.com/bornova/",
       "Catholic Archdiocese of Izmir: Church of the Holy Name of Mary (Saint Nom de Marie)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of the Holy Name of Mary (Saint Nom de Marie)",
     "shortEn": "Holy Name of Mary (Bornova)",
     "massEn": [
      [
       "Monday–Friday",
       "08:30 Turkish"
      ],
      [
       "Saturday",
       "17:00 (winter) · 18:00 (summer), Turkish"
      ],
      [
       "Sunday",
       "No Mass"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Church of the Holy Name of Mary in Bornova was founded for the Levantine and Catholic families living in this neighborhood. For about half a century there had been a wooden house and chapel here; the church was canonically established in 1797. Before that, priests from the Santa Maria Church in Izmir came to celebrate Mass.",
      "The present church has stood since 1831 and bears the Holy Name of Mary. Until 1925 the community had more than 500 Catholics, three priests and sisters; it had an orphanage and a school run by the Sisters of Charity, which closed in 1935.",
      "The church was under Austrian protection until 1918; in the 1960s, when the community numbered 82 Christians of seven nationalities, its official language became French. Since its foundation the church has belonged to the Friars Minor (OFM); today two priests, from Argentina and Pakistan, lead the community, and Mass is said in Turkish."
     ]
    },
    {
     "id": "buca-vaftizci-yahya",
     "lat": 38.3873,
     "lon": 27.17355,
     "short": "Vaftizci Yahya (Buca)",
     "name": "Vaftizci Aziz Yahya Kilisesi",
     "rite": "latin",
     "district": "Buca",
     "address": "Dumlupınar Mah., 81. Sokak No: 23, 35160 Buca, İzmir",
     "phones": [
      "0232 420 08 42"
     ],
     "email": "",
     "website": "",
     "mass": [
      [
       "Cumartesi",
       "18:00 Türkçe"
      ],
      [
       "Pazar",
       "11:00 Fransızca"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Buca Kilisesi’nin kökeni, 1805’te buradaki yabancı işçiler ve yazlıkçılar için yapılan, boyutları bilinmeyen bir şapele dayanır; şapelde önce bir Fransisken, sonra bir bölge rahibi ayin yapıyordu. Buca 1828’de kanonik bir cemaat oldu.",
      "Vaftizci Yahya’ya adanan bugünkü kilise 1840’a tarihlenir ve 1866’da 64 yaşında ölen ilk bölge rahibi Don Giacomo Vitalis’in on yıllık emeğinin eseridir. Paris’teki Dışişleri arşivlerinde bulunan 1841 tarihli bir fermanın Fransızca çevirisi, kilisenin Fransız himayesindeki bir kurum olarak tanındığını gösterir. 1937–1938’de, Bornova, Samsun ve Yeşilköy kiliselerini de süsleyen Kapuçin dekoratör Peder Agostino da Modica kiliseyi süsledi.",
      "Ekim 1932’den itibaren, bölge rahibi eksikliği nedeniyle kilise İtalya’nın Parma bölgesindeki Kapuçin rahiplerine emanet edildi. 1954 ve 1976’da restorasyonlar yapıldı; org, sunaklar ve yeni papaz evi (1970) eklendi. 2022 yazının sonundan beri Enkarne Söz Rahibeleri (Verbo Incarnato) topluluğu ve bir başepiskoposluk rahibi kilisenin yanındaki binalarda yaşamaktadır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Vaftizci Yuhanna Kilisesi",
       "https://izmirkatolikkilisesi.com/buca/",
       "Catholic Archdiocese of Izmir: Church of St. John the Baptist"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. John the Baptist",
     "shortEn": "St. John the Baptist (Buca)",
     "massEn": [
      [
       "Saturday",
       "18:00 Turkish"
      ],
      [
       "Sunday",
       "11:00 French"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The Buca church has its origins in a chapel of unknown size built in 1805 for the foreign workers and summer residents here; Mass was said in it first by a Franciscan and then by a parish priest. Buca became a canonical parish in 1828.",
      "The present church, dedicated to St. John the Baptist, dates from 1840 and is the fruit of ten years’ work by the first parish priest, Don Giacomo Vitalis, who died in 1866 at the age of 64. A French translation of an 1841 firman in the Foreign Ministry archives in Paris shows that the church was recognized as an institution under French protection. In 1937–1938 the church was decorated by the Capuchin artist Father Agostino da Modica, who also decorated the churches of Bornova, Samsun and Yeşilköy.",
      "From October 1932, for lack of a parish priest, the church was entrusted to the Capuchin friars of the Parma region of Italy. Restorations were carried out in 1954 and 1976, and an organ, altars and a new presbytery (1970) were added. Since the end of summer 2022 a community of the Sisters of the Incarnate Word (Verbo Incarnato) and a priest of the archdiocese have lived in the buildings beside the church."
     ]
    },
    {
     "id": "goztepe-lourdes",
     "lat": 38.39794,
     "lon": 27.09103,
     "short": "Notre-Dame de Lourdes (Göztepe)",
     "name": "Notre-Dame de Lourdes Kilisesi",
     "rite": "latin",
     "district": "Göztepe, Konak",
     "address": "81. Sokak No: 12, 35290 Göztepe, Konak, İzmir",
     "phones": [
      "0536 029 37 56"
     ],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazartesi–Cuma",
       "18:30 Tespih Duası · 19:00 Türkçe ayin"
      ],
      [
       "Cumartesi",
       "Ayin yok"
      ],
      [
       "Pazar",
       "17:00 Türkçe"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Göztepe’deki Notre-Dame de Lourdes cemaati 1900’de Hollandalı rahip Peder Fercken tarafından kuruldu. O yıllarda Göztepe, ağırlıklı olarak Latin Hristiyanların yaşadığı küçük bir köydü. 27 Mayıs 1900’de İzmir Başepiskoposu André Timoni kilisenin açılışını yaptı ve henüz bitmemiş kilisede Lourdes Meryem Ana kardeşliğini kurdu; cemaat üyeleri inşaatın tamamlanmasına küçük katkılarıyla destek oldu.",
      "17 Ekim 1902’de, 400’den fazla üyesi olan kardeşliğin Fransa’daki Lourdes Bazilikası’nın büyük kardeşliğine bağlanması istendi. Raymond Péré’nin tasarladığı Carrara mermerinden yüksek sunak 9 Ekim 1904’te kutsandı; sunağın altında Büyük Aziz Yakup ile Azize Perpetua ve Felicitas’ın rölikleri vardır. Heykellerin ve iki çandan birinin çoğu 1904–1906 arasında bağışçılar tarafından hediye edildi.",
      "Kuruluşundan beri Fransızca konuşan cemaat, 1960’lara kadar canlılığını korudu; Hristiyan nüfusu azaldıkça küçüldü ve yıllarca Alsancak’taki Dominikenler tarafından ayakta tutuldu. 2006’dan itibaren manastır ve kilisede yapılan büyük yenileme, Afrikalı öğrencilerin gelişi ve kilisede kalan bir rahiple cemaat yeniden canlandı. Ayinler bugün Türkçe yapılır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Notre-Dame de Lourdes Kilisesi",
       "https://izmirkatolikkilisesi.com/goztepe/",
       "Catholic Archdiocese of Izmir: Church of Notre-Dame de Lourdes"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of Notre-Dame de Lourdes",
     "shortEn": "Notre-Dame de Lourdes (Göztepe)",
     "massEn": [
      [
       "Monday–Friday",
       "18:30 Rosary · 19:00 Mass in Turkish"
      ],
      [
       "Saturday",
       "No Mass"
      ],
      [
       "Sunday",
       "17:00 Turkish"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The parish of Notre-Dame de Lourdes in Göztepe was founded in 1900 by the Dutch priest Father Fercken. In those years Göztepe was a small village inhabited mostly by Latin Christians. On 27 May 1900 the Archbishop of Izmir, André Timoni, opened the church and founded the confraternity of Our Lady of Lourdes in the still unfinished church; members of the community supported the completion of the building with their small contributions.",
      "On 17 October 1902 the confraternity, which by then had more than 400 members, asked to be affiliated with the great confraternity of the Basilica of Lourdes in France. The high altar of Carrara marble designed by Raymond Péré was consecrated on 9 October 1904; beneath it are relics of St. James the Great and of Saints Perpetua and Felicity. Most of the statues and one of the two bells were given by benefactors between 1904 and 1906.",
      "French-speaking since its foundation, the community kept its vitality until the 1960s; as the Christian population declined it shrank, and for years it was kept alive by the Dominicans of Alsancak. From 2006, with a major renovation of the friary and church, the arrival of African students and a priest living at the church, the community came back to life. Mass is said in Turkish today."
     ]
    },
    {
     "id": "karsiyaka-helena",
     "lat": 38.456,
     "lon": 27.11,
     "approx": true,
     "short": "Azize Helena (Karşıyaka)",
     "name": "Azize Helena Kilisesi (Saint Hélène)",
     "rite": "latin",
     "district": "Karşıyaka",
     "address": "Donanmacı Mah., 1729 Sokak No: 53, 35530 Karşıyaka, İzmir",
     "phones": [
      "0232 364 36 22"
     ],
     "email": "azizehelena@gmail.com",
     "website": "",
     "mass": [
      [
       "Pazar",
       "09:30 Tespih Duası · 10:00 Türkçe ayin"
      ],
      [
       "Salı–Cumartesi",
       "17:30 Tespih Duası · 18:00 Türkçe ayin"
      ],
      [
       "Pazartesi",
       "Ayin yok"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "Karşıyaka’daki ilk Katolik aileler 1880’de kayda geçti; 1882’de sayıları yirmiyi bulunca Başepiskopos Timoni, Don Valery’yi ilk rahip olarak atadı. O yıllarda cemaatin yalnızca derme çatma bir şapeli vardı.",
      "Bugünkü kilisenin inşasına 1904’te Fransız mimar Raymond Charles Péré’nin tasarımıyla başlandı ve yaklaşık on yılda tamamlandı. Yapımına Sultan II. Abdülhamid’in fermanıyla izin verildi; bu belge 1926’da Türkiye Cumhuriyeti belgesine dönüştürüldü. Kilise, İmparator I. Konstantin’in annesi ve Kudüs’te Kutsal Haç’ı bulan Azize Helena’ya adanmıştır.",
      "Bazilika planlı, üç nefli kilise, 19. yüzyılda moda olan yeni-gotik üsluptadır. Ana sunağın arkasında, taç giymiş ve Haç’ı tutan bir imparatoriçe olarak Azize Helena’nın tasviri vardır; sunağın iki yanında Aziz Yusuf ve İzmir’in koruyucu azizi Aziz Polikarp’ın heykelleri, yan sunaklarda Fatima Meryem Ana’sı ve İsa’nın Kutsal Kalbi’nin heykelleri bulunur.",
      "Kilise 1951’de Kapuçin rahiplerine emanet edildi. 1979’da cemaat yaklaşık 90 aile ve 280 kişiden oluşuyordu; yarısından fazlası Türk vatandaşıydı. Azize Helena bugün Karşıyaka’daki tek etkin kilisedir ve Konventüel Fransisken bir rahip tarafından yönetilir."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Azize Helena Kilisesi",
       "https://izmirkatolikkilisesi.com/karsiyaka/",
       "Catholic Archdiocese of Izmir: Church of St. Helena (Saint Hélène)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Helena (Saint Hélène)",
     "shortEn": "St. Helena (Karşıyaka)",
     "massEn": [
      [
       "Sunday",
       "09:30 Rosary · 10:00 Mass in Turkish"
      ],
      [
       "Tuesday–Saturday",
       "17:30 Rosary · 18:00 Mass in Turkish"
      ],
      [
       "Monday",
       "No Mass"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "The first Catholic families in Karşıyaka were recorded in 1880; in 1882, when they numbered twenty, Archbishop Timoni appointed Don Valery as their first priest. At that time the community had only a makeshift chapel.",
      "Work on the present church began in 1904 to a design by the French architect Raymond Charles Péré and was completed in about ten years. Its construction was permitted by a firman of Sultan Abdülhamid II; in 1926 it was re-registered as a document of the Republic of Turkey. The church is dedicated to St. Helena, mother of the Emperor Constantine I, who found the Holy Cross in Jerusalem.",
      "The basilica-plan, three-aisled church is in the neo-Gothic style fashionable in the 19th century. Behind the high altar is an image of St. Helena as an empress, crowned and holding the Cross; on either side of the altar are statues of St. Joseph and of St. Polycarp, patron saint of Izmir, and on the side altars are statues of Our Lady of Fatima and the Sacred Heart of Jesus.",
      "The church was entrusted to the Capuchin friars in 1951. In 1979 the community numbered about 90 families and 280 people, more than half of them Turkish citizens. St. Helena is today the only active church in Karşıyaka and is run by a Conventual Franciscan priest."
     ]
    },
    {
     "id": "bayrakli-antuan",
     "lat": 38.46599,
     "lon": 27.16421,
     "short": "Aziz Antuan (Bayraklı)",
     "name": "Aziz Antuan Kilisesi (Saint Antoine)",
     "rite": "latin",
     "district": "Bayraklı",
     "address": "Fuat Edip Baksı (1610) Sokak No: 5, 35540 Bayraklı, İzmir",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 Türkçe"
      ],
      [
       "Pazartesi–Cumartesi",
       "11:00 Türkçe"
      ],
      [
       "Salı",
       "13:00 Türkçe (Padre Pio grubu)"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır; yaz ve kış dönemlerinde değişebilir.",
     "visits": "Ayin saatlerinde açıktır.",
     "history": [
      "1898’de Sultan II. Abdülhamid, Bayraklı tepesini Yahya Hayati Paşa ile Transibullo Pittako’ya verdi. İkili, deniz manzaralı bu yeşil tepede yeni bir köy kurmak istedi; İzmir’den gelen pek çok Katolik aile buraya yazlık evler yaptı. Köyü büyütmek isteyen kurucular Katoliklere, Ermenilere, Ortodokslara ve Müslümanlara ibadethane yapmaları için ücretsiz arazi verdi.",
      "1899’da Kapuçin rahip Giambattista da San Lorenzo, Bayraklı’daki tanıdığı bir aileyi ziyarete geldi; aileler, paşanın onlara bağışladığı araziyi bir kilise ve manastır için Kapuçinlere vermek istediklerini söyledi. 1901’de episkopos izin verdi. 29 Haziran 1902’de Mattesich ailesinin evinde, 30 kişinin katıldığı ilk Katolik ayini kutlandı.",
      "Belediyenin tereddütlerine ve padişahtan ferman bekleme sürecine rağmen kilisenin ilk taşı 14 Temmuz 1902’de, manastırınki 7 Ağustos 1902’de kondu; o sırada Bayraklı’da 300 Katolik aile yaşıyordu. İlk sürekli rahip Bernardo da Castelmine 1903’te yerleşti, aynı yıl sultanın fermanı geldi ve bir Hristiyan mezarlığı kuruldu. 1904’te manastırın yanında altı sınıflı bir İtalyan okulu açıldı. 19 Nisan 1905’te, kilisenin henüz yalnızca duvarları varken kutlanan Aziz Espedito bayramına 4000 kişi katıldı.",
      "Kilisedeki ilk resmî tören 13 Ağustos 1922’de yapıldı. Yapının eskiden iki çan kulesi vardı; biri büyük bir depremden sonra yıkıldı. Manastır ve kilise 1990’da bugünkü hâlini aldı ve bölgedeki küçük Hristiyan cemaatine hizmet etmeye devam ediyor."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Antuan Kilisesi",
       "https://izmirkatolikkilisesi.com/bayrakli/",
       "Catholic Archdiocese of Izmir: Church of St. Anthony (Saint Antoine)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "merkez",
     "status": "active",
     "notice": "",
     "nameEn": "Church of St. Anthony (Saint Antoine)",
     "shortEn": "St. Anthony (Bayraklı)",
     "massEn": [
      [
       "Sunday",
       "11:00 Turkish"
      ],
      [
       "Monday–Saturday",
       "11:00 Turkish"
      ],
      [
       "Tuesday",
       "13:00 Turkish (Padre Pio group)"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir; they may change between summer and winter.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "In 1898 Sultan Abdülhamid II gave the hill of Bayraklı to Yahya Hayati Pasha and Transibullo Pittako. The two wanted to found a new village on this green hill overlooking the sea; many Catholic families from Izmir built summer houses here. Eager to see the village grow, the founders gave free land to Catholics, Armenians, Orthodox and Muslims to build places of worship.",
      "In 1899 the Capuchin friar Giambattista da San Lorenzo came to visit a family he knew in Bayraklı; the families told him they wished to give the Capuchins the land the pasha had donated to them, for a church and friary. In 1901 the bishop gave his permission. On 29 June 1902 the first Catholic Mass was celebrated in the house of the Mattesich family, with 30 people present.",
      "Despite the municipality’s hesitation and the wait for the sultan’s firman, the first stone of the church was laid on 14 July 1902 and that of the friary on 7 August 1902; at the time, 300 Catholic families lived in Bayraklı. The first resident priest, Bernardo da Castelmine, settled in 1903; the same year the sultan’s firman arrived and a Christian cemetery was established. In 1904 a six-class Italian school opened beside the friary. On 19 April 1905, 4,000 people attended the feast of St. Expeditus, celebrated while the church was still only bare walls.",
      "The first official ceremony in the church took place on 13 August 1922. The building once had two bell towers; one collapsed after a major earthquake. The friary and church took their present form in 1990 and continue to serve the area’s small Christian community."
     ]
    },
    {
     "id": "meryem-ana-evi",
     "map": "selcuk",
     "lat": 37.91156,
     "lon": 27.33401,
     "short": "Meryem Ana Evi",
     "name": "Meryem Ana Evi (Efes)",
     "rite": "latin",
     "district": "Bülbüldağı, Selçuk",
     "address": "Atatürk Mah., Meryem Ana Mevkii Küme Evleri, 35922 Selçuk, İzmir",
     "phones": [
      "0232 894 10 14",
      "0530 469 08 44"
     ],
     "email": "meryemanaevi@gmail.com",
     "website": "https://www.hzmeryemanaevi.com",
     "mass": [
      [
       "Pazar",
       "10:30 İngilizce"
      ],
      [
       "Pazartesi–Cumartesi",
       "Akşam ayini: 17:15 (Kasım–Mart) · 18:15 (Nisan–Ekim)"
      ],
      [
       "Sabah ayini",
       "07:15 (tatil ve bayram günlerinde 10:30), kilisenin kendi sitesine göre"
      ]
     ],
     "massNote": "Kaynaklar farklı saat veriyor: Meryem Ana Evi’nin kendi sitesi (2026) normal günlerde her sabah 07:15’te, tatil ve bayram günlerinde 10:30’da ayin yapıldığını yazıyor; başepiskoposluğun sitesinde hafta içi 18:15’te Tespih Duası geçiyor, CET 2023 listesi ve weekdaymasses ise akşam ayini (17:15 / 18:15) veriyor. Gitmeden telefonla teyit edin. Hac grupları için ayin önceden ayarlanabilir.",
     "visits": "Meryem Ana Evi’nin bulunduğu alan her gün ziyaretçilere açıktır; giriş ücretlidir ve saatler mevsime göre değişir.",
     "history": [
      "Bülbüldağı’nın yamacındaki Meryem Ana Evi, geleneğe göre Meryem Ana’nın hayatının son yıllarını Havari Yuhanna ile birlikte geçirdiği evdir. Yuhanna’nın Efes’te yaşadığı ve öldüğü eski kaynaklarda anlatılır; mezarının kalıntıları bugün Selçuk’taki Aziz Yuhanna Bazilikası’ndadır.",
      "Evin yeri 19. yüzyılın sonunda, Alman mistik Anna Katharina Emmerich’in anlatılarından yola çıkan araştırmalarla belirlendi. 1891’de İzmir’deki Lazarist rahipler, Başepiskopos Andrea Timoni’nin desteğiyle yaptıkları arayışta bugünkü kalıntıları buldu. Eski temeller üzerinde yükselen küçük taş şapel restore edilerek ibadete açıldı.",
      "Meryem Ana Evi hem Hristiyanlar hem de Meryem’i saygıyla anan Müslümanlar için önemli bir ziyaret yeridir. Papa VI. Pavlus (1967), II. Jean Paul (1979) ve XVI. Benedictus (2006) burayı ziyaret etti. Şapel bugün İzmir Başepiskoposluğu’na bağlı Kapuçin rahipleri tarafından hizmet görür; her yıl 15 Ağustos’ta Meryem Ana’nın Göğe Alınışı bayramı burada kutlanır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Meryem Ana Evi Kilisesi",
       "https://izmirkatolikkilisesi.com/meryem-ana-evi/",
       "Catholic Archdiocese of Izmir: House of the Virgin Mary (Ephesus)"
      ],
      [
       "Meryem Ana Evi resmi sitesi",
       "https://www.hzmeryemanaevi.com",
       "House of the Virgin Mary, official website"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "selcuk",
     "status": "active",
     "notice": "",
     "nameEn": "House of the Virgin Mary (Ephesus)",
     "shortEn": "House of the Virgin Mary",
     "massEn": [
      [
       "Sunday",
       "10:30 English"
      ],
      [
       "Monday–Saturday",
       "Evening Mass: 17:15 (November–March) · 18:15 (April–October)"
      ],
      [
       "Morning Mass",
       "07:15 (10:30 on holidays and feast days), according to the shrine’s own website"
      ]
     ],
     "massNoteEn": "The sources give different times: the shrine’s own website (2026) says Mass is held every morning at 07:15 on ordinary days and at 10:30 on holidays and feast days; the archdiocese’s website lists the Rosary at 18:15 on weekdays, while the CET’s 2023 list and weekdaymasses give an evening Mass (17:15 / 18:15). Please confirm by phone before you go. Mass can be arranged in advance for pilgrim groups.",
     "visitsEn": "The site of the House of the Virgin Mary is open to visitors every day; there is an entrance fee, and the hours vary with the season.",
     "historyEn": [
      "The House of the Virgin Mary, on the slope of Bülbüldağı (Mount Koressos), is according to tradition the house where the Virgin Mary spent the last years of her life together with the Apostle John. Ancient sources tell that John lived and died in Ephesus; the remains of his tomb are today in the Basilica of St. John in Selçuk.",
      "The site of the house was identified at the end of the 19th century through research based on the accounts of the German mystic Anne Catherine Emmerich. In 1891 the Lazarist priests of Izmir, in a search supported by Archbishop Andrea Timoni, found the present remains. The small stone chapel standing on the old foundations was restored and opened for worship.",
      "The House of the Virgin Mary is an important place of pilgrimage both for Christians and for Muslims who revere Mary. Popes Paul VI (1967), John Paul II (1979) and Benedict XVI (2006) visited it. Today the chapel is served by Capuchin friars of the Archdiocese of Izmir; every year on 15 August the feast of the Assumption is celebrated here."
     ]
    },
    {
     "id": "selcuk-aziz-yuhanna",
     "map": "selcuk",
     "lat": 37.95282,
     "lon": 27.3679,
     "approx": true,
     "short": "Aziz Yuhanna (Selçuk)",
     "name": "Aziz Yuhanna Katolik Kilisesi (Selçuk)",
     "rite": "latin",
     "district": "Selçuk",
     "address": "Atatürk Mah., 1050 Sokak No: 1, 35920 Selçuk, İzmir",
     "phones": [
      "0232 894 10 14"
     ],
     "email": "meryemanaevi@gmail.com",
     "website": "",
     "mass": [
      [
       "Pazar",
       "15:00 Türkçe"
      ]
     ],
     "massNote": "CET’in 2023 listesinde pazar ayini 10:00 olarak geçiyordu; başepiskoposluğun sitesi 15:00 veriyor.",
     "visits": "Ayin saatinde açıktır.",
     "history": [
      "Selçuk’taki bu küçük Katolik ibadet yeri, “Selçuk Katolik Kilisesi Derneği” adıyla kurulmuştur ve Efes’i ziyaret eden hacılar ile ilçede yaşayan Katolikler için pazar ayinleri düzenler. Kilise, Meryem Ana Evi ile aynı rahip topluluğu tarafından hizmet görür.",
      "Selçuk, Havari Yuhanna’nın hayatının son yıllarını geçirdiği ve gömüldüğü yer olarak kabul edilir; Ayasuluk Tepesi’ndeki büyük Aziz Yuhanna Bazilikası’nın kalıntıları kilisenin yakınındadır. 431’deki Efes Konsili, Meryem’in “Tanrı’nın Annesi” (Theotokos) olduğunu burada ilan etmiştir."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Yuhanna Katolik Kilisesi Derneği",
       "https://izmirkatolikkilisesi.com/aziz-yuhanna-selcuk/",
       "Catholic Archdiocese of Izmir: St. John’s Catholic Church (Selçuk)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "selcuk",
     "status": "active",
     "notice": "",
     "nameEn": "St. John’s Catholic Church (Selçuk)",
     "shortEn": "St. John (Selçuk)",
     "massEn": [
      [
       "Sunday",
       "15:00 Turkish"
      ]
     ],
     "massNoteEn": "The CET’s 2023 list gave the Sunday Mass as 10:00; the archdiocese’s website gives 15:00.",
     "visitsEn": "Open during Mass times.",
     "historyEn": [
      "This small Catholic place of worship in Selçuk was founded under the name “Selçuk Catholic Church Association” and holds Sunday Masses for pilgrims visiting Ephesus and for the Catholics living in the town. The church is served by the same community of priests as the House of the Virgin Mary.",
      "Selçuk is held to be the place where the Apostle John spent the last years of his life and was buried; the remains of the great Basilica of St. John on Ayasuluk Hill are near the church. It was here, at the Council of Ephesus in 431, that Mary was proclaimed “Mother of God” (Theotokos)."
     ]
    }
   ],
   "nameEn": "Izmir"
  },
  {
   "id": "bursa",
   "name": "Bursa",
   "lat": 40.19,
   "lon": 29.06,
   "label": [
    0,
    21,
    "middle"
   ],
   "open": "r",
   "churches": [
    {
     "id": "aziz-meryem-bursa",
     "lat": 40.18039,
     "lon": 29.06631,
     "short": "Aziz Meryem (Fransız Kilisesi)",
     "name": "Aziz Meryem Fransız Kilisesi",
     "rite": "latin",
     "district": "Hocaalizade, Osmangazi",
     "address": "Hocaalizade Mah., Osmangazi, Bursa",
     "phones": [],
     "email": "",
     "website": "",
     "status": "closed",
     "notice": "Kilise, Bursa Vakıflar Bölge Müdürlüğü tarafından depreme dayanıksız olduğu gerekçesiyle tahliye edildi ve kapatıldı. Son ayin 16 Şubat 2025 Pazar günü yapıldı; yeniden ne zaman açılacağı bilinmiyor. Cemaatlere başka bir kilise tahsis edilmedi; Hristiyanlar ibadetlerini şimdilik Bursa Protestan Kilisesi Yaşam ve Kültür Vakfı’nın binasında sürdürüyor.",
     "mass": [
      [
       "Şu anda",
       "Ayin yapılmıyor (kilise kapalı)."
      ]
     ],
     "massNote": "",
     "visits": "Kapalı.",
     "history": [
      "Hocaalizade semtindeki Aziz Meryem Kilisesi, 19. yüzyılın sonunda Bursa’da yaşayan Fransız kökenli tüccarlar ve Hayırsever Rahibeler (Filles de la Charité) için yapıldı; kaynaklar 1881’de gayrimüslimlerin ibadetine açıldığını belirtir. Yapının içinde bir dispanser, yetimhane ve hasta bakım yeri de bulunuyordu. Kilisenin iç süslemesi 1927’de Asumsiyonist rahip Prosper Lamerand ile bir Rus ressam tarafından yapıldı.",
      "Dikdörtgen planlı, tek nefli kilisenin cephesi sade bir gövdeye sahiptir; ana duvarların üzerinde yükselen kademeli kuleler, sivri kemerli pencereler ve gotik üslup yapıya hareket katar. Kilise 1960’tan sonra kullanılmadı; 1971’de kısa bir süre asıl işlevine döndü ve 1970’lerde İtalya’dan gelen ailelerin ibadetine açıldı.",
      "Farklı dinlerin, dillerin ve kültürlerin bir arada yaşadığı Bursa’nın bu yüzünü de yansıtmak amacıyla, kilise 2004’te Bursa Büyükşehir Belediyesi tarafından sosyal, kültürel ve dinî işlevli bir yapı olarak restore edildi. Yaklaşık yirmi yıl boyunca Katolik, Ortodoks ve Protestan cemaatlerin birlikte ibadet ettiği, dünyada eşine az rastlanır bir kilise oldu.",
      "Temmuz 2024’te Vakıflar Bölge Müdürlüğü, kilisenin hamamlar bölgesinde bulunduğunu, yeraltı su seviyesinin yüksek olduğunu, zeminde sıvılaşma riski ve fay hattı nedeniyle gerilim biriktiğini belirterek tahliye istedi. Cemaatin Jeoloji Mühendisleri Odası’na bağlı bir ofise hazırlattığı rapor ise riskin iddia edilenden çok daha düşük olduğunu söylüyordu. Mahkeme süreci tahliyeyle sonuçlandı ve son ayin 16 Şubat 2025’te yapıldı. Kilisenin kapanması, İznik Konsili’nin 1700. yıl dönümü için 2025’te bölgeye gelen Hristiyan hacılar için de önemli bir eksiklik oldu."
     ],
     "sources": [
      [
       "Agos: Bursa’nın ibadete açık tek kilisesi kapatıldı",
       "https://www.agos.com.tr/tr/haber/bursanin-ibadete-acik-tek-kilisesi-kapatildi-32298",
       "Agos: Bursa’s only church open for worship is closed (in Turkish)"
      ],
      [
       "ANKA: Bursa Fransız Kilisesi’nde son kez ibadet yapıldı",
       "https://ankahaber.net/haber/detay/depreme_dayaniksiz_oldugu_gerekcesiyle_tahliyesi_istenen_bursa_fransiz_kilisesinde_son_kez_ibadet_yapildi_220908",
       "ANKA: last service held at Bursa’s French Church (in Turkish)"
      ],
      [
       "Kültür Portalı: Fransız Kilisesi (Bursa)",
       "https://www.kulturportali.gov.tr/turkiye/bursa/gezilecekyer/fransiz-kilisesi",
       "Kültür Portalı (Culture Portal): the French Church (Bursa)"
      ]
     ],
     "side": "",
     "nameEn": "French Church of St. Mary",
     "shortEn": "St. Mary (French Church)",
     "massEn": [
      [
       "Currently",
       "No Mass (the church is closed)."
      ]
     ],
     "visitsEn": "Closed.",
     "noticeEn": "The church was evacuated and closed by the Bursa Regional Directorate of Foundations on the grounds that it is not earthquake-safe. The last Mass was held on Sunday, 16 February 2025; it is not known when it will reopen. No other church has been allocated to the congregations; for now, Christians worship in the building of the Bursa Protestant Church Life and Culture Foundation.",
     "historyEn": [
      "The Church of St. Mary in the Hocaalizade neighborhood was built at the end of the 19th century for French merchants living in Bursa and for the Daughters of Charity (Filles de la Charité); sources say it opened for non-Muslim worship in 1881. The building also housed a dispensary, an orphanage and a place for nursing the sick. The church’s interior was decorated in 1927 by the Assumptionist priest Prosper Lamerand and a Russian painter.",
      "The rectangular, single-nave church has a plain body; the stepped towers rising above the main walls, the pointed-arch windows and the Gothic style give the building movement. The church fell out of use after 1960; in 1971 it briefly returned to its original purpose, and in the 1970s it was opened for worship to families arriving from Italy.",
      "To reflect this side of Bursa, where different religions, languages and cultures lived side by side, the church was restored in 2004 by the Bursa Metropolitan Municipality as a building with social, cultural and religious uses. For about twenty years it was something rare anywhere in the world: a church where Catholic, Orthodox and Protestant congregations worshipped side by side.",
      "In July 2024 the Regional Directorate of Foundations requested its evacuation, stating that the church stands in the area of the thermal baths, that the groundwater level is high, and that there is a risk of soil liquefaction and stress building up along a fault line. A report the congregation commissioned from an office attached to the Chamber of Geological Engineers, however, found the risk to be much lower than claimed. The court case ended in evacuation, and the last Mass was held on 16 February 2025. The church’s closure was also a real loss for the Christian pilgrims who came to the region in 2025 for the 1700th anniversary of the Council of Nicaea."
     ]
    }
   ]
  },
  {
   "id": "ankara",
   "name": "Ankara",
   "lat": 39.93,
   "lon": 32.86,
   "label": [
    11,
    5,
    "start"
   ],
   "open": "r",
   "churches": [
    {
     "id": "azize-tereza-ankara",
     "lat": 39.93973,
     "lon": 32.86158,
     "short": "Azize Tereza (Ulus)",
     "name": "Azize Tereza Kilisesi",
     "rite": "latin",
     "district": "Ulus, Altındağ",
     "address": "Kale Mah., Kardeşler Sokak No: 15, 06250 Altındağ, Ankara",
     "phones": [
      "0312 311 01 18 (14:00–17:00)"
     ],
     "email": "bilgi@ankarakatolik.com",
     "website": "https://www.ankarakatolik.com/tr/",
     "mass": [
      [
       "Pazar",
       "11:30 Türkçe"
      ],
      [
       "Çarşamba",
       "18:00 Türkçe"
      ]
     ],
     "massNote": "Paskalya ve Noel gibi bayramlarda saatler değişir; kilisenin “Duyurular” sayfasında ilan edilir.",
     "visits": "Salı–cumartesi 14:00–17:00 arası ziyarete açıktır.",
     "history": [
      "Azize Tereza Kilisesi, Ankara’nın tarihî merkezi Ulus’ta, Kardeşler Sokağı’ndadır. 1915’te burada, Hristiyan Okulların Kardeşleri (Frères des Écoles Chrétiennes) tarafından yönetilen Aziz Klement Fransız Koleji bulunuyordu; bölge o dönem eski Ermeni mahallesine de yakındı. Sokak, Fransızca öğreten bu kardeşlerin anısına “Kardeşler Sokağı” adını aldı.",
      "1916’daki büyük Ankara yangınında kolej ve çevresindeki bütün semt yandı; kolejden yalnızca bir duvar kaldı. 1928’de eski kolejin arsasına, zemin katında Fransa Büyükelçiliği kançılaryasını, birinci katında ise bir salon ve küçük bir şapeli barındıran bir bina yapıldı. İlk yıllarda Fransa konsolosu burada oturdu; daireler sonraları 1962’ye kadar küçük bir Fransız okuluna verildi.",
      "Binanın en değerli bölümü, birinci kattaki ve 2002’de bütünüyle restore edilen şapeldir; restorasyonun ardından Lisieux’lü Azize Tereza’ya adandı. Ana mozaiği, Kapadokya kiliselerinden esinlenen Fransız sanatçı Hervé Vital yaptı: Davut ve Süleyman, mezardan çıkarak dirilmiş İsa’nın uzattığı ele uzanan Âdem ile Havva’yı gösterir. İki yandaki mozaiklerde kucağında Çocuk İsa ile Meryem ve bir elinde İncil tutarak kutsayan Mesih vardır. Haç Madeleine Diener’in eseridir.",
      "Sütun başlıklarındaki koç başları Eski Ahit’teki kurbanları, tavan köşelerindeki buğday başakları ve üzüm salkımları ise Efkaristiya’yı hatırlatır. Yan duvarlardaki vitrayların altısı 1914’te Bordeaux’da D. P. Dagrant tarafından yapıldı; İzmit’teki Fransız Koleji’nin şapelindeydiler, okul 1920’de kapanınca Kadıköy’de saklandılar ve 1952’de buraya takıldılar. Diziyi tamamlayan dört vitray Floransa’da yapıldı. Kilise bugün Cizvit rahipler tarafından yönetilir ve İstanbul Latin Katolik Havarisel Vekilliği’ne bağlıdır."
     ],
     "sources": [
      [
       "Azize Tereza Kilisesi resmi sitesi: Kilisemizin Tarihi",
       "https://www.ankarakatolik.com/tr/kilisemizin-tarihi/",
       "Church of St. Thérèse, official website: the history of our church"
      ],
      [
       "Azize Tereza Kilisesi: İletişim",
       "https://www.ankarakatolik.com/tr/iletisim/",
       "Church of St. Thérèse: Contact"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Church of St. Thérèse",
     "shortEn": "St. Thérèse (Ulus)",
     "massEn": [
      [
       "Sunday",
       "11:30 Turkish"
      ],
      [
       "Wednesday",
       "18:00 Turkish"
      ]
     ],
     "massNoteEn": "Times change for feasts such as Easter and Christmas; they are announced on the church’s “Announcements” page.",
     "visitsEn": "Open to visitors Tuesday to Saturday from 14:00 to 17:00.",
     "historyEn": [
      "The Church of St. Thérèse is on Kardeşler Street in Ulus, the historic center of Ankara. In 1915 the St. Clement French College, run by the Brothers of the Christian Schools (Frères des Écoles Chrétiennes), stood here; at the time the area was also close to the old Armenian quarter. The street took the name “Kardeşler Sokağı” (Brothers’ Street) in memory of these brothers, who taught French.",
      "In the great Ankara fire of 1916 the college and the whole surrounding neighborhood burned down; only one wall of the college remained. In 1928 a building was put up on the site of the old college, with the chancery of the French Embassy on the ground floor and a hall and a small chapel on the first floor. In the early years the French consul lived here; the apartments were later used by a small French school until 1962.",
      "The most precious part of the building is the chapel on the first floor, fully restored in 2002; after the restoration it was dedicated to St. Thérèse of Lisieux. Its main mosaic is by the French artist Hervé Vital, inspired by the churches of Cappadocia: David and Solomon, and Adam and Eve reaching for the hand held out by the risen Christ as he comes out of the tomb. The mosaics on either side show Mary with the Child Jesus in her arms and Christ blessing, holding the Gospel in one hand. The cross is the work of Madeleine Diener.",
      "The rams’ heads on the column capitals recall the sacrifices of the Old Testament, and the ears of wheat and bunches of grapes in the corners of the ceiling recall the Eucharist. Six of the stained-glass windows in the side walls were made in Bordeaux in 1914 by D. P. Dagrant; they were in the chapel of the French College in İzmit, were kept in Kadıköy when the school closed in 1920, and were installed here in 1952. The four windows that complete the series were made in Florence. The church is run today by Jesuit priests and belongs to the Latin Catholic Apostolic Vicariate of Istanbul."
     ]
    },
    {
     "id": "meryem-ana-ankara",
     "lat": 39.87849,
     "lon": 32.87205,
     "short": "Meryem Ana (Çankaya)",
     "name": "Meryem Ana Kilisesi (Vatikan Büyükelçiliği)",
     "rite": "latin",
     "district": "Çankaya",
     "address": "Birlik Mah., 428. Cadde No: 35, Vatikan Büyükelçiliği, Çankaya, Ankara",
     "phones": [
      "0312 495 95 46 (14:00–17:00)"
     ],
     "email": "info@ankarakatolik.com",
     "website": "https://www.ankarakatolik.com/en/",
     "mass": [
      [
       "Cumartesi",
       "18:00 Fransızca"
      ],
      [
       "Pazar",
       "10:00 İngilizce · 11:30 İspanyolca"
      ],
      [
       "Her ayın üçüncü pazarı",
       "Tek ayin: 10:00 (uluslararası)"
      ],
      [
       "Pazartesi ve cuma",
       "19:00"
      ],
      [
       "Salı ve çarşamba",
       "08:00"
      ],
      [
       "Perşembe",
       "12:00"
      ]
     ],
     "massNote": "Kilise yalnızca ayin saatlerinde dışarıdan gelen cemaate açılır.",
     "visits": "Yalnızca ayin saatlerinde açıktır.",
     "history": [
      "Meryem Ana Kilisesi, Ankara’da yaşayan uluslararası Katolik topluluğunun ibadet yeridir. Vatikan’ın Türkiye Büyükelçiliği’nin (Apostolik Nunsiyatür) bahçesinde bulunur ve dünyanın dört bir yanından gelen, farklı kültür ve sosyal çevrelerden insanları bir araya getirir.",
      "Cemaatte diplomatlar, misyon görevlileri ve özellikle Afrika ülkelerinden gelen çok sayıda üniversite öğrencisi vardır. Ayinler Fransızca, İngilizce ve İspanyolca yapılır; ilmihal, çocuklar için ilk komünyon ve güçlendirme hazırlığı, koro ve gençlik grubu gibi etkinlikler cemaat konseyi tarafından yürütülür. Kilise, Ulus’taki Azize Tereza ile birlikte Ankara Katolik Kilisesi’nin iki ibadet yerinden biridir."
     ],
     "sources": [
      [
       "Meryem Ana Church (Ankara) resmi sitesi",
       "https://www.ankarakatolik.com/en/",
       "Meryem Ana Church (Ankara), official website"
      ],
      [
       "Meryem Ana Church: Contact",
       "https://www.ankarakatolik.com/en/contact-us/"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Church of Our Lady (Apostolic Nunciature)",
     "shortEn": "Our Lady (Çankaya)",
     "massEn": [
      [
       "Saturday",
       "18:00 French"
      ],
      [
       "Sunday",
       "10:00 English · 11:30 Spanish"
      ],
      [
       "Third Sunday of every month",
       "One Mass only: 10:00 (international)"
      ],
      [
       "Monday and Friday",
       "19:00"
      ],
      [
       "Tuesday and Wednesday",
       "08:00"
      ],
      [
       "Thursday",
       "12:00"
      ]
     ],
     "massNoteEn": "The church is open to the public only during Mass times.",
     "visitsEn": "Open only during Mass times.",
     "historyEn": [
      "The Church of Our Lady is the place of worship of the international Catholic community living in Ankara. It stands in the garden of the Holy See’s embassy to Turkey (the Apostolic Nunciature) and brings together people from all over the world, from different cultures and walks of life.",
      "The congregation includes diplomats, mission staff and many university students, especially from African countries. Mass is said in French, English and Spanish; catechism, preparation for children’s First Communion and Confirmation, the choir and the youth group are run by the parish council. With St. Thérèse in Ulus, the church is one of the two places of worship of the Catholic Church in Ankara."
     ]
    }
   ]
  },
  {
   "id": "konya",
   "name": "Konya",
   "lat": 37.87,
   "lon": 32.49,
   "label": [
    0,
    21,
    "middle"
   ],
   "open": "r",
   "churches": [
    {
     "id": "aziz-pavlus-konya",
     "lat": 37.87092,
     "lon": 32.49326,
     "short": "Aziz Pavlus",
     "name": "Aziz Pavlus Kilisesi",
     "rite": "latin",
     "district": "Meram",
     "address": "Sahibiata Mah., Mimar Muzaffer Caddesi No: 18, 42040 Meram, Konya",
     "phones": [
      "0332 353 62 26"
     ],
     "email": "izmirkatedrali@gmail.com",
     "website": "https://konyakatolikkilisesi.com",
     "mass": [
      [
       "Ayda iki pazar",
       "14:00 Türkçe"
      ]
     ],
     "massNote": "Saatler İzmir Katolik Başepiskoposluğu’nun sitesinden alınmıştır. Rahip Ankara’dan geldiği için ayin ayda iki pazar günü yapılır; tarihi önceden teyit edin. Kilisenin eski e-posta adresi artık çalışmıyor; yukarıdaki adres, kilisenin bağlı olduğu İzmir Aziz Yuhanna Katedrali’ne aittir. Kilisede sürekli kalan rahip yoktur. Hac grupları ayin için önceden telefonla veya katedral üzerinden haber vermelidir.",
     "visits": "Cuma 14:00-16:00 ve cumartesi 11:00-13:00 arasında ziyarete açıktır. Diğer zamanlar için önceden haber verin.",
     "history": [
      "Aziz Pavlus, misyon yolculuklarında Konya’ya (antik İkonion) birkaç kez uğradı (Elçilerin İşleri 14). Kentteki bugünkü Katolik kilisesi ona adanmıştır. Asumsiyonist rahipler, İzmir Başepiskoposu André Polycarpe Timoni ile 20 Ağustos 1892’de yaptıkları anlaşmanın ardından aynı yılın Aralık ayında Konya’ya yerleşti; şehrin Rum ve Ermeni mahalleleri arasında kardeş Agapit Didier ile bir misyon evi kurdular ve bir okul açtılar. Haziran 1894’te Oblat rahibeler de geldi.",
      "1899’da rahiplerin okulunda 70, rahibelerinkinde 40 öğrenci vardı. 1903’te Barones de Gargan’ın 10.000 franklık bağışıyla küçük bir arsa ve ev satın alındı. Kilisenin inşasına izin veren ferman yedi yıl süren işlemlerden sonra Temmuz 1909’da geldi; kilise 11 Aralık 1910’da kutsandı.",
      "1915–1919 arasında papaz Peder Antoine Herbier, Ankara’dan sürülen 2000’den fazla Katoliği ve farklı mezheplerden bir düzine rahibi burada karşıladı. 1922’de Hristiyanların göçüyle Rum ve Ermeni din adamları bölgeden ayrıldı ve Aziz Pavlus Kilisesi yalnız kaldı; okul 1926’da kapandı.",
      "8 Mart 1995’te, Trento yakınlarında kurulan Dirilmiş İsa Kardeşliği’nden iki İtalyan rahibe, Aziz Pavlus’un izinden giden hacılara hizmet etmek için Konya’ya geldi ve 16 Ocak 2022’ye kadar kaldı. Kiliseye bugün Adanmış Bakireler Düzeni’nden (Ordo Virginum) Maria Grazia Zambon hizmet vermektedir.",
      "1966’da Milano’da doğan Maria Grazia Zambon, Milano’daki Adanmış Bakireler Düzeni’nden (Ordo Virginum) kendini Tanrı’ya adamış bir laiktir. 2001’de Kardinal Carlo Maria Martini tarafından Antakya’ya gönderildi; orada yedi, ardından Ankara’da on üç yıl hizmet etti ve 2022’de Konya’ya geldi. Kilisenin küçük papaz evinde yaşar ve “açık kapı ruhaniyeti” dediği karşılama ve dinleme anlayışıyla çalışır. Konya’da yaklaşık 40 Hristiyan vardır; topluluk farklı kökenlerden gelir ve yapısı zamanla değişir. Topluluk, Paulus’un vaazıyla Hristiyan olan İkonionlu Azize Tekla’ya da kendini yakın hisseder. Kilisede her hafta rahip bulunmaz; ayin olmayan pazar günleri Zambon Kelime Liturjisi’ni yönetir ve daha önceki ayinde kutsanmış ekmekten komünyon dağıtır. Kilise hukuku, rahip bulunmadığında piskoposun görevlendirdiği bir laiğin komünyon dağıtmasına izin verir (<a href=\"https://www.vatican.va/archive/cod-iuris-canonici/eng/documents/cic_lib4-cann879-958_en.html\" target=\"_blank\" rel=\"noopener\">Kilise Hukuku, kanon 910 §2</a>). Bizans ikonografisi üzerine eğitim almış bir ikona ressamıdır ve Türkiye’deki birçok şapel için ikona yapmıştır."
     ],
     "sources": [
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Pavlus Katolik Kilisesi",
       "https://izmirkatolikkilisesi.com/konya/",
       "Catholic Archdiocese of Izmir: Church of St. Paul"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ],
      [
       "Konya Katolik Kilisesi: Ziyaret",
       "https://konyakatolikkilisesi.com/en/visit-us-en",
       "Catholic Church of Konya: Visit Us"
      ],
      [
       "Communion and Liberation: “Turkey: My open questions, amid the rubble” (21 Mart 2023)",
       "https://english.clonline.org/stories/world/2023/03/21/turkey-maria-grazia-zambon",
       "Communion and Liberation: “Turkey: My open questions, amid the rubble” (21 March 2023)"
      ],
      [
       "Icone Cristiane: Mariagrazia Zambon, Konya",
       "https://www.iconecristiane.it/2025/02/09/mariagrazia-zambon-konya-turchia/",
       "Icone Cristiane: Mariagrazia Zambon, Konya"
      ],
      [
       "La Voce del Popolo: Maria Grazia Zambon a Konya",
       "https://www.lavocedelpopolo.it/chiesa/maria-grazia-zambon-a-konya-una-comunita-tenace",
       "La Voce del Popolo: Maria Grazia Zambon in Konya"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Church of St. Paul",
     "shortEn": "St. Paul",
     "massEn": [
      [
       "Two Sundays a month",
       "14:00 Turkish"
      ]
     ],
     "massNoteEn": "Times are taken from the website of the Catholic Archdiocese of Izmir. Because the priest comes from Ankara, Mass is held on two Sundays a month; confirm the date in advance. The church’s old email address no longer works; the address above belongs to St. John’s Cathedral in Izmir, to which the church belongs. There is no resident priest. Pilgrim groups should arrange Mass in advance by phone or through the cathedral.",
     "visitsEn": "Open to visitors on Friday 14:00-16:00 and Saturday 11:00-13:00. For other times, arrange in advance.",
     "historyEn": [
      "On his missionary journeys St. Paul passed through Konya (ancient Iconium) several times (Acts 14:1-6). The city’s present Catholic church is dedicated to him. The Assumptionist priests settled in Konya in December 1892, after an agreement made on 20 August that year with the Archbishop of Izmir, André Polycarpe Timoni; together with Brother Agapit Didier they set up a mission house between the city’s Greek and Armenian quarters and opened a school. In June 1894 the Oblate sisters came too.",
      "In 1899 the priests’ school had 70 pupils and the sisters’ 40. In 1903 a small plot and a house were bought with a donation of 10,000 francs from the Baroness de Gargan. The firman permitting the church’s construction arrived in July 1909 after seven years of paperwork; the church was consecrated on 11 December 1910.",
      "Between 1915 and 1919 the parish priest, Father Antoine Herbier, took in more than 2,000 Catholics deported from Ankara and a dozen priests of different rites. In 1922, with the departure of the Christians, the Greek and Armenian clergy left the region and the Church of St. Paul was left on its own; the school closed in 1926.",
      "On 8 March 1995 two Italian sisters of the Fraternity of Jesus Risen, founded near Trento, came to Konya to serve pilgrims following in the footsteps of St. Paul, and stayed until 16 January 2022. Today the church is served by Maria Grazia Zambon of the Order of Consecrated Virgins (Ordo Virginum).",
      "Born in Milan in 1966, Maria Grazia Zambon is a consecrated laywoman of the Ordo Virginum of Milan. In 2001 Cardinal Carlo Maria Martini sent her to Antioch, where she served for seven years, then thirteen in Ankara, before coming to Konya in 2022. She lives in the church’s small rectory and works by what she calls the “spirituality of the open door”, based on meeting and listening. There are about 40 Christians in Konya; the community comes from many backgrounds, and its makeup changes over time. It feels close to St. Thecla of Iconium, who became a Christian through Paul’s preaching. There is not a priest every week; on Sundays without Mass, Zambon leads the Liturgy of the Word and distributes Communion from hosts consecrated at an earlier Mass. Canon law allows a layperson appointed by the bishop to distribute Communion when no priest is available (<a href=\"https://www.vatican.va/archive/cod-iuris-canonici/eng/documents/cic_lib4-cann879-958_en.html\" target=\"_blank\" rel=\"noopener\">Code of Canon Law, canon 910 §2</a>). Trained in Byzantine iconography, she has painted icons for many chapels in Turkey."
     ]
    }
   ]
  },
  {
   "id": "antalya",
   "name": "Antalya",
   "lat": 36.89,
   "lon": 30.71,
   "label": [
    0,
    21,
    "middle"
   ],
   "open": "r",
   "churches": [
    {
     "id": "st-nikolaus-antalya",
     "lat": 36.8825,
     "lon": 30.70949,
     "short": "St. Nikolaus",
     "name": "St. Nikolaus Kilisesi",
     "rite": "latin",
     "district": "Muratpaşa",
     "address": "Haşim İşcan Mah., 1295 Sokak No: 27-29, 07100 Muratpaşa, Antalya",
     "phones": [
      "0242 999 27 42",
      "0535 063 37 10"
     ],
     "email": "kircheantalya@gmail.com",
     "website": "https://kircheantalya.blogspot.com",
     "mass": [
      [
       "Pazar",
       "11:00 Almanca · 18:00 İngilizce"
      ],
      [
       "Perşembe",
       "11:00 Almanca"
      ]
     ],
     "massNote": "Bazı pazar sabahları 11:00’de ekümenik ya da Protestan ayini yapılır ve bazı perşembeler ayin olmaz; her ayın programı kilisenin sitesinde (Gottesdienste) yayımlanır. Alanya’daki Almanca ayinler için kircheinalanya.blogspot.com adresine bakın.",
     "visits": "Kilise herkese açıktır; ayin saatleri dışında ziyaret için önceden haber verin.",
     "history": [
      "St. Nikolaus Kilisesi, Antalya’daki Almanca konuşan Katolik cemaatin kilisesidir. Türk Rivierası’nda yaklaşık 10.000 Alman sürekli yaşar; her yıl gelen milyonlarca turistin önemli bir kısmı da Aziz Pavlus’un izinden gitmek ve erken Hristiyanlığın mirasını görmek ister. Cemaat bu insanlar için kuruldu.",
      "Cemaat 2004’te Türk dernekler hukukuna göre “Aziz Nikolaus Kilisesi Derneği” olarak kuruldu ve resmen tanındı. Hildesheim piskoposluğundan Prelat Rainer Korten, çalışma izni alan ilk rahip oldu ve 2013’e kadar derneğin kurucu başkanı olarak görev yaptı. Dernek tüzüğü herkesin kiliseye kontrolsüz girebilmesini, dinî yayınları, hastanelerde ve cezaevlerinde Almanca konuşanları ziyareti güvence altına alır.",
      "Alman Piskoposlar Konferansı’nın mali desteğiyle kiralanan eski bir internet kafe kiliseye dönüştürüldü. Aynı binada iki cemaat salonu ve Almanca kitaplardan oluşan geniş bir kütüphane (Nikolas Bücherei) bulunur; duvarlarla çevrili güzel bahçe ayinlerden sonra buluşma yeridir. Kilise, Atatürk Caddesi’ne paralel sokakta, Hadriyanüs Kapısı’na beş dakikalık yürüme mesafesindedir. Bugünkü rahip Peder Ludger Paskert’tir."
     ],
     "sources": [
      [
       "St. Nikolaus Kirche Antalya",
       "https://kircheantalya.blogspot.com"
      ],
      [
       "St. Nikolaus Antalya: Kontakt",
       "https://kircheantalya.blogspot.com/p/kontakt.html"
      ],
      [
       "İzmir Katolik Başepiskoposluğu: Aziz Nikola Kilisesi",
       "https://izmirkatolikkilisesi.com/antalya/",
       "Catholic Archdiocese of Izmir: Church of St. Nicholas (St. Nikolaus)"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Church of St. Nicholas (St. Nikolaus)",
     "shortEn": "St. Nicholas",
     "massEn": [
      [
       "Sunday",
       "11:00 German · 18:00 English"
      ],
      [
       "Thursday",
       "11:00 German"
      ]
     ],
     "massNoteEn": "On some Sunday mornings there is an ecumenical or Protestant service at 11:00, and on some Thursdays there is no Mass; each month’s schedule is published on the church’s website (Gottesdienste). For German Masses in Alanya, see kircheinalanya.blogspot.com.",
     "visitsEn": "The church is open to everyone; to visit outside Mass times, arrange it in advance.",
     "historyEn": [
      "The Church of St. Nicholas is the church of the German-speaking Catholic community in Antalya. About 10,000 Germans live permanently on the Turkish Riviera, and many of the millions of tourists who come each year want to follow in the footsteps of St. Paul and see the heritage of early Christianity. The community was founded for these people.",
      "The community was founded and officially recognized in 2004 under Turkish association law as the “St. Nicholas Church Association”. Prelate Rainer Korten of the Diocese of Hildesheim was the first priest to receive a work permit and served as the association’s founding president until 2013. The association’s statutes guarantee free access to the church for everyone, and also allow religious publications and visits to German speakers in hospitals and prisons.",
      "With financial support from the German Bishops’ Conference, a former internet café was rented and turned into a church. The same building houses two parish halls and a large library of German books (Nikolas Bücherei); the lovely walled garden is the meeting place after Mass. The church is on the street parallel to Atatürk Avenue, a five-minute walk from Hadrian’s Gate. The present priest is Father Ludger Paskert."
     ]
    }
   ]
  },
  {
   "id": "mersin",
   "name": "Mersin",
   "lat": 36.8,
   "lon": 34.63,
   "label": [
    -11,
    12,
    "end"
   ],
   "open": "r",
   "churches": [
    {
     "id": "aziz-antuan-mersin",
     "lat": 36.80109,
     "lon": 34.63405,
     "short": "Aziz Antuan",
     "name": "Aziz Antuan Latin Katolik Kilisesi",
     "rite": "latin",
     "district": "Akdeniz",
     "address": "Uray Caddesi No: 12, 33060 Akdeniz, Mersin",
     "phones": [],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 Türkçe"
      ],
      [
       "Pazartesi–Cumartesi",
       "18:00 Türkçe"
      ]
     ],
     "massNote": "Kaynaklar hafta içi saati farklı veriyor: kışın 17:00, yazın 18:00 (weekdaymasses, 2020). Gitmeden teyit edin.",
     "visits": "Önceden randevu alarak gün içinde ziyaret edilebilir.",
     "history": [
      "Mersin’in Latin Katolik kilisesi, kentin 19. yüzyılda bir liman şehri olarak hızla büyüdüğü dönemin eseridir. 1840’taki olaylardan sonra Lübnan’dan gelen Maruni Katolik aileler Mersin’e yerleşmişti. Kilise yapma kararı 1853’te alındı; Mayıs 1854’te Kapuçin rahip Antonio Mersin’e yerleşti ve Sultan Abdülmecid’in 18 Eylül 1855 tarihli fermanıyla kilise inşa edildi.",
      "Kilisenin yanında Kapuçinlerin bir manastır okulu da vardı ve 1898’de tamamlandı. Okula 1923’te el konuldu ve 1944’te Mersin Üçocak İlkokulu’na dönüştürüldü. Kilise, Padovalı Aziz Antuan’a adanmıştır ve bugün de Kapuçin rahipler tarafından yönetilmektedir."
     ],
     "sources": [
      [
       "Vikipedi: Sent Antuan Latin Katolik Kilisesi (Mersin)",
       "https://tr.wikipedia.org/wiki/Sent_Antuan_Latin_Katolik_Kilisesi",
       "Wikipedia (Turkish): St. Anthony’s Latin Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "St. Anthony’s Latin Catholic Church",
     "shortEn": "St. Anthony",
     "massEn": [
      [
       "Sunday",
       "11:00 Turkish"
      ],
      [
       "Monday–Saturday",
       "18:00 Turkish"
      ]
     ],
     "visitsEn": "Can be visited during the day by appointment.",
     "historyEn": [
      "Mersin’s Latin Catholic church is a product of the city’s rapid growth as a port in the 19th century. After the events of 1840, Maronite Catholic families from Lebanon had settled in Mersin. The decision to build a church was taken in 1853; in May 1854 the Capuchin friar Antonio settled in Mersin, and the church was built under a firman of Sultan Abdülmecid dated 18 September 1855.",
      "Beside the church the Capuchins also had a friary school, completed in 1898. The school was confiscated in 1923 and in 1944 became Mersin’s Üçocak Primary School. The church is dedicated to St. Anthony of Padua and is still run by Capuchin friars today."
     ],
     "massNoteEn": "Sources differ on the weekday time: 17:00 in winter and 18:00 in summer (weekdaymasses, 2020). Please confirm before you go."
    }
   ]
  },
  {
   "id": "adana",
   "name": "Adana",
   "lat": 37.0,
   "lon": 35.32,
   "label": [
    11,
    -2,
    "start"
   ],
   "open": "r",
   "churches": [
    {
     "id": "bebekli-kilise-adana",
     "lat": 36.98749,
     "lon": 35.32588,
     "short": "Aziz Pavlus (Bebekli Kilise)",
     "name": "Aziz Pavlus Kilisesi (Bebekli Kilise)",
     "rite": "latin",
     "district": "Tepebağ, Seyhan",
     "address": "Tepebağ Mah., 27046 Sokak No: 31, Seyhan, Adana",
     "phones": [
      "0545 495 19 18"
     ],
     "email": "",
     "website": "",
     "mass": [
      [
       "Pazar",
       "11:00 Türkçe"
      ]
     ],
     "massNote": "Kaynaklar farklı saat veriyor: CET 2023 listesi pazar 11:00 diyor; weekdaymasses (2024) hafta içi 18:00, cumartesi akşamı 18:00 ve pazar 16:00 yazıyor. Gitmeden telefonla (0545 495 19 18) teyit edin.",
     "visits": "Pazartesi, çarşamba ve cumartesi günleri ziyaret edilebilir.",
     "history": [
      "Adana’nın eski Tepebağ mahallesindeki bu kilise, halk arasında “Bebekli Kilise” olarak bilinir. Adı, kulenin tepesindeki yaklaşık 2,5 metre yüksekliğindeki bronz Meryem Ana heykelinden gelir; heykel uzaktan bir bebeği andırdığı için kiliseye bu ad verilmiştir.",
      "1880’lerde İtalyan Katolikler tarafından Aziz Pavlus adına yaptırılan kilise, Tarsuslu Aziz Pavlus’un doğduğu topraklara yakınlığıyla da anlamlıdır. Kilise bugün Anadolu Havarisel Vekilliği’ne bağlıdır ve pazar günleri Türkçe ayinle cemaate hizmet verir."
     ],
     "sources": [
      [
       "Kültür Portalı: Bebekli Kilise",
       "https://www.kulturportali.gov.tr/turkiye/adana/gezilecekyer/bebekli-kilise",
       "Kültür Portalı (Culture Portal): Bebekli Kilise"
      ],
      [
       "Wikipedia: Saint Paul Church, Adana",
       "https://en.wikipedia.org/wiki/Saint_Paul_Church,_Adana"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Church of St. Paul (Bebekli Kilise)",
     "shortEn": "St. Paul (Bebekli Kilise)",
     "massEn": [
      [
       "Sunday",
       "11:00 Turkish"
      ]
     ],
     "visitsEn": "Can be visited on Mondays, Wednesdays and Saturdays.",
     "historyEn": [
      "This church in Adana’s old Tepebağ neighborhood is popularly known as the “Bebekli Kilise” (the Church with the Baby). The name comes from the bronze statue of the Virgin Mary, about 2.5 meters high, on top of the tower; because from a distance the statue looks like a baby, the church was given this name.",
      "Built in the 1880s by Italian Catholics and dedicated to St. Paul, the church is all the more meaningful for being close to the land where St. Paul of Tarsus was born. Today it belongs to the Apostolic Vicariate of Anatolia and serves its community with a Sunday Mass in Turkish."
     ],
     "massNoteEn": "Sources differ: the CET’s 2023 list gives Sunday at 11:00, while weekdaymasses (2024) lists weekdays at 18:00, Saturday evening at 18:00 and Sunday at 16:00. Please confirm by phone (0545 495 19 18) before you go."
    }
   ]
  },
  {
   "id": "hatay",
   "name": "Hatay",
   "lat": 36.4,
   "lon": 36.17,
   "label": [
    11,
    12,
    "start"
   ],
   "open": "r",
   "churches": [
    {
     "id": "antakya-petrus-pavlus",
     "map": "antakya",
     "lat": 36.19827,
     "lon": 36.16028,
     "approx": true,
     "short": "Petrus ve Pavlus (Antakya)",
     "name": "Aziz Petrus ve Pavlus Katolik Kilisesi",
     "rite": "latin",
     "district": "Antakya",
     "address": "Kurtuluş Caddesi, Ataman Demir Sokak No: 6, Antakya, Hatay",
     "phones": [
      "0326 215 67 03"
     ],
     "email": "",
     "website": "http://www.anadolukatolikkilisesi.org/antakya/",
     "status": "closed",
     "notice": "Kilise 6 Şubat 2023 depremlerinde hasar gördü ve tescilli bir kültür varlığı olarak devletin restorasyon programına alındı. Depremden önceki ayin programı şu anda geçerli değildir; cemaatin bugün nerede toplandığını öğrenmek için Anadolu Havarisel Vekilliği’ne danışın.",
     "mass": [
      [
       "Deprem öncesi program",
       "Pazartesi–cumartesi 08:30 · pazar 17:00 (Ekim–Nisan) / 18:00 (Mayıs–Eylül), Türkçe"
      ]
     ],
     "massNote": "Bu saatler depremden önceki programdır.",
     "visits": "Restorasyon sürdüğü için ziyarete kapalı olabilir.",
     "history": [
      "Antakya, Hristiyan tarihinin en önemli şehirlerinden biridir: Elçilerin İşleri’ne göre İsa’nın izleyicilerine ilk kez burada “Hristiyan” denildi (Elçilerin İşleri 11,26). Gelenek, Aziz Petrus’u Antakya Kilisesi’nin ilk önderi olarak kabul eder; şehrin dışındaki Aziz Petrus Mağara Kilisesi, ilk Hristiyanların toplandığı yer olarak saygı görür.",
      "Yaklaşık 600 yıllık bir aradan sonra, Papa IX. Pius’un isteğiyle Kapuçin rahipleri 1846’da Antakya’ya yerleşti; ilk gelen rahip Parma bölgesinden Peder Basilio Galli oldu. 1852’de Sultan Abdülmecid’den alınan izinle bir manastır yapıldı. 1939’da cemaat şehrin yeni bir mahallesine taşınmak zorunda kaldı ve bir süre eski bir şeker fabrikasında toplandı.",
      "Bugünkü kilise ve manastır, eski Antakya’nın tarihî Yahudi mahallesinde bulunan ve mimar Vilyam Azaroğlu’nun doğduğu yaklaşık 150 yıllık bir ev ile bitişiğindeki evin satın alınıp 1989–1991’de restore edilmesiyle oluştu; 1995’te bir misafirhane eklendi. Havuzlu bir avlunun çevresinde şekillenen yapı, geleneksel Antakya evlerinin özelliklerini taşır. Sarımiye Camii ve Antakya Sinagogu ile birlikte oluşturduğu “ekümenik üçgen”, ezan, çan ve hazan seslerinin bir arada duyulduğu bir hoşgörü simgesi olarak anılır."
     ],
     "sources": [
      [
       "KÜRE Ansiklopedi: Antakya Katolik Kilisesi",
       "https://kureansiklopedi.com/tr/detay/antakya-katolik-kilisesi-b62be",
       "KÜRE Encyclopedia: the Catholic Church of Antakya"
      ],
      [
       "Antakya Katolik Kilisesi (eski resmi site)",
       "http://www.anadolukatolikkilisesi.org/antakya/en/",
       "Catholic Church of Antakya (former official website)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "",
     "nameEn": "Catholic Church of Saints Peter and Paul",
     "shortEn": "Peter and Paul (Antakya)",
     "massEn": [
      [
       "Pre-earthquake schedule",
       "Monday–Saturday 08:30 · Sunday 17:00 (October–April) / 18:00 (May–September), Turkish"
      ]
     ],
     "massNoteEn": "These are the times from before the earthquake.",
     "visitsEn": "May be closed to visitors while the restoration continues.",
     "noticeEn": "The church was damaged in the earthquakes of 6 February 2023 and, as a listed cultural property, was taken into the state’s restoration program. The pre-earthquake Mass schedule is not currently valid; to find out where the community meets today, consult the Apostolic Vicariate of Anatolia.",
     "historyEn": [
      "Antioch (Antakya) is one of the most important cities in Christian history: according to the Acts of the Apostles, it was here that the followers of Jesus were first called “Christians” (Acts 11:26). Tradition holds St. Peter to be the first leader of the Church of Antioch; the Cave Church of St. Peter outside the city is venerated as the place where the first Christians gathered.",
      "After a gap of about 600 years, at the wish of Pope Pius IX, Capuchin friars settled in Antakya in 1846; the first to come was Father Basilio Galli of the Parma region. In 1852 a friary was built with permission obtained from Sultan Abdülmecid. In 1939 the community had to move to a new part of the city and for a time met in an old sugar factory.",
      "The present church and friary took shape in 1989–1991, when two neighboring houses in the historic Jewish quarter of old Antakya were bought and restored; one of them, about 150 years old, was the birthplace of the architect Vilyam Azaroğlu. A guesthouse was added in 1995. Built around a courtyard with a pool, the building has the features of traditional Antakya houses. Together with the Sarımiye Mosque and the Antakya Synagogue it forms the “ecumenical triangle”, remembered as a symbol of tolerance where the call to prayer, church bells and the voice of the cantor could be heard together."
     ]
    },
    {
     "id": "iskenderun-mujde",
     "map": "iskenderun",
     "lat": 36.59091,
     "lon": 36.16825,
     "short": "Müjde Katedrali (İskenderun)",
     "name": "Müjde Katedrali (İskenderun Latin Katolik Kilisesi)",
     "rite": "latin",
     "district": "İskenderun",
     "address": "Yenişehir Mah., Mithat Paşa Caddesi No: 5, İskenderun, Hatay",
     "phones": [],
     "email": "",
     "website": "",
     "status": "closed",
     "notice": "Katedral 6 Şubat 2023 depremlerinde ağır hasar gördü; büyük bölümü yıkıldı. Restorasyonu için kaynak aranmaktadır ve yapı şu anda ibadete kapalıdır.",
     "mass": [
      [
       "Deprem öncesi program",
       "Pazar 11:30"
      ]
     ],
     "massNote": "Bu saat depremden önceki programdır.",
     "visits": "Kapalı.",
     "history": [
      "Meryem Ana’nın Müjdesi’ne adanan İskenderun Katedrali, Anadolu Havarisel Vekilliği’nin katedralidir. 16. yüzyılda İspanya’da kurulan Yalınayak Karmelit tarikatının rahipleri 1858’de İskenderun’a geldi ve yeni bir kilisenin inşasına başladı.",
      "Kilise bir yangından sonra 1888–1901 yıllarında yenilenerek yeniden hizmete girdi. Toskanalı Peder Paolo Pergantino 1871’den itibaren kırk yıl boyunca burada görev yaptı; zamanla rahiplerin kalması için kiliseye bir manastır eklendi.",
      "6 Şubat 2023 depremlerinde katedralin büyük kısmı çöktü. Vekilliğin episkoposu Luigi Padovese 2010’da İskenderun’da öldürülmüştü; bugün vekilliği Cizvit piskopos Antuan İlgit yönetmektedir."
     ],
     "sources": [
      [
       "Vikipedi: İskenderun Latin Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/%C4%B0skenderun_Latin_Katolik_Kilisesi",
       "Wikipedia (Turkish): Cathedral of the Annunciation (Iskenderun Latin Catholic Church)"
      ],
      [
       "Agos: İskenderun Kilisesi’nin restorasyonu için kaynak aranıyor",
       "https://www.agos.com.tr/tr/haber/iskenderun-kilisesinin-restorasyonu-icin-kaynak-araniyor-38953",
       "Agos: funds sought for the restoration of the Iskenderun church (in Turkish)"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "",
     "nameEn": "Cathedral of the Annunciation (Iskenderun Latin Catholic Church)",
     "shortEn": "Annunciation Cathedral (Iskenderun)",
     "massEn": [
      [
       "Pre-earthquake schedule",
       "Sunday 11:30"
      ]
     ],
     "massNoteEn": "This is the schedule from before the earthquake.",
     "visitsEn": "Closed.",
     "noticeEn": "The cathedral was badly damaged in the earthquakes of 6 February 2023; most of it collapsed. Funds are being sought for its restoration, and the building is currently closed for worship.",
     "historyEn": [
      "Dedicated to the Annunciation, the Iskenderun Cathedral is the cathedral of the Apostolic Vicariate of Anatolia. Priests of the Discalced Carmelite order, founded in Spain in the 16th century, came to Iskenderun in 1858 and began building a new church.",
      "After a fire, the church was renewed in 1888–1901 and returned to service. Father Paolo Pergantino of Tuscany served here for forty years from 1871; over time a friary was added to the church for the priests to live in.",
      "Most of the cathedral collapsed in the earthquakes of 6 February 2023. The vicariate’s bishop, Luigi Padovese, was murdered in Iskenderun in 2010; today the vicariate is led by the Jesuit bishop Antuan İlgit."
     ]
    }
   ]
  },
  {
   "id": "samsun",
   "name": "Samsun",
   "lat": 41.29,
   "lon": 36.33,
   "label": [
    0,
    -13,
    "middle"
   ],
   "open": "r",
   "churches": [
    {
     "id": "mater-dolorosa-samsun",
     "lat": 41.28917,
     "lon": 36.329,
     "short": "Mater Dolorosa",
     "name": "Mater Dolorosa Katolik Kilisesi (Acı Çeken Meryem Ana)",
     "rite": "latin",
     "district": "İlkadım",
     "address": "Ulugazi Mah., 614. Sokak No: 2, 55030 İlkadım, Samsun",
     "phones": [],
     "email": "mdolorosasamsun@gmail.com",
     "website": "https://www.materdolorosakatolikkilisesi.org",
     "mass": [
      [
       "Pazar",
       "12:00"
      ],
      [
       "Cumartesi",
       "07:30"
      ],
      [
       "Pazartesi, salı, çarşamba, cuma",
       "18:00 (pazartesi, çarşamba ve cuma ayinden önce tespih)"
      ],
      [
       "Perşembe",
       "17:00 Efkaristiya’ya Tapınma, ardından ayin"
      ]
     ],
     "massNote": "Noel, Yılbaşı ve Paskalya programı için kiliseye e-postayla yazabilirsiniz.",
     "ocia": "Kilise, Katolik olmak isteyen yetişkinler için OCIA (eski adıyla RCIA) hazırlığını internet sitesinde duyuruyor. Türkiye’de bu hazırlık çoğu zaman herkese açık bir kayıt tarihiyle duyurulmaz; rahip her adayla ayrı ayrı görüşerek planlar. Yani başka kiliseler de bu hazırlığı sunuyor olabilir. Ayrıntılar için <a href=\"https://www.materdolorosakatolikkilisesi.org/rcia\" target=\"_blank\" rel=\"noopener\">kilisenin OCIA sayfasına</a> bakabilir ya da kiliseye e-postayla yazabilirsiniz. Sürecin nasıl ilerlediğini <a href=\"katolik-sureci.html\">Katolik Olma Süreci</a> sayfasında bulabilirsiniz.",
     "ociaEn": "The church announces OCIA (formerly RCIA) preparation for adults who want to become Catholic on its website. In Turkey this preparation is usually not advertised with public enrollment dates; the priest plans it with each candidate individually. So other churches may offer it too. For details, see <a href=\"https://www.materdolorosakatolikkilisesi.org/rcia\" target=\"_blank\" rel=\"noopener\">the church’s OCIA page</a> or write to the church by email. You can see how the process works on the <a href=\"katolik-sureci.html\">Becoming Catholic</a> page.",
     "visits": "Pazartesi, salı, çarşamba ve cuma 15:30–17:30; perşembe 15:30–16:30. Cumartesi ve pazar ziyarete kapalıdır.",
     "history": [
      "1845’te Gürcistan’ı terk etmek zorunda kalan sekiz İtalyan Kapuçin rahip, Karadeniz’den geçerken kilisesi olmayan Latin Katoliklerle karşılaştı; Samsun’un yanı sıra Trabzon ve Giresun’da da böyle topluluklar vardı. 1851’de Fransız Marist rahipler bir okul açtı; İtalyan bir hanımın bağışladığı arazide ahşap bir kilise ve ev yapıldı. O yıllarda Samsun nüfusunun yaklaşık yüzde 30’u Hristiyandı.",
      "1876’da Sultan V. Murad yeni bir kilise için özel izin verdi ve 8 × 12 metrelik küçük bir kilisenin yapımına başlandı; iki yıl sonra tapusu da gönderildi. Kilise tamamlandıktan sonra 1885’te yanına bir manastır, kiralık daireler ve bir mezarlık yapıldı; duvarlar fresklerle süslendi. 1913’te binaya el konuldu ve rahipler çatısı akan iki odaya sıkıştırıldı. 1976’da belediye başkanı kilisenin yıkılıp yerine park yapılmasını istedi; papalık elçiliği ile İtalyan konsolosluğunun girişimleriyle kilise kurtuldu.",
      "1998’de Anadolu’daki Katolik kiliselerinden sorumlu Peder Ruggero Franceschini’nin önderliğinde kapsamlı bir restorasyon yapıldı. 2006’da kilisenin rahibi Peder Pierre Brunissen bıçaklı saldırıya uğradı. Kilise birkaç yıl kapalı kaldıktan sonra 2017’de Arjantinli Fransiskenlerle yeniden açıldı ve özellikle bölgedeki Katolik göçmenlere hizmet verdi.",
      "Kilise 2023 sonunda, Anadolu Havarisel Vekilliği’nin daveti üzerine Marist rahipler (Society of Mary) ve Marist Misyoner Rahibeler (SMSM) tarafından kurulan “Omnes Gentes” topluluğuyla yeniden açıldı. Dünyanın dört bir yanından gelen üyelerden oluşan cemaat bugün düzenli ayinleriyle canlı bir topluluktur."
     ],
     "sources": [
      [
       "Mater Dolorosa Katolik Kilisesi resmi sitesi",
       "https://www.materdolorosakatolikkilisesi.org",
       "Mater Dolorosa Catholic Church, official website"
      ],
      [
       "Mater Dolorosa: Tarih",
       "https://www.materdolorosakatolikkilisesi.org/history",
       "Mater Dolorosa: History"
      ],
      [
       "Vikipedi: Mater Dolorosa Katolik Kilisesi",
       "https://tr.wikipedia.org/wiki/Mater_Dolorosa_Katolik_Kilisesi",
       "Wikipedia (Turkish): Mater Dolorosa Catholic Church (Our Lady of Sorrows)"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Mater Dolorosa Catholic Church (Our Lady of Sorrows)",
     "shortEn": "Mater Dolorosa",
     "massEn": [
      [
       "Sunday",
       "12:00"
      ],
      [
       "Saturday",
       "07:30"
      ],
      [
       "Monday, Tuesday, Wednesday, Friday",
       "18:00 (Rosary before Mass on Monday, Wednesday and Friday)"
      ],
      [
       "Thursday",
       "17:00 Eucharistic Adoration, followed by Mass"
      ]
     ],
     "massNoteEn": "For the Christmas, New Year and Easter schedule, you can write to the church by email.",
     "visitsEn": "Monday, Tuesday, Wednesday and Friday 15:30–17:30; Thursday 15:30–16:30. Closed to visitors on Saturday and Sunday.",
     "historyEn": [
      "In 1845 eight Italian Capuchin friars who had been forced to leave Georgia came across Latin Catholics without a church as they crossed the Black Sea; there were such communities in Trabzon and Giresun as well as Samsun. In 1851 French Marist priests opened a school; a wooden church and house were built on land donated by an Italian lady. In those years about 30 percent of Samsun’s population was Christian.",
      "In 1876 Sultan Murad V gave special permission for a new church, and work began on a small church measuring 8 by 12 meters; two years later the title deed was issued as well. After the church was completed, a friary, rental apartments and a cemetery were built beside it in 1885, and the walls were decorated with frescoes. In 1913 the building was confiscated and the priests were squeezed into two rooms with a leaking roof. In 1976 the mayor wanted the church demolished and a park built in its place; the church was saved by the efforts of the papal nunciature and the Italian consulate.",
      "In 1998 an extensive restoration was carried out under the leadership of Father Ruggero Franceschini, responsible for the Catholic churches of Anatolia. In 2006 the church’s priest, Father Pierre Brunissen, was attacked with a knife. After being closed for several years, the church reopened in 2017 with Argentine Franciscans and served especially the Catholic migrants of the region.",
      "At the end of 2023 the church reopened with the “Omnes Gentes” community, founded at the invitation of the Apostolic Vicariate of Anatolia by the Marist Fathers (Society of Mary) and the Marist Missionary Sisters (SMSM). Made up of members from all over the world, the community is lively today, with regular Masses."
     ]
    }
   ]
  },
  {
   "id": "trabzon",
   "name": "Trabzon",
   "lat": 41.0,
   "lon": 39.72,
   "label": [
    0,
    -13,
    "middle"
   ],
   "open": "l",
   "churches": [
    {
     "id": "santa-maria-trabzon",
     "lat": 41.00718,
     "lon": 39.73198,
     "short": "Santa Maria",
     "name": "Santa Maria Katolik Kilisesi",
     "rite": "latin",
     "district": "İskenderpaşa, Ortahisar",
     "address": "İskenderpaşa Mah., Sümer Sokak No: 24-26, 61100 Ortahisar, Trabzon",
     "phones": [
      "0462 321 21 92"
     ],
     "email": "info@trabzonkatolikkilisesi.com",
     "website": "https://www.trabzonkatolikkilisesi.com",
     "mass": [
      [
       "Hafta içi",
       "Akşam ayini; saati kilisenin sitesinde gün gün ilan edilir (örneğin 29 Ekim 2026: 18:00)"
      ],
      [
       "Pazar",
       "11:30"
      ]
     ],
     "massNote": "Güncel duyurular kilisenin sitesinde yayımlanır.",
     "visits": "Salı, çarşamba, perşembe, cuma ve cumartesi 15:30–17:30. Pazar ve pazartesi ziyarete kapalıdır.",
     "history": [
      "Meryem Ana’ya adanmış Santa Maria Kilisesi, Karadeniz’in çok kültürlü geçmişinden günümüze ulaşan önemli bir mirastır ve bugün Trabzon’da ibadete açık tek Katolik kilisesidir. Kilisenin yapımına, Rus yönetimindeki Tiflis’ten Karadeniz’e gelen ve aslen İtalya’nın Emilia bölgesinden olan Kapuçin rahipleri öncülük etti. Temeli 1869’da atılan kilise beş yılda tamamlandı ve 2 Şubat 1874’te bir törenle ibadete açıldı.",
      "Kapuçinlerin şehre gelirken yanlarında getirdikleri, Meryem Ana’yı yöresel kıyafetler içinde ve kucağında uyuyan Bebek İsa ile gösteren tablo, zamanla kilisenin ruhani kimliğiyle bütünleşti. Kendisine atfedilen mucizelerle bu tasvir bölgede “Santa Maria di Trebisonda” (Trabzonlu Meryem Ana) olarak anılmaya başlandı.",
      "Yeni-gotik üsluptaki yapının beden duvarları yığma taştan, iç bölme duvarları tuğladan örülmüştür. Dikdörtgen planlı, apsissiz ve üç nefli kilisenin üzeri uzun bir beşik tonozla örtülüdür; payelerle taşınan kemerli nefler oldukça yüksek tutulmuştur. Batı cephesi simetrik pencereleri ve üçgen alınlığıyla dikkat çeker.",
      "Kilisenin rahibi Don Andrea Santoro, 5 Şubat 2006’da kilisede dua ederken öldürüldü. 1945’te İtalya’nın Priverno kasabasında doğan Santoro, Roma’da papaz olarak yıllarca çalıştıktan sonra 2000’de kendi isteğiyle Türkiye’ye gelmiş, önce Şanlıurfa-Harran’da, sonra Trabzon’da görev yapmıştı. Kilise, bugün Anadolu Havarisel Vekilliği’ne bağlıdır."
     ],
     "sources": [
      [
       "Trabzon Santa Maria Katolik Kilisesi resmi sitesi",
       "https://www.trabzonkatolikkilisesi.com",
       "Santa Maria Catholic Church, Trabzon, official website"
      ],
      [
       "Vikipedi: Santa Maria Katolik Kilisesi (Trabzon)",
       "https://tr.wikipedia.org/wiki/Santa_Maria_Katolik_Kilisesi_(Trabzon)",
       "Wikipedia (Turkish): Santa Maria Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "status": "active",
     "notice": "",
     "side": "",
     "nameEn": "Santa Maria Catholic Church",
     "shortEn": "Santa Maria",
     "massEn": [
      [
       "Weekdays",
       "Evening Mass; the time is announced day by day on the church’s website (for example 29 October 2026: 18:00)"
      ],
      [
       "Sunday",
       "11:30"
      ]
     ],
     "massNoteEn": "Current announcements are published on the church’s website.",
     "visitsEn": "Tuesday, Wednesday, Thursday, Friday and Saturday 15:30–17:30. Closed to visitors on Sunday and Monday.",
     "historyEn": [
      "The Santa Maria Church, dedicated to the Virgin Mary, is an important legacy of the Black Sea’s multicultural past and today the only Catholic church open for worship in Trabzon. Its construction was led by Capuchin friars, originally from Italy’s Emilia region, who had come to the Black Sea from Russian-ruled Tbilisi. Its foundations were laid in 1869; the church was completed in five years and opened for worship with a ceremony on 2 February 1874.",
      "The painting the Capuchins brought with them to the city, showing the Virgin Mary in local dress with the Child Jesus asleep in her arms, became, over time, central to the church’s spiritual identity. Because of the miracles attributed to it, the image came to be known in the region as “Santa Maria di Trebisonda” (Our Lady of Trebizond).",
      "The outer walls of the neo-Gothic building are of rubble stone and its inner partition walls of brick. The rectangular, three-aisled church has no apse and is covered by a long barrel vault; the arcades on piers between the aisles rise very high. The west front stands out with its symmetrical windows and triangular pediment.",
      "The church’s priest, Don Andrea Santoro, was killed on 5 February 2006 while praying in the church. Born in 1945 in Priverno, Italy, Santoro worked for years as a priest in Rome before coming to Turkey of his own accord in 2000, serving first in Şanlıurfa-Harran and then in Trabzon. Today the church belongs to the Apostolic Vicariate of Anatolia."
     ]
    }
   ]
  },
  {
   "id": "diyarbakir",
   "name": "Diyarbakır",
   "lat": 37.91,
   "lon": 40.24,
   "label": [
    0,
    -13,
    "middle"
   ],
   "open": "l",
   "churches": [
    {
     "id": "mar-petyun-diyarbakir",
     "lat": 37.9108,
     "lon": 40.23804,
     "short": "Mar Petyun (Keldani)",
     "name": "Mar Petyun Keldani Katolik Kilisesi",
     "rite": "keldani",
     "district": "Sur",
     "address": "Sur, Diyarbakır (Dört Ayaklı Minare’nin karşısı, Surp Giragos Kilisesi’nin bitişiği)",
     "phones": [
      "0412 224 65 05"
     ],
     "email": "",
     "website": "",
     "status": "limited",
     "notice": "Kilise 2015–2016 çatışmalarında hasar gördü, devlet tarafından restore edildi ve 14 Ekim 2023’te düzenlenen ayinle yeniden açıldı. Cemaat küçüktür ve ayinler düzenli değildir; ziyaret ve ayin için önceden kiliseyi arayın.",
     "mass": [
      [
       "Ayin",
       "Düzenli bir program yok; ayinler zaman zaman, gelen din görevlileri tarafından yapılır."
      ]
     ],
     "massNote": "",
     "visits": "Diyarbakır Valiliği’nin kültür envanterine göre her gün 09:00–17:30 arası ziyarete açıktır; gitmeden önce teyit edin.",
     "history": [
      "Mar Petyun (Aziz Petyun), Diyarbakır’ın tarihî Sur ilçesinde, dört ayaklı minaresiyle tanınan Şeyh Mutahhar Camii’nin karşısında ve Surp Giragos Ermeni Kilisesi’nin hemen bitişiğindedir. Gelenek, bu yerde ilk ibadetin 498 yılında yapıldığını söyler; kilise tarih boyunca defalarca yıkılıp yeniden yapılmıştır. Bugünkü yapı 17. yüzyıla tarihlenir ve Diyarbakır’ın karakteristik siyah bazalt taşıyla inşa edilmiştir.",
      "Kilise, 1681’de Diyarbakır’da kurulan Keldani Katolik patrikliğiyle birlikte Roma ile birliğe giren Keldani topluluğunun merkezlerinden biri oldu. Bir zamanlar kalabalık olan cemaat, ailelerin büyük şehirlere ve Avrupa’ya göç etmesiyle küçüldü; bugün Diyarbakır’da 25–30 kişilik bir Keldani topluluk yaşar. 1988’den beri Diyarbakır Keldani Katolik Kilisesi Vakfı’nın başkanı olan Yusuf Karadayı, kilisede doğmuş ve ömrünü ona hizmete adamıştır.",
      "Kilise 2010–2013 yıllarında vakıf tarafından restore edildi, ancak 2015–2016’daki çatışmalarda yeniden hasar gördü. 2019’da başlayan ve Vakıflar Genel Müdürlüğü’nün denetiminde yürütülen restorasyon 2023’te tamamlandı. 14 Ekim 2023’teki açılış ayinini Türkiye Keldani Katolik Patrik Vekili Fransua Yakan ile Papa Fransuva’nın Haziran 2023’te Diyarbakır Keldani Kilisesi’ne başepiskopos olarak atadığı Uludereli Sabri Anar birlikte yönetti."
     ],
     "sources": [
      [
       "AA: Mar Petyun Keldani Kilisesi düzenlenen ayinle açıldı",
       "https://www.aa.com.tr/tr/gundem/pkkli-teroristlerce-tahrip-edilen-mar-patyun-keldani-kilisesi-duzenlenen-ayinle-acildi/3020115",
       "AA: Mar Petyun Chaldean Church opens with a Mass (in Turkish)"
      ],
      [
       "Tigris Haber: Keldani kilisesinde 7 yıldan sonra ilk ayin",
       "https://www.tigrishaber.com/keldani-kilisesinde-7-yildan-sonra-ilk-ayin-88707h.htm",
       "Tigris Haber: first Mass in 7 years at the Chaldean church (in Turkish)"
      ],
      [
       "Vikipedi: Mar Petyun Keldani Kilisesi",
       "https://tr.wikipedia.org/wiki/Mar_Petyun_Keldani_Kilisesi",
       "Wikipedia (Turkish): Mar Petyun Chaldean Catholic Church"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "",
     "nameEn": "Mar Petyun Chaldean Catholic Church",
     "shortEn": "Mar Petyun (Chaldean)",
     "massEn": [
      [
       "Mass",
       "No regular schedule; Mass is said from time to time by visiting clergy."
      ]
     ],
     "visitsEn": "According to the Diyarbakır Governorship’s cultural inventory, it is open to visitors every day from 09:00 to 17:30; check before you go.",
     "noticeEn": "The church was damaged in the clashes of 2015–2016, restored by the state and reopened with a Mass on 14 October 2023. The community is small and Mass is not regular; call the church in advance to visit or attend Mass.",
     "historyEn": [
      "Mar Petyun (St. Petyun) is in Diyarbakır’s historic Sur district, opposite the Sheikh Mutahhar Mosque, known for its four-legged minaret, and right next to the Surp Giragos Armenian Church. Tradition says the first worship on this site took place in the year 498; over its history the church was destroyed and rebuilt many times. The present building dates from the 17th century and is built of Diyarbakır’s characteristic black basalt.",
      "The church became one of the centers of the Chaldean community, which entered into union with Rome together with the Chaldean Catholic patriarchate founded in Diyarbakır in 1681. The once large congregation shrank as families moved to the big cities and to Europe; today a Chaldean community of 25–30 people lives in Diyarbakır. Yusuf Karadayı, president of the Diyarbakır Chaldean Catholic Church Foundation since 1988, was born in the church and has devoted his life to serving it.",
      "The church was restored by the foundation in 2010–2013, but was damaged again in the clashes of 2015–2016. The restoration, begun in 2019 under the supervision of the General Directorate of Foundations, was completed in 2023. The opening Mass on 14 October 2023 was celebrated jointly by the Chaldean Catholic Patriarchal Vicar of Turkey, François Yakan, and Sabri Anar of Uludere, whom Pope Francis had appointed archbishop of the Chaldean Church of Diyarbakır in June 2023."
     ]
    },
    {
     "id": "surp-hovsep-diyarbakir",
     "lat": 37.9095,
     "lon": 40.237,
     "approx": true,
     "short": "Surp Hovsep (Ermeni Katolik)",
     "name": "Surp Hovsep Ermeni Katolik Kilisesi",
     "rite": "ermeni",
     "district": "Sur",
     "address": "Sur, Diyarbakır",
     "phones": [],
     "email": "",
     "website": "",
     "status": "limited",
     "notice": "Kilise düzenli bir ibadethane olarak kullanılmamaktadır. Restorasyonun ardından 2021 sonunda 10 yıllığına Dicle Üniversitesi’ne kültür ve sanat merkezi olarak tahsis edildi; Ermeni Katolik cemaati talep ettiğinde ayin yapma hakkını korumaktadır.",
     "mass": [
      [
       "Ayin",
       "Düzenli ayin yok; cemaatin talebiyle özel günlerde yapılabilir."
      ]
     ],
     "massNote": "",
     "visits": "Dicle Üniversitesi Kültür, Sanat, Uygulama ve Araştırma Merkezi olarak kullanıldığı için ziyaret saatlerini üniversiteden öğrenin.",
     "history": [
      "Hz. Meryem’in eşi Aziz Yusuf’a adanan Surp Hovsep, Diyarbakır’ın Sur ilçesindeki tarihî Ermeni Katolik kilisesidir. 16. yüzyılda inşa edildiği bilinen kilise, Ermeni Katolik Kilisesi’nin 18. yüzyılda Roma ile tam birliğe girmesinin ardından bölgedeki Katolik Ermeni cemaatinin ibadet merkezi oldu.",
      "Kadınlar mahfili bulunan ve düz bir damla örtülü kilisede Ermenice yazıtlar ile din görevlilerine ait mezar taşları vardır; yapının lojmanları ve bir avlusu bulunur. 20. yüzyılın ortalarından itibaren cemaat başka şehirlere ve yurt dışına göç edince kilise cemaatsiz kaldı.",
      "2015–2016’daki Sur çatışmalarında en ağır hasar gören kiliselerden biri oldu. Vakıflar Genel Müdürlüğü’nün yürüttüğü restorasyon 2021’in başında tamamlandı. Aralık 2021’de Türkiye Ermeni Katolikleri Başepiskoposu Levon Zekiyan kiliseyi kutsadı ve burada yaklaşık 100 yıl sonra ilk ayin kutlandı. Aynı dönemde kilise, mimari özelliklerinin korunması ve cemaatin ayin hakkının saklı kalması şartıyla 10 yıllığına Dicle Üniversitesi’ne tahsis edildi."
     ],
     "sources": [
      [
       "Rudaw: Diyarbakır’da restore edilen kilise Dicle Üniversitesi’ne verildi",
       "https://www.rudaw.net/turkish/categories/kurdistan/1219051",
       "Rudaw: church restored in Diyarbakır given to Dicle University (in Turkish)"
      ],
      [
       "Agos: Diyarbakır Surp Hovsep Kilisesi’nde ayin",
       "https://www.agos.com.tr/tr/yazi/diyarbakir-surp-hovsep-kilisesi-nde-ayin-26489",
       "Agos: Mass at the Surp Hovsep Church in Diyarbakır (in Turkish)"
      ],
      [
       "Vikipedi: Ermeni Katolik Kilisesi (Diyarbakır)",
       "https://tr.wikipedia.org/wiki/Ermeni_Katolik_Kilisesi_(Diyarbak%C4%B1r)",
       "Wikipedia (Turkish): Surp Hovsep Armenian Catholic Church"
      ]
     ],
     "side": "",
     "nameEn": "Surp Hovsep Armenian Catholic Church",
     "shortEn": "Surp Hovsep (Armenian Catholic)",
     "massEn": [
      [
       "Mass",
       "No regular Mass; it can be held on special days at the community’s request."
      ]
     ],
     "visitsEn": "Because it is used as Dicle University’s Culture, Art, Application and Research Center, ask the university for visiting hours.",
     "noticeEn": "The church is not used as a regular place of worship. After its restoration, at the end of 2021 it was allocated to Dicle University for 10 years as a center for culture and the arts; the Armenian Catholic community keeps the right to celebrate Mass when it asks.",
     "historyEn": [
      "Dedicated to St. Joseph, the husband of the Virgin Mary, Surp Hovsep is the historic Armenian Catholic church in Diyarbakır’s Sur district. Known to have been built in the 16th century, the church became the center of worship for the region’s Catholic Armenian community after the Armenian Catholic Church entered into full union with Rome in the 18th century.",
      "The church, which has a women’s gallery and a flat roof, contains Armenian inscriptions and the gravestones of clergy; the building has living quarters and a courtyard. From the middle of the 20th century, as the community moved to other cities and abroad, the church was left without a congregation.",
      "It was one of the churches most heavily damaged in the Sur clashes of 2015–2016. The restoration carried out by the General Directorate of Foundations was completed at the beginning of 2021. In December 2021 the Armenian Catholic Archbishop of Turkey, Levon Zekiyan, blessed the church, and the first Mass in about 100 years was celebrated here. In the same period the church was allocated to Dicle University for 10 years, on condition that its architectural features be preserved and the community’s right to celebrate Mass be kept."
     ]
    }
   ]
  },
  {
   "id": "mardin",
   "name": "Mardin",
   "lat": 37.31,
   "lon": 40.74,
   "label": [
    0,
    21,
    "middle"
   ],
   "open": "l",
   "churches": [
    {
     "id": "meryem-ana-mardin",
     "lat": 37.31378,
     "lon": 40.7349,
     "short": "Meryem Ana Katedrali",
     "name": "Meryem Ana Süryani Katolik Katedrali",
     "rite": "suryani",
     "district": "Artuklu",
     "address": "Şar Mah., 227 Çavırlı Sokak No: 3 (Cumhuriyet Meydanı), Artuklu, Mardin",
     "phones": [],
     "email": "",
     "website": "https://presencet.com.tr",
     "status": "limited",
     "notice": "Ayin saatleri yayımlanmamıştır; cemaat küçüktür. Ayin için önceden kiliseye ya da İstanbul’daki Süryani Katolik Patrik Vekilliği’ne danışın.",
     "mass": [
      [
       "Ayin",
       "Kiliseye danışın."
      ]
     ],
     "massNote": "",
     "visits": "Kilise genellikle gün içinde ziyarete açıktır; bitişiğindeki eski patrikhane binası Mardin Müzesi’dir.",
     "history": [
      "Mardin’in Cumhuriyet Meydanı’ndaki Meryem Ana Katedrali, Süryani Katolik Kilisesi’nin tarihî merkezidir. Süryani Katolikler, 18. yüzyılda Mardin’de yapılan bir patrik seçimi sırasında kadim Süryani Kilisesi’nden ayrılarak Roma ile birliğe giren topluluktur.",
      "Katedral ve bitişiğindeki patrikhane 1895’te inşa edildi; o dönem patriklik merkezi Mardin’deydi. Patriklik daha sonra Musul’a, Halep’e ve 1929’da Lübnan’daki Şarfe Manastırı’na taşındı. Patrikhane binası bir dönem askerî amaçlarla kullanıldı, 1988’de Kültür Bakanlığı’na devredildi ve restore edilerek 1995’ten beri Mardin Müzesi olarak hizmet veriyor.",
      "Kemerli, yuvarlak taş sütunlu kilisede, patriğin Roma’dan dönerken getirdiği tablolar bulunur; bunlardan birinin Rönesans ressamı Rafael’in okuluna ait olduğu düşünülür."
     ],
     "sources": [
      [
       "Présence: Mardin Süryani Katolik Kilisesi kutsal mekânlarımız",
       "https://presencet.com.tr/mardin-suryani-katolik-kilisesi-kutsal-mekanlarimiz/",
       "Présence: the holy places of the Syriac Catholic Church in Mardin"
      ],
      [
       "Kültür Portalı: Meryem Ana Kilisesi ve Patrikhanesi",
       "https://www.kulturportali.gov.tr/turkiye/mardin/gezilecekyer/meryemana-kilisesi-ve-patrikhanesi",
       "Kültür Portalı (Culture Portal): the Church and Patriarchate of Our Lady"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "",
     "nameEn": "Syriac Catholic Cathedral of Our Lady",
     "shortEn": "Our Lady’s Cathedral",
     "massEn": [
      [
       "Mass",
       "Ask the church."
      ]
     ],
     "visitsEn": "The church is usually open to visitors during the day; the old patriarchate building next to it is the Mardin Museum.",
     "noticeEn": "Mass times have not been published; the community is small. For Mass, consult the church or the Syriac Catholic Patriarchal Vicariate in Istanbul in advance.",
     "historyEn": [
      "The Cathedral of Our Lady on Mardin’s Cumhuriyet Square is the historic center of the Syriac Catholic Church. The Syriac Catholics are the community that separated from the ancient Syriac Church and entered into union with Rome during a patriarchal election held in Mardin in the 18th century.",
      "The cathedral and the patriarchate beside it were built in 1895, when the seat of the patriarchate was in Mardin. The patriarchate later moved to Mosul, to Aleppo and, in 1929, to the Monastery of Charfet in Lebanon. The patriarchate building was used for military purposes for a time, handed over to the Ministry of Culture in 1988 and restored, and has served as the Mardin Museum since 1995.",
      "The church, with its arches and round stone columns, contains paintings the patriarch brought back from Rome; one of them is thought to belong to the school of the Renaissance painter Raphael."
     ]
    },
    {
     "id": "mor-efrem-mardin",
     "lat": 37.31381,
     "lon": 40.72868,
     "short": "Mor Efrem",
     "name": "Mor Efrem Süryani Katolik Kilisesi",
     "rite": "suryani",
     "district": "Artuklu",
     "address": "Çabuk Mah., 241 Erdes Sokak No: 58/1, Artuklu, Mardin",
     "phones": [],
     "email": "",
     "website": "https://presencet.com.tr",
     "status": "limited",
     "notice": "Ayin saatleri yayımlanmamıştır; ziyaret ve ayin için önceden bilgi alın.",
     "mass": [
      [
       "Ayin",
       "Kiliseye danışın."
      ]
     ],
     "massNote": "",
     "visits": "Önceden bilgi alarak ziyaret edin.",
     "history": [
      "Mor Efrem Kilisesi ve manastırı, Patrik Cercis Şelhet döneminde 1884’te inşa edildi ve dönemin metropoliti Mor Yakup Matay Ahmar-Dakno tarafından kutsandı. Kilise adını, 4. yüzyılda yaşamış büyük Süryani ilahiyatçı ve şair Suriyeli Aziz Efrem’den alır.",
      "Yapı 1922’den itibaren askerî hastane ve cezaevi, yakın zamanda da briket atölyesi ve depo olarak kullanıldı; bu kullanımlar sırasında yer yer çöktü. Mardin Süryani Katolik Vakfı’nın 2012–2022 arasında yürüttüğü restorasyonla yeniden ayağa kaldırılan kilise, Süryani Katolik Patriği III. Ignatius Yusuf Younan tarafından kutsanarak yeniden ibadete açıldı."
     ],
     "sources": [
      [
       "Présence: Mardin Süryani Katolik Kilisesi kutsal mekânlarımız",
       "https://presencet.com.tr/mardin-suryani-katolik-kilisesi-kutsal-mekanlarimiz/",
       "Présence: the holy places of the Syriac Catholic Church in Mardin"
      ],
      [
       "Türkiye Katolik Ruhani Reisler Kurulu (CET), 2023 ayin saatleri listesi",
       "https://www.katolik-kilisesi.org/wp-content/uploads/2023/08/2023-TURKIYE-KATOLIK-KILISELERI-AYIN-SAATLERI.pdf",
       "Bishops’ Conference of Turkey (CET), 2023 list of Mass times"
      ]
     ],
     "side": "",
     "nameEn": "Mor Efrem Syriac Catholic Church",
     "shortEn": "Mor Efrem",
     "massEn": [
      [
       "Mass",
       "Ask the church."
      ]
     ],
     "visitsEn": "Ask before you visit.",
     "noticeEn": "Mass times have not been published; ask in advance to visit or attend Mass.",
     "historyEn": [
      "The Mor Efrem church and monastery were built in 1884, under Patriarch Cercis Şelhet, and consecrated by the metropolitan of the day, Mor Yakup Matay Ahmar-Dakno. The church takes its name from St. Ephrem the Syrian, the great 4th-century Syriac theologian and poet.",
      "From 1922 the building was used as a military hospital and prison, and more recently as a cinder-block workshop and warehouse; during these years it partly collapsed. Rebuilt in the restoration carried out by the Mardin Syriac Catholic Foundation between 2012 and 2022, the church was consecrated by the Syriac Catholic Patriarch Ignatius Joseph III Younan and reopened for worship."
     ]
    }
   ]
  }
 ],
 "noteEn": "This information has been compiled from the churches’ own websites, the Catholic Archdiocese of Izmir, the Mass times list of the Bishops’ Conference of Turkey, the Istanbul Governorship’s Dijital İstanbul inventory and other public sources; it is not an official or complete register of churches. If you spot a mistake, you can let us know through the Contact page.",
 "orthodoxNoteEn": "If there is no Catholic church near you, there may be an Orthodox one. Under Canon Law (Canon 844 §2), when it is impossible to reach a Catholic priest and there is genuine need, a Catholic may receive the Eucharist, Confession and the Anointing of the Sick from the Orthodox Church, whose sacraments are valid. This is an exceptional permission, not the ordinary rule; each community has its own discipline, and an Orthodox priest may not always agree to give Communion.",
 "news": [
  {
   "date": "2026-10-01", "dateTr": "1 Ekim 2026", "dateEn": "1 October 2026",
   "title": "İskenderun’daki Katolik kiliselerinin restorasyonu sürüyor",
   "titleEn": "Restoration of İskenderun’s Catholic churches continues",
   "text": "Yerel basın, İskenderun’daki Rum Katolik ve Süryani Katolik kiliselerinin restorasyonunun sürdüğünü bildirdi; yetkililer güçlendirme çalışmalarını yerinde inceledi. Tamamlanma tarihi açıklanmadı. Şehrin Latin Katolik katedrali Müjde ise bu listede kapalı olarak duruyor.",
   "textEn": "Local press reports that restoration of the Greek Catholic and Syriac Catholic churches in İskenderun is continuing, and officials inspected the reinforcement work on site. No completion date was given. The city’s Latin Catholic cathedral, Müjde, is still listed here as closed.",
   "cityId": "hatay",
   "source": ["Haberkenti: İskenderun’da tarihi kiliselerin restorasyonu devam ediyor", "https://www.haberkenti.com/iskenderunda-tarihi-kiliselerin-restorasyonu-devam-ediyor", "Haberkenti: restoration of İskenderun’s historic churches continues (Turkish)"]
  },
  {
   "date": "2026-08-21", "dateTr": "21 Ağustos 2026", "dateEn": "21 August 2026",
   "title": "Mgr. Louis-Armel Pelâtre hayatını kaybetti",
   "titleEn": "Mgr. Louis-Armel Pelâtre has died",
   "text": "1992–2016 arasında İstanbul Apostolik Vekili olan ve Türkiye Katolik Piskoposlar Konferansı’na 1995–2001 arasında başkanlık eden Mgr. Louis-Armel Pelâtre, 20 Ağustos 2026’da 86 yaşında vefat etti. Cenaze ayininin 24 Ağustos’ta Kutsal Ruh Katedrali’nde yapılacağı duyuruldu.",
   "textEn": "Mgr. Louis-Armel Pelâtre, Apostolic Vicar of Istanbul from 1992 to 2016 and President of the Catholic Bishops’ Conference of Turkey from 1995 to 2001, died on 20 August 2026 at the age of 86. His funeral was announced for 24 August at the Cathedral of the Holy Spirit.",
   "churchId": "sent-esprit",
   "source": ["Türkiye Katolik Piskoposlar Konferansı: Mgr. Kmetec’in taziye mesajı", "https://www.katolik-kilisesi.org/en/message-of-his-excellency-monsignor-martin-kmetec-president-of-the-catholic-bishops-conference-of-turkey-on-the-occasion-of-the-death-of-monsignor-louis-pelatre/", "Catholic Bishops’ Conference of Turkey: condolence message by Mgr. Kmetec"]
  }
 ],
 "updatedEn": "October 2026",
 "checked": "29 Ekim 2026, 23:07 (İstanbul saati)",
 "checkedEn": "29 October 2026, 23:07 (Istanbul time)"
}/*JSON-END*/;
