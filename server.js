require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDB } = require("./db");

const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const adminRoutes = require("./routes/admin");
const applyRoutes = require("./routes/apply");
const employerRoutes = require("./routes/employer");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/apply", applyRoutes);
app.use("/api/employer", employerRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ DB init failed:", err);
  process.exit(1);
});
