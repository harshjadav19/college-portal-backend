// ✅ Logout Function
function logout() {
  localStorage.removeItem("userRole");
  alert("You have been logged out.");
  window.location.href = "index.html";
}

// 📢 Load Notices to a container
function loadNotices() {
  fetch("/api/notices")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("notice-container");
      if (!container) return;
      container.innerHTML = "";

      data.forEach(notice => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "10px";
        div.style.margin = "10px 0";
        div.style.padding = "12px 16px";
        div.style.backgroundColor = "#fff";
        div.innerHTML = `
          <strong>${notice.title}</strong>
          <p>${notice.message}</p>
          <small>${notice.date}</small>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Failed to load notices", err));
}

// 📝 Load leave requests for admin
function loadLeaveRequests() {
  fetch("/api/admin/leaves")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("leave-container");
      if (!container) return;
      container.innerHTML = "";

      data.forEach(req => {
        const div = document.createElement("div");
        div.style.border = "1px solid #aaa";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <strong>${req.name}</strong> (${req.studentId})<br>
          <span>${req.fromDate} to ${req.toDate}</span><br>
          <em>${req.reason}</em> — <b>${req.status}</b>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Error loading leave requests", err));
}
