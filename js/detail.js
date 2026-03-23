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

    /* ── Process section (full width below) ── */
    if (artwork.process && artwork.process.length > 0) {
      const processSection = document.createElement('div');
      processSection.className = 'detail-process-section';
      processSection.innerHTML = _buildProcessHTML(artwork);
      layout.appendChild(processSection);
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

    /* Alttext workflow integration */
    Portfolio.alttext.bindSlideshow(wrap, artwork, goTo);
  }

  /* ── Meta panel HTML ── */
  function _buildMetaPanelHTML(artwork) {
    return `
      <h1 class="detail-title">${_esc(artwork.title)}</h1>

      <div class="detail-metadata">
        <div class="meta-item">
          <span class="meta-label">Year</span>
          <span class="meta-value">${_esc(artwork.year)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Size</span>
          <span class="meta-value">${_esc(artwork.size)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Materials</span>
          <span class="meta-value">${_esc(artwork.materials)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Category</span>
          <span class="badge">${_catLabel(artwork.category, artwork.subcategory)}</span>
        </div>
      </div>

      <div class="detail-description">${_esc(artwork.description)}</div>
    `;
  }

  /* ── Process section HTML ── */
  function _buildProcessHTML(artwork) {
    const blocks = (artwork.process || []).map((block, i) => _buildBlockHTML(block, i)).join('');

    return `
      <h2 class="process-section-title">Process</h2>
      <div class="process-blocks" id="process-blocks">
        ${blocks}
      </div>
    `;
  }

  function _buildBlockHTML(block, index) {
    if (block.type === 'text') {
      return `
        <div class="process-block process-text-block" data-block-index="${index}">
          <p>${_esc(block.content || '')}</p>
        </div>
      `;
    } else if (block.type === 'image') {
      return `
        <div class="process-block process-image-block" data-block-index="${index}">
          <img src="${_esc(block.src || 'assets/placeholder.svg')}" alt="${_esc(block.caption || '')}" />
          <p class="process-image-caption">${_esc(block.caption || '')}</p>
        </div>
      `;
    }
    return '';
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
