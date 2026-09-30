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
    this.onPageChange = options.onPageChange || (() => {});
  }

  setLayout(layout) {
    this.layout = layout;
    // ensure page index valid
    if (this.currentPage >= layout.totalPages) {
      this.currentPage = Math.max(0, layout.totalPages - 1);
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

    // Render Slots
    page.slots.forEach(slot => {
      const leftPx = slot.x * mmToPx;
      const topPx = slot.y * mmToPx;
      const widthPx = slot.width * mmToPx;
      const heightPx = slot.height * mmToPx;

      const rotation = slot.photo.rotation || 0;
      const isRotated90 = (rotation % 180) !== 0;
      const cropMode = slot.cropMode;
      const objectFit = cropMode === 'fit' ? 'contain' : 'cover';

      html += `
        <div class="preview-slot" 
             data-photo-id="${slot.photo.id}" 
             data-slot-id="${slot.id}"
             style="left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px;"
             title="Klik untuk sesuaikan crop / posisi foto">
          
          <div class="slot-inner-container">
            <img src="${slot.photo.previewUrl || slot.photo.url}" 
                 alt="${slot.photo.name}" 
                 style="transform: rotate(${rotation}deg); object-fit: ${objectFit}; width: 100%; height: 100%;" />
          </div>

          <!-- Hover Dimension Tooltip -->
          <div class="slot-dimension-badge">
            ${slot.width} × ${slot.height} mm (2R) • Klik Edit
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
    this.container.querySelectorAll('.preview-slot').forEach(el => {
      el.addEventListener('click', () => {
        const photoId = el.getAttribute('data-photo-id');
        this.onSlotClick(photoId);
      });
    });
  }

  setZoom(level) {
    this.zoomLevel = Math.max(0.5, Math.min(2.0, level));
    this.render();
  }
}

function slotDimensionsText(layout) {
  if (!layout) return '';
  return `${layout.slotDimensions.width}×${layout.slotDimensions.height}mm`;
}
