# Huquqiy hujjatlar

Bu papkada loyihaning litsenziya va mualliflik huquqiga oid hujjatlari to'plangan.

| Fayl | Mazmuni |
|---|---|
| [`../LICENSE`](../LICENSE) | Loyiha **kodining** litsenziyasi (MIT). GitHub va npm litsenziyani aynan loyiha ildizidagi faylidan taniydi, shuning uchun u shu yerda emas |
| [`SOURCES-RIGHTS.md`](SOURCES-RIGHTS.md) | Kitob manbalarining huquqiy holati: nima olinadi, qanday asosda, cheklovlar, tekshiruv jurnali va **kitobni olib tashlash tartibi** |
| [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) | Sayt foydalanadigan ochiq kodli paketlar va ularning litsenziyalari (avtomatik yaratiladi) |

## Nimaga qaysi litsenziya tegishli

```
 Loyiha kodi (src/, scripts/, sozlamalar) ──▶ MIT (LICENSE)           sizniki, boshqalar erkin ishlatishi mumkin
 Saytga kiruvchi ochiq paketlar         ──▶ MIT / ISC / 0BSD          THIRD_PARTY_LICENSES.md
 Kitoblar, audiokitoblar, muqovalar     ──▶ har bir manbaning o'z huquqi   SOURCES-RIGHTS.md (MIT ularga tegishli EMAS)
```

MIT litsenziyasi faqat **kodni** qamrab oladi. Katalogdagi kitoblar (matn, audio, muqova) o'z egalariga yoki
ommaviy mulkka tegishli va MIT bilan qayta litsenziyalanmaydi.

## Foydali buyruqlar

```bash
npm run licenses   # THIRD_PARTY_LICENSES.md ni qayta yaratish (bog'liqliklar o'zgargach)
```

## Kitobni olib tashlash

Huquq egasi talabi bilan kitobni katalogdan chiqarish: `src/data/blocklist.json` ga `id` qo'shing
(tafsilot: [SOURCES-RIGHTS.md, 5-bo'lim](SOURCES-RIGHTS.md#5-kitobni-olib-tashlash-takedown)).
