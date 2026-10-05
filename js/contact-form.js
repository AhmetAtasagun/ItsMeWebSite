/**
 * ItsMe — Contact Form
 * Terminal-style feedback on submission
 */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('form-submit');
  const TARGET_EMAIL = 'ahmet.atasagun@gmail.com';

  if (!form || !feedback) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const message = document.getElementById('form-message').value.trim();

    if (!name || !email || !message) return;

    // Terminal feedback - sending
    feedback.className = 'form__feedback';
    feedback.style.opacity = '1';
    feedback.innerHTML = `
      <div>> İletişim protokolü başlatıldı...</div>
      <div>> Alıcı: ${TARGET_EMAIL}</div>
      <div>> Gönderen: ${name} &lt;${email}&gt;</div>
      <div>> Paket iletiliyor...</div>
    `;

    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        İletiliyor...
      `;
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          _subject: `Portfolio İletişim: ${name}`,
          _template: 'table'
        })
      });

      const data = await response.json();

      if (response.ok || data.success === 'true' || data.success === true) {
        feedback.className = 'form__feedback form__feedback--success';
        feedback.innerHTML = `
          <div>> Alıcı: ${TARGET_EMAIL}</div>
          <div>> Durum: <strong>Başarılı ✓</strong></div>
          <div>> Teşekkürler! Mesajınız başarıyla iletildi, en kısa sürede dönüş yapacağım.</div>
        `;
        form.reset();
      } else {
        throw new Error(data.message || 'Gönderim başarısız.');
      }
    } catch (err) {
      feedback.className = 'form__feedback form__feedback--error';
      feedback.innerHTML = `
        <div>> Durum: <strong style="color: var(--color-error);">İletim Hatası ✗</strong></div>
        <div>> Mesaj iletilemedi. Lütfen doğrudan <a href="mailto:${TARGET_EMAIL}" style="color: var(--accent-primary);">${TARGET_EMAIL}</a> adresine e-posta gönderin.</div>
      `;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

      // Auto-hide feedback after 8 seconds
      setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
          feedback.className = 'form__feedback';
          feedback.style.opacity = '';
        }, 400);
      }, 8000);
    }
  });
})();
