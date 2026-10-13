const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// REGISTER NEW USER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters long"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // Check if user already exists
        const checkSql = "SELECT id FROM users WHERE email = ?";
        db.query(checkSql, [trimmedEmail], async (checkErr, results) => {
            if (checkErr) {
                console.error("Database check error:", checkErr);
                return res.status(500).json({
                    message: "Database error occurred"
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message: "An account with this email already exists"
                });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const role = "user"; // Standard user role

                const insertSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
                db.query(insertSql, [trimmedName, trimmedEmail, hashedPassword, role], (insertErr, result) => {
                    if (insertErr) {
                        console.error("Database insert error:", insertErr);
                        return res.status(500).json({
                            message: "Failed to register user. Please try again."
                        });
                    }

                    const token = jwt.sign(
                        {
                            id: result.insertId,
                            name: trimmedName,
                            role
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "1d"
                        }
                    );

                    return res.status(201).json({
                        message: "Registration successful! You can now log in.",
                        token,
                        user: {
                            id: result.insertId,
                            name: trimmedName,
                            email: trimmedEmail,
                            role
                        }
                    });
                });
            } catch (hashErr) {
                console.error("Password hash error:", hashErr);
                return res.status(500).json({
                    message: "Error securing password"
                });
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

// ADMIN - GET ALL USERS (for assign dropdown & users table)
router.get("/users", (req, res) => {
    const sql = "SELECT id, name, email, role, created_at FROM users WHERE role = 'user'";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Failed to fetch users" });
        }
        res.json(results);
    });
});

module.exports = router;