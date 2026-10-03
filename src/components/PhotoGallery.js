/**
 * PhotoGallery: Manages the review list, individual copy quantities, rotations, and delete actions.
 */

export class PhotoGallery {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.photos = [];
    this.slotInfoMap = {};
    this.onQuantityChange = options.onQuantityChange || (() => {});
    this.onPhotoDelete = options.onPhotoDelete || (() => {});
    this.onPhotoRotate = options.onPhotoRotate || (() => {});
    this.onPhotoEditCrop = options.onPhotoEditCrop || (() => {});
    this.onPhotoMove = options.onPhotoMove || (() => {});
    this.onClearAll = options.onClearAll || (() => {});

    this.draggedIndex = null;
  }

  setPhotos(photos, slotInfoMap = {}) {
    this.photos = photos;
    this.slotInfoMap = slotInfoMap;
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
      <div class="gallery-reorder-hint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Gunakan tombol ▲▼ atau tarik foto untuk memindahkan urutan cetak</span>
      </div>
      <div class="photo-items-scroll">
    `;

    this.photos.forEach((photo, index) => {
      const formattedSize = this.formatFileSize(photo.sizeBytes);
      const rotationDeg = photo.rotation || 0;
      const isFirst = index === 0;
      const isLast = index === this.photos.length - 1;

      const slotPos = this.slotInfoMap[photo.id];
      const posBadgeText = slotPos ? `#${slotPos.number}` : `#${index + 1}`;
      const posBadgeTitle = slotPos ? `Posisi di Kertas: Slot #${slotPos.number} (${slotPos.label})` : `Urutan ke-${index + 1}`;

      html += `
        <div class="photo-card-item" data-photo-id="${photo.id}" data-index="${index}" draggable="true">
          <!-- Baris 1: Identitas & Info Utama Foto -->
          <div class="photo-card-top-row">
            <div class="photo-drag-handle" title="Tarik untuk memindahkan urutan cetak">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/>
                <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
                <circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/>
              </svg>
            </div>

            <div class="photo-order-badge" title="${posBadgeTitle}">
              ${posBadgeText}
            </div>

            <div class="photo-thumbnail-box">
              <img src="${photo.previewUrl}" alt="${photo.name}" draggable="false" style="transform: rotate(${rotationDeg}deg);" />
            </div>

            <div class="photo-details">
              <div class="photo-filename" title="${photo.name}">${photo.name}</div>
              <div class="photo-meta">
                <span>${photo.naturalWidth}×${photo.naturalHeight}px</span>
                <span class="meta-dot">•</span>
                <span>${formattedSize}</span>
                ${rotationDeg > 0 ? `<span class="photo-rot-tag">↻ ${rotationDeg}°</span>` : ''}
              </div>
            </div>

            <div class="photo-card-top-actions">
              ${slotPos ? `<span class="photo-slot-pill" title="Posisi cetak di kertas A4">📍 ${slotPos.label}</span>` : ''}
              <button class="action-icon-btn danger btn-delete-photo" data-photo-id="${photo.id}" title="Hapus foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Baris 2: Stepper Salinan & Tombol Aksi -->
          <div class="photo-card-bottom-row">
            <div class="photo-qty-wrapper">
              <span class="photo-qty-label">Salinan:</span>
              <div class="quantity-control-group" title="Jumlah cetak foto ini">
                <button class="qty-btn btn-qty-minus" data-photo-id="${photo.id}" aria-label="Kurangi salinan">−</button>
                <input type="number" class="qty-input" data-photo-id="${photo.id}" value="${photo.quantity || 1}" min="1" max="99" />
                <button class="qty-btn btn-qty-plus" data-photo-id="${photo.id}" aria-label="Tambah salinan">+</button>
              </div>
            </div>

            <div class="photo-card-action-bar">
              <!-- Reorder Buttons -->
              <div class="photo-move-buttons" title="Pindahkan urutan posisi cetak">
                <button class="btn-move-photo btn-move-up" data-index="${index}" ${isFirst ? 'disabled' : ''} title="Pindahkan ke urutan sebelumnya (Naik)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
                <button class="btn-move-photo btn-move-down" data-index="${index}" ${isLast ? 'disabled' : ''} title="Pindahkan ke urutan berikutnya (Turun)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              <!-- Rotate & Crop Actions -->
              <button class="photo-btn-pill btn-rotate-photo" data-photo-id="${photo.id}" title="Putar 90°">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Putar</span>
              </button>

              <button class="photo-btn-pill btn-crop-photo" data-photo-id="${photo.id}" title="Sesuaikan Posisi / Crop">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2v14a2 2 0 0 0 2 2h14"/>
                  <path d="M18 22V8a2 2 0 0 0-2-2H2"/>
                </svg>
                <span>Crop</span>
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
    // Reorder buttons (Up)
    this.container.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (index > 0) {
          this.onPhotoMove(index, index - 1);
        }
      });
    });

    // Reorder buttons (Down)
    this.container.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (index < this.photos.length - 1) {
          this.onPhotoMove(index, index + 1);
        }
      });
    });

    // Drag and drop for reordering photo cards
    const cards = this.container.querySelectorAll('.photo-card-item');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedIndex = parseInt(card.getAttribute('data-index'), 10);
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(this.draggedIndex));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        cards.forEach(c => c.classList.remove('is-drop-over'));
        this.draggedIndex = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const currentIndex = parseInt(card.getAttribute('data-index'), 10);
        if (this.draggedIndex !== null && this.draggedIndex !== currentIndex) {
          card.classList.add('is-drop-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('is-drop-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('is-drop-over');
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
          this.onPhotoMove(this.draggedIndex, targetIndex);
        }
      });
    });

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
