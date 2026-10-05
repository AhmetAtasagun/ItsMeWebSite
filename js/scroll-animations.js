/**
 * ItsMe — Scroll Animations
 * Intersection Observer based reveal + nav effects
 */

(function () {
  'use strict';

  // ---- Reveal on Scroll ----

  const revealElements = document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // ---- Nav Scroll Effect ----

  const nav = document.getElementById('main-nav');
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav__link[data-section]');

  function updateNav() {
    const scrollY = window.scrollY;

    // Scrolled style
    if (nav) {
      nav.classList.toggle('scrolled', scrollY > 80);
    }

    // Active section
    let currentSection = '';
    sections.forEach((section) => {
      const top = section.offsetTop - 200;
      if (scrollY >= top) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === currentSection);
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ---- Scroll to Top Button ----

  const scrollTopBtn = document.getElementById('scroll-top');

  function updateScrollTop() {
    if (!scrollTopBtn) return;
    scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
  }

  window.addEventListener('scroll', updateScrollTop, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Mobile Nav Toggle ----

  const navToggle = document.getElementById('nav-toggle');
  const navLinksEl = document.getElementById('nav-links');

  if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
      navLinksEl.classList.toggle('open');
    });

    // Close on link click
    navLinksEl.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => {
        navLinksEl.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinksEl.contains(e.target)) {
        navLinksEl.classList.remove('open');
      }
    });
  }

  // ---- Smooth scroll for anchor links ----

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
