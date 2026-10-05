/**
 * ItsMe — Projects Filter & Display
 * Load projects from JSON, filter, 3D tilt, modal
 */

(function () {
  'use strict';

  let projects = [];

  async function init() {
    const res = await fetch('data/projects.json');
    const data = await res.json();
    projects = data
      .filter((p) => p.published)
      .sort((a, b) => a.order - b.order);

    renderFilters();
    renderProjects(projects);
    initModal();
  }

  function renderFilters() {
    const container = document.getElementById('project-filters');
    if (!container) return;

    const categories = ['all', ...new Set(projects.map((p) => p.category))];
    container.innerHTML = categories
      .map(
        (cat) =>
          `<button class="filter-tab ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">
            ${cat === 'all' ? '// tümü' : cat}
          </button>`
      )
      .join('');

    container.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;

      container.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      const filtered = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
      renderProjects(filtered);
    });
  }

  function renderProjects(list) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    grid.innerHTML = list
      .map(
        (p) =>
          `<div class="card reveal" data-project-id="${p.id}" style="perspective: 800px;">
            <div class="card__image" style="background: var(--bg-primary); overflow: hidden; display: flex; align-items: center; justify-content: center;">
              ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />` : '<span style="font-size: 2rem;">🛠️</span>'}
            </div>
            <h3 class="card__title">${p.title}</h3>
            <p class="card__description">${p.description}</p>
            <div class="card__tags">
              ${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
            </div>
            <div class="card__links">
              <button class="btn btn--ghost" onclick="window.ItsMeProjects.openModal('${p.id}')">
                Detay →
              </button>
              ${p.demoUrl && p.demoUrl !== '#' ? `<a href="${p.demoUrl}" target="_blank" class="btn btn--ghost">Demo</a>` : ''}
              ${p.sourceUrl && p.sourceUrl !== '#' ? `<a href="${p.sourceUrl}" target="_blank" class="btn btn--ghost">Kaynak</a>` : ''}
            </div>
          </div>`
      )
      .join('');

    // Re-observe reveals
    grid.querySelectorAll('.reveal').forEach((el) => {
      el.classList.remove('visible');
      requestAnimationFrame(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1 }
        );
        observer.observe(el);
      });
    });

    // 3D tilt effect
    initTiltEffect(grid);
  }

  function initTiltEffect(container) {
    const cards = container.querySelectorAll('.card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    });
  }

  let currentSlideIndex = 0;
  let currentImages = [];

  function initModal() {
    const overlay = document.getElementById('project-modal');
    const closeBtn = document.getElementById('modal-close');
    const prevBtn = document.getElementById('modal-slider-prev');
    const nextBtn = document.getElementById('modal-slider-next');

    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
      });
    }

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('project-modal');
      if (!modal || !modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    });
  }

  function setupSlider(images, title) {
    const sliderContainer = document.getElementById('modal-slider');
    const track = document.getElementById('modal-slider-track');
    const prevBtn = document.getElementById('modal-slider-prev');
    const nextBtn = document.getElementById('modal-slider-next');
    const dotsContainer = document.getElementById('modal-slider-dots');
    const counter = document.getElementById('modal-slider-counter');

    if (!sliderContainer || !track) return;

    currentImages = images || [];
    currentSlideIndex = 0;

    if (currentImages.length === 0) {
      sliderContainer.style.display = 'none';
      return;
    }

    sliderContainer.style.display = 'block';

    // Render slides
    track.innerHTML = currentImages
      .map(
        (src, idx) => `
        <div class="modal__slide">
          <img src="${src}" alt="${title} - Görsel ${idx + 1}" loading="lazy" />
        </div>`
      )
      .join('');

    // Single image vs multiple
    const hasMultiple = currentImages.length > 1;

    if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (dotsContainer) {
      dotsContainer.style.display = hasMultiple ? 'flex' : 'none';
      dotsContainer.innerHTML = currentImages
        .map(
          (_, idx) =>
            `<button class="modal__slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Görsel ${idx + 1}"></button>`
        )
        .join('');

      dotsContainer.querySelectorAll('.modal__slider-dot').forEach((dot) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetIdx = parseInt(dot.dataset.index, 10);
          goToSlide(targetIdx);
        });
      });
    }

    if (counter) {
      counter.style.display = hasMultiple ? 'block' : 'none';
    }

    goToSlide(0);
  }

  function goToSlide(index) {
    if (!currentImages.length) return;

    if (index < 0) {
      currentSlideIndex = currentImages.length - 1;
    } else if (index >= currentImages.length) {
      currentSlideIndex = 0;
    } else {
      currentSlideIndex = index;
    }

    const track = document.getElementById('modal-slider-track');
    if (track) {
      track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }

    const dots = document.querySelectorAll('.modal__slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlideIndex);
    });

    const counter = document.getElementById('modal-slider-counter');
    if (counter && currentImages.length > 1) {
      const currentStr = String(currentSlideIndex + 1).padStart(2, '0');
      const totalStr = String(currentImages.length).padStart(2, '0');
      counter.textContent = `${currentStr} / ${totalStr}`;
    }
  }

  function prevSlide() {
    goToSlide(currentSlideIndex - 1);
  }

  function nextSlide() {
    goToSlide(currentSlideIndex + 1);
  }

  function openModal(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-description').textContent = project.longDescription || project.description;
    document.getElementById('modal-tags').innerHTML = project.tags
      .map((t) => `<span class="tag">${t}</span>`)
      .join('');

    const linksEl = document.getElementById('modal-links');
    linksEl.innerHTML = '';
    if (project.demoUrl && project.demoUrl !== '#') {
      linksEl.innerHTML += `<a href="${project.demoUrl}" target="_blank" class="btn btn--primary">Demo</a>`;
    }
    if (project.sourceUrl && project.sourceUrl !== '#') {
      linksEl.innerHTML += `<a href="${project.sourceUrl}" target="_blank" class="btn btn--outline">Kaynak Kodu</a>`;
    }

    // Setup image slider
    const images = project.images && project.images.length > 0 ? project.images : (project.imageUrl ? [project.imageUrl] : []);
    setupSlider(images, project.title);

    document.getElementById('project-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('project-modal').classList.remove('active');
    document.body.style.overflow = '';
  }

  // Expose for inline click handlers
  window.ItsMeProjects = { openModal };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
