const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL connection pool configuration
 * Uses environment variables for database credentials
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,     // Maximum number of connections in the pool
  queueLimit: 0           // Unlimited queueing for connection requests
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to the database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    return false;
  }
}

// Test connection on startup
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = pool;
