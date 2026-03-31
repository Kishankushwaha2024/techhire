const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { pool } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Multer setup for profile pics
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `user_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});

// GET /api/profile/:id — public (anyone can view)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              p.bio, p.phone, p.location, p.education, p.skills, p.experience, p.pic_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/profile/me/data — own profile
router.get("/me/data", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              p.bio, p.phone, p.location, p.education, p.skills, p.experience, p.pic_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/profile/update — update profile info
router.put("/update", authMiddleware, async (req, res) => {
  const { bio, phone, location, education, skills, experience } = req.body;
  try {
    await pool.query(
      `INSERT INTO profiles (user_id, bio, phone, location, education, skills, experience)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         bio=$2, phone=$3, location=$4, education=$5, skills=$6, experience=$7, updated_at=NOW()`,
      [req.user.id, bio, phone, location, education, skills, experience]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/profile/upload-pic — upload profile picture
router.post("/upload-pic", authMiddleware, upload.single("pic"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const picUrl = `/uploads/profiles/${req.file.filename}`;
    await pool.query(
      `INSERT INTO profiles (user_id, pic_url) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET pic_url=$2, updated_at=NOW()`,
      [req.user.id, picUrl]
    );
    res.json({ pic_url: picUrl });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
