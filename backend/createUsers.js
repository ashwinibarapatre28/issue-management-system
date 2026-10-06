const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createUsers() {

    const adminPassword =
        await bcrypt.hash("admin123", 10);

    const userPassword =
        await bcrypt.hash("user123", 10);

    const sql = `
        INSERT INTO users
        (name, email, password, role)
        VALUES
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            "Admin",
            "admin@gmail.com",
            adminPassword,
            "admin",

            "User One",
            "user1@gmail.com",
            userPassword,
            "user",

            "User Two",
            "user2@gmail.com",
            userPassword,
            "user"
        ],
        (err) => {

            if (err) {
                console.log(err);
            } else {
                console.log(
                    "Users created successfully"
                );
            }

            process.exit();
        }
    );
}

createUsers();