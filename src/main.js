/**
 * Main application coordinator: connects UI components, LayoutEngine, PDFGenerator, and PrintManager.
 */

import { LayoutEngine } from './services/LayoutEngine.js';
import { PDFGenerator } from './services/PDFGenerator.js';
import { PrintManager } from './services/PrintManager.js';
import { DEFAULT_SETTINGS } from './models/presets.js';

import { UploadManager } from './components/UploadManager.js';
import { PhotoGallery } from './components/PhotoGallery.js';
import { PrintSettingsForm } from './components/PrintSettingsForm.js';
import { LayoutPreview } from './components/LayoutPreview.js';
import { CropEditorModal } from './components/CropEditorModal.js';
import { PrintWarningModal } from './components/PrintWarningModal.js';
import { RulerModal } from './components/RulerModal.js';

import confetti from 'canvas-confetti';

class Photo2RA4App {
  constructor() {
    this.photos = [];
    this.settings = { ...DEFAULT_SETTINGS };
    this.layout = null;
    this.currentPageIndex = 0;
    this.zoomLevel = 1.0;

    this.init();
  }

  init() {
    // 1. Initialize Components
    this.photoGalleryContainer = document.getElementById('gallery-mount-point');
    this.previewContainer = document.getElementById('canvas-mount-point');
    this.settingsContainer = document.getElementById('settings-mount-point');
    this.modalsContainer = document.getElementById('modals-mount-point');

    this.gallery = new PhotoGallery(this.photoGalleryContainer, {
      onQuantityChange: (id, qty) => this.handleQuantityChange(id, qty),
      onPhotoDelete: (id) => this.handlePhotoDelete(id),
      onPhotoRotate: (id) => this.handlePhotoRotate(id),
      onPhotoEditCrop: (id) => this.handleOpenCrop(id),
      onClearAll: () => this.handleClearAll()
    });

    this.settingsForm = new PrintSettingsForm(this.settingsContainer, {
      onSettingsChange: (newSettings) => this.handleSettingsChange(newSettings)
    });

    this.preview = new LayoutPreview(this.previewContainer, {
      onSlotClick: (photoId) => this.handleOpenCrop(photoId),
      onPageChange: (pageIndex) => {
        this.currentPageIndex = pageIndex;
        this.updatePaginationUI();
      }
    });

    this.uploader = new UploadManager({
      onPhotosAdded: (newPhotos) => this.handlePhotosAdded(newPhotos),
      onError: (msg) => this.showToast(msg, 'error')
    });

    // Modals
    const cropModalMount = document.createElement('div');
    const printModalMount = document.createElement('div');
    const rulerModalMount = document.createElement('div');
    this.modalsContainer.appendChild(cropModalMount);
    this.modalsContainer.appendChild(printModalMount);
    this.modalsContainer.appendChild(rulerModalMount);

    this.cropModal = new CropEditorModal(cropModalMount, {
      onSave: (updatedPhoto) => this.handlePhotoUpdated(updatedPhoto)
    });

    this.printModal = new PrintWarningModal(printModalMount, {
      onProceed: () => {
        PrintManager.triggerBrowserPrint(this.layout);
      },
      onDownloadPdfInstead: () => {
        this.handleDownloadPDF();
      }
    });

    this.rulerModal = new RulerModal(rulerModalMount);

    // 2. Global UI Bindings
    this.bindGlobalActions();

    // 3. Initial Layout calculation
    this.recalculateLayout();
  }

  recalculateLayout() {
    this.layout = LayoutEngine.computeLayout(this.photos, this.settings);
    this.preview.setLayout(this.layout);
    this.updateStatsUI();
    this.updatePaginationUI();
  }

  handlePhotosAdded(newPhotos) {
    this.photos = [...this.photos, ...newPhotos];
    this.gallery.setPhotos(this.photos);
    this.recalculateLayout();
    this.showToast(`${newPhotos.length} foto berhasil ditambahkan!`, 'success');
  }

  handleQuantityChange(id, qty) {
    const photo = this.photos.find(p => p.id === id);
    if (photo) {
      photo.quantity = qty;
      this.gallery.setPhotos(this.photos);
      this.recalculateLayout();
    }
  }

  handlePhotoDelete(id) {
    const photo = this.photos.find(p => p.id === id);
    if (photo && photo.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    this.photos = this.photos.filter(p => p.id !== id);
    this.gallery.setPhotos(this.photos);
    this.recalculateLayout();
    this.showToast('Foto dihapus.', 'info');
  }

  handlePhotoRotate(id) {
    const photo = this.photos.find(p => p.id === id);
    if (photo) {
      photo.rotation = ((photo.rotation || 0) + 90) % 360;
      this.gallery.setPhotos(this.photos);
      this.recalculateLayout();
    }
  }

  handleOpenCrop(id) {
    const photo = this.photos.find(p => p.id === id);
    if (photo) {
      this.cropModal.open(photo);
    }
  }

  handlePhotoUpdated(updatedPhoto) {
    const idx = this.photos.findIndex(p => p.id === updatedPhoto.id);
    if (idx !== -1) {
      this.photos[idx] = updatedPhoto;
      this.gallery.setPhotos(this.photos);
      this.recalculateLayout();
      this.showToast('Penyesuaian foto diperbarui!', 'success');
    }
  }

  handleClearAll() {
    this.photos.forEach(p => {
      if (p.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl);
    });
    this.photos = [];
    this.gallery.setPhotos(this.photos);
    this.recalculateLayout();
    this.showToast('Semua foto dibersihkan.', 'info');
  }

  handleSettingsChange(newSettings) {
    this.settings = { ...newSettings };
    this.recalculateLayout();
  }

  updateStatsUI() {
    const totalPhotosEl = document.getElementById('stat-total-photos');
    const totalPagesEl = document.getElementById('stat-total-pages');
    const photoSizeEl = document.getElementById('stat-photo-size');
    const paperNameEl = document.getElementById('stat-paper-name');
    const ctaDownloadBtn = document.getElementById('btn-download-pdf');
    const ctaPrintBtn = document.getElementById('btn-open-print-dialog');

    if (!this.layout) return;

    if (totalPhotosEl) totalPhotosEl.textContent = `${this.layout.totalPhotos} Foto`;
    if (totalPagesEl) totalPagesEl.textContent = `${this.layout.totalPages} Lembar ${this.layout.paper.preset.name}`;
    if (photoSizeEl) photoSizeEl.textContent = this.layout.photoPreset.shortName;
    if (paperNameEl) paperNameEl.textContent = `${this.layout.paper.width}×${this.layout.paper.height}mm`;

    const hasPhotos = this.layout.totalPhotos > 0;
    if (ctaDownloadBtn) {
      ctaDownloadBtn.disabled = !hasPhotos;
      ctaDownloadBtn.style.opacity = hasPhotos ? '1' : '0.5';
      ctaDownloadBtn.style.pointerEvents = hasPhotos ? 'auto' : 'none';
    }
    if (ctaPrintBtn) {
      ctaPrintBtn.disabled = !hasPhotos;
      ctaPrintBtn.style.opacity = hasPhotos ? '1' : '0.5';
      ctaPrintBtn.style.pointerEvents = hasPhotos ? 'auto' : 'none';
    }

    // Update Mobile specific indicators
    const mobilePhotoBadge = document.getElementById('mobile-tab-photo-badge');
    const mobilePageBadge = document.getElementById('mobile-tab-page-badge');
    const mobileJumpCard = document.getElementById('mobile-jump-preview-card');
    const mobileJumpText = document.getElementById('mobile-jump-preview-text');

    if (mobilePhotoBadge) mobilePhotoBadge.textContent = `${this.layout.totalPhotos}`;
    if (mobilePageBadge) mobilePageBadge.textContent = `${this.layout.totalPages} Hal`;
    if (mobileJumpCard) {
      mobileJumpCard.style.display = hasPhotos ? 'flex' : 'none';
      if (mobileJumpText) {
        mobileJumpText.textContent = `${this.layout.totalPhotos} foto (${this.layout.totalPages} lembar A4) siap dicetak.`;
      }
    }
  }

  updatePaginationUI() {
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    const label = document.getElementById('pagination-current-label');

    if (!this.layout) return;

    const total = this.layout.totalPages;
    const current = this.currentPageIndex + 1;

    if (label) label.textContent = `Halaman ${current} dari ${total}`;
    if (prevBtn) prevBtn.disabled = current <= 1;
    if (nextBtn) nextBtn.disabled = current >= total;
  }

  bindGlobalActions() {
    // Pagination buttons
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPageIndex > 0) {
          this.currentPageIndex--;
          this.preview.setPage(this.currentPageIndex);
          this.updatePaginationUI();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPageIndex < this.layout.totalPages - 1) {
          this.currentPageIndex++;
          this.preview.setPage(this.currentPageIndex);
          this.updatePaginationUI();
        }
      });
    }

    // Zoom buttons
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomFitBtn = document.getElementById('btn-zoom-fit');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoomLevel = Math.min(2.5, this.zoomLevel + 0.15);
        this.preview.setZoom(this.zoomLevel);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoomLevel = Math.max(0.4, this.zoomLevel - 0.15);
        this.preview.setZoom(this.zoomLevel);
      });
    }

    if (zoomFitBtn) {
      zoomFitBtn.addEventListener('click', () => {
        this.preview.setZoom('fit');
        this.zoomLevel = this.preview.zoomLevel;
      });
    }

    // Mobile View Switcher Tabs
    const tabEditorBtn = document.getElementById('tab-nav-editor');
    const tabPreviewBtn = document.getElementById('tab-nav-preview');
    const jumpToPreviewBtn = document.getElementById('btn-jump-to-preview');

    if (tabEditorBtn) {
      tabEditorBtn.addEventListener('click', () => this.switchMobileTab('editor'));
    }

    if (tabPreviewBtn) {
      tabPreviewBtn.addEventListener('click', () => this.switchMobileTab('preview'));
    }

    if (jumpToPreviewBtn) {
      jumpToPreviewBtn.addEventListener('click', () => this.switchMobileTab('preview'));
    }

    // Window Resize Handler for responsive canvas auto-fit
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 860) {
          const grid = document.getElementById('workspace-grid-container');
          grid?.classList.remove('view-mode-editor', 'view-mode-preview');
        } else {
          this.switchMobileTab(this.activeMobileTab || 'editor');
        }
        if (this.preview.fitToScreen) {
          this.preview.fitToContainer();
        }
      }, 150);
    });

    // Download PDF Action
    const dlPdfBtn = document.getElementById('btn-download-pdf');
    if (dlPdfBtn) {
      dlPdfBtn.addEventListener('click', () => this.handleDownloadPDF());
    }

    // Direct Browser Print Action
    const printBtn = document.getElementById('btn-open-print-dialog');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        if (!this.layout || this.layout.totalPhotos === 0) {
          this.showToast('Silakan upload foto terlebih dahulu.', 'warning');
          return;
        }
        this.printModal.open(this.layout);
      });
    }

    // Size Ruler Verification Modal
    const rulerBtn = document.getElementById('btn-verify-size');
    if (rulerBtn) {
      rulerBtn.addEventListener('click', () => {
        this.rulerModal.open();
      });
    }
  }

  switchMobileTab(tabName) {
    this.activeMobileTab = tabName;
    const grid = document.getElementById('workspace-grid-container');
    const tabEditor = document.getElementById('tab-nav-editor');
    const tabPreview = document.getElementById('tab-nav-preview');

    if (!grid) return;

    if (tabName === 'preview') {
      grid.classList.remove('view-mode-editor');
      grid.classList.add('view-mode-preview');
      tabEditor?.classList.remove('active');
      tabPreview?.classList.add('active');
      setTimeout(() => {
        this.preview.fitToContainer();
      }, 60);
    } else {
      grid.classList.remove('view-mode-preview');
      grid.classList.add('view-mode-editor');
      tabPreview?.classList.remove('active');
      tabEditor?.classList.add('active');
    }
  }

  async handleDownloadPDF() {
    if (!this.layout || this.layout.totalPhotos === 0) {
      this.showToast('Upload foto terlebih dahulu untuk mengunduh PDF.', 'warning');
      return;
    }

    const progressOverlay = document.getElementById('pdf-progress-modal');
    const progressBar = document.getElementById('pdf-progress-bar');
    const progressStatus = document.getElementById('pdf-progress-status');

    if (progressOverlay) progressOverlay.classList.add('active');

    const filename = `Cetak-Foto-${this.layout.photoPreset.code}-${this.layout.totalPhotos}Foto-${Date.now().toString().slice(-4)}.pdf`;

    try {
      await PDFGenerator.generatePDF(this.layout, {
        filename,
        onProgress: ({ progress, message }) => {
          if (progressBar) progressBar.style.width = `${progress}%`;
          if (progressStatus) progressStatus.textContent = message;
        }
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      this.showToast('PDF berhasil diunduh! Siap dicetak pada skala 100%.', 'success');
    } catch (err) {
      console.error('PDF Generation failed:', err);
      this.showToast('Terjadi kendala saat membuat PDF. Silakan coba lagi.', 'error');
    } finally {
      setTimeout(() => {
        if (progressOverlay) progressOverlay.classList.remove('active');
      }, 500);
    }
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1e293b;
        color: #fff;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        border: 1px solid #334155;
        transition: all 250ms ease;
        transform: translateY(100px);
        opacity: 0;
      `;
      document.body.appendChild(toast);
    }

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.innerHTML = `
      <span style="color:${colors[type] || '#fff'}; font-weight:bold;">${icons[type] || ''}</span>
      <span>${message}</span>
    `;

    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3500);
  }
}

// Start app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new Photo2RA4App();
});
