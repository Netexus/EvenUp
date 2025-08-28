const bcrypt = require('bcryptjs');
const pool = require('../config/database');

exports.register = async (req, res) => {
    try {
        const { email, fullName, username, password, birthDate, phoneNumber } = req.body;

        // Validar datos
        if (!email || !fullName || !username || !password || !birthDate || !phoneNumber) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            'SELECT * FROM app_users WHERE email = ? OR username = ? OR phone = ?',
            [email, username, phoneNumber]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, username or phone number already in use'
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar usuario
        const [result] = await pool.query(
            'INSERT INTO app_users (name, username, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)',
            [fullName, username, phoneNumber, email, hashedPassword]
        );

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                email,
                username,
                fullName
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error registering user'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar datos
        if (!username || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Username and password are required'
            });
        }

        // Buscar usuario
        const [users] = await pool.query(
            'SELECT * FROM app_users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Generar token (en una implementación real, usarías JWT aquí)
        const token = 'temp_token_' + Math.random().toString(36).slice(2);

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    fullName: user.name
                }
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error logging in'
        });
    }
};
