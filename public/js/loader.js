class Loader {
    constructor() {
        this.createLoaderElement();
        this.bindEvents();
    }

    createLoaderElement() {
        // Create loader container
        this.loaderContainer = document.createElement('div');
        this.loaderContainer.className = 'loader-container hidden';

        // Create loader
        const loader = document.createElement('div');
        loader.className = 'loader';

        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loader-spinner';
        loader.appendChild(spinner);

        // Create progress ring
        const progress = document.createElement('div');
        progress.className = 'loader-progress';
        loader.appendChild(progress);

        // Create loading text
        const text = document.createElement('div');
        text.className = 'loader-text';
        text.textContent = 'Loading...';
        loader.appendChild(text);

        this.loaderContainer.appendChild(loader);
        document.body.appendChild(this.loaderContainer);
    }

    bindEvents() {
        // Listen for page transitions
        window.addEventListener('beforeunload', () => this.show());
        window.addEventListener('load', () => this.hide());

        // Listen for AJAX requests
        this.setupAjaxListener();
    }

    setupAjaxListener() {
        const originalXHR = window.XMLHttpRequest;
        let activeRequests = 0;

        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const loader = window.loader;

            xhr.addEventListener('loadstart', () => {
                activeRequests++;
                loader.show();
            });

            xhr.addEventListener('loadend', () => {
                activeRequests--;
                if (activeRequests === 0) {
                    loader.hide();
                }
            });

            return xhr;
        };
    }

    show(message = 'Loading...') {
        this.loaderContainer.querySelector('.loader-text').textContent = message;
        this.loaderContainer.classList.remove('hidden', 'fade-out');
    }

    hide() {
        this.loaderContainer.classList.add('fade-out');
        setTimeout(() => {
            this.loaderContainer.classList.add('hidden');
        }, 300);
    }

    setProgress(percent) {
        const text = this.loaderContainer.querySelector('.loader-text');
        text.textContent = `Loading... ${Math.round(percent)}%`;
    }

    setMessage(message) {
        const text = this.loaderContainer.querySelector('.loader-text');
        text.textContent = message;
    }
}

// Initialize loader
window.loader = new Loader();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Loader;
} 