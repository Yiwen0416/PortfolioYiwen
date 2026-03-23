/* ============================================================
   detail.js — Artwork detail page rendering
   Handles: slideshow, metadata, description, process section
   Defines: window.Portfolio.detail
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.detail = (function () {

  let _currentArtwork  = null;
  let _currentSlide    = 0;
  let _altTextVisible  = false;

  /* ── Entry point ── */
  function show(artworkId) {
    const artwork = Portfolio.data.getArtwork(artworkId);
    if (!artwork) {
      Portfolio.router.go('gallery');
      return;
    }
    _currentArtwork = artwork;
    _currentSlide   = 0;
    _altTextVisible = false;
    _render(artwork);
  }

  /* ── Full render ── */
  function _render(artwork) {
    const section = document.getElementById('artwork-detail');
    section.innerHTML = '';

    /* Back button */
    const back = document.createElement('button');
    back.className = 'detail-back-btn';
    back.setAttribute('aria-label', 'Back to gallery');
    back.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      All work
    `;
    back.addEventListener('click', () => Portfolio.router.go('gallery'));
    section.appendChild(back);

    /* Layout wrapper */
    const layout = document.createElement('div');
    layout.className = 'detail-layout';
    section.appendChild(layout);

    /* ── Left: slideshow ── */
    const slideshowWrap = document.createElement('div');
    slideshowWrap.className = 'detail-slideshow';
    slideshowWrap.innerHTML = _buildSlideshowHTML(artwork);
    layout.appendChild(slideshowWrap);
    _bindSlideshow(slideshowWrap, artwork);

    /* ── Right: meta panel ── */
    const metaPanel = document.createElement('div');
    metaPanel.className = 'detail-meta-panel';
    metaPanel.innerHTML = _buildMetaPanelHTML(artwork);
    layout.appendChild(metaPanel);
    _bindMetaPanel(metaPanel, artwork);

    /* ── Process section (full width below) ── */
    if (artwork.process && artwork.process.length > 0) {
      const processSection = document.createElement('div');
      processSection.className = 'detail-process-section';
      processSection.innerHTML = _buildProcessHTML(artwork);
      layout.appendChild(processSection);
      _bindProcess(processSection, artwork);
    } else {
      /* Still render process section so edit mode can add blocks */
      const processSection = document.createElement('div');
      processSection.className = 'detail-process-section';
      processSection.innerHTML = `
        <h2 class="process-section-title">Process</h2>
        <div class="process-blocks" id="process-blocks"></div>
        <div class="process-add-toolbar">
          <button class="btn btn-secondary btn-sm" data-add-process="text">+ Text</button>
          <button class="btn btn-secondary btn-sm" data-add-process="image">+ Image</button>
        </div>
      `;
      layout.appendChild(processSection);
      _bindProcess(processSection, artwork);
    }

    /* Fullscreen overlay */
    const fsOverlay = document.createElement('div');
    fsOverlay.id = 'fullscreen-overlay';
    fsOverlay.className = 'fullscreen-overlay';
    fsOverlay.setAttribute('hidden', '');
    fsOverlay.setAttribute('role', 'dialog');
    fsOverlay.setAttribute('aria-label', 'Fullscreen image');
    fsOverlay.innerHTML = `
      <button class="fullscreen-close" aria-label="Close fullscreen">&times;</button>
      <img class="fullscreen-img" src="" alt="" />
    `;
    fsOverlay.querySelector('.fullscreen-close').addEventListener('click', _closeFullscreen);
    fsOverlay.addEventListener('click', e => { if (e.target === fsOverlay) _closeFullscreen(); });
    document.addEventListener('keydown', _fsKeyHandler);
    section.appendChild(fsOverlay);
  }

  /* ── Slideshow HTML ── */
  function _buildSlideshowHTML(artwork) {
    const images = artwork.images;
    const total  = images.length;

    const slides = images.map((img, i) => `
      <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}" role="img" aria-label="${_esc(img.alt || 'Image ' + (i+1))}">
        <img src="${_esc(img.src)}" alt="${_esc(img.alt || '')}" loading="${i === 0 ? 'eager' : 'lazy'}" />
      </div>
    `).join('');

    const dots = images.map((_, i) => `
      <button
        class="slide-dot ${i === 0 ? 'active' : ''}"
        data-dot="${i}"
        aria-label="Image ${i + 1} of ${total}"
        aria-pressed="${i === 0 ? 'true' : 'false'}"
      ></button>
    `).join('');

    /* Image edit slots shown in edit mode */
    const imgSlots = images.map((img, i) => `
      <div class="image-slot" data-slot="${i}">
        <img src="${_esc(img.src)}" alt="${_esc(img.alt || '')}" />
        <button class="image-slot-remove" data-remove="${i}" aria-label="Remove image ${i+1}">&times;</button>
      </div>
    `).join('');

    const hasEmptySlot = images.length < 10;
    const emptySlotHTML = hasEmptySlot ? `
      <label class="image-slot image-slot-empty" aria-label="Add image">
        <span class="plus-icon">+</span>
        <span>Add image</span>
        <input type="file" accept="image/*" class="sr-only" id="img-upload-input" />
      </label>
    ` : '';

    return `
      <div class="slideshow" aria-label="Artwork images" aria-roledescription="carousel">
        <div class="slideshow-track" aria-live="polite" aria-atomic="false" id="slideshow-track">
          ${slides}
        </div>
        <div class="slideshow-controls">
          <button class="slide-prev icon-btn" aria-label="Previous image" ${total <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="slide-dots" role="group" aria-label="Image navigation">
            ${dots}
          </div>
          <span class="slide-counter" aria-hidden="true">1 / ${total}</span>
          <button class="slide-fullscreen-btn icon-btn" aria-label="View fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
          <button class="slide-next icon-btn" aria-label="Next image" ${total <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Alt text panel -->
        <div class="alt-text-panel" id="alt-text-panel" hidden>
          <button class="alt-text-toggle" id="alt-text-toggle" aria-expanded="false">
            Hide image description
          </button>
          <p id="alt-text-content"></p>
        </div>
        <button class="alt-text-toggle" id="alt-text-show-btn" style="margin: var(--space-2) var(--space-4);">
          Show image description
        </button>

        <!-- Image management grid (edit mode only) -->
        <div class="image-slots-edit" style="display:none; padding: var(--space-4);">
          <p class="image-slot-count">Images: ${images.length} / 10</p>
          <div class="image-slots-grid" id="image-slots-grid">
            ${imgSlots}
            ${emptySlotHTML}
          </div>
        </div>
      </div>
    `;
  }

  function _bindSlideshow(wrap, artwork) {
    const track   = wrap.querySelector('#slideshow-track');
    const counter = wrap.querySelector('.slide-counter');
    const dots    = wrap.querySelectorAll('.slide-dot');
    const prevBtn = wrap.querySelector('.slide-prev');
    const nextBtn = wrap.querySelector('.slide-next');
    const fsBtn   = wrap.querySelector('.slide-fullscreen-btn');
    const altPanel     = wrap.querySelector('#alt-text-panel');
    const altContent   = wrap.querySelector('#alt-text-content');
    const altToggle    = wrap.querySelector('#alt-text-toggle');
    const altShowBtn   = wrap.querySelector('#alt-text-show-btn');
    const imgEditArea  = wrap.querySelector('.image-slots-edit');

    function goTo(index) {
      const slides = track.querySelectorAll('.slide');
      if (!slides.length) return;
      const total = slides.length;
      index = ((index % total) + total) % total;
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === index);
      });
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
        d.setAttribute('aria-pressed', String(i === index));
      });
      counter.textContent = `${index + 1} / ${total}`;
      _currentSlide = index;

      /* Update alt text panel */
      const img = artwork.images[index];
      if (altContent) {
        altContent.textContent = img && img.alt ? img.alt : 'No description available.';
      }

      /* Announce to screen reader */
      Portfolio.ui.announce(`Image ${index + 1} of ${total}`);
    }

    prevBtn && prevBtn.addEventListener('click', () => goTo(_currentSlide - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(_currentSlide + 1));

    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    /* Keyboard navigation on slideshow */
    wrap.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  goTo(_currentSlide - 1);
      if (e.key === 'ArrowRight') goTo(_currentSlide + 1);
    });

    /* Fullscreen */
    fsBtn && fsBtn.addEventListener('click', () => {
      const img = artwork.images[_currentSlide];
      _openFullscreen(img ? img.src : '', img ? img.alt : '');
    });

    /* Alt text toggle */
    function showAlt() {
      altPanel.removeAttribute('hidden');
      altShowBtn.style.display = 'none';
      altToggle.setAttribute('aria-expanded', 'true');
      const img = artwork.images[_currentSlide];
      altContent.textContent = img && img.alt ? img.alt : 'No description available.';
    }

    function hideAlt() {
      altPanel.setAttribute('hidden', '');
      altShowBtn.style.display = '';
      altToggle.setAttribute('aria-expanded', 'false');
    }

    altShowBtn && altShowBtn.addEventListener('click', showAlt);
    altToggle  && altToggle.addEventListener('click', hideAlt);

    /* Image slot management (edit mode) */
    function _refreshEditSlots() {
      if (!imgEditArea) return;
      const isEditMode = document.documentElement.classList.contains('edit-mode');
      imgEditArea.style.display = isEditMode ? 'block' : 'none';

      const grid = imgEditArea.querySelector('#image-slots-grid');
      if (!grid) return;

      const current = Portfolio.data.getArtwork(artwork.id);
      if (!current) return;

      const imgSlots = current.images.map((img, i) => `
        <div class="image-slot" data-slot="${i}">
          <img src="${_esc(img.src)}" alt="${_esc(img.alt || '')}" />
          <button class="image-slot-remove" data-remove="${i}" aria-label="Remove image ${i+1}">&times;</button>
        </div>
      `).join('');

      const hasEmpty = current.images.length < 10;
      const emptySlot = hasEmpty ? `
        <label class="image-slot image-slot-empty" aria-label="Add image (${current.images.length}/10)">
          <span class="plus-icon">+</span>
          <span>${current.images.length}/10</span>
          <input type="file" accept="image/*" class="sr-only img-file-input" />
        </label>
      ` : `<p class="image-slot-count">10/10 images maximum reached</p>`;

      grid.innerHTML = imgSlots + emptySlot;
      imgEditArea.querySelector('.image-slot-count').textContent = `Images: ${current.images.length} / 10`;

      /* Remove image buttons */
      grid.querySelectorAll('.image-slot-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.remove);
          if (confirm(`Remove image ${idx + 1}?`)) {
            Portfolio.data.removeImage(artwork.id, idx);
            _currentSlide = Math.max(0, _currentSlide - 1);
            artwork.images = Portfolio.data.getArtwork(artwork.id).images;
            _refreshSlideTrack();
            _refreshEditSlots();
          }
        });
      });

      /* Upload input */
      const fileInput = grid.querySelector('.img-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = e => {
            Portfolio.data.addImage(artwork.id, { src: e.target.result, alt: '', altStatus: 'draft' });
            artwork.images = Portfolio.data.getArtwork(artwork.id).images;
            _refreshSlideTrack();
            _refreshEditSlots();
            Portfolio.ui.toast('Image added. Add a description for screen readers.');
          };
          reader.readAsDataURL(file);
        });
      }
    }

    function _refreshSlideTrack() {
      const current = Portfolio.data.getArtwork(artwork.id);
      if (!current) return;
      const slides = current.images.map((img, i) => `
        <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
          <img src="${_esc(img.src)}" alt="${_esc(img.alt || '')}" />
        </div>
      `).join('');
      track.innerHTML = slides;

      /* Rebuild dots */
      const dotsContainer = wrap.querySelector('.slide-dots');
      dotsContainer.innerHTML = current.images.map((_, i) => `
        <button class="slide-dot ${i === 0 ? 'active' : ''}" data-dot="${i}" aria-label="Image ${i+1} of ${current.images.length}" aria-pressed="${i === 0}"></button>
      `).join('');
      dotsContainer.querySelectorAll('.slide-dot').forEach((d, i) => {
        d.addEventListener('click', () => goTo(i));
      });

      counter.textContent = `1 / ${current.images.length}`;
      _currentSlide = 0;
    }

    /* Listen for edit mode toggle */
    document.addEventListener('portfolio:editmode', _refreshEditSlots);
    _refreshEditSlots();

    /* Alttext workflow integration */
    Portfolio.alttext.bindSlideshow(wrap, artwork, goTo);
  }

  /* ── Meta panel HTML ── */
  function _buildMetaPanelHTML(artwork) {
    return `
      <h1 class="detail-title" data-editable data-field="title" data-artwork-id="${artwork.id}" data-placeholder="Artwork title">${_esc(artwork.title)}</h1>

      <div class="detail-metadata">
        <div class="meta-item">
          <span class="meta-label">Year</span>
          <span class="meta-value" data-editable data-field="year" data-artwork-id="${artwork.id}" data-placeholder="Year">${_esc(artwork.year)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Size</span>
          <span class="meta-value" data-editable data-field="size" data-artwork-id="${artwork.id}" data-placeholder="Dimensions">${_esc(artwork.size)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Materials</span>
          <span class="meta-value" data-editable data-field="materials" data-artwork-id="${artwork.id}" data-placeholder="Materials used">${_esc(artwork.materials)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Category</span>
          <span class="badge">${_catLabel(artwork.category, artwork.subcategory)}</span>
        </div>
      </div>

      <div class="detail-description" data-editable data-field="description" data-artwork-id="${artwork.id}" data-placeholder="Work description...">${_esc(artwork.description)}</div>

      <button class="btn btn-danger btn-sm detail-delete-btn" aria-label="Delete this artwork">
        Delete artwork
      </button>
    `;
  }

  function _bindMetaPanel(panel, artwork) {
    const deleteBtn = panel.querySelector('.detail-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete "${artwork.title}"? This cannot be undone.`)) {
          Portfolio.data.deleteArtwork(artwork.id);
          Portfolio.router.go('gallery');
          Portfolio.ui.toast('Artwork deleted.');
        }
      });
    }
  }

  /* ── Process section HTML ── */
  function _buildProcessHTML(artwork) {
    const blocks = (artwork.process || []).map((block, i) => _buildBlockHTML(block, i)).join('');

    return `
      <h2 class="process-section-title">Process</h2>
      <div class="process-blocks" id="process-blocks">
        ${blocks}
      </div>
      <div class="process-add-toolbar">
        <button class="btn btn-secondary btn-sm" data-add-process="text">+ Text</button>
        <button class="btn btn-secondary btn-sm" data-add-process="image">+ Image</button>
      </div>
    `;
  }

  function _buildBlockHTML(block, index) {
    if (block.type === 'text') {
      return `
        <div class="process-block process-text-block" data-block-index="${index}">
          <div class="process-block-controls">
            <button class="btn btn-ghost btn-sm" data-move-block="up" aria-label="Move block up">↑</button>
            <button class="btn btn-ghost btn-sm" data-move-block="down" aria-label="Move block down">↓</button>
            <button class="btn btn-danger btn-sm" data-remove-block aria-label="Remove block">×</button>
          </div>
          <p data-editable data-process-block="${index}" data-field="content" data-placeholder="Process description...">${_esc(block.content || '')}</p>
        </div>
      `;
    } else if (block.type === 'image') {
      return `
        <div class="process-block process-image-block" data-block-index="${index}">
          <div class="process-block-controls">
            <button class="btn btn-ghost btn-sm" data-move-block="up" aria-label="Move block up">↑</button>
            <button class="btn btn-ghost btn-sm" data-move-block="down" aria-label="Move block down">↓</button>
            <button class="btn btn-danger btn-sm" data-remove-block aria-label="Remove block">×</button>
          </div>
          <img src="${_esc(block.src || 'assets/placeholder.svg')}" alt="${_esc(block.caption || '')}" />
          <div class="process-image-edit" style="display:none; margin-top: var(--space-2);">
            <label class="form-label" style="font-size:var(--text-xs)">Replace image</label>
            <input type="file" accept="image/*" class="process-img-input" aria-label="Replace process image ${index+1}" />
          </div>
          <p class="process-image-caption" data-editable data-process-block="${index}" data-field="caption" data-placeholder="Caption...">${_esc(block.caption || '')}</p>
        </div>
      `;
    }
    return '';
  }

  function _bindProcess(section, artwork) {
    /* Add blocks */
    section.querySelectorAll('[data-add-process]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.addProcess;
        const current = Portfolio.data.getArtwork(artwork.id);
        const newBlock = type === 'text'
          ? { type: 'text', content: '' }
          : { type: 'image', src: 'assets/placeholder.svg', caption: '' };
        current.process.push(newBlock);
        Portfolio.data.updateArtwork(artwork.id, { process: current.process });
        _refreshProcessBlocks(section, artwork);
      });
    });

    _bindProcessBlocks(section, artwork);

    /* Listen for edit mode to show image file inputs */
    document.addEventListener('portfolio:editmode', () => {
      const isEdit = document.documentElement.classList.contains('edit-mode');
      section.querySelectorAll('.process-image-edit').forEach(el => {
        el.style.display = isEdit ? 'block' : 'none';
      });
    });
  }

  function _bindProcessBlocks(section, artwork) {
    const blocksContainer = section.querySelector('#process-blocks');
    if (!blocksContainer) return;

    /* Remove block */
    blocksContainer.querySelectorAll('[data-remove-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.closest('[data-block-index]').dataset.blockIndex);
        const current = Portfolio.data.getArtwork(artwork.id);
        current.process.splice(idx, 1);
        Portfolio.data.updateArtwork(artwork.id, { process: current.process });
        _refreshProcessBlocks(section, artwork);
      });
    });

    /* Move block */
    blocksContainer.querySelectorAll('[data-move-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.moveBlock;
        const idx = parseInt(btn.closest('[data-block-index]').dataset.blockIndex);
        const current = Portfolio.data.getArtwork(artwork.id);
        const proc = current.process;
        if (dir === 'up' && idx > 0) {
          [proc[idx], proc[idx-1]] = [proc[idx-1], proc[idx]];
        } else if (dir === 'down' && idx < proc.length - 1) {
          [proc[idx], proc[idx+1]] = [proc[idx+1], proc[idx]];
        }
        Portfolio.data.updateArtwork(artwork.id, { process: proc });
        _refreshProcessBlocks(section, artwork);
      });
    });

    /* Process image file inputs */
    blocksContainer.querySelectorAll('.process-img-input').forEach(input => {
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const idx = parseInt(input.closest('[data-block-index]').dataset.blockIndex);
        const reader = new FileReader();
        reader.onload = e => {
          const current = Portfolio.data.getArtwork(artwork.id);
          current.process[idx].src = e.target.result;
          Portfolio.data.updateArtwork(artwork.id, { process: current.process });
          input.closest('.process-image-block').querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function _refreshProcessBlocks(section, artwork) {
    const current = Portfolio.data.getArtwork(artwork.id);
    const blocksContainer = section.querySelector('#process-blocks');
    if (!blocksContainer) return;
    blocksContainer.innerHTML = (current.process || []).map((b, i) => _buildBlockHTML(b, i)).join('');
    _bindProcessBlocks(section, artwork);

    const isEdit = document.documentElement.classList.contains('edit-mode');
    section.querySelectorAll('.process-image-edit').forEach(el => {
      el.style.display = isEdit ? 'block' : 'none';
    });
    Portfolio.edit.activateEditables(section);
  }

  /* ── Fullscreen ── */
  function _openFullscreen(src, alt) {
    const overlay = document.getElementById('fullscreen-overlay');
    if (!overlay) return;
    overlay.querySelector('.fullscreen-img').src  = src;
    overlay.querySelector('.fullscreen-img').alt  = alt;
    overlay.removeAttribute('hidden');
    overlay.querySelector('.fullscreen-close').focus();
    document.body.style.overflow = 'hidden';
  }

  function _closeFullscreen() {
    const overlay = document.getElementById('fullscreen-overlay');
    if (overlay) overlay.setAttribute('hidden', '');
    document.removeEventListener('keydown', _fsKeyHandler);
    document.body.style.overflow = '';
  }

  function _fsKeyHandler(e) {
    if (e.key === 'Escape') _closeFullscreen();
  }

  /* ── Utility ── */
  function _catLabel(category, subcategory) {
    const catMap = { 'illustrations':'Illustration','digital-applications':'Digital App','installations':'Installation','3d-models':'3D Model' };
    const subMap = { 'digital':'Digital','traditional':'Traditional','mixed-media':'Mixed Media' };
    let label = catMap[category] || category;
    if (subcategory) label += ' / ' + subMap[subcategory];
    return label;
  }

  function _esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init ── */
  function init() {
    document.addEventListener('portfolio:navigate', e => {
      if (e.detail.section === 'artwork-detail' && e.detail.param) {
        show(e.detail.param);
      }
    });
  }

  return { init, show };
}());
