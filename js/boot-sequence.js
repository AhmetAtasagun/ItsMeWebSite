/**
 * ItsMe — Boot Sequence Animation
 * Terminal-style startup animation
 */

(function () {
  'use strict';

  const bootScreen = document.getElementById('boot-screen');
  const mainContent = document.getElementById('main-content');
  const footer = document.getElementById('site-footer');

  if (!bootScreen || !mainContent) return;

  const lines = bootScreen.querySelectorAll('.boot-line');
  const progressEl = bootScreen.querySelector('.boot-progress');

  // Check if already visited in this session
  const skipBoot = sessionStorage.getItem('itsme-booted');

  if (skipBoot) {
    bootScreen.classList.add('boot-done');
    mainContent.classList.remove('hidden');
    if (footer) footer.style.opacity = '1';
    return;
  }

  // Progress bar animation
  const progressChars = '█';
  const progressLength = 20;
  let progressCurrent = 0;

  function updateProgress() {
    if (!progressEl) return;
    progressCurrent++;
    const filled = progressChars.repeat(Math.min(progressCurrent, progressLength));
    const empty = '░'.repeat(Math.max(0, progressLength - progressCurrent));
    const pct = Math.min(Math.round((progressCurrent / progressLength) * 100), 100);
    progressEl.textContent = `${filled}${empty} ${pct}%`;
  }

  async function runBootSequence() {
    const baseDelay = 180;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      await wait(baseDelay + Math.random() * 120);
      line.classList.add('visible');

      // Animate progress bar on the "Loading modules" line
      if (line.querySelector('.boot-progress')) {
        for (let p = 0; p < progressLength; p++) {
          updateProgress();
          await wait(40);
        }
      }
    }

    // Slight pause before reveal
    await wait(500);

    // Hide boot screen, show content
    bootScreen.classList.add('boot-done');
    mainContent.classList.remove('hidden');
    mainContent.style.animation = 'fadeIn 0.6s ease forwards';
    if (footer) {
      footer.style.opacity = '0';
      footer.style.transition = 'opacity 0.6s ease 0.3s';
      footer.style.opacity = '1';
    }

    // Mark as booted for this session
    sessionStorage.setItem('itsme-booted', '1');
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBootSequence);
  } else {
    runBootSequence();
  }
})();
