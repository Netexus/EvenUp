
const db = require('../config/database.js');

module.exports = {

    create: (userData, callback) => {
        const sql = 'INSERT INTO app_users SET ?';
        db.query(sql, userData, callback);
    },

    getAll: (callback) => {
        const sql = 'SELECT user_id, name, username, phone, email, created_at FROM app_users';
        db.query(sql, callback);
    },

    getById: (id, callback) => {
        const sql = 'SELECT user_id, name, username, phone, email, created_at FROM app_users WHERE user_id = ?';
        db.query(sql, id, callback);
    },


    getByUsername: (username, callback) => {
        const sql = 'SELECT * FROM app_users WHERE username = ?';
        db.query(sql, username, callback);
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