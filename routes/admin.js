const express = require("express");
const { pool } = require("../db");
const { adminMiddleware } = require("../middleware/auth");
const router = express.Router();

// Add job
router.post("/jobs", adminMiddleware, async (req, res) => {
  const { title, company, location, salary, type, description, requirements } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Title and company required" });
  try {
    const result = await pool.query(
      "INSERT INTO jobs (title, company, location, salary, type, description, requirements) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [title, company, location, salary, type, description, requirements]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update job
router.put("/jobs/:id", adminMiddleware, async (req, res) => {
  const { title, company, location, salary, type, description, requirements } = req.body;
  try {
    const result = await pool.query(
      "UPDATE jobs SET title=$1, company=$2, location=$3, salary=$4, type=$5, description=$6, requirements=$7 WHERE id=$8 RETURNING *",
      [title, company, location, salary, type, description, requirements, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete job
router.delete("/jobs/:id", adminMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM jobs WHERE id=$1", [req.params.id]);
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all applications
router.get("/applications", adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, j.title as job_title, u.name as user_name, u.email as user_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      ORDER BY a.applied_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update application status
router.put("/applications/:id", adminMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE applications SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
