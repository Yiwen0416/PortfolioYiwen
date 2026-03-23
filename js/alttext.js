/* ============================================================
   alttext.js — AI alt-text workflow
   Uses Claude API (haiku) to generate image descriptions.
   API key stored in localStorage, never in code.
   Defines: window.Portfolio.alttext
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.alttext = (function () {

  const API_KEY_STORAGE = 'portfolio_anthropic_key';

  function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  function setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  }

  function hasApiKey() {
    const k = getApiKey();
    return k.length > 10;
  }

  /* ── Generate alt text via Claude API ── */
  async function generateAltText(imageSrc, onSuccess, onError) {
    if (!hasApiKey()) {
      showApiKeyModal(async () => {
        await generateAltText(imageSrc, onSuccess, onError);
      });
      return;
    }

    /* Convert image to base64 if it's a data URL already, else fetch it */
    let base64Data, mediaType;

    if (imageSrc.startsWith('data:')) {
      const match = imageSrc.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) { onError && onError('Invalid image format.'); return; }
      mediaType = match[1];
      base64Data = match[2];
    } else {
      try {
        const resp = await fetch(imageSrc);
        const blob = await resp.blob();
        mediaType = blob.type || 'image/jpeg';
        base64Data = await _blobToBase64(blob);
      } catch (e) {
        onError && onError('Could not load image for analysis. If using placeholder images, please upload a real image first.');
        return;
      }
    }

    const key = getApiKey();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-api-key':            key,
          'anthropic-version':    '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data }
              },
              {
                type: 'text',
                text: 'You are an accessibility specialist writing alt text for an art portfolio. Describe this artwork for a visually impaired person in 1–3 sentences. Be specific about colors, composition, subject matter, and mood. Write in plain English without jargon. Do not start with "This is" or "An image of".'
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = (err.error && err.error.message) || `API error ${response.status}`;
        onError && onError(msg);
        return;
      }

      const data = await response.json();
      const text = data.content && data.content[0] && data.content[0].text;
      if (text) {
        onSuccess && onSuccess(text.trim());
      } else {
        onError && onError('No description returned.');
      }
    } catch (e) {
      onError && onError('Network error: ' + e.message);
    }
  }

  function _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /* ── Bind alt text UI to a slideshow in detail view ── */
  function bindSlideshow(slideshowEl, artwork, goToFn) {
    // Edit mode removed; alt text editing disabled
  }

  function _refreshAltTextEditor(slideshowEl, artwork, isEdit, goToFn) {
    /* Remove existing alt-edit panels */
    slideshowEl.querySelectorAll('.alttext-editor').forEach(el => el.remove());

    if (!isEdit) return;

    const current = Portfolio.data.getArtwork(artwork.id);
    if (!current) return;

    /* Build alt text editor per image, shown after the slideshow controls */
    const container = document.createElement('div');
    container.className = 'alttext-editor';
    container.style.cssText = 'padding: var(--space-4); border-top: 1px solid var(--color-border);';

    current.images.forEach((img, i) => {
      const panel = document.createElement('div');
      panel.className = 'alttext-field';
      panel.style.marginBottom = 'var(--space-4)';
      panel.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-2);">
          <span style="font-size:var(--text-xs); text-transform:uppercase; letter-spacing:var(--tracking-wider); color:var(--color-text-muted);">
            Image ${i+1} alt text
          </span>
          <span class="badge ${img.altStatus === 'reviewed' ? 'badge-reviewed' : 'badge-draft'}">
            ${img.altStatus === 'reviewed' ? 'Reviewed' : 'Draft'}
          </span>
        </div>
        <label class="sr-only" for="alt-input-${i}">Alt text for image ${i+1}</label>
        <textarea
          id="alt-input-${i}"
          class="form-textarea"
          style="min-height:80px; font-size:var(--text-sm);"
          placeholder="Describe this image for screen readers..."
          aria-describedby="alt-hint-${i}"
        >${_esc(img.alt || '')}</textarea>
        <p id="alt-hint-${i}" class="sr-only">Write a clear, specific description of the artwork image for visually impaired users.</p>
        <div class="alttext-controls">
          <button class="btn btn-secondary btn-sm" data-generate="${i}" aria-label="Generate description with AI for image ${i+1}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor"/>
            </svg>
            Generate with AI
          </button>
          <button class="btn btn-primary btn-sm" data-approve="${i}" aria-label="Approve alt text for image ${i+1}">
            Approve
          </button>
        </div>
        <p class="alttext-status" data-status-for="${i}" style="font-size:var(--text-xs); color:var(--color-text-muted); margin-top:var(--space-1);"></p>
      `;
      container.appendChild(panel);

      const textarea = panel.querySelector(`#alt-input-${i}`);

      /* Generate button */
      panel.querySelector(`[data-generate="${i}"]`).addEventListener('click', async () => {
        const btn = panel.querySelector(`[data-generate="${i}"]`);
        const statusEl = panel.querySelector(`[data-status-for="${i}"]`);
        btn.disabled = true;
        btn.textContent = 'Generating...';
        statusEl.textContent = 'Calling Claude API...';

        /* Switch to this slide */
        if (goToFn) goToFn(i);

        const currentArtwork = Portfolio.data.getArtwork(artwork.id);
        const imgSrc = currentArtwork.images[i].src;

        await generateAltText(
          imgSrc,
          (text) => {
            textarea.value = text;
            statusEl.textContent = 'Description generated. Review and approve.';
            btn.disabled = false;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor"/></svg> Generate with AI`;
          },
          (errMsg) => {
            statusEl.textContent = 'Error: ' + errMsg;
            statusEl.style.color = 'var(--color-error)';
            btn.disabled = false;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor"/></svg> Retry`;
          }
        );
      });

      /* Approve button */
      panel.querySelector(`[data-approve="${i}"]`).addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) {
          Portfolio.ui.toast('Please add a description before approving.');
          return;
        }
        Portfolio.data.updateImage(artwork.id, i, { alt: text, altStatus: 'reviewed' });
        const badge = panel.querySelector('.badge');
        badge.textContent = 'Reviewed';
        badge.className = 'badge badge-reviewed';
        const statusEl = panel.querySelector(`[data-status-for="${i}"]`);
        statusEl.textContent = 'Alt text approved.';
        statusEl.style.color = 'var(--color-reviewed)';

        /* Update the img tag in the slide */
        const slide = slideshowEl.querySelector(`.slide[data-index="${i}"] img`);
        if (slide) slide.alt = text;

        Portfolio.ui.toast('Alt text approved for image ' + (i+1));
      });
    });

    /* API key section */
    const apiSection = document.createElement('div');
    apiSection.className = 'api-key-section';
    apiSection.innerHTML = `
      <p class="api-key-status ${hasApiKey() ? 'has-key' : ''}">
        ${hasApiKey() ? '✓ Anthropic API key saved' : 'No API key — add one to generate descriptions'}
      </p>
      <button class="btn btn-ghost btn-sm" id="btn-set-api-key">
        ${hasApiKey() ? 'Update API key' : 'Add API key'}
      </button>
    `;
    container.appendChild(apiSection);
    apiSection.querySelector('#btn-set-api-key').addEventListener('click', () => showApiKeyModal());

    slideshowEl.querySelector('.slideshow').appendChild(container);
  }

  /* ── API key modal ── */
  function showApiKeyModal(onSaved) {
    const modal = document.getElementById('api-key-modal');
    if (!modal) return;
    const input = document.getElementById('api-key-input');
    input.value = getApiKey();
    modal.showModal();

    const saveBtn = document.getElementById('btn-save-api-key');
    const cancelBtn = document.getElementById('btn-cancel-api-key');

    function cleanup() {
      saveBtn.removeEventListener('click', onSave);
      cancelBtn.removeEventListener('click', onCancel);
    }

    function onSave() {
      const key = input.value.trim();
      if (!key || key.length < 10) {
        Portfolio.ui.toast('Please enter a valid API key.');
        return;
      }
      setApiKey(key);
      modal.close();
      cleanup();
      Portfolio.ui.toast('API key saved.');
      if (onSaved) onSaved();
    }

    function onCancel() {
      modal.close();
      cleanup();
    }

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
  }

  function _esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function init() {
    /* Ensure modal close on backdrop click */
    const modal = document.getElementById('api-key-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.close();
      });
    }
  }

  return { init, generateAltText, bindSlideshow, showApiKeyModal, hasApiKey, getApiKey };
}());
