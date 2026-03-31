// Admin Panel JS

const user = getUser();
if (!user || user.role !== "admin") {
  alert("Admin access only!");
  window.location.href = "/";
}

function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).style.display = "block";
  event.target.classList.add("active");

  if (tab === "jobs") loadAdminJobs();
  if (tab === "applications") loadApplications();
  if (tab === "users") loadUsers();
}

// ADD JOB
async function addJob() {
  const title = document.getElementById("jobTitle").value;
  const company = document.getElementById("jobCompany").value;
  const location = document.getElementById("jobLocation").value;
  const salary = document.getElementById("jobSalary").value;
  const type = document.getElementById("jobType").value;
  const description = document.getElementById("jobDesc").value;
  const requirements = document.getElementById("jobReq").value;
  const msg = document.getElementById("jobMsg");

  if (!title || !company) { msg.textContent = "Title and company are required"; msg.className = "msg error"; return; }

  try {
    const res = await authFetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, company, location, salary, type, description, requirements }),
    });
    const data = await res.json();
    if (!res.ok) { msg.textContent = data.error; msg.className = "msg error"; return; }
    msg.textContent = "✅ Job added successfully!";
    msg.className = "msg success";
    document.getElementById("jobTitle").value = "";
    document.getElementById("jobCompany").value = "";
    document.getElementById("jobLocation").value = "";
    document.getElementById("jobSalary").value = "";
    document.getElementById("jobDesc").value = "";
    document.getElementById("jobReq").value = "";
    loadAdminJobs();
  } catch {
    msg.textContent = "Server error";
    msg.className = "msg error";
  }
}

// LOAD ADMIN JOBS
async function loadAdminJobs() {
  const container = document.getElementById("adminJobsList");
  try {
    const res = await fetch("/api/jobs");
    const jobs = await res.json();
    if (!jobs.length) { container.innerHTML = "<p>No jobs yet.</p>"; return; }
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Title</th><th>Company</th><th>Type</th><th>Location</th><th>Posted</th><th>Action</th></tr></thead>
        <tbody>
          ${jobs.map(j => `
            <tr>
              <td><strong>${escHtml(j.title)}</strong></td>
              <td>${escHtml(j.company)}</td>
              <td>${j.type || "-"}</td>
              <td>${j.location || "-"}</td>
              <td>${new Date(j.created_at).toLocaleDateString("en-IN")}</td>
              <td><button class="btn-danger" onclick="deleteJob(${j.id})">Delete</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  } catch { container.innerHTML = "<p>Error loading jobs.</p>"; }
}

async function deleteJob(id) {
  if (!confirm("Delete this job?")) return;
  await authFetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
  loadAdminJobs();
}

// LOAD APPLICATIONS
async function loadApplications() {
  const container = document.getElementById("applicationsList");
  try {
    const res = await authFetch("/api/admin/applications");
    const apps = await res.json();
    if (!apps.length) { container.innerHTML = "<p>No applications yet.</p>"; return; }
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Applicant</th><th>Email</th><th>Job</th><th>Resume</th><th>Applied</th><th>Status</th></tr></thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td>${escHtml(a.user_name)}</td>
              <td>${escHtml(a.user_email)}</td>
              <td>${escHtml(a.job_title)}</td>
              <td>${a.resume_path ? `<a href="/uploads/${a.resume_path}" target="_blank">View</a>` : "-"}</td>
              <td>${new Date(a.applied_at).toLocaleDateString("en-IN")}</td>
              <td>
                <select onchange="updateStatus(${a.id}, this.value)" style="border:1px solid #e2e8f0;border-radius:6px;padding:.2rem .4rem;font-size:.8rem;">
                  <option ${a.status==="pending"?"selected":""}>pending</option>
                  <option ${a.status==="accepted"?"selected":""}>accepted</option>
                  <option ${a.status==="rejected"?"selected":""}>rejected</option>
                </select>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  } catch { container.innerHTML = "<p>Error loading applications.</p>"; }
}

async function updateStatus(id, status) {
  await authFetch(`/api/admin/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// LOAD USERS
async function loadUsers() {
  const container = document.getElementById("usersList");
  try {
    const res = await authFetch("/api/admin/users");
    const users = await res.json();
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${escHtml(u.name)}</td>
              <td>${escHtml(u.email)}</td>
              <td><span class="badge ${u.role==="admin"?"badge-accepted":"badge-pending"}">${u.role.toUpperCase()}</span></td>
              <td>${new Date(u.created_at).toLocaleDateString("en-IN")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  } catch { container.innerHTML = "<p>Error loading users.</p>"; }
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// Load jobs on page open
loadAdminJobs();
