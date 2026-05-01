function showPopup(message, type) {
    const popup = document.getElementById('toast-popup');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    msgEl.textContent = message;
    popup.className = `toast-popup ${type}`;
    
    if (type === 'success') {
        iconEl.className = 'fas fa-check-circle';
    } else {
        iconEl.className = 'fas fa-exclamation-circle';
    }
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function switchTab(type, event) {
    // Update active tab button
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update form elements based on type
    const submitBtn = document.getElementById('submit-btn');
    const registerContainer = document.getElementById('register-container');
    const headerTitle = document.querySelector('.login-header h2');
    const headerDesc = document.querySelector('.login-header p');

    if (type === 'owner') {
        submitBtn.textContent = 'Sign In as Owner';
        registerContainer.style.display = 'none'; // Owners usually don't self-register via this page
        headerTitle.textContent = 'Owner Portal';
        headerDesc.textContent = 'Manage your store operations';
    } else {
        submitBtn.textContent = 'Sign In as Customer';
        registerContainer.style.display = 'block';
        headerTitle.textContent = 'Welcome Back';
        headerDesc.textContent = 'Sign in to your account';
    }
}

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const type = document.querySelector('.tab-btn.active').textContent.trim().toLowerCase();
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    if (phone.length !== 10) {
        showPopup("Please enter a valid 10-digit mobile number.", 'error');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, role: type })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showPopup(`Login successful! Welcome ${data.role}`, 'success');
            
            // Save user session
            localStorage.setItem('sarthak_user_phone', phone);
            localStorage.setItem('sarthak_user_role', data.role);
            
            setTimeout(() => {
                if (data.role === 'owner') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            showPopup(data.message || "Incorrect mobile number or password.", 'error');
        }
    } catch (err) {
        console.error('Login error:', err);
        showPopup('An error occurred. Please try again later.', 'error');
    }
});

// Registration is now handled in register.html via register.js
