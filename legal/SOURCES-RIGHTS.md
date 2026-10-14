# Manbalar va mualliflik huquqi hujjati

Bu hujjat saytdagi har bir kitob manbasi uchun: nima olinadi, qanday huquqiy asosda, qanday cheklovlar bilan
ishlatiladi va nima tekshirilgan, nima tekshirilmagan. Manbalar qo'shilganda yoki o'zgarganda yangilab boring.

> **Muhim.** Bu hujjat huquqiy maslahat emas. U loyiha qanday asosda qurilganini qayd etadi. Katta trafik,
> tijorat maqsadi yoki shubhali holatlarda mutaxassis (yurist) bilan maslahatlashing.

Hujjat holati: **2026-10-14**. Tekshiruvlar "tekshirildi" deb belgilangan joylarda shu sanada texnik tarzda
bajarilgan (sayt sarlavhalari, API javoblari, robots.txt). Huquqiy xulosalar esa manbalarning o'z shartlariga
tayanadi va ularni siz o'zingiz tasdiqlashingiz kerak.

## 1. Umumiy tamoyillar

1. Saytga **faqat ommaviy mulk (public domain) yoki ochiq ruxsatli** materiallar kiritiladi.
2. Kitob fayllari **bizning serverimizda saqlanmaydi**. Sayt faqat katalog (nom, muallif, manzil) saqlaydi va
   matnni manba saytdan iframe orqali ko'rsatadi. Manba har bir kitobda ko'rsatiladi.
3. Mualliflik huquqi muddati mamlakatga qarab farq qiladi. "AQSHda ommaviy mulk" boshqa mamlakatda ham
   ommaviy mulk degani **emas**. Bu pastda alohida qayd etilgan.
4. Huquq egasi talab qilsa, kitob [olib tashlanadi](#5-kitobni-olib-tashlash-takedown).

## 2. Manbalar

### 2.1 Project Gutenberg

| | |
|---|---|
| Sayt | https://www.gutenberg.org |
| Nima olinadi | Katalog ma'lumoti (offline CSV katalog) va muqova rasmlari manzillari. Matn `gutenberg.org` dan iframe'da ochiladi |
| Huquqiy asos | Gutenberg AQSH qonunchiligiga ko'ra ommaviy mulkdagi asarlarni tarqatadi |
| Tekshirildi | Katalog `gutenberg.org/cache/epub/feeds/pg_catalog.csv` da ochiq; kitob sahifalari iframe'da ochiladi (bloklovchi sarlavha yo'q); har bir kitobning o'qish sahifasi mavjudligi parser tomonidan tekshiriladi. Kitob fayllari o'zining Gutenberg litsenziya sarlavhasini saqlaydi va u o'qish oynasida ko'rinadi |
| Cheklov | Gutenberg matnlari AQSHda ommaviy mulk. Mualliflari 1955-yildan keyin vafot etgan asarlar (O'zbekistonda muddat vafotdan 70 yil) AQShdan tashqarida hali himoyada bo'lishi mumkin. "Project Gutenberg" nomi va belgisidan foydalanish uchun Gutenberg o'z shartlarini belgilagan |
| Shartlar | https://www.gutenberg.org/policy/ |
| Sizning vazifangiz | Gutenberg shartlarini o'qib chiqing, ayniqsa nomdan foydalanish va tijoriy maqsad bo'yicha |

### 2.2 LibriVox

| | |
|---|---|
| Sayt | https://librivox.org |
| Nima olinadi | Audiokitob ma'lumoti (API). Audio Internet Archive orqali (`archive.org/embed/...`) o'ynatiladi |
| Huquqiy asos | LibriVox yozuvlari ommaviy mulkka bag'ishlangan; o'qilgan matnlar ommaviy mulkdagi asarlar |
| Tekshirildi | API ochiq (`librivox.org/api/feed/audiobooks`); audio sahifalar iframe'da ochiladi |
| Cheklov | Yozuvlar ommaviy mulk, lekin asl matnning huquqiy holati AQSH qonunchiligiga tayanadi (2.1 dagi izohga qarang) |
| Shartlar | https://librivox.org/pages/public-domain/ |

### 2.3 Internet Archive

| | |
|---|---|
| Sayt | https://archive.org |
| Nima olinadi | Qo'lda tanlangan klassik kitoblar (`src/data/sources.json`), `archive.org/embed/<id>` orqali |
| Huquqiy asos | Faqat aniq ommaviy mulkdagi asarlar: klassik mualliflar va 1925-yilgacha chop etilgan nashrlar |
| Tekshirildi | Embed sahifalar iframe'da ochiladi; faqat erkin o'qiladigan (qarzga olish talab qilinmaydigan) elementlar olinadi |
| Cheklov | Archive faqat fayl ochiq ekanini bildiradi, ommaviy mulk ekanini **kafolatlamaydi**: yuklovchi o'zi belgilaydi. Shu sabab elementlar qo'lda tanlangan, sovet davri nashrlari va zamonaviy mualliflar olinmagan |
| Shartlar | https://archive.org/about/terms.php |

### 2.4 Ziyouz.com kutubxonasi (o'zbek adabiyoti)

| | |
|---|---|
| Sayt | https://ziyouz.com |
| Nima olinadi | Katalog ma'lumoti (nom, muallif, hajm, yuklab olish soni). PDF fayllar `ziyouz.com` serveridan iframe'da (yoki Google PDF ko'rgichi orqali) ochiladi, bizning serverimizda saqlanmaydi |
| Huquqiy asos | Faqat tabiatan ommaviy mulk bo'limlari (xalq og'zaki ijodi, mumtoz adabiyot, Navoiy asarlari, Sharq mumtoz adabiyoti) va vafotiga 70 yildan oshgan mualliflar (1956-yilgacha vafot etganlar). Ro'yxat `scripts/sync-ziyouz.mjs` ichida |
| Tekshirildi | `robots.txt` kontent sahifalarini yopmagan (faqat tizim papkalari yopiq); parser bir vaqtda bitta so'rov bilan, 700 ms oraliqda ishlaydi; PDF fayllar iframe'ga ruxsat beradi (421 ta to'g'ridan-to'g'ri, 65 tasi `attachment` bo'lgani uchun Google ko'rgichi orqali) |
| Cheklov | Saytda zamonaviy, mualliflik huquqi ostidagi asarlar ham bor. Parser ularni **ataylab olmaydi**. Lekin: (a) nashr va tarjimalarning o'z huquqi bo'lishi mumkin (masalan 1992-yilgi sharhli nashr); (b) fayllar Ziyouz serveridan yuklanadi, ya'ni ularning trafigidan foydalanadi |
| **Ruxsat** | **Ziyouz.com egalaridan yozma ruxsat olinganligi qayd etilmagan.** Ommaviy foydalanishdan oldin ularga murojaat qilib, kelishib olish tavsiya etiladi |
| Sizning vazifangiz | Ruxsat holatini shu jadvalga yozing: `Ruxsat: olingan (sana, kim bilan)` yoki `olinmagan` |

### 2.5 Uchinchi tomon xizmatlari

| Xizmat | Nima uchun | Izoh |
|---|---|---|
| Google PDF ko'rgichi (`docs.google.com/viewer`) | Ziyouz'dagi 65 ta `attachment` fayl | Fayl manzili Google'ga yuboriladi; Google'ning shartlari amal qiladi |
| Google Fonts | Cormorant Garamond va Inter shriftlari | Shriftlar SIL OFL 1.1 ostida. Foydalanuvchining brauzeri Google serveriga murojaat qiladi (IP manzili ko'rinadi) |

## 3. Tekshiruv jurnali

| Sana | Manba | Nima tekshirildi | Natija |
|---|---|---|---|
| 2026-10-14 | Gutenberg | Katalog CSV mavjudligi, 3464 kitob sahifasi (HEAD) | Barchasi ochiladi |
| 2026-10-14 | LibriVox | API javobi, tillar bo'yicha saralash | 2714 audiokitob |
| 2026-10-14 | Internet Archive | Embed sahifa sarlavhalari | iframe'ga ruxsat bor |
| 2026-10-14 | Ziyouz.com | robots.txt, sahifa tuzilmasi, fayl sarlavhalari | Ruxsat berilgan yo'llar; 486 kitob |
| | | _keyingi tekshiruv uchun qator qo'shing_ | |

## 4. Huquqiy holatni qayta tekshirish

- Yangi manba qo'shishdan oldin: shartlarini o'qing, robots.txt ni tekshiring, iframe'ga ruxsat bor-yo'qligini
  sinab ko'ring va shu hujjatga yangi bo'lim qo'shing.
- Parserlarni ishga tushirgach (`npm run books:sync`) yangi kitoblar ro'yxatini ko'zdan kechiring.
- Har yilda bir marta manbalarning shartlari o'zgarmaganini tekshiring.

## 5. Kitobni olib tashlash (takedown)

Huquq egasi kitobni olib tashlashni so'rasa:

1. Kitobning `id` sini toping (kitob oynasi manzili yoki `src/data/*.json` ichida nom bo'yicha qidiring).
2. `src/data/blocklist.json` ga qo'shing:

   ```json
   [
     { "id": "zy-12345", "reason": "Huquq egasi talabi", "date": "2026-10-14" }
   ]
   ```

3. `git commit` va `git push` qiling. Vercel avtomatik qayta joylaydi va kitob katalogdan yo'qoladi.

`blocklist.json` dagi kitoblar `npm run books:sync` dan keyin ham qaytib kelmaydi.

Murojaat uchun aloqa: saytning pastki qismida ko'rsatilgan elektron pochta manzili (**gamer20061805@gmail.com**).
Murojaatlarga tezkor javob berish va kitobni imkon qadar tez olib tashlash tavsiya etiladi.
