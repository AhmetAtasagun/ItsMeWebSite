# ItsMe — Proje Bilgisi

## Proje Tipi
Statik kişisel web sitesi (SPA-like, tek sayfa)

## Teknoloji Yığını
- **Frontend:** Vanilla HTML5 + CSS3 + JavaScript (ES6+)
- **Font:** Google Fonts (JetBrains Mono, Inter)
- **Veri:** JSON dosyaları (`data/` klasörü)
- **Deploy:** GitHub Pages + GitHub Actions
- **Framework:** Yok (bağımlılıksız)

## Mimari
- Tüm içerik `data/*.json` dosyalarından JS fetch ile yüklenir
- CSS design token sistemi (`variables.css`)
- Modüler JS yapısı (her bölüm ayrı modül, IIFE pattern)
- Intersection Observer tabanlı scroll animasyonları

## İçerik Yönetim Mekanizması
| Dosya | İçerik | Yayın Kontrolü |
|-------|--------|----------------|
| `data/site.json` | Kişisel bilgiler, meta | Yok (her zaman aktif) |
| `data/projects.json` | Projeler | `published: true/false` |
| `data/timelines.json` | Yaşam çizgileri | `published: true/false` |
| `data/skills.json` | Yetenekler | Yok (kategoriler arası geçiş) |

## Son Güncelleme
- **2026-10-06:** İletişim formu canlı e-posta gönderimi (`ahmet.atasagun@gmail.com` - FormSubmit AJAX) entegre edildi. Proje detay modalı genişletildi (`modal--large`), SVG mock-up grafikleriyle çoklu görsel slider (önceki/sonraki, dots, sayaç, klavye gezinimi) eklendi.
- **2026-10-06:** Proje oluşturuldu — tüm altyapı, bölümler ve deploy mekanizması
