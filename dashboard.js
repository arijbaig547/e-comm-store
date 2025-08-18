import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('addItemForm')
  const submitBtn = document.getElementById('submitAdd')
  const previewImage = document.getElementById('previewImage')
  const itemImage = document.getElementById('itemImage')

  const getStoredData = async () => {
    const { data, error } = await supabase
      .from("items_table")
      .select()

    let productsDiv = document.querySelector(".products-grid")

    if (error) {
      console.error("Fetch Error:", error)
    } else {
      productsDiv.innerHTML = ""

      for (let item of data) {
        
        const { data: signedUrlData, error: signedUrlError } = await supabase
          .storage
          .from('item-images')
          .createSignedUrl(item.item_image, 60 * 60)

        if (signedUrlError) {
          console.error("Signed URL error:", signedUrlError)
          continue
        }

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

      // ✅ Delete button handler
      document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const card = e.target.closest(".product-card")
          const itemId = card.getAttribute("data-id")

          const { error } = await supabase
            .from("items_table")
            .delete()
            .eq("id", itemId)

          if (error) {
            alert("Delete failed: " + error.message)
          } else {
            alert("Item deleted ✅")
            getStoredData()
          }
        })
      })

      // ✅ Edit button handler
      document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const card = e.target.closest(".product-card")
          const itemId = card.getAttribute("data-id")

          // Fetch item data
          const { data: editData, error } = await supabase
            .from("items_table")
            .select()
            .eq("id", itemId)
            .single()

          if (error) {
            alert("Error fetching item: " + error.message)
            return
          }

          // Fill modal fields
          document.getElementById('editItemId').value = editData.id
          document.getElementById('editItemName').value = editData.item_name
          document.getElementById('editItemPrice').value = editData.item_price
          document.getElementById('editItemDesc').value = editData.item_description

          const signedUrl = await supabase
            .storage
            .from('item-images')
            .createSignedUrl(editData.item_image, 60 * 60)

          document.getElementById('editPreviewImage').src = signedUrl.data.signedUrl

          // Show modal
          const editModal = new bootstrap.Modal(document.getElementById('editItemModal'))
          editModal.show()
        })
      })
    }
  }

  window.addEventListener("DOMContentLoaded", getStoredData)

  
  if (itemImage) {
    itemImage.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        previewImage.src = URL.createObjectURL(file)
        previewImage.style.display = "block"
      }
    })
  }


  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const name = document.getElementById('itemName').value
      const price = document.getElementById('itemPrice').value
      const desc = document.getElementById('itemDesc').value
      const file = itemImage.files[0]

      if (!name || !price || !desc || !file) {
        alert("Please fill all fields and select an image")
        return
      }

      const fileName = `${Date.now()}-${file.name}`
      const { error: imgError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (imgError) {
        alert("Image upload failed: " + imgError.message)
        return
      }

      const { error } = await supabase
        .from('items_table')
        .insert([
          {
            item_name: name,
            item_price: price,
            item_description: desc,
            item_image: fileName
          }
        ])

      if (error) {
        alert("Item insert failed: " + error.message)
      } else {
        alert("Item added successfully! ✅")
        form.reset()
        previewImage.style.display = "none"

        const modalElement = document.getElementById('addItemModal')
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement)
          modal.hide()
        }

        getStoredData()
      }
    })
  }


  document.getElementById('saveEditBtn').addEventListener("click", async () => {
    const id = document.getElementById('editItemId').value
    const name = document.getElementById('editItemName').value
    const price = document.getElementById('editItemPrice').value
    const desc = document.getElementById('editItemDesc').value
    const file = document.getElementById('editItemImage').files[0]

    let updateData = {
      item_name: name,
      item_price: price,
      item_description: desc
    }

    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      const { error: imgError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (imgError) {
        alert("Image upload failed: " + imgError.message)
        return
      }

      updateData.item_image = fileName
    }

    const { error: updateError } = await supabase
      .from("items_table")
      .update(updateData)
      .eq("id", id)

    if (updateError) {
      alert("Update failed: " + updateError.message)
    } else {
      alert("Item updated ✅")
      const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'))
      modal.hide()
      getStoredData()
    }
  })
})
