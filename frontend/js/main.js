// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update meta theme-color for PWA
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#4DF7EC');
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();

    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    if ($navbarBurgers.length > 0) {
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');
            });
        });
    }
});

// Smooth scroll function
function scrollToNext() {
    window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (window.scrollY > 50) {
        if (currentTheme === 'dark') {
            navbar.style.background = 'rgba(15, 23, 42, 0.98)';
            navbar.style.boxShadow = '0 2px 30px rgba(0,0,0,0.4)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 30px rgba(0,0,0,0.15)';
        }
    } else {
        if (currentTheme === 'dark') {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        }
    }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, show update prompt
                            showUpdatePrompt();
                        }
                    });
                });
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show custom install button
    showInstallPrompt();
});

function showInstallPrompt() {
    // Create install banner
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: linear-gradient(45deg, #4DF7EC, #3DD5D0); color: #1e293b; padding: 15px 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(77, 247, 236, 0.3); z-index: 1002; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong>Install EvenUp!</strong>
        <div style="font-size: 0.9rem; opacity: 0.8;">Get faster access from your home screen</div>
      </div>
      <div>
        <button id="install-btn" style="background: rgba(30, 41, 59, 0.1); border: none; padding: 8px 16px; border-radius: 8px; margin-right: 10px; font-weight: 600;">Install</button>
        <button id="dismiss-btn" style="background: none; border: none; font-size: 1.2rem; opacity: 0.7;">×</button>
      </div>
    </div>
  `;

    document.body.appendChild(installBanner);

    // Install button click
    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
        }
        document.body.removeChild(installBanner);
    });

    // Dismiss button click
    document.getElementById('dismiss-btn').addEventListener('click', () => {
        document.body.removeChild(installBanner);
    });
}

function showUpdatePrompt() {
    // Show update notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
    <div style="position: fixed; top: 80px; left: 20px; right: 20px; background: #3DD5D0; color: #1e293b; padding: 15px 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(61, 213, 208, 0.3); z-index: 1002; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong>New version available!</strong>
        <div style="font-size: 0.9rem; opacity: 0.8;">Update to get the latest features</div>
      </div>
      <div>
        <button id="update-btn" style="background: rgba(30, 41, 59, 0.1); border: none; padding: 8px 16px; border-radius: 8px; margin-right: 10px; font-weight: 600;">Update</button>
        <button id="update-dismiss-btn" style="background: none; border: none; font-size: 1.2rem; opacity: 0.7;">×</button>
      </div>
    </div>
  `;

    document.body.appendChild(updateBanner);

    // Update button click
    document.getElementById('update-btn').addEventListener('click', () => {
        window.location.reload();
    });

    // Dismiss button click
    document.getElementById('update-dismiss-btn').addEventListener('click', () => {
        document.body.removeChild(updateBanner);
    });
}