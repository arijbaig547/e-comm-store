import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)

let cartCount = 0;
let cartBtn = document.getElementById("cartIcon")
let cartSidebar = document.getElementById("cartSidebar");
let cartItemsContainer = document.getElementById("cartItems");
let closeCart = document.getElementById("closeCart");
const placeOrderBtn = document.querySelector("#placeOrderBtn");
let cartCountDiv = cartBtn.querySelector(".cart-count");
cartCountDiv.textContent = cartCount;

// ===== Notification Bell =====
let notifIcon = document.getElementById("notifIcon");
let notifCountDiv = notifIcon?.querySelector(".notif-count");
let notifDropdown = notifIcon?.querySelector(".notif-dropdown");
let notifCount = 0;

// Toggle notification dropdown
notifIcon?.addEventListener("click", () => {
  if (!notifDropdown) return;
  notifDropdown.style.display = notifDropdown.style.display === "none" ? "block" : "none";
});

// Add notification
function addNotification(message) {
  notifCount++;
  if(notifCountDiv) notifCountDiv.textContent = notifCount;

  if(!notifDropdown) return;
  // Remove default msg
  if (notifDropdown.querySelector("p") && notifDropdown.querySelector("p").textContent === "No notifications yet.") {
    notifDropdown.innerHTML = "";
  }
  const p = document.createElement("p");
  p.textContent = message;
  notifDropdown.prepend(p);
}

// Show/Hide Place Order Button
function updatePlaceOrderButton() {
  if (cartCount > 0) {
    placeOrderBtn.style.display = "block";
  } else {
    placeOrderBtn.style.display = "none";
  }
}

// Fetch Products from Supabase
let getDatafromDB = async () => {
  let productGrid = document.querySelector(".grid")
  productGrid.innerHTML = `<p>Loading items...</p>` 

  const { data, error } = await supabase
    .from('items_table')
    .select()

  if (error) {
    console.error("Error:", error)
    productGrid.innerHTML = `<p>Failed to load items.</p>`
  } else {
    productGrid.innerHTML = "" 

    for (let item of data) {
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('item-images')
        .createSignedUrl(item.item_image, 60 * 60)

      if (signedUrlError) {
        console.error("Image signed URL error:", signedUrlError)
        continue
      }

      // Add product card
      productGrid.innerHTML += `
        <article class="product" tabindex="0">
          <img class="thumb" src="${signedUrlData.signedUrl}" alt="${item.item_name}">
          <p class="p-title">${item.item_name}</p>
          <p class="p-desc">${item.item_description}</p>
          <div class="p-row">
            <div class="price">$${item.item_price}</div>
            <button class="add-btn">Add</button>
          </div>
        </article>
      `
    }

    // Add to Cart logic
    document.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        let product = this.closest(".product");
        let title = product.querySelector(".p-title").textContent;
        let price = product.querySelector(".price").textContent;
        let img = product.querySelector(".thumb").src;

        cartCount++;
        cartCountDiv.textContent = cartCount;

        // Remove empty message
        let emptyMsg = cartItemsContainer.querySelector("p");
        if (emptyMsg) emptyMsg.remove();

        // Check existing item
        let existingItem = [...cartItemsContainer.querySelectorAll(".cart-item")]
          .find(item => item.querySelector("p").textContent === title);

        if (existingItem) {
          let qtySpan = existingItem.querySelector(".qty");
          qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
        } else {
          let div = document.createElement("div");
          div.classList.add("cart-item");
          div.innerHTML = `
            <img src="${img}" alt="${title}">
            <div>
              <p style="margin:0;font-weight:600">${title}</p>
              <span style="color:var(--muted);font-size:14px">${price}</span>
              <div style="margin-top:5px;">
                <button class="decrease">-</button>
                <span class="qty">1</span>
                <button class="increase">+</button>
              </div>
            </div>
          `;
          cartItemsContainer.appendChild(div);

          // Increase
          div.querySelector(".increase").addEventListener("click", () => {
            let qtySpan = div.querySelector(".qty");
            qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
            cartCount++;
            cartCountDiv.textContent = cartCount;
            updatePlaceOrderButton();
          });

          // Decrease
          div.querySelector(".decrease").addEventListener("click", () => {
            let qtySpan = div.querySelector(".qty");
            let currentQty = parseInt(qtySpan.textContent);
            if (currentQty > 1) {
              qtySpan.textContent = currentQty - 1;
            } else {
              div.remove();
            }
            cartCount--;
            cartCountDiv.textContent = cartCount;

            if (cartCount === 0) {
              cartItemsContainer.innerHTML = "<p>No items yet.</p>";
            }
            updatePlaceOrderButton();
          });
        }

        updatePlaceOrderButton();
      });
    });
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const fullName = data.user.user_metadata.full_name || data.user.email;
    document.getElementById("userNameBtn").style.background="none"
    document.getElementById("userNameBtn").innerText += fullName;
  }
});

// Sidebar open/close
cartBtn.addEventListener("click", () => cartSidebar.classList.add("active"));
closeCart.addEventListener("click", () => cartSidebar.classList.remove("active"));

// Load products
getDatafromDB();
updatePlaceOrderButton();

// Navbar toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});

// Place Order
// Place Order
placeOrderBtn.addEventListener("click", async () => {
  let items = [...cartItemsContainer.querySelectorAll(".cart-item")].map(item => ({
    item_name: item.querySelector("p").textContent,
    quantity: parseInt(item.querySelector(".qty").textContent)
  }));

  if (items.length === 0) {
    Swal.fire({
      icon: "error",
      title: "Cart is empty!",
      text: "Please add some items before placing an order."
    });
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    Swal.fire({
      icon: "warning",
      title: "Login required",
      text: "Please login first to place your order."
    });
    return;
  }

  const userId = userData.user.id;

  try {
    // Insert items into cart_table
    for (let item of items) {
      const { error } = await supabase
        .from("cart_table")
        .insert({
          userID: userId,
          item_name: item.item_name,
          quantity: item.quantity
        });
      if (error) throw error;
    }

    // Add notification
    await supabase
      .from("notifications")
      .insert({ user_id: userId, message: "You have a new order", read: false });

    addNotification("Your order is being confirmed");

    Swal.fire({
      icon: "success",
      title: "Order placed!",
      text: "✅ Your order has been placed."
    });

    // Reset cart
    cartItemsContainer.innerHTML = "<p>No items yet.</p>";
    cartCount = 0;
    cartCountDiv.textContent = cartCount;
    updatePlaceOrderButton();

  } catch (err) {
    console.error("Place order error:", err);
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: "❌ Failed to place order. Try again later."
    });
  }
});


// Footer year update
document.getElementById("year").textContent = new Date().getFullYear();
