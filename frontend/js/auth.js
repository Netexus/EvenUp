// API Configuration
const API_URL = 'http://localhost:3000/api';

// Utility functions
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

// Authentication functions
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await handleResponse(response);
        
        // Store the token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function register(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        return await handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login.html';
}

// User functions
async function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return await handleResponse(response);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

async function updateUserProfile(userData) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        return await handleResponse(response);
    } catch (error) {
        throw error;
    }
}

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    const publicPages = ['login.html', 'signup.html', 'index.html', ''];
    const currentPage = currentPath.split('/').pop() || '';
    const isPublicPage = publicPages.includes(currentPage);

    if (!token && !isPublicPage) {
        // Redirect to login if trying to access protected page without token
        window.location.href = './login.html';
    } else if (token && isPublicPage) {
        // Redirect to dashboard if already logged in
        window.location.href = './dashboard.html';
    }
}
// Archivo: js/auth.js

(function() {
    'use strict';

    // Asegúrate de que esta URL coincida con la de tu servidor Node.js
    const API_BASE_URL = 'http://localhost:3000';

    window.Auth = {
        async getCurrentUser() {
            try {
                // En un proyecto real, aquí se usaría un token para la autenticación
                const response = await fetch(`${API_BASE_URL}/api/profile`);
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                const userData = await response.json();
                console.log('Datos del servidor recibidos:', userData);
                return userData;
            } catch (error) {
                console.error('Error al obtener el perfil del usuario:', error);
                return null;
            }
        },

        async updateUserProfile(data) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error al actualizar el perfil del usuario:', error);
                return null;
            }
        }
    };
})();

// Export functions
window.Auth = {
    login,
    register,
    logout,
    getCurrentUser,
    updateUserProfile,
    checkAuth
};
