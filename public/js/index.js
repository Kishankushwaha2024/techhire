let currentJobId = null;

async function loadJobs(params = {}) {
  const grid = document.getElementById("jobsGrid");
  const countEl = document.getElementById("jobCount");
  grid.innerHTML = '<div class="loading">Loading jobs...</div>';

  const query = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`/api/jobs?${query}`);
    const jobs = await res.json();

    countEl.textContent = `${jobs.length} jobs found`;

    if (!jobs.length) {
      grid.innerHTML = '<div class="no-jobs">No jobs found. Try different keywords!</div>';
      return;
    }

    grid.innerHTML = jobs.map(job => `
      <div class="job-card" onclick="openApplyModal(${job.id}, '${escapeHtml(job.title)} at ${escapeHtml(job.company)}')">
        <div class="job-header">
          <div>
            <div class="job-title">${escapeHtml(job.title)}</div>
            <div class="job-company">${escapeHtml(job.company)}</div>
          </div>
          ${job.type ? `<span class="job-type">${escapeHtml(job.type)}</span>` : ''}
        </div>
        <div class="job-meta">
          ${job.location ? `<span>📍 ${escapeHtml(job.location)}</span>` : ''}
          ${job.salary ? `<span>💰 ${escapeHtml(job.salary)}</span>` : ''}
          <span>🕒 ${timeAgo(job.created_at)}</span>
        </div>
        ${job.description ? `<div class="job-desc">${escapeHtml(job.description).substring(0, 120)}...</div>` : ''}
        <button class="btn-apply" onclick="event.stopPropagation(); openApplyModal(${job.id}, '${escapeHtml(job.title)} at ${escapeHtml(job.company)}')">
          Apply Now
        </button>
      </div>
    `).join("");
  } catch (err) {
    grid.innerHTML = '<div class="loading">Error loading jobs. Try refreshing.</div>';
  }
}

function searchJobs() {
  const search = document.getElementById("searchInput").value;
  const location = document.getElementById("locationInput").value;
  const type = document.getElementById("typeFilter").value;
  const params = {};
  if (search) params.search = search;
  if (location) params.location = location;
  if (type) params.type = type;
  loadJobs(params);
}

function openApplyModal(jobId, jobTitle) {
  const user = getUser();
  if (!user) {
    if (confirm("Please login to apply. Go to login page?")) {
      window.location.href = "/pages/login.html";
    }
    return;
  }
  currentJobId = jobId;
  document.getElementById("modalJobTitle").textContent = jobTitle;
  document.getElementById("applyModal").style.display = "flex";
  document.getElementById("applyMsg").textContent = "";
  document.getElementById("resumeFile").value = "";
  document.getElementById("coverLetter").value = "";
}

function closeModal() {
  document.getElementById("applyModal").style.display = "none";
}

async function submitApplication() {
  const msg = document.getElementById("applyMsg");
  const resumeFile = document.getElementById("resumeFile").files[0];
  const coverLetter = document.getElementById("coverLetter").value;

  const formData = new FormData();
  if (resumeFile) formData.append("resume", resumeFile);
  formData.append("cover_letter", coverLetter);

  try {
    const res = await authFetch(`/api/apply/${currentJobId}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error;
      msg.className = "msg error";
    } else {
      msg.textContent = "✅ Application submitted successfully!";
      msg.className = "msg success";
      setTimeout(closeModal, 1800);
    }
  } catch {
    msg.textContent = "Server error. Try again.";
    msg.className = "msg error";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// Press Enter to search
document.getElementById("searchInput")?.addEventListener("keypress", e => { if(e.key==="Enter") searchJobs(); });
document.getElementById("locationInput")?.addEventListener("keypress", e => { if(e.key==="Enter") searchJobs(); });

// Close modal on backdrop click
document.getElementById("applyModal")?.addEventListener("click", e => {
  if (e.target.id === "applyModal") closeModal();
});

loadJobs();
