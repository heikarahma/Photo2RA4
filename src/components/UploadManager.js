/**
 * UploadManager: Manages drag-and-drop, file picking, pasted images, and sample photo loader.
 */

export class UploadManager {
  constructor(options = {}) {
    this.onPhotosAdded = options.onPhotosAdded || (() => {});
    this.onError = options.onError || (() => {});
    this.onInfo = options.onInfo || (() => {});
    this.watchedFileKeys = new Set();
    this.watchTimer = null;
    this.directoryHandle = null;
    this.init();
  }

  init() {
    this.fileInput = document.getElementById('file-input');
    this.dropzone = document.getElementById('upload-dropzone');
    this.sampleBtn = document.getElementById('btn-load-sample');
    this.watchFolderBtn = document.getElementById('btn-watch-folder');
    this.stopWatchFolderBtn = document.getElementById('btn-stop-watch-folder');
    this.tetherStatus = document.getElementById('tether-status');

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

    if (this.watchFolderBtn) {
      this.watchFolderBtn.addEventListener('click', () => this.startFolderWatch());
    }

    if (this.stopWatchFolderBtn) {
      this.stopWatchFolderBtn.addEventListener('click', () => this.stopFolderWatch());
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
    const newPhotos = [];

    for (const file of files) {
      if (!this.isSupportedImage(file)) {
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

  async startFolderWatch() {
    if (!('showDirectoryPicker' in window)) {
      this.onError('Browser ini belum mendukung pilih folder otomatis. Gunakan Chrome atau Edge terbaru.');
      return;
    }

    try {
      this.directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
      this.watchedFileKeys.clear();
      this.setTetherStatus(`Menghubungkan folder "${this.directoryHandle.name}"...`);

      const initialFiles = await this.collectSupportedFiles(this.directoryHandle);
      initialFiles.forEach(file => this.watchedFileKeys.add(this.getFileKey(file)));

      if (this.watchTimer) clearInterval(this.watchTimer);
      this.watchTimer = setInterval(() => this.scanWatchedFolder(), 2200);

      if (this.stopWatchFolderBtn) this.stopWatchFolderBtn.hidden = false;
      if (this.watchFolderBtn) this.watchFolderBtn.querySelector('span').textContent = 'Ganti Folder Kamera';

      this.setTetherStatus(`Terhubung ke "${this.directoryHandle.name}". Jepretan baru akan masuk otomatis.`);
      this.onInfo(`Auto Import aktif untuk folder "${this.directoryHandle.name}".`);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Gagal memilih folder kamera:', err);
        this.onError('Gagal menghubungkan folder kamera. Silakan coba lagi.');
      }
    }
  }

  stopFolderWatch() {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
    this.directoryHandle = null;
    this.watchedFileKeys.clear();

    if (this.stopWatchFolderBtn) this.stopWatchFolderBtn.hidden = true;
    if (this.watchFolderBtn) this.watchFolderBtn.querySelector('span').textContent = 'Pilih Folder Kamera';
    this.setTetherStatus('Auto Import berhenti. Pilih folder output kamera untuk menyambungkan lagi.');
    this.onInfo('Auto Import kamera dihentikan.');
  }

  async scanWatchedFolder() {
    if (!this.directoryHandle) return;

    try {
      const files = await this.collectSupportedFiles(this.directoryHandle);
      const newFiles = files.filter(file => {
        const key = this.getFileKey(file);
        if (this.watchedFileKeys.has(key)) return false;
        this.watchedFileKeys.add(key);
        return true;
      });

      if (newFiles.length > 0) {
        await this.processFiles(newFiles);
        this.setTetherStatus(`${newFiles.length} foto baru diimpor otomatis dari "${this.directoryHandle.name}".`);
      }
    } catch (err) {
      console.error('Gagal membaca folder kamera:', err);
      this.stopFolderWatch();
      this.onError('Akses folder kamera terputus. Pilih folder lagi untuk melanjutkan.');
    }
  }

  async collectSupportedFiles(directoryHandle) {
    const files = [];

    for await (const entry of directoryHandle.values()) {
      if (entry.kind !== 'file') continue;

      const file = await entry.getFile();
      if (this.isSupportedImage(file)) {
        files.push(file);
      }
    }

    return files.sort((a, b) => a.lastModified - b.lastModified);
  }

  isSupportedImage(file) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/gif'];
    return validImageTypes.includes(file.type) || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|bmp|heic|heif)$/i));
  }

  getFileKey(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  setTetherStatus(message) {
    if (this.tetherStatus) this.tetherStatus.textContent = message;
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
