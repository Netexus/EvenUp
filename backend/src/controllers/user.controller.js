const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Create a new user
exports.createUser = async (req, res) => {
    const { name, username, phone, email, password } = req.body;

    // Validate required fields
    if (!name || !username || !phone || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Check if user already exists
        const [existingUser] = await db.query(
            'SELECT user_id FROM app_users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                error: 'Email or username is already in use.' 
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO app_users (name, username, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)',
            [name, username, phone, email, password_hash]
        );

        res.status(201).json({
            user_id: result.insertId,
            name,
            username,
            email,
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            error: 'Error creating user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT user_id, name, username, email, phone, created_at 
            FROM app_users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ 
            error: 'Error getting users',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

//Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT user_id, name, username, email, phone, created_at FROM app_users WHERE user_id = ?',
            [req.params.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user[0]);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ 
            error: 'Error getting user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

//Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, username, phone, email, password } = req.body;

    try {
        // Check if user exists
        const [user] = await db.query('SELECT user_id FROM app_users WHERE user_id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if new email or username already exists
        if (email || username) {
            const [existing] = await db.query(
                'SELECT user_id FROM app_users WHERE (email = ? OR username = ?) AND user_id != ?',
                [email || '', username || '', id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ 
                    error: 'Email or username is already in use.' 
                });
            }
        }

        // Update only provided fields
        const updates = [];
        const params = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (username) { updates.push('username = ?'); params.push(username); }
        if (phone) { updates.push('phone = ?'); params.push(phone); }
        if (email) { updates.push('email = ?'); params.push(email); }
        
        // If new password is provided, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updates.push('password_hash = ?');
            params.push(password_hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        params.push(id);
        
        await db.query(
            `UPDATE app_users SET ${updates.join(', ')} WHERE user_id = ?`,
            params
        );

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            error: 'Error updating user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

//Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM app_users WHERE user_id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: 'Error deleting user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};