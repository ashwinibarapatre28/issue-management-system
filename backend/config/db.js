const mysql = require("mysql2");
const path = require("path");

// Load .env relative to backend directory regardless of cwd
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const poolConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "issue_management",
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Use SSL for cloud databases (like Render/TiDB/Aiven) while supporting local development
if (process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1") {
    poolConfig.ssl = {
        rejectUnauthorized: true
    };
}

const db = mysql.createPool(poolConfig);

// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("MySQL connected successfully");
        connection.release();
    }
});

module.exports = db;
