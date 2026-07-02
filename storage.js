const STORAGE_KEYS = {
  MENU: "uma_menu_items",
  BOOKINGS: "uma_bookings",
  CART: "uma_cart",
  SETTINGS: "uma_settings",
  BRIDE_PHOTOS: "uma_bride_photos",
};

const DEFAULT_MENU = [
  { id: "svc-1", name: "HD Makeup", category: "service", description: "High-definition bridal makeup for a flawless, camera-ready look.", price: 8000 },
  { id: "svc-2", name: "Glass Skin Makeup", category: "service", description: "Dewy, luminous glass-skin finish for a radiant bridal glow.", price: 9000 },
  { id: "svc-3", name: "Pre Wedding Makeup", category: "service", description: "Elegant makeup for your pre-wedding ceremonies and functions.", price: 6000 },
  { id: "svc-4", name: "Groom Makeup", category: "service", description: "Subtle, polished grooming makeup for the groom.", price: 3500 },
  { id: "svc-5", name: "Advanced Hairstyles", category: "service", description: "Elegant bridal hairstyles with premium styling techniques.", price: 4500 },
  { id: "svc-6", name: "Pre-Pleated Saree Draping", category: "service", description: "Expert pre-pleated saree draping for a perfect silhouette.", price: 1500 },
  { id: "cmp-1", name: "Trials Available", category: "complementary", description: "Complimentary trial session before your big day.", price: 0 },
  { id: "cmp-2", name: "Lashes & Lenses", category: "complementary", description: "Premium lashes and colored lenses included.", price: 0 },
  { id: "cmp-3", name: "Hair Extension", category: "complementary", description: "Hair extensions for volume and length.", price: 0 },
  { id: "cmp-4", name: "Hair Accessories", category: "complementary", description: "Beautiful hair accessories to complete your look.", price: 0 },
];

const DEFAULT_SETTINGS = {
  ownerName: "UMA MAHESH",
  studioName: "UMA Bridal Studio",
  phone: "7558113039",
  email: "umavinoth1991@gmail.com",
  instagram: "Umamahesh_makeupartist",
  address: "Kamarajar Salai, Tharangambadi, Mayiladuthurai District",
  businessHours: {
    weekdays: "Monday – Saturday: 7:30 AM – 9:00 PM",
    sunday: "Sunday: 8:00 AM – 9:00 PM",
  },
  upiId: "umamahesh@paytm",
  adminPassword: "uma2024",
};

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getSettings() {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getMenuItems() {
  const stored = localStorage.getItem(STORAGE_KEYS.MENU);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU));
    return [...DEFAULT_MENU];
  }

  let items = JSON.parse(stored);
  let changed = false;

  const shootItem = items.find((i) => i.id === "svc-3" && i.name === "Shoot Makeup");
  if (shootItem) {
    shootItem.name = "Pre Wedding Makeup";
    shootItem.description = "Elegant makeup for your pre-wedding ceremonies and functions.";
    changed = true;
  }

  DEFAULT_MENU.forEach((def) => {
    if (!items.find((i) => i.id === def.id)) {
      items.push({ ...def });
      changed = true;
    }
  });

  if (changed) saveMenuItems(items);
  return items;
}

function saveMenuItems(items) {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
}

function createMenuItem(item) {
  const items = getMenuItems();
  const newItem = { ...item, id: generateId("menu") };
  items.push(newItem);
  saveMenuItems(items);
  return newItem;
}

function updateMenuItem(id, updates) {
  const items = getMenuItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, id };
  saveMenuItems(items);
  return items[index];
}

function deleteMenuItem(id) {
  const items = getMenuItems().filter((i) => i.id !== id);
  saveMenuItems(items);
  return items;
}

function getBookings() {
  const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return stored ? JSON.parse(stored) : [];
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

function createBooking(booking) {
  const bookings = getBookings();
  const newBooking = {
    ...booking,
    id: generateId("book"),
    createdAt: new Date().toISOString(),
    status: booking.status || "pending",
  };
  bookings.push(newBooking);
  saveBookings(bookings);
  return newBooking;
}

function updateBooking(id, updates) {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  bookings[index] = { ...bookings[index], ...updates, id };
  saveBookings(bookings);
  return bookings[index];
}

function deleteBooking(id) {
  const bookings = getBookings().filter((b) => b.id !== id);
  saveBookings(bookings);
  return bookings;
}

function getBookingsByMonth(year, month) {
  return getBookings().filter((b) => {
    const date = new Date(b.eventDate || b.createdAt);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });
}

function getCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.CART);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

function addToCart(itemId, quantity = 1) {
  const menu = getMenuItems();
  const item = menu.find((m) => m.id === itemId);
  if (!item) return getCart();

  const cart = getCart();
  const existing = cart.find((c) => c.id === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
  return cart;
}

function updateCartQuantity(itemId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((c) => c.id !== itemId);
  } else {
    const item = cart.find((c) => c.id === itemId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
  return cart;
}

function removeFromCart(itemId) {
  const cart = getCart().filter((c) => c.id !== itemId);
  saveCart(cart);
  return cart;
}

function clearCart() {
  saveCart([]);
  return [];
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getBridePhotos() {
  const stored = localStorage.getItem(STORAGE_KEYS.BRIDE_PHOTOS);
  return stored ? JSON.parse(stored) : [];
}

function saveBridePhotos(photos) {
  localStorage.setItem(STORAGE_KEYS.BRIDE_PHOTOS, JSON.stringify(photos));
}

function createBridePhoto(photo) {
  const photos = getBridePhotos();
  const newPhoto = {
    ...photo,
    id: generateId("photo"),
    createdAt: new Date().toISOString(),
  };
  photos.unshift(newPhoto);
  saveBridePhotos(photos);
  return newPhoto;
}

function updateBridePhoto(id, updates) {
  const photos = getBridePhotos();
  const index = photos.findIndex((p) => p.id === id);
  if (index === -1) return null;
  photos[index] = { ...photos[index], ...updates, id };
  saveBridePhotos(photos);
  return photos[index];
}

function deleteBridePhoto(id) {
  const photos = getBridePhotos().filter((p) => p.id !== id);
  saveBridePhotos(photos);
  return photos;
}
