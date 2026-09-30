/**
 * UploadManager: Manages drag-and-drop, file picking, pasted images, and sample photo loader.
 */

export class UploadManager {
  constructor(options = {}) {
    this.onPhotosAdded = options.onPhotosAdded || (() => {});
    this.onError = options.onError || (() => {});
    this.init();
  }

  init() {
    this.fileInput = document.getElementById('file-input');
    this.dropzone = document.getElementById('upload-dropzone');
    this.sampleBtn = document.getElementById('btn-load-sample');

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    if (this.dropzone) {
      this.dropzone.addEventListener('click', () => this.fileInput?.click());

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.remove('drag-over');
        });
      });

      this.dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.processFiles(Array.from(files));
        }
      });
    }

    if (this.sampleBtn) {
      this.sampleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadSamplePhotos();
      });
    }

    // Support clipboard paste (Ctrl+V / Cmd+V)
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        this.processFiles(files);
      }
    });
  }

  handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
    // reset input so same file can be re-selected if removed
    e.target.value = '';
  }

  async processFiles(files) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/gif'];
    const newPhotos = [];

    for (const file of files) {
      if (!validImageTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp|heic|heif)$/i)) {
        this.onError(`Format file "${file.name}" tidak didukung. Harap gunakan JPG, PNG, atau WebP.`);
        continue;
      }

      try {
        const photoData = await this.readPhotoFile(file);
        newPhotos.push(photoData);
      } catch (err) {
        console.error('Gagal membaca file foto:', err);
        this.onError(`Gagal memproses "${file.name}". Silakan coba lagi.`);
      }
    }

    if (newPhotos.length > 0) {
      this.onPhotosAdded(newPhotos);
    }
  }

  readPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          sizeBytes: file.size,
          previewUrl,
          file,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          orientation: img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait',
          quantity: 1,
          rotation: 0,
          cropMode: 'cover',
          customCrop: { offsetX: 0, offsetY: 0, zoom: 1 }
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        reject(new Error('Gambar tidak dapat dimuat'));
      };
      img.src = previewUrl;
    });
  }

  async loadSamplePhotos() {
    const sampleUrls = [
      { url: '/samples/sample1.jpg', name: 'Potret-2R-Sampel-1.jpg', qty: 5 },
      { url: '/samples/sample2.jpg', name: 'Pemandangan-2R-Sampel-2.jpg', qty: 4 }
    ];

    const samplePhotos = [];
    for (const s of sampleUrls) {
      try {
        const photo = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: s.name,
              sizeBytes: 1024 * 350,
              previewUrl: s.url,
              file: null,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight,
              orientation: img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait',
              quantity: s.qty,
              rotation: 0,
              cropMode: 'cover',
              customCrop: { offsetX: 0, offsetY: 0, zoom: 1 }
            });
          };
          img.onerror = reject;
          img.src = s.url;
        });
        samplePhotos.push(photo);
      } catch (err) {
        console.warn('Could not load sample directly, falling back:', err);
      }
    }

    if (samplePhotos.length > 0) {
      this.onPhotosAdded(samplePhotos);
    }
  }
}
