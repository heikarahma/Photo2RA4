/**
 * RulerModal: Provides visual confirmation of 2R physical dimensions (60×90mm)
 * with a millimeter calibration guide and size verification diagram.
 */

export class RulerModal {
  constructor(containerElement) {
    this.container = containerElement;
    this.render();
  }

  open() {
    this.render();
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.add('active');
  }

  close() {
    const overlay = this.container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="modal-overlay" id="ruler-modal-overlay">
        <div class="modal-dialog">
          
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.3rem;">📐</span>
              <h3 style="font-size:1.05rem; font-weight:700;">Verifikasi Ukuran Fisik 2R</h3>
            </div>
            <button class="btn btn-subtle btn-sm" id="btn-close-ruler-modal">✕</button>
          </div>

          <div class="modal-body">
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Sistem <b>Photo2RA4</b> menggunakan koordinat fisik milimeter murni dalam PDF. Berikut spesifikasi pasti yang dicetak pada kertas A4:
            </p>

            <!-- Specification Cards -->
            <div class="ruler-spec-grid">
              <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem;">
                <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Ukuran 2R Standar</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #60a5fa; margin: 0.2rem 0;">60 × 90 mm</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">6.0 cm × 9.0 cm (Full Print)</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem;">
                <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Polaroid 2R (Retro)</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #f59e0b; margin: 0.2rem 0;">60 × 90 mm</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Bingkai Putih + Space Memo 16mm</div>
              </div>
            </div>

            <div class="ruler-capacity-card">
              <span style="font-size: 0.75rem; color: #a7f3d0;">Kapasitas Lembar A4 (210 × 297 mm):</span>
              <b style="font-size: 0.95rem; color: #34d399;">9 Foto / Lembar (Grid 3 × 3)</b>
            </div>

            <!-- Visual Graphic Representation -->
            <div class="ruler-visual-card">
              <div style="width: 180px; height: 270px; border: 2px dashed #3b82f6; background: #f8fafc; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                
                <div style="position: absolute; top: -18px; font-size: 11px; font-weight: 700; color: #1e40af; font-family: var(--font-mono);">
                  ← 60 mm (6 cm) →
                </div>
                
                <div style="position: absolute; right: -65px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 11px; font-weight: 700; color: #1e40af; font-family: var(--font-mono);">
                  ← 90 mm (9 cm) →
                </div>

                <div style="font-size: 2rem;">🖼️</div>
                <div style="font-weight: 800; font-size: 1rem; color: #1e293b;">Foto 2R</div>
                <div style="font-size: 0.75rem; color: #64748b;">Rasio 2 : 3</div>
                
                <!-- Corner Marks demo -->
                <div style="position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; border-top: 2px solid #000; border-left: 2px solid #000;"></div>
                <div style="position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-top: 2px solid #000; border-right: 2px solid #000;"></div>
                <div style="position: absolute; bottom: 4px; left: 4px; width: 8px; height: 8px; border-bottom: 2px solid #000; border-left: 2px solid #000;"></div>
                <div style="position: absolute; bottom: 4px; right: 4px; width: 8px; height: 8px; border-bottom: 2px solid #000; border-right: 2px solid #000;"></div>
              </div>

              <div style="margin-top: 1rem; font-size: 0.78rem; color: #475569; text-align: center;">
                Tanda sudut (corner marks) di keempat pojok memudahkan pengguntingan lurus dan rapi.
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" id="btn-close-ruler-btn" style="width: 100%;">
              Tutup & Mengerti
            </button>
          </div>

        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-ruler-modal');
    const closeBtn2 = this.container.querySelector('#btn-close-ruler-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (closeBtn2) closeBtn2.addEventListener('click', () => this.close());
  }
}
