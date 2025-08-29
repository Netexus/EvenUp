const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

        // Insertar usuario (incluye birthdate requerido por el esquema)
        const [result] = await pool.query(
            'INSERT INTO app_users (name, username, phone, email, birthdate, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [fullName, username, phoneNumber, email, birthDate, hashedPassword]
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

        // Validate
        if (!username || !password) {
            return res.status(400).json({ status: 'error', message: 'Username and password are required' });
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM app_users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Sign JWT (2 days)
        const token = jwt.sign(
            { id: user.user_id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '2d' }
        );

        // Return top-level token and user
        return res.json({
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                fullName: user.name
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ status: 'error', message: 'Error logging in' });
    }
};
