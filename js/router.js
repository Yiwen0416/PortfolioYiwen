/* ============================================================
   router.js — Hash-based client-side routing
   Defines: window.Portfolio.router
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.router = (function () {

  /* All top-level section element IDs */
  const SECTIONS = ['home', 'gallery', 'artwork-detail', 'statement', 'contact', 'storage'];

  /* Map hash prefixes → section IDs */
  const HASH_MAP = {
    '':        'home',
    'home':    'home',
    'gallery': 'gallery',
    'artwork': 'artwork-detail',
    'statement': 'statement',
    'contact': 'contact',
    'storage': 'storage'
  };

  let _current = null;

  function _show(sectionId) {
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === sectionId) {
        el.removeAttribute('hidden');
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.setAttribute('hidden', '');
        el.setAttribute('aria-hidden', 'true');
      }
    });
    _current = sectionId;
    _updateNav(sectionId);
  }

  function _updateNav(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const hash = href.replace('#', '');
      const target = HASH_MAP[hash] || hash;
      if (target === sectionId) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function navigate(hash) {
    /* hash like '' | 'home' | 'gallery' | 'artwork/illus-digital-001' */
    const parts = hash.split('/');
    const prefix = parts[0];
    const param  = parts[1] || null;

    const sectionId = HASH_MAP[prefix] !== undefined ? HASH_MAP[prefix] : 'home';
    _show(sectionId);

    /* Dispatch events so section-specific renderers can react */
    const evt = new CustomEvent('portfolio:navigate', {
      detail: { section: sectionId, prefix, param, hash }
    });
    document.dispatchEvent(evt);

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function getCurrentSection() { return _current; }

  function go(hash) {
    window.location.hash = hash;
  }

  function _onHashChange() {
    const raw = window.location.hash.replace(/^#/, '').trim();
    navigate(raw);
  }

  function init() {
    window.addEventListener('hashchange', _onHashChange);
    /* Handle initial load */
    const initial = window.location.hash.replace(/^#/, '').trim();
    navigate(initial || 'home');
  }

  return { init, navigate, go, getCurrentSection };
}());
