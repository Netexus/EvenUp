// Sistema Completo de Gestión de Perfil
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.init();
    }

    async init() {
        // Verificar autenticación al cargar
        this.checkAuthentication();
        await this.loadUserProfile();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
            return;
        }
    }

    async loadUserProfile() {
        try {
            // Primero intentar obtener datos del servidor
            if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
                try {
                    this.currentUser = await Auth.getCurrentUser();
                } catch (error) {
                    console.log('Server request failed, using local data');
                }
            }
            
            // Si no hay datos del servidor, usar localStorage
            if (!this.currentUser) {
                const userData = localStorage.getItem('user');
                if (userData) {
                    this.currentUser = JSON.parse(userData);
                } else {
                    // Datos por defecto si no hay nada guardado
                    this.currentUser = {
                        fullName: 'John Doe',
                        username: 'pegasso-admin',
                        email: 'user@example.com',
                        phoneNumber: '+57 123 456 7890',
                        birthDate: '2001-11-09',
                        profilePicture: null
                    };
                    // Guardar datos por defecto
                    this.saveUserData();
                }
            }
            
            this.populateProfileData();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Error al cargar el perfil', 'error');
        }
    }

    populateProfileData() {
        if (!this.currentUser) return;

        // Actualizar avatar/inicial en navegación y perfil
        this.updateProfilePictures();

        // Actualizar campos del perfil
        this.updateField('Full Name', this.currentUser.fullName || 'No establecido');
        this.updateField('Username', this.currentUser.username || 'No establecido');
        this.updateField('Email', this.currentUser.email || 'No establecido');
        this.updateField('Phone Number', this.currentUser.phoneNumber || 'No establecido');
        this.updateField('Birth Date', this.formatDate(this.currentUser.birthDate) || 'No establecido');
    }

    updateProfilePictures() {
        const profilePictures = document.querySelectorAll('.profile-picture, .user-avatar');
        profilePictures.forEach(element => {
            if (this.currentUser.profilePicture) {
                element.innerHTML = `<img src="${this.currentUser.profilePicture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                // Mostrar inicial del nombre
                const initial = this.currentUser.fullName ? 
                    this.currentUser.fullName.charAt(0).toUpperCase() : 
                    'U';
                element.textContent = initial;
            }
        });
    }

    updateField(label, value) {
        const profileItems = document.querySelectorAll('.profile-item');
        profileItems.forEach(item => {
            const labelElement = item.querySelector('.item-label');
            if (labelElement && labelElement.textContent === label) {
                const valueElement = item.querySelector('.item-value');
                if (valueElement) {
                    valueElement.textContent = value;
                }
            }
        });
    }

    formatDate(dateString) {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString; // Devolver el string original si hay error
        }
    }

    setupEventListeners() {
        // Listeners para botones de editar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-button') && !e.target.closest('.save-button') && !e.target.closest('.cancel-button')) {
                const profileItem = e.target.closest('.profile-item');
                const label = profileItem.querySelector('.item-label').textContent;
                this.editField(label, profileItem);
            }
        });

        // Profile picture upload
        const profilePictureElements = document.querySelectorAll('.profile-picture, .camera-icon');
        profilePictureElements.forEach(element => {
            element.addEventListener('click', () => this.uploadProfilePicture());
        });
    }

    editField(fieldName, profileItem) {
        if (this.isEditing) return;
        
        this.isEditing = true;
        const valueElement = profileItem.querySelector('.item-value');
        const editButton = profileItem.querySelector('.edit-button');
        const currentValue = valueElement.textContent;

        // Crear campo de input
        const inputElement = this.createInputField(fieldName, currentValue);

        // Reemplazar valor con input
        valueElement.style.display = 'none';
        valueElement.parentNode.appendChild(inputElement);

        // Cambiar botón edit a save/cancel
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'edit-buttons-container';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';

        const saveButton = document.createElement('button');
        saveButton.className = 'edit-button save-button';
        saveButton.innerHTML = '<i class="fas fa-check"></i>';
        saveButton.title = 'Guardar';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'edit-button cancel-button';
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        cancelButton.title = 'Cancelar';

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);

        editButton.style.display = 'none';
        editButton.parentNode.appendChild(buttonContainer);

        // Enfocar input
        inputElement.focus();
        if (fieldName !== 'Password') {
            inputElement.select();
        }

        // Event listeners para save/cancel
        saveButton.addEventListener('click', () => 
            this.saveField(fieldName, inputElement.value.trim(), profileItem)
        );
        
        cancelButton.addEventListener('click', () => 
            this.cancelEdit(profileItem, currentValue)
        );

        // Guardar con Enter, cancelar con Escape
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveField(fieldName, inputElement.value.trim(), profileItem);
            } else if (e.key === 'Escape') {
                this.cancelEdit(profileItem, currentValue);
            }
        });
    }

    createInputField(fieldName, currentValue) {
        let inputElement;
        
        switch (fieldName) {
            case 'Username':
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.placeholder = 'Ingresa nombre de usuario';
                inputElement.pattern = '[a-zA-Z0-9_-]+';
                break;
                
            case 'Email':
                inputElement = document.createElement('input');
                inputElement.type = 'email';
                inputElement.value = currentValue;
                inputElement.placeholder = 'Ingresa email';
                break;
                
            case 'Phone Number':
                inputElement = document.createElement('input');
                inputElement.type = 'tel';
                inputElement.value = currentValue;
                inputElement.placeholder = '+57 123 456 7890';
                break;
                
            case 'Password':
                inputElement = document.createElement('input');
                inputElement.type = 'password';
                inputElement.value = '';
                inputElement.placeholder = 'Nueva contraseña';
                break;
                
            case 'Full Name':
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.placeholder = 'Nombre completo';
                break;
                
            default:
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
        }

        inputElement.className = 'profile-edit-input';
        inputElement.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 2px solid #4DF7EC;
            border-radius: 4px;
            font-size: 14px;
            background: var(--bg-color, #fff);
            color: var(--text-color, #333);
        `;

        return inputElement;
    }

    async saveField(fieldName, newValue, profileItem) {
        if (!newValue && fieldName !== 'Password') {
            this.showNotification('El campo no puede estar vacío', 'error');
            return;
        }

        // Validaciones específicas
        if (!this.validateField(fieldName, newValue)) {
            return;
        }

        try {
            // Actualizar datos localmente
            const fieldMap = {
                'Full Name': 'fullName',
                'Username': 'username',
                'Email': 'email',
                'Phone Number': 'phoneNumber',
                'Password': 'password'
            };

            const fieldKey = fieldMap[fieldName];
            if (fieldKey) {
                this.currentUser[fieldKey] = newValue;
                
                // Guardar en localStorage
                this.saveUserData();

                // Intentar guardar en servidor si está disponible
                if (typeof Auth !== 'undefined' && Auth.updateUserProfile) {
                    try {
                        await Auth.updateUserProfile({
                            [fieldKey]: newValue
                        });
                        console.log('Datos guardados en servidor');
                    } catch (error) {
                        console.log('Error guardando en servidor, datos guardados localmente');
                    }
                }

                // Actualizar UI
                this.cancelEdit(profileItem, newValue);
                
                // Actualizar avatares si cambió el nombre
                if (fieldKey === 'fullName') {
                    this.updateProfilePictures();
                }

                this.showNotification('Campo actualizado correctamente', 'success');
            }

        } catch (error) {
            console.error('Error saving field:', error);
            this.showNotification('Error al guardar los cambios', 'error');
        }
    }

    validateField(fieldName, value) {
        switch (fieldName) {
            case 'Email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    this.showNotification('Email no válido', 'error');
                    return false;
                }
                break;
                
            case 'Username':
                if (value.length < 3) {
                    this.showNotification('El username debe tener al menos 3 caracteres', 'error');
                    return false;
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    this.showNotification('Username solo puede contener letras, números, guiones y guiones bajos', 'error');
                    return false;
                }
                break;
                
            case 'Password':
                if (value && value.length < 6) {
                    this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                    return false;
                }
                break;
        }
        return true;
    }

    cancelEdit(profileItem, originalValue) {
        this.isEditing = false;
        
        // Remover input y botones
        const input = profileItem.querySelector('.profile-edit-input');
        const buttonContainer = profileItem.querySelector('.edit-buttons-container');
        
        if (input) input.remove();
        if (buttonContainer) buttonContainer.remove();

        // Restaurar elementos originales
        const valueElement = profileItem.querySelector('.item-value');
        const editButton = profileItem.querySelector('.edit-button');

        valueElement.style.display = 'block';
        valueElement.textContent = originalValue;
        editButton.style.display = 'block';
    }

    uploadProfilePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentUser.profilePicture = e.target.result;
                    this.saveUserData();
                    this.updateProfilePictures();
                    this.showNotification('Foto de perfil actualizada', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    saveUserData() {
        try {
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            console.log('Datos de usuario guardados:', this.currentUser);
        } catch (error) {
            console.error('Error guardando datos del usuario:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Crear o reutilizar contenedor de notificación
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: opacity 0.3s ease;
            max-width: 300px;
        `;

        // Colores según tipo
        const colors = {
            success: '#4DF7EC',
            error: '#ff4444',
            info: '#44aaff'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.opacity = '1';

        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Funciones globales para compatibilidad con HTML
function editProfile() {
    // Esta función es llamada desde el dropdown del avatar
    console.log('Edit profile clicked');
}

function editUsername() {
    const usernameItem = document.querySelector('.profile-item .item-label[textContent="Username"]')?.closest('.profile-item');
    if (usernameItem && window.profileManager) {
        window.profileManager.editField('Username', usernameItem);
    }
}

function editEmail() {
    const emailItem = document.querySelector('.profile-item .item-label[textContent="Email"]')?.closest('.profile-item');
    if (emailItem && window.profileManager) {
        window.profileManager.editField('Email', emailItem);
    }
}

function editPassword() {
    const passwordItem = document.querySelector('.profile-item .item-label[textContent="Password"]')?.closest('.profile-item');
    if (passwordItem && window.profileManager) {
        window.profileManager.editField('Password', passwordItem);
    }
}

function editPhoneNumber() {
    const phoneItem = document.querySelector('.profile-item .item-label[textContent="Phone Number"]')?.closest('.profile-item');
    if (phoneItem && window.profileManager) {
        window.profileManager.editField('Phone Number', phoneItem);
    }
}

function uploadProfilePicture() {
    if (window.profileManager) {
        window.profileManager.uploadProfilePicture();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// Exportar para uso global
window.ProfileManager = ProfileManager;