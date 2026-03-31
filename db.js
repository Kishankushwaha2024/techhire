const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      company VARCHAR(200) NOT NULL,
      location VARCHAR(200),
      salary VARCHAR(100),
      type VARCHAR(50),
      description TEXT,
      requirements TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      resume_path VARCHAR(255),
      cover_letter TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create default admin
  const bcrypt = require("bcryptjs");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@jobportal.com";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await pool.query("SELECT id FROM users WHERE email=$1", [adminEmail]);
  if (existing.rows.length === 0) {
    const hashed = await bcrypt.hash(adminPass, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')",
      ["Admin", adminEmail, hashed]
    );
    console.log("✅ Default admin created:", adminEmail);
  }

  console.log("✅ Database initialized");
}

module.exports = { pool, initDB };
