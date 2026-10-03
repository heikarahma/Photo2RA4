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
        if (!slot.photo) return;
        const rotation = slot.photo.rotation || 0;
        const cropMode = slot.cropMode;
        const objectFit = cropMode === 'fit' ? 'contain' : 'cover';

        const isPolaroid = Boolean(slot.isPolaroid && slot.polaroidPadding);
        let innerWrapperStyle = `position: absolute; inset: 0; overflow: hidden;`;
        let slotExtraStyle = '';

        let innerW = slot.width;
        let innerH = slot.height;

        if (isPolaroid) {
          const { top, left, right, bottom } = slot.polaroidPadding;
          slotExtraStyle = 'background: #ffffff; box-sizing: border-box;';
          innerWrapperStyle = `position: absolute; left: ${left}mm; top: ${top}mm; right: ${right}mm; bottom: ${bottom}mm; overflow: hidden; background: #000;`;
          innerW = slot.width - left - right;
          innerH = slot.height - top - bottom;
        }

        const isRotated90 = (rotation % 180) !== 0;
        let imgStyle = '';
        if (isRotated90) {
          imgStyle = `position: absolute; left: 50%; top: 50%; width: ${innerH}mm; height: ${innerW}mm; transform: translate(-50%, -50%) rotate(${rotation}deg); object-fit: ${objectFit};`;
        } else {
          imgStyle = `position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(${rotation}deg); object-fit: ${objectFit};`;
        }

        html += `
          <div class="physical-print-slot ${isPolaroid ? 'is-polaroid' : ''}" style="left: ${slot.x}mm; top: ${slot.y}mm; width: ${slot.width}mm; height: ${slot.height}mm; ${slotExtraStyle}">
            <div class="slot-image-wrapper" style="${innerWrapperStyle}">
              <img src="${slot.photo.previewUrl || slot.photo.url}" alt="" style="${imgStyle}" />
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
