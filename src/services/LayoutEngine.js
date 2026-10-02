/**
 * LayoutEngine: Deterministic layout calculation for physical print sizes.
 * All coordinates and dimensions are strictly in millimeters (mm).
 * Single source of truth for UI Preview, PDF Export, and Print Manager.
 */

import { PAPER_PRESETS, PHOTO_SIZE_PRESETS, DEFAULT_SETTINGS } from '../models/presets.js';

export class LayoutEngine {
  /**
   * Computes the complete multi-page layout based on photos and print settings.
   * 
   * @param {Array<Object>} photos - List of uploaded photo models
   * @param {Object} settings - Print settings
   * @returns {Object} Layout result with pages, slots, and stats
   */
  static computeLayout(photos = [], settings = {}) {
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    
    // 1. Resolve Paper preset and physical dimensions
    const paperPreset = PAPER_PRESETS.find(p => p.id === mergedSettings.paperId) || PAPER_PRESETS[0];
    const isPaperLandscape = mergedSettings.paperOrientation === 'landscape';
    const paperWidth = isPaperLandscape ? Math.max(paperPreset.width, paperPreset.height) : Math.min(paperPreset.width, paperPreset.height);
    const paperHeight = isPaperLandscape ? Math.min(paperPreset.width, paperPreset.height) : Math.max(paperPreset.width, paperPreset.height);

    // 2. Resolve Photo preset
    const photoPreset = PHOTO_SIZE_PRESETS.find(p => p.id === mergedSettings.photoSizeId) || PHOTO_SIZE_PRESETS[0];
    
    // Determine Slot Orientation
    let slotWidth = Math.min(photoPreset.width, photoPreset.height);
    let slotHeight = Math.max(photoPreset.width, photoPreset.height);

    if (mergedSettings.photoOrientation === 'landscape') {
      slotWidth = Math.max(photoPreset.width, photoPreset.height);
      slotHeight = Math.min(photoPreset.width, photoPreset.height);
    } else if (mergedSettings.photoOrientation === 'auto') {
      // If auto: check which orientation fits more photos or matches paper
      const portraitCols = Math.floor((paperWidth - 2 * mergedSettings.margin + mergedSettings.gap) / (slotWidth + mergedSettings.gap));
      const portraitRows = Math.floor((paperHeight - 2 * mergedSettings.margin + mergedSettings.gap) / (slotHeight + mergedSettings.gap));
      const portraitCap = Math.max(1, portraitCols) * Math.max(1, portraitRows);

      const landscapeSlotW = slotHeight;
      const landscapeSlotH = slotWidth;
      const landscapeCols = Math.floor((paperWidth - 2 * mergedSettings.margin + mergedSettings.gap) / (landscapeSlotW + mergedSettings.gap));
      const landscapeRows = Math.floor((paperHeight - 2 * mergedSettings.margin + mergedSettings.gap) / (landscapeSlotH + mergedSettings.gap));
      const landscapeCap = Math.max(1, landscapeCols) * Math.max(1, landscapeRows);

      if (landscapeCap > portraitCap) {
        slotWidth = landscapeSlotW;
        slotHeight = landscapeSlotH;
      }
    }

    const margin = Math.max(0, mergedSettings.margin);
    const gap = Math.max(0, mergedSettings.gap);

    // 3. Calculate grid dimensions
    const availWidth = Math.max(10, paperWidth - 2 * margin);
    const availHeight = Math.max(10, paperHeight - 2 * margin);

    const cols = Math.max(1, Math.floor((availWidth + gap) / (slotWidth + gap)));
    const rows = Math.max(1, Math.floor((availHeight + gap) / (slotHeight + gap)));
    const capacityPerPage = cols * rows;

    // Total width and height of the photo grid
    const gridWidth = cols * slotWidth + (cols - 1) * gap;
    const gridHeight = rows * slotHeight + (rows - 1) * gap;

    // Center grid on the page for clean balanced margins
    const startX = (paperWidth - gridWidth) / 2;
    const startY = (paperHeight - gridHeight) / 2;

    // 4. Flatten photo items by their quantity
    const photoInstances = [];
    photos.forEach(photo => {
      const qty = Math.max(1, photo.quantity || 1);
      for (let i = 0; i < qty; i++) {
        photoInstances.push({
          photo,
          instanceIndex: i
        });
      }
    });

    const totalPhotos = photoInstances.length;
    const totalPages = totalPhotos === 0 ? 1 : Math.ceil(totalPhotos / capacityPerPage);

    // 5. Generate pages and assign slots
    const pages = [];
    for (let p = 0; p < totalPages; p++) {
      const pageSlots = [];
      const startIdx = p * capacityPerPage;
      const endIdx = Math.min(startIdx + capacityPerPage, totalPhotos);

      // Create slots for the actual photos on this page
      for (let idx = startIdx; idx < endIdx; idx++) {
        const item = photoInstances[idx];
        const slotInPage = idx - startIdx;
        const col = slotInPage % cols;
        const row = Math.floor(slotInPage / cols);

        const x = Number((startX + col * (slotWidth + gap)).toFixed(2));
        const y = Number((startY + row * (slotHeight + gap)).toFixed(2));

        // Generate cutting guide coordinate geometry (corner marks & lines)
        const cutMarks = this.generateCutMarks(x, y, slotWidth, slotHeight, gap);

        pageSlots.push({
          id: `slot-${p}-${slotInPage}-${item.photo.id}`,
          pageIndex: p,
          slotIndex: slotInPage,
          globalIndex: idx,
          col,
          row,
          x,
          y,
          width: slotWidth,
          height: slotHeight,
          photo: item.photo,
          instanceIndex: item.instanceIndex,
          cropMode: item.photo.cropMode || mergedSettings.cropMode,
          rotation: item.photo.rotation || 0,
          cutMarks,
          isPolaroid: Boolean(photoPreset.isPolaroid),
          polaroidPadding: photoPreset.polaroidPadding || null
        });
      }

      pages.push({
        pageIndex: p,
        pageNumber: p + 1,
        width: paperWidth,
        height: paperHeight,
        cols,
        rows,
        capacity: capacityPerPage,
        photoCount: pageSlots.length,
        slots: pageSlots,
        // Guide lines across the entire page if requested
        gridGuideLines: this.generatePageGridLines(startX, startY, cols, rows, slotWidth, slotHeight, gap)
      });
    }

    // 6. Summary metrics
    const paperArea = paperWidth * paperHeight;
    const usedPhotoArea = totalPhotos > 0 ? (totalPhotos % capacityPerPage || capacityPerPage) * (slotWidth * slotHeight) : 0;
    const efficiency = Number(((usedPhotoArea / paperArea) * 100).toFixed(1));

    return {
      settings: mergedSettings,
      paper: {
        preset: paperPreset,
        width: paperWidth,
        height: paperHeight,
        orientation: isPaperLandscape ? 'landscape' : 'portrait'
      },
      photoPreset,
      slotDimensions: {
        width: slotWidth,
        height: slotHeight,
        orientation: slotWidth > slotHeight ? 'landscape' : 'portrait'
      },
      grid: {
        cols,
        rows,
        capacityPerPage,
        startX,
        startY,
        gridWidth,
        gridHeight,
        actualMarginLeft: startX,
        actualMarginTop: startY
      },
      totalPhotos,
      totalPages,
      pages,
      efficiency,
      summaryText: `${totalPhotos} foto dalam ${totalPages} halaman ${paperPreset.name} (${capacityPerPage} foto/lembar)`
    };
  }

  /**
   * Generates corner cut marks around a photo slot.
   * Mark length is 3mm in physical paper space.
   */
  static generateCutMarks(x, y, w, h, gap) {
    const markLength = 3; // 3mm mark
    const offset = gap > 0 ? Math.min(1.5, gap / 2) : 1; // Slight offset outside frame

    return {
      // Top-Left Corner
      topLeft: [
        { x1: x, y1: y - offset - markLength, x2: x, y2: y - offset }, // vertical
        { x1: x - offset - markLength, y1: y, x2: x - offset, y2: y }  // horizontal
      ],
      // Top-Right Corner
      topRight: [
        { x1: x + w, y1: y - offset - markLength, x2: x + w, y2: y - offset },
        { x1: x + w + offset, y1: y, x2: x + w + offset + markLength, y2: y }
      ],
      // Bottom-Left Corner
      bottomLeft: [
        { x1: x, y1: y + h + offset, x2: x, y2: y + h + offset + markLength },
        { x1: x - offset - markLength, y1: y + h, x2: x - offset, y2: y + h }
      ],
      // Bottom-Right Corner
      bottomRight: [
        { x1: x + w, y1: y + h + offset, x2: x + w, y2: y + h + offset + markLength },
        { x1: x + w + offset, y1: y + h, x2: x + w + offset + markLength, y2: y + h }
      ],
      // Rectangle boundary for dashed cutline
      rect: { x, y, width: w, height: h }
    };
  }

  /**
   * Generates grid cut lines passing between rows and columns.
   */
  static generatePageGridLines(startX, startY, cols, rows, slotW, slotH, gap) {
    const lines = [];
    const totalW = cols * slotW + (cols - 1) * gap;
    const totalH = rows * slotH + (rows - 1) * gap;

    // Vertical cut lines between columns
    for (let c = 1; c < cols; c++) {
      const lineX = startX + c * slotW + (c - 0.5) * gap;
      lines.push({
        type: 'vertical',
        x1: lineX,
        y1: Math.max(0, startY - 4),
        x2: lineX,
        y2: Math.min(startY + totalH + 4, startY + totalH + 4)
      });
    }

    // Horizontal cut lines between rows
    for (let r = 1; r < rows; r++) {
      const lineY = startY + r * slotH + (r - 0.5) * gap;
      lines.push({
        type: 'horizontal',
        x1: Math.max(0, startX - 4),
        y1: lineY,
        x2: startX + totalW + 4,
        y2: lineY
      });
    }

    return lines;
  }

  /**
   * Helper to compute crop coordinates for an image within a slot.
   * Preserves aspect ratio without distortion.
   */
  static computeImagePlacement(imgWidth, imgHeight, slotWidth, slotHeight, cropMode = 'cover', customCrop = null, rotation = 0) {
    // If the image is rotated by 90 or 270 deg, effective dimensions swap
    const isRotated90 = (rotation % 180) !== 0;
    const effectiveImgW = isRotated90 ? imgHeight : imgWidth;
    const effectiveImgH = isRotated90 ? imgWidth : imgHeight;

    const imgAspect = effectiveImgW / effectiveImgH;
    const slotAspect = slotWidth / slotHeight;

    let drawW, drawH, drawX, drawY;

    if (cropMode === 'cover') {
      // Fill the entire slot, crop excess
      if (imgAspect > slotAspect) {
        // Image is wider than slot: match height, crop sides
        drawH = slotHeight;
        drawW = slotHeight * imgAspect;
        drawY = 0;
        // Center crop or use custom crop offset (ratio -1 to 1)
        const offsetXRatio = customCrop?.offsetX ?? 0;
        const maxOverflow = drawW - slotWidth;
        drawX = -(maxOverflow / 2) + (offsetXRatio * (maxOverflow / 2));
      } else {
        // Image is taller than slot: match width, crop top/bottom
        drawW = slotWidth;
        drawH = slotWidth / imgAspect;
        drawX = 0;
        const offsetYRatio = customCrop?.offsetY ?? 0;
        const maxOverflow = drawH - slotHeight;
        drawY = -(maxOverflow / 2) + (offsetYRatio * (maxOverflow / 2));
      }
    } else {
      // 'fit': show entire image, leave clean white border if aspect differs
      if (imgAspect > slotAspect) {
        drawW = slotWidth;
        drawH = slotWidth / imgAspect;
        drawX = 0;
        drawY = (slotHeight - drawH) / 2;
      } else {
        drawH = slotHeight;
        drawW = slotHeight * imgAspect;
        drawX = (slotWidth - drawW) / 2;
        drawY = 0;
      }
    }

    return {
      drawX,
      drawY,
      drawWidth: drawW,
      drawHeight: drawH,
      slotWidth,
      slotHeight,
      isCropped: cropMode === 'cover' && Math.abs(imgAspect - slotAspect) > 0.01
    };
  }
}
