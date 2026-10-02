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

  open(photo) {
    this.currentPhoto = JSON.parse(JSON.stringify(photo)); // clone
    this.render();
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.add('active');
  }

  close() {
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
    this.currentPhoto = null;
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

    let html = `
      <div class="modal-overlay active" id="crop-modal-overlay">
        <div class="modal-dialog">
          
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="color:var(--primary); font-size:1.1rem;">✂️</span>
              <h3 style="font-size:1rem; font-weight:700;">Sesuaikan Foto: ${photo.name}</h3>
            </div>
            <button class="btn btn-subtle btn-sm" id="btn-close-crop-modal">✕</button>
          </div>

          <div class="modal-body">
            <!-- Crop Visual Canvas -->
            <div class="crop-preview-box" id="crop-viewport">
              <div class="crop-target-frame" style="width: 200px; height: 300px; border-radius: 2px;"></div>
              <img id="crop-preview-img" 
                   src="${photo.previewUrl || photo.url}" 
                   alt=""
                   style="
                     max-width: 90%; 
                     max-height: 90%; 
                     transform: rotate(${rotation}deg) translate(${offsetX * 20}px, ${offsetY * 20}px);
                     object-fit: ${cropMode === 'fit' ? 'contain' : 'cover'};
                     transition: transform 150ms ease;
                   " />
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
              <label class="form-label" style="margin-bottom: 0.5rem;">Geser Posisi Foto</label>
              
              <div class="crop-offset-grid">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Geser Kiri/Kanan</span>
                  <input type="range" id="slider-offset-x" min="-1" max="1" step="0.05" value="${offsetX}" style="width: 100%;" />
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Geser Atas/Bawah</span>
                  <input type="range" id="slider-offset-y" min="-1" max="1" step="0.05" value="${offsetY}" style="width: 100%;" />
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
    const previewImg = this.container.querySelector('#crop-preview-img');

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

    // Sliders
    const sliderX = this.container.querySelector('#slider-offset-x');
    const sliderY = this.container.querySelector('#slider-offset-y');

    const updateTransform = () => {
      const x = parseFloat(sliderX?.value || 0);
      const y = parseFloat(sliderY?.value || 0);
      if (!this.currentPhoto.customCrop) this.currentPhoto.customCrop = {};
      this.currentPhoto.customCrop.offsetX = x;
      this.currentPhoto.customCrop.offsetY = y;

      if (previewImg) {
        const rot = this.currentPhoto.rotation || 0;
        previewImg.style.transform = `rotate(${rot}deg) translate(${x * 20}px, ${y * 20}px)`;
      }
    };

    if (sliderX) sliderX.addEventListener('input', updateTransform);
    if (sliderY) sliderY.addEventListener('input', updateTransform);
  }
}
