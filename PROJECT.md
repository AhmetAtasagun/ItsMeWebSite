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
- **2026-10-10:** Giriş ekranındaki güvenlik açığı (şifre sıfırlama butonu) kaldırıldı. Panel içi bağımsız Şifre Değiştirme ve JSON İndirme modalları aktif edildi.
- **2026-10-09:** Yönetim paneline SHA-256 hash korumalı oturum/giriş sistemi (Auth Gate) eklendi. GitHub API bağlantı protokolü Bearer standardına güncellendi.
- **2026-10-08:** Web tabanlı dahili yönetim paneli (`admin.html`) geliştirildi. GitHub REST API Direct Deploy ve JSON Dışa Aktar desteği eklendi.
- **2026-10-06:** İletişim formu canlı e-posta gönderimi (`ahmet.atasagun@gmail.com` - FormSubmit AJAX) entegre edildi. Proje detay modalı genişletildi (`modal--large`), SVG mock-up grafikleriyle çoklu görsel slider (önceki/sonraki, dots, sayaç, klavye gezinimi) eklendi.
- **2026-10-06:** Proje oluşturuldu — tüm altyapı, bölümler ve deploy mekanizması
