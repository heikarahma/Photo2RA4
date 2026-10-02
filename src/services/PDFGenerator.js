/**
 * PDFGenerator: High-fidelity PDF generation using jsPDF with exact physical millimeter coordinates.
 * Generates vector cutting guides and pre-crops images at 300 DPI for ultra-sharp prints.
 */

import { jsPDF } from 'jspdf';
import { LayoutEngine } from './LayoutEngine.js';

export class PDFGenerator {
  /**
   * Generates and downloads the PDF for the calculated layout.
   * 
   * @param {Object} layout - Layout result from LayoutEngine
   * @param {Object} options - PDF options { onProgress, filename }
   */
  static async generatePDF(layout, options = {}) {
    const { onProgress = () => {}, filename = 'Foto-2R-Cetak-A4.pdf' } = options;
    const { paper, pages, settings } = layout;

    onProgress({ stage: 'init', progress: 5, message: 'Menyiapkan dokumen PDF...' });

    const doc = new jsPDF({
      orientation: paper.orientation,
      unit: 'mm',
      format: [paper.width, paper.height],
      compress: true
    });

    const totalPages = pages.length;

    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      if (pIdx > 0) {
        doc.addPage([paper.width, paper.height], paper.orientation);
      }

      const page = pages[pIdx];
      const pageProgressBase = 10 + (pIdx / totalPages) * 75;
      onProgress({ 
        stage: 'page', 
        progress: Math.round(pageProgressBase), 
        message: `Memproses halaman ${pIdx + 1} dari ${totalPages}...` 
      });

      // 1. Render all photos on this page
      for (let sIdx = 0; sIdx < page.slots.length; sIdx++) {
        const slot = page.slots[sIdx];
        const photo = slot.photo;

        try {
          const polaroidOptions = slot.isPolaroid && slot.polaroidPadding
            ? { isPolaroid: true, padding: slot.polaroidPadding }
            : null;

          // Render cropped & rotated high-res image to dataURL
          const highResDataUrl = await this.renderSlotImageToDataUrl(
            photo,
            slot.width,
            slot.height,
            slot.cropMode,
            polaroidOptions
          );
          
          doc.addImage(
            highResDataUrl,
            'JPEG',
            slot.x,
            slot.y,
            slot.width,
            slot.height,
            `img-${slot.id}`,
            'FAST'
          );
        } catch (err) {
          console.error(`Error rendering photo ${photo.id}:`, err);
          // Fallback: draw placeholder rectangle with text
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(245, 245, 245);
          doc.rect(slot.x, slot.y, slot.width, slot.height, 'FD');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('Foto Gagal Dimuat', slot.x + slot.width / 2, slot.y + slot.height / 2, { align: 'center' });
        }

        // Draw individual slot cutting guides
        if (settings.showCuttingGuides) {
          this.drawSlotCuttingGuides(doc, slot, settings.cuttingGuideType);
        }
      }

      // 2. Draw global grid cut lines if dashed guide lines are enabled
      if (settings.showCuttingGuides && settings.cuttingGuideType === 'dashed') {
        this.drawPageGridLines(doc, page.gridGuideLines);
      }

      // 3. Add unobtrusive footer verification watermark outside photo area
      this.drawPageFooter(doc, page, layout);
    }

    onProgress({ stage: 'saving', progress: 95, message: 'Menyimpan berkas PDF...' });

    // Save PDF
    doc.save(filename);

    onProgress({ stage: 'complete', progress: 100, message: 'PDF berhasil diunduh!' });
    return true;
  }

  /**
   * Renders the photo to an offscreen canvas at 300 DPI matching exact slot mm dimensions,
   * applying proper rotation and cropping (cover/fit).
   */
  static async renderSlotImageToDataUrl(photo, slotWidthMm, slotHeightMm, cropMode = 'cover', polaroidOptions = null) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // 300 DPI conversion: 1 inch = 25.4 mm => pixels = (mm / 25.4) * 300 = mm * 11.811
          const dpmm = 300 / 25.4; // ~11.81 pixels per mm
          const canvasW = Math.round(slotWidthMm * dpmm);
          const canvasH = Math.round(slotHeightMm * dpmm);

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d', { alpha: false });

          // Fill white background (standard photo paper base)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasW, canvasH);

          // Quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Handle per-photo rotation (0, 90, 180, 270)
          const rotation = photo.rotation || 0;
          const isRotated90 = (rotation % 180) !== 0;

          // Temporary canvas for rotation if needed
          let sourceImg = img;
          let srcW = img.naturalWidth || img.width;
          let srcH = img.naturalHeight || img.height;

          if (rotation !== 0) {
            const rotCanvas = document.createElement('canvas');
            rotCanvas.width = isRotated90 ? srcH : srcW;
            rotCanvas.height = isRotated90 ? srcW : srcH;
            const rotCtx = rotCanvas.getContext('2d');
            rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
            rotCtx.rotate((rotation * Math.PI) / 180);
            rotCtx.drawImage(img, -srcW / 2, -srcH / 2);
            sourceImg = rotCanvas;
            srcW = rotCanvas.width;
            srcH = rotCanvas.height;
          }

          // Target drawing rectangle inside the card
          let targetX = 0;
          let targetY = 0;
          let targetW = canvasW;
          let targetH = canvasH;

          if (polaroidOptions?.isPolaroid && polaroidOptions?.padding) {
            const pad = polaroidOptions.padding;
            targetX = Math.round(pad.left * dpmm);
            targetY = Math.round(pad.top * dpmm);
            targetW = Math.round((slotWidthMm - pad.left - pad.right) * dpmm);
            targetH = Math.round((slotHeightMm - pad.top - pad.bottom) * dpmm);

            // Dark photo base behind inner picture
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(targetX, targetY, targetW, targetH);
          }

          const placement = LayoutEngine.computeImagePlacement(
            srcW,
            srcH,
            targetW,
            targetH,
            cropMode,
            photo.customCrop,
            0 // already rotated above
          );

          if (polaroidOptions?.isPolaroid) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(targetX, targetY, targetW, targetH);
            ctx.clip();
            ctx.drawImage(
              sourceImg,
              targetX + placement.drawX,
              targetY + placement.drawY,
              placement.drawWidth,
              placement.drawHeight
            );
            // Subtle hairline around inner photo
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.lineWidth = Math.max(1, Math.round(0.12 * dpmm));
            ctx.strokeRect(targetX, targetY, targetW, targetH);
            ctx.restore();
          } else {
            ctx.drawImage(
              sourceImg,
              placement.drawX,
              placement.drawY,
              placement.drawWidth,
              placement.drawHeight
            );
          }

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = photo.previewUrl || photo.url;
    });
  }

  /**
   * Draws corner crop marks or hairline borders on the PDF.
   */
  static drawSlotCuttingGuides(doc, slot, guideType = 'corner') {
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.15); // Fine 0.15mm hairline

    if (guideType === 'border') {
      // Very light border directly around photo
      doc.setDrawColor(180, 180, 180);
      doc.rect(slot.x, slot.y, slot.width, slot.height, 'S');
      return;
    }

    if (guideType === 'dashed') {
      // Dashed border around photo
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.rect(slot.x, slot.y, slot.width, slot.height, 'S');
      doc.setLineDashPattern([], 0); // reset
      return;
    }

    // Default: 'corner' marks (clean cropticks outside image boundary)
    const { topLeft, topRight, bottomLeft, bottomRight } = slot.cutMarks;
    const allLines = [...topLeft, ...topRight, ...bottomLeft, ...bottomRight];

    allLines.forEach(line => {
      doc.line(line.x1, line.y1, line.x2, line.y2);
    });
  }

  /**
   * Draws dashed lines dividing the grid across the sheet.
   */
  static drawPageGridLines(doc, lines = []) {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([2, 2], 0);

    lines.forEach(l => {
      doc.line(l.x1, l.y1, l.x2, l.y2);
    });

    doc.setLineDashPattern([], 0);
  }

  /**
   * Subtle footer text with print verification details.
   */
  static drawPageFooter(doc, page, layout) {
    const { paper, photoPreset } = layout;
    doc.setFontSize(6.5);
    doc.setTextColor(140, 140, 140);
    const footerText = `Photo2RA4 • Cetak Skala 100% (Actual Size / Jangan Fit to Page) • ${photoPreset.name} • Hal ${page.pageNumber}/${layout.totalPages}`;
    doc.text(footerText, paper.width / 2, paper.height - 3.5, { align: 'center' });
  }
}
