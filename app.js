// API base
const API = "https://openapi.programming-hero.com/api";

// DOM elements
const categoryList = document.getElementById("categoryList");
const cards = document.getElementById("cards");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const cartList = document.getElementById("cartList");
const cartListMobile = document.getElementById("cartListMobile");
const cartTotal = document.getElementById("cartTotal");
const cartTotalMobile = document.getElementById("cartTotalMobile");
const clearCartBtn = document.getElementById("clearCartBtn");
const clearCartBtnMobile = document.getElementById("clearCartBtnMobile");
const plantModal = document.getElementById("plantModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

// State
let categories = [];
let activeCategoryId = "all";
let cart = []; // {id, name, price}

// Helpers
const fmtBDT = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

const showSpinner = (show) => {
  loading.classList.toggle("hidden", !show);
};

const setActiveButton = (id) => {
  activeCategoryId = id;
  [...categoryList.querySelectorAll("button")].forEach(btn => {
    if (btn.dataset.id === id) {
      btn.classList.add("btn-active", "bg-primary", "text-white");
    } else {
      btn.classList.remove("btn-active", "bg-primary", "text-white");
    }
  });
};

const renderCards = (items=[]) => {
  cards.innerHTML = "";
  emptyState.classList.toggle("hidden", items.length !== 0);

  items.forEach(item => {
    // price may be number or string, coerce
    const price = Number(item.price ?? 0);
    const card = document.createElement("div");
    card.className = "card bg-base-100 shadow";
    card.innerHTML = `
      <figure class="h-40 bg-base-200 overflow-hidden">
        <img src="${item.image || item.img || 'https://images.unsplash.com/photo-1528476513691-07bfa1edb6a3?q=80&w=800&auto=format&fit=crop'}" alt="${item.name}" class="w-full h-full object-cover">
      </figure>
      <div class="card-body">
        <a class="card-title hover:underline cursor-pointer text-primary" data-name-id="${item.id}">${item.name}</a>
        <p class="text-sm line-clamp-2">${item.description || item.short_description || "Healthy, nursery-grown sapling ready for planting."}</p>
        <div class="flex items-center justify-between mt-2 text-sm">
          <span class="badge badge-outline">${item.category || item.category_name || "Tree"}</span>
          <span class="font-semibold">${fmtBDT(price)}</span>
        </div>
        <div class="card-actions justify-end mt-3">
          <button class="btn btn-sm bg-primary text-white hover:bg-green-700" data-add-id="${item.id}" data-add-name="${item.name}" data-add-price="${price}">
            <i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart
          </button>
        </div>
      </div>
    `;
    cards.appendChild(card);
  });

  // bind modal open
  cards.querySelectorAll("[data-name-id]").forEach(a => {
    a.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-name-id");
      await openDetails(id);
    });
  });

  // bind add to cart
  cards.querySelectorAll("[data-add-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-add-id");
      const name = e.currentTarget.getAttribute("data-add-name");
      const price = Number(e.currentTarget.getAttribute("data-add-price"));
      addToCart({id, name, price});
    });
  });
};

const renderCart = () => {
  const render = (ul, totalEl) => {
    ul.innerHTML = "";
    cart.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between text-sm p-2 rounded bg-base-200";
      li.innerHTML = `
        <span>${item.name}</span>
        <span class="flex items-center gap-3">
          <span class="font-medium">${fmtBDT(item.price)}</span>
          <button class="btn btn-xs btn-error text-white" data-rm="${idx}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        </span>
      `;
      ul.appendChild(li);
    });
    const total = cart.reduce((sum, it) => sum + Number(it.price||0), 0);
    totalEl.textContent = fmtBDT(total);

    ul.querySelectorAll("[data-rm]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.currentTarget.getAttribute("data-rm"));
        cart.splice(idx, 1);
        renderCart();
      });
    });
  };

  render(cartList, cartTotal);
  render(cartListMobile, cartTotalMobile);
};

const addToCart = (item) => {
  cart.push(item);
  renderCart();
};

clearCartBtn?.addEventListener("click", () => { cart = []; renderCart(); });
clearCartBtnMobile?.addEventListener("click", () => { cart = []; renderCart(); });

// Fetchers
const fetchJSON = async (url) => {
  showSpinner(true);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  } finally {
    showSpinner(false);
  }
};

const loadCategories = async () => {
  const data = await fetchJSON(`${API}/categories`);
  // API shape: data.categories or data?.data?
  const list = data?.categories || data?.data || [];
  categories = [{ id: "all", category: "All Trees" }, ...list];

  categoryList.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "btn btn-sm";
    btn.dataset.id = String(cat.id);
    btn.textContent = cat.category || cat.category_name || "Category";
    btn.addEventListener("click", () => {
      setActiveButton(String(cat.id));
      if (cat.id === "all") {
        loadAllPlants();
      } else {
        loadPlantsByCategory(cat.id);
      }
    });
    categoryList.appendChild(btn);
  });
  setActiveButton("all");
};

const loadAllPlants = async () => {
  const data = await fetchJSON(`${API}/plants`);
  const items = data?.plants || data?.data || [];
  renderCards(items);
};

const loadPlantsByCategory = async (id) => {
  const data = await fetchJSON(`${API}/category/${id}`);
  const items = data?.plants || data?.data || [];
  renderCards(items);
};

const openDetails = async (id) => {
  modalTitle.textContent = "Loading...";
  modalBody.textContent = "";
  plantModal.showModal();
  const data = await fetchJSON(`${API}/plant/${id}`);
  const item = data?.plant || data?.data || {};
  modalTitle.textContent = item.name || "Plant Details";
  modalBody.innerHTML = `
    <div class="grid md:grid-cols-2 gap-4">
      <img class="rounded-lg w-full h-48 object-cover bg-base-200" src="${item.image || item.img || ''}" alt="${item.name||''}">
      <div class="text-sm space-y-2">
        <p><strong>Category:</strong> ${item.category || item.category_name || "Tree"}</p>
        <p><strong>Price:</strong> ${fmtBDT(item.price || 0)}</p>
        <p class="leading-relaxed">${item.description || item.long_description || "Beautiful, fast-growing tree suitable for urban and rural planting."}</p>
        <button class="btn btn-sm bg-primary text-white hover:bg-green-700" id="modalAddBtn">
          <i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart
        </button>
      </div>
    </div>
  `;
  document.getElementById("modalAddBtn")?.addEventListener("click", () => {
    addToCart({ id: item.id, name: item.name, price: Number(item.price||0) });
  });
};

// Init
(async function init(){
  await loadCategories();
  await loadAllPlants();
  renderCart();
})();

function displaymsg(msg, type = "SUCCESS") {
    const notify = document.createElement("div");
    notify.className = `fixed top-4 right-0 left-6 z-50 p-2 rounded-lg shadow-lg transition-opacity-1 duration-300 ${type.toLowerCase() === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`;
    notify.textContent = msg;

    document.body.appendChild(notify);
    setTimeout(() => {
        notify.remove();
    }, 5000);
}











function handleFormSubmit(event) {
  event.preventDefault(); // Prevent the default form submission behavior   
  const form = new FormData(event.target);
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const trees = document.getElementById("tree").value;
  displaymsg(`Thank you, ${name || "Donor"}! You have donated ${trees} Trees. Your donation form has been submitted successfully. We will contact you at ${email || "your email"} soon`);
  event.target.reset(); // Reset the form fields
}


window.handleFormSubmit = handleFormSubmit;