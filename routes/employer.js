const express = require("express");
const { pool } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Employer middleware
function employerOnly(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Employer access only" });
    }
    next();
  });
}

// Post a job
router.post("/jobs", employerOnly, async (req, res) => {
  const { title, company, location, salary, type, description, requirements } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Title and company required" });
  try {
    const result = await pool.query(
      "INSERT INTO jobs (title, company, location, salary, type, description, requirements, employer_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [title, company, location, salary, type, description, requirements, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get my jobs
router.get("/jobs", employerOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM jobs WHERE employer_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete my job
router.delete("/jobs/:id", employerOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM jobs WHERE id=$1 AND employer_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get applications for my jobs
router.get("/applications", employerOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, j.title as job_title, u.name as user_name, u.email as user_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      WHERE j.employer_id = $1
      ORDER BY a.applied_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update application status
router.put("/applications/:id", employerOnly, async (req, res) => {
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

module.exports = router;
