// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbyrUl4X6oi0_euUUXB26dM3MkegVz_t1n3VegaX19p_GgGRZS_CkPRebDK8z37q8OGv/exec";
let allProducts = [];
let categories = [];

// DOM Elements
const elements = {
  productContainer: document.getElementById("product-container"),
  loading: document.getElementById("loading"),
  searchInput: document.getElementById("search-input"),
  refreshBtn: document.getElementById("refresh-btn"),
  categoryFilter: document.getElementById("category-filter"),
  productCount: document.getElementById("product-count"),
  currentYear: document.getElementById("current-year")
};

// Initialize the app
function init() {
  setCurrentYear();
  setupEventListeners();
  fetchProducts();
}

// Set current year in footer
function setCurrentYear() {
  elements.currentYear.textContent = new Date().getFullYear();
}

// Setup event listeners
function setupEventListeners() {
  elements.searchInput.addEventListener("input", filterProducts);
  elements.categoryFilter.addEventListener("change", filterProducts);
  elements.refreshBtn.addEventListener("click", () => fetchProducts(true));
}

// Format price to IDR
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 3
  }).format(price);
}

// Fetch products from API
async function fetchProducts(forceRefresh = false) {
  try {
    showLoading();
    
    if (forceRefresh) {
      localStorage.removeItem("products_cache");
    }

    // Check cache first
    const cachedData = localStorage.getItem("products_cache");
    if (cachedData && !forceRefresh) {
      allProducts = JSON.parse(cachedData);
      initCategories();
      filterProducts();
      return;
    }

    // Fetch fresh data
    const response = await fetch(`${API_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    
    allProducts = await response.json();
    localStorage.setItem("products_cache", JSON.stringify(allProducts));
    initCategories();
    filterProducts();
    
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
  }
}

// Initialize categories dropdown
function initCategories() {
  // Extract unique categories from products
  categories = ["ALL", ...new Set(
    allProducts
      .map(product => product.KATEGORI)
      .filter(cat => cat) // Remove empty values
      .sort()
  )];

  // Populate dropdown
  elements.categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat === "ALL" ? "SEMUA KATEGORI" : cat}</option>`)
    .join("");
}

// Filter products based on selections
function filterProducts() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const selectedCategory = elements.categoryFilter.value;
  
  let filtered = allProducts;

  // Apply category filter
  if (selectedCategory !== "ALL") {
    filtered = filtered.filter(product => product.KATEGORI === selectedCategory);
  }

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(product => 
      product.NAMA_PRODUK?.toLowerCase().includes(searchTerm) ||
      product.KATEGORI?.toLowerCase().includes(searchTerm)
    );
  }

  renderProducts(filtered);
}

// Render products to DOM
function renderProducts(products) {
  if (products.length === 0) {
    elements.productContainer.innerHTML = `
      <div class="error">
        <i class="fas fa-search"></i>
        <p>Tidak ada produk yang ditemukan</p>
      </div>
    `;
    elements.productCount.textContent = "0 produk ditemukan";
    return;
  }

  elements.productContainer.innerHTML = products.map(product => `
    <div class="product-card">
      <img 
        src="${product.GAMBAR || "https://via.placeholder.com/300x200?text=Gambar+Produk"}" 
        alt="${product.NAMA_PRODUK || "Produk"}" 
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia'"
      >
      <div class="product-info">
        <h3>${product.NAMA_PRODUK || "Nama Produk"}</h3>
        <p class="price">${product.HARGA ? formatPrice(product.HARGA) : "Harga tidak tersedia"}</p>
        ${product.KATEGORI ? `<p class="category">${product.KATEGORI}</p>` : ""}
      </div>
    </div>
  `).join("");

  elements.productCount.textContent = `${products.length} produk ditemukan`;
}

// Helper functions
function showLoading() {
  elements.loading.style.display = "block";
  elements.productContainer.innerHTML = "";
}

function hideLoading() {
  elements.loading.style.display = "none";
}

function showError(error) {
  console.error("Error:", error);
  elements.productContainer.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-circle"></i>
      <p>Gagal memuat produk. Silakan coba lagi</p>
      <button onclick="fetchProducts(true)" class="cta-button">
        <i class="fas fa-sync-alt"></i> Muat Ulang
      </button>
    </div>
  `;
}

// Initialize the application
document.addEventListener("DOMContentLoaded", init);
