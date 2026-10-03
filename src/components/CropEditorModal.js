/**
 * CropEditorModal: Fine-tune cropping, position framing, and rotation for individual photos.
 */

export class CropEditorModal {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.currentPhoto = null;
    this.onSave = options.onSave || (() => {});
    this.render();
  }

  open(photo, slotInfo = null) {
    this.currentPhoto = JSON.parse(JSON.stringify(photo)); // clone
    this.currentSlotInfo = slotInfo;
    this.render();
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.add('active');
  }

  close() {
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
    this.currentPhoto = null;
    this.currentSlotInfo = null;
  }

  render() {
    if (!this.container) return;

    if (!this.currentPhoto) {
      this.container.innerHTML = `
        <div class="modal-overlay" id="crop-modal-overlay"></div>
      `;
      return;
    }

    const photo = this.currentPhoto;
    const rotation = photo.rotation || 0;
    const cropMode = photo.cropMode || 'cover';
    const offsetX = photo.customCrop?.offsetX || 0;
    const offsetY = photo.customCrop?.offsetY || 0;

    const slot = this.currentSlotInfo;
    const slotW = slot?.width || 60;
    const slotH = slot?.height || 90;
    const isLandscape = slotW > slotH;
    const aspect = slotW / slotH;

    // Viewport frame dimensions matching exact aspect ratio
    const maxBoxW = 280;
    const maxBoxH = 260;
    let frameWidth, frameHeight;

    if (aspect >= 1) {
      frameWidth = maxBoxW;
      frameHeight = Math.round(maxBoxW / aspect);
      if (frameHeight > maxBoxH) {
        frameHeight = maxBoxH;
        frameWidth = Math.round(maxBoxH * aspect);
      }
    } else {
      frameHeight = maxBoxH;
      frameWidth = Math.round(maxBoxH * aspect);
      if (frameWidth > maxBoxW) {
        frameWidth = maxBoxW;
        frameHeight = Math.round(maxBoxW / aspect);
      }
    }

    let innerFrameHtml = '';
    if (slot?.isPolaroid && slot?.polaroidPadding) {
      const pTop = (slot.polaroidPadding.top / slotH) * 100;
      const pBottom = (slot.polaroidPadding.bottom / slotH) * 100;
      const pLeft = (slot.polaroidPadding.left / slotW) * 100;
      const pRight = (slot.polaroidPadding.right / slotW) * 100;
      innerFrameHtml = `
        <div style="position: absolute; top: ${pTop}%; bottom: ${pBottom}%; left: ${pLeft}%; right: ${pRight}%; border: 1.5px dashed rgba(255, 255, 255, 0.8); pointer-events: none; z-index: 12;" title="Batas foto di dalam bingkai polaroid"></div>
      `;
    }

    let html = `
      <div class="modal-overlay active" id="crop-modal-overlay">
        <div class="modal-dialog">
          
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <span style="color:var(--primary); font-size:1.2rem;">✂️</span>
              <div>
                <h3 style="font-size:0.95rem; font-weight:700; margin:0;">Sesuaikan Foto: ${photo.name}</h3>
                <div style="font-size:0.72rem; color:var(--text-muted); display:flex; gap:0.5rem; align-items:center; margin-top:0.15rem;">
                  <span>Frame: <b>${slotW} × ${slotH} mm</b></span>
                  <span class="brand-badge" style="font-size:0.65rem; padding:1px 6px;">${isLandscape ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-subtle btn-sm" id="btn-close-crop-modal">✕</button>
          </div>

          <div class="modal-body">
            <!-- Crop Visual Canvas with Direct Drag / Pan Support -->
            <div class="crop-preview-box" id="crop-viewport" title="Klik dan geser foto untuk mengatur posisi framing">
              <div class="crop-target-frame" style="width: ${frameWidth}px; height: ${frameHeight}px; border-radius: 2px;">
                ${innerFrameHtml}
              </div>
              
              <div class="crop-pan-canvas" id="crop-pan-canvas">
                <img id="crop-preview-img" 
                     src="${photo.previewUrl || photo.url}" 
                     alt=""
                     draggable="false"
                     style="
                       max-width: 90%; 
                       max-height: 90%; 
                       transform: rotate(${rotation}deg) translate(${offsetX * 40}px, ${offsetY * 40}px);
                       object-fit: ${cropMode === 'fit' ? 'contain' : 'cover'};
                       cursor: grab;
                       user-select: none;
                       touch-action: none;
                     " />
              </div>

              <!-- Interactive Drag Overlay Guide -->
              <div class="crop-drag-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                <span>Geser foto untuk mengatur posisi framing</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="crop-controls-grid">
              <div>
                <label class="form-label">Mode Tampilan</label>
                <div class="segmented-control" id="modal-crop-mode">
                  <button type="button" class="segmented-btn ${cropMode === 'cover' ? 'active' : ''}" data-value="cover">
                    Penuh (Cover)
                  </button>
                  <button type="button" class="segmented-btn ${cropMode === 'fit' ? 'active' : ''}" data-value="fit">
                    Muat (Fit)
                  </button>
                </div>
              </div>

              <div>
                <label class="form-label">Rotasi Foto</label>
                <button type="button" class="btn btn-secondary" id="modal-btn-rotate" style="width: 100%;">
                  ↻ Putar 90° (${rotation}°)
                </button>
              </div>
            </div>

            <!-- Position sliders if cover mode -->
            <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label class="form-label" style="margin-bottom: 0;">Geser Posisi Framing Foto</label>
                <button type="button" class="btn btn-subtle btn-xs" id="btn-reset-crop-offset" title="Kembalikan posisi foto ke tengah persis">
                  Pusatkan (0, 0)
                </button>
              </div>
              
              <div class="crop-offset-grid">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Geser Kiri/Kanan (<span id="offset-x-val">${offsetX.toFixed(2)}</span>)</span>
                  <input type="range" id="slider-offset-x" min="-1" max="1" step="0.02" value="${offsetX}" style="width: 100%;" />
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Geser Atas/Bawah (<span id="offset-y-val">${offsetY.toFixed(2)}</span>)</span>
                  <input type="range" id="slider-offset-y" min="-1" max="1" step="0.02" value="${offsetY}" style="width: 100%;" />
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn btn-subtle" id="btn-cancel-crop">Batal</button>
            <button class="btn btn-primary" id="btn-save-crop">Simpan & Perbarui Layout</button>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#btn-close-crop-modal');
    const cancelBtn = this.container.querySelector('#btn-cancel-crop');
    const saveBtn = this.container.querySelector('#btn-save-crop');
    const rotateBtn = this.container.querySelector('#modal-btn-rotate');
    const resetBtn = this.container.querySelector('#btn-reset-crop-offset');
    const previewImg = this.container.querySelector('#crop-preview-img');
    const viewport = this.container.querySelector('#crop-viewport');
    const sliderX = this.container.querySelector('#slider-offset-x');
    const sliderY = this.container.querySelector('#slider-offset-y');
    const labelX = this.container.querySelector('#offset-x-val');
    const labelY = this.container.querySelector('#offset-y-val');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (this.currentPhoto) {
          this.onSave(this.currentPhoto);
        }
        this.close();
      });
    }

    // Rotate
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        this.currentPhoto.rotation = ((this.currentPhoto.rotation || 0) + 90) % 360;
        this.render();
      });
    }

    // Crop mode buttons
    this.container.querySelectorAll('#modal-crop-mode .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        this.currentPhoto.cropMode = val;
        this.render();
      });
    });

    const updateVisual = (x, y) => {
      if (!this.currentPhoto.customCrop) this.currentPhoto.customCrop = {};
      this.currentPhoto.customCrop.offsetX = x;
      this.currentPhoto.customCrop.offsetY = y;

      if (sliderX) sliderX.value = x;
      if (sliderY) sliderY.value = y;
      if (labelX) labelX.textContent = x.toFixed(2);
      if (labelY) labelY.textContent = y.toFixed(2);

      if (previewImg) {
        const rot = this.currentPhoto.rotation || 0;
        previewImg.style.transform = `rotate(${rot}deg) translate(${x * 40}px, ${y * 40}px)`;
      }
    };

    // Sliders
    if (sliderX) {
      sliderX.addEventListener('input', () => {
        const x = parseFloat(sliderX.value || 0);
        const y = parseFloat(sliderY?.value || 0);
        updateVisual(x, y);
      });
    }

    if (sliderY) {
      sliderY.addEventListener('input', () => {
        const x = parseFloat(sliderX?.value || 0);
        const y = parseFloat(sliderY.value || 0);
        updateVisual(x, y);
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        updateVisual(0, 0);
      });
    }

    // Direct pointer drag (Mouse & Touch gestures for framing pan)
    if (viewport && previewImg) {
      let isDragging = false;
      let startPointerX = 0;
      let startPointerY = 0;
      let initialOffsetX = 0;
      let initialOffsetY = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        initialOffsetX = this.currentPhoto.customCrop?.offsetX || 0;
        initialOffsetY = this.currentPhoto.customCrop?.offsetY || 0;
        previewImg.style.cursor = 'grabbing';
        previewImg.setPointerCapture?.(e.pointerId);
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startPointerX;
        const dy = e.clientY - startPointerY;

        // Sensitivity: 120px movement traverses the full -1 to 1 range (0.5 to 1.0)
        let newX = initialOffsetX + (dx / 60);
        let newY = initialOffsetY + (dy / 60);

        newX = Math.max(-1, Math.min(1, Math.round(newX * 100) / 100));
        newY = Math.max(-1, Math.min(1, Math.round(newY * 100) / 100));

        updateVisual(newX, newY);
      };

      const onPointerUp = (e) => {
        if (isDragging) {
          isDragging = false;
          previewImg.style.cursor = 'grab';
          try {
            previewImg.releasePointerCapture?.(e.pointerId);
          } catch (err) {}
        }
      };

      previewImg.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }
  }
}
