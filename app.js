
const API = "https://openapi.programming-hero.com/api";

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


let categories = [];
let activeCategoryId = "all";
let cart = []; // {id, name, price}


const fmtBDT = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

const showSpinner = (show) => {
  loading.classList.toggle("hidden", !show);
};

const setActiveButton = (id) => {
  activeCategoryId = id;
  [...categoryList.querySelectorAll("button")].forEach(btn => {
    if (btn.dataset.id === id) {
      btn.classList.add("btn-active", "bg-primary", "text-black");
    } else {
      btn.classList.remove("btn-active", "bg-primary", "text-black");
    }
  });
};


function pickId(item = {}) {
  if (item.id) return item.id;
  if (item._id) return item._id.$oid || item._id; 
  if (item.slug) return item.slug;
  if (item.unique_id) return item.unique_id;
  return "";
}

// Handle duplicate items 
function doubleHandler(item) {
  const existing = cart.find(p => p.id === item.id);

  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
    existing.price = Number(item.price);
  } else {
    cart.push({ ...item, qty: 1 });
  }

  renderCart();

  // just mobile er jonne

  if (window.innerWidth < 768) {
    displaymsg(`${item.name} added to cart!`);
  }
}






const renderCards = (items=[]) => {
  cards.innerHTML = "";
  emptyState.classList.toggle("hidden", items.length !== 0);

  items.forEach(item => {
    // normalize fields with many possible keys
    const name = item.name || item.title || item.plant_name || "Unknown Plant";
    const img = item.image || item.img || item.thumbnail || "";
    const price = Number(item.price ?? item.cost ?? 0);
    const category = item.category || item.category_name || item.type || "Tree";
    const idValue = pickId(item);

    const card = document.createElement("div");
    card.className = "card bg-base-100 shadow-2xl hover:shadow-green-700/50 hover:scale-[1.02] transition-transform duration-300";
    card.innerHTML = `
      <figure class="h-40 bg-base-200 overflow-hidden shadow-2xl flex items-center justify-center">
        <img src="${img }" alt="${name}" class="w-50 h-50 object-cover">
      </figure>
      <div class="card-body">
        <a class="card-title hover:underline hover: :focus-within outline-4 cursor-pointer text-primary" data-name-id="${idValue}">${name}</a>
        <p class="text-sm line-clamp-2">${item.description || item.short_description || "Healthy, nursery-grown sapling ready for planting."}</p>
        <div class="flex items-center justify-between mt-2 text-sm">
          <span class="badge badge-outline">${category}</span>
          <span class="font-semibold">${fmtBDT(price)}</span>
        </div>
        <div class="card-actions justify-end mt-3">
          <button class="btn btn-sm bg-primary text-white hover:bg-green-700" data-add-id="${idValue}" data-add-name="${name}" data-add-price="${price}">
            <i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart
          </button>
        </div>
      </div>
    `;
    cards.appendChild(card);
  });

  // bind modal 
  cards.querySelectorAll("[data-name-id]").forEach(a => {
    a.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-name-id");
      if (!id) {
        modalTitle.textContent = "Details not available";
        modalBody.textContent = "This item does not have a valid id to fetch details.";
        plantModal.showModal();
        return;
      }
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

function renderCart() {
  function render(ul, totalEl) {
    ul.innerHTML = "";
    cart.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between text-sm p-2 rounded bg-base-200";
      li.innerHTML = `
        <span>${item.name} ${item.qty > 1 ? `x ${item.qty}` : ""}</span>
        <span class="flex items-center gap-3">
          <span class="font-medium">${fmtBDT(item.qty * item.price)}</span>
          <button class="btn btn-xs btn-error text-white" data-rm="${idx}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </span>
      `;
      ul.appendChild(li);
    });

    const total = cart.reduce((sum, it) => sum + (it.qty * it.price), 0);
    totalEl.textContent = fmtBDT(total);

    ul.querySelectorAll("[data-rm]").forEach(btn =>
      btn.addEventListener("click", e => {
        cart.splice(Number(btn.dataset.rm), 1);
        renderCart();
      })
    );
  }
  render(cartList, cartTotal);
  render(cartListMobile, cartTotalMobile);
}


function addToCart(item) {
  doubleHandler(item);
}


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

function extractPlant(data = {}) {
  
  if (data.plant) return data.plant;
  
  
  if (data.data) {
 
    if (Array.isArray(data.data)) {
      return data.data.find(el => el?.name || el?.image || el?.plant) 
          || data.data[0];
    }
 
    if (data.data.plant) return data.data.plant;
    if (data.data.name || data.data.image) return data.data;
  }


  if (data.name || data.image) return data;


  for (const key in data) {
    const val = data[key];
    if (val && typeof val === "object") {
      if (val.name || val.image) return val;
    }
  }

  return {};
}


const openDetails = async (id) => {
  modalTitle.textContent = "Loading...";
  modalBody.innerHTML = `<div class="w-full h-48 flex items-center justify-center"><span class="loading loading-spinner text-primary"></span></div>`;
  plantModal.showModal();

  const data = await fetchJSON(`${API}/plant/${encodeURIComponent(id)}`);
  const item = extractPlant(data) || {};

  // fallback values
  const name = item.name || item.title || "Plant Details";
  const image = item.image || item.img || item.thumbnail;
  const category = item.category || item.category_name || item.type || "Tree";
  const price = Number(item.price || item.cost || 0);
  const desc = item.description || item.long_description || item.details || "No detailed description available.";

  modalTitle.textContent = name;
//   modalBody.innerHTML = `
//     <div class="grid md:grid-cols-2 gap-4">
//       <img class="rounded-lg w-full h-48 object-cover bg-base-200" src="${image}" alt="${name}">
//       <div class="text-sm space-y-2">
//         <p><strong>Category:</strong> ${category}</p>
//         <p><strong>Price:</strong> ${fmtBDT(price)}</p>
//         <p class="leading-relaxed">${desc}</p>
//         <button class="btn btn-sm bg-primary text-white hover:bg-green-700" id="modalAddBtn">
//           <i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart
//         </button>
//       </div>
//     </div>
//   `;


modalBody.innerHTML =  `
                        <div class="h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                            <img class="rounded-lg w-full h-ful object-cover bg-base-200" src="${image}" alt="${name}">
                           
                            <div class="w-full h-full flex items-center justify-center bg-green-50 rounded-lg" style="display: none;">
                           
                            </div>
                        </div>
                            
                        <p><strong>Category:</strong> ${category}</p>
                        <br>
                        <p><strong>Price:</strong> ${fmtBDT(price)}</p>      
                        <br>   
                        <p class="leading-relaxed"><strong>Description:</strong> ${desc}</p>

                        </div>
        
                      
                   
                      
                       
                    </div>
                </div>`;






  //age id then bind
  const addId = pickId(item) || id;
  document.getElementById("modalAddBtn")?.addEventListener("click", () => {
    addToCart({ id: addId, name, price });
  });
};

// Init
(async function init(){
  await loadCategories();
  await loadAllPlants();
  renderCart();
})();

// sobgula loade korar function
async function loadCategories() {
  const data = await fetchJSON(`${API}/categories`);
  const list = data?.categories || data?.data || [];
  categories = [{ id: "all", category: "All Trees" }, ...list];

  categoryList.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "btn btn-sm hover:bg-green-700";
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
}

async function loadAllPlants() {
  const data = await fetchJSON(`${API}/plants`);
  const items = data?.plants || data?.data || [];
  renderCards(items);
}

async function loadPlantsByCategory(id) {
  const data = await fetchJSON(`${API}/category/${id}`);
  const items = data?.plants || data?.data || [];
  renderCards(items);
}


// Init
(async function init(){
  await loadCategories();
  await loadAllPlants();
  renderCart();
})();

function displaymsg(msg, type = "SUCCESS") {
  const notify = document.createElement("div");

  // Auto width based on text length
  const fontSize = msg.length > 50 ? "text-sm" : "text-base";

  notify.className = `
    fixed top-4 right-4 z-50 
    px-4 py-2 rounded-lg shadow-lg
    transition-opacity duration-400
    ${fontSize}
    ${type.toLowerCase() === "success" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}
  `;

  notify.textContent = msg;

  document.body.appendChild(notify);

  setTimeout(() => notify.remove(), 4000);
}












function handleFormSubmit(event) {
  event.preventDefault(); 
  const form = new FormData(event.target);
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const trees = document.getElementById("tree").value;
  displaymsg(`Thank you, ${name || "Donor"}! You have donated ${trees} Trees. Your donation form has been submitted successfully. We will contact you  soon`);
  event.target.reset(); 
}


window.handleFormSubmit = handleFormSubmit;