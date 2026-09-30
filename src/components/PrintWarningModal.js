/**
 * PrintWarningModal: Shows the critical print verification checklist before browser printing.
 */

export class PrintWarningModal {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onProceed = options.onProceed || (() => {});
    this.onDownloadPdfInstead = options.onDownloadPdfInstead || (() => {});
    this.render();
  }

  open(layout) {
    this.layout = layout;
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

    const paperName = this.layout?.paper?.preset?.name || 'A4';
    const photoName = this.layout?.photoPreset?.name || '2R';

    this.container.innerHTML = `
      <div class="modal-overlay" id="print-modal-overlay">
        <div class="modal-dialog">
          
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.3rem;">🖨️</span>
              <h3 style="font-size:1.05rem; font-weight:700;">Panduan Cetak Penting (Skala 100%)</h3>
            </div>
            <button class="btn btn-subtle btn-sm" id="btn-close-print-modal">✕</button>
          </div>

          <div class="modal-body">
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Agar hasil cetakan memiliki ukuran fisik <b>2R yang tepat dan akurat</b>, pastikan pengaturan printer browser Anda dikonfigurasi sebagai berikut:
            </p>

            <!-- Checklist Box -->
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
              <div style="font-weight: 700; color: #6ee7b7; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>✓</span> WAJIB DIPILIH DI DIALOG PRINTER:
              </div>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.82rem; color: #ecfdf5;">
                <li>• <b>Ukuran Kertas:</b> ${paperName} (210 × 297 mm)</li>
                <li>• <b>Skala / Scale:</b> 100% atau "Ukuran Asli" / "Actual Size"</li>
                <li>• <b>Margin:</b> "None" atau "Tanpa Margin"</li>
              </ul>
            </div>

            <!-- Warning Box -->
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-weight: 700; color: #fca5a5; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>✕</span> JANGAN GUNAKAN OPSI INI:
              </div>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; color: #fee2e2;">
                <li>✕ "Fit to Printable Area" / "Sesuaikan dengan Area Cetak"</li>
                <li>✕ "Fit to Page" / "Muat ke Halaman"</li>
                <li>✕ "Shrink to Fit" / "Kecilkan agar Pas"</li>
              </ul>
              <div style="font-size: 0.72rem; color: #f87171; margin-top: 0.4rem;">
                *Opsi di atas akan mengecilkan foto dan membuat ukuran 2R tidak akurat.
              </div>
            </div>

            <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.08); border-radius: var(--radius-md); border: 1px solid rgba(59, 130, 246, 0.2); font-size: 0.78rem; color: #bfdbfe;">
              💡 <b>Tips Terbaik:</b> Kami sangat merekomendasikan opsi <b>"Download PDF"</b> karena format PDF menjamin ukuran vektor milimeter yang 100% terkunci saat dicetak di aplikasi pembaca PDF apa pun.
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-modal-dl-pdf">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Download PDF Saja</span>
            </button>
            <button class="btn btn-primary" id="btn-modal-proceed-print">
              <span>Buka Dialog Cetak Browser</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#btn-close-print-modal');
    const dlPdfBtn = this.container.querySelector('#btn-modal-dl-pdf');
    const proceedBtn = this.container.querySelector('#btn-modal-proceed-print');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    if (dlPdfBtn) {
      dlPdfBtn.addEventListener('click', () => {
        this.close();
        this.onDownloadPdfInstead();
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.close();
        this.onProceed();
      });
    }
  }
}
