// ========================================
// PROFILE PAGE FUNCTIONALITY
// ========================================

// Get current user from localStorage
function currentUser() {
    try { 
        return JSON.parse(localStorage.getItem('user') || '{}'); 
    } catch { 
        return {}; 
    }
}

let currentUserData = null;

// ========================================
// USER UTILITIES
// ========================================

// Get auth token
const authToken = () => localStorage.getItem('token') || '';

// API fetch utility
async function apiFetch(path, { method = 'GET', body } = {}) {
    const token = authToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    const config = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
    };
    
    const response = await fetch(`${window.API_BASE || 'http://localhost:3000'}${path}`, config);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    setupEventListeners();
});

// ========================================
// USER PROFILE LOADING
// ========================================

async function loadUserProfile() {
    try {
        const user = currentUser();
        if (!user || !user.id) {
            window.location.href = './login.html';
            return;
        }

        // Fetch full user data from backend
        const userData = await apiFetch(`/users/${user.id || user.user_id}`);
        currentUserData = userData;

        // Update UI elements
        document.getElementById('userFullName').textContent = userData.name || 'Not set';
        document.getElementById('username').textContent = userData.username || 'Not set';
        document.getElementById('userEmail').textContent = userData.email || 'Not set';
        document.getElementById('userPhone').textContent = userData.phone || 'Not set';
        
        // Format birth date
        if (userData.birthdate) {
            const date = new Date(userData.birthdate);
            document.getElementById('userBirthDate').textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            document.getElementById('userBirthDate').textContent = 'Not set';
        }

        // Update profile picture initial
        const profilePicture = document.querySelector('.profile-picture');
        if (profilePicture) {
            profilePicture.textContent = (userData.name || userData.username || 'U').substring(0, 1).toUpperCase();
        }

    } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

// ========================================
// EDIT FUNCTIONS
// ========================================

function editUsername() {
    showEditModal('username', 'Username', currentUserData.username, {
        placeholder: 'Enter new username',
        maxlength: 50,
        validation: (value) => {
            if (value.length < 3) return 'Username must be at least 3 characters';
            if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
            return null;
        }
    });
}

function editEmail() {
    showEditModal('email', 'Email Address', currentUserData.email, {
        placeholder: 'Enter new email',
        type: 'email',
        validation: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Please enter a valid email address';
            return null;
        }
    });
}

function editPhoneNumber() {
    showEditModal('phone', 'Phone Number', currentUserData.phone, {
        placeholder: 'Enter new phone number',
        type: 'tel',
        validation: (value) => {
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
            return null;
        }
    });
}

function editPassword() {
    showPasswordModal();
}


// ========================================
// MODAL FUNCTIONS
// ========================================

function showEditModal(field, title, currentValue, options = {}) {
    const modal = createEditModal(field, title, currentValue, options);
    document.body.appendChild(modal);
    modal.classList.add('is-active');
    
    // Focus input
    setTimeout(() => {
        const input = modal.querySelector('.modal-input');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

function createEditModal(field, title, currentValue, options) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = `edit${field}Modal`;
    
    modal.innerHTML = `
        <div class="modal-background" onclick="closeEditModal('${field}')"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Edit ${title}</p>
                <button class="delete" onclick="closeEditModal('${field}')"></button>
            </header>
            <section class="modal-card-body">
                <div class="field">
                    <label class="label">${title}</label>
                    <div class="control">
                        <input class="input modal-input" 
                               type="${options.type || 'text'}" 
                               placeholder="${options.placeholder || ''}"
                               value="${currentValue || ''}"
                               maxlength="${options.maxlength || 100}">
                    </div>
                    <p class="help error-message" style="display: none; color: #ff3860;"></p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-primary" onclick="saveField('${field}', '${title}')">Save Changes</button>
                <button class="button" onclick="closeEditModal('${field}')">Cancel</button>
            </footer>
        </div>
    `;
    
    // Add Enter key support
    const input = modal.querySelector('.modal-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveField(field, title);
        }
    });
    
    // Add real-time validation
    if (options.validation) {
        input.addEventListener('input', () => {
            const error = options.validation(input.value.trim());
            const errorMsg = modal.querySelector('.error-message');
            if (error) {
                errorMsg.textContent = error;
                errorMsg.style.display = 'block';
                input.classList.add('is-danger');
            } else {
                errorMsg.style.display = 'none';
                input.classList.remove('is-danger');
            }
        });
    }
    
    // Store validation function for save
    modal.validationFn = options.validation;
    
    return modal;
}

function showPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editPasswordModal';
    
    modal.innerHTML = `
        <div class="modal-background" onclick="closeEditModal('password')"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Change Password</p>
                <button class="delete" onclick="closeEditModal('password')"></button>
            </header>
            <section class="modal-card-body">
                <div class="field">
                    <label class="label">Current Password</label>
                    <div class="control">
                        <input class="input" type="password" id="currentPassword" placeholder="Enter current password">
                    </div>
                </div>
                <div class="field">
                    <label class="label">New Password</label>
                    <div class="control">
                        <input class="input" type="password" id="newPassword" placeholder="Enter new password">
                    </div>
                </div>
                <div class="field">
                    <label class="label">Confirm New Password</label>
                    <div class="control">
                        <input class="input" type="password" id="confirmPassword" placeholder="Confirm new password">
                    </div>
                    <p class="help error-message" style="display: none; color: #ff3860;"></p>
                </div>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-primary" onclick="savePassword()">Change Password</button>
                <button class="button" onclick="closeEditModal('password')">Cancel</button>
            </footer>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('is-active');
    
    // Focus first input
    setTimeout(() => {
        modal.querySelector('#currentPassword').focus();
    }, 100);
}

function closeEditModal(field) {
    const modal = document.getElementById(`edit${field}Modal`);
    if (modal) {
        modal.remove();
    }
}

// ========================================
// SAVE FUNCTIONS
// ========================================

async function saveField(field, title) {
    const modal = document.getElementById(`edit${field}Modal`);
    const input = modal.querySelector('.modal-input');
    const newValue = input.value.trim();
    
    if (!newValue) {
        showNotification(`${title} cannot be empty`, 'error');
        return;
    }
    
    // Run validation if exists
    if (modal.validationFn) {
        const error = modal.validationFn(newValue);
        if (error) {
            showNotification(error, 'error');
            return;
        }
    }
    
    if (newValue === currentUserData[field]) {
        closeEditModal(field);
        return;
    }
    
    try {
        const userId = currentUser().id || currentUser().user_id;
        await apiFetch(`/users/${userId}`, {
            method: 'PUT',
            body: { [field]: newValue }
        });
        
        // Update local data
        currentUserData[field] = newValue;
        
        // Update UI
        if (field === 'username') {
            document.getElementById('username').textContent = newValue;
        } else if (field === 'email') {
            document.getElementById('userEmail').textContent = newValue;
        } else if (field === 'phone') {
            document.getElementById('userPhone').textContent = newValue;
        }
        
        closeEditModal(field);
        showNotification(`${title} updated successfully!`, 'success');
        
    } catch (error) {
        showNotification(`Failed to update ${title.toLowerCase()}: ${error.message}`, 'error');
    }
}

async function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.querySelector('#editPasswordModal .error-message');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorMsg.textContent = 'All fields are required';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorMsg.textContent = 'New passwords do not match';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 6) {
        errorMsg.textContent = 'Password must be at least 6 characters';
        errorMsg.style.display = 'block';
        return;
    }
    
    try {
        const userId = currentUser().id || currentUser().user_id;
        await apiFetch(`/users/${userId}/password`, {
            method: 'PUT',
            body: { 
                currentPassword,
                newPassword 
            }
        });
        
        closeEditModal('password');
        showNotification('Password changed successfully!', 'success');
        
    } catch (error) {
        errorMsg.textContent = error.message || 'Failed to change password';
        errorMsg.style.display = 'block';
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
}


// ========================================
// UTILITY FUNCTIONS
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

// Expose functions globally
window.editUsername = editUsername;
window.editEmail = editEmail;
window.editPhoneNumber = editPhoneNumber;
window.editPassword = editPassword;
window.closeEditModal = closeEditModal;
window.saveField = saveField;
window.savePassword = savePassword;
