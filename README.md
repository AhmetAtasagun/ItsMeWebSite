# ItsMe — Kişisel Web Sitesi

8+ yıllık deneyime sahip bir yazılım geliştiricinin kişisel portfolyo sitesi. Terminal/CLI estetiğinden ilham alan, modern animasyonlarla harmanlanan sıra dışı bir tasarıma sahiptir.

## 🚀 Özellikler

- **Boot Sequence:** Terminal tarzı açılış animasyonu
- **Particle Background:** Canvas tabanlı interaktif parçacık efekti
- **JSON-Driven Data:** Tüm içerik JSON dosyalarından yüklenir — veritabanı gerekmez
- **Çoklu Timeline:** Birden fazla yaşam çizgisi oluşturma ve yayınlama
- **Proje Yönetimi & Görsel Slider:** `published` flag ile yayın kontrolü, kategori filtreleme, genişletilmiş modal (`modal--large`) ve görsel slider (önceki/sonraki oklar, dots, sayaç, klavye gezinimi)
- **Canlı İletişim Formu:** Terminal geri bildirimli, doğrudan `ahmet.atasagun@gmail.com` adresine canlı e-posta gönderimi (FormSubmit AJAX entegrasyonu)
- **3D Tilt Kartlar:** Hover'da perspektif efekti
- **Scroll Reveal:** Intersection Observer tabanlı animasyonlar
- **Dahili Yönetim Paneli (`admin.html`):** Tarayıcı üzerinden formlarla tüm içerikleri (site, projeler, yetenekler, deneyimler) düzenleme, tek tıkla GitHub REST API üzerinden commit & push atıp canlıya alma veya JSON indirme
- **Responsive:** Tüm cihazlarda kusursuz
- **Erişilebilir:** `prefers-reduced-motion` desteği, semantic HTML
- **Otomatik Deploy:** GitHub Pages + GitHub Actions

## 🛠️ Teknoloji

- Vanilla HTML5 + CSS3 + JavaScript (ES6+)
- Sıfır framework, sıfır bağımlılık
- Google Fonts (JetBrains Mono + Inter)

## 📁 Yapı

```
├── .github/workflows/deploy.yml  # GitHub Pages auto-deploy
├── index.html                     # Ana sayfa
├── css/                           # Stil dosyaları
│   ├── variables.css              # Design tokens
│   ├── reset.css                  # CSS reset
│   ├── base.css                   # Temel stiller
│   ├── layout.css                 # Grid ve layout
│   ├── components.css             # UI bileşenleri
│   ├── animations.css             # Animasyonlar
│   └── responsive.css             # Responsive
├── js/                            # JavaScript modülleri
│   ├── particles.js               # Parçacık arka plan
│   ├── boot-sequence.js           # Terminal boot animasyonu
│   ├── scroll-animations.js       # Scroll efektleri
│   ├── skills-chart.js            # Yetenek görselleştirme
│   ├── projects-filter.js         # Proje filtreleme + modal
│   ├── contact-form.js            # İletişim formu
│   └── app.js                     # Ana orkestratör
├── data/                          # İçerik verileri
│   ├── site.json                  # Kişisel bilgiler, sosyal medya
│   ├── projects.json              # Proje verileri
│   ├── timelines.json             # Timeline verileri
│   └── skills.json                # Yetenek verileri
└── assets/
    ├── images/                    # Görseller
    └── icons/                     # SVG ikonlar
```

## 📋 İçerik Yönetimi

Tüm içerik `data/` klasöründeki JSON dosyalarından yönetilir:

- **Yeni proje ekle:** `data/projects.json`'a ekle, `published: true` yap
- **Yeni timeline oluştur:** `data/timelines.json`'a ekle
- **Yayına al/kaldır:** `published` alanını `true/false` yap
- **Kişisel bilgileri güncelle:** `data/site.json`'ı düzenle

## 🚢 Deploy

`main` branch'e push yapıldığında GitHub Actions otomatik olarak GitHub Pages'e deploy eder.

### İlk Kurulum:
1. GitHub'da repo oluştur
2. Settings → Pages → Source: "GitHub Actions" seç
3. Push yap, site otomatik yayınlanır

## 📅 Son Güncelleme

- **2026-10-06:** İlk sürüm — temel altyapı, tüm bölümler, JSON veri yönetimi, GitHub Actions deploy
