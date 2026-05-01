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

document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const phone = document.getElementById('phone').value;
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (phone.length !== 10) {
        showPopup("Please enter a valid 10-digit mobile number.", 'error');
        return;
    }

    if (password !== confirmPassword) {
        showPopup("Passwords do not match.", 'error');
        return;
    }

    if (password.length < 6) {
        showPopup("Password must be at least 6 characters long.", 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showPopup("Registration successful! Redirecting...", 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showPopup(data.message, 'error');
        }
    } catch (err) {
        console.error('Registration error:', err);
        showPopup('An error occurred. Please try again later.', 'error');
    }
});
