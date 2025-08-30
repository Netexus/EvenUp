// Complete Profile Management System - EvenUp
// File: js/profile.js

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.init();
    }

    async init() {
        this.checkAuthentication();
        await this.loadUserProfile();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = './login.html';
            return;
        }
    }

    async loadUserProfile() {
        try {
            const savedUserData = localStorage.getItem('user');
            
            if (savedUserData) {
                this.currentUser = JSON.parse(savedUserData);
                console.log('Data loaded from localStorage:', this.currentUser);
            } else {
                this.currentUser = this.extractDataFromHTML();
                console.log('Data extracted from HTML:', this.currentUser);
                this.saveUserData();
            }

            if (typeof window.Auth !== 'undefined' && window.Auth.getCurrentUser) {
                try {
                    const serverData = await window.Auth.getCurrentUser();
                    if (serverData && Object.keys(serverData).length > 0) {
                        this.currentUser = { ...this.currentUser, ...serverData };
                        this.saveUserData();
                        console.log('Data synchronized with server');
                    }
                } catch (error) {
                    console.log('Could not connect to server, using local data');
                }
            }
            
            this.populateProfileData();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Error loading profile', 'error');
        }
    }

    extractDataFromHTML() {
        const userData = {};
        
        const fieldMappings = {
            'Full Name': 'fullName',
            'Username': 'username', 
            'Email': 'email',
            'Phone Number': 'phoneNumber',
            'Birth Date': 'birthDate',
            'ID Number': 'idNumber',
            'Cédula': 'idNumber',
            'CC': 'idNumber',
            'Document ID': 'idNumber'
        };

        const profileItems = document.querySelectorAll('.profile-item');
        profileItems.forEach(item => {
            const labelElement = item.querySelector('.item-label');
            const valueElement = item.querySelector('.item-value');
            
            if (labelElement && valueElement) {
                const label = labelElement.textContent.trim();
                const value = valueElement.textContent.trim();
                
                if (fieldMappings[label] && value && value !== 'Enter your secure password') {
                    if (label === 'Birth Date') {
                        userData[fieldMappings[label]] = value;
                        userData.birthDateISO = this.convertToISO(value);
                    } else {
                        userData[fieldMappings[label]] = value;
                    }
                }
            }
        });

        userData.profilePicture = null;
        userData.password = null; 
        
        return userData;
    }

    convertToISO(dateString) {
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (error) {
            console.log('Error converting date:', error);
        }
        return null;
    }

    populateProfileData() {
        if (!this.currentUser) return;

        console.log('Populating interface with:', this.currentUser);

        this.updateProfilePictures();

        const hasStoredData = localStorage.getItem('user');
        if (hasStoredData) {
            this.updateField('Full Name', this.currentUser.fullName);
            this.updateField('Username', this.currentUser.username);
            this.updateField('Email', this.currentUser.email);
            this.updateField('Phone Number', this.currentUser.phoneNumber);
            this.updateField('Birth Date', this.currentUser.birthDate);
            if (this.currentUser.idNumber) {
                this.updateField('ID Number', this.currentUser.idNumber) ||
                this.updateField('Cédula', this.currentUser.idNumber) ||
                this.updateField('CC', this.currentUser.idNumber) ||
                this.updateField('Document ID', this.currentUser.idNumber);
            }
        }
    }

    updateProfilePictures() {
        const profileElements = document.querySelectorAll('.profile-picture, .user-avatar');
        
        profileElements.forEach(element => {
            if (this.currentUser.profilePicture) {
                element.innerHTML = `<img src="${this.currentUser.profilePicture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                const initial = this.currentUser.fullName ? 
                    this.currentUser.fullName.charAt(0).toUpperCase() : 'U';
                element.textContent = initial;
            }
        });
    }

    updateField(label, value) {
        if (!value) return;
        
        const profileItems = document.querySelectorAll('.profile-item');
        profileItems.forEach(item => {
            const labelElement = item.querySelector('.item-label');
            if (labelElement && labelElement.textContent.trim() === label) {
                const valueElement = item.querySelector('.item-value');
                if (valueElement) {
                    valueElement.textContent = value;
                }
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-button:not(.save-button):not(.cancel-button)');
            if (editButton && !this.isEditing) {
                const profileItem = editButton.closest('.profile-item');
                const label = profileItem.querySelector('.item-label').textContent.trim();
                this.editField(label, profileItem);
            }
        });

        const profilePicture = document.querySelector('.profile-picture');
        const cameraIcon = document.querySelector('.camera-icon');
        
        if (profilePicture) {
            profilePicture.addEventListener('click', () => this.uploadProfilePicture());
        }
        if (cameraIcon) {
            cameraIcon.addEventListener('click', () => this.uploadProfilePicture());
        }
    }

    editField(fieldName, profileItem) {
        if (this.isEditing) {
            console.log('Another field is already being edited');
            return;
        }
        
        this.isEditing = true;
        const valueElement = profileItem.querySelector('.item-value');
        const editButton = profileItem.querySelector('.edit-button');
        const currentValue = valueElement.textContent.trim();

        if (fieldName === 'Birth Date') {
            this.showNotification('Birth date cannot be edited', 'info');
            this.isEditing = false;
            return;
        }

        if (fieldName === 'ID Number' || fieldName === 'Cédula' || fieldName === 'CC' || fieldName === 'Document ID') {
            this.showNotification('ID number cannot be edited for security', 'info');
            this.isEditing = false;
            return;
        }

        const inputElement = this.createInputField(fieldName, currentValue);

        valueElement.style.display = 'none';
        valueElement.parentNode.appendChild(inputElement);

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'edit-actions';
        actionsContainer.style.cssText = 'display: flex; gap: 5px; margin-top: 5px;';

        const saveButton = document.createElement('button');
        saveButton.className = 'edit-button save-button';
        saveButton.innerHTML = '<i class="fas fa-check"></i>';
        saveButton.title = 'Save changes';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'edit-button cancel-button';
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        cancelButton.title = 'Cancel editing';

        actionsContainer.appendChild(saveButton);
        actionsContainer.appendChild(cancelButton);

        editButton.style.display = 'none';
        editButton.parentNode.appendChild(actionsContainer);

        inputElement.focus();
        if (fieldName !== 'Password') {
            inputElement.select();
        }

        const saveHandler = () => {
            const newValue = inputElement.value.trim();
            this.saveField(fieldName, newValue, profileItem);
        };

        const cancelHandler = () => {
            this.cancelEdit(profileItem, currentValue);
        };

        saveButton.addEventListener('click', saveHandler);
        cancelButton.addEventListener('click', cancelHandler);

        inputElement.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                saveHandler();
            } else if (e.key === 'Escape') {
                cancelHandler();
            }
        });
    }

    createInputField(fieldName, currentValue) {
        const input = document.createElement('input');
        
        switch (fieldName) {
            case 'Username':
                input.type = 'text';
                input.value = currentValue;
                input.placeholder = 'Username';
                input.pattern = '[a-zA-Z0-9_-]+';
                input.maxLength = 20;
                break;
                
            case 'Email':
                input.type = 'email';
                input.value = currentValue;
                input.placeholder = 'user@example.com';
                break;
                
            case 'Phone Number':
                input.type = 'tel';
                input.value = currentValue;
                input.placeholder = '+57 300 123 4567';
                input.pattern = '[+]?[0-9]{10,15}';
                input.maxLength = 20;
                break;
                
            case 'Password':
                input.type = 'password';
                input.value = '';
                input.placeholder = 'New password';
                input.minLength = 6;
                break;
                
            case 'Full Name':
                input.type = 'text';
                input.value = currentValue;
                input.placeholder = 'Full name';
                input.maxLength = 50;
                break;

            case 'Birth Date':
                input.type = 'Date';
                input.value = currentValue;
                input.placeholder = 'Birth Date';
                input.minLength = 15;
                break;
                
            default:
                input.type = 'text';
                input.value = currentValue;
        }

        input.className = 'profile-edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 10px;
            border: 2px solid #4DF7EC;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            background: var(--input-bg, white);
            color: var(--text-color, #333);
            box-sizing: border-box;
            transition: border-color 0.2s ease;
        `;

        return input;
    }

    async saveField(fieldName, newValue, profileItem) {
        if (!newValue && fieldName !== 'Password') {
            this.showNotification('This field cannot be empty', 'error');
            return;
        }

        if (!this.validateFieldFormat(fieldName, newValue)) {
            return; 
        }

        try {
            const fieldMapping = {
                'Full Name': 'fullName',
                'Username': 'username',
                'Email': 'email', 
                'Phone Number': 'phoneNumber',
                'Password': 'password',
                'ID Number': 'idNumber',
                'Cédula': 'idNumber',
                'CC': 'idNumber',
                'Document ID': 'idNumber'
            };

            const fieldKey = fieldMapping[fieldName];
            if (!fieldKey) {
                console.error('Unrecognized field:', fieldName);
                return;
            }

            const oldValue = this.currentUser[fieldKey];
            this.currentUser[fieldKey] = newValue;

            this.saveUserData();

            if (typeof window.Auth !== 'undefined' && window.Auth.updateUserProfile) {
                try {
                    await window.Auth.updateUserProfile({
                        [fieldKey]: newValue
                    });
                    console.log('Field updated on server:', fieldKey);
                } catch (serverError) {
                    console.log('Error synchronizing with server:', serverError);
                }
            }

            this.cancelEdit(profileItem, newValue);

            if (fieldKey === 'fullName') {
                this.updateProfilePictures();
            }

            this.showNotification(`${fieldName} updated successfully`, 'success');

        } catch (error) {
            console.error('Error saving field:', error);
            this.showNotification('Error saving changes', 'error');
        }
    }

    validateFieldFormat(fieldName, value) {
        switch (fieldName) {
            case 'Email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    this.showNotification('Please enter a valid email', 'error');
                    return false;
                }
                break;
                
            case 'Username':
                if (value.length < 3) {
                    this.showNotification('Username must be at least 3 characters', 'error');
                    return false;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    this.showNotification('Only letters, numbers, hyphens, and underscores are allowed', 'error');
                    return false;
                }
                break;
                
            case 'Password':
                if (value && value.length < 6) {
                    this.showNotification('Password must be at least 6 characters', 'error');
                    return false;
                }
                break;
                
            case 'Full Name':
                if (value.length < 2) {
                    this.showNotification('Name must be at least 2 characters', 'error');
                    return false;
                }
                break;

            case 'Phone Number':
                const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
                if (!/^[+]?[0-9]{10,15}$/.test(cleanPhone)) {
                    this.showNotification('Please enter a valid phone number (10-15 digits)', 'error');
                    return false;
                }
                break;
        }
        return true;
    }

    cancelEdit(profileItem, originalValue) {
        this.isEditing = false;
        
        const input = profileItem.querySelector('.profile-edit-input');
        const actionsContainer = profileItem.querySelector('.edit-actions');
        
        if (input) input.remove();
        if (actionsContainer) actionsContainer.remove();

        const valueElement = profileItem.querySelector('.item-value');
        const editButton = profileItem.querySelector('.edit-button:not(.save-button):not(.cancel-button)');

        if (valueElement) {
            valueElement.style.display = 'block';
            valueElement.textContent = originalValue;
        }
        
        if (editButton) {
            editButton.style.display = 'block';
        }
    }

    uploadProfilePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif,image/webp';
        input.style.display = 'none';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('Image cannot exceed 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentUser.profilePicture = e.target.result;
                this.saveUserData();
                this.updateProfilePictures();
                this.showNotification('Profile picture updated', 'success');
            };
            
            reader.onerror = () => {
                this.showNotification('Error loading image', 'error');
            };
            
            reader.readAsDataURL(file);
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    saveUserData() {
        try {
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            console.log('Data saved to localStorage:', this.currentUser);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving data locally', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const existing = document.getElementById('profile-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'profile-notification';
        notification.textContent = message;

        const colors = {
            success: '#10B981',
            error: '#EF4444', 
            info: '#3B82F6'
        };

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 16px 20px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 320px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

function editProfile() {
    console.log('editProfile function called from dropdown');
}

function editUsername() {
    const usernameItem = Array.from(document.querySelectorAll('.profile-item'))
        .find(item => item.querySelector('.item-label')?.textContent.trim() === 'Username');
    if (usernameItem && window.profileManager) {
        window.profileManager.editField('Username', usernameItem);
    }
}

function editEmail() {
    const emailItem = Array.from(document.querySelectorAll('.profile-item'))
        .find(item => item.querySelector('.item-label')?.textContent.trim() === 'Email');
    if (emailItem && window.profileManager) {
        window.profileManager.editField('Email', emailItem);
    }
}

function editPassword() {
    const passwordItem = Array.from(document.querySelectorAll('.profile-item'))
        .find(item => item.querySelector('.item-label')?.textContent.trim() === 'Password');
    if (passwordItem && window.profileManager) {
        window.profileManager.editField('Password', passwordItem);
    }
}

function editPhoneNumber() {
    const phoneItem = Array.from(document.querySelectorAll('.profile-item'))
        .find(item => item.querySelector('.item-label')?.textContent.trim() === 'Phone Number');
    if (phoneItem && window.profileManager) {
        window.profileManager.editField('Phone Number', phoneItem);
    }
}

function editIdNumber() {
    const idLabels = ['ID Number', 'Cédula', 'CC', 'Document ID'];
    let idItem = null;
    
    for (const label of idLabels) {
        idItem = Array.from(document.querySelectorAll('.profile-item'))
            .find(item => item.querySelector('.item-label')?.textContent.trim() === label);
        if (idItem) break;
    }
    
    if (idItem && window.profileManager) {
        const label = idItem.querySelector('.item-label').textContent.trim();
        window.profileManager.editField(label, idItem);
    }
}

function uploadProfilePicture() {
    if (window.profileManager) {
        window.profileManager.uploadProfilePicture();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProfileManager...');
    window.profileManager = new ProfileManager();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.profileManager) {
            window.profileManager = new ProfileManager();
        }
    });
} else {
    if (!window.profileManager) {
        window.profileManager = new ProfileManager();
    }
}

window.ProfileManager = ProfileManager;