/* ============================================================
   edit.js — Edit mode: contenteditable, image management, save
   Defines: window.Portfolio.edit
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.edit = (function () {

  let _isEditMode = false;
  const EDITABLE_SELECTOR = '[data-editable]';

  /* ── Toggle edit mode ── */
  function toggle() {
    _isEditMode = !_isEditMode;
    const html = document.documentElement;
    html.classList.toggle('edit-mode', _isEditMode);

    const btn = document.getElementById('btn-edit');
    if (btn) {
      btn.setAttribute('aria-pressed', String(_isEditMode));
      btn.setAttribute('aria-label', _isEditMode ? 'Exit edit mode' : 'Enter edit mode');
    }

    const saveBar = document.getElementById('edit-save-bar');
    if (saveBar) saveBar.hidden = !_isEditMode;

    /* Enable/disable contenteditable on all editable elements */
    _setEditables(_isEditMode);

    /* Fire event for other modules */
    document.dispatchEvent(new CustomEvent('portfolio:editmode', { detail: { active: _isEditMode } }));

    Portfolio.ui.announce(_isEditMode ? 'Edit mode on. Click any text to edit.' : 'Edit mode off.');
  }

  function _setEditables(enable) {
    document.querySelectorAll(EDITABLE_SELECTOR).forEach(el => {
      if (enable) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('role', 'textbox');
        el.setAttribute('aria-multiline', 'true');
      } else {
        el.removeAttribute('contenteditable');
        el.removeAttribute('role');
        el.removeAttribute('aria-multiline');
      }
    });
  }

  /* ── Activate editables in a given container ── */
  function activateEditables(container) {
    if (!_isEditMode) return;
    container.querySelectorAll(EDITABLE_SELECTOR).forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('role', 'textbox');
      el.setAttribute('aria-multiline', 'true');
    });
  }

  /* ── Save all changes ── */
  function saveAll() {
    /* Collect all editable elements and write back to data store */
    const edited = document.querySelectorAll('[data-editable][data-artwork-id]');
    const artworkChanges = {};

    edited.forEach(el => {
      const id    = el.dataset.artworkId;
      const field = el.dataset.field;
      const value = el.textContent.trim();
      if (!artworkChanges[id]) artworkChanges[id] = {};
      artworkChanges[id][field] = value;
    });

    Object.entries(artworkChanges).forEach(([id, changes]) => {
      Portfolio.data.updateArtwork(id, changes);
    });

    /* Save process block text edits */
    document.querySelectorAll('[data-process-block][data-editable]').forEach(el => {
      const blockIdx = parseInt(el.dataset.processBlock);
      const field    = el.dataset.field;
      const artworkId = _findArtworkIdForProcessBlock(el);
      if (!artworkId) return;
      const artwork = Portfolio.data.getArtwork(artworkId);
      if (!artwork || !artwork.process[blockIdx]) return;
      artwork.process[blockIdx][field] = el.textContent.trim();
      Portfolio.data.updateArtwork(artworkId, { process: artwork.process });
    });

    /* Save statement */
    const statTitle = document.querySelector('[data-editable][data-field="statement-title"]');
    const statParagraphs = document.querySelectorAll('[data-editable][data-statement-para]');
    if (statTitle || statParagraphs.length) {
      const changes = {};
      if (statTitle) changes.title = statTitle.textContent.trim();
      if (statParagraphs.length) {
        changes.body = Array.from(statParagraphs).map(p => p.textContent.trim());
      }
      Portfolio.data.updateStatement(changes);
    }

    /* Save contact */
    document.querySelectorAll('[data-editable][data-contact-field]').forEach(el => {
      const field = el.dataset.contactField;
      const val   = el.textContent.trim();
      Portfolio.data.updateContact({ [field]: val });
    });

    Portfolio.ui.toast('Changes saved.');
  }

  function _findArtworkIdForProcessBlock(el) {
    /* Walk up to find closest element with data-artwork-id */
    let node = el.parentElement;
    while (node && node !== document.body) {
      const id = node.querySelector('[data-artwork-id]');
      if (id) return id.dataset.artworkId;
      /* Or check the section */
      if (node.id === 'artwork-detail') {
        const titleEl = node.querySelector('[data-artwork-id]');
        if (titleEl) return titleEl.dataset.artworkId;
      }
      node = node.parentElement;
    }
    return null;
  }

  /* ── Add artwork ── */
  function promptAddArtwork() {
    if (!_isEditMode) return;

    const category = prompt('Category:\n1. illustrations\n2. digital-applications\n3. installations\n4. 3d-models\n\nEnter number:');
    const catMap = { '1':'illustrations','2':'digital-applications','3':'installations','4':'3d-models' };
    const cat = catMap[category] || 'illustrations';

    let subcat = null;
    if (cat === 'illustrations') {
      const sub = prompt('Subcategory:\n1. digital\n2. traditional\n3. mixed-media\n\nEnter number:');
      const subMap = { '1':'digital','2':'traditional','3':'mixed-media' };
      subcat = subMap[sub] || 'digital';
    }

    const title = prompt('Artwork title:') || 'Untitled';

    const artwork = Portfolio.data.addArtwork({ category: cat, subcategory: subcat, title });
    Portfolio.router.go('artwork/' + artwork.id);
    Portfolio.ui.toast('New artwork created. Edit the details here.');
  }

  /* ── Init ── */
  function init() {
    const btn = document.getElementById('btn-edit');
    if (btn) btn.addEventListener('click', toggle);

    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) saveBtn.addEventListener('click', saveAll);

    /* Keyboard shortcut: Ctrl/Cmd + S to save */
    document.addEventListener('keydown', e => {
      if (_isEditMode && (e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAll();
      }
    });
  }

  return { init, toggle, saveAll, activateEditables, promptAddArtwork };
}());
