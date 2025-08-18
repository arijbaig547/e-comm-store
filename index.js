import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)

let cartCount = 0;
let cartBtn = document.querySelector(".btn-primary[aria-label='Cart']");
let cartSidebar = document.getElementById("cartSidebar");
let cartItemsContainer = document.getElementById("cartItems");
let closeCart = document.getElementById("closeCart");

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

      // ✅ Add product card
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

document.querySelectorAll(".add-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    let product = this.closest(".product");
    let title = product.querySelector(".p-title").textContent;
    let price = product.querySelector(".price").textContent;
    let img = product.querySelector(".thumb").src;

    cartCount++;
    cartBtn.textContent = `Cart (${cartCount})`;

    // ✅ sirf "No items yet." hatana hai
    let emptyMsg = cartItemsContainer.querySelector("p");
    if (emptyMsg) {
      emptyMsg.remove();
    }

    // ✅ Check if item already in cart
    let existingItem = [...cartItemsContainer.querySelectorAll(".cart-item")]
      .find(item => item.querySelector("p").textContent === title);

    if (existingItem) {
      // agar item pehle se hai → quantity update karo
      let qtySpan = existingItem.querySelector(".qty");
      let currentQty = parseInt(qtySpan.textContent);
      qtySpan.textContent = currentQty + 1;
    } else {
      // naya item add karo
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

      // ✅ Increase button
      div.querySelector(".increase").addEventListener("click", () => {
        let qtySpan = div.querySelector(".qty");
        qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
        cartCount++;
        cartBtn.textContent = `Cart (${cartCount})`;
      });

      // ✅ Decrease button
      div.querySelector(".decrease").addEventListener("click", () => {
        let qtySpan = div.querySelector(".qty");
        let currentQty = parseInt(qtySpan.textContent);
        if (currentQty > 1) {
          qtySpan.textContent = currentQty - 1;
        } else {
          div.remove();
        }
        cartCount--;
        cartBtn.textContent = `Cart (${cartCount})`;

        // agar cart empty ho jaye
        if (cartCount === 0) {
          cartItemsContainer.innerHTML = "<p>No items yet.</p>";
        }
      });
    }
  });
});

  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const fullName = data.user.user_metadata.full_name || data.user.email;
    document.getElementById("userNameBtn").innerText = fullName;
  }
});


// Sidebar open/close
cartBtn.addEventListener("click", () => {
  cartSidebar.classList.add("active");
});


closeCart.addEventListener("click", () => {
  cartSidebar.classList.remove("active");
});

// ✅ Load products
getDatafromDB()

// ✅ Navbar toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});

// ✅ Footer year update
document.getElementById("year").textContent = new Date().getFullYear();
