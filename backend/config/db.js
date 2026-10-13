const mysql = require("mysql2");

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

// Use SSL for cloud databases (like Render/TiDB/Aiven) while supporting local development
if (process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1") {
    poolConfig.ssl = {
        rejectUnauthorized: true
    };
}

const db = mysql.createPool(poolConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("MySQL connected successfully");
        connection.release();
    }
});

module.exports = db;
