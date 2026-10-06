const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Ashwini@123",
    database: "issue_management"
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("MySQL connected successfully");
        connection.release();
    }
});

module.exports = db;