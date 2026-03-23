/* ============================================================
   ui.js — UI controls, init, home/statement/contact render
   Defines: window.Portfolio.ui
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.ui = (function () {

  let _toastTimer = null;

  /* ── Announce to aria-live ── */
  function announce(message) {
    const el = document.getElementById('aria-announcer');
    if (!el) return;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
  }

  /* ── Toast ── */
  function toast(message, duration = 2800) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
  }

  /* ── Responsive layout class ── */
  function _applyLayout() {
    const html = document.documentElement;
    const w = window.innerWidth;
    if (w >= 1024) {
      html.classList.add('layout-a');
      html.classList.remove('layout-b');
    } else {
      html.classList.add('layout-b');
      html.classList.remove('layout-a');
    }
  }

  /* ── Color palette toggle ── */
  function _initPalette() {
    const btn = document.getElementById('btn-palette');
    if (!btn) return;

    const stored = localStorage.getItem('portfolio_palette') || 'artist';
    _setPalette(stored, false);

    btn.addEventListener('click', () => {
      const html = document.documentElement;
      const isArtist = html.classList.contains('palette-artist');
      _setPalette(isArtist ? 'wcag' : 'artist', true);
    });
  }

  function _setPalette(name, animate) {
    const html = document.documentElement;
    if (animate) {
      html.classList.add('theme-transitioning');
      setTimeout(() => html.classList.remove('theme-transitioning'), 500);
    }
    if (name === 'wcag') {
      html.classList.add('palette-wcag');
      html.classList.remove('palette-artist');
      document.getElementById('btn-palette').setAttribute('aria-label', 'Switch to artist palette');
      document.getElementById('btn-palette').setAttribute('aria-pressed', 'true');
      document.getElementById('btn-palette').title = 'WCAG AA palette active';
    } else {
      html.classList.add('palette-artist');
      html.classList.remove('palette-wcag');
      document.getElementById('btn-palette').setAttribute('aria-label', 'Switch to WCAG AA palette');
      document.getElementById('btn-palette').setAttribute('aria-pressed', 'false');
      document.getElementById('btn-palette').title = 'Artist palette active';
    }
    localStorage.setItem('portfolio_palette', name);
    announce(name === 'wcag' ? 'WCAG AA color palette active' : 'Artist color palette active');
  }

  /* ── Dark / light toggle ── */
  function _initTheme() {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;

    /* Determine initial theme */
    const stored = localStorage.getItem('portfolio_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (prefersDark ? 'dark' : 'light');
    _setTheme(initial, false);

    btn.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.classList.contains('theme-dark');
      _setTheme(isDark ? 'light' : 'dark', true);
    });
  }

  function _setTheme(name, animate) {
    const html = document.documentElement;
    if (animate) {
      html.classList.add('theme-transitioning');
      setTimeout(() => html.classList.remove('theme-transitioning'), 500);
    }
    if (name === 'dark') {
      html.classList.add('theme-dark');
      html.classList.remove('theme-light');
      const btn = document.getElementById('btn-theme');
      btn.setAttribute('aria-label', 'Switch to light mode');
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = _sunIcon();
    } else {
      html.classList.add('theme-light');
      html.classList.remove('theme-dark');
      const btn = document.getElementById('btn-theme');
      btn.setAttribute('aria-label', 'Switch to dark mode');
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = _moonIcon();
    }
    localStorage.setItem('portfolio_theme', name);
    announce(name === 'dark' ? 'Dark mode on' : 'Light mode on');
  }

  /* ── Home section render ── */
  function _renderHome() {
    const section = document.getElementById('home');
    const artworks = Portfolio.data.getAllArtworks();
    const featured = artworks.find(a => a.images && a.images[0]) || artworks[0];
    const recent   = artworks.slice(0, 4);

    section.innerHTML = `
      <div class="hero-layout">
        <div class="hero-text">
          <p class="hero-eyebrow">Portfolio</p>
          <h1 class="hero-name">Pete<br>Yiwen</h1>
          <p class="hero-tagline">Illustrations, interactive works, installations, and 3D models — exploring the boundaries between the legible and the overwhelming.</p>
          <a href="#gallery" class="btn btn-primary" style="align-self:flex-start;">View all work</a>
          <p class="hero-scroll-hint" aria-hidden="true">Scroll to explore</p>
        </div>
        <div class="hero-image-col" aria-hidden="true">
          <img src="assets/download.jpeg" alt="" />
        </div>
      </div>

      <div class="recent-work-strip">
        <p class="section-label">Recent work</p>
        <div class="recent-work-grid">
          ${recent.map(a => `
            <article>
              <a href="#artwork/${_esc(a.id)}" style="display:block; aspect-ratio:1; overflow:hidden; background:var(--color-bg-secondary);">
                <img src="${_esc(a.images[0]?.src || 'assets/placeholder.svg')}" alt="${_esc(a.images[0]?.alt || a.title)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
              </a>
              <p style="font-family:var(--font-display);font-size:var(--text-sm);margin-top:var(--space-2);">${_esc(a.title)}</p>
              <p style="font-size:var(--text-xs);color:var(--color-text-muted);">${a.year}</p>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── Statement section render ── */
  function _renderStatement() {
    const section = document.getElementById('statement');
    const data = Portfolio.data.getStatement();

    section.innerHTML = `
      <div class="statement-inner">
        <p class="statement-eyebrow">Pete Yiwen</p>
        <h1 class="statement-title" data-editable data-field="statement-title" data-placeholder="Statement title">${_esc(data.title)}</h1>
        <div class="statement-body">
          ${(data.body || []).map((para, i) => `
            <p data-editable data-statement-para="${i}" data-placeholder="Write your statement...">${_esc(para)}</p>
          `).join('')}
        </div>
        <div style="display:none;" class="statement-add-para">
          <button class="btn btn-secondary btn-sm" id="btn-add-para">+ Add paragraph</button>
        </div>
      </div>
    `;

    /* Show add-para button in edit mode */
    document.addEventListener('portfolio:editmode', () => {
      const isEdit = document.documentElement.classList.contains('edit-mode');
      const addWrap = section.querySelector('.statement-add-para');
      if (addWrap) addWrap.style.display = isEdit ? 'block' : 'none';
      Portfolio.edit.activateEditables(section);
    });

    section.querySelector('#btn-add-para')?.addEventListener('click', () => {
      const data = Portfolio.data.getStatement();
      data.body.push('');
      Portfolio.data.updateStatement({ body: data.body });
      _renderStatement();
    });
  }

  /* ── Contact section render ── */
  function _renderContact() {
    const section = document.getElementById('contact');
    const data = Portfolio.data.getContact();

    section.innerHTML = `
      <div class="contact-inner">
        <h1 class="contact-title">Contact</h1>
        <p class="contact-intro" data-editable data-contact-field="inquiries" data-placeholder="Add an intro...">${_esc(data.inquiries)}</p>

        <div class="contact-links">
          <div class="contact-link-item">
            <span class="contact-link-label">Email</span>
            <a class="contact-link-value" data-editable data-contact-field="email" href="mailto:${_esc(data.email)}" data-placeholder="your@email.com">${_esc(data.email)}</a>
          </div>
          <div class="contact-link-item">
            <span class="contact-link-label">Instagram</span>
            <span class="contact-link-value" data-editable data-contact-field="instagram" data-placeholder="@handle">${_esc(data.instagram)}</span>
          </div>
          <div class="contact-link-item">
            <span class="contact-link-label">Representation</span>
            <span class="contact-link-value" data-editable data-contact-field="representation" data-placeholder="Gallery / representation">${_esc(data.representation)}</span>
          </div>
        </div>
      </div>
    `;

    document.addEventListener('portfolio:editmode', () => {
      Portfolio.edit.activateEditables(section);
    });
  }

  /* ── Storage section render ── */
  function _renderStorage() {
    const section = document.getElementById('storage');
    section.innerHTML = `
      <svg class="storage-lock-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <h1 class="storage-title">Image Archive</h1>
      <p class="storage-desc">Private reference library. Enter your archive password to continue.</p>
      <form class="storage-form" id="storage-form">
        <label class="form-label" for="storage-password">Password</label>
        <input type="password" id="storage-password" class="form-input" placeholder="Enter password" autocomplete="current-password" />
        <button type="submit" class="btn btn-primary">Access Archive</button>
      </form>
      <p id="storage-error" style="color:var(--color-error);font-size:var(--text-sm);margin-top:var(--space-3);min-height:1.2em;" aria-live="polite"></p>
    `;

    section.querySelector('#storage-form').addEventListener('submit', e => {
      e.preventDefault();
      const pw = section.querySelector('#storage-password').value;
      /* Placeholder — in a real deployment validate server-side */
      if (pw === 'archive2024') {
        section.querySelector('#storage-error').textContent = '';
        section.innerHTML = `
          <h1 class="storage-title">Image Archive</h1>
          <p class="storage-desc">Archive unlocked. Upload and manage reference images here.</p>
          <p style="color:var(--color-text-muted);font-size:var(--text-sm);">(Full archive functionality requires server-side storage. This is a prototype placeholder.)</p>
        `;
      } else {
        section.querySelector('#storage-error').textContent = 'Incorrect password.';
      }
    });
  }

  /* ── SVG icons ── */
  function _moonIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  function _sunIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }

  function _esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init ── */
  function init() {
    _applyLayout();
    window.addEventListener('resize', _applyLayout);

    _initTheme();
    _initPalette();

    _renderHome();
    _renderStatement();
    _renderContact();
    _renderStorage();

    Portfolio.gallery.init();
    Portfolio.detail.init();
    Portfolio.edit.init();
    Portfolio.alttext.init();
    Portfolio.router.init();

    /* Re-render home when navigating to it */
    document.addEventListener('portfolio:navigate', e => {
      if (e.detail.section === 'home') _renderHome();
      if (e.detail.section === 'statement') {
        _renderStatement();
        if (document.documentElement.classList.contains('edit-mode')) {
          Portfolio.edit.activateEditables(document.getElementById('statement'));
        }
      }
      if (e.detail.section === 'contact') {
        _renderContact();
        if (document.documentElement.classList.contains('edit-mode')) {
          Portfolio.edit.activateEditables(document.getElementById('contact'));
        }
      }
    });
  }

  return { init, announce, toast };
}());

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  Portfolio.ui.init();
});
