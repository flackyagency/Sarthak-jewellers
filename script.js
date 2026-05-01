// State
let products = [];

// State
let cart = JSON.parse(localStorage.getItem('sarthak_cart')) || [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total-price');
const cartCountEls = document.querySelectorAll('.cart-count');
const navbar = document.querySelector('.navbar');
const searchInput = document.getElementById('search-input');

// Initialize
async function init() {
    await fetchProducts();
    renderProducts();
    updateCartUI();

    // Check user session
    const userPhone = localStorage.getItem('sarthak_user_phone');
    const userRole = localStorage.getItem('sarthak_user_role');
    const dashboardIcon = document.getElementById('dashboard-icon');
    const loginIcon = document.getElementById('login-icon');
    
    if (userPhone && userRole === 'customer') {
        if (dashboardIcon) dashboardIcon.style.display = 'inline-flex';
        // if (loginIcon) loginIcon.style.display = 'none'; // Optional: hide login icon
    } else if (userRole === 'owner') {
        if (dashboardIcon) {
            dashboardIcon.href = 'dashboard.html';
            dashboardIcon.style.display = 'inline-flex';
        }
    }

    // Event Listeners
    window.addEventListener('scroll', handleScroll);
    cartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Fetch Products from API
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            products = await response.json();
        } else {
            console.error('Failed to load products');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Render Products
function renderProducts(productsToRender = products) {
    if (!productGrid) return;
    
    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #a0a0a0;">No products found matching your search.</p>';
        return;
    }

    productGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">₹${product.price.toFixed(2)}</p>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

// Search Functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
    
    // Smooth scroll to collections section if not already there
    const collectionsSection = document.getElementById('collections');
    if (collectionsSection && window.scrollY < collectionsSection.offsetTop - 100) {
        collectionsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    renderProducts(filteredProducts);
}

// Navbar Scroll Effect
function handleScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Cart Functionality
function toggleCart(e) {
    if(e) e.preventDefault();
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('active');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    
    // Open cart automatically when item added
    if(!cartSidebar.classList.contains('open')) {
        toggleCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('sarthak_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEls.forEach(el => el.textContent = totalItems);

    // Update total price
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = `₹${totalPrice.toFixed(2)}`;

    // Render items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your bag is currently empty.</p>';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Checkout Logic
const checkoutBtn = document.querySelector('.checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const cancelCheckoutBtn = document.getElementById('cancel-checkout');
const checkoutForm = document.getElementById('checkout-form');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        toggleCart(); // Close cart
        if (checkoutModal) checkoutModal.style.display = 'block';
    });
}

if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
    });
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneInput = document.getElementById('checkout-phone');
        const phone = phoneInput ? phoneInput.value : localStorage.getItem('sarthak_user_phone');
        const address = document.getElementById('checkout-address').value;
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (phone.length !== 10) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    address,
                    total_amount: totalAmount,
                    items: cart
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                cart = [];
                saveCart();
                updateCartUI();
                checkoutModal.style.display = 'none';
                checkoutForm.reset();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Error placing order');
        }
    });
}

// Run init when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
