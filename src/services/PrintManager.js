/**
 * PrintManager: Coordinates browser printing and prints layout with exact physical mm sizing.
 */

export class PrintManager {
  /**
   * Prepares the print DOM container with exact mm coordinates and triggers window.print()
   * 
   * @param {Object} layout - Layout calculation result from LayoutEngine
   */
  static triggerBrowserPrint(layout) {
    let printContainer = document.getElementById('print-mount-point');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'print-mount-point';
      printContainer.className = 'print-mount-point';
      document.body.appendChild(printContainer);
    }

    const { paper, pages, settings } = layout;

    // Build print HTML
    let html = '';
    pages.forEach((page) => {
      html += `
        <div class="physical-print-page" style="width: ${paper.width}mm; height: ${paper.height}mm;">
      `;

      page.slots.forEach((slot) => {
        const rotation = slot.photo.rotation || 0;
        const cropMode = slot.cropMode;
        const objectFit = cropMode === 'fit' ? 'contain' : 'cover';

        html += `
          <div class="physical-print-slot" style="left: ${slot.x}mm; top: ${slot.y}mm; width: ${slot.width}mm; height: ${slot.height}mm;">
            <div class="slot-image-wrapper" style="transform: rotate(${rotation}deg); width: 100%; height: 100%;">
              <img src="${slot.photo.previewUrl || slot.photo.url}" alt="" style="object-fit: ${objectFit}; width: 100%; height: 100%;" />
            </div>
            ${settings.showCuttingGuides ? this.renderHtmlCuttingGuides(slot, settings.cuttingGuideType) : ''}
          </div>
        `;
      });

      // Page footer note
      html += `
        <div class="physical-print-footer" style="position: absolute; bottom: 3mm; left: 0; width: 100%; text-align: center; font-size: 7pt; color: #888;">
          Photo2RA4 • Cetak Skala 100% (Actual Size) • ${layout.photoPreset.name} • Hal ${page.pageNumber}/${layout.totalPages}
        </div>
      </div>`;
    });

    printContainer.innerHTML = html;

    // Allow browser to render images before invoking print dialog
    setTimeout(() => {
      window.print();
    }, 250);
  }

  static renderHtmlCuttingGuides(slot, type) {
    if (type === 'border') {
      return `<div class="html-guide-border" style="position: absolute; inset: 0; border: 0.15mm solid #cbd5e1; pointer-events: none;"></div>`;
    }
    if (type === 'dashed') {
      return `<div class="html-guide-dashed" style="position: absolute; inset: 0; border: 0.15mm dashed #94a3b8; pointer-events: none;"></div>`;
    }
    // Corner marks
    return `
      <div class="html-guide-corners" style="position: absolute; inset: -2mm; pointer-events: none;">
        <span class="corner tl" style="position: absolute; top: 0; left: 0; width: 2.5mm; height: 2.5mm; border-top: 0.2mm solid #64748b; border-left: 0.2mm solid #64748b;"></span>
        <span class="corner tr" style="position: absolute; top: 0; right: 0; width: 2.5mm; height: 2.5mm; border-top: 0.2mm solid #64748b; border-right: 0.2mm solid #64748b;"></span>
        <span class="corner bl" style="position: absolute; bottom: 0; left: 0; width: 2.5mm; height: 2.5mm; border-bottom: 0.2mm solid #64748b; border-left: 0.2mm solid #64748b;"></span>
        <span class="corner br" style="position: absolute; bottom: 0; right: 0; width: 2.5mm; height: 2.5mm; border-bottom: 0.2mm solid #64748b; border-right: 0.2mm solid #64748b;"></span>
      </div>
    `;
  }
}
