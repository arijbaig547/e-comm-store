import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)

let cartCount = 0;
let cartBtn = document.getElementById("cartIcon")
let cartSidebar = document.getElementById("cartSidebar");
let cartItemsContainer = document.getElementById("cartItems");
let closeCart = document.getElementById("closeCart");
let placeOrderBtn = document.getElementById("placeOrderBtn"); // ✅ button reference
let cartCountDiv = cartBtn.querySelector(".cart-count");
cartCountDiv.textContent = cartCount;


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

    // ✅ Update cart count in the span
function updateCartCount() {
  const cartCountDiv = document.querySelector("#cartIcon .cart-count");
  if(cartCountDiv) cartCountDiv.textContent = cartCount;
}

// Jab item add ho
cartCount++;
updateCartCount();

// Jab item quantity increase ho
cartCount++;
updateCartCount();

// Jab item quantity decrease ho
cartCount--;
updateCartCount();

    // ✅ Add to Cart
    document.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        let product = this.closest(".product");
        let title = product.querySelector(".p-title").textContent;
        let price = product.querySelector(".price").textContent;
        let img = product.querySelector(".thumb").src;

        cartCount++;
        cartBtn.textContent = `Cart (${cartCount})`;

        // ✅ remove empty msg
        let emptyMsg = cartItemsContainer.querySelector("p");
        if (emptyMsg) {
          emptyMsg.remove();
        }

        // ✅ Check if item already in cart
        let existingItem = [...cartItemsContainer.querySelectorAll(".cart-item")]
          .find(item => item.querySelector("p").textContent === title);

        if (existingItem) {
          let qtySpan = existingItem.querySelector(".qty");
          let currentQty = parseInt(qtySpan.textContent);
          qtySpan.textContent = currentQty + 1;
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
            cartBtn.textContent = `Cart (${cartCount})`;
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
            cartBtn.textContent = `Cart (${cartCount})`;

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
cartBtn.addEventListener("click", () => {
  cartSidebar.classList.add("active");
});
closeCart.addEventListener("click", () => {
  cartSidebar.classList.remove("active");
});

// ✅ Load products
getDatafromDB()
updatePlaceOrderButton();

// ✅ Navbar toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});


//Placing Order//

// ✅ Place Order and Save to Supabase
// ✅ Place Order and Save to Supabase
// placeOrderBtn.addEventListener("click", async () => {
//   let items = [...cartItemsContainer.querySelectorAll(".cart-item")].map(item => {
//     return {
//       item_name: item.querySelector("p").textContent,
//       quantity: parseInt(item.querySelector(".qty").textContent)
//     }
//   });

//   if (items.length === 0) {
//     alert("❌ Cart is empty!");
//     return;
//   }

//   // ✅ Get logged-in user
//   const { data: userData, error: userError } = await supabase.auth.getUser();
//   if (userError || !userData.user) {
//     alert("❌ Please login first!");
//     return;
//   }

//   const userId = userData.user.id; // <-- yeh uuid hai jo supabase auth deta hai

//   // ✅ Add userID to every item
//   const itemsWithUser = items.map(item => ({
//     ...item,
//     userID: userId
//   }));

//   const { data, error } = await supabase
//     .from("cart_table")
//     .insert(itemsWithUser);

//   if (error) {
//     console.error("Error inserting order:", error);
//     alert("❌ Failed to place order!");
//   } else {
//     console.log("Inserted:", data);
//     alert("✅ Order Placed Successfully!");
//     cartItemsContainer.innerHTML = "<p>No items yet.</p>";
//     cartCount = 0;
//     cartBtn.textContent = `Cart (${cartCount})`;
//     updatePlaceOrderButton();
//   }
// });








// ✅ Footer year update
document.getElementById("year").textContent = new Date().getFullYear();