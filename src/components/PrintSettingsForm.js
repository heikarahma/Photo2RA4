/**
 * PrintSettingsForm: Manages paper sizes, photo standards, cutting guides, and progressive disclosure for advanced settings.
 */

import { PAPER_PRESETS, PHOTO_SIZE_PRESETS, DEFAULT_SETTINGS } from '../models/presets.js';

export class PrintSettingsForm {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.settings = { ...DEFAULT_SETTINGS };
    this.onSettingsChange = options.onSettingsChange || (() => {});
    this.render();
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.render();
  }

  render() {
    if (!this.container) return;

    let html = `
      <div class="glass-card">
        <div class="card-header-bar">
          <div class="card-title">
            <span class="card-title-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </span>
            <span>Pengaturan Cetak</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Akurasi Fisik 100%</span>
        </div>

        <!-- Photo Size Selector -->
        <div class="form-group">
          <label class="form-label" for="setting-photo-size">Ukuran Foto</label>
          <select id="setting-photo-size" class="select-custom">
            ${PHOTO_SIZE_PRESETS.map(p => `
              <option value="${p.id}" ${p.id === this.settings.photoSizeId ? 'selected' : ''}>
                ${p.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Paper Size & Orientation -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
          <div>
            <label class="form-label" for="setting-paper-size">Kertas</label>
            <select id="setting-paper-size" class="select-custom">
              ${PAPER_PRESETS.map(p => `
                <option value="${p.id}" ${p.id === this.settings.paperId ? 'selected' : ''}>
                  ${p.name} (${p.width}×${p.height}mm)
                </option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="form-label">Orientasi Kertas</label>
            <div class="segmented-control" id="control-paper-orientation">
              <button type="button" class="segmented-btn ${this.settings.paperOrientation === 'portrait' ? 'active' : ''}" data-value="portrait">
                Tegak
              </button>
              <button type="button" class="segmented-btn ${this.settings.paperOrientation === 'landscape' ? 'active' : ''}" data-value="landscape">
                Mendatar
              </button>
            </div>
          </div>
        </div>

        <!-- Cutting Guide Toggle -->
        <div class="toggle-row">
          <div class="toggle-label-group">
            <span class="toggle-title">Garis Panduan Potong</span>
            <span class="toggle-desc">Tanda potong rapi di setiap foto</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-cutting-guides" ${this.settings.showCuttingGuides ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Guide Type Selector (visible when guides enabled) -->
        <div id="guide-style-group" class="form-group" style="margin-top: 0.5rem; display: ${this.settings.showCuttingGuides ? 'block' : 'none'};">
          <label class="form-label">Gaya Panduan Potong</label>
          <div class="segmented-control three-cols" id="control-guide-type">
            <button type="button" class="segmented-btn ${this.settings.cuttingGuideType === 'corner' ? 'active' : ''}" data-value="corner" title="Tanda sudut presisi tanpa garis di dalam foto">
              Sudut
            </button>
            <button type="button" class="segmented-btn ${this.settings.cuttingGuideType === 'dashed' ? 'active' : ''}" data-value="dashed" title="Garis putus-putus pembatas">
              Putus-putus
            </button>
            <button type="button" class="segmented-btn ${this.settings.cuttingGuideType === 'border' ? 'active' : ''}" data-value="border" title="Garis tipis tepi foto">
              Garis Tepi
            </button>
          </div>
        </div>

        <!-- Crop Mode -->
        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">Penyesuaian Aspek Foto</label>
          <div class="segmented-control" id="control-crop-mode">
            <button type="button" class="segmented-btn ${this.settings.cropMode === 'cover' ? 'active' : ''}" data-value="cover" title="Foto mengisi seluruh bingkai 2R (tanpa tepi putih)">
              Penuh / Cover
            </button>
            <button type="button" class="segmented-btn ${this.settings.cropMode === 'fit' ? 'active' : ''}" data-value="fit" title="Semua bagian foto terlihat utuh (mungkin ada sisa tepi putih)">
              Muat / Fit
            </button>
          </div>
        </div>

        <!-- Advanced Settings Accordion -->
        <button type="button" class="advanced-accordion-trigger" id="btn-toggle-advanced">
          <span>Pengaturan Lanjutan (Margin & Jarak)</span>
          <span id="accordion-arrow">▼</span>
        </button>

        <div class="advanced-accordion-content" id="advanced-settings-panel">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
            <div>
              <label class="form-label" for="setting-gap">Jarak Antar Foto (mm)</label>
              <input type="number" id="setting-gap" class="input-custom" min="0" max="20" step="0.5" value="${this.settings.gap}" />
            </div>
            <div>
              <label class="form-label" for="setting-margin">Margin Tepi Kertas (mm)</label>
              <input type="number" id="setting-margin" class="input-custom" min="0" max="30" step="0.5" value="${this.settings.margin}" />
            </div>
          </div>
          <p style="font-size:0.7rem; color:var(--text-dim); margin-top:0.5rem;">
            Default margin 5mm dan jarak 2mm memastikan cetakan foto aman dari batas cetak printer standar.
          </p>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Photo Size
    const photoSelect = this.container.querySelector('#setting-photo-size');
    if (photoSelect) {
      photoSelect.addEventListener('change', (e) => {
        this.settings.photoSizeId = e.target.value;
        this.onSettingsChange(this.settings);
      });
    }

    // Paper Size
    const paperSelect = this.container.querySelector('#setting-paper-size');
    if (paperSelect) {
      paperSelect.addEventListener('change', (e) => {
        this.settings.paperId = e.target.value;
        this.onSettingsChange(this.settings);
      });
    }

    // Paper Orientation
    this.container.querySelectorAll('#control-paper-orientation .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        this.settings.paperOrientation = val;
        this.render();
        this.onSettingsChange(this.settings);
      });
    });

    // Cutting Guides Toggle
    const cuttingToggle = this.container.querySelector('#setting-cutting-guides');
    if (cuttingToggle) {
      cuttingToggle.addEventListener('change', (e) => {
        this.settings.showCuttingGuides = e.target.checked;
        const styleGroup = this.container.querySelector('#guide-style-group');
        if (styleGroup) {
          styleGroup.style.display = this.settings.showCuttingGuides ? 'block' : 'none';
        }
        this.onSettingsChange(this.settings);
      });
    }

    // Cutting Guide Type
    this.container.querySelectorAll('#control-guide-type .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        this.settings.cuttingGuideType = val;
        this.container.querySelectorAll('#control-guide-type .segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onSettingsChange(this.settings);
      });
    });

    // Crop Mode
    this.container.querySelectorAll('#control-crop-mode .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        this.settings.cropMode = val;
        this.container.querySelectorAll('#control-crop-mode .segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onSettingsChange(this.settings);
      });
    });

    // Advanced Accordion
    const accordionBtn = this.container.querySelector('#btn-toggle-advanced');
    const accordionPanel = this.container.querySelector('#advanced-settings-panel');
    const accordionArrow = this.container.querySelector('#accordion-arrow');

    if (accordionBtn && accordionPanel) {
      accordionBtn.addEventListener('click', () => {
        const isOpen = accordionPanel.classList.toggle('open');
        if (accordionArrow) accordionArrow.textContent = isOpen ? '▲' : '▼';
      });
    }

    // Gap input
    const gapInput = this.container.querySelector('#setting-gap');
    if (gapInput) {
      gapInput.addEventListener('change', (e) => {
        this.settings.gap = parseFloat(e.target.value) || 0;
        this.onSettingsChange(this.settings);
      });
    }

    // Margin input
    const marginInput = this.container.querySelector('#setting-margin');
    if (marginInput) {
      marginInput.addEventListener('change', (e) => {
        this.settings.margin = parseFloat(e.target.value) || 0;
        this.onSettingsChange(this.settings);
      });
    }
  }
}
