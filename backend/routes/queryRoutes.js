const express = require("express");
const db = require("../config/db");

const {
    verifyToken,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// USER - Submit question
router.post("/", verifyToken, (req, res) => {

    const { question } = req.body;

    if (!question) {
        return res.status(400).json({
            message: "Question is required"
        });
    }

    const sql = `
        INSERT INTO queries
        (user_id, question)
        VALUES (?, ?)
    `;

    db.query(
        sql,
        [req.user.id, question],
        (err) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to submit question"
                });
            }

            res.json({
                message: "Question submitted"
            });
        }
    );
});


// USER - Get own queries
router.get("/my", verifyToken, (req, res) => {

    const sql = `
        SELECT *
        FROM queries
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(
        sql,
        [req.user.id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch queries"
                });
            }

            res.json(results);
        }
    );
});


// ADMIN - Get all queries
router.get(
    "/",
    verifyToken,
    adminOnly,
    (req, res) => {

        const sql = `
            SELECT
                queries.*,
                users.name AS user_name
            FROM queries
            JOIN users
            ON queries.user_id = users.id
            ORDER BY queries.created_at DESC
        `;

        db.query(sql, (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch queries"
                });
            }

            res.json(results);
        });
    }
);


// ADMIN - Answer query
router.put(
    "/:id",
    verifyToken,
    adminOnly,
    (req, res) => {

        const { answer } = req.body;

        const sql = `
            UPDATE queries
            SET answer = ?,
                answered_at = NOW()
            WHERE id = ?
        `;

        db.query(
            sql,
            [answer, req.params.id],
            (err) => {

                if (err) {
                    return res.status(500).json({
                        message: "Failed to answer query"
                    });
                }

                res.json({
                    message: "Answer submitted"
                });
            }
        );
    }
);

module.exports = router;