const express = require("express");
const { pool } = require("../db");
const router = express.Router();

// Get all jobs (with optional search)
router.get("/", async (req, res) => {
  const { search, location, type } = req.query;
  let query = "SELECT * FROM jobs WHERE 1=1";
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR company ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }
  if (location) {
    params.push(`%${location}%`);
    query += ` AND location ILIKE $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get single job
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Job not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
