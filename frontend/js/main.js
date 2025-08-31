/**
 * Main JavaScript file for EvenUp
 * Handles theme management, navigation, forms, UI interactions, authentication, and PWA features.
 */

// ========================================
// AUTHENTICATION MANAGEMENT
// ========================================
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '/api';
const Auth = {
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();

            // Save token and user
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user)); // {id, username, email, fullName}
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    async register(formData) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        } finally {
            // Use replace to avoid going back to a protected page via history
            window.location.replace('./login.html');
        }
    },

    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }
};

// ========================================
// THEME MANAGEMENT
// ========================================

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
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#4DF7EC');
    }
}

// ========================================
// NAVIGATION MANAGEMENT
// ========================================

function initializeNavigation() {
    const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    if (navbarBurgers.length > 0) {
        navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target;
                const targetElement = document.getElementById(target);

                if (targetElement) {
                    el.classList.toggle('is-active');
                    targetElement.classList.toggle('is-active');
                }
            });
        });
    }
}

function initializeScrollEffects() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const isScrolled = window.scrollY > 50;

        if (isScrolled) {
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
}

function scrollToNext() {
    window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
    });
}

// ========================================
// AVATAR DROPDOWN MANAGEMENT
// ========================================

function toggleAvatarDropdown() {
    const dropdown = document.getElementById('avatarDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function editProfile() {
    const dropdown = document.getElementById('avatarDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    console.log('Edit profile clicked');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const avatar = document.querySelector('.user-avatar');
    const dropdown = document.getElementById('avatarDropdown');

    if (dropdown && avatar) {
        if (!avatar.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    }
});


// ========================================
// FORM MANAGEMENT
// ========================================

function initializeForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Basic validation
    if (username.length < 3) {
        showNotification('Username must be at least 3 characters long', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        await Auth.login(username, password);
        showNotification('Login successful!', 'success');
        window.location.href = './dashboard.html';
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        fullName: document.getElementById('fullName').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        birthDate: document.getElementById('birthDate').value,
        phoneNumber: document.getElementById('phoneNumber').value
    };

    // Validation
    if (!formData.email || !formData.fullName || !formData.username || !formData.password || !formData.birthDate || !formData.phoneNumber) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(formData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (formData.username.length < 3) {
        showNotification('Username must be at least 3 characters long', 'error');
        return;
    }

    if (formData.password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        await Auth.register(formData);
        showNotification('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1500);
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#ef4444' :
        type === 'success' ? '#10b981' : '#3b82f6';

    notification.innerHTML = `
        <div style="position: fixed; top: 100px; left: 50%; transform: translateX(-50%); 
                    background: ${bgColor}; color: white; padding: 15px 25px; 
                    border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                    z-index: 1003; font-weight: 600;">
            ${message}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 4000);
}

// ========================================
// PWA MANAGEMENT
// ========================================

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdatePrompt();
                                }
                            });
                        }
                    });
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
}

// PWA Install Prompt
let deferredPrompt;

function initializePWAPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
    });
}

function showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: linear-gradient(45deg, #4DF7EC, #3DD5D0); color: #1e293b; padding: 15px 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(77, 247, 236, 0.3); z-index: 1002; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong>Install EvenUp!</strong>
                <div style="font-size: 0.9rem; opacity: 0.8;">Get faster access from your home screen</div>
            </div>
            <div>
                <button id="install-btn" style="background: rgba(30, 41, 59, 0.1); border: none; padding: 8px 16px; border-radius: 8px; margin-right: 10px; font-weight: 600; cursor: pointer;">Install</button>
                <button id="dismiss-btn" style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;">×</button>
            </div>
        </div>
    `;

    document.body.appendChild(installBanner);

    // Install button click
    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const {
                outcome
            } = await deferredPrompt.userChoice;
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
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
        <div style="position: fixed; top: 80px; left: 20px; right: 20px; background: #3DD5D0; color: #1e293b; padding: 15px 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(61, 213, 208, 0.3); z-index: 1002; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong>New version available!</strong>
                <div style="font-size: 0.9rem; opacity: 0.8;">Update to get the latest features</div>
            </div>
            <div>
                <button id="update-btn" style="background: rgba(30, 41, 59, 0.1); border: none; padding: 8px 16px; border-radius: 8px; margin-right: 10px; font-weight: 600; cursor: pointer;">Update</button>
                <button id="update-dismiss-btn" style="background: none; border: none; font-size: 1.2rem; opacity: 0.7; cursor: pointer;">×</button>
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
// PROFILE MANAGEMENT
// ========================================

function loadProfileData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            console.error('No user data found in localStorage');
            return;
        }

        // Actualizar la interfaz con los datos del usuario
        if (document.getElementById('userFullName')) {
            document.getElementById('userFullName').textContent = user.fullName || 'Not set';
        }
        if (document.getElementById('userEmail')) {
            document.getElementById('userEmail').textContent = user.email || 'Not set';
        }
        if (document.getElementById('username')) {
            document.getElementById('username').textContent = user.username || 'Not set';
        }
        if (document.getElementById('userPhone')) {
            document.getElementById('userPhone').textContent = user.phoneNumber || 'Not set';
        }
        if (document.getElementById('userBirthDate')) {
            const birthDate = user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'Not set';
            document.getElementById('userBirthDate').textContent = birthDate;
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

function uploadProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profilePicture = document.querySelector('.profile-picture');
                if (profilePicture) {
                    profilePicture.innerHTML = `
                        <img src="${e.target.result}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" 
                             alt="Profile Picture">
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    input.click();
}

function editPassword() {
    const currentValue = document.querySelector('.profile-item .item-info .item-value').textContent;
    showEditModal('Password', 'password', currentValue);
}

function editEmail() {
    showEditModal('Email', 'email', 'user@example.com');
}

function editFullName() {
    showEditModal('Full Name', 'text', 'John Doe');
}

function editPhoneNumber() {
    showEditModal('Phone Number', 'tel', '+57 123 456 7890');
}

function editBirthDate() {
    showEditModal('Birth Date', 'date', '2001-11-09');
}

function editUsername() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const current = user.username || '';
        showEditModal('Username', 'text', current || 'username');
    } catch (e) {
        showEditModal('Username', 'text', '');
    }
}

function showEditModal(fieldName, inputType, currentValue) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); 
                    display: flex; align-items: center; justify-content: center; z-index: 1004;">
            <div style="background: var(--card-bg); padding: 30px; border-radius: 20px; 
                        width: 90%; max-width: 400px; backdrop-filter: blur(20px);">
                <h3 style="margin-bottom: 20px; color: var(--text-primary); 
                           font-size: 1.5rem; font-weight: 700;">Edit ${fieldName}</h3>
                <div style="margin-bottom: 20px;">
                    <input type="${inputType}" id="editInput" 
                           value="${inputType === 'password' ? '' : currentValue}" 
                           placeholder="${inputType === 'password' ? 'Enter new password' : currentValue}"
                           style="width: 100%; padding: 12px; border: 2px solid var(--input-border); 
                                  border-radius: 10px; background: var(--input-bg); 
                                  color: var(--text-primary); font-family: 'Lexend', sans-serif;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelEdit" style="padding: 10px 20px; border: 2px solid var(--primary-color); 
                                                   background: transparent; color: var(--primary-color); 
                                                   border-radius: 10px; font-weight: 600; cursor: pointer;">Cancel</button>
                    <button id="saveEdit" style="padding: 10px 20px; border: none; 
                                                 background: var(--primary-gradient); color: #1e293b; 
                                                 border-radius: 10px; font-weight: 600; cursor: pointer;">Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.getElementById('saveEdit').addEventListener('click', () => {
        const newValue = document.getElementById('editInput').value;
        if (newValue.trim()) {
            showNotification(`${fieldName} updated successfully!`, 'success');
            document.body.removeChild(modal);
        } else {
            showNotification('Please enter a valid value', 'error');
        }
    });

    setTimeout(() => {
        document.getElementById('editInput').focus();
    }, 100);
}

// ========================================
// AUTH GUARD & LOGOUT WIRING
// ========================================

function isProtectedPage() {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith('/dashboard.html') || path.endsWith('/profile.html');
}

function enforceAuthGuard() {
    if (isProtectedPage() && !Auth.isAuthenticated()) {
        window.location.href = './login.html';
    }
}

function wireLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeNavigation();
    initializeScrollEffects();
    initializeForms();
    registerServiceWorker();
    initializePWAPrompt();
    enforceAuthGuard();
    wireLogout();

    // Cargar datos del perfil si estamos en la página de perfil
    if (window.location.pathname.endsWith('profile.html')) {
        loadProfileData();
    }
});