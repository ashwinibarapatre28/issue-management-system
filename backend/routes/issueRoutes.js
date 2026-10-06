const express = require("express");
const db = require("../config/db");

const {
    verifyToken,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// 1. CLIENT - CREATE NEW ISSUE
// =====================================================

router.post("/", (req, res) => {

    const {
        clientName,
        category,
        title,
        description,
        location
    } = req.body;


    // Validate required fields
    if (
        !clientName ||
        !category ||
        !title ||
        !description
    ) {
        return res.status(400).json({
            message: "Please fill all required fields"
        });
    }


    const sql = `
        INSERT INTO issues
        (
            client_name,
            category,
            title,
            description,
            location
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            clientName,
            category,
            title,
            description,
            location
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    message: "Failed to create issue"
                });
            }


            res.status(201).json({
                message: "Issue submitted successfully",
                issueId: result.insertId
            });

        }
    );
});


// =====================================================
// 2. ADMIN - GET ALL ISSUES
// =====================================================

router.get(
    "/",
    verifyToken,
    adminOnly,
    (req, res) => {

        const sql = `
            SELECT
                issues.*,
                users.name AS assigned_user
            FROM issues
            LEFT JOIN users
                ON issues.assigned_user_id = users.id
            ORDER BY issues.created_at DESC
        `;


        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to fetch issues"
                    });
                }


                res.json(results);

            }
        );
    }
);


// =====================================================
// 3. USER - GET ONLY THEIR ASSIGNED ISSUES
// =====================================================

router.get(
    "/my",
    verifyToken,
    (req, res) => {

        const sql = `
            SELECT *
            FROM issues
            WHERE assigned_user_id = ?
            ORDER BY created_at DESC
        `;


        db.query(
            sql,
            [req.user.id],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to fetch your issues"
                    });
                }


                res.json(results);

            }
        );
    }
);


// =====================================================
// 4. GET SINGLE ISSUE
// =====================================================

router.get(
    "/:id",
    verifyToken,
    (req, res) => {

        const issueId = req.params.id;


        const sql = `
            SELECT
                issues.*,
                users.name AS assigned_user
            FROM issues
            LEFT JOIN users
                ON issues.assigned_user_id = users.id
            WHERE issues.id = ?
        `;


        db.query(
            sql,
            [issueId],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Failed to fetch issue"
                    });
                }


                // Issue does not exist
                if (results.length === 0) {

                    return res.status(404).json({
                        message: "Issue not found"
                    });
                }


                const issue = results[0];


                // -----------------------------------------
                // USER SECURITY
                // -----------------------------------------
                // User can only view an issue assigned
                // to that particular user.
                //
                // Admin can view any issue.
                // -----------------------------------------

                if (
                    req.user.role === "user" &&
                    issue.assigned_user_id !== req.user.id
                ) {

                    return res.status(403).json({
                        message:
                            "You are not allowed to view this issue"
                    });
                }


                res.json({
                    issue: issue
                });

            }
        );
    }
);


// =====================================================
// 5. ADMIN - ASSIGN ISSUE TO USER
// =====================================================

router.put(
    "/:id/assign",
    verifyToken,
    adminOnly,
    (req, res) => {

        const issueId = req.params.id;

        const {
            userId
        } = req.body;


        // Check user ID
        if (!userId) {

            return res.status(400).json({
                message: "User ID is required"
            });
        }


        // First check whether the issue exists
        const checkIssueSql = `
            SELECT *
            FROM issues
            WHERE id = ?
        `;


        db.query(
            checkIssueSql,
            [issueId],
            (err, issueResults) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }


                if (issueResults.length === 0) {

                    return res.status(404).json({
                        message: "Issue not found"
                    });
                }


                // -----------------------------------------
                // Check whether selected user exists
                // -----------------------------------------

                const checkUserSql = `
                    SELECT *
                    FROM users
                    WHERE id = ?
                    AND role = 'user'
                `;


                db.query(
                    checkUserSql,
                    [userId],
                    (err, userResults) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                message: "Database error"
                            });
                        }


                        if (userResults.length === 0) {

                            return res.status(404).json({
                                message:
                                    "User not found"
                            });
                        }


                        // -----------------------------------------
                        // Assign issue
                        // -----------------------------------------

                        const updateSql = `
                            UPDATE issues
                            SET
                                assigned_user_id = ?,
                                status = 'In Progress'
                            WHERE id = ?
                        `;


                        db.query(
                            updateSql,
                            [userId, issueId],
                            (err) => {

                                if (err) {

                                    console.error(err);

                                    return res.status(500).json({
                                        message:
                                            "Failed to assign issue"
                                    });
                                }


                                res.json({
                                    message:
                                        "Issue assigned successfully"
                                });

                            }
                        );

                    }
                );

            }
        );
    }
);


// =====================================================
// 6. USER - MARK ISSUE AS COMPLETED
// =====================================================

router.put(
    "/:id/complete",
    verifyToken,
    (req, res) => {

        const issueId = req.params.id;


        const sql = `
            UPDATE issues
            SET status = 'Completed'
            WHERE id = ?
            AND assigned_user_id = ?
        `;


        db.query(
            sql,
            [
                issueId,
                req.user.id
            ],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Failed to update issue"
                    });
                }


                // User is not assigned to this issue
                if (result.affectedRows === 0) {

                    return res.status(403).json({
                        message:
                            "You cannot update this issue"
                    });
                }


                res.json({
                    message:
                        "Issue marked as completed"
                });

            }
        );
    }
);


module.exports = router;