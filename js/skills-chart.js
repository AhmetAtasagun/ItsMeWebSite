/**
 * ItsMe — Skills Chart
 * Load skills from JSON and render interactive bars
 */

(function () {
  'use strict';

  let skillsData = null;
  let activeCategory = null;

  async function init() {
    const res = await fetch('data/skills.json');
    skillsData = await res.json();

    if (!skillsData.categories || skillsData.categories.length === 0) return;

    renderCategoryButtons();
    setActiveCategory(skillsData.categories[0].id);
    observeSkillsSection();
  }

  function renderCategoryButtons() {
    const container = document.getElementById('skills-categories');
    if (!container) return;

    container.innerHTML = skillsData.categories
      .map(
        (cat) =>
          `<button class="skills__category-btn" data-category="${cat.id}">
            ${cat.icon} ${cat.name}
          </button>`
      )
      .join('');

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.skills__category-btn');
      if (btn) setActiveCategory(btn.dataset.category);
    });
  }

  function setActiveCategory(categoryId) {
    activeCategory = categoryId;
    const category = skillsData.categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Update button states
    document.querySelectorAll('.skills__category-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === categoryId);
    });

    // Render skills
    const display = document.getElementById('skills-display');
    if (!display) return;

    display.innerHTML = category.skills
      .map(
        (skill) =>
          `<div class="skill-item">
            <span class="skill-item__name">${skill.name}</span>
            <div class="skill-item__bar">
              <div class="skill-item__fill" 
                   style="background: ${category.color}; color: ${category.color};"
                   data-level="${skill.level}"></div>
            </div>
            <span class="skill-item__years">${skill.years} yıl</span>
          </div>`
      )
      .join('');

    // Animate bars if section is visible
    requestAnimationFrame(() => {
      animateBars();
    });
  }

  function animateBars() {
    const fills = document.querySelectorAll('.skill-item__fill');
    fills.forEach((fill, i) => {
      const level = fill.dataset.level;
      setTimeout(() => {
        fill.style.width = level + '%';
      }, i * 80);
    });
  }

  function observeSkillsSection() {
    const section = document.getElementById('skills');
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateBars();
          observer.unobserve(section);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
