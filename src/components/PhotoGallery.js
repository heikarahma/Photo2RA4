/**
 * PhotoGallery: Manages the review list, individual copy quantities, rotations, and delete actions.
 */

export class PhotoGallery {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.photos = [];
    this.onQuantityChange = options.onQuantityChange || (() => {});
    this.onPhotoDelete = options.onPhotoDelete || (() => {});
    this.onPhotoRotate = options.onPhotoRotate || (() => {});
    this.onPhotoEditCrop = options.onPhotoEditCrop || (() => {});
    this.onClearAll = options.onClearAll || (() => {});
  }

  setPhotos(photos) {
    this.photos = photos;
    this.render();
  }

  render() {
    if (!this.container) return;

    if (this.photos.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    const totalCopies = this.photos.reduce((sum, p) => sum + (p.quantity || 1), 0);

    let html = `
      <div class="gallery-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">Daftar Foto</span>
          <span class="gallery-count-badge">${this.photos.length} file • Total ${totalCopies} lembar foto</span>
        </div>
        <button class="btn btn-subtle btn-sm" id="btn-clear-gallery" title="Hapus semua foto">
          Hapus Semua
        </button>
      </div>
      <div class="photo-items-scroll">
    `;

    this.photos.forEach(photo => {
      const formattedSize = this.formatFileSize(photo.sizeBytes);
      const rotationDeg = photo.rotation || 0;

      html += `
        <div class="photo-card-item" data-photo-id="${photo.id}">
          <div class="photo-card-main">
            <div class="photo-thumbnail-box">
              <img src="${photo.previewUrl}" alt="${photo.name}" style="transform: rotate(${rotationDeg}deg);" />
            </div>

            <div class="photo-details">
              <div class="photo-filename" title="${photo.name}">${photo.name}</div>
              <div class="photo-meta">
                <span>${photo.naturalWidth}×${photo.naturalHeight}px</span>
                <span>•</span>
                <span>${formattedSize}</span>
                ${rotationDeg > 0 ? `<span style="color:#60a5fa;">↻ ${rotationDeg}°</span>` : ''}
              </div>
            </div>

            <button class="action-icon-btn danger btn-delete-photo btn-delete-mobile-header" data-photo-id="${photo.id}" title="Hapus foto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>

          <div class="photo-card-controls">
            <!-- Quantity Stepper -->
            <div class="quantity-control-group" title="Jumlah cetak foto ini">
              <button class="qty-btn btn-qty-minus" data-photo-id="${photo.id}" aria-label="Kurangi salinan">−</button>
              <input type="number" class="qty-input" data-photo-id="${photo.id}" value="${photo.quantity || 1}" min="1" max="99" />
              <button class="qty-btn btn-qty-plus" data-photo-id="${photo.id}" aria-label="Tambah salinan">+</button>
            </div>

            <!-- Individual Actions -->
            <div class="photo-actions">
              <button class="action-icon-btn btn-rotate-photo" data-photo-id="${photo.id}" title="Putar 90°">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span class="action-btn-label">Putar</span>
              </button>
              <button class="action-icon-btn btn-crop-photo" data-photo-id="${photo.id}" title="Sesuaikan Posisi / Crop">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2v14a2 2 0 0 0 2 2h14"/>
                  <path d="M18 22V8a2 2 0 0 0-2-2H2"/>
                </svg>
                <span class="action-btn-label">Crop</span>
              </button>
              <button class="action-icon-btn danger btn-delete-photo btn-delete-desktop" data-photo-id="${photo.id}" title="Hapus foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Quantity minus
    this.container.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-photo-id');
        const photo = this.photos.find(p => p.id === id);
        if (photo && photo.quantity > 1) {
          this.onQuantityChange(id, photo.quantity - 1);
        }
      });
    });

    // Quantity plus
    this.container.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-photo-id');
        const photo = this.photos.find(p => p.id === id);
        if (photo) {
          this.onQuantityChange(id, (photo.quantity || 1) + 1);
        }
      });
    });

    // Quantity direct input
    this.container.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.getAttribute('data-photo-id');
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 99) val = 99;
        this.onQuantityChange(id, val);
      });
    });

    // Rotate
    this.container.querySelectorAll('.btn-rotate-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-photo-id');
        this.onPhotoRotate(id);
      });
    });

    // Crop
    this.container.querySelectorAll('.btn-crop-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-photo-id');
        this.onPhotoEditCrop(id);
      });
    });

    // Delete
    this.container.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-photo-id');
        this.onPhotoDelete(id);
      });
    });

    // Clear all
    const clearBtn = this.container.querySelector('#btn-clear-gallery');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Hapus semua foto dari antrean cetak?')) {
          this.onClearAll();
        }
      });
    }
  }

  formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
