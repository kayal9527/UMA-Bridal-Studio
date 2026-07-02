document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  renderServices();
  renderGallery();
  initBookingForm();
});

function initNavigation() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navLinks");

  toggle?.addEventListener("click", () => nav.classList.toggle("open"));

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function renderServices() {
  const menu = getMenuItems();
  const servicesGrid = document.getElementById("servicesGrid");
  const complementaryGrid = document.getElementById("complementaryGrid");

  if (!servicesGrid || !complementaryGrid) return;

  const services = menu.filter((m) => m.category === "service");
  const complementary = menu.filter((m) => m.category === "complementary");

  servicesGrid.innerHTML = services.map((item) => serviceCardHTML(item)).join("");
  complementaryGrid.innerHTML = complementary.map((item) => serviceCardHTML(item)).join("");
}

function serviceCardHTML(item) {
  return `
    <article class="service-card">
      <h3>${item.name}</h3>
    </article>
  `;
}

function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const photos = getBridePhotos();

  if (photos.length === 0) {
      return;
  }

  grid.innerHTML = photos
    .map(
      (photo) => `
    <div class="gallery-item" data-photo-src="${photo.image}">
      <img src="${photo.image}" alt="${photo.caption || "Bride photo"}">
      ${photo.caption ? `<div class="gallery-caption">${photo.caption}</div>` : ""}
    </div>
  `
    )
    .join("");

  const modal = document.getElementById("galleryModal");
  const modalImg = document.getElementById("galleryModalImg");
  const modalClose = document.getElementById("galleryModalClose");

  grid.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      modalImg.src = item.dataset.photoSrc;
      modalImg.alt = item.querySelector("img")?.alt || "Bride photo";
      modal.classList.add("open");
    });
  });

  modalClose?.addEventListener("click", () => modal.classList.remove("open"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

function initBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const booking = {
      customerName: document.getElementById("customerName").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
      email: document.getElementById("customerEmail").value.trim(),
      eventDate: document.getElementById("eventDate").value,
      eventType: document.getElementById("eventType").value,
      services: document.getElementById("selectedServices").value.trim(),
      notes: document.getElementById("bookingNotes").value.trim(),
      status: "pending",
    };

    if (!booking.customerName || !booking.phone || !booking.eventDate) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    createBooking(booking);
    form.reset();
    showToast("Booking submitted successfully! We will contact you soon.", "success");
  });
}

function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
