/**
 * Physical size definitions and standards in millimeters (mm).
 */

export const PAPER_PRESETS = [
  {
    id: 'a4',
    name: 'A4',
    width: 210,
    height: 297,
    unit: 'mm',
    description: '210 × 297 mm (Standar Printer Rumah & Kantor)',
    isDefault: true
  },
  {
    id: 'a3',
    name: 'A3',
    width: 297,
    height: 420,
    unit: 'mm',
    description: '297 × 420 mm (Kertas Format Besar)',
    isDefault: false
  },
  {
    id: 'letter',
    name: 'US Letter',
    width: 215.9,
    height: 279.4,
    unit: 'mm',
    description: '8.5 × 11 inci (215.9 × 279.4 mm)',
    isDefault: false
  }
];

export const PHOTO_SIZE_PRESETS = [
  {
    id: '2r-std',
    code: '2R',
    name: '2R — 6 × 9 cm (Standar Lab Foto)',
    shortName: '2R (6 × 9 cm)',
    width: 60,
    height: 90,
    unit: 'mm',
    aspectRatio: 60 / 90,
    description: 'Ukuran 2R standar cetak foto Indonesia (60 × 90 mm). Muat 9 foto per lembar A4.',
    isDefault: true
  },
  {
    id: 'polaroid-2r',
    code: 'Polaroid 2R',
    name: 'Polaroid 2R — 6 × 9 cm (Frame Putih Retro)',
    shortName: 'Polaroid 2R (6 × 9 cm)',
    width: 60,
    height: 90,
    unit: 'mm',
    aspectRatio: 60 / 90,
    isPolaroid: true,
    polaroidPadding: { top: 6, left: 5, right: 5, bottom: 16 },
    description: 'Ukuran 2R (60 × 90 mm) dengan bingkai putih khas polaroid & space memo 16mm di bawah. Muat 9 foto per lembar A4.',
    isDefault: false
  },
  {
    id: 'polaroid-instax',
    code: 'Instax Mini',
    name: 'Polaroid Instax Mini — 5.4 × 8.6 cm',
    shortName: 'Instax Mini (5.4 × 8.6 cm)',
    width: 54,
    height: 86,
    unit: 'mm',
    aspectRatio: 54 / 86,
    isPolaroid: true,
    polaroidPadding: { top: 5, left: 4, right: 4, bottom: 15 },
    description: 'Ukuran format film Fujifilm Instax Mini (54 × 86 mm) dengan frame instan. Muat 9 foto per lembar A4.',
    isDefault: false
  },
  {
    id: '2r-intl',
    code: '2R-Intl',
    name: '2R — 2.5 × 3.5 inci (63.5 × 88.9 mm)',
    shortName: '2R (2.5 × 3.5")',
    width: 63.5,
    height: 88.9,
    unit: 'mm',
    aspectRatio: 63.5 / 88.9,
    description: 'Ukuran 2R standar internasional dompet / wallet size. Muat 9 foto per lembar A4.',
    isDefault: false
  },
  {
    id: '3r',
    code: '3R',
    name: '3R — 3.5 × 5 inci (88.9 × 127 mm)',
    shortName: '3R (8.9 × 12.7 cm)',
    width: 88.9,
    height: 127,
    unit: 'mm',
    aspectRatio: 88.9 / 127,
    description: 'Ukuran 3R standar album foto (muat 4 foto di A4).',
    isDefault: false
  },
  {
    id: '4r',
    code: '4R',
    name: '4R — 4 × 6 inci (101.6 × 152.4 mm)',
    shortName: '4R (10.2 × 15.2 cm)',
    width: 101.6,
    height: 152.4,
    unit: 'mm',
    aspectRatio: 101.6 / 152.4,
    description: 'Ukuran 4R standar kartu pos / bingkai foto meja (muat 2 foto di A4).',
    isDefault: false
  },
  {
    id: 'pas-3x4',
    code: '3x4',
    name: 'Pas Foto 3 × 4 cm (30 × 40 mm)',
    shortName: 'Pas Foto 3 × 4',
    width: 30,
    height: 40,
    unit: 'mm',
    aspectRatio: 30 / 40,
    description: 'Standar pas foto dokumen & ijazah.',
    isDefault: false
  },
  {
    id: 'pas-4x6',
    code: '4x6',
    name: 'Pas Foto 4 × 6 cm (40 × 60 mm)',
    shortName: 'Pas Foto 4 × 6',
    width: 40,
    height: 60,
    unit: 'mm',
    aspectRatio: 40 / 60,
    description: 'Standar pas foto lamaran & paspor.',
    isDefault: false
  }
];

export const DEFAULT_SETTINGS = {
  paperId: 'a4',
  paperOrientation: 'portrait', // 'portrait' | 'landscape'
  photoSizeId: '2r-std',
  photoOrientation: 'portrait', // 'portrait' | 'landscape' | 'auto'
  cropMode: 'cover', // 'cover' (fill frame) | 'fit' (show whole image with letterbox)
  gap: 2, // mm between photos
  margin: 5, // minimum printable margin in mm
  showCuttingGuides: true,
  cuttingGuideType: 'corner', // 'corner' (crop marks) | 'dashed' | 'border'
  cuttingGuideColor: '#94a3b8',
  autoOptimize: true // Center grid and balance margins
};
