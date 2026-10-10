/**
 * ItsMe — Admin Dashboard Controller
 * Manages site data, local edits, JSON exports, and direct GitHub API commits
 */

(function () {
  'use strict';

  // State
  let siteData = null;
  let projectsData = [];
  let skillsData = [];
  let timelinesData = [];

  const GITHUB_STORAGE_KEY = 'itsme_gh_config';
  const AUTH_SESSION_KEY = 'itsme_admin_session';
  const AUTH_HASH_KEY = 'itsme_admin_pass_hash';

  // Elements
  const logBox = document.getElementById('admin-log-content');

  function log(msg, type = 'info') {
    if (!logBox) return;
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    const color = type === 'error' ? 'var(--color-error)' : (type === 'success' ? 'var(--color-success)' : 'var(--text-secondary)');
    div.style.color = color;
    div.innerHTML = `&gt; [${time}] ${msg}`;
    logBox.appendChild(div);
    logBox.parentElement.scrollTop = logBox.parentElement.scrollHeight;
  }

  // Helper: SHA-256 Hash
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Helper: Format and clean GitHub Token
  function formatToken(raw) {
    if (!raw) return '';
    let clean = raw.trim();
    clean = clean.replace(/^(bearer|token)\s+/i, '').trim();
    clean = clean.replace(/^["']|["']$/g, '').trim();
    return clean;
  }

  // --- Auth Gate (Login) ---
  function initAuthGate() {
    const overlay = document.getElementById('admin-auth-overlay');
    const form = document.getElementById('form-auth-login');
    const desc = document.getElementById('admin-auth-desc');
    const passInput = document.getElementById('auth-password');
    const setupGroup = document.getElementById('auth-setup-group');
    const confirmInput = document.getElementById('auth-password-confirm');
    const feedback = document.getElementById('auth-feedback');
    const logoutBtn = document.getElementById('btn-logout');
    const resetPassBtn = document.getElementById('btn-reset-password');

    function updateGateState() {
      const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
      const storedHash = localStorage.getItem(AUTH_HASH_KEY);

      if (isAuthenticated) {
        if (overlay) overlay.style.display = 'none';
      } else {
        if (overlay) overlay.style.display = 'flex';
        if (!storedHash) {
          desc.textContent = 'İlk kurulum / Sıfırlama: Lütfen yeni bir yönetici parolası belirleyin.';
          setupGroup.style.display = 'block';
          confirmInput.required = true;
          passInput.placeholder = 'Yeni parola belirleyin...';
        } else {
          desc.textContent = 'Devam etmek için yönetici parolanızı girin.';
          setupGroup.style.display = 'none';
          confirmInput.required = false;
          passInput.placeholder = 'Parolanızı yazın...';
        }
      }
    }

    updateGateState();

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = passInput.value;
        const storedHash = localStorage.getItem(AUTH_HASH_KEY);

        if (!storedHash) {
          // Setting new password
          const confirmPass = confirmInput.value;
          if (pass !== confirmPass) {
            feedback.style.color = 'var(--color-error)';
            feedback.textContent = '> Parolalar birbiriyle eşleşmiyor!';
            return;
          }
          if (pass.length < 4) {
            feedback.style.color = 'var(--color-error)';
            feedback.textContent = '> Parola en az 4 karakter olmalıdır.';
            return;
          }

          const hash = await sha256(pass);
          localStorage.setItem(AUTH_HASH_KEY, hash);
          sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
          feedback.style.color = 'var(--color-success)';
          feedback.textContent = '> Parola başarıyla kaydedildi! Giriş yapılıyor...';

          setTimeout(() => {
            overlay.style.display = 'none';
            log('Yönetici parolası belirlendi ve oturum açıldı.', 'success');
          }, 400);
        } else {
          // Verify existing password
          const enteredHash = await sha256(pass);
          if (enteredHash === storedHash) {
            sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
            feedback.style.color = 'var(--color-success)';
            feedback.textContent = '> Doğrulandı ✓ Giriş yapılıyor...';

            setTimeout(() => {
              overlay.style.display = 'none';
              log('Yönetici oturumu başarıyla açıldı.', 'success');
            }, 300);
          } else {
            feedback.style.color = 'var(--color-error)';
            feedback.textContent = '> Hatalı parola! Erişim reddedildi.';
            passInput.value = '';
            passInput.focus();
          }
        }
      });
    }

    // Direct Instant Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        passInput.value = '';
        confirmInput.value = '';
        feedback.textContent = '';
        updateGateState();
        log('Yönetici oturumu kapatıldı.', 'info');
      });
    }

    // Password Change Modal (while logged in)
    const passModal = document.getElementById('password-change-modal');
    const openPassModalBtn = document.getElementById('btn-open-pass-modal');
    const closePassModalBtn = document.getElementById('btn-close-pass-modal');
    const cancelPassBtn = document.getElementById('btn-cancel-pass');
    const formChangePass = document.getElementById('form-change-password');
    const changePassFeedback = document.getElementById('change-pass-feedback');

    if (openPassModalBtn && passModal) {
      openPassModalBtn.addEventListener('click', () => {
        formChangePass?.reset();
        if (changePassFeedback) changePassFeedback.textContent = '';
        passModal.classList.add('active');
      });
    }

    [closePassModalBtn, cancelPassBtn].forEach(btn => {
      btn?.addEventListener('click', () => passModal?.classList.remove('active'));
    });

    if (formChangePass) {
      formChangePass.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-pass-input').value;
        const confirmPass = document.getElementById('new-pass-confirm-input').value;

        if (newPass !== confirmPass) {
          changePassFeedback.style.color = 'var(--color-error)';
          changePassFeedback.textContent = '> Parolalar birbiriyle eşleşmiyor!';
          return;
        }
        if (newPass.length < 4) {
          changePassFeedback.style.color = 'var(--color-error)';
          changePassFeedback.textContent = '> Parola en az 4 karakter olmalıdır.';
          return;
        }

        const newHash = await sha256(newPass);
        localStorage.setItem(AUTH_HASH_KEY, newHash);
        changePassFeedback.style.color = 'var(--color-success)';
        changePassFeedback.textContent = '> Parola başarıyla güncellendi!';
        log('Yönetici parolası güncellendi.', 'success');

        setTimeout(() => {
          passModal.classList.remove('active');
          alert('Parolanız başarıyla güncellendi!');
        }, 600);
      });
    }
  }

  // --- Initialization ---
  async function init() {
    initAuthGate();
    setupTabs();
    setupGitHubConfig();
    await loadAllData();
    renderSiteForm();
    renderProjectsList();
    renderSkillsList();
    renderTimelinesList();
    setupEventListeners();
  }

  // --- Load Data from local JSON files ---
  async function loadAllData() {
    try {
      const [siteRes, projRes, skillsRes, timeRes] = await Promise.all([
        fetch('data/site.json'),
        fetch('data/projects.json'),
        fetch('data/skills.json'),
        fetch('data/timelines.json')
      ]);

      siteData = await siteRes.json();
      projectsData = await projRes.json();
      skillsData = await skillsRes.json();
      timelinesData = await timeRes.json();

      log('Tüm veriler (site, projects, skills, timelines) başarıyla yüklendi.', 'success');
    } catch (err) {
      log('Veriler yüklenirken hata: ' + err.message, 'error');
    }
  }

  // --- Tab Navigation ---
  function setupTabs() {
    const tabs = document.querySelectorAll('.admin-nav__btn');
    const sections = document.querySelectorAll('.admin-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.dataset.tab;
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
      });
    });
  }

  // --- Tab 1: Site.json ---
  function renderSiteForm() {
    if (!siteData) return;
    document.getElementById('site-name').value = siteData.name || '';
    document.getElementById('site-title').value = siteData.title || '';
    document.getElementById('site-tagline').value = siteData.tagline || '';
    document.getElementById('site-bio').value = siteData.bio || '';
    document.getElementById('site-email').value = siteData.email || '';
    document.getElementById('site-location').value = siteData.location || '';

    if (siteData.social) {
      document.getElementById('site-github').value = siteData.social.github || '';
      document.getElementById('site-linkedin').value = siteData.social.linkedin || '';
      document.getElementById('site-twitter').value = siteData.social.twitter || '';
      document.getElementById('site-medium').value = siteData.social.medium || '';
    }
  }

  function saveSiteForm() {
    siteData.name = document.getElementById('site-name').value.trim();
    siteData.title = document.getElementById('site-title').value.trim();
    siteData.tagline = document.getElementById('site-tagline').value.trim();
    siteData.bio = document.getElementById('site-bio').value.trim();
    siteData.email = document.getElementById('site-email').value.trim();
    siteData.location = document.getElementById('site-location').value.trim();

    if (!siteData.social) siteData.social = {};
    siteData.social.github = document.getElementById('site-github').value.trim();
    siteData.social.linkedin = document.getElementById('site-linkedin').value.trim();
    siteData.social.twitter = document.getElementById('site-twitter').value.trim();
    siteData.social.medium = document.getElementById('site-medium').value.trim();

    log('Genel bilgiler güncellendi. (Değişiklikleri kalıcı yapmak için "GitHub\'a Gönder" veya "JSON İndir" yapın)', 'success');
    alert('Bilgiler hafızaya kaydedildi!');
  }

  // --- Tab 2: Projects.json ---
  function renderProjectsList() {
    const list = document.getElementById('projects-list');
    const countEl = document.getElementById('count-projects');
    if (!list) return;

    if (countEl) countEl.textContent = projectsData.length;

    list.innerHTML = projectsData.map((p, idx) => `
      <div class="admin-item-card" data-id="${p.id}">
        <div class="admin-item-card__info">
          <div class="admin-item-card__title">
            <span>${p.title}</span>
            <span class="${p.published ? 'badge--published' : 'badge--draft'}">
              ${p.published ? '● Yayında' : '○ Taslak'}
            </span>
            <span style="font-size: var(--fs-xs); color: var(--text-muted); font-family: monospace;">[${p.category}]</span>
          </div>
          <div class="admin-item-card__desc">${p.description}</div>
          <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
            ${(p.tags || []).map(t => `<span class="tag" style="font-size: 10px; padding: 1px 6px;">${t}</span>`).join('')}
          </div>
        </div>
        <div class="admin-item-card__actions">
          <button class="btn btn--ghost btn-toggle-publish" data-id="${p.id}" style="padding: 4px 8px; font-size: var(--fs-xs);">
            ${p.published ? 'Gizle' : 'Yayınla'}
          </button>
          <button class="btn btn--outline btn-edit-project" data-id="${p.id}" style="padding: 4px 10px; font-size: var(--fs-xs);">
            Düzenle
          </button>
          <button class="btn btn--ghost btn-delete-project" data-id="${p.id}" style="padding: 4px 8px; font-size: var(--fs-xs); color: var(--color-error);">
            Sil
          </button>
        </div>
      </div>
    `).join('');

    // Event listeners
    list.querySelectorAll('.btn-toggle-publish').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const proj = projectsData.find(p => p.id === id);
        if (proj) {
          proj.published = !proj.published;
          log(`Proje '${proj.title}' durumu değiştirildi: ${proj.published ? 'Yayında' : 'Taslak'}`);
          renderProjectsList();
        }
      });
    });

    list.querySelectorAll('.btn-delete-project').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const proj = projectsData.find(p => p.id === id);
        if (confirm(`"${proj?.title}" projesini silmek istediğinize emin misiniz?`)) {
          projectsData = projectsData.filter(p => p.id !== id);
          log(`Proje silindi: ${id}`, 'info');
          renderProjectsList();
        }
      });
    });

    list.querySelectorAll('.btn-edit-project').forEach(btn => {
      btn.addEventListener('click', () => {
        openProjectModal(btn.dataset.id);
      });
    });
  }

  function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-editor-modal');
    const heading = document.getElementById('project-modal-heading');
    const form = document.getElementById('form-project-editor');

    if (!modal || !form) return;

    if (projectId) {
      const proj = projectsData.find(p => p.id === projectId);
      if (!proj) return;
      heading.textContent = '> Proje Düzenle';
      document.getElementById('proj-id').value = proj.id;
      document.getElementById('proj-title').value = proj.title;
      document.getElementById('proj-desc').value = proj.description || '';
      document.getElementById('proj-long-desc').value = proj.longDescription || '';
      document.getElementById('proj-category').value = proj.category || 'backend';
      document.getElementById('proj-tags').value = (proj.tags || []).join(', ');
      document.getElementById('proj-images').value = (proj.images || (proj.imageUrl ? [proj.imageUrl] : [])).join(', ');
      document.getElementById('proj-demo').value = proj.demoUrl || '#';
      document.getElementById('proj-source').value = proj.sourceUrl || '#';
      document.getElementById('proj-published').checked = !!proj.published;
      document.getElementById('proj-featured').checked = !!proj.featured;
    } else {
      heading.textContent = '> Yeni Proje Ekle';
      form.reset();
      document.getElementById('proj-id').value = '';
      document.getElementById('proj-published').checked = true;
    }

    modal.classList.add('active');
  }

  function closeProjectModal() {
    const modal = document.getElementById('project-editor-modal');
    if (modal) modal.classList.remove('active');
  }

  function handleSaveProject(e) {
    e.preventDefault();
    const id = document.getElementById('proj-id').value.trim() || ('project-' + Date.now());
    const title = document.getElementById('proj-title').value.trim();
    const desc = document.getElementById('proj-desc').value.trim();
    const longDesc = document.getElementById('proj-long-desc').value.trim();
    const category = document.getElementById('proj-category').value;
    const tags = document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const images = document.getElementById('proj-images').value.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
    const demo = document.getElementById('proj-demo').value.trim();
    const source = document.getElementById('proj-source').value.trim();
    const published = document.getElementById('proj-published').checked;
    const featured = document.getElementById('proj-featured').checked;

    const existingIdx = projectsData.findIndex(p => p.id === id);

    const projectObj = {
      id,
      title,
      description: desc,
      longDescription: longDesc,
      category,
      tags,
      imageUrl: images[0] || 'assets/images/projects/project-1-1.svg',
      images: images.length ? images : ['assets/images/projects/project-1-1.svg'],
      demoUrl: demo || '#',
      sourceUrl: source || '#',
      featured,
      published,
      order: existingIdx >= 0 ? projectsData[existingIdx].order : (projectsData.length + 1)
    };

    if (existingIdx >= 0) {
      projectsData[existingIdx] = projectObj;
      log(`Proje güncellendi: ${title}`, 'success');
    } else {
      projectsData.push(projectObj);
      log(`Yeni proje eklendi: ${title}`, 'success');
    }

    closeProjectModal();
    renderProjectsList();
  }

  // --- Tab 3: Skills.json ---
  function renderSkillsList() {
    const container = document.getElementById('skills-categories-container');
    if (!container || !skillsData.length) return;

    container.innerHTML = skillsData.map((cat, catIdx) => `
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-lg); margin-bottom: var(--space-xl);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-md);">
          <h3 style="font-family: var(--font-mono); font-size: var(--fs-base); color: var(--accent-cyan);">${cat.category}</h3>
          <button class="btn btn--outline btn-add-skill" data-cat-idx="${catIdx}" style="padding: 2px 8px; font-size: 11px;">+ Yetenek Ekle</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(cat.items || []).map((skill, sIdx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: var(--radius-md);">
              <span style="font-size: var(--fs-sm); font-weight: 500; min-width: 140px;">${skill.name}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" min="0" max="100" value="${skill.level}" class="form__input skill-level-input" data-cat="${catIdx}" data-idx="${sIdx}" style="width: 70px; padding: 2px 6px; text-align: center;">
                <span style="font-size: var(--fs-xs); color: var(--text-muted);">%</span>
                <input type="text" value="${skill.years || ''}" placeholder="8+ yıl" class="form__input skill-years-input" data-cat="${catIdx}" data-idx="${sIdx}" style="width: 80px; padding: 2px 6px; font-size: 11px;">
                <button class="btn btn--ghost btn-del-skill" data-cat="${catIdx}" data-idx="${sIdx}" style="color: var(--color-error); padding: 2px 6px;">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Listeners
    container.querySelectorAll('.skill-level-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const cat = inp.dataset.cat;
        const idx = inp.dataset.idx;
        skillsData[cat].items[idx].level = parseInt(inp.value, 10);
      });
    });

    container.querySelectorAll('.skill-years-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const cat = inp.dataset.cat;
        const idx = inp.dataset.idx;
        skillsData[cat].items[idx].years = inp.value.trim();
      });
    });

    container.querySelectorAll('.btn-del-skill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        const idx = btn.dataset.idx;
        skillsData[cat].items.splice(idx, 1);
        renderSkillsList();
      });
    });

    container.querySelectorAll('.btn-add-skill').forEach(btn => {
      btn.addEventListener('click', () => {
        const catIdx = btn.dataset.catIdx;
        const name = prompt('Yetenek / Teknoloji Adı:');
        if (name && name.trim()) {
          skillsData[catIdx].items.push({
            name: name.trim(),
            level: 80,
            years: '3+ yıl'
          });
          renderSkillsList();
        }
      });
    });
  }

  // --- Tab 4: Timelines.json ---
  function renderTimelinesList() {
    const container = document.getElementById('timelines-container');
    if (!container || !timelinesData.length) return;

    container.innerHTML = timelinesData.map((tl, tlIdx) => `
      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-lg); margin-bottom: var(--space-xl);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-md);">
          <div>
            <strong style="color: var(--accent-primary); font-family: var(--font-mono);">${tl.title}</strong>
            <span class="${tl.published ? 'badge--published' : 'badge--draft'}" style="margin-left: 8px;">
              ${tl.published ? 'Yayında' : 'Taslak'}
            </span>
          </div>
          <div style="display:flex; gap: 8px;">
            <button class="btn btn--ghost btn-toggle-tl-publish" data-idx="${tlIdx}" style="padding: 2px 8px; font-size: 11px;">
              ${tl.published ? 'Gizle' : 'Yayınla'}
            </button>
            <button class="btn btn--outline btn-add-tl-item" data-idx="${tlIdx}" style="padding: 2px 8px; font-size: 11px;">
              + Deneyim Ekle
            </button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(tl.items || []).map((item, itemIdx) => `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); padding: 8px 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="color: var(--text-primary); font-size: var(--fs-sm);">${item.role} @ ${item.company}</strong>
                <div style="font-size: var(--fs-xs); color: var(--accent-cyan); font-family: monospace;">${item.period} · ${item.location}</div>
                <div style="font-size: var(--fs-xs); color: var(--text-muted); margin-top: 4px;">${item.description}</div>
              </div>
              <button class="btn btn--ghost btn-del-tl-item" data-tl="${tlIdx}" data-item="${itemIdx}" style="color: var(--color-error); padding: 2px 6px;">✕</button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-toggle-tl-publish').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        timelinesData[idx].published = !timelinesData[idx].published;
        renderTimelinesList();
      });
    });

    container.querySelectorAll('.btn-del-tl-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tl = btn.dataset.tl;
        const item = btn.dataset.item;
        timelinesData[tl].items.splice(item, 1);
        renderTimelinesList();
      });
    });

    container.querySelectorAll('.btn-add-tl-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tlIdx = btn.dataset.idx;
        const role = prompt('Pozisyon / Unvan (Örn: Senior Backend Dev):');
        if (!role) return;
        const company = prompt('Şirket Adı:') || '';
        const period = prompt('Dönem (Örn: 2022 — Günümüz):') || '';
        const desc = prompt('Açıklama:') || '';

        timelinesData[tlIdx].items.unshift({
          role,
          company,
          period,
          location: 'Türkiye / Remote',
          description: desc,
          tags: []
        });
        renderTimelinesList();
      });
    });
  }

  // --- GitHub Config & Deploy ---
  function setupGitHubConfig() {
    const raw = localStorage.getItem(GITHUB_STORAGE_KEY);
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        document.getElementById('gh-owner').value = cfg.owner || '';
        document.getElementById('gh-repo').value = cfg.repo || '';
        document.getElementById('gh-token').value = cfg.token || '';
      } catch (e) {}
    }
  }

  function saveGitHubConfig() {
    const owner = document.getElementById('gh-owner').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = formatToken(document.getElementById('gh-token').value);

    document.getElementById('gh-token').value = token;
    localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify({ owner, repo, token }));
    log('GitHub yapılandırması yerel hafızaya kaydedildi.', 'success');
    alert('GitHub ayarları kaydedildi!');
  }

  async function testGitHubConnection() {
    const statusEl = document.getElementById('gh-test-status');
    const owner = document.getElementById('gh-owner').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = formatToken(document.getElementById('gh-token').value);

    if (!owner || !repo || !token) {
      statusEl.style.color = 'var(--color-error)';
      statusEl.textContent = 'Lütfen kullanıcı, repo ve token alanlarını doldurun!';
      return;
    }

    // Auto-update input with cleaned token
    document.getElementById('gh-token').value = token;

    statusEl.style.color = 'var(--accent-cyan)';
    statusEl.textContent = 'Bağlantı test ediliyor...';

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (res.ok) {
        const data = await res.json();
        statusEl.style.color = 'var(--color-success)';
        statusEl.textContent = `✓ Başarılı! (${data.full_name})`;
        log(`GitHub repo bağlantısı doğrulandı: ${data.full_name}`, 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        let errMessage = errData.message || res.statusText || 'Bilinmeyen hata';
        if (res.status === 401) {
          errMessage = '401 Yetkisiz (Bad Credentials): Token geçersiz, süresi dolmuş veya "repo" / "Contents: Read and write" izni eksik.';
        } else if (res.status === 404) {
          errMessage = `404 Bulunamadı: "${owner}/${repo}" deposu bulunamadı veya bu depoya erişim izniniz yok.`;
        }
        throw new Error(errMessage);
      }
    } catch (err) {
      statusEl.style.color = 'var(--color-error)';
      statusEl.textContent = `✗ ${err.message}`;
      log(`GitHub bağlantı testi başarısız: ${err.message}`, 'error');
    }
  }

  // Commit single file to GitHub via API
  async function commitFileToGitHub(owner, repo, token, path, contentObj, message) {
    const cleanTokenVal = formatToken(token);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      'Authorization': `Bearer ${cleanTokenVal}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };

    // 1. Get current file SHA if exists
    let sha = null;
    try {
      const getRes = await fetch(url, { headers });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }
    } catch (e) {}

    // 2. Base64 encode JSON content
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(contentObj, null, 2));
    let binary = '';
    utf8Bytes.forEach(b => binary += String.fromCharCode(b));
    const base64Content = btoa(binary);

    // 3. Put request
    const body = {
      message: message,
      content: base64Content
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(`[${path}] ${errData.message || 'Commit hatası'}`);
    }

    return await putRes.json();
  }

  // Deploy all files to GitHub
  async function deployToGitHub() {
    const raw = localStorage.getItem(GITHUB_STORAGE_KEY);
    let cfg = {};
    if (raw) {
      try { cfg = JSON.parse(raw); } catch (e) {}
    }

    const owner = cfg.owner || document.getElementById('gh-owner').value.trim();
    const repo = cfg.repo || document.getElementById('gh-repo').value.trim();
    const token = formatToken(cfg.token || document.getElementById('gh-token').value);

    if (!owner || !repo || !token) {
      alert('GitHub Token ve Repo bilgisi tanımlı değil! Lütfen sol menüden "GitHub Bağlantısı" sekmesine gidip bilgileri kaydedin.');
      document.querySelector('[data-tab="tab-github"]')?.click();
      return;
    }

    if (!confirm('Tüm değişiklikler doğrudan GitHub deponuza gönderilecek ve otomatik canlıya alınacak. Onaylıyor musunuz?')) {
      return;
    }

    log('GitHub canlıya alma (deploy) işlemi başlatıldı...', 'info');

    const btn = document.getElementById('btn-deploy-github');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⚡ Gönderiliyor...';

    try {
      log('Commit 1/4: data/site.json gönderiliyor...');
      await commitFileToGitHub(owner, repo, token, 'data/site.json', siteData, 'chore: update site.json via Admin Panel');

      log('Commit 2/4: data/projects.json gönderiliyor...');
      await commitFileToGitHub(owner, repo, token, 'data/projects.json', projectsData, 'chore: update projects.json via Admin Panel');

      log('Commit 3/4: data/skills.json gönderiliyor...');
      await commitFileToGitHub(owner, repo, token, 'data/skills.json', skillsData, 'chore: update skills.json via Admin Panel');

      log('Commit 4/4: data/timelines.json gönderiliyor...');
      await commitFileToGitHub(owner, repo, token, 'data/timelines.json', timelinesData, 'chore: update timelines.json via Admin Panel');

      log('✓ Tüm dosyalar GitHub deponuza başarıyla push edildi!', 'success');
      log('🚀 GitHub Actions deploy süreci otomatik başladı. ~30-60 saniye içinde siteniz güncellenecektir.', 'success');
      alert('Tebrikler! Değişiklikler GitHub\'a gönderildi. Birkaç dakika içinde yayında olacak.');
    } catch (err) {
      log('Canlıya alma başarısız: ' + err.message, 'error');
      alert('Hata oluştu: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // JSON Export (Download)
  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log(`'${filename}' tarayıcının İndirilenler klasörüne kaydedildi.`, 'success');
  }

  // Setup Download Hub Modal
  function setupDownloadHub() {
    const modal = document.getElementById('download-hub-modal');
    const openBtn = document.getElementById('btn-open-download-modal');
    const closeBtn = document.getElementById('btn-close-download-modal');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => modal.classList.add('active'));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    document.getElementById('btn-dl-site')?.addEventListener('click', () => {
      downloadJSON('site.json', siteData);
      alert('site.json indirildi! Projede güncellemek için "c:\\Projs\\ItsMeWebSite\\data\\site.json" dosyasıyla değiştirin.');
    });

    document.getElementById('btn-dl-projects')?.addEventListener('click', () => {
      downloadJSON('projects.json', projectsData);
      alert('projects.json indirildi! Projede güncellemek için "c:\\Projs\\ItsMeWebSite\\data\\projects.json" dosyasıyla değiştirin.');
    });

    document.getElementById('btn-dl-skills')?.addEventListener('click', () => {
      downloadJSON('skills.json', skillsData);
      alert('skills.json indirildi! Projede güncellemek için "c:\\Projs\\ItsMeWebSite\\data\\skills.json" dosyasıyla değiştirin.');
    });

    document.getElementById('btn-dl-timelines')?.addEventListener('click', () => {
      downloadJSON('timelines.json', timelinesData);
      alert('timelines.json indirildi! Projede güncellemek için "c:\\Projs\\ItsMeWebSite\\data\\timelines.json" dosyasıyla değiştirin.');
    });

    document.getElementById('btn-dl-all-zip')?.addEventListener('click', () => {
      const allData = {
        site: siteData,
        projects: projectsData,
        skills: skillsData,
        timelines: timelinesData
      };
      downloadJSON('itsme-all-data.json', allData);
      alert('itsme-all-data.json indirildi! Tüm verileriniz tek dosyada yedeklendi.');
    });
  }

  // Event Listeners
  function setupEventListeners() {
    setupDownloadHub();

    document.getElementById('btn-save-site')?.addEventListener('click', saveSiteForm);
    document.getElementById('btn-save-skills')?.addEventListener('click', () => {
      log('Yetenekler kaydedildi.', 'success');
      alert('Yetenekler hafızaya kaydedildi!');
    });
    document.getElementById('btn-save-timelines')?.addEventListener('click', () => {
      log('Zaman çizelgesi kaydedildi.', 'success');
      alert('Zaman çizelgesi hafızaya kaydedildi!');
    });

    document.getElementById('btn-add-project')?.addEventListener('click', () => openProjectModal(null));
    document.getElementById('btn-close-project-modal')?.addEventListener('click', closeProjectModal);
    document.getElementById('btn-cancel-project')?.addEventListener('click', closeProjectModal);
    document.getElementById('form-project-editor')?.addEventListener('submit', handleSaveProject);

    document.getElementById('btn-save-github-creds')?.addEventListener('click', saveGitHubConfig);
    document.getElementById('btn-test-gh')?.addEventListener('click', testGitHubConnection);

    document.getElementById('btn-deploy-github')?.addEventListener('click', deployToGitHub);

    document.getElementById('btn-clear-log')?.addEventListener('click', () => {
      if (logBox) logBox.innerHTML = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
