function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function authFetch(url, options = {}) {
  const token = getToken();
  options.headers = options.headers || {};
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, options);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminLink = document.getElementById("adminLink");
  const myAppsLink = document.getElementById("myAppsLink");
  const employerLink = document.getElementById("employerLink");
  const profileLink = document.getElementById("profileLink");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (profileLink) profileLink.style.display = "inline-block";
    if (myAppsLink && user.role === "user") myAppsLink.style.display = "inline-block";
    if (adminLink && user.role === "admin") adminLink.style.display = "inline-block";
    if (employerLink && user.role === "employer") employerLink.style.display = "inline-block";
  }
});
