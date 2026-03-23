/* ============================================================
   gallery.js — Gallery render + category/subcategory filtering
   Defines: window.Portfolio.gallery
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.gallery = (function () {

  const CATEGORIES = [
    { value: null,                   label: 'All work' },
    { value: 'illustrations',        label: 'Illustrations' },
    { value: 'digital-applications', label: 'Digital Apps' },
    { value: 'installations',        label: 'Installations' },
    { value: '3d-models',            label: '3D Models' }
  ];

  const SUBCATEGORIES = [
    { value: null,          label: 'All' },
    { value: 'digital',     label: 'Digital' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'mixed-media', label: 'Mixed Media' }
  ];

  let _activeCategory    = null;
  let _activeSubcategory = null;
  let _el = null;

  /* ── Build section HTML once ── */
  function _buildSkeleton() {
    const section = document.getElementById('gallery');
    section.innerHTML = `
      <div class="gallery-header">
        <h1 class="gallery-title">Work</h1>
        <p class="gallery-count" aria-live="polite" aria-atomic="true"></p>
      </div>

      <div class="filter-bar" role="group" aria-label="Filter by category">
        ${CATEGORIES.map(c => `
          <button
            class="filter-btn"
            data-cat="${c.value || ''}"
            aria-pressed="${c.value === _activeCategory ? 'true' : 'false'}"
          >${c.label}</button>
        `).join('')}
      </div>

      <div class="sub-filter-bar" id="sub-filter-bar" role="group" aria-label="Filter by subcategory" hidden>
        ${SUBCATEGORIES.map(s => `
          <button
            class="filter-btn"
            data-subcat="${s.value || ''}"
            aria-pressed="${s.value === _activeSubcategory ? 'true' : 'false'}"
          >${s.label}</button>
        `).join('')}
      </div>

      <div class="gallery-grid" id="gallery-grid" aria-label="Artwork gallery" role="list">
      </div>
    `;

    /* Filter button events */
    section.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.cat || null;
        _activeCategory    = val;
        _activeSubcategory = null;
        _render();
      });
    });

    section.querySelectorAll('[data-subcat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.subcat || null;
        _activeSubcategory = val;
        _render();
      });
    });

    _el = section;
  }

  /* ── Render grid ── */
  function _render() {
    const artworks = Portfolio.data.getFiltered({
      category:    _activeCategory,
      subcategory: _activeSubcategory
    });

    /* Update filter button states */
    _el.querySelectorAll('[data-cat]').forEach(btn => {
      const val = btn.dataset.cat || null;
      btn.setAttribute('aria-pressed', String(val === _activeCategory));
    });

    /* Show/hide subcategory filter */
    const subBar = document.getElementById('sub-filter-bar');
    if (_activeCategory === 'illustrations') {
      subBar.removeAttribute('hidden');
    } else {
      subBar.setAttribute('hidden', '');
      _activeSubcategory = null;
    }

    _el.querySelectorAll('[data-subcat]').forEach(btn => {
      const val = btn.dataset.subcat || null;
      btn.setAttribute('aria-pressed', String(val === _activeSubcategory));
    });

    /* Update count */
    const countEl = _el.querySelector('.gallery-count');
    countEl.textContent = `${artworks.length} work${artworks.length !== 1 ? 's' : ''}`;

    /* Render cards */
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    artworks.forEach((artwork, i) => {
      const card = _buildCard(artwork, i);
      grid.appendChild(card);
    });

  }

  function _buildCard(artwork, index) {
    const primaryImage = artwork.images[0] || {};
    const hasDraft = artwork.images.some(img => img.altStatus !== 'reviewed');
    const catLabel = _catLabel(artwork.category, artwork.subcategory);
    const delay = Math.min(index * 40, 400);

    const li = document.createElement('article');
    li.className = 'artwork-card';
    li.setAttribute('role', 'listitem');
    li.style.animationDelay = `${delay}ms`;
    li.setAttribute('data-artwork-id', artwork.id);

    li.innerHTML = `
      ${hasDraft ? `<span class="card-alttext-warning" aria-label="Some images have unreviewed alt text">Alt pending</span>` : ''}
      <a
        href="#artwork/${artwork.id}"
        class="card-link"
        aria-label="View ${_esc(artwork.title)}, ${artwork.year}"
      ></a>
      <div class="card-image-wrap">
        <img
          src="${_esc(primaryImage.src || 'assets/placeholder.svg')}"
          alt="${_esc(primaryImage.alt || '')}"
          loading="lazy"
        />
        <div class="card-overlay" aria-hidden="true">
          <span class="card-overlay-text">View work</span>
        </div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${_esc(artwork.title)}</h2>
        <p class="card-meta">${artwork.year} &nbsp;·&nbsp; <span class="badge">${catLabel}</span></p>
      </div>
    `;

    return li;
  }

  /* ── Utility ── */
  function _catLabel(category, subcategory) {
    const catMap = {
      'illustrations':        'Illustration',
      'digital-applications': 'Digital App',
      'installations':        'Installation',
      '3d-models':            '3D Model'
    };
    const subMap = {
      'digital':     'Digital',
      'traditional': 'Traditional',
      'mixed-media': 'Mixed Media'
    };
    let label = catMap[category] || category;
    if (subcategory) label += ' / ' + subMap[subcategory];
    return label;
  }

  function _esc(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Public API ── */
  function init() {
    _buildSkeleton();

    /* Re-render when returning to gallery */
    document.addEventListener('portfolio:navigate', (e) => {
      if (e.detail.section === 'gallery') {
        _render();
      }
    });
  }

  function refresh() { if (_el) _render(); }

  return { init, refresh };
}());
