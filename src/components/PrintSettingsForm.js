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

  renderSearchableSelect({ id, settingKey, options, getLabel, placeholder }) {
    const selected = options.find(option => option.id === this.settings[settingKey]) || options[0];

    return `
      <div class="search-select" data-setting-key="${settingKey}">
        <button
          type="button"
          class="search-select-trigger"
          id="${id}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span class="search-select-value">${this.escapeHtml(getLabel(selected))}</span>
          <span class="search-select-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </button>
        <div class="search-select-panel">
          <input
            type="search"
            class="search-select-input"
            placeholder="${this.escapeHtml(placeholder)}"
            aria-label="${this.escapeHtml(placeholder)}"
          />
          <div class="search-select-options" role="listbox" aria-labelledby="${id}">
            ${options.map(option => {
              const isSelected = option.id === selected.id;
              return `
                <button
                  type="button"
                  class="search-select-option ${isSelected ? 'selected' : ''}"
                  role="option"
                  aria-selected="${isSelected ? 'true' : 'false'}"
                  data-value="${this.escapeHtml(option.id)}"
                  data-search-text="${this.escapeHtml(getLabel(option).toLowerCase())}"
                >
                  <span>${this.escapeHtml(getLabel(option))}</span>
                  <span class="search-select-check" aria-hidden="true">✓</span>
                </button>
              `;
            }).join('')}
          </div>
          <div class="search-select-empty">Tidak ada pilihan yang cocok.</div>
        </div>
      </div>
    `;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  render() {
    if (!this.container) return;

    let html = `
      <div class="glass-card settings-card">
        <div class="card-header-bar settings-card-header">
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
          <span class="settings-accuracy-note">Akurasi Fisik 100%</span>
        </div>

        <!-- Photo Size Selector -->
        <div class="form-group">
          <label class="form-label" for="setting-photo-size">Ukuran Foto</label>
          ${this.renderSearchableSelect({
            id: 'setting-photo-size',
            settingKey: 'photoSizeId',
            options: PHOTO_SIZE_PRESETS,
            getLabel: preset => preset.name,
            placeholder: 'Cari ukuran foto...'
          })}
        </div>

        <!-- Paper Size & Orientation -->
        <div class="settings-two-col-grid">
          <div>
            <label class="form-label" for="setting-paper-size">Kertas</label>
            ${this.renderSearchableSelect({
              id: 'setting-paper-size',
              settingKey: 'paperId',
              options: PAPER_PRESETS,
              getLabel: preset => `${preset.name} (${preset.width}×${preset.height}mm)`,
              placeholder: 'Cari ukuran kertas...'
            })}
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
          <div class="advanced-settings-grid">
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
    this.bindSearchableSelects();

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

  bindSearchableSelects() {
    if (this.handleDocumentClick) {
      document.removeEventListener('click', this.handleDocumentClick);
    }

    const closeAllSelects = () => {
      this.container.querySelectorAll('.search-select.open').forEach(select => {
        select.classList.remove('open');
        select.querySelector('.search-select-trigger')?.setAttribute('aria-expanded', 'false');
      });
    };

    this.container.querySelectorAll('.search-select').forEach(select => {
      const trigger = select.querySelector('.search-select-trigger');
      const input = select.querySelector('.search-select-input');
      const options = Array.from(select.querySelectorAll('.search-select-option'));
      const emptyState = select.querySelector('.search-select-empty');
      const settingKey = select.getAttribute('data-setting-key');

      const filterOptions = () => {
        const query = (input?.value || '').trim().toLowerCase();
        let visibleCount = 0;

        options.forEach(option => {
          const matches = option.getAttribute('data-search-text')?.includes(query);
          option.hidden = !matches;
          if (matches) visibleCount++;
        });

        if (emptyState) emptyState.style.display = visibleCount ? 'none' : 'block';
      };

      trigger?.addEventListener('click', () => {
        const willOpen = !select.classList.contains('open');
        closeAllSelects();

        if (willOpen) {
          select.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          if (input) {
            input.value = '';
            filterOptions();
            setTimeout(() => input.focus(), 0);
          }
        }
      });

      input?.addEventListener('input', filterOptions);

      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeAllSelects();
          trigger?.focus();
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          options.find(option => !option.hidden)?.focus();
        }
      });

      options.forEach((option, index) => {
        option.addEventListener('click', () => {
          const value = option.getAttribute('data-value');
          if (settingKey && value) {
            this.settings[settingKey] = value;
            this.render();
            this.onSettingsChange(this.settings);
          }
        });

        option.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            closeAllSelects();
            trigger?.focus();
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const next = options.slice(index + 1).find(item => !item.hidden);
            next?.focus();
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            const previous = options.slice(0, index).reverse().find(item => !item.hidden);
            if (previous) previous.focus();
            else input?.focus();
          }
        });
      });
    });

    this.handleDocumentClick = (event) => {
      if (!this.container.contains(event.target)) {
        closeAllSelects();
      }
    };
    document.addEventListener('click', this.handleDocumentClick);
  }
}
