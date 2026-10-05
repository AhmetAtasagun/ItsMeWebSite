/**
 * ItsMe — Main Application
 * Orchestrates data loading and dynamic content rendering
 */

(function () {
  'use strict';

  // ---- Load Site Data ----

  async function loadSiteData() {
    const res = await fetch('data/site.json');
    const site = await res.json();
    applySiteData(site);
  }

  function applySiteData(site) {
    // Hero
    setText('hero-name', site.name);
    setText('hero-title', site.title);
    setAttr('hero-tagline', 'textContent', `"${site.tagline}"`);

    // About
    setText('about-bio', site.bio);

    // Stats
    if (site.stats) {
      setText('stat-years', site.stats.yearsExperience);
      setText('stat-projects', site.stats.projectsCompleted);
      setText('stat-tech', site.stats.technologiesUsed);
      setText('stat-coffee', site.stats.cupsOfCoffee);
    }

    // Contact
    const emailBtn = document.getElementById('contact-email-btn');
    if (emailBtn && site.email) {
      emailBtn.href = `mailto:${site.email}`;
      emailBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        ${site.email}`;
    }

    // Social links
    renderSocialLinks(site.social);

    // Meta
    if (site.meta) {
      document.title = site.meta.siteTitle || document.title;
      setMetaContent('description', site.meta.description);
      setMetaContent('keywords', site.meta.keywords);
      setMetaProperty('og:title', site.meta.siteTitle);
      setMetaProperty('og:description', site.meta.description);
    }

    // Footer year
    setText('footer-year', new Date().getFullYear().toString());
  }

  function renderSocialLinks(social) {
    const container = document.getElementById('contact-social');
    if (!container || !social) return;

    const icons = {
      github: `<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
      linkedin: `<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
      twitter: `<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      medium: `<svg viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>`,
    };

    let html = '';
    for (const [key, url] of Object.entries(social)) {
      if (url && icons[key]) {
        html += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="contact__social-link" aria-label="${key}">${icons[key]}</a>`;
      }
    }
    container.innerHTML = html;
  }

  // ---- Load Timelines ----

  async function loadTimelines() {
    const res = await fetch('data/timelines.json');
    const timelines = await res.json();
    const published = timelines
      .filter((t) => t.published)
      .sort((a, b) => a.order - b.order);

    if (published.length === 0) return;

    renderTimelineSelector(published);
    renderTimeline(published[0]);
  }

  function renderTimelineSelector(timelines) {
    const container = document.getElementById('timeline-selector');
    if (!container) return;

    if (timelines.length <= 1) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = timelines
      .map(
        (t, i) =>
          `<button class="timeline-selector__btn ${i === 0 ? 'active' : ''}" data-timeline-id="${t.id}">
            ${t.icon} ${t.title}
          </button>`
      )
      .join('');

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.timeline-selector__btn');
      if (!btn) return;

      container.querySelectorAll('.timeline-selector__btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const timeline = timelines.find((t) => t.id === btn.dataset.timelineId);
      if (timeline) renderTimeline(timeline);
    });
  }

  function renderTimeline(timeline) {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = timeline.events
      .map(
        (event) =>
          `<div class="timeline__item ${event.highlight ? 'timeline__item--highlight' : ''} reveal">
            <div class="timeline__dot"></div>
            <span class="timeline__date">${event.date}</span>
            <h3 class="timeline__title">${event.title}</h3>
            <p class="timeline__subtitle">${event.subtitle}</p>
            <p class="timeline__description">${event.description}</p>
            <div class="timeline__tags">
              ${event.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>`
      )
      .join('');

    // Re-observe new reveals
    container.querySelectorAll('.reveal').forEach((el) => {
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
  }

  // ---- Helpers ----

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  function setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el && value) el[attr] = value;
  }

  function setMetaContent(name, content) {
    if (!content) return;
    const el = document.querySelector(`meta[name="${name}"]`);
    if (el) el.setAttribute('content', content);
  }

  function setMetaProperty(prop, content) {
    if (!content) return;
    const el = document.querySelector(`meta[property="${prop}"]`);
    if (el) el.setAttribute('content', content);
  }

  // ---- Init ----

  async function initApp() {
    await Promise.all([loadSiteData(), loadTimelines()]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
