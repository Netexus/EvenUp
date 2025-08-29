const db = require('../config/database.js');

module.exports = {

    create: (userData, callback) => {
        const sql = 'INSERT INTO app_users SET ?';
        db.query(sql, userData, callback);
    },

    getAll: (callback) => {
        const sql = 'SELECT user_id, name, username, phone, email, birthdate, created_at FROM app_users';
        db.query(sql, callback);
    },

    getProfile: (id, callback) => {
        const sql = 'SELECT name, username, phone, email, password_hash, birthdate FROM app_users WHERE user_id = ?';
        db.query(sql, id, callback);
    },

    getById: (id, callback) => {
        const sql = 'SELECT user_id, name, username, phone, email, birthdate, created_at FROM app_users WHERE user_id = ?';
        db.query(sql, id, callback);
    },

    getByUsername: (username, callback) => {
        const sql = 'SELECT * FROM app_users WHERE username = ?';
        db.query(sql, username, callback);
    },

    getByEmail: (email, callback) => {
        const sql = 'SELECT * FROM app_users WHERE email = ?';
        db.query(sql, email, callback);
    },

    search: (query, limit = 10) => {
        const like = `%${query}%`;
        const sql = 'SELECT user_id, username, email, name FROM app_users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ?';
        return db.query(sql, [like, like, Number(limit) || 10]);
    },

    update: (id, userData, callback) => {
        const sql = 'UPDATE app_users SET ? WHERE user_id = ?';
        db.query(sql, [userData, id], callback);
    },

    remove: (id, callback) => {
        const sql = 'DELETE FROM app_users WHERE user_id = ?';
        db.query(sql, id, callback);
    }
};