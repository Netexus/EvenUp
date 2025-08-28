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
    if (!formData.email || !formData.fullName || !formData.username ||
        !formData.password || !formData.birthDate || !formData.phoneNumber) {
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
// PROFILE MANAGEMENT
// ========================================

function uploadProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

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
    showEditModal('Username', 'text', 'pegasso-admin');
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

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeNavigation();
    initializeScrollEffects();
    initializeForms();
});