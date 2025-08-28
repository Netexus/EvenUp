/**
 * PWA Functionality for EvenUp
 * Handles Service Worker management, installation prompts, and updates
 * This is the ONLY file that should handle PWA functionality to prevent duplicates
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstallBannerShown = false;
        this.isUpdateNotificationShown = false;
        this.init();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
        this.injectStyles();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.checkForUpdates();
        this.setupConnectionHandlers();
    }

    // ========================================
    // SERVICE WORKER MANAGEMENT
    // ========================================

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate(registration);
                });

                return registration;
            } catch (error) {
                console.error('Error registering Service Worker:', error);
            }
        }
    }

    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
            }
        });
    }

    // ========================================
    // INSTALLATION PROMPT MANAGEMENT
    // ========================================

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallBanner();
            this.showWelcomeMessage();
        });
    }

    showInstallBanner() {
        if (this.isInstallBannerShown || document.getElementById('pwa-install-banner')) {
            return;
        }

        this.isInstallBannerShown = true;

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-banner install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-text">
                    <div class="pwa-banner-title">
                        <i class="fas fa-mobile-alt"></i>
                        Install EvenUp!
                    </div>
                    <div class="pwa-banner-subtitle">
                        Get faster access from your home screen
                    </div>
                </div>
                <div class="pwa-banner-actions">
                    <button id="pwa-install-btn" class="pwa-btn primary">
                        <i class="fas fa-download"></i>
                        Install
                    </button>
                    <button id="pwa-dismiss-btn" class="pwa-btn secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('pwa-install-btn').onclick = () => this.installApp();
        document.getElementById('pwa-dismiss-btn').onclick = () => this.hideInstallBanner();

        setTimeout(() => this.hideInstallBanner(), 10000);
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`User response: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('User accepted PWA installation');
            } else {
                console.log('User dismissed PWA installation');
            }
        } catch (error) {
            console.error('Error during installation:', error);
        } finally {
            this.deferredPrompt = null;
            this.hideInstallBanner();
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.remove();
            this.isInstallBannerShown = false;
        }
    }

    // ========================================
    // UPDATE NOTIFICATION MANAGEMENT
    // ========================================

    showUpdateNotification() {
        if (this.isUpdateNotificationShown || document.getElementById('pwa-update-notification')) {
            return;
        }

        this.isUpdateNotificationShown = true;

        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.className = 'pwa-banner update-banner';
        notification.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-text">
                    <div class="pwa-banner-title">
                        <i class="fas fa-sync-alt"></i>
                        New version available
                    </div>
                    <div class="pwa-banner-subtitle">
                        Update to get the latest features
                    </div>
                </div>
                <div class="pwa-banner-actions">
                    <button id="pwa-update-btn" class="pwa-btn primary">
                        <i class="fas fa-redo"></i>
                        Update
                    </button>
                    <button id="pwa-update-dismiss-btn" class="pwa-btn secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        document.getElementById('pwa-update-btn').onclick = () => this.updateApp();
        document.getElementById('pwa-update-dismiss-btn').onclick = () => this.hideUpdateNotification();
    }

    updateApp() {
        window.location.reload();
    }

    hideUpdateNotification() {
        const notification = document.getElementById('pwa-update-notification');
        if (notification) {
            notification.remove();
            this.isUpdateNotificationShown = false;
        }
    }

    // ========================================
    // WELCOME MESSAGE
    // ========================================

    showWelcomeMessage() {
        const welcome = document.createElement('div');
        welcome.className = 'pwa-welcome-message';
        welcome.innerHTML = `
            <div class="pwa-welcome-content">
                <i class="fas fa-check-circle"></i>
                <h3>EvenUp installed successfully!</h3>
                <p>You can now access it from your home screen</p>
            </div>
        `;

        document.body.appendChild(welcome);

        setTimeout(() => welcome.remove(), 5000);
    }

    // ========================================
    // CONNECTION MANAGEMENT
    // ========================================

    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.update();
            }
        }
    }

    getConnectionStatus() {
        return {
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
        };
    }

    setupConnectionHandlers() {
        window.addEventListener('online', () => {
            console.log('Connection restored');
            this.showConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
            console.log('No connection - Offline mode');
            this.showConnectionStatus('offline');
        });
    }

    showConnectionStatus(status) {
        const statusBar = document.createElement('div');
        statusBar.className = `connection-status ${status}`;
        statusBar.innerHTML = status === 'online' 
            ? '<i class="fas fa-wifi"></i> Connection restored'
            : '<i class="fas fa-wifi-slash"></i> No connection - Offline mode';

        document.body.appendChild(statusBar);

        setTimeout(() => statusBar.remove(), 3000);
    }

    // ========================================
    // STYLES INJECTION
    // ========================================

    injectStyles() {
        const pwaStyles = `
            .pwa-banner {
                position: fixed;
                left: 20px;
                right: 20px;
                background: linear-gradient(45deg, #4DF7EC, #3DD5D0);
                color: #1e293b;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(77, 247, 236, 0.3);
                z-index: 1002;
                animation: slideInUp 0.3s ease-out;
            }

            .install-banner {
                bottom: 20px;
            }

            .update-banner {
                top: 100px;
                background: linear-gradient(45deg, #3DD5D0, #4DF7EC);
            }

            .pwa-banner-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
            }

            .pwa-banner-title {
                font-weight: 600;
                font-size: 1rem;
                margin-bottom: 4px;
            }

            .pwa-banner-title i {
                margin-right: 8px;
            }

            .pwa-banner-subtitle {
                font-size: 0.85rem;
                opacity: 0.8;
            }

            .pwa-banner-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .pwa-btn {
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .pwa-btn.primary {
                background: rgba(30, 41, 59, 0.1);
                color: #1e293b;
                padding: 8px 16px;
            }

            .pwa-btn.secondary {
                background: none;
                color: #1e293b;
                opacity: 0.7;
                padding: 8px;
                font-size: 1.1rem;
            }

            .pwa-btn:hover {
                transform: translateY(-2px);
                opacity: 1;
            }

            .pwa-welcome-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                text-align: center;
                z-index: 1003;
                animation: scaleIn 0.3s ease-out;
            }

            .pwa-welcome-content i {
                font-size: 3rem;
                color: #4DF7EC;
                margin-bottom: 15px;
            }

            .connection-status {
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 25px;
                color: white;
                font-weight: 600;
                z-index: 1002;
                animation: slideInDown 0.3s ease-out;
            }

            .connection-status.online {
                background: #10b981;
            }

            .connection-status.offline {
                background: #ef4444;
            }

            @keyframes slideInUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes slideInDown {
                from { transform: translate(-50%, -50px); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }

            @keyframes scaleIn {
                from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            @media (max-width: 768px) {
                .pwa-banner {
                    left: 10px;
                    right: 10px;
                }
                
                .pwa-banner-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 15px;
                }
                
                .pwa-banner-actions {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = pwaStyles;
        document.head.appendChild(styleSheet);
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

window.PWAManager = PWAManager;