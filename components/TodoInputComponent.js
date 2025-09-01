/**
 * Todo Input UI Component
 * Handles todo input form and file upload functionality
 */

import { todoService } from '../services/TodoService.js';

export class TodoInputComponent {
    constructor(container) {
        this.container = container;
        this.elements = this.findElements();
        this.selectedFile = null;
        this.setupEventListeners();
        this.detectBrowser();
    }

    /**
     * Find DOM elements
     */
    findElements() {
        return {
            todoInput: document.getElementById('todoInput'),
            addBtn: document.getElementById('addBtn'),
            
            // File upload elements
            fileInput: document.getElementById('fileInput'),
            cameraInput: document.getElementById('cameraInput'),
            fileBtn: document.getElementById('fileBtn'),
            cameraBtn: document.getElementById('cameraBtn'),
            filePreview: document.getElementById('filePreview'),
            previewImg: document.getElementById('previewImg'),
            removeFileBtn: document.getElementById('removeFile'),
            fileName: document.getElementById('fileName')
        };
    }

    /**
     * Detect browser for compatibility handling
     */
    detectBrowser() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isChrome = /Chrome/.test(navigator.userAgent);
        this.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        this.isIOSChrome = this.isIOS && this.isChrome;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.addBtn.addEventListener('click', () => this.handleAddTodo());
        this.elements.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTodo();
            }
        });

        // File upload event listeners with iOS Chrome compatibility
        this.elements.fileBtn.addEventListener('click', (e) => this.triggerFileInput(e, 'gallery'));
        this.elements.fileBtn.addEventListener('touchstart', (e) => this.triggerFileInput(e, 'gallery'), { passive: true });
        this.elements.cameraBtn.addEventListener('click', (e) => this.triggerFileInput(e, 'camera'));
        this.elements.cameraBtn.addEventListener('touchstart', (e) => this.triggerFileInput(e, 'camera'), { passive: true });
        
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.cameraInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.removeFileBtn.addEventListener('click', () => this.removeFile());
    }

    /**
     * Handle add todo
     */
    async handleAddTodo() {
        const text = this.elements.todoInput.value.trim();
        if (!text) return;

        try {
            await todoService.addTodo(text, this.selectedFile);
            this.resetForm();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Trigger file input with browser-specific handling
     */
    triggerFileInput(event, mode = 'gallery') {
        // Prevent double firing
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log('Triggering file input:', { mode, browser: {
            isIOS: this.isIOS,
            isChrome: this.isChrome,
            isSafari: this.isSafari,
            isIOSChrome: this.isIOSChrome
        }});

        const inputToUse = mode === 'camera' ? this.elements.cameraInput : this.elements.fileInput;
        const includeCapture = mode === 'camera';

        try {
            if (this.isIOSChrome) {
                // iOS Chrome approach - create a temporary overlay
                console.log(`Using iOS Chrome ${mode} input method`);

                // Reset file input first
                inputToUse.value = '';

                // Create overlay approach
                const overlay = document.createElement('input');
                overlay.type = 'file';
                overlay.accept = 'image/*,image/heic,image/heif';
                if (includeCapture) {
                    overlay.capture = 'environment';
                }
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.opacity = '0';
                overlay.style.zIndex = '9999';

                overlay.addEventListener('change', (e) => {
                    this.handleFileSelect(e);
                    document.body.removeChild(overlay);
                });

                document.body.appendChild(overlay);
                overlay.click();

                // Cleanup after 5 seconds if no file selected
                setTimeout(() => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                }, 5000);

            } else {
                // Standard approach for Safari and other browsers
                console.log(`Using standard ${mode} input method`);
                inputToUse.value = '';
                inputToUse.click();
            }
        } catch (error) {
            console.error('Error triggering file input:', error);
            // Ultimate fallback
            inputToUse.value = '';
            inputToUse.click();
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('File selected:', file.name, file.type, file.size);

        // Validate file type (including HEIC for iOS)
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
        const isValidType = file.type.startsWith('image/') || validTypes.includes(file.type.toLowerCase());

        if (!isValidType) {
            alert('Please select an image file (JPG, PNG, GIF, WebP, HEIC).');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please choose a file smaller than 5MB.`);
            return;
        }

        this.selectedFile = file;
        this.showFilePreview(file);
    }

    /**
     * Show file preview
     */
    showFilePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.previewImg.src = e.target.result;
            this.elements.previewImg.style.display = 'block';
            this.elements.fileName.textContent = file.name;
            this.elements.filePreview.style.display = 'flex';
            console.log('Preview loaded successfully');
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Error reading the selected file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Remove selected file
     */
    removeFile() {
        this.selectedFile = null;
        this.elements.fileInput.value = '';
        this.elements.cameraInput.value = '';
        this.elements.filePreview.style.display = 'none';
        this.elements.previewImg.src = '';
        this.elements.fileName.textContent = '';
    }

    /**
     * Reset the form
     */
    resetForm() {
        this.elements.todoInput.value = '';
        this.removeFile();
    }

    /**
     * Set focus to input
     */
    focus() {
        this.elements.todoInput.focus();
    }

    /**
     * Get current input value
     */
    getValue() {
        return this.elements.todoInput.value.trim();
    }

    /**
     * Set input value
     */
    setValue(value) {
        this.elements.todoInput.value = value;
    }

    /**
     * Check if file is selected
     */
    hasFile() {
        return !!this.selectedFile;
    }

    /**
     * Get selected file
     */
    getFile() {
        return this.selectedFile;
    }
}