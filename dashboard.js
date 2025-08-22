import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ===============================
// SUPABASE INIT
// ===============================
const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener("DOMContentLoaded", () => {
  const productsDiv = document.querySelector(".products-grid")

  // ===============================
  // FETCH PRODUCTS
  // ===============================
  const getStoredData = async () => {
    const { data, error } = await supabase.from("items_table").select()
    if (error) return console.error(error)

    productsDiv.innerHTML = ""
    for (let item of data) {
      const { data: signedUrlData } = await supabase
        .storage.from("item-images")
        .createSignedUrl(item.item_image, 60 * 60)

      productsDiv.innerHTML += `
        <div class="product-card" data-id="${item.id}">
          <img class="product-thumb" src="${signedUrlData.signedUrl}" alt="product">
          <p class="product-title">${item.item_name}</p>
          <p class="product-price">$${item.item_price}</p>
          <p class="product-desc">${item.item_description}</p>
          <button class="btn-edit btn btn-sm btn-warning">✏️ Edit</button>
          <button class="btn-delete btn btn-sm btn-danger">🗑 Delete</button>
        </div>
      `
    }

    // Delete buttons
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const card = e.target.closest(".product-card")
        const itemId = card.getAttribute("data-id")
        const { error } = await supabase.from("items_table").delete().eq("id", itemId)
        if (!error) getStoredData()
      })
    })

    // Edit buttons
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const card = e.target.closest(".product-card")
        const itemId = card.getAttribute("data-id")
        const { data: editData, error } = await supabase
          .from("items_table")
          .select()
          .eq("id", itemId)
          .single()
        if (error) return alert(error.message)

        // fill modal fields
        document.getElementById('editItemId').value = editData.id
        document.getElementById('editItemName').value = editData.item_name
        document.getElementById('editItemPrice').value = editData.item_price
        document.getElementById('editItemDesc').value = editData.item_description

        const signedUrl = await supabase
          .storage.from('item-images')
          .createSignedUrl(editData.item_image, 60 * 60)

        document.getElementById('editPreviewImage').src = signedUrl.data.signedUrl

        new bootstrap.Modal(document.getElementById('editItemModal')).show()
      })
    })
  }

  // First load
  getStoredData()

  // ===============================
  // ADD ITEM
  // ===============================
  document.getElementById("submitAdd").addEventListener("click", async () => {
    const name = document.getElementById("itemName").value
    const price = document.getElementById("itemPrice").value
    const desc = document.getElementById("itemDesc").value
    const imageFile = document.getElementById("itemImage").files[0]

    if (!name || !price || !desc) return alert("Please fill all fields")
    if (!imageFile) return alert("Please select an image")

    const filePath = `${Date.now()}_${imageFile.name}`
    const { error: uploadError } = await supabase.storage.from("item-images").upload(filePath, imageFile)
    if (uploadError) return alert("Image upload failed")

    const { error: insertError } = await supabase.from("items_table").insert({
      item_name: name,
      item_price: price,
      item_description: desc,
      item_image: filePath
    })

    if (insertError) {
      console.error(insertError)
      alert("Error adding item")
    } else {
      alert("Item added successfully ✅")
      bootstrap.Modal.getInstance(document.getElementById("addItemModal")).hide()
      getStoredData()
      document.getElementById("addItemForm").reset()
      document.getElementById("previewImage").style.display = "none"
    }
  })

  // ===============================
  // UPDATE ITEM
  // ===============================
document.getElementById("saveEditBtn").addEventListener("click", async () => {

    const id = document.getElementById("editItemId").value
    const name = document.getElementById("editItemName").value
    const price = document.getElementById("editItemPrice").value
    const desc = document.getElementById("editItemDesc").value
    const imageFile = document.getElementById("editItemImage").files[0]

    let updateData = {
      item_name: name,
      item_price: price,
      item_description: desc
    }

    if (imageFile) {
      const filePath = `${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from("item-images").upload(filePath, imageFile)
      if (uploadError) return alert("Image upload failed")
      updateData.item_image = filePath
    }

    const { error: updateError } = await supabase.from("items_table").update(updateData).eq("id", id)
    if (updateError) {
      console.error(updateError)
      alert("Error updating item")
    } else {
      alert("Item updated successfully ✅")
      bootstrap.Modal.getInstance(document.getElementById("editItemModal")).hide()
      getStoredData()
    }
  })
})


// ===============================
// ADMIN NOTIFICATIONS BELL
// ===============================
const topbar = document.querySelector('.topbar .container-fluid')
const bellWrapper = document.createElement('div')
bellWrapper.style.position = 'relative'
bellWrapper.style.marginLeft = '20px'
bellWrapper.innerHTML = `
  <button id="notifBell" class="btn btn-outline-secondary position-relative">
    🔔
    <span id="notifCount" class="badge bg-danger position-absolute top-0 start-100 translate-middle">0</span>
  </button>
`
topbar.appendChild(bellWrapper)

const notifCount = document.getElementById('notifCount')
const notifBell = document.getElementById('notifBell')

const notifPanel = document.createElement('div')
notifPanel.style.position = 'absolute'
notifPanel.style.top = '50px'
notifPanel.style.right = '0'
notifPanel.style.width = '300px'
notifPanel.style.maxHeight = '400px'
notifPanel.style.overflowY = 'auto'
notifPanel.style.background = '#fff'
notifPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
notifPanel.style.borderRadius = '10px'
notifPanel.style.padding = '10px'
notifPanel.style.display = 'none'
notifPanel.style.zIndex = '9999'
bellWrapper.appendChild(notifPanel)

notifBell.addEventListener('click', () => {
  notifPanel.style.display = notifPanel.style.display === 'none' ? 'block' : 'none'
})

// ===============================
// FETCH & UPDATE NOTIFICATIONS
// ===============================
async function fetchNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order('id', { ascending: false })

  if (error) return console.error(error)

  notifPanel.innerHTML = ""
  let unreadCount = 0

  data.forEach(n => {
    const div = document.createElement("div")
    div.style.borderBottom = "1px solid #eee"
    div.style.padding = "5px"
    div.style.display = "flex"
    div.style.justifyContent = "space-between"
    div.style.alignItems = "center"

    const msg = document.createElement("span")
    msg.textContent = n.message
    div.appendChild(msg)

    if (!n.read) unreadCount++

    // Only pending notifications have Accept/Reject
    if (n.message.startsWith("Order for")) {
      const btnWrapper = document.createElement("div")

      const acceptBtn = document.createElement("button")
      acceptBtn.textContent = "✅ Accept"
      acceptBtn.classList.add("btn", "btn-sm", "btn-success")
      acceptBtn.style.marginRight = "5px"
      acceptBtn.addEventListener("click", () => handleNotification(n.id, "accepted"))

      const rejectBtn = document.createElement("button")
      rejectBtn.textContent = "❌ Reject"
      rejectBtn.classList.add("btn", "btn-sm", "btn-danger")
      rejectBtn.addEventListener("click", () => handleNotification(n.id, "rejected"))

      btnWrapper.appendChild(acceptBtn)
      btnWrapper.appendChild(rejectBtn)
      div.appendChild(btnWrapper)
    }

    notifPanel.appendChild(div)
  })

  notifCount.textContent = unreadCount
}

async function handleNotification(notificationId, action) {
  const { data: noteData } = await supabase.from('notifications').select('*').eq('id', notificationId).single()
  if (!noteData) return

  const itemName = noteData.message.replace('Order for ', '')

  // Update cart status for that user and item
  await supabase.from('cart_table').update({ status: action }).eq('userID', noteData.user_id).eq('item_name', itemName)

  // Mark notification as read
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

  // Notify user about the action
  await supabase.from('notifications').insert({
    user_id: noteData.user_id,
    message: `Your order "${itemName}" has been ${action}`,
    read: false
  })

  fetchNotifications()
}

fetchNotifications()
setInterval(fetchNotifications, 5000)
