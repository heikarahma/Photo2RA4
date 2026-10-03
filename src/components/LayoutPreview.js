/**
 * LayoutPreview: Renders the realistic A4 paper canvas preview with physical dimensions and cut guides.
 */

export class LayoutPreview {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.layout = null;
    this.currentPage = 0;
    this.zoomLevel = 1.0;
    this.fitToScreen = true;
    this.onSlotClick = options.onSlotClick || (() => {});
    this.onSwapSlots = options.onSwapSlots || (() => {});
    this.onMoveToSlot = options.onMoveToSlot || (() => {});
    this.onEmptySlotClick = options.onEmptySlotClick || (() => {});
    this.onToggleOrientation = options.onToggleOrientation || (() => {});
    this.onToggleCropMode = options.onToggleCropMode || (() => {});
    this.onPhotoRotate = options.onPhotoRotate || (() => {});
    this.onPageChange = options.onPageChange || (() => {});

    this.draggedSlotPhotoId = null;
    this.draggedSlotIndex = null;
    this.justDragged = false;
  }

  setLayout(layout) {
    this.layout = layout;
    // ensure page index valid
    if (this.currentPage >= layout.totalPages) {
      this.currentPage = Math.max(0, layout.totalPages - 1);
    }
    if (this.fitToScreen) {
      const autoFit = this.calculateAutoFitZoom();
      if (autoFit < 1.0) {
        this.zoomLevel = autoFit;
      }
    }
    this.render();
  }

  setPage(pageIndex) {
    if (this.layout && pageIndex >= 0 && pageIndex < this.layout.totalPages) {
      this.currentPage = pageIndex;
      this.render();
      this.onPageChange(this.currentPage);
    }
  }

  render() {
    if (!this.container) return;

    if (!this.layout || this.layout.totalPhotos === 0) {
      this.renderEmptyState();
      return;
    }

    const { paper, pages, settings, photoPreset } = this.layout;
    const page = pages[this.currentPage] || pages[0];

    // Compute pixel dimensions for display
    // Base preview width is 580px for A4 portrait
    const baseWidthPx = paper.orientation === 'landscape' ? 760 : 560;
    const aspectRatio = paper.height / paper.width;
    const baseHeightPx = Math.round(baseWidthPx * aspectRatio);

    const sheetWidth = Math.round(baseWidthPx * this.zoomLevel);
    const sheetHeight = Math.round(baseHeightPx * this.zoomLevel);

    // Scaling ratio from mm to preview pixels
    const mmToPx = sheetWidth / paper.width;

    let html = `
      <div class="a4-paper-sheet" id="preview-paper-sheet" style="width: ${sheetWidth}px; height: ${sheetHeight}px;">
    `;

    // Render Slots (Both occupied and empty slots)
    page.slots.forEach(slot => {
      const leftPx = slot.x * mmToPx;
      const topPx = slot.y * mmToPx;
      const widthPx = slot.width * mmToPx;
      const heightPx = slot.height * mmToPx;

      if (!slot.photo) {
        // Render Empty Slot Placeholder
        html += `
          <div class="preview-slot empty-slot" 
               data-slot-id="${slot.id}"
               data-global-index="${slot.globalIndex}"
               style="left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px;"
               title="Slot Kosong (Posisi #${slot.globalIndex + 1} - ${slot.positionLabel}) • Tarik foto ke sini atau klik untuk menaruh foto">
            
            <div class="empty-slot-content">
              <div class="empty-slot-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <span class="empty-slot-pos-badge">#${slot.globalIndex + 1}</span>
              <span class="empty-slot-label">${slot.positionLabel}</span>
              <span class="empty-slot-hint">Klik/Tarik ke sini</span>
              <button type="button" class="empty-slot-orient-btn" title="Ubah orientasi semua frame foto ke ${slot.width > slot.height ? 'Tegak (Portrait)' : 'Mendatar (Landscape)'}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 21h5v-5"/>
                </svg>
                <span>${slot.width > slot.height ? 'Frame Mendatar' : 'Ubah ke Landscape'}</span>
              </button>
            </div>

            <!-- Drop Target Indicator Overlay -->
            <div class="slot-drop-overlay">
              <div class="slot-drop-badge empty-target">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Taruh di Posisi #${slot.globalIndex + 1} (${slot.positionLabel})</span>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Render Occupied Slot
      const rotation = slot.photo.rotation || 0;
      const cropMode = slot.cropMode;
      const objectFit = cropMode === 'fit' ? 'contain' : 'cover';

      // Precise framing offset percentage (50% is centered)
      const offsetX = slot.photo.customCrop?.offsetX || 0;
      const offsetY = slot.photo.customCrop?.offsetY || 0;
      const objPosX = 50 - (offsetX * 50);
      const objPosY = 50 - (offsetY * 50);

      const isPolaroid = Boolean(slot.isPolaroid && slot.polaroidPadding);
      const isSlotLandscape = slot.width > slot.height;
      let innerContainerStyle = 'position: absolute; inset: 0; overflow: hidden; background: #ffffff;';
      let slotExtraStyle = '';
      let innerW = widthPx;
      let innerH = heightPx;

      if (isPolaroid) {
        const pTop = slot.polaroidPadding.top * mmToPx;
        const pLeft = slot.polaroidPadding.left * mmToPx;
        const pRight = slot.polaroidPadding.right * mmToPx;
        const pBottom = slot.polaroidPadding.bottom * mmToPx;

        innerW = widthPx - pLeft - pRight;
        innerH = heightPx - pTop - pBottom;

        slotExtraStyle = 'background: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12); border: 1px solid #e2e8f0;';
        innerContainerStyle = `position: absolute; left: ${pLeft}px; top: ${pTop}px; right: ${pRight}px; bottom: ${pBottom}px; overflow: hidden; background: #0f172a; border: 1px solid rgba(0, 0, 0, 0.06);`;
      }

      const isRotated90 = (rotation % 180) !== 0;
      let imgStyle = '';
      if (isRotated90) {
        imgStyle = `position: absolute; left: 50%; top: 50%; width: ${innerH}px; height: ${innerW}px; transform: translate(-50%, -50%) rotate(${rotation}deg); object-fit: ${objectFit}; object-position: ${objPosX}% ${objPosY}%; pointer-events: none;`;
      } else {
        imgStyle = `position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(${rotation}deg); object-fit: ${objectFit}; object-position: ${objPosX}% ${objPosY}%; pointer-events: none;`;
      }

      html += `
        <div class="preview-slot is-occupied ${isPolaroid ? 'is-polaroid' : ''}" 
             draggable="true"
             data-photo-id="${slot.photo.id}" 
             data-slot-id="${slot.id}"
             data-global-index="${slot.globalIndex}"
             style="left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px; ${slotExtraStyle}"
             title="Tarik (drag) untuk memindahkan/menukar posisi, atau klik untuk sesuaikan foto">
          
          <div class="slot-inner-container" style="${innerContainerStyle}">
            <img src="${slot.photo.previewUrl || slot.photo.url}" 
                 alt="${slot.photo.name}" 
                 draggable="false"
                 style="${imgStyle}" />
          </div>

          <!-- Position & Move Badge -->
          <div class="slot-drag-handle-badge" title="Tarik foto untuk memindahkan posisi">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            <span>#${slot.globalIndex + 1} ${slot.positionLabel}</span>
          </div>

          <!-- Slot Quick Actions -->
          <div class="slot-quick-actions">
            <button type="button" class="slot-quick-action-btn btn-slot-orient-toggle" title="Ubah frame cetak ke ${isSlotLandscape ? 'Tegak / Portrait (60×90mm)' : 'Mendatar / Landscape (90×60mm) agar foto landscape pas tanpa zoom'}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                ${isSlotLandscape 
                  ? '<rect x="5" y="2" width="14" height="20" rx="2"/>' 
                  : '<rect x="2" y="5" width="20" height="14" rx="2"/>'}
              </svg>
              <span>${isSlotLandscape ? 'Frame Tegak' : 'Frame Landscape'}</span>
            </button>
            <button type="button" class="slot-quick-action-btn btn-slot-crop-toggle ${cropMode === 'cover' ? 'active-cover' : ''}" data-photo-id="${slot.photo.id}" title="${cropMode === 'cover' ? 'Mode Penuh Aktif (Foto di-zoom/crop agar mengisi frame). Klik untuk mode Utuh tanpa zoom' : 'Mode Utuh Aktif (Foto utuh tanpa di-zoom). Klik untuk mode Penuh'}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              <span>${cropMode === 'cover' ? 'Penuh (Zoom)' : 'Utuh (No Zoom)'}</span>
            </button>
            <button type="button" class="slot-quick-action-btn btn-slot-rotate" data-photo-id="${slot.photo.id}" title="Putar orientasi foto 90°">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Putar</span>
            </button>
          </div>

          <!-- Drop Target Indicator Overlay -->
          <div class="slot-drop-overlay">
            <div class="slot-drop-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
              <span>Tukar ke Posisi #${slot.globalIndex + 1} (${slot.positionLabel})</span>
            </div>
          </div>

          <!-- Hover Dimension Tooltip -->
          <div class="slot-dimension-badge">
            #${slot.globalIndex + 1} ${slot.positionLabel} • ${slot.width} × ${slot.height} mm
          </div>

          <!-- Cutting Guides on Preview -->
          ${settings.showCuttingGuides ? this.renderPreviewCuttingGuides(slot, mmToPx, settings.cuttingGuideType) : ''}
        </div>
      `;
    });

    // Global dashed grid lines if selected
    if (settings.showCuttingGuides && settings.cuttingGuideType === 'dashed') {
      page.gridGuideLines.forEach(line => {
        const x1 = line.x1 * mmToPx;
        const y1 = line.y1 * mmToPx;
        const x2 = line.x2 * mmToPx;
        const y2 = line.y2 * mmToPx;

        if (line.type === 'vertical') {
          html += `
            <div style="position: absolute; left: ${x1}px; top: ${y1}px; width: 1px; height: ${y2 - y1}px; border-left: 1px dashed rgba(100, 116, 139, 0.6); pointer-events: none;"></div>
          `;
        } else {
          html += `
            <div style="position: absolute; left: ${x1}px; top: ${y1}px; width: ${x2 - x1}px; height: 1px; border-top: 1px dashed rgba(100, 116, 139, 0.6); pointer-events: none;"></div>
          `;
        }
      });
    }

    // Physical watermark note at the bottom edge
    html += `
      <div style="position: absolute; bottom: ${3 * mmToPx}px; left: 0; width: 100%; text-align: center; font-size: ${Math.max(9, Math.round(9 * this.zoomLevel))}px; color: #94a3b8; font-family: var(--font-mono); pointer-events: none;">
        Photo2RA4 • Skala 100% (${photoPreset.code}: ${slotDimensionsText(this.layout)}) • Halaman ${page.pageNumber}/${this.layout.totalPages}
      </div>
    `;

    html += `</div>`;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  renderPreviewCuttingGuides(slot, mmToPx, guideType) {
    if (guideType === 'border') {
      return `<div class="cut-border-dashed" style="border-style: solid; border-color: rgba(148, 163, 184, 0.6); border-width: 1px;"></div>`;
    }

    if (guideType === 'dashed') {
      return `<div class="cut-border-dashed"></div>`;
    }

    // Corner marks (Sudut)
    const markLengthPx = 3 * mmToPx;
    const offsetPx = (this.layout.settings.gap > 0 ? Math.min(1.5, this.layout.settings.gap / 2) : 1) * mmToPx;

    return `
      <!-- Top-Left Corner -->
      <div class="cut-line-vector" style="left: 0; top: -${offsetPx + markLengthPx}px; width: 1px; height: ${markLengthPx}px;"></div>
      <div class="cut-line-vector" style="left: -${offsetPx + markLengthPx}px; top: 0; width: ${markLengthPx}px; height: 1px;"></div>

      <!-- Top-Right Corner -->
      <div class="cut-line-vector" style="right: 0; top: -${offsetPx + markLengthPx}px; width: 1px; height: ${markLengthPx}px;"></div>
      <div class="cut-line-vector" style="right: -${offsetPx + markLengthPx}px; top: 0; width: ${markLengthPx}px; height: 1px;"></div>

      <!-- Bottom-Left Corner -->
      <div class="cut-line-vector" style="left: 0; bottom: -${offsetPx + markLengthPx}px; width: 1px; height: ${markLengthPx}px;"></div>
      <div class="cut-line-vector" style="left: -${offsetPx + markLengthPx}px; bottom: 0; width: ${markLengthPx}px; height: 1px;"></div>

      <!-- Bottom-Right Corner -->
      <div class="cut-line-vector" style="right: 0; bottom: -${offsetPx + markLengthPx}px; width: 1px; height: ${markLengthPx}px;"></div>
      <div class="cut-line-vector" style="right: -${offsetPx + markLengthPx}px; bottom: 0; width: ${markLengthPx}px; height: 1px;"></div>
    `;
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-canvas-state">
        <div class="empty-state-graphic">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <h3 class="empty-state-title">Cetak Foto 2R di Kertas A4</h3>
        <p class="empty-state-desc">
          Upload foto Anda di panel sebelah kiri atau klik tombol sampel. Sistem akan otomatis menyusunnya ke dalam lembar A4 dengan ukuran fisik 2R yang presisi.
        </p>
        <button class="btn btn-primary" id="btn-empty-upload-trigger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Pilih & Upload Foto</span>
        </button>
      </div>
    `;

    const btn = this.container.querySelector('#btn-empty-upload-trigger');
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('file-input')?.click();
      });
    }
  }

  bindEvents() {
    const slots = this.container.querySelectorAll('.preview-slot');
    
    slots.forEach(el => {
      const isOccupied = el.classList.contains('is-occupied');
      const slotIndex = parseInt(el.getAttribute('data-global-index'), 10);

      if (isOccupied) {
        // Drag Start from occupied slot
        el.addEventListener('dragstart', (e) => {
          this.justDragged = true;
          this.draggedSlotPhotoId = el.getAttribute('data-photo-id');
          this.draggedSlotIndex = slotIndex;
          el.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', this.draggedSlotPhotoId);
        });

        // Click to edit crop/framing
        el.addEventListener('click', () => {
          if (this.justDragged) return;
          const photoId = el.getAttribute('data-photo-id');
          this.onSlotClick(photoId);
        });
      } else {
        // Click on empty slot to place/move photo here
        el.addEventListener('click', () => {
          if (this.justDragged) return;
          this.onEmptySlotClick(slotIndex);
        });
      }

      // Empty slot orientation toggle button
      const orientBtn = el.querySelector('.empty-slot-orient-btn');
      if (orientBtn) {
        orientBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onToggleOrientation();
        });
      }

      // Slot Quick Action: Toggle Frame Orientation on occupied slot
      const slotOrientBtn = el.querySelector('.btn-slot-orient-toggle');
      if (slotOrientBtn) {
        slotOrientBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onToggleOrientation();
        });
      }

      // Slot Quick Action: Toggle Crop Mode (Fullkan / Fit)
      const cropToggleBtn = el.querySelector('.btn-slot-crop-toggle');
      if (cropToggleBtn) {
        cropToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const photoId = cropToggleBtn.getAttribute('data-photo-id');
          this.onToggleCropMode(photoId);
        });
      }

      // Slot Quick Action: Rotate
      const rotateBtn = el.querySelector('.btn-slot-rotate');
      if (rotateBtn) {
        rotateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const photoId = rotateBtn.getAttribute('data-photo-id');
          this.onPhotoRotate(photoId);
        });
      }

      // Drag End
      el.addEventListener('dragend', () => {
        el.classList.remove('is-dragging');
        slots.forEach(s => s.classList.remove('is-drop-target'));
        setTimeout(() => {
          this.justDragged = false;
          this.draggedSlotPhotoId = null;
          this.draggedSlotIndex = null;
        }, 80);
      });

      // Drag Over (Can drop on any other slot, empty or occupied)
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.draggedSlotIndex !== null && this.draggedSlotIndex !== slotIndex) {
          el.classList.add('is-drop-target');
        }
      });

      // Drag Leave
      el.addEventListener('dragleave', () => {
        el.classList.remove('is-drop-target');
      });

      // Drop
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('is-drop-target');
        
        if (this.draggedSlotIndex === null || this.draggedSlotIndex === slotIndex) return;

        if (isOccupied) {
          // Drop on an occupied slot: swap photos
          const targetPhotoId = el.getAttribute('data-photo-id');
          if (this.draggedSlotPhotoId && this.draggedSlotPhotoId !== targetPhotoId) {
            this.onSwapSlots(this.draggedSlotPhotoId, targetPhotoId);
          }
        } else {
          // Drop on an empty slot: move photo to this empty slot
          if (this.draggedSlotPhotoId) {
            this.onMoveToSlot(this.draggedSlotPhotoId, slotIndex);
          }
        }
      });
    });
  }

  calculateAutoFitZoom() {
    if (!this.container || !this.layout) return 1.0;
    const viewport = this.container.closest('.canvas-viewport-container') || this.container.parentElement;
    if (!viewport) return 1.0;

    const containerWidth = viewport.clientWidth;
    if (!containerWidth || containerWidth <= 0) return 1.0;

    const paper = this.layout.paper;
    const baseWidthPx = paper.orientation === 'landscape' ? 760 : 560;
    const paddingBuffer = containerWidth <= 480 ? 20 : (containerWidth <= 768 ? 32 : 48);
    const availableWidth = Math.max(260, containerWidth - paddingBuffer);

    if (availableWidth < baseWidthPx) {
      return Math.max(0.35, Math.min(1.0, Number((availableWidth / baseWidthPx).toFixed(2))));
    }
    return 1.0;
  }

  fitToContainer() {
    this.zoomLevel = this.calculateAutoFitZoom();
    this.render();
  }

  setZoom(level) {
    if (level === 'fit') {
      this.fitToContainer();
      return;
    }
    this.zoomLevel = Math.max(0.35, Math.min(2.5, level));
    this.render();
  }
}

function slotDimensionsText(layout) {
  if (!layout) return '';
  return `${layout.slotDimensions.width}×${layout.slotDimensions.height}mm`;
}
