# Ziyo Kutubxonasi

Rus, jahon va o'zbek adabiyotining bepul onlayn kutubxonasi, shuningdek audiokitoblar.
Katalogda **6000 dan ortiq kitob va audiokitob** bor. Faqat ommaviy mulkka o'tgan yoki ochiq
ruxsatli matnlar ishlatiladi. Kitoblar to'g'ridan-to'g'ri brauzerda o'qiladi, ro'yxatdan o'tish shart emas.

**Texnologiyalar:** React 19 · TypeScript · Tailwind CSS 4 · Motion · Vite 6 (backend yo'q, sof statik sayt)

## Mundarija

1. [Imkoniyatlar](#imkoniyatlar)
2. [Tez boshlash](#tez-boshlash)
3. [GitHub va Vercel'ga joylash](#github-va-vercelga-joylash)
4. [Loyiha tuzilmasi](#loyiha-tuzilmasi)
5. [Qanday ishlaydi](#qanday-ishlaydi)
6. [Kitob manbalari va parserlar](#kitob-manbalari-va-parserlar)
7. [Yangi kitob qo'shish](#yangi-kitob-qoshish)
8. [Kitob ma'lumotlari tuzilmasi](#kitob-malumotlari-tuzilmasi)
9. [Mualliflik huquqi va manbalar](#mualliflik-huquqi-va-manbalar)
10. [Muammolarni hal qilish](#muammolarni-hal-qilish)

---

## Imkoniyatlar

| Imkoniyat | Tafsilot |
|---|---|
| Katalog | 10 bo'lim: O'zbek, Rus, Chet el adabiyoti, Ilm-fan, Fantastika, Sarguzasht va detektiv, She'riyat va drama, Bolalar, Tarix va sayohat, Audiokitoblar |
| Tezkor o'tish | Sarlavhadagi **Bo'limlar** menyusi (telefonda menyu ichida) istalgan bo'limni bir bosishda ochadi |
| Qidiruv | Nom va muallif bo'yicha. `/` tugmasi qidiruvga fokus beradi |
| Filtrlar | Bo'lim, **til** (o'zbekcha, ruscha, inglizcha, nemischa va boshqalar), saralash (mashhurlik, nom, muallif) |
| O'qish | Sayt ichidagi o'qish oynasi. `Esc` yoki orqaga tugmasi bilan yopiladi |
| Audio | LibriVox audiokitoblari o'qish oynasida o'ynatiladi |
| Saqlanganlar | Yurak belgisi bilan saqlash (brauzerda, `localStorage`), **Oxirgi o'qilgan** kartochkasi |
| Dizayn | Animatsiyalar, `prefers-reduced-motion` hurmat qilinadi, klaviatura bilan to'liq boshqariladi |
| Tezlik | Katalog alohida chunk sifatida kerak bo'lganda yuklanadi, birinchi sahifa ~130 KB (gzip) |

## Tez boshlash

Kerak: **Node.js 18.18 yoki yangiroq**

```bash
npm install          # bog'liqliklarni o'rnatish
npm run dev          # http://localhost:3000
```

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri (3000-port) |
| `npm run build` | Production build, natija `dist/` papkasida |
| `npm run preview` | Build'ni lokal tekshirish (4173-port) |
| `npm run lint` | TypeScript tekshiruvi (`tsc --noEmit`) |
| `npm run books:sync` | Barcha kitob manbalarini yangilash ([pastga qarang](#kitob-manbalari-va-parserlar)) |

Atrof-muhit o'zgaruvchilari (`.env`) **kerak emas**.

## GitHub va Vercel'ga joylash

### 1. GitHub'ga yuklash

GitHub'da yangi bo'sh repozitoriy yarating (README yoki .gitignore qo'shmang), keyin loyiha papkasida:

```bash
git init
git add .
git commit -m "Ziyo Kutubxonasi"
git branch -M main
git remote add origin https://github.com/<foydalanuvchi>/<repozitoriy>.git
git push -u origin main
```

`.gitignore` allaqachon sozlangan: `node_modules/`, `dist/`, `.env*` va parser keshi
(`scripts/.pg_catalog.csv`, ~21 MB) repozitoriyga tushmaydi. Kitob ma'lumotlari (`src/data/*.json`,
jami ~4 MB) esa **repozitoriyda bo'lishi shart**, chunki sayt shulardan quriladi.

### 2. Vercel'ga ulash

```
 GitHub repozitoriy ──push──▶ Vercel ──npm install──▶ npm run build ──▶ dist/ ──▶ CDN (https://....vercel.app)
        ▲                                                                                 │
        └───────────── har bir `git push` avtomatik yangi deploy yaratadi ◀───────────────┘
```

1. [vercel.com/new](https://vercel.com/new) ga kiring va GitHub repozitoriyingizni **Import** qiling.
2. Sozlamalar `vercel.json` dan avtomatik olinadi, hech narsani o'zgartirish shart emas:

| Sozlama | Qiymat |
|---|---|
| Framework Preset | Vite |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variables | yo'q |
| Node.js | 18.x yoki yangiroq (Vercel'ning standarti mos) |

3. **Deploy** ni bosing. Bir necha daqiqadan keyin sayt `https://<loyiha>.vercel.app` manzilida ochiladi.
4. O'z domeningizni **Settings → Domains** orqali ulashingiz mumkin.

`vercel.json` nima qiladi: `/assets/*` fayllarini bir yilga keshlaydi (fayl nomida hash bor, har
deploy'da yangilanadi) va xavfsizlik sarlavhalarini (`X-Content-Type-Options`, `Referrer-Policy`) qo'shadi.
Sahifalar `#/saqlanganlar` kabi hash orqali ishlaydi, shuning uchun serverda qayta yo'naltirish (rewrite) kerak emas.

CLI orqali ham deploy qilish mumkin: `npx vercel` (preview) va `npx vercel --prod` (production).

## Loyiha tuzilmasi

```
Ziyo-book/
├── index.html                  kirish nuqtasi (meta teglar, shriftlar)
├── package.json                bog'liqliklar va buyruqlar
├── vite.config.ts              Vite sozlamasi (React, Tailwind, chunklar)
├── vercel.json                 Vercel: build, kesh va xavfsizlik sarlavhalari
├── tsconfig.json
│
├── src/
│   ├── main.tsx                React'ni ishga tushiradi
│   ├── index.css               Tailwind + dizayn ranglari va shriftlar
│   ├── App.tsx                 asosiy sahifa: qidiruv, filtrlar, ro'yxat, hero, "Biz haqimizda"
│   ├── types.ts                Book turi va bo'limlar ro'yxati (CATEGORIES)
│   ├── hooks.ts                localStorage, scroll qulfi, #hash-marshrutlash
│   ├── components/
│   │   ├── Header.tsx          sarlavha: navigatsiya, qidiruv, mobil menyu
│   │   ├── SectionsMenu.tsx    "Bo'limlar" tezkor o'tish menyusi
│   │   ├── Footer.tsx          pastki qism: sahifalar, bo'limlar, aloqa
│   │   ├── BookCard.tsx        ro'yxatdagi kitob kartochkasi
│   │   ├── BookCover.tsx       muqova (yuklanish animatsiyasi, muqovasiz zaxira)
│   │   ├── BookModal.tsx       kitob haqida oyna
│   │   ├── Reader.tsx          o'qish / tinglash oynasi (iframe)
│   │   └── SortSelect.tsx      sayt uslubidagi dropdown (saralash, til)
│   └── data/
│       ├── catalog.ts          katalogni kerak bo'lganda yuklaydi (lazy chunk)
│       ├── books.ts            barcha manba fayllarini birlashtiradi
│       ├── sources.json        qo'lda qo'shiladigan kitoblar manifesti
│       └── books-*.json        har bir manbaning natijasi (pastga qarang)
│
└── scripts/                    kitob parserlari (faqat Node, qo'shimcha paket yo'q)
    ├── sync-all.mjs            hamma parserni ketma-ket ishga tushiradi
    ├── sync-gutenberg-catalog.mjs   Gutenberg offline katalogi
    ├── sync-librivox.mjs       LibriVox audiokitoblari
    ├── sync-ziyouz.mjs         Ziyouz.com o'zbek kutubxonasi
    ├── add-sources.mjs         Internet Archive va qo'lda manifest
    ├── fetch-gutenberg.mjs     Gutendex API (yuklab olish sonlari)
    └── lib.mjs                 umumiy yordamchilar (CSV, fetch, til nomlari)
```

## Qanday ishlaydi

### Ma'lumotlar oqimi

Katalog **build vaqtida emas, oldindan** yig'iladi: parserlar tashqi saytlardan ma'lumot olib JSON
fayllarga yozadi, sayt esa faqat shu fayllarni o'qiydi. Shuning uchun sayt tez ishlaydi va tashqi
API'larga bog'liq emas.

```
 TASHQI MANBALAR              PARSERLAR (scripts/)            FAYLLAR (src/data/)
 ───────────────              ────────────────────            ───────────────────
 Gutenberg CSV  ──────────▶  sync-gutenberg-catalog  ──────▶  books-catalog.json
 Gutendex API   ──────────▶  fetch-gutenberg         ──────▶  books-gutenberg.json
 LibriVox API   ──────────▶  sync-librivox           ──────▶  books-audio.json
 Ziyouz.com     ──────────▶  sync-ziyouz             ──────▶  books-ziyouz.json
 Internet Archive ────────▶  add-sources (+sources.json) ──▶  books-custom.json
 (eski to'plamlar) ───────────────────────────────────────▶  books.json, books-extra.json
                                                                   │
                                                                   ▼
                                                      books.ts: birlashtirish,
                                                      takrorlarni olib tashlash,
                                                      mashhurlik bo'yicha saralash
                                                                   │
                                                                   ▼
                                    catalog.ts ─ dinamik import ─▶ alohida "books-*.js" chunk
                                                                   │
                                                                   ▼
                                                    App.tsx: filtr, qidiruv, ro'yxat
```

### Kitob qanday ochiladi

`Reader.tsx` kitobning `contentUrl` manzilini iframe ichida ko'rsatadi. Manzil manbaga qarab farq qiladi:

```
 Manba                 contentUrl                                   Qanday ko'rinadi
 ─────                 ──────────                                   ────────────────
 Gutenberg             gutenberg.org/cache/epub/<id>/pg<id>-images.html   HTML matn (iframe)
 LibriVox / Archive    archive.org/embed/<id>                             audio pleyer (iframe)
 Ziyouz.com (421 ta)   ziyouz.com/books/.../fayl.pdf                      brauzer PDF ko'rgichi (iframe)
 Ziyouz.com (65 ta)    docs.google.com/viewer?embedded=true&url=...       Google PDF ko'rgichi (iframe)
```

Ziyouz'dagi ba'zi fayllar `Content-Disposition: attachment` bilan beriladi (iframe ularni
ko'rsatmaydi, yuklab oladi). Parser bunday fayllarni aniqlab, Google ko'rgichi orqali ulaydi.
`external: true` belgili kitoblar esa o'qish oynasida emas, manba saytda yangi oynada ochiladi
(hozir bunday kitob yo'q, imkoniyat boshqa manbalar uchun saqlangan).

### Mashhurlik tartibi

```
 saralash kaliti  =  1) haqiqiy yuklab olish soni (Gutendex, Ziyouz)
                     2) bo'lmasa, sifat bali (rank): Gutenberg javonlari yoki qo'lda tanlash
```

## Kitob manbalari va parserlar

Har bir manba o'z parseriga ega va natijani alohida faylga yozadi. Biri xato bersa, qolganlari buzilmaydi.

| Buyruq | Manba | Natija fayli | Taxminan |
|---|---|---|---|
| `npm run books:catalog` | Project Gutenberg offline katalogi (CSV, 78 mingdan ortiq matn) | `books-catalog.json` | 3400 kitob |
| `npm run books:librivox` | LibriVox (ommaviy mulkdagi audiokitoblar) | `books-audio.json` | 2700 audio |
| `npm run books:ziyouz` | Ziyouz.com (o'zbek adabiyoti) | `books-ziyouz.json` | 490 kitob |
| `npm run books:add` | `src/data/sources.json` manifesti (Internet Archive, URL) | `books-custom.json` | 19 kitob |
| `npm run books:ia -- --query "..."` | Internet Archive qidiruvi | `books-custom.json` | `--save` bilan |
| `npm run books:gutenberg` | Gutendex API (yuklab olish sonlari bilan, sekin) | `books-gutenberg.json` | 600 kitob |
| `npm run books:sync` | Yuqoridagilarning hammasi (Gutendex'dan tashqari) | | |

`books:sync` ni tanlab ishga tushirish: `npm run books:sync -- --only catalog,ziyouz`.

### Parserlarning o'ziga xos jihatlari

- **Gutenberg katalogi.** 21 MB CSV bir marta yuklanadi (bir kun keshlanadi). Kitoblar Gutenberg'ning o'z
  javonlari (Classics of Literature, Best Books Ever, Harvard Classics) va "Category" teglari bo'yicha
  bo'limlarga ajratiladi. Har bir bo'limdan chegaralangan miqdor olinadi (`--per-category 450`), shunda bitta
  katta bo'lim boshqalarni siqib chiqarmaydi. O'qish sahifasi mavjudligi tekshiriladi. Tillar: en, ru, fr, de, es, it
  (`--lang en,ru,...`).
- **LibriVox.** API til bo'yicha filtrlamaydi, shuning uchun butun katalog sahifalab o'qiladi (500 tadan) va til
  bo'yicha saralanadi. Inglizcha audiokitoblar `--max-en 600` bilan cheklangan.
- **Ziyouz.com.** Sahifalar `Muallif. Asar nomi (yili)` formatida, muallif va yil ajratiladi. Sayt bilan
  hurmat bilan ishlanadi: bir vaqtda bitta so'rov, 700 ms oraliq. Har bir fayl uchun o'qish usuli aniqlanadi
  (to'g'ridan-to'g'ri yoki ko'rgich). Oldindan ko'rish: `npm run books:ziyouz -- --dry`.
- **Internet Archive.** Qidiruv `--save`siz faqat nomzodlarni chiqaradi, tekshirib keyin saqlanadi, chunki
  Archive'dagi til belgilari ishonchsiz.

## Yangi kitob qo'shish

Qo'lda tanlangan kitoblar `src/data/sources.json` ga yoziladi, keyin `npm run books:add` ishga tushiriladi:

```jsonc
{
  "archive": [
    {
      "category": "O'zbek adabiyoti",
      "language": "uzb",
      "ids": ["archive-org-identifikator"],
      "overrides": {
        "archive-org-identifikator": { "title": "Asar nomi", "author": "Muallif", "years": "1894–1938", "description": "Qisqa tavsif" }
      }
    }
  ],
  "urls": [
    {
      "title": "Asar nomi", "author": "Muallif", "category": "O'zbek adabiyoti", "language": "O'zbekcha",
      "contentUrl": "https://sayt.uz/kitob.pdf", "coverImage": "https://sayt.uz/muqova.jpg"
    }
  ]
}
```

Qoidalar: `category` bo'limlardan biri bo'lishi kerak (`src/types.ts` dagi `CATEGORIES`). `contentUrl` sahifasi
iframe ichida ochilishiga ruxsat berishi kerak (`X-Frame-Options` yoki `frame-ancestors` bloklamasligi). Faqat huquqi
aniq asarlarni qo'shing.

Yangi **bo'lim** qo'shish uchun: `src/types.ts` dagi `CATEGORIES` ga nom qo'shing va `scripts/lib.mjs` dagi
`CATEGORY_LIST` ga ham yozing.

## Kitob ma'lumotlari tuzilmasi

Har bir kitob (`src/types.ts` dagi `Book`):

| Maydon | Turi | Izoh |
|---|---|---|
| `id` | string | Noyob (`12345` Gutenberg, `lv-…` LibriVox, `zy-…` Ziyouz, `ia-…` Archive) |
| `title`, `author` | string | Nom va muallif |
| `years` | string | Muallif hayot yillari, masalan `1821–1881` (bo'sh bo'lishi mumkin) |
| `description` | string | Qisqa tavsif (bo'sh bo'lsa, standart matn ko'rsatiladi) |
| `category` | string | Bo'limlardan biri |
| `language` | string? | Ko'rsatiladigan til nomi; yo'q bo'lsa "Inglizcha" |
| `source` | string? | Manba nomi (kitob oynasida ko'rinadi) |
| `kind` | `'audio'`? | Audiokitob belgisi |
| `duration` | string? | Audiokitob davomiyligi |
| `external` | boolean? | `true` bo'lsa kitob manba saytda yangi oynada ochiladi |
| `coverImage` | string | Muqova manzili (bo'sh bo'lsa, matnli muqova chiziladi) |
| `contentUrl` | string | O'qish / tinglash manzili (iframe uchun) |
| `downloads` | number | Haqiqiy yuklab olish soni (mashhurlik uchun) |
| `rank` | number? | Yuklab olish soni yo'q manbalar uchun sifat bali |

## Mualliflik huquqi va manbalar

Loyiha kodi sizniki, kitoblar esa o'z egalariga tegishli. Saytga faqat huquqi aniq materiallar kiritilgan.

| Manba | Nima | Huquqiy holat |
|---|---|---|
| [Project Gutenberg](https://www.gutenberg.org) | Matnlar, muqovalar | AQSH'da ommaviy mulk. Gutenberg o'z shartlariga ega |
| [LibriVox](https://librivox.org) | Audiokitoblar | Ommaviy mulk (volontyorlar o'qishi) |
| [Internet Archive](https://archive.org) | Qo'lda tanlangan klassiklar | Faqat tekshirilgan, 1925-yilgacha chop etilgan yoki ommaviy mulk asarlar |
| [Ziyouz.com](https://ziyouz.com) | O'zbek kitoblari (PDF) | Faqat xalq ijodi, mumtoz adabiyot va vafotiga 70 yildan oshgan mualliflar (O'zbekiston qonuni bo'yicha). Fayllar nusxalanmaydi, ularning serveridan yuklanadi, manba ko'rsatiladi |

Muhim:
- Ziyouz.com'da mualliflik huquqi ostidagi zamonaviy asarlar ham bor. Parser ularni **ataylab olmaydi**
  (ruxsat ro'yxati `scripts/sync-ziyouz.mjs` ichida). Bu ro'yxatni kengaytirishdan oldin huquqni tekshiring.
- Nashr va tarjimalarning o'z huquqi bo'lishi mumkin (masalan, 1992-yilgi sharh).
- Ziyouz PDF'lari ularning serveridan yuklanadi, ya'ni ularning trafigidan foydalanadi. Katta trafik kutilsa,
  sayt egalari bilan kelishing.
- Ma'lumotlarni qayta yig'ishda manbalarning foydalanish shartlariga rioya qiling (so'rovlar orasidagi
  oraliqlarni kamaytirmang).

## Muammolarni hal qilish

| Muammo | Sabab va yechim |
|---|---|
| Sahifa "Kutubxona ochilmoqda…" da qotib qoladi | Katalog chunk'i (~1 MB) yuklanmayapti. Tarmoqni tekshiring, sahifani qattiq yangilang (`Ctrl+Shift+R`). Vercel'da `dist/assets/books-*.js` mavjudligini tekshiring |
| Kitob o'qish oynasida bo'sh | Manba sayt iframe'ga ruxsat bermayotgan bo'lishi mumkin. O'qish oynasidagi "Yangi oynada ochish" tugmasidan foydalaning |
| PDF telefonda faqat birinchi sahifa | Mobil brauzerlar (ayniqsa iOS) iframe ichidagi PDF'ni cheklaydi. "Yangi oynada ochish" ni ishlating |
| Google ko'rgichli PDF ochilmaydi | Katta fayllar yoki Google cheklovi. "Yangi oynada ochish" ishlaydi |
| `books:*` parseri javob bermaydi | Tashqi API (Gutendex, LibriVox) vaqtincha sekin. Qayta ishga tushiring: Gutenberg parseri to'xtagan joydan davom etadi |
| Yangi kitoblar saytda ko'rinmaydi | Parser `src/data/*.json` ni yangiladi, lekin `git commit` va `git push` qilinmagan. Vercel faqat repozitoriydagi fayllardan quradi |
| Vercel build xatosi | Lokal `npm run build` va `npm run lint` ni ishga tushiring. Node 18.18+ ekanini tekshiring |
| Saqlanganlar yo'qoldi | Ular faqat shu brauzerning `localStorage` ida saqlanadi (boshqa brauzer yoki maxfiy rejimda bo'lmaydi) |

## Klaviatura

| Tugma | Amal |
|---|---|
| `/` | Qidiruvga o'tish |
| `Esc` | Ochiq oyna, o'qish yoki menyuni yopish |
| `↑` `↓` `Enter` | Saralash va til ro'yxatida yurish va tanlash |
