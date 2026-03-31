const express = require("express");
const multer = require("multer");
const path = require("path");
const { pool } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF/DOC files allowed"));
  },
});

// Apply for job
router.post("/:jobId", authMiddleware, upload.single("resume"), async (req, res) => {
  const { jobId } = req.params;
  const { cover_letter } = req.body;
  const userId = req.user.id;

  try {
    // Check already applied
    const existing = await pool.query(
      "SELECT id FROM applications WHERE job_id=$1 AND user_id=$2",
      [jobId, userId]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Already applied for this job" });

    const resumePath = req.file ? req.file.filename : null;
    const result = await pool.query(
      "INSERT INTO applications (job_id, user_id, resume_path, cover_letter) VALUES ($1,$2,$3,$4) RETURNING *",
      [jobId, userId, resumePath, cover_letter]
    );
    res.json({ message: "Application submitted!", application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get my applications
router.get("/my/all", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.title as job_title, j.company FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id=$1 ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
