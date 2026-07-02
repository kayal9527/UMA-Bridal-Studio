document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initLogin();
  initNavigation();
  initMenuCRUD();
  initGalleryCRUD();
  initBookingsCRUD();
  initMonthlyReport();
  initSettings();
});

let isAuthenticated = false;

function checkAuth() {
  isAuthenticated = sessionStorage.getItem("uma_admin_auth") === "true";
  document.getElementById("loginScreen").style.display = isAuthenticated ? "none" : "flex";
  document.getElementById("adminLayout").style.display = isAuthenticated ? "flex" : "none";
  if (isAuthenticated) {
    renderMenuTable();
    renderAdminPhotos();
    renderBookingsTable();
    renderMonthlyReport();
  }
}

function initLogin() {
  document.getElementById("loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("adminPassword").value;
    const settings = getSettings();

    if (password === settings.adminPassword) {
      sessionStorage.setItem("uma_admin_auth", "true");
      isAuthenticated = true;
      checkAuth();
      showToast("Welcome, Admin!", "success");
    } else {
      showToast("Incorrect password", "error");
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("uma_admin_auth");
    isAuthenticated = false;
    checkAuth();
    showToast("Logged out", "success");
  });
}

function initNavigation() {
  document.querySelectorAll(".admin-nav button[data-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.panel).classList.add("active");

      if (btn.dataset.panel === "panelReport") renderMonthlyReport();
      if (btn.dataset.panel === "panelBookings") renderBookingsTable();
      if (btn.dataset.panel === "panelMenu") renderMenuTable();
      if (btn.dataset.panel === "panelGallery") renderAdminPhotos();
    });
  });

  document.querySelector(".admin-nav button[data-panel='panelMenu']")?.classList.add("active");
}

function initMenuCRUD() {
  document.getElementById("menuForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const editId = document.getElementById("menuEditId").value;
    const item = {
      name: document.getElementById("menuName").value.trim(),
      category: document.getElementById("menuCategory").value,
      description: document.getElementById("menuDescription").value.trim(),
      price: parseFloat(document.getElementById("menuPrice").value) || 0,
    };

    if (!item.name) {
      showToast("Service name is required", "error");
      return;
    }

    if (editId) {
      updateMenuItem(editId, item);
      showToast("Menu item updated", "success");
    } else {
      createMenuItem(item);
      showToast("Menu item added", "success");
    }

    resetMenuForm();
    renderMenuTable();
  });

  document.getElementById("menuCancelEdit")?.addEventListener("click", resetMenuForm);
}

function initGalleryCRUD() {
  let pendingImage = null;

  const fileInput = document.getElementById("photoFile");
  const preview = document.getElementById("photoPreview");
  const previewImg = document.getElementById("photoPreviewImg");
  const submitBtn = document.getElementById("photoSubmitBtn");

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      fileInput.value = "";
      return;
    }

    compressImage(file, 800, 0.7)
      .then((dataUrl) => {
        pendingImage = dataUrl;
        previewImg.src = dataUrl;
        preview.style.display = "block";
        submitBtn.disabled = false;
      })
      .catch(() => showToast("Failed to read image", "error"));
  });

  document.getElementById("photoForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!pendingImage) {
      showToast("Please select a photo first", "error");
      return;
    }

    try {
      createBridePhoto({
        image: pendingImage,
        caption: document.getElementById("photoCaption").value.trim(),
      });
      pendingImage = null;
      fileInput.value = "";
      preview.style.display = "none";
      submitBtn.disabled = true;
      document.getElementById("photoCaption").value = "";
      renderAdminPhotos();
      showToast("Photo uploaded successfully", "success");
    } catch (err) {
      showToast("Storage full — try removing old photos or use a smaller image", "error");
    }
  });
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAdminPhotos() {
  const grid = document.getElementById("adminPhotoGrid");
  if (!grid) return;

  const photos = getBridePhotos();

  if (photos.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1">No photos uploaded yet.</p>';
    return;
  }

  grid.innerHTML = photos
    .map(
      (photo) => `
    <div class="admin-photo-item">
      <img src="${photo.image}" alt="${photo.caption || "Bride"}">
      <div class="photo-actions">
        <span>${photo.caption || "No caption"}</span>
        <button class="btn btn-danger btn-sm" data-delete-photo="${photo.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join("");

  grid.querySelectorAll("[data-delete-photo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this photo?")) {
        deleteBridePhoto(btn.dataset.deletePhoto);
        renderAdminPhotos();
        showToast("Photo deleted", "success");
      }
    });
  });
}

function resetMenuForm() {
  document.getElementById("menuForm").reset();
  document.getElementById("menuEditId").value = "";
  document.getElementById("menuFormTitle").textContent = "Add Menu Item";
  document.getElementById("menuCancelEdit").style.display = "none";
}

function renderMenuTable() {
  const menu = getMenuItems();
  const tbody = document.getElementById("menuTableBody");
  if (!tbody) return;

  tbody.innerHTML = menu
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td><span class="badge badge-${item.category === "service" ? "service" : "complementary"}">${item.category}</span></td>
      <td>${item.description || "—"}</td>
      <td>${item.price === 0 ? "Free" : formatCurrency(item.price)}</td>
      <td class="table-actions">
        <button class="btn btn-outline btn-sm" data-edit-menu="${item.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-delete-menu="${item.id}">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");

  tbody.querySelectorAll("[data-edit-menu]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = getMenuItems().find((m) => m.id === btn.dataset.editMenu);
      if (!item) return;
      document.getElementById("menuEditId").value = item.id;
      document.getElementById("menuName").value = item.name;
      document.getElementById("menuCategory").value = item.category;
      document.getElementById("menuDescription").value = item.description || "";
      document.getElementById("menuPrice").value = item.price;
      document.getElementById("menuFormTitle").textContent = "Edit Menu Item";
      document.getElementById("menuCancelEdit").style.display = "inline-flex";
    });
  });

  tbody.querySelectorAll("[data-delete-menu]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this menu item?")) {
        deleteMenuItem(btn.dataset.deleteMenu);
        renderMenuTable();
        showToast("Menu item deleted", "success");
      }
    });
  });
}

function initBookingsCRUD() {
  document.getElementById("bookingFilterStatus")?.addEventListener("change", renderBookingsTable);
}

function renderBookingsTable() {
  const bookings = getBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filter = document.getElementById("bookingFilterStatus")?.value || "all";
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999">No bookings found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (b) => `
    <tr>
      <td>${b.customerName}</td>
      <td>${b.phone}</td>
      <td>${formatDate(b.eventDate)}</td>
      <td>${b.eventType || "—"}</td>
      <td>${b.services || "—"}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td>${formatDate(b.createdAt)}</td>
      <td class="table-actions">
        <select data-status-booking="${b.id}" style="padding:0.3rem;border-radius:6px;border:1px solid #ddd;font-size:0.78rem">
          <option value="pending" ${b.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="confirmed" ${b.status === "confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="paid" ${b.status === "paid" ? "selected" : ""}>Paid</option>
        </select>
        <button class="btn btn-danger btn-sm" data-delete-booking="${b.id}">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");

  tbody.querySelectorAll("[data-status-booking]").forEach((sel) => {
    sel.addEventListener("change", () => {
      updateBooking(sel.dataset.statusBooking, { status: sel.value });
      showToast("Booking status updated", "success");
      renderBookingsTable();
    });
  });

  tbody.querySelectorAll("[data-delete-booking]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this booking?")) {
        deleteBooking(btn.dataset.deleteBooking);
        renderBookingsTable();
        renderMonthlyReport();
        showToast("Booking deleted", "success");
      }
    });
  });
}

function initMonthlyReport() {
  const now = new Date();
  const monthSelect = document.getElementById("reportMonth");
  const yearSelect = document.getElementById("reportYear");

  if (monthSelect && monthSelect.options.length === 0) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i + 1;
      opt.textContent = m;
      if (i + 1 === now.getMonth() + 1) opt.selected = true;
      monthSelect.appendChild(opt);
    });
  }

  if (yearSelect && yearSelect.options.length === 0) {
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
  }

  document.getElementById("generateReport")?.addEventListener("click", renderMonthlyReport);
  document.getElementById("printReport")?.addEventListener("click", () => {
    const reportArea = document.getElementById("reportPrintArea");
    if (reportArea.innerHTML) {
      const printWin = window.open("", "_blank");
      printWin.document.write(`
        <html><head><title>Monthly Report - UMA Bridal Studio</title>
        <style>body{font-family:sans-serif;padding:2rem}table{width:100%;border-collapse:collapse}th,td{padding:0.5rem;border:1px solid #ddd;text-align:left}th{background:#fdf6f0}</style>
        </head><body>${reportArea.innerHTML}</body></html>
      `);
      printWin.document.close();
      printWin.print();
    }
  });
}

function renderMonthlyReport() {
  const month = parseInt(document.getElementById("reportMonth")?.value || new Date().getMonth() + 1);
  const year = parseInt(document.getElementById("reportYear")?.value || new Date().getFullYear());
  const bookings = getBookingsByMonth(year, month);

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const paid = bookings.filter((b) => b.status === "paid").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statConfirmed").textContent = confirmed;
  document.getElementById("statPaid").textContent = paid;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const reportTitle = `${monthNames[month - 1]} ${year}`;

  const tbody = document.getElementById("reportTableBody");
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">No bookings for this month</td></tr>';
  } else {
    tbody.innerHTML = bookings
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .map(
        (b) => `
      <tr>
        <td>${b.customerName}</td>
        <td>${b.phone}</td>
        <td>${formatDate(b.eventDate)}</td>
        <td>${b.eventType || "—"}</td>
        <td>${b.services || "—"}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
      </tr>
    `
      )
      .join("");
  }

  document.getElementById("reportPrintArea").innerHTML = `
    <h1 style="text-align:center">UMA Bridal Studio — Monthly Booking Report</h1>
    <p style="text-align:center">${reportTitle}</p>
    <p style="text-align:center;margin-bottom:1.5rem">Total: ${total} | Pending: ${pending} | Confirmed: ${confirmed} | Paid: ${paid}</p>
    <table>
      <thead><tr><th>Name</th><th>Phone</th><th>Event Date</th><th>Type</th><th>Services</th><th>Status</th></tr></thead>
      <tbody>${tbody.innerHTML}</tbody>
    </table>
  `;
}

function initSettings() {
  const settings = getSettings();
  document.getElementById("settingsUpi").value = settings.upiId;
  document.getElementById("settingsPhone").value = settings.phone;
  document.getElementById("settingsPassword").placeholder = "Leave blank to keep current";

  document.getElementById("settingsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const newSettings = {
      upiId: document.getElementById("settingsUpi").value.trim(),
      phone: document.getElementById("settingsPhone").value.trim(),
    };
    const newPass = document.getElementById("settingsPassword").value;
    if (newPass) newSettings.adminPassword = newPass;

    saveSettings({ ...getSettings(), ...newSettings });
    showToast("Settings saved", "success");
    document.getElementById("settingsPassword").value = "";
  });
}

function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
