# Photo2RA4 — 2R Photo to A4 Print Layout Generator

A specialized, high-precision web application that automatically arranges multiple **2R photos** onto **A4 paper** for printing with 100% physical dimension accuracy.

---

## ✨ Nilai Utama (Core Value)

> *"Upload foto Anda → Pilih jumlah cetak (copies) → Sistem otomatis menyusun foto 2R pada lembar A4 secara presisi → Verifikasi pratinjau → Unduh PDF siap cetak / Cetak langsung."*

Pengguna tidak perlu menghitung koordinat, margin, atau berapa foto yang muat di lembar A4 secara manual.

---

## 📐 Spesifikasi Dimensi Fisik

* **Ukuran Kertas Default:** A4 (210 mm × 297 mm)
* **Ukuran Foto Default:** 2R Standar Lab Foto (60 mm × 90 mm / 6 cm × 9 cm)
* **Ukuran Alternatif:** 2R Standar Internasional (63.5 mm × 88.9 mm / 2.5 × 3.5 inci)
* **Kapasitas Per Lembar A4:**
  * Grid: **3 Kolom × 3 Baris = 9 Foto per lembar A4**
  * Lebar total grid: $3 \times 60\text{ mm} + 2 \times 2\text{ mm (gap)} = 184\text{ mm}$ (Margin kiri/kanan seimbang: 13 mm)
  * Tinggi total grid: $3 \times 90\text{ mm} + 2 \times 2\text{ mm (gap)} = 274\text{ mm}$ (Margin atas/bawah seimbang: 11.5 mm)
* **Akurasi Cetak:** Menggunakan koordinat milimeter (mm) murni pada PDF (300 DPI) tanpa skala perkiraan piksel layar.

---

## 🚀 Fitur Unggulan

1. **Multi-Photo Upload & Drag-and-Drop:** Mendukung JPG, PNG, WebP, dan HEIC.
2. **Kontrol Salinan (Quantity Stepper):** Atur jumlah cetak per foto `[-] qty [+]`.
3. **Auto-Pagination Multi-Halaman:** Jika jumlah foto melebihi 9 lembar, otomatis dibuat halaman ke-2, ke-3, dst.
4. **Interactive A4 Canvas Preview:**
   * Pratinjau realistis lembar A4 dengan rasio aspek fisik sesungguhnya.
   * Tooltip dimensi fisik saat kursor diarahkan ke foto (`60 × 90 mm`).
   * Tombol zoom (*Fit*, *Perbesar*, *Perkecil*).
   * Navigasi halaman antar lembar A4.
5. **Garis Panduan Potong (Cutting Guides):**
   * *Tanda Sudut (Corner Marks)* presisi di pojok foto untuk memandu gunting/cutter.
   * Opsi *Garis Putus-Putus* atau *Garis Tepi*.
6. **Penyesuaian Aspek & Crop:**
   * Mode *Cover/Penuh* (mengisi bingkai 2R) atau *Fit/Muat* (menampilkan seluruh foto utuh).
   * Dialog penyesuaian posisi geser (*pan offset*) dan rotasi 90°.
7. **Peringatan Penting Pencetakan Fisik (Skala 100%):**
   * Edukasi jelas agar pengguna memilih **"Actual Size / 100%"** dan **menghindari "Fit to Page"** pada printer.
8. **Export PDF Presisi Tinggi (300 DPI):**
   * Menghasilkan berkas PDF dengan koordinat vektor milimeter presisi menggunakan `jsPDF`.
9. **Cetak Langsung Browser (Native Print):**
   * Mendukung `@media print` dengan aturan CSS page format A4 tanpa margin browser.
10. **Tombol Coba Foto Sampel:**
    * 1-klik untuk mencoba fitur dengan foto potret dan pemandangan siap pakai.

---

## 🛠️ Arsitektur Aplikasi

```
Photo2RA4/
├── index.html                     # Entry point HTML dengan semantic markup & accessible UX
├── package.json                   # Konfigurasi dependensi (Vite, jsPDF, canvas-confetti)
├── public/
│   └── samples/                   # Foto sampel potret & pemandangan
├── src/
│   ├── main.js                    # Controller aplikasi utama
│   ├── models/
│   │   └── presets.js             # Definisi standar dimensi fisik kertas & foto (mm)
│   ├── services/
│   │   ├── LayoutEngine.js        # Deterministic layout algorithm (mm-based, single source of truth)
│   │   ├── PDFGenerator.js        # jsPDF exporter dengan cutting guides & 300 DPI rendering
│   │   └── PrintManager.js        # Browser native print coordinator (@media print)
│   ├── components/
│   │   ├── UploadManager.js       # File dropzone, clipboard paste & sample loader
│   │   ├── PhotoGallery.js        # Daftar foto, stepper jumlah, rotasi, hapus
│   │   ├── PrintSettingsForm.js   # Konfigurasi ukuran, orientasi, cutting guides & progressive disclosure
│   │   ├── LayoutPreview.js       # Kanvas A4 interaktif berskala milimeter
│   │   ├── CropEditorModal.js     # Modal penyesuaian crop & posisi foto
│   │   ├── PrintWarningModal.js   # Modal panduan cetak skala 100%
│   │   └── RulerModal.js          # Modal verifikasi ukuran fisik 2R (60x90mm)
│   └── styles/
│       └── index.css              # Styling modern Vanilla CSS, dark mode studio aesthetic & print media
```

---

## 💻 Cara Menjalankan

```bash
# 1. Jalankan development server
npm run dev

# 2. Buka di browser
# Akses http://localhost:5174 (atau port yang ditampilkan di terminal)

# 3. Build untuk produksi
npm run build
```
