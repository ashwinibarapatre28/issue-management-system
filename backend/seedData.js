const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function seed() {
    try {
        const adminPass = await bcrypt.hash("admin123", 10);
        const userPass = await bcrypt.hash("user123", 10);

        // 1. Seed Users if table empty or missing specific users
        const users = [
            ["Admin", "admin@gmail.com", adminPass, "admin"],
            ["User 1", "user1@gmail.com", userPass, "user"],
            ["User 2", "user2@gmail.com", userPass, "user"],
            ["User 3", "user3@gmail.com", userPass, "user"]
        ];

        for (const u of users) {
            db.query("INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", u, (err) => {
                if (err) console.error("Error inserting user:", err.message);
            });
        }

        // Wait brief moment for user inserts
        setTimeout(() => {
            // Get user IDs
            db.query("SELECT id, name FROM users", (err, userRows) => {
                if (err || !userRows) return;
                
                const userMap = {};
                userRows.forEach(row => { userMap[row.name] = row.id; });

                const u1Id = userMap["User 1"] || 2;
                const u2Id = userMap["User 2"] || 3;
                const u3Id = userMap["User 3"] || 4;

                // 2. Seed Issues matching screenshot
                const issues = [
                    ["Rahul Sharma", "Water", "Water Leakage", "Water leaking from main pipeline near the gate.", "Block A", u1Id, "Pending"],
                    ["Neha Patel", "Electricity", "Street Light", "Street light flickering near house #12.", "Sector 4", u2Id, "In Progress"],
                    ["Amit Verma", "Cleanliness", "Clean Park", "Park needs cleaning after community event.", "Central Park", null, "Pending"],
                    ["Priya Singh", "Cleanliness", "Dustbin Issue", "Broken dustbin needs replacement.", "Block B", u3Id, "Completed"],
                    ["Suresh Kumar", "Water", "Broken Pipe", "Water pipe leak in basement.", "Block C", u1Id, "In Progress"],
                    ["Rohan Gupta", "Electricity", "Street Light", "Street light not working.", "Street 3", u1Id, "Completed"]
                ];

                db.query("SELECT COUNT(*) AS count FROM issues", (err, countResult) => {
                    if (!err && countResult[0].count === 0) {
                        for (const iss of issues) {
                            db.query(
                                "INSERT INTO issues (client_name, category, title, description, location, assigned_user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                iss,
                                (err) => {
                                    if (err) console.error("Error seeding issue:", err.message);
                                }
                            );
                        }
                    }
                });

                // 3. Seed Queries matching screenshot
                const queries = [
                    [u1Id, "When will the water issue be resolved?", "The issue will be resolved by tomorrow."],
                    [u2Id, "Is there any update on street light issue?", null],
                    [u3Id, "Can we get extra dustbins in Block B?", "We are checking and will update soon."]
                ];

                db.query("SELECT COUNT(*) AS count FROM queries", (err, countResult) => {
                    if (!err && countResult[0].count === 0) {
                        for (const q of queries) {
                            db.query(
                                "INSERT INTO queries (user_id, question, answer) VALUES (?, ?, ?)",
                                q,
                                (err) => {
                                    if (err) console.error("Error seeding query:", err.message);
                                }
                            );
                        }
                    }
                });
            });
        }, 500);

    } catch (e) {
        console.error("Seeding error:", e);
    }
}

module.exports = seed;
