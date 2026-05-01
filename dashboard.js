const adminProductList = document.getElementById('admin-product-list');
const addModal = document.getElementById('add-modal');
const openModalBtn = document.getElementById('open-add-modal');
const closeModalBtn = document.getElementById('close-modal');
const addProductForm = document.getElementById('add-product-form');

const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
let productToDeleteId = null;

let adminProducts = [];
let editingProductId = null;

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        adminProducts = await response.json();
        renderAdminProducts();
    } catch (err) {
        console.error('Error loading products', err);
    }
}

function renderAdminProducts() {
    if (!adminProductList) return;
    
    adminProductList.innerHTML = adminProducts.map((p, index) => {
        const serialNo = index + 1;
        if (p.id === editingProductId) {
            return `
                <tr>
                    <td>${serialNo}</td>
                    <td><img src="${p.image}" alt="${p.name}"></td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span>₹</span>
                            <input type="number" id="edit-price-input-${p.id}" value="${p.price}" style="width: 80px; padding: 6px; background: rgba(0,0,0,0.8); color: white; border: 1px solid #d4af37; border-radius: 4px; font-family: inherit;">
                        </div>
                    </td>
                    <td>
                        <button class="btn-edit" style="color: #2ed573; border-color: #2ed573;" onclick="savePrice(${p.id})"><i class="fas fa-check"></i> Save</button>
                        <button class="btn-danger" onclick="cancelEdit()"><i class="fas fa-times"></i> Cancel</button>
                    </td>
                </tr>
            `;
        }
        
        return `
            <tr>
                <td>${serialNo}</td>
                <td><img src="${p.image}" alt="${p.name}"></td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>₹${p.price.toFixed(2)}</td>
                <td>
                    <button class="btn-edit" onclick="startEditPrice(${p.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteProduct(id) {
    productToDeleteId = id;
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        productToDeleteId = null;
        deleteModal.classList.remove('active');
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!productToDeleteId) return;
        
        try {
            const response = await fetch(`/api/admin/products/${productToDeleteId}`, { method: 'DELETE' });
            if(response.ok) {
                deleteModal.classList.remove('active');
                productToDeleteId = null;
                loadProducts();
            } else {
                alert('Error deleting product');
            }
        } catch (err) {
            console.error(err);
        }
    });
}

function startEditPrice(id) {
    editingProductId = id;
    renderAdminProducts();
}

function cancelEdit() {
    editingProductId = null;
    renderAdminProducts();
}

async function savePrice(id) {
    const inputEl = document.getElementById(`edit-price-input-${id}`);
    if (!inputEl) return;
    
    const newPrice = parseFloat(inputEl.value);
    if (isNaN(newPrice) || newPrice <= 0) {
        alert("Please enter a valid positive number.");
        return;
    }

    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: newPrice })
        });
        
        if(response.ok) {
            editingProductId = null;
            loadProducts(); // Refresh list to show new price
        } else {
            alert('Error updating price');
        }
    } catch (err) {
        console.error(err);
    }
}

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => addModal.classList.add('active'));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => addModal.classList.remove('active'));
}

if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const category = document.getElementById('prod-category').value;
        const imageFile = document.getElementById('prod-image-file').files[0];

        if (!imageFile) {
            alert("Please select an image.");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', parseFloat(price));
        formData.append('category', category);
        formData.append('image', imageFile);

        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                body: formData
            });

            if(response.ok) {
                addModal.classList.remove('active');
                addProductForm.reset();
                loadProducts();
            } else {
                const errData = await response.json();
                alert(errData.message || 'Failed to add product');
            }
        } catch (err) {
            console.error(err);
        }
    });
}

// Orders Logic
let adminOrders = [];
let adminCustomers = [];

function switchTab(tab) {
    document.getElementById('tab-products').classList.remove('active');
    document.getElementById('tab-orders').classList.remove('active');
    document.getElementById('tab-customers').classList.remove('active');
    
    document.getElementById('view-products').style.display = 'none';
    document.getElementById('view-orders').style.display = 'none';
    document.getElementById('view-customers').style.display = 'none';
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`view-${tab}`).style.display = 'block';
    
    if (tab === 'orders') {
        loadOrders();
    } else if (tab === 'customers') {
        loadCustomers();
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        adminOrders = await response.json();
        renderAdminOrders();
    } catch (err) {
        console.error('Error loading orders', err);
    }
}

function renderAdminOrders() {
    const adminOrderList = document.getElementById('admin-order-list');
    if (!adminOrderList) return;
    
    if (adminOrders.length === 0) {
        adminOrderList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No orders found.</td></tr>';
        return;
    }

    adminOrderList.innerHTML = adminOrders.map(o => {
        let itemsHtml = '';
        try {
            const items = JSON.parse(o.items);
            itemsHtml = items.map(item => `<div>${item.quantity}x ${item.name}</div>`).join('');
        } catch (e) {
            itemsHtml = 'Error loading items';
        }

        const date = new Date(o.created_at).toLocaleString();

        return `
            <tr>
                <td>#${o.id}</td>
                <td>${date}</td>
                <td>
                    <div><i class="fas fa-phone"></i> ${o.customer_phone}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;"><i class="fas fa-map-marker-alt"></i> ${o.customer_address}</div>
                </td>
                <td>${itemsHtml}</td>
                <td style="color: var(--primary-color); font-weight: bold;">₹${o.total_amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

// Customers Logic
async function loadCustomers() {
    try {
        const response = await fetch('/api/admin/customers');
        adminCustomers = await response.json();
        renderAdminCustomers();
    } catch (err) {
        console.error('Error loading customers', err);
    }
}

function renderAdminCustomers() {
    const adminCustomerList = document.getElementById('admin-customer-list');
    if (!adminCustomerList) return;
    
    if (adminCustomers.length === 0) {
        adminCustomerList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No customers found.</td></tr>';
        return;
    }

    adminCustomerList.innerHTML = adminCustomers.map((c, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td><i class="fas fa-user" style="color: var(--primary-color); margin-right: 5px;"></i> ${c.name || 'N/A'}</td>
                <td><i class="fas fa-phone" style="color: var(--text-muted); margin-right: 5px;"></i> ${c.phone}</td>
            </tr>
        `;
    }).join('');
}

// Initial load
loadProducts();
